"""Import apartment transactions from an approved RCN/GUGiK export or WFS.

RCN observations are deliberately kept outside the listing history model. An
RCN row is a transaction fact with a transaction date; it is not an asking
price and must not become a ``ListingSnapshot``.
"""

from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal, InvalidOperation
from hashlib import sha256
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, parse_qsl, urlencode, urlparse, urlunparse
from urllib.request import Request, urlopen
from uuid import uuid4
from xml.etree import ElementTree

from sqlalchemy import select
from sqlalchemy.orm import Session

from domarion.db.models import (
    DataQualityLog,
    IngestionJob,
    ListingSource,
    TransactionObservation,
)
from domarion.ingestion.district_boundaries import assign_transaction_districts
from domarion.ingestion.partner_csv import slugify
from domarion.ingestion.rcn_poland import POLISH_VOIVODESHIPS, voivodeship_for_teryt
from domarion.location_names import clean_locality
from domarion.services.market_metrics import refresh_market_metrics
from domarion.services.transaction_quality import price_exclusion_reason
from domarion.services.transaction_versions import transaction_identity
from domarion.teryt_registry import canonical_locality

MAX_RCN_RESPONSE_BYTES = 25_000_000
DEFAULT_RCN_TIMEOUT_SECONDS = 30.0
DEFAULT_RCN_MAX_PAGES = 500
DEFAULT_RCN_PAGE_SIZE = 1_000
DEFAULT_RCN_SORT_BY = "tran_lokalny_id_iip A,lok_id_lokalu A,tran_wersja_id A"
EARLIEST_RCN_TRANSACTION_DATE = datetime(1900, 1, 1)
MAX_RCN_AREA_M2 = Decimal("999999.99")
ALLOWED_RCN_METHODS = {
    "rcn_wfs",
    "authorized_api",
    "authorized_feed",
    "open_data_import",
    "admin_file_upload",
}
ALLOWED_MARKET_USES = {"analytics", "market_metrics", "reports", "price_history"}
PROHIBITED_KEYS = {
    "seller_name",
    "buyer_name",
    "owner_name",
    "phone",
    "email",
    "contact",
    "contacts",
}


class RcnTransactionError(ValueError):
    pass


@dataclass(frozen=True)
class RcnTransactionRecord:
    source_observation_id: str
    logical_transaction_id: str
    source_url: str | None
    source_namespace: str | None
    source_version: str | None
    teryt: str | None
    transaction_date: datetime
    observed_at: datetime
    city: str
    district: str | None
    area_id: str
    municipality: str | None
    address: str | None
    property_type: str | None
    property_right: str | None
    transaction_type: str | None
    market_type: str | None
    property_price_gross: int
    transaction_price_gross: int | None
    vat_amount: int | None
    price_basis: str
    currency: str
    area_m2: Decimal
    price_per_m2: Decimal
    rooms: int | None
    floor: int | None
    ancillary_area_m2: Decimal | None
    lat: Decimal | None
    lon: Decimal | None
    geometry_x: Decimal | None
    geometry_y: Decimal | None
    geometry_crs: str | None
    data_quality_score: int
    normalized_payload: dict[str, object]


@dataclass(frozen=True)
class RcnImportResult:
    source_name: str
    rows_seen: int
    rows_accepted: int
    rows_rejected: int
    dry_run: bool
    transactions_created: int = 0
    transactions_changed: int = 0
    transactions_reconfirmed: int = 0
    districts_assigned: int = 0
    district_assignments_reset: int = 0
    transactions_with_unresolved_district: int = 0
    market_metrics: dict[str, object] | None = None
    rejected_rows: tuple[dict[str, object], ...] = ()
    rejection_reason_counts: dict[str, int] | None = None
    accepted_snapshot_fingerprint: str | None = None
    latest_source_version: str | None = None
    latest_transaction_date: str | None = None

    def as_dict(self) -> dict[str, object]:
        return {
            "source_name": self.source_name,
            "rows_seen": self.rows_seen,
            "rows_accepted": self.rows_accepted,
            "rows_rejected": self.rows_rejected,
            "dry_run": self.dry_run,
            "transactions_created": self.transactions_created,
            "transactions_changed": self.transactions_changed,
            "transactions_reconfirmed": self.transactions_reconfirmed,
            "districts_assigned": self.districts_assigned,
            "district_assignments_reset": self.district_assignments_reset,
            "transactions_with_unresolved_district": self.transactions_with_unresolved_district,
            "market_metrics": self.market_metrics,
            "rejected_rows": list(self.rejected_rows),
            "rejection_reason_counts": self.rejection_reason_counts or {},
            "accepted_snapshot_fingerprint": self.accepted_snapshot_fingerprint,
            "latest_source_version": self.latest_source_version,
            "latest_transaction_date": self.latest_transaction_date,
        }


def load_rcn_features(
    location: str | Path,
    *,
    timeout_seconds: float = DEFAULT_RCN_TIMEOUT_SECONDS,
    max_bytes: int = MAX_RCN_RESPONSE_BYTES,
    max_pages: int = DEFAULT_RCN_MAX_PAGES,
) -> list[dict[str, object]]:
    """Load GeoJSON or GML records, following only bounded WFS ``next`` links."""

    location_text = str(location)
    parsed = urlparse(location_text)
    if parsed.scheme in {"http", "https"}:
        has_bbox = any(key.casefold() == "bbox" for key in parse_qs(parsed.query))
        if not has_bbox and _teryt_prefix_from_url(location_text) is None:
            raise RcnTransactionError(
                "Remote RCN WFS URL must contain an explicit bbox or a bounded TERYT filter."
            )
        features: list[dict[str, object]] = []
        next_url: str | None = _prepare_wfs_url(location_text)
        total_bytes = 0
        for _ in range(max_pages):
            if next_url is None:
                return features
            body = _fetch(next_url, timeout_seconds=timeout_seconds, max_bytes=max_bytes)
            total_bytes += len(body)
            if total_bytes > max_bytes * max_pages:
                raise RcnTransactionError("RCN WFS transfer exceeds the safety limit.")
            current_url = next_url
            page_features, provider_next_url = _parse_response(body, current_url)
            features.extend(page_features)
            next_url = provider_next_url or _next_start_index_url(
                current_url,
                returned_count=len(page_features),
            )
            if next_url is None:
                return features
        raise RcnTransactionError(f"RCN WFS exceeded the {max_pages} page safety limit.")

    try:
        body = Path(location_text).read_bytes()
    except OSError as exc:
        raise RcnTransactionError(f"RCN file could not be read: {exc}") from exc
    if len(body) > max_bytes:
        raise RcnTransactionError(f"RCN file exceeds the {max_bytes} byte safety limit.")
    features, _ = _parse_response(body, location_text)
    return features


def normalize_rcn_feature(
    feature: object,
    *,
    row_number: int,
    source_name: str,
    source_url: str | None,
    observed_at: datetime | None = None,
    expected_teryt_prefix: str | None = None,
) -> RcnTransactionRecord:
    if not isinstance(feature, dict):
        raise RcnTransactionError(f"Row {row_number}: RCN feature must be an object.")
    keys = {str(key).casefold() for key in feature}
    if PROHIBITED_KEYS.intersection(keys):
        raise RcnTransactionError(
            f"Row {row_number}: personal contact/name fields are not accepted in RCN data."
        )

    row = {str(key): value for key, value in feature.items()}
    source_id = _first(row, "source_observation_id", "tran_lokalny_id_iip", "feature_id", "id")
    local_id = _first(row, "tran_lokalny_id_iip", "lok_id_lokalu")
    namespace = _text(_first(row, "source_namespace", "tran_przestrzen_nazw"))
    version = _text(_first(row, "source_version", "tran_wersja_id"))
    if not source_id:
        raise RcnTransactionError(f"Row {row_number}: transaction identifier is required.")
    if version and local_id:
        source_id = f"{namespace or 'rcn'}:{local_id}:{version}"
    source_id = str(source_id)[:180]

    teryt = _text(_first(row, "teryt"))
    voivodeship = voivodeship_for_teryt(teryt)
    if voivodeship is None:
        raise RcnTransactionError(f"Row {row_number}: a valid Polish TERYT code is required.")
    if expected_teryt_prefix and not teryt.startswith(expected_teryt_prefix):
        raise RcnTransactionError(
            f"Row {row_number}: TERYT code is outside the requested regional scope."
        )

    address = _text(_first(row, "address", "lok_adres"))
    city = _canonical_city_name(
        _text(_first(row, "city")) or _city_from_rcn_address(address),
        teryt=teryt,
    )
    if not city:
        raise RcnTransactionError(f"Row {row_number}: transaction locality is required.")
    if expected_teryt_prefix is None and slugify(city) != "wroclaw":
        raise RcnTransactionError(f"Row {row_number}: only Wrocław transactions are accepted.")
    if len(city) > 80:
        raise RcnTransactionError(f"Row {row_number}: transaction locality is too long.")
    district = _text(_first(row, "district"))
    locality_area_id = (
        "wroclaw-city"
        if slugify(city) == "wroclaw"
        else f"rcn-{teryt}-{slugify(city)}-city"
    )
    default_area_id = (
        locality_area_id
        if slugify(city) == "wroclaw" and not district
        else slugify(f"{city}-{district}")
        if district
        else locality_area_id
    )
    area_id = _text(_first(row, "area_id")) or default_area_id

    property_type = _text(_first(row, "property_type", "nier_rodzaj"))
    function = _text(_first(row, "lok_funkcja"))
    if function and "mieszkal" not in slugify(function):
        raise RcnTransactionError(f"Row {row_number}: non-residential RCN feature rejected.")

    transaction_date = _parse_datetime(
        _first(row, "transaction_date", "dok_data"), row_number, "transaction date"
    )
    captured_at = observed_at or datetime.now(UTC).replace(tzinfo=None)
    if captured_at.tzinfo is not None:
        captured_at = captured_at.astimezone(UTC).replace(tzinfo=None)
    if (
        transaction_date < EARLIEST_RCN_TRANSACTION_DATE
        or transaction_date > captured_at + timedelta(days=1)
    ):
        raise RcnTransactionError(
            f"Row {row_number}: transaction date is outside the supported range."
        )
    area_m2 = _decimal(
        _first(row, "area_m2", "lok_pow_uzyt"), row_number, "usable area", positive=True
    )
    if area_m2 > MAX_RCN_AREA_M2:
        raise RcnTransactionError(
            f"Row {row_number}: usable area is outside the supported range."
        )
    ancillary_area = _decimal_or_none(_first(row, "ancillary_area_m2", "lok_pow_przyn"))
    if ancillary_area is not None and not 0 <= ancillary_area <= MAX_RCN_AREA_M2:
        raise RcnTransactionError(
            f"Row {row_number}: ancillary area is outside the supported range."
        )
    local_price = _money(_first(row, "property_price_gross", "lok_cena_brutto"))
    property_price = local_price or _money(_first(row, "nier_cena_brutto"))
    transaction_price = _money(_first(row, "transaction_price_gross", "tran_cena_brutto"))
    if property_price is None:
        property_price = transaction_price
    if property_price is None or property_price <= 0:
        raise RcnTransactionError(f"Row {row_number}: a positive transaction price is required.")
    price_basis = (
        "local"
        if local_price
        else "property"
        if _money(_first(row, "nier_cena_brutto"))
        else "transaction"
    )

    geometry_x = _decimal_or_none(_first(row, "geometry_x", "_geometry_x"))
    geometry_y = _decimal_or_none(_first(row, "geometry_y", "_geometry_y"))
    geometry_crs = _text(_first(row, "geometry_crs", "_geometry_crs"))
    lat = _decimal_or_none(_first(row, "lat"))
    lon = _decimal_or_none(_first(row, "lon"))
    quality = 95
    if not district:
        quality -= 10
    if not address:
        quality -= 5
    if lat is None and geometry_x is None:
        quality -= 10
    exclusion = price_exclusion_reason(Decimal(property_price) / area_m2, transaction_date)
    if exclusion:
        quality = 0

    payload = {
        "source_name": source_name,
        "source_observation_id": source_id,
        "source_namespace": namespace,
        "source_version": version,
        "teryt": teryt,
        "voivodeship": voivodeship,
        "transaction_date": transaction_date.isoformat(),
        "city": city,
        "district": district,
        "area_id": area_id,
        "locality_area_id": locality_area_id,
        "address": address,
        "property_type": property_type,
        "property_right": _text(_first(row, "property_right", "nier_prawo")),
        "transaction_type": _text(_first(row, "transaction_type", "tran_rodzaj_trans")),
        "market_type": _market_type(_first(row, "market_type", "tran_rodzaj_rynku")),
        "property_price_gross": property_price,
        "transaction_price_gross": transaction_price,
        "vat_amount": _money(_first(row, "vat_amount", "lok_vat", "tran_vat")),
        "price_basis": price_basis,
        "currency": _text(_first(row, "currency")) or "PLN",
        "area_m2": float(area_m2),
        "price_per_m2": float(Decimal(property_price) / area_m2),
        "rooms": _integer_or_none(_first(row, "rooms", "lok_liczba_izb")),
        "floor": _integer_or_none(_first(row, "floor", "lok_nr_kond")),
        "ancillary_area_m2": float(ancillary_area) if ancillary_area is not None else None,
        "lat": float(lat) if lat is not None else None,
        "lon": float(lon) if lon is not None else None,
        "geometry_x": float(geometry_x) if geometry_x is not None else None,
        "geometry_y": float(geometry_y) if geometry_y is not None else None,
        "geometry_crs": geometry_crs,
        "observed_at": captured_at.isoformat(),
    }
    if exclusion:
        payload["analytics_exclusion_reason"] = exclusion
    return RcnTransactionRecord(
        source_observation_id=source_id,
        logical_transaction_id=transaction_identity(source_id, version),
        source_url=source_url,
        source_namespace=namespace,
        source_version=version,
        teryt=teryt,
        transaction_date=transaction_date,
        observed_at=captured_at,
        city=city,
        district=district,
        area_id=area_id,
        municipality=_text(_first(row, "municipality")) or city,
        address=address,
        property_type=property_type,
        property_right=_text(_first(row, "property_right", "nier_prawo")),
        transaction_type=_text(_first(row, "transaction_type", "tran_rodzaj_trans")),
        market_type=_market_type(_first(row, "market_type", "tran_rodzaj_rynku")),
        property_price_gross=property_price,
        transaction_price_gross=transaction_price,
        vat_amount=_money(_first(row, "vat_amount", "lok_vat", "tran_vat")),
        price_basis=price_basis,
        currency=_text(_first(row, "currency")) or "PLN",
        area_m2=area_m2,
        price_per_m2=Decimal(property_price) / area_m2,
        rooms=_integer_or_none(_first(row, "rooms", "lok_liczba_izb")),
        floor=_integer_or_none(_first(row, "floor", "lok_nr_kond")),
        ancillary_area_m2=ancillary_area,
        lat=lat,
        lon=lon,
        geometry_x=geometry_x,
        geometry_y=geometry_y,
        geometry_crs=geometry_crs,
        data_quality_score=max(0, quality),
        normalized_payload=payload,
    )


def import_rcn_transactions(
    session: Session,
    location: str | Path,
    *,
    source_name: str,
    dry_run: bool = False,
    max_rows: int = 100_000,
    timeout_seconds: float = DEFAULT_RCN_TIMEOUT_SECONDS,
    max_pages: int = DEFAULT_RCN_MAX_PAGES,
    expected_teryt_prefix: str | None = None,
    metrics_refresh_since: datetime | None = None,
) -> RcnImportResult:
    source = session.scalar(select(ListingSource).where(ListingSource.name == source_name))
    _assert_source_is_approved(source)
    if urlparse(str(location)).scheme in {"http", "https"}:
        _assert_url_scope(source, str(location))
    url_teryt_prefix = _teryt_prefix_from_url(str(location))
    if expected_teryt_prefix and url_teryt_prefix != expected_teryt_prefix:
        raise RcnTransactionError("RCN URL TERYT filter does not match the requested region.")
    regional_prefix = expected_teryt_prefix or url_teryt_prefix
    features = load_rcn_features(
        location,
        timeout_seconds=timeout_seconds,
        max_pages=max_pages,
    )
    if len(features) > max_rows:
        raise RcnTransactionError(f"RCN input exceeds the {max_rows} row safety limit.")

    records: list[RcnTransactionRecord] = []
    rejected: list[dict[str, object]] = []
    rejection_reason_counts: Counter[str] = Counter()
    rejection_sample_rows: defaultdict[str, list[int]] = defaultdict(list)
    seen_ids: set[str] = set()
    for row_number, feature in enumerate(features, start=1):
        try:
            record = normalize_rcn_feature(
                feature,
                row_number=row_number,
                source_name=source_name,
                source_url=source.base_url,
                expected_teryt_prefix=regional_prefix,
            )
            if record.source_observation_id in seen_ids:
                raise RcnTransactionError(f"Row {row_number}: duplicate transaction identifier.")
            seen_ids.add(record.source_observation_id)
            records.append(record)
        except RcnTransactionError as exc:
            message = str(exc)
            rejected.append({"row": row_number, "message": message})
            reason = re.sub(r"^Row \d+:\s*", "", message)
            rejection_reason_counts[reason] += 1
            if len(rejection_sample_rows[reason]) < 10:
                rejection_sample_rows[reason].append(row_number)

    fingerprint_rows = []
    for record in records:
        stable_payload = dict(record.normalized_payload)
        stable_payload.pop("observed_at", None)
        fingerprint_rows.append(
            json.dumps(stable_payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        )
    snapshot_fingerprint = (
        sha256("\n".join(sorted(fingerprint_rows)).encode("utf-8")).hexdigest()
        if fingerprint_rows
        else None
    )
    latest_source_version = max(
        (record.source_version for record in records if record.source_version),
        default=None,
    )
    latest_transaction_date = max(
        (record.transaction_date for record in records),
        default=None,
    )
    rejection_counts = dict(rejection_reason_counts.most_common())

    if dry_run:
        return RcnImportResult(
            source_name=source_name,
            rows_seen=len(features),
            rows_accepted=len(records),
            rows_rejected=len(rejected),
            dry_run=True,
            rejected_rows=tuple(rejected[:100]),
            rejection_reason_counts=rejection_counts,
            accepted_snapshot_fingerprint=snapshot_fingerprint,
            latest_source_version=latest_source_version,
            latest_transaction_date=(
                latest_transaction_date.date().isoformat() if latest_transaction_date else None
            ),
        )

    now = datetime.now(UTC).replace(tzinfo=None)
    job = IngestionJob(
        id=str(uuid4()),
        source_name=source_name,
        source_type=source.source_type,
        status="running",
        created_by="rcn_transaction_cli",
        notes="Approved RCN transaction import; separate from listing snapshots.",
        metadata_json={
            "location_type": "url" if urlparse(str(location)).scheme else "file",
            "rows_accepted": len(records),
            "rows_rejected": len(rejected),
            "record_type": "transaction_observation",
            "rejection_reason_counts": rejection_counts,
            "accepted_snapshot_fingerprint": snapshot_fingerprint,
            "latest_source_version": latest_source_version,
            "latest_transaction_date": (
                latest_transaction_date.date().isoformat() if latest_transaction_date else None
            ),
            "teryt_prefix": regional_prefix,
            "voivodeship": POLISH_VOIVODESHIPS.get(regional_prefix or ""),
        },
        started_at=now,
        created_at=now,
        updated_at=now,
    )
    session.add(job)
    session.flush()
    for reason, count in rejection_reason_counts.most_common():
        session.add(
            DataQualityLog(
                id=str(uuid4()),
                job_id=job.id,
                source_name=source_name,
                source_listing_id=None,
                severity="error",
                code="rcn_row_rejected",
                message=f"{count} RCN source rows rejected: {reason}",
                payload={
                    "reason": reason,
                    "count": count,
                    "sample_rows": rejection_sample_rows[reason],
                },
                created_at=now,
            )
        )

    incoming_logical_ids = {record.logical_transaction_id for record in records}
    existing_rows = []
    logical_id_list = sorted(incoming_logical_ids)
    for start in range(0, len(logical_id_list), 10_000):
        existing_rows.extend(
            session.scalars(
                select(TransactionObservation).where(
                    TransactionObservation.source_id == source.id,
                    TransactionObservation.logical_transaction_id.in_(
                        logical_id_list[start : start + 10_000]
                    ),
                )
            ).all()
        )
    existing_by_observation_id = {row.source_observation_id: row for row in existing_rows}
    known_transaction_ids = {
        transaction_identity(row.source_observation_id, row.source_version) for row in existing_rows
    }
    created = changed = reconfirmed = 0
    affected_market_scopes: set[tuple[str, str]] = set()
    for record in records:
        row = existing_by_observation_id.get(record.source_observation_id)
        transaction_id = transaction_identity(
            record.source_observation_id,
            record.source_version,
        )
        if row is None:
            row = TransactionObservation(
                source_id=source.id,
                source_observation_id=record.source_observation_id,
                logical_transaction_id=record.logical_transaction_id,
                created_at=record.observed_at,
            )
            session.add(row)
            existing_by_observation_id[record.source_observation_id] = row
            if transaction_id in known_transaction_ids:
                changed += 1
            else:
                created += 1
                known_transaction_ids.add(transaction_id)
            affected_market_scopes.add((record.city, record.area_id))
        else:
            reconfirmed += 1
        _copy_record(row, record, ingestion_job_id=job.id)
    if metrics_refresh_since is not None:
        affected_market_scopes.update(
            _scopes_crossing_market_window(
                session,
                source_id=source.id,
                previous_refresh_at=metrics_refresh_since,
                refresh_at=now,
            )
        )
    job.rows_seen = len(features)
    job.errors_count = len(rejected)
    job.status = "succeeded"
    job.finished_at = datetime.now(UTC).replace(tzinfo=None)
    job.updated_at = job.finished_at
    session.flush()
    district_assignment = assign_transaction_districts(
        session,
        cities={record.city for record in records},
    )
    affected_market_scopes.update(
        (str(city), str(area_id))
        for city, area_id in district_assignment.get("affected_scopes", [])
    )
    if regional_prefix in {None, "02"}:
        affected_market_scopes.add(("Wrocław", "wroclaw-city"))
    session.expire_all()
    metric_refresh_scopes = {
        (city, None if city == "Wrocław" else area_id)
        for city, area_id in affected_market_scopes
    }
    metric_results = [
        refresh_market_metrics(
            session,
            city=city,
            transaction_area_id=area_id,
        )
        for city, area_id in sorted(
            metric_refresh_scopes,
            key=lambda scope: (scope[0], scope[1] or ""),
        )
    ]
    metrics = {
        "cities_updated": len(metric_results),
        "areas_updated": sum(int(item.get("areas_updated", 0)) for item in metric_results),
        "transaction_observations": sum(
            int(item.get("transaction_observations", 0)) for item in metric_results
        ),
    }
    return RcnImportResult(
        source_name=source_name,
        rows_seen=len(features),
        rows_accepted=len(records),
        rows_rejected=len(rejected),
        dry_run=False,
        transactions_created=created,
        transactions_changed=changed,
        transactions_reconfirmed=reconfirmed,
        districts_assigned=int(district_assignment["matched"]),
        district_assignments_reset=int(district_assignment["reset"]),
        transactions_with_unresolved_district=int(district_assignment["unresolved"]),
        market_metrics=metrics,
        rejected_rows=tuple(rejected[:100]),
        rejection_reason_counts=rejection_counts,
        accepted_snapshot_fingerprint=snapshot_fingerprint,
        latest_source_version=latest_source_version,
        latest_transaction_date=(
            latest_transaction_date.date().isoformat() if latest_transaction_date else None
        ),
    )


def _scopes_crossing_market_window(
    session: Session,
    *,
    source_id: int,
    previous_refresh_at: datetime,
    refresh_at: datetime,
) -> set[tuple[str, str]]:
    previous_cutoff = previous_refresh_at - timedelta(days=365)
    current_cutoff = refresh_at - timedelta(days=365)
    if current_cutoff <= previous_cutoff:
        return set()
    rows = session.execute(
        select(TransactionObservation.city, TransactionObservation.area_id)
        .where(
            TransactionObservation.source_id == source_id,
            TransactionObservation.transaction_date >= previous_cutoff,
            TransactionObservation.transaction_date < current_cutoff,
            TransactionObservation.area_id.is_not(None),
        )
        .distinct()
    ).all()
    return {(str(city), str(area_id)) for city, area_id in rows}


def rcn_import_is_due(
    session: Session,
    *,
    source_name: str,
    interval_seconds: int = 86_400,
    now: datetime | None = None,
) -> bool:
    """Persist the daily cadence in ingestion history, not worker memory."""

    latest = session.scalar(
        select(IngestionJob)
        .where(
            IngestionJob.source_name == source_name,
            IngestionJob.source_type == "transaction_register",
            IngestionJob.status == "succeeded",
        )
        .order_by(IngestionJob.finished_at.desc())
        .limit(1)
    )
    if latest is None or latest.finished_at is None:
        return True
    current = now or datetime.now(UTC).replace(tzinfo=None)
    finished_at = latest.finished_at.replace(tzinfo=None)
    return current - finished_at >= timedelta(seconds=max(interval_seconds, 60))


def _copy_record(
    row: TransactionObservation,
    record: RcnTransactionRecord,
    *,
    ingestion_job_id: str,
) -> None:
    preserve_spatial_assignment = (
        record.district is None
        and getattr(row, "district", None) is not None
        and getattr(row, "geometry_x", None) == record.geometry_x
        and getattr(row, "geometry_y", None) == record.geometry_y
    )
    previous_district = getattr(row, "district", None)
    previous_area_id = getattr(row, "area_id", None)
    previous_payload = dict(getattr(row, "normalized_payload", {}) or {})
    for field in (
        "source_url",
        "logical_transaction_id",
        "source_namespace",
        "source_version",
        "teryt",
        "transaction_date",
        "observed_at",
        "city",
        "district",
        "area_id",
        "municipality",
        "address",
        "property_type",
        "property_right",
        "transaction_type",
        "market_type",
        "property_price_gross",
        "transaction_price_gross",
        "vat_amount",
        "price_basis",
        "currency",
        "area_m2",
        "price_per_m2",
        "rooms",
        "floor",
        "ancillary_area_m2",
        "lat",
        "lon",
        "geometry_x",
        "geometry_y",
        "geometry_crs",
        "data_quality_score",
        "normalized_payload",
    ):
        setattr(row, field, getattr(record, field))
    if preserve_spatial_assignment:
        row.district = previous_district
        row.area_id = previous_area_id
        for key in (
            "district",
            "area_id",
            "district_assignment_source",
            "district_assignment_source_url",
        ):
            if key in previous_payload:
                row.normalized_payload[key] = previous_payload[key]
    row.ingestion_job_id = ingestion_job_id
    row.updated_at = record.observed_at


def _assert_source_is_approved(source: ListingSource | None) -> None:
    if source is None:
        raise RcnTransactionError("RCN source is not registered in listing_sources.")
    if source.is_demo or not source.is_active or source.legal_status != "approved":
        raise RcnTransactionError(f"Source '{source.name}' is not approved for RCN ingestion.")
    if source.ingestion_method not in ALLOWED_RCN_METHODS:
        raise RcnTransactionError(
            f"Source '{source.name}' must use an approved RCN/open-data ingestion method."
        )
    if not set(source.allowed_use_json or []).intersection(ALLOWED_MARKET_USES):
        raise RcnTransactionError(f"Source '{source.name}' is not approved for market reports.")


def _assert_url_scope(source: ListingSource, location: str) -> None:
    if not source.base_url:
        raise RcnTransactionError("Remote RCN import requires source.base_url scope.")
    registered = urlparse(source.base_url)
    requested = urlparse(location)
    if (registered.hostname or "").casefold() != (requested.hostname or "").casefold():
        raise RcnTransactionError("RCN URL is outside the registered source domain scope.")


def _prepare_wfs_url(url: str) -> str:
    parsed = urlparse(url)
    query = parse_qsl(parsed.query, keep_blank_values=True)
    keys = {key.casefold() for key, _ in query}
    if "count" not in keys:
        query.append(("count", str(DEFAULT_RCN_PAGE_SIZE)))
    if "sortby" not in keys:
        query.append(("sortBy", DEFAULT_RCN_SORT_BY))
    return urlunparse(parsed._replace(query=urlencode(query)))


def _teryt_prefix_from_url(url: str) -> str | None:
    filters = [value for key, value in parse_qsl(urlparse(url).query) if key.casefold() == "filter"]
    if len(filters) != 1:
        return None
    match = re.search(
        r"<[^>]*ValueReference>\s*(?:ms:)?teryt\s*</[^>]*ValueReference>"
        r"[\s\S]*?<[^>]*Literal>\s*(\d{2})\*\s*</[^>]*Literal>",
        filters[0],
        flags=re.IGNORECASE,
    )
    prefix = match.group(1) if match else None
    return prefix if prefix in POLISH_VOIVODESHIPS else None


def _next_start_index_url(url: str, *, returned_count: int) -> str | None:
    parsed = urlparse(url)
    query = parse_qsl(parsed.query, keep_blank_values=True)
    values = {key.casefold(): value for key, value in query}
    try:
        page_size = int(values.get("count", str(DEFAULT_RCN_PAGE_SIZE)))
        start_index = int(values.get("startindex", "0"))
    except ValueError as exc:
        raise RcnTransactionError("RCN WFS count and STARTINDEX must be integers.") from exc
    if page_size <= 0:
        raise RcnTransactionError("RCN WFS count must be positive.")
    if returned_count < page_size:
        return None

    next_query = [(key, value) for key, value in query if key.casefold() != "startindex"]
    next_query.append(("STARTINDEX", str(start_index + returned_count)))
    return urlunparse(parsed._replace(query=urlencode(next_query)))


def _fetch(url: str, *, timeout_seconds: float, max_bytes: int) -> bytes:
    request = Request(
        url,
        headers={
            "Accept": "application/gml+xml, application/xml, application/json",
            "User-Agent": "WartoMetr-rcn/1.0",
        },
    )
    try:
        with urlopen(request, timeout=timeout_seconds) as response:
            body = response.read(max_bytes + 1)
    except HTTPError as exc:
        raise RcnTransactionError(f"RCN service returned HTTP {exc.code}.") from exc
    except (TimeoutError, URLError) as exc:
        raise RcnTransactionError(f"RCN service could not be fetched: {exc}") from exc
    if len(body) > max_bytes:
        raise RcnTransactionError(f"RCN response exceeds the {max_bytes} byte safety limit.")
    return body


def _parse_response(body: bytes, source_url: str) -> tuple[list[dict[str, object]], str | None]:
    stripped = body.lstrip()
    if stripped.startswith(b"{") or stripped.startswith(b"["):
        try:
            payload = json.loads(body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise RcnTransactionError("RCN JSON must be valid UTF-8 JSON.") from exc
        return _geojson_features(payload), None
    try:
        root = ElementTree.fromstring(body)
    except ElementTree.ParseError as exc:
        raise RcnTransactionError("RCN response must be GeoJSON or XML/GML.") from exc
    features = []
    for element in root.iter():
        if _local_name(element.tag) != "lokale":
            continue
        row: dict[str, object] = {
            "feature_id": element.attrib.get("{http://www.opengis.net/gml}id")
        }
        for child in element:
            name = _local_name(child.tag)
            if name in {"boundedBy", "msGeometry"}:
                continue
            row[name] = (child.text or "").strip() or None
        point = next((node for node in element.iter() if _local_name(node.tag) == "Point"), None)
        if point is not None:
            row["_geometry_crs"] = point.attrib.get("srsName")
        pos = next((node.text for node in element.iter() if _local_name(node.tag) == "pos"), None)
        if pos:
            coordinates = pos.split()
            if len(coordinates) >= 2:
                if "2180" in str(row.get("_geometry_crs") or ""):
                    row["_geometry_y"], row["_geometry_x"] = coordinates[:2]
                else:
                    row["_geometry_x"], row["_geometry_y"] = coordinates[:2]
        features.append(row)
    next_url = root.attrib.get("next")
    if next_url and not _same_origin_path(source_url, next_url):
        raise RcnTransactionError("RCN WFS pagination link left the registered service path.")
    return features, next_url


def _geojson_features(payload: object) -> list[dict[str, object]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if not isinstance(payload, dict):
        raise RcnTransactionError("RCN JSON must be an array or GeoJSON FeatureCollection.")
    if payload.get("type") == "FeatureCollection":
        features = payload.get("features")
    else:
        features = payload.get("transactions") or payload.get("features")
    if not isinstance(features, list):
        raise RcnTransactionError("RCN JSON must contain a features or transactions array.")
    result = []
    for feature in features:
        if not isinstance(feature, dict):
            result.append(feature)
            continue
        row = dict(feature.get("properties") or feature)
        row.setdefault("feature_id", feature.get("id"))
        geometry = feature.get("geometry")
        coordinates = geometry.get("coordinates") if isinstance(geometry, dict) else None
        if isinstance(coordinates, list) and len(coordinates) >= 2:
            row["lat"] = row.get("lat") or coordinates[1]
            row["lon"] = row.get("lon") or coordinates[0]
        result.append(row)
    return result


def _same_origin_path(first: str, second: str) -> bool:
    left, right = urlparse(first), urlparse(second)
    return (left.scheme, left.hostname, left.path) == (right.scheme, right.hostname, right.path)


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _first(row: dict[str, object], *names: str) -> object | None:
    normalized = {key.casefold(): value for key, value in row.items()}
    for name in names:
        value = normalized.get(name.casefold())
        if value not in (None, "", "-"):
            return value
    return None


def _text(value: object | None) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _money(value: object | None) -> int | None:
    decimal = _decimal_or_none(value)
    return round(decimal) if decimal is not None else None


def _decimal(
    value: object | None,
    row_number: int,
    label: str,
    *,
    positive: bool = False,
) -> Decimal:
    result = _decimal_or_none(value)
    if result is None or (positive and result <= 0):
        raise RcnTransactionError(f"Row {row_number}: {label} must be a positive number.")
    return result


def _decimal_or_none(value: object | None) -> Decimal | None:
    text = _text(value)
    if text is None:
        return None
    text = text.replace(" ", "").replace("\u00a0", "").replace(",", ".")
    try:
        value = Decimal(text)
        return value if value.is_finite() else None
    except InvalidOperation:
        return None


def _integer_or_none(value: object | None) -> int | None:
    decimal = _decimal_or_none(value)
    return round(decimal) if decimal is not None else None


def _parse_datetime(value: object | None, row_number: int, label: str) -> datetime:
    text = _text(value)
    if not text:
        raise RcnTransactionError(f"Row {row_number}: {label} is required.")
    normalized = text.replace(" ", "T", 1) if " " in text and "T" not in text else text
    try:
        result = datetime.fromisoformat(normalized)
    except ValueError:
        try:
            result = datetime.combine(date.fromisoformat(text[:10]), datetime.min.time())
        except ValueError as exc:
            raise RcnTransactionError(f"Row {row_number}: invalid {label}.") from exc
    return result.astimezone(UTC).replace(tzinfo=None) if result.tzinfo else result


def _market_type(value: object | None) -> str | None:
    key = slugify(_text(value) or "")
    return {"pierwotny": "primary", "wtorny": "secondary"}.get(key)


def _city_from_rcn_address(address: str | None) -> str | None:
    if not address:
        return None
    match = re.search(r"(?:^|;)MSC:([^;]+)", address, flags=re.IGNORECASE)
    return match.group(1).strip() if match else None


def _canonical_city_name(city: str | None, *, teryt: str | None) -> str | None:
    city = clean_locality(city)
    return canonical_locality(city, teryt=teryt)
