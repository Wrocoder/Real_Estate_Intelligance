import hashlib
import json
from dataclasses import dataclass
from datetime import date, datetime, time
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from domarion.db.models import (
    DataQualityLog,
    IngestionJob,
    ListingSnapshot,
    ListingSource,
    Property,
    PropertyDeduplicationMatch,
    PropertySource,
    RawListing,
)
from domarion.db.models import (
    ListingEvent as ListingEventRow,
)
from domarion.db.session import SessionLocal
from domarion.ingestion.partner_csv import PartnerListingRecord, read_partner_csv, slugify
from domarion.schemas import (
    DataQualityLogCreate,
    Listing,
    PriceHistoryPoint,
    PriceHistoryRebuildResult,
)
from domarion.services.listing_events import (
    REMOVED_STATUSES,
    ListingEventInput,
    derive_listing_events,
)
from domarion.services.price_history import listing_with_price_history_metrics

DEDUP_AREA_TOLERANCE_M2 = 1.0
DEDUP_AREA_TOLERANCE_RATIO = 0.02
DEDUP_COORDINATE_TOLERANCE_DEGREES = 0.0015
DEDUP_AUTO_MATCH_THRESHOLD = 95
DEDUP_REVIEW_THRESHOLD = 70
STREET_PREFIX_TOKENS = {"al", "aleja", "pl", "plac", "ul", "ulica"}


@dataclass(frozen=True)
class ImportResult:
    rows_seen: int = 0
    raw_created: int = 0
    raw_updated: int = 0
    properties_created: int = 0
    properties_updated: int = 0
    snapshots_created: int = 0
    snapshots_updated: int = 0
    removed_marked: int = 0

    def as_dict(self) -> dict[str, int]:
        return {
            "rows_seen": self.rows_seen,
            "raw_created": self.raw_created,
            "raw_updated": self.raw_updated,
            "properties_created": self.properties_created,
            "properties_updated": self.properties_updated,
            "snapshots_created": self.snapshots_created,
            "snapshots_updated": self.snapshots_updated,
        }


@dataclass(frozen=True)
class DeduplicationCandidateDecision:
    property_id: int
    decision: str
    match_score: int
    reasons: list[str]
    candidate_payload: dict


@dataclass(frozen=True)
class DeduplicationCandidateContext:
    source_names: tuple[str, ...] = ()
    source_listing_ids: tuple[str, ...] = ()
    latest_title: str | None = None
    latest_description_hash: str | None = None


def import_partner_csv(
    path: str,
    source_name: str,
    source_type: str = "partner_csv",
    *,
    mark_missing_removed: bool = False,
) -> ImportResult:
    records = read_partner_csv(
        path,
        default_source_name=source_name,
        default_source_type=source_type,
    )
    with SessionLocal() as session:
        job = _create_ingestion_job(
            session,
            source_name,
            source_type,
            path,
            mark_missing_removed=mark_missing_removed,
        )
        session.commit()

        try:
            _mark_ingestion_job_running(session, job.id)
            result = import_partner_records_in_session(
                session,
                records,
                job_id=job.id,
                mark_missing_removed=mark_missing_removed,
            )
            warnings_count = _write_data_quality_logs(session, job.id, records)
            _finish_ingestion_job(session, job.id, result, "succeeded", warnings_count)
            session.commit()
            return result
        except Exception as exc:
            session.rollback()
            _finish_failed_ingestion_job(session, job.id, exc)
            session.commit()
            raise


def import_partner_records_in_session(
    session: Session,
    records: list[PartnerListingRecord],
    job_id: str | None = None,
    *,
    mark_missing_removed: bool = False,
) -> ImportResult:
    result = ImportResult(rows_seen=len(records))
    source_listing_ids_by_source: dict[int, set[str]] = {}
    source_by_id: dict[int, ListingSource] = {}
    observed_at_by_source: dict[int, date] = {}

    for record in records:
        source = _get_or_create_source(session, record)
        source_by_id[source.id] = source
        source_listing_ids_by_source.setdefault(source.id, set()).add(record.source_listing_id)
        latest_observed_at = observed_at_by_source.get(source.id)
        if latest_observed_at is None or record.observed_at > latest_observed_at:
            observed_at_by_source[source.id] = record.observed_at
        raw_created = _upsert_raw_listing(session, source, record)
        property_source, property_created = _upsert_property_source(
            session,
            source,
            record,
            job_id=job_id,
        )
        snapshot_created, snapshot_updated = _upsert_snapshot(session, property_source, record)
        _refresh_price_history_metrics(session, property_source)

        result = ImportResult(
            rows_seen=result.rows_seen,
            raw_created=result.raw_created + int(raw_created),
            raw_updated=result.raw_updated + int(not raw_created),
            properties_created=result.properties_created + int(property_created),
            properties_updated=result.properties_updated + int(not property_created),
            snapshots_created=result.snapshots_created + int(snapshot_created),
            snapshots_updated=result.snapshots_updated + int(snapshot_updated),
            removed_marked=result.removed_marked,
        )

    if mark_missing_removed:
        for source_id, source_listing_ids in source_listing_ids_by_source.items():
            marked, snapshots_created, snapshots_updated = _mark_missing_source_listings_removed(
                session,
                source_by_id[source_id],
                source_listing_ids,
                observed_at=observed_at_by_source[source_id],
            )
            result = ImportResult(
                rows_seen=result.rows_seen,
                raw_created=result.raw_created,
                raw_updated=result.raw_updated,
                properties_created=result.properties_created,
                properties_updated=result.properties_updated,
                snapshots_created=result.snapshots_created + snapshots_created,
                snapshots_updated=result.snapshots_updated + snapshots_updated,
                removed_marked=result.removed_marked + marked,
            )

    return result


def rebuild_price_history_metrics_in_session(session: Session) -> PriceHistoryRebuildResult:
    property_sources = session.scalars(select(PropertySource).order_by(PropertySource.id)).all()
    snapshots_seen = 0
    snapshots_updated = 0
    listing_events_created = 0

    for property_source in property_sources:
        seen, updated, events_created = _refresh_price_history_metrics(session, property_source)
        snapshots_seen += seen
        snapshots_updated += updated
        listing_events_created += events_created

    return PriceHistoryRebuildResult(
        property_sources_seen=len(property_sources),
        snapshots_seen=snapshots_seen,
        snapshots_updated=snapshots_updated,
        listing_events_created=listing_events_created,
    )


def build_partner_quality_logs(
    job_id: str,
    records: list[PartnerListingRecord],
) -> list[DataQualityLogCreate]:
    logs = []
    for record in records:
        listing = record.listing
        missing_fields = [
            field
            for field in (
                "nearest_stop_m",
                "nearest_school_m",
                "nearest_major_road_m",
                "nearest_industrial_zone_m",
                "distance_to_center_km",
            )
            if not record.raw_payload.get(field)
        ]

        if listing.data_quality_score < 80 or missing_fields:
            logs.append(
                DataQualityLogCreate(
                    job_id=job_id,
                    source_name=record.source_name,
                    source_listing_id=record.source_listing_id,
                    severity="warning",
                    code=(
                        "low_data_quality"
                        if listing.data_quality_score < 80
                        else "missing_optional_fields"
                    ),
                    message=(
                        f"Data quality score is {listing.data_quality_score}/100."
                        if listing.data_quality_score < 80
                        else "Optional fields are missing in the source row."
                    ),
                    payload={
                        "data_quality_score": listing.data_quality_score,
                        "missing_fields": missing_fields,
                    },
                )
            )
    return logs


def payload_hash(payload: dict[str, str]) -> str:
    body = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


def _create_ingestion_job(
    session: Session,
    source_name: str,
    source_type: str,
    path: str,
    *,
    mark_missing_removed: bool = False,
) -> IngestionJob:
    now = datetime.utcnow()
    job = IngestionJob(
        id=str(uuid4()),
        source_name=source_name,
        source_type=source_type,
        status="queued",
        rows_seen=0,
        raw_created=0,
        raw_updated=0,
        properties_created=0,
        properties_updated=0,
        snapshots_created=0,
        snapshots_updated=0,
        errors_count=0,
        created_by="cli",
        notes=None,
        metadata_json={"path": path, "mark_missing_removed": mark_missing_removed},
        created_at=now,
        updated_at=now,
    )
    session.add(job)
    session.flush()
    return job


def _mark_ingestion_job_running(session: Session, job_id: str) -> None:
    job = session.get(IngestionJob, job_id)
    if job is None:
        return
    now = datetime.utcnow()
    job.status = "running"
    job.started_at = now
    job.updated_at = now
    session.flush()


def _finish_ingestion_job(
    session: Session,
    job_id: str,
    result: ImportResult,
    status: str,
    errors_count: int,
) -> None:
    job = session.get(IngestionJob, job_id)
    if job is None:
        return
    for key, value in result.as_dict().items():
        setattr(job, key, value)
    job.status = status
    job.errors_count = errors_count
    job.finished_at = datetime.utcnow()
    job.updated_at = datetime.utcnow()
    session.flush()


def _finish_failed_ingestion_job(session: Session, job_id: str, exc: Exception) -> None:
    job = session.get(IngestionJob, job_id)
    if job is None:
        return
    now = datetime.utcnow()
    job.status = "failed"
    job.errors_count = 1
    job.finished_at = now
    job.updated_at = now
    session.add(
        DataQualityLog(
            id=str(uuid4()),
            job_id=job_id,
            source_name=job.source_name,
            source_listing_id=None,
            severity="error",
            code="import_failed",
            message=str(exc),
            payload={"exception_type": type(exc).__name__},
            created_at=now,
        )
    )
    session.flush()


def _write_data_quality_logs(
    session: Session,
    job_id: str,
    records: list[PartnerListingRecord],
) -> int:
    logs = build_partner_quality_logs(job_id, records)
    for payload in logs:
        session.add(
            DataQualityLog(
                id=str(uuid4()),
                job_id=payload.job_id,
                source_name=payload.source_name,
                source_listing_id=payload.source_listing_id,
                severity=payload.severity,
                code=payload.code,
                message=payload.message,
                payload=payload.payload,
                created_at=datetime.utcnow(),
            )
        )
    session.flush()
    return len(logs)


def _get_or_create_source(session: Session, record: PartnerListingRecord) -> ListingSource:
    source = session.scalar(select(ListingSource).where(ListingSource.name == record.source_name))
    if source is not None:
        return source

    source = ListingSource(
        name=record.source_name,
        base_url=record.source_base_url,
        source_type=record.source_type,
    )
    session.add(source)
    session.flush()
    return source


def _upsert_raw_listing(
    session: Session,
    source: ListingSource,
    record: PartnerListingRecord,
) -> bool:
    raw_listing = session.scalar(
        select(RawListing).where(
            RawListing.source_id == source.id,
            RawListing.source_listing_id == record.source_listing_id,
        )
    )
    created = raw_listing is None
    if raw_listing is None:
        raw_listing = RawListing(
            source_id=source.id,
            source_listing_id=record.source_listing_id,
            source_url=record.source_url,
            payload_hash=payload_hash(record.raw_payload),
            raw_payload=record.raw_payload,
        )
        session.add(raw_listing)
    else:
        raw_listing.source_url = record.source_url
        raw_listing.fetched_at = datetime.utcnow()
        raw_listing.payload_hash = payload_hash(record.raw_payload)
        raw_listing.raw_payload = record.raw_payload

    session.flush()
    return created


def _upsert_property_source(
    session: Session,
    source: ListingSource,
    record: PartnerListingRecord,
    *,
    job_id: str | None,
) -> tuple[PropertySource, bool]:
    property_source = session.scalar(
        select(PropertySource).where(
            PropertySource.source_id == source.id,
            PropertySource.source_listing_id == record.source_listing_id,
        )
    )

    listing = record.listing
    if property_source is not None:
        _update_property_from_listing(property_source.property, listing)
        property_source.source_url = record.source_url
        property_source.last_seen_at = _date_to_datetime(listing.last_seen_at)
        property_source.active_status = _active_status_from_record(record)
        session.flush()
        return property_source, False

    property_, deduplication_decisions = _find_duplicate_property(session, record)
    if deduplication_decisions:
        _write_deduplication_decision(
            session,
            source,
            record,
            job_id=job_id,
            decision=deduplication_decisions[0],
        )
    property_created = property_ is None
    if property_ is None:
        property_ = Property()
        session.add(property_)
    _update_property_from_listing(property_, listing)
    session.flush()

    property_source = PropertySource(
        property_id=property_.id,
        source_id=source.id,
        source_listing_id=record.source_listing_id,
        source_url=record.source_url,
        first_seen_at=_date_to_datetime(listing.first_seen_at),
        last_seen_at=_date_to_datetime(listing.last_seen_at),
        active_status=_active_status_from_record(record),
    )
    session.add(property_source)
    session.flush()
    return property_source, property_created


def _find_duplicate_property(
    session: Session,
    record: PartnerListingRecord,
) -> tuple[Property | None, list[DeduplicationCandidateDecision]]:
    listing = record.listing
    candidates = session.scalars(
        select(Property).where(
            Property.city == listing.city,
            Property.district == listing.district,
        )
    ).all()
    decisions = sorted(
        [
            _evaluate_deduplication_candidate(
                candidate,
                listing,
                candidate_context=_dedup_context_for_property(session, candidate),
                incoming_description_hash=_description_hash_from_record(record),
                incoming_source_name=record.source_name,
                incoming_source_listing_id=record.source_listing_id,
            )
            for candidate in candidates
        ],
        key=lambda decision: (-decision.match_score, decision.property_id),
    )
    for decision in decisions:
        if decision.decision == "matched":
            matched_property = session.get(Property, decision.property_id)
            return matched_property, decisions[:1]
    return None, decisions[:1]


def _is_duplicate_property_match(property_: Property, listing: Listing) -> bool:
    return _evaluate_deduplication_candidate(property_, listing).decision == "matched"


def _evaluate_deduplication_candidate(
    property_: Property,
    listing: Listing,
    *,
    candidate_context: DeduplicationCandidateContext | None = None,
    incoming_description_hash: str | None = None,
    incoming_source_name: str | None = None,
    incoming_source_listing_id: str | None = None,
) -> DeduplicationCandidateDecision:
    score = 0
    reasons = []
    auto_match_blockers = []
    candidate_context = candidate_context or DeduplicationCandidateContext()

    def check(condition: bool, points: int, passed: str, failed: str) -> bool:
        nonlocal score
        if condition:
            score += points
            reasons.append(passed)
            return True
        reasons.append(failed)
        return False

    city_match = check(
        _same_dedup_text(property_.city, listing.city),
        15,
        "city matches",
        "city differs",
    )
    district_match = check(
        _same_dedup_text(property_.district, listing.district),
        15,
        "district matches",
        "district differs",
    )
    market_match = check(
        not property_.market_type or property_.market_type == listing.market_type,
        10,
        "market type matches",
        "market type differs",
    )
    rooms_match = check(
        property_.rooms == listing.rooms,
        10,
        "rooms match",
        "rooms differ",
    )
    address_match = check(
        _same_dedup_text(property_.canonical_address, listing.address),
        25,
        "address matches after normalization",
        "address differs after normalization",
    )
    area_match = check(
        _is_area_close(property_.area_m2, listing.area_m2),
        15,
        "area is within tolerance",
        "area differs beyond tolerance",
    )
    coordinate_match = check(
        _are_coordinates_close(property_.lat, property_.lon, listing.lat, listing.lon),
        10,
        "coordinates are within tolerance",
        "coordinates differ beyond tolerance",
    )
    _append_building_dedup_signals(
        property_,
        listing,
        reasons,
        auto_match_blockers,
    )
    _append_text_source_dedup_signals(
        listing,
        candidate_context,
        reasons,
        incoming_description_hash=incoming_description_hash,
        incoming_source_name=incoming_source_name,
        incoming_source_listing_id=incoming_source_listing_id,
    )

    strict_match = all(
        (
            city_match,
            district_match,
            market_match,
            rooms_match,
            address_match,
            area_match,
            coordinate_match,
        )
    )
    if strict_match and score >= DEDUP_AUTO_MATCH_THRESHOLD and not auto_match_blockers:
        decision = "matched"
    elif score >= DEDUP_REVIEW_THRESHOLD:
        decision = "review_required"
    else:
        decision = "rejected"

    return DeduplicationCandidateDecision(
        property_id=getattr(property_, "id", 0) or 0,
        decision=decision,
        match_score=score,
        reasons=[*reasons, *auto_match_blockers],
        candidate_payload=_property_dedup_payload(property_, candidate_context),
    )


def _append_building_dedup_signals(
    property_: Property,
    listing: Listing,
    reasons: list[str],
    auto_match_blockers: list[str],
) -> None:
    _append_optional_exact_signal(
        getattr(property_, "floor", None),
        listing.floor,
        "floor",
        reasons,
        auto_match_blockers,
    )
    _append_optional_exact_signal(
        getattr(property_, "building_floors", None),
        listing.building_floors,
        "building_floors",
        reasons,
        auto_match_blockers,
    )
    _append_optional_exact_signal(
        getattr(property_, "building_year", None),
        listing.building_year,
        "building_year",
        reasons,
        auto_match_blockers,
    )


def _append_optional_exact_signal(
    left,
    right,
    field_name: str,
    reasons: list[str],
    auto_match_blockers: list[str],
) -> None:
    if left is None or right is None:
        reasons.append(f"{field_name} unavailable for dedup v2")
        return
    if int(left) == int(right):
        reasons.append(f"{field_name} matches")
        return
    auto_match_blockers.append(f"{field_name} differs; requires dedup review")


def _append_text_source_dedup_signals(
    listing: Listing,
    candidate_context: DeduplicationCandidateContext,
    reasons: list[str],
    *,
    incoming_description_hash: str | None,
    incoming_source_name: str | None,
    incoming_source_listing_id: str | None,
) -> None:
    title_similarity = _title_similarity(candidate_context.latest_title, listing.title)
    if title_similarity is None:
        reasons.append("title text similarity unavailable")
    elif title_similarity >= 0.65:
        reasons.append(f"title text similarity is high ({title_similarity:.2f})")
    else:
        reasons.append(f"title text similarity is low ({title_similarity:.2f})")

    if incoming_description_hash and candidate_context.latest_description_hash:
        if incoming_description_hash == candidate_context.latest_description_hash:
            reasons.append("description hash matches")
        else:
            reasons.append("description hash differs")
    else:
        reasons.append("description hash unavailable for dedup v2")

    if incoming_source_name and incoming_source_name in candidate_context.source_names:
        reasons.append("candidate already has listing from the same source")
    elif incoming_source_name:
        reasons.append("candidate source set differs from incoming source")
    else:
        reasons.append("incoming source unavailable for dedup v2")

    if (
        incoming_source_listing_id
        and incoming_source_listing_id in candidate_context.source_listing_ids
    ):
        reasons.append("candidate already has same source listing id")


def _write_deduplication_decision(
    session: Session,
    source: ListingSource,
    record: PartnerListingRecord,
    *,
    job_id: str | None,
    decision: DeduplicationCandidateDecision,
) -> None:
    session.add(
        PropertyDeduplicationMatch(
            job_id=job_id,
            source_id=source.id,
            source_name=record.source_name,
            source_listing_id=record.source_listing_id,
            candidate_property_id=decision.property_id,
            matched_property_id=decision.property_id if decision.decision == "matched" else None,
            decision=decision.decision,
            review_status=(
                "open" if decision.decision == "review_required" else "auto_resolved"
            ),
            match_score=decision.match_score,
            reasons_json=decision.reasons,
            incoming_payload=_listing_dedup_payload(record),
            candidate_payload=decision.candidate_payload,
            created_at=datetime.utcnow(),
        )
    )
    session.flush()


def _upsert_snapshot(
    session: Session,
    property_source: PropertySource,
    record: PartnerListingRecord,
) -> tuple[bool, bool]:
    observed_at = _date_to_datetime(record.observed_at)
    snapshot = session.scalar(
        select(ListingSnapshot).where(
            ListingSnapshot.property_source_id == property_source.id,
            ListingSnapshot.observed_at == observed_at,
        )
    )

    created = snapshot is None
    if snapshot is None:
        snapshot = ListingSnapshot(property_source_id=property_source.id, observed_at=observed_at)
        session.add(snapshot)

    listing = record.listing
    snapshot.price = listing.price
    snapshot.currency = listing.currency
    snapshot.area_m2 = Decimal(str(listing.area_m2))
    snapshot.rooms = listing.rooms
    snapshot.title = listing.title
    snapshot.description_hash = _description_hash_from_record(record)
    snapshot.normalized_payload = _listing_snapshot_payload(record)
    session.flush()
    return created, not created


def _mark_missing_source_listings_removed(
    session: Session,
    source: ListingSource,
    imported_source_listing_ids: set[str],
    *,
    observed_at: date,
) -> tuple[int, int, int]:
    active_property_sources = session.scalars(
        select(PropertySource).where(
            PropertySource.source_id == source.id,
            PropertySource.active_status == "active",
        )
    ).all()

    removed_marked = 0
    snapshots_created = 0
    snapshots_updated = 0
    for property_source in active_property_sources:
        if property_source.source_listing_id in imported_source_listing_ids:
            continue
        created, updated = _upsert_removed_snapshot(session, property_source, observed_at)
        property_source.active_status = "removed"
        property_source.last_seen_at = _date_to_datetime(observed_at)
        _refresh_price_history_metrics(session, property_source)
        removed_marked += 1
        snapshots_created += int(created)
        snapshots_updated += int(updated)

    return removed_marked, snapshots_created, snapshots_updated


def _upsert_removed_snapshot(
    session: Session,
    property_source: PropertySource,
    observed_at: date,
) -> tuple[bool, bool]:
    latest_snapshot = session.scalar(
        select(ListingSnapshot)
        .where(ListingSnapshot.property_source_id == property_source.id)
        .order_by(ListingSnapshot.observed_at.desc(), ListingSnapshot.id.desc())
        .limit(1)
    )
    if latest_snapshot is None:
        return False, False

    observed_at_datetime = _removed_snapshot_observed_at(session, property_source, observed_at)
    snapshot = session.scalar(
        select(ListingSnapshot).where(
            ListingSnapshot.property_source_id == property_source.id,
            ListingSnapshot.observed_at == observed_at_datetime,
        )
    )
    created = snapshot is None
    if snapshot is None:
        snapshot = ListingSnapshot(
            property_source_id=property_source.id,
            observed_at=observed_at_datetime,
        )
        session.add(snapshot)

    payload = dict(latest_snapshot.normalized_payload)
    payload["active_status"] = "removed"
    payload["removal_reason"] = "missing_from_full_source_snapshot"
    payload["removed_observed_at"] = observed_at.isoformat()
    snapshot.price = latest_snapshot.price
    snapshot.currency = latest_snapshot.currency
    snapshot.area_m2 = latest_snapshot.area_m2
    snapshot.rooms = latest_snapshot.rooms
    snapshot.title = latest_snapshot.title
    snapshot.description_hash = latest_snapshot.description_hash
    snapshot.normalized_payload = payload
    session.flush()
    return created, not created


def _refresh_price_history_metrics(
    session: Session,
    property_source: PropertySource,
) -> tuple[int, int, int]:
    snapshots = session.scalars(
        select(ListingSnapshot)
        .where(ListingSnapshot.property_source_id == property_source.id)
        .order_by(ListingSnapshot.observed_at)
    ).all()
    if not snapshots:
        return 0, 0, 0

    history = [_snapshot_to_price_history_point(snapshot) for snapshot in snapshots]
    property_source.first_seen_at = _date_to_datetime(history[0].observed_at)
    property_source.last_seen_at = _date_to_datetime(history[-1].observed_at)

    updated = 0
    for index, snapshot in enumerate(snapshots):
        event_metadata = _event_metadata_from_payload(snapshot.normalized_payload)
        listing = Listing.model_validate(snapshot.normalized_payload)
        enriched_listing = listing_with_price_history_metrics(
            listing,
            history,
            current_index=index,
        )
        enriched_payload = enriched_listing.model_dump(mode="json")
        enriched_payload.update(event_metadata)
        if snapshot.normalized_payload != enriched_payload:
            snapshot.normalized_payload = enriched_payload
            updated += 1

    events_created = _rebuild_listing_events(session, property_source, snapshots)
    session.flush()
    return len(snapshots), updated, events_created


def _rebuild_listing_events(
    session: Session,
    property_source: PropertySource,
    snapshots: list[ListingSnapshot],
) -> int:
    session.execute(
        delete(ListingEventRow).where(
            ListingEventRow.property_source_id == property_source.id,
        )
    )
    events = derive_listing_events(
        [_snapshot_to_listing_event_input(snapshot) for snapshot in snapshots]
    )
    for event in events:
        session.add(
            ListingEventRow(
                property_source_id=property_source.id,
                listing_snapshot_id=event.snapshot_id,
                previous_snapshot_id=event.previous_snapshot_id,
                listing_id=event.listing_id,
                event_type=event.event_type,
                observed_at=_date_to_datetime(event.observed_at),
                summary=event.summary,
                event_payload=event.payload,
            )
        )
    return len(events)


def _snapshot_to_listing_event_input(snapshot: ListingSnapshot) -> ListingEventInput:
    point = _snapshot_to_price_history_point(snapshot)
    payload = snapshot.normalized_payload
    return ListingEventInput(
        listing_id=payload["id"],
        observed_at=point.observed_at,
        price=point.price,
        price_per_m2=point.price_per_m2,
        payload=payload,
        description_hash=snapshot.description_hash,
        snapshot_id=snapshot.id,
    )


def _snapshot_to_price_history_point(snapshot: ListingSnapshot) -> PriceHistoryPoint:
    payload = snapshot.normalized_payload
    area_m2 = float(snapshot.area_m2 or payload["area_m2"])
    return PriceHistoryPoint(
        observed_at=snapshot.observed_at.date(),
        price=snapshot.price,
        price_per_m2=int(round(snapshot.price / area_m2)),
    )


def _listing_snapshot_payload(record: PartnerListingRecord) -> dict:
    payload = record.listing.model_dump(mode="json")
    payload["active_status"] = _active_status_from_record(record)
    description_hash = _description_hash_from_record(record)
    if description_hash is not None:
        payload["description_hash"] = description_hash
    return payload


def _dedup_context_for_property(
    session: Session,
    property_: Property,
) -> DeduplicationCandidateContext:
    property_id = getattr(property_, "id", None)
    if property_id is None:
        return DeduplicationCandidateContext()

    property_sources = session.scalars(
        select(PropertySource).where(PropertySource.property_id == property_id)
    ).all()
    if not property_sources:
        return DeduplicationCandidateContext()

    source_ids = sorted({property_source.source_id for property_source in property_sources})
    sources = session.scalars(
        select(ListingSource).where(ListingSource.id.in_(source_ids))
    ).all()
    source_names_by_id = {source.id: source.name for source in sources}
    source_names = tuple(
        sorted(
            {
                source_names_by_id.get(property_source.source_id, "")
                for property_source in property_sources
                if source_names_by_id.get(property_source.source_id)
            }
        )
    )
    source_listing_ids = tuple(
        sorted({property_source.source_listing_id for property_source in property_sources})
    )
    latest_snapshot = session.scalar(
        select(ListingSnapshot)
        .where(
            ListingSnapshot.property_source_id.in_(
                [property_source.id for property_source in property_sources]
            )
        )
        .order_by(ListingSnapshot.observed_at.desc(), ListingSnapshot.id.desc())
        .limit(1)
    )
    if latest_snapshot is None:
        return DeduplicationCandidateContext(
            source_names=source_names,
            source_listing_ids=source_listing_ids,
        )
    return DeduplicationCandidateContext(
        source_names=source_names,
        source_listing_ids=source_listing_ids,
        latest_title=latest_snapshot.title,
        latest_description_hash=latest_snapshot.description_hash,
    )


def _event_metadata_from_payload(payload: dict) -> dict:
    metadata = {}
    for key in (
        "active_status",
        "status",
        "description_hash",
        "removal_reason",
        "removed_observed_at",
    ):
        if key in payload:
            metadata[key] = payload[key]
    return metadata


def _active_status_from_record(record: PartnerListingRecord) -> str:
    raw_status = record.raw_payload.get("active_status") or record.raw_payload.get("status")
    normalized = str(raw_status or "active").strip().casefold()
    if not normalized:
        return "active"
    if normalized in REMOVED_STATUSES:
        return "removed"
    if normalized in {"active", "available", "published", "live", "for_sale", "sale"}:
        return "active"
    return normalized


def _description_hash_from_record(record: PartnerListingRecord) -> str | None:
    for key in ("description_hash", "description_digest", "description_sha256"):
        raw_hash = record.raw_payload.get(key)
        if raw_hash:
            normalized_hash = str(raw_hash).strip()
            if normalized_hash:
                return normalized_hash

    description = record.raw_payload.get("description")
    if description is None or not description.strip():
        return None
    normalized_description = " ".join(description.split())
    return hashlib.sha256(normalized_description.encode("utf-8")).hexdigest()


def _removed_snapshot_observed_at(
    session: Session,
    property_source: PropertySource,
    observed_at: date,
) -> datetime:
    observed_at_datetime = _date_to_datetime(observed_at)
    existing = session.scalar(
        select(ListingSnapshot.id).where(
            ListingSnapshot.property_source_id == property_source.id,
            ListingSnapshot.observed_at == observed_at_datetime,
        )
    )
    if existing is None:
        return observed_at_datetime
    return datetime.combine(observed_at, time.max)


def _update_property_from_listing(property_: Property, listing: Listing) -> None:
    property_.canonical_address = listing.address
    property_.area_id = listing.area_id
    property_.voivodeship = listing.voivodeship
    property_.city = listing.city
    property_.district = listing.district
    property_.municipality = listing.municipality
    property_.market_type = listing.market_type
    property_.building_type = listing.building_type
    property_.renovation_state = listing.renovation_state
    property_.has_balcony = listing.has_balcony
    property_.has_terrace = listing.has_terrace
    property_.has_garden = listing.has_garden
    property_.has_elevator = listing.has_elevator
    property_.parking_type = listing.parking_type
    property_.heating_type = listing.heating_type
    property_.lat = Decimal(str(listing.lat))
    property_.lon = Decimal(str(listing.lon))
    property_.area_m2 = Decimal(str(listing.area_m2))
    property_.rooms = listing.rooms
    property_.floor = listing.floor
    property_.building_floors = listing.building_floors
    property_.building_year = listing.building_year
    property_.distance_to_center_km = Decimal(str(listing.distance_to_center_km))
    property_.nearest_stop_m = listing.nearest_stop_m
    property_.nearest_school_m = listing.nearest_school_m
    property_.nearest_major_road_m = listing.nearest_major_road_m
    property_.nearest_industrial_zone_m = listing.nearest_industrial_zone_m
    property_.parks_within_1km = listing.parks_within_1km
    property_.schools_within_1km = listing.schools_within_1km
    property_.planned_investments_within_2km = listing.planned_investments_within_2km
    property_.data_quality_score = listing.data_quality_score


def _listing_dedup_payload(record: PartnerListingRecord) -> dict[str, object]:
    listing = record.listing
    return {
        "listing_id": listing.id,
        "address": listing.address,
        "voivodeship": listing.voivodeship,
        "city": listing.city,
        "district": listing.district,
        "market_type": listing.market_type,
        "building_type": listing.building_type,
        "renovation_state": listing.renovation_state,
        "has_balcony": listing.has_balcony,
        "has_terrace": listing.has_terrace,
        "has_garden": listing.has_garden,
        "has_elevator": listing.has_elevator,
        "parking_type": listing.parking_type,
        "heating_type": listing.heating_type,
        "rooms": listing.rooms,
        "floor": listing.floor,
        "building_floors": listing.building_floors,
        "building_year": listing.building_year,
        "area_m2": listing.area_m2,
        "lat": listing.lat,
        "lon": listing.lon,
        "price": listing.price,
        "source_name": listing.source_name,
        "source_listing_id": record.source_listing_id,
        "description_hash": _description_hash_from_record(record),
        "photo_hashes_used": False,
    }


def _property_dedup_payload(
    property_: Property,
    candidate_context: DeduplicationCandidateContext | None = None,
) -> dict[str, object]:
    candidate_context = candidate_context or DeduplicationCandidateContext()
    return {
        "property_id": getattr(property_, "id", None),
        "address": property_.canonical_address,
        "voivodeship": getattr(property_, "voivodeship", None),
        "city": property_.city,
        "district": property_.district,
        "market_type": property_.market_type,
        "building_type": getattr(property_, "building_type", None),
        "renovation_state": getattr(property_, "renovation_state", None),
        "has_balcony": getattr(property_, "has_balcony", None),
        "has_terrace": getattr(property_, "has_terrace", None),
        "has_garden": getattr(property_, "has_garden", None),
        "has_elevator": getattr(property_, "has_elevator", None),
        "parking_type": getattr(property_, "parking_type", None),
        "heating_type": getattr(property_, "heating_type", None),
        "rooms": property_.rooms,
        "floor": getattr(property_, "floor", None),
        "building_floors": getattr(property_, "building_floors", None),
        "building_year": getattr(property_, "building_year", None),
        "area_m2": _optional_float_value(property_.area_m2),
        "lat": _optional_float_value(property_.lat),
        "lon": _optional_float_value(property_.lon),
        "source_names": list(candidate_context.source_names),
        "source_listing_ids": list(candidate_context.source_listing_ids),
        "latest_title": candidate_context.latest_title,
        "latest_description_hash": candidate_context.latest_description_hash,
        "photo_hashes_used": False,
    }


def _optional_float_value(value: Decimal | None) -> float | None:
    if value is None:
        return None
    return float(value)


def _date_to_datetime(value) -> datetime:
    return datetime.combine(value, time.min)


def _same_dedup_text(left: str | None, right: str | None) -> bool:
    return _dedup_text(left) == _dedup_text(right)


def _title_similarity(left: str | None, right: str | None) -> float | None:
    left_tokens = set(_dedup_text(left).split("-")) - {""}
    right_tokens = set(_dedup_text(right).split("-")) - {""}
    if not left_tokens or not right_tokens:
        return None
    overlap = len(left_tokens & right_tokens)
    return round(overlap / max(len(left_tokens), len(right_tokens)), 2)


def _dedup_text(value: str | None) -> str:
    if value is None:
        return ""
    tokens = [token for token in slugify(value).split("-") if token]
    if tokens and tokens[0] in STREET_PREFIX_TOKENS:
        tokens = tokens[1:]
    return "-".join(tokens)


def _is_area_close(left: Decimal | None, right: float) -> bool:
    if left is None:
        return False
    left_value = float(left)
    tolerance = max(DEDUP_AREA_TOLERANCE_M2, right * DEDUP_AREA_TOLERANCE_RATIO)
    return abs(left_value - right) <= tolerance


def _are_coordinates_close(
    left_lat: Decimal | None,
    left_lon: Decimal | None,
    right_lat: float,
    right_lon: float,
) -> bool:
    if left_lat is None or left_lon is None:
        return False
    return (
        abs(float(left_lat) - right_lat) <= DEDUP_COORDINATE_TOLERANCE_DEGREES
        and abs(float(left_lon) - right_lon) <= DEDUP_COORDINATE_TOLERANCE_DEGREES
    )
