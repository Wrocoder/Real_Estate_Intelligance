import hashlib
import json
from dataclasses import dataclass
from datetime import datetime, time
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from domarion.db.models import (
    DataQualityLog,
    IngestionJob,
    ListingSnapshot,
    ListingSource,
    Property,
    PropertySource,
    RawListing,
)
from domarion.db.session import SessionLocal
from domarion.ingestion.partner_csv import PartnerListingRecord, read_partner_csv
from domarion.schemas import Listing


@dataclass(frozen=True)
class ImportResult:
    rows_seen: int = 0
    raw_created: int = 0
    raw_updated: int = 0
    properties_created: int = 0
    properties_updated: int = 0
    snapshots_created: int = 0
    snapshots_updated: int = 0

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


def import_partner_csv(
    path: str,
    source_name: str,
    source_type: str = "partner_csv",
) -> ImportResult:
    records = read_partner_csv(
        path,
        default_source_name=source_name,
        default_source_type=source_type,
    )
    with SessionLocal() as session:
        job = _create_ingestion_job(session, source_name, source_type, path)
        session.commit()

        try:
            _mark_ingestion_job_running(session, job.id)
            result = import_partner_records_in_session(session, records)
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
) -> ImportResult:
    result = ImportResult(rows_seen=len(records))

    for record in records:
        source = _get_or_create_source(session, record)
        raw_created = _upsert_raw_listing(session, source, record)
        property_source, property_created = _upsert_property_source(session, source, record)
        snapshot_created, snapshot_updated = _upsert_snapshot(session, property_source, record)

        result = ImportResult(
            rows_seen=result.rows_seen,
            raw_created=result.raw_created + int(raw_created),
            raw_updated=result.raw_updated + int(not raw_created),
            properties_created=result.properties_created + int(property_created),
            properties_updated=result.properties_updated + int(not property_created),
            snapshots_created=result.snapshots_created + int(snapshot_created),
            snapshots_updated=result.snapshots_updated + int(snapshot_updated),
        )

    return result


def payload_hash(payload: dict[str, str]) -> str:
    body = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


def _create_ingestion_job(
    session: Session,
    source_name: str,
    source_type: str,
    path: str,
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
        metadata_json={"path": path},
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
    warnings_count = 0
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
            warnings_count += 1
            code = (
                "low_data_quality"
                if listing.data_quality_score < 80
                else "missing_optional_fields"
            )
            session.add(
                DataQualityLog(
                    id=str(uuid4()),
                    job_id=job_id,
                    source_name=record.source_name,
                    source_listing_id=record.source_listing_id,
                    severity="warning",
                    code=code,
                    message=(
                        f"Data quality score is {listing.data_quality_score}/100."
                        if listing.data_quality_score < 80
                        else "Optional fields are missing in the source row."
                    ),
                    payload={
                        "data_quality_score": listing.data_quality_score,
                        "missing_fields": missing_fields,
                    },
                    created_at=datetime.utcnow(),
                )
            )
    session.flush()
    return warnings_count


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
        session.flush()
        return property_source, False

    property_ = Property()
    _update_property_from_listing(property_, listing)
    session.add(property_)
    session.flush()

    property_source = PropertySource(
        property_id=property_.id,
        source_id=source.id,
        source_listing_id=record.source_listing_id,
        source_url=record.source_url,
        first_seen_at=_date_to_datetime(listing.first_seen_at),
        last_seen_at=_date_to_datetime(listing.last_seen_at),
        active_status="active",
    )
    session.add(property_source)
    session.flush()
    return property_source, True


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
    snapshot.description_hash = None
    snapshot.normalized_payload = listing.model_dump(mode="json")
    session.flush()
    return created, not created


def _update_property_from_listing(property_: Property, listing: Listing) -> None:
    property_.canonical_address = listing.address
    property_.area_id = listing.area_id
    property_.city = listing.city
    property_.district = listing.district
    property_.municipality = listing.municipality
    property_.market_type = listing.market_type
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


def _date_to_datetime(value) -> datetime:
    return datetime.combine(value, time.min)
