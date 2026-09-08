"""Import approved long-term apartment rental observations from a CSV export."""

from __future__ import annotations

import csv
import hashlib
import json
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from domarion.db.models import DataQualityLog, IngestionJob, ListingSource, RentalObservation
from domarion.ingestion.partner_csv import slugify

REQUIRED_COLUMNS = {
    "source_observation_id",
    "observed_at",
    "city",
    "district",
    "monthly_rent_pln",
    "area_m2",
}
ALLOWED_INGESTION_METHODS = {
    "partner_csv",
    "admin_file_upload",
    "authorized_feed",
    "authorized_api",
}


class RentalObservationError(ValueError):
    pass


@dataclass(frozen=True)
class RentalObservationRecord:
    source_observation_id: str
    content_hash: str
    source_url: str | None
    observed_at: datetime
    active_status: str
    city: str
    district: str | None
    area_id: str | None
    address: str | None
    property_type: str
    building_type: str | None
    monthly_rent_pln: int
    admin_fee_monthly_pln: int | None
    currency: str
    area_m2: Decimal
    rent_per_m2_pln: Decimal
    rooms: int | None
    floor: int | None
    building_year: int | None
    furnished: bool | None
    lat: Decimal | None
    lon: Decimal | None
    data_quality_score: int
    normalized_payload: dict[str, object]


@dataclass(frozen=True)
class RentalObservationImportResult:
    source_name: str
    rows_seen: int
    rows_accepted: int
    rows_rejected: int
    observations_created: int
    observations_changed: int
    observations_reconfirmed: int
    dry_run: bool
    rejected_rows: tuple[dict[str, object], ...] = ()

    def as_dict(self) -> dict[str, object]:
        return {
            "source_name": self.source_name,
            "rows_seen": self.rows_seen,
            "rows_accepted": self.rows_accepted,
            "rows_rejected": self.rows_rejected,
            "observations_created": self.observations_created,
            "observations_changed": self.observations_changed,
            "observations_reconfirmed": self.observations_reconfirmed,
            "dry_run": self.dry_run,
            "rejected_rows": list(self.rejected_rows),
        }


def import_rental_observations(
    session: Session,
    path: str | Path,
    *,
    source_name: str,
    dry_run: bool = False,
    max_rows: int = 100_000,
) -> RentalObservationImportResult:
    source = session.scalar(select(ListingSource).where(ListingSource.name == source_name))
    _assert_source_is_approved(source)
    records, rejected, rows_seen = _read_records(path, source=source, max_rows=max_rows)
    if dry_run:
        return RentalObservationImportResult(
            source_name=source_name,
            rows_seen=rows_seen,
            rows_accepted=len(records),
            rows_rejected=len(rejected),
            observations_created=0,
            observations_changed=0,
            observations_reconfirmed=0,
            dry_run=True,
            rejected_rows=tuple(rejected[:100]),
        )

    now = datetime.now(UTC).replace(tzinfo=None)
    job = IngestionJob(
        id=str(uuid4()),
        source_name=source_name,
        source_type="rental_observations",
        status="running",
        created_by="rental_observation_cli",
        notes="Approved rental observation import; separate from sale listings and RCN.",
        metadata_json={"record_type": "rental_observation", "path_type": "file"},
        started_at=now,
        created_at=now,
        updated_at=now,
    )
    session.add(job)
    session.flush()
    for item in rejected:
        session.add(
            DataQualityLog(
                id=str(uuid4()),
                job_id=job.id,
                source_name=source_name,
                source_listing_id=None,
                severity="error",
                code="rental_observation_rejected",
                message=str(item["message"]),
                payload=item,
                created_at=now,
            )
        )

    existing = session.scalars(
        select(RentalObservation).where(RentalObservation.source_id == source.id)
    ).all()
    versions = {(row.source_observation_id, row.content_hash): row for row in existing}
    known_ids = {row.source_observation_id for row in existing}
    created = changed = reconfirmed = 0
    for record in records:
        key = (record.source_observation_id, record.content_hash)
        row = versions.get(key)
        if row is not None:
            row.last_confirmed_at = max(row.last_confirmed_at, record.observed_at)
            row.ingestion_job_id = job.id
            reconfirmed += 1
            continue
        row = RentalObservation(
            source_id=source.id,
            ingestion_job_id=job.id,
            source_observation_id=record.source_observation_id,
            content_hash=record.content_hash,
            last_confirmed_at=record.observed_at,
            created_at=now,
        )
        _copy_record(row, record)
        session.add(row)
        versions[key] = row
        if record.source_observation_id in known_ids:
            changed += 1
        else:
            created += 1
            known_ids.add(record.source_observation_id)

    job.rows_seen = rows_seen
    job.snapshots_created = created + changed
    job.snapshots_updated = reconfirmed
    job.errors_count = len(rejected)
    job.status = "succeeded"
    job.finished_at = datetime.now(UTC).replace(tzinfo=None)
    job.updated_at = job.finished_at
    session.flush()
    return RentalObservationImportResult(
        source_name=source_name,
        rows_seen=rows_seen,
        rows_accepted=len(records),
        rows_rejected=len(rejected),
        observations_created=created,
        observations_changed=changed,
        observations_reconfirmed=reconfirmed,
        dry_run=False,
        rejected_rows=tuple(rejected[:100]),
    )


def _read_records(
    path: str | Path,
    *,
    source: ListingSource,
    max_rows: int,
) -> tuple[list[RentalObservationRecord], list[dict[str, object]], int]:
    csv_path = Path(path)
    try:
        file = csv_path.open("r", encoding="utf-8-sig", newline="")
    except OSError as exc:
        raise RentalObservationError(f"Rental CSV could not be read: {exc}") from exc
    with file:
        reader = csv.DictReader(file)
        if reader.fieldnames is None:
            raise RentalObservationError("Rental CSV has no header row.")
        missing = REQUIRED_COLUMNS - set(reader.fieldnames)
        if missing:
            raise RentalObservationError(
                "Rental CSV is missing required columns: " + ", ".join(sorted(missing)) + "."
            )
        rows = list(reader)
    if len(rows) > max_rows:
        raise RentalObservationError(f"Rental CSV exceeds the {max_rows} row safety limit.")

    records: list[RentalObservationRecord] = []
    rejected: list[dict[str, object]] = []
    seen: set[str] = set()
    for row_number, row in enumerate(rows, start=2):
        try:
            record = _normalize_row(row, row_number=row_number, source=source)
            if record.source_observation_id in seen:
                raise RentalObservationError(
                    f"Row {row_number}: duplicate source_observation_id in this import."
                )
            seen.add(record.source_observation_id)
            records.append(record)
        except RentalObservationError as exc:
            rejected.append({"row": row_number, "message": str(exc)})
    return records, rejected, len(rows)


def _normalize_row(
    row: dict[str, str | None],
    *,
    row_number: int,
    source: ListingSource,
) -> RentalObservationRecord:
    source_observation_id = _required(row, "source_observation_id", row_number)[:180]
    observed_at = _datetime(_required(row, "observed_at", row_number), row_number)
    city = _required(row, "city", row_number)
    district = _optional(row, "district")
    monthly_rent = _positive_int(row, "monthly_rent_pln", row_number)
    area_m2 = _positive_decimal(row, "area_m2", row_number)
    currency = (_optional(row, "currency") or "PLN").upper()
    if currency != "PLN":
        raise RentalObservationError(
            f"Row {row_number}: only PLN rental observations are accepted."
        )
    source_url = _optional(row, "source_url")
    _assert_source_url(source, source_url, row_number)
    property_type = (_optional(row, "property_type") or "apartment").casefold()
    if property_type not in {"apartment", "flat", "mieszkanie"}:
        raise RentalObservationError(f"Row {row_number}: only apartment rentals are accepted.")
    active_status = (_optional(row, "active_status") or "active").casefold()
    if active_status not in {"active", "removed", "expired"}:
        raise RentalObservationError(f"Row {row_number}: unsupported active_status.")
    admin_fee = _optional_int(row, "admin_fee_monthly_pln", row_number)
    rooms = _optional_int(row, "rooms", row_number)
    floor = _optional_int(row, "floor", row_number)
    building_year = _optional_int(row, "building_year", row_number)
    furnished = _optional_bool(row, "furnished", row_number)
    lat = _optional_decimal(row, "lat", row_number)
    lon = _optional_decimal(row, "lon", row_number)
    if rooms is not None and rooms < 1:
        raise RentalObservationError(f"Row {row_number}: rooms must be positive.")
    quality = _optional_int(row, "data_quality_score", row_number)
    if quality is None:
        quality = 90
        quality -= 10 if rooms is None else 0
        quality -= 10 if not district else 0
        quality -= 5 if not _optional(row, "building_type") else 0
    if not 0 <= quality <= 100:
        raise RentalObservationError(f"Row {row_number}: data_quality_score must be 0-100.")

    normalized: dict[str, object] = {
        "source_observation_id": source_observation_id,
        "source_url": source_url,
        "observed_at": observed_at.isoformat(),
        "active_status": active_status,
        "city": city,
        "district": district,
        "area_id": _optional(row, "area_id")
        or (slugify(f"{city}-{district}") if district else None),
        "address": _optional(row, "address"),
        "property_type": "apartment",
        "building_type": _optional(row, "building_type"),
        "monthly_rent_pln": monthly_rent,
        "admin_fee_monthly_pln": admin_fee,
        "currency": currency,
        "area_m2": float(area_m2),
        "rent_per_m2_pln": float(Decimal(monthly_rent) / area_m2),
        "rooms": rooms,
        "floor": floor,
        "building_year": building_year,
        "furnished": furnished,
        "lat": float(lat) if lat is not None else None,
        "lon": float(lon) if lon is not None else None,
        "data_quality_score": quality,
    }
    # Re-observing the same unchanged offer confirms freshness; it is not a new version.
    version_payload = {key: value for key, value in normalized.items() if key != "observed_at"}
    content_hash = hashlib.sha256(
        json.dumps(version_payload, sort_keys=True, ensure_ascii=True).encode("utf-8")
    ).hexdigest()
    return RentalObservationRecord(
        source_observation_id=source_observation_id,
        content_hash=content_hash,
        source_url=source_url,
        observed_at=observed_at,
        active_status=active_status,
        city=city,
        district=district,
        area_id=str(normalized["area_id"]) if normalized["area_id"] else None,
        address=str(normalized["address"]) if normalized["address"] else None,
        property_type="apartment",
        building_type=_optional(row, "building_type"),
        monthly_rent_pln=monthly_rent,
        admin_fee_monthly_pln=admin_fee,
        currency=currency,
        area_m2=area_m2,
        rent_per_m2_pln=Decimal(monthly_rent) / area_m2,
        rooms=rooms,
        floor=floor,
        building_year=building_year,
        furnished=furnished,
        lat=lat,
        lon=lon,
        data_quality_score=quality,
        normalized_payload=normalized,
    )


def _copy_record(row: RentalObservation, record: RentalObservationRecord) -> None:
    for field in (
        "content_hash",
        "source_url",
        "observed_at",
        "active_status",
        "city",
        "district",
        "area_id",
        "address",
        "property_type",
        "building_type",
        "monthly_rent_pln",
        "admin_fee_monthly_pln",
        "currency",
        "area_m2",
        "rent_per_m2_pln",
        "rooms",
        "floor",
        "building_year",
        "furnished",
        "lat",
        "lon",
        "data_quality_score",
        "normalized_payload",
    ):
        setattr(row, field, getattr(record, field))


def _assert_source_is_approved(source: ListingSource | None) -> None:
    if source is None:
        raise RentalObservationError("Rental source is not registered in listing_sources.")
    if source.is_demo or not source.is_active or source.legal_status != "approved":
        raise RentalObservationError(
            f"Source '{source.name}' is not approved for rental ingestion."
        )
    if source.ingestion_method not in ALLOWED_INGESTION_METHODS:
        raise RentalObservationError(f"Source '{source.name}' has an unsupported ingestion method.")
    if "rental_analytics" not in set(source.allowed_use_json or []):
        raise RentalObservationError(
            f"Source '{source.name}' is not explicitly approved for rental_analytics."
        )


def _assert_source_url(source: ListingSource, value: str | None, row_number: int) -> None:
    if value is None or source.base_url is None:
        return
    registered = urlparse(source.base_url)
    observed = urlparse(value)
    if (registered.hostname or "").casefold() != (observed.hostname or "").casefold():
        raise RentalObservationError(f"Row {row_number}: source_url is outside source scope.")


def _required(row: dict[str, str | None], key: str, row_number: int) -> str:
    value = _optional(row, key)
    if value is None:
        raise RentalObservationError(f"Row {row_number}: column '{key}' is required.")
    return value


def _optional(row: dict[str, str | None], key: str) -> str | None:
    value = row.get(key)
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _decimal_value(value: str, row_number: int, key: str) -> Decimal:
    try:
        return Decimal(value.replace(" ", "").replace("\u00a0", "").replace(",", "."))
    except InvalidOperation as exc:
        raise RentalObservationError(f"Row {row_number}: column '{key}' must be numeric.") from exc


def _positive_decimal(row: dict[str, str | None], key: str, row_number: int) -> Decimal:
    value = _decimal_value(_required(row, key, row_number), row_number, key)
    if value <= 0:
        raise RentalObservationError(f"Row {row_number}: column '{key}' must be positive.")
    return value


def _positive_int(row: dict[str, str | None], key: str, row_number: int) -> int:
    value = round(_positive_decimal(row, key, row_number))
    if value <= 0:
        raise RentalObservationError(f"Row {row_number}: column '{key}' must be positive.")
    return value


def _optional_int(row: dict[str, str | None], key: str, row_number: int) -> int | None:
    value = _optional(row, key)
    if value is None:
        return None
    decimal = _decimal_value(value, row_number, key)
    if decimal != decimal.to_integral_value():
        raise RentalObservationError(f"Row {row_number}: column '{key}' must be an integer.")
    return int(decimal)


def _optional_decimal(
    row: dict[str, str | None], key: str, row_number: int
) -> Decimal | None:
    value = _optional(row, key)
    return _decimal_value(value, row_number, key) if value is not None else None


def _optional_bool(row: dict[str, str | None], key: str, row_number: int) -> bool | None:
    value = _optional(row, key)
    if value is None:
        return None
    normalized = value.casefold()
    if normalized in {"1", "true", "yes", "y", "tak"}:
        return True
    if normalized in {"0", "false", "no", "n", "nie"}:
        return False
    raise RentalObservationError(f"Row {row_number}: column '{key}' must be boolean.")


def _datetime(value: str, row_number: int) -> datetime:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise RentalObservationError(f"Row {row_number}: observed_at must be ISO-8601.") from exc
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(UTC).replace(tzinfo=None)
    return parsed
