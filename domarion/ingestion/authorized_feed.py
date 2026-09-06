"""Import bounded, authorized listing feeds into the existing history pipeline.

This module deliberately does not crawl portal search pages. A source must provide
an approved API, export or feed and be registered in ``listing_sources`` first.
"""

import json
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from domarion.db.models import DataQualityLog, IngestionJob, ListingSource
from domarion.ingestion.db_writer import ImportResult, import_partner_records_in_session
from domarion.ingestion.partner_csv import (
    PartnerCsvError,
    PartnerListingRecord,
    normalize_partner_row,
)

MAX_FEED_BYTES = 25_000_000
DEFAULT_TIMEOUT_SECONDS = 20.0
ALLOWED_INGESTION_METHODS = {
    "authorized_api",
    "authorized_feed",
    "partner_api",
    "partner_feed",
    "partner_csv",
    "admin_csv_upload",
}
ALLOWED_MARKET_USES = {"analytics", "market_metrics", "price_history", "reports"}
PROHIBITED_FIELDS = {
    "description",
    "full_description",
    "photos",
    "images",
    "contact",
    "contacts",
    "phone",
    "email",
    "seller_name",
    "owner_name",
}
ALLOWED_FIELDS = {
    "source_listing_id",
    "source_url",
    "source_base_url",
    "title",
    "city",
    "district",
    "voivodeship",
    "municipality",
    "address",
    "market_type",
    "property_type",
    "building_type",
    "renovation_state",
    "has_balcony",
    "has_terrace",
    "has_garden",
    "has_elevator",
    "parking_type",
    "heating_type",
    "developer_id",
    "developer_name",
    "investment_name",
    "primary_market_project_id",
    "price",
    "currency",
    "area_m2",
    "price_per_m2",
    "rooms",
    "floor",
    "building_floors",
    "building_year",
    "first_seen_at",
    "last_seen_at",
    "observed_at",
    "days_on_market",
    "price_reductions",
    "price_increases",
    "relisted",
    "lat",
    "lon",
    "distance_to_center_km",
    "nearest_stop_m",
    "nearest_school_m",
    "nearest_major_road_m",
    "nearest_industrial_zone_m",
    "parks_within_1km",
    "schools_within_1km",
    "planned_investments_within_2km",
    "data_quality_score",
    "active_status",
    "description_hash",
}


class AuthorizedFeedError(ValueError):
    pass


@dataclass(frozen=True)
class FeedImportResult:
    source_name: str
    rows_seen: int
    rows_accepted: int
    rows_rejected: int
    dry_run: bool
    import_result: ImportResult | None = None
    market_metrics: dict[str, object] | None = None
    rejected_rows: tuple[dict[str, object], ...] = ()

    def as_dict(self) -> dict[str, object]:
        payload: dict[str, object] = {
            "source_name": self.source_name,
            "rows_seen": self.rows_seen,
            "rows_accepted": self.rows_accepted,
            "rows_rejected": self.rows_rejected,
            "dry_run": self.dry_run,
            "rejected_rows": list(self.rejected_rows),
        }
        if self.import_result is not None:
            payload.update(self.import_result.as_dict())
            payload["removed_marked"] = self.import_result.removed_marked
        if self.market_metrics is not None:
            payload["market_metrics"] = self.market_metrics
        return payload


def load_feed_payload(
    location: str | Path,
    *,
    timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
    max_bytes: int = MAX_FEED_BYTES,
) -> object:
    """Load one local JSON export or one authorized feed response.

    Pagination is intentionally not followed. A feed provider should expose a
    bounded complete export or an API adapter with an explicit contract.
    """
    location_text = str(location)
    parsed = urlparse(location_text)
    if parsed.scheme in {"http", "https"}:
        request = Request(
            location_text,
            headers={"Accept": "application/json", "User-Agent": "WartoMetr-authorized-feed/1.0"},
        )
        try:
            with urlopen(request, timeout=timeout_seconds) as response:
                body = response.read(max_bytes + 1)
        except HTTPError as exc:
            if exc.code in {401, 403, 407, 429}:
                raise AuthorizedFeedError(
                    f"Authorized feed returned HTTP {exc.code}; ingestion stopped without bypass."
                ) from exc
            raise AuthorizedFeedError(f"Authorized feed returned HTTP {exc.code}.") from exc
        except (TimeoutError, URLError) as exc:
            raise AuthorizedFeedError(f"Authorized feed could not be fetched: {exc}") from exc
    else:
        try:
            body = Path(location_text).read_bytes()
        except OSError as exc:
            raise AuthorizedFeedError(f"Feed file could not be read: {exc}") from exc

    if len(body) > max_bytes:
        raise AuthorizedFeedError(f"Feed exceeds the {max_bytes} byte safety limit.")
    try:
        return json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise AuthorizedFeedError("Feed must be a UTF-8 JSON document.") from exc


def normalize_authorized_feed_row(
    row: object,
    *,
    row_number: int,
    source_name: str,
    source_type: str,
) -> PartnerListingRecord:
    if not isinstance(row, dict):
        raise AuthorizedFeedError(f"Row {row_number}: listing must be an object.")

    prohibited = sorted(PROHIBITED_FIELDS.intersection(row))
    if prohibited:
        raise AuthorizedFeedError(
            f"Row {row_number}: prohibited fields must be stripped before ingestion: "
            f"{', '.join(prohibited)}."
        )
    unsupported = sorted(set(row).difference(ALLOWED_FIELDS))
    if unsupported:
        raise AuthorizedFeedError(
            f"Row {row_number}: unsupported fields must be removed before ingestion: "
            f"{', '.join(unsupported)}."
        )

    required = (
        "source_listing_id",
        "source_url",
        "city",
        "district",
        "address",
        "price",
        "area_m2",
        "rooms",
        "lat",
        "lon",
    )
    missing = [field for field in required if row.get(field) in (None, "")]
    if missing:
        raise AuthorizedFeedError(
            f"Row {row_number}: missing required fields: {', '.join(missing)}."
        )

    # A bulk feed must contain authoritative coordinates. The existing CSV path
    # can use offline fixtures, but a production feed must not guess location.
    city_key = _slug(str(row["city"]))
    if city_key != "wroclaw":
        raise AuthorizedFeedError(f"Row {row_number}: only Wrocław feed rows are accepted.")
    district_key = _slug(str(row["district"]))
    if district_key in {"dolnoslaskie", "wroclawski", "powiat-wroclawski"}:
        raise AuthorizedFeedError(
            f"Row {row_number}: region/powiat label is not a Wrocław district."
        )

    normalized_row = dict(row)
    if not normalized_row.get("building_type") and normalized_row.get("property_type"):
        normalized_row["building_type"] = normalized_row["property_type"]
    string_row = {key: _json_scalar_to_text(value) for key, value in normalized_row.items()}
    string_row["source_name"] = source_name
    string_row["source_type"] = source_type
    string_row["source_base_url"] = str(row.get("source_base_url") or "")
    try:
        record = normalize_partner_row(
            string_row,
            row_number=row_number,
            default_source_name=source_name,
            default_source_type=source_type,
        )
    except (PartnerCsvError, ValueError, TypeError) as exc:
        raise AuthorizedFeedError(str(exc)) from exc

    # Keep only the minimum allowed fields in raw storage. The writer already
    # hashes descriptions rather than persisting them, but this feed rejects them.
    return record


def import_authorized_feed(
    session: Session,
    location: str | Path,
    *,
    source_name: str,
    dry_run: bool = False,
    mark_missing_removed: bool = False,
    max_listings: int = 10_000,
    timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
) -> FeedImportResult:
    source = session.scalar(select(ListingSource).where(ListingSource.name == source_name))
    _assert_source_is_approved(source)
    if urlparse(str(location)).scheme in {"http", "https"}:
        _assert_feed_url_is_in_source_scope(source, str(location))
    payload = load_feed_payload(location, timeout_seconds=timeout_seconds)
    rows = _extract_rows(payload)
    if len(rows) > max_listings:
        raise AuthorizedFeedError(
            f"Feed contains {len(rows)} listings, above the {max_listings} row safety limit."
        )

    records: list[PartnerListingRecord] = []
    rejected: list[dict[str, object]] = []
    seen_ids: set[str] = set()
    for row_number, row in enumerate(rows, start=1):
        try:
            record = normalize_authorized_feed_row(
                row,
                row_number=row_number,
                source_name=source_name,
                source_type=source.source_type,
            )
            if record.source_listing_id in seen_ids:
                raise AuthorizedFeedError(
                    f"Row {row_number}: duplicate source_listing_id in the same feed."
                )
            seen_ids.add(record.source_listing_id)
            records.append(record)
        except AuthorizedFeedError as exc:
            rejected.append({"row": row_number, "message": str(exc)})

    # A non-empty feed with invalid rows is a partial run. Never mark missing
    # listings as removed in that case: the source inventory is incomplete.
    complete = not rejected
    import_result = None
    market_metrics = None
    if not dry_run:
        job = IngestionJob(
            id=str(uuid4()),
            source_name=source_name,
            source_type=source.source_type,
            status="running",
            created_by="authorized_feed_cli",
            notes="Bounded approved feed import.",
            metadata_json={
                "location_type": "url" if urlparse(str(location)).scheme else "file",
                "complete_snapshot": complete,
                "mark_missing_removed_requested": mark_missing_removed,
                "rejected_rows": len(rejected),
            },
            started_at=datetime.now(UTC).replace(tzinfo=None),
            created_at=datetime.now(UTC).replace(tzinfo=None),
            updated_at=datetime.now(UTC).replace(tzinfo=None),
        )
        session.add(job)
        session.flush()
        for item in rejected:
            session.add(
                DataQualityLog(
                    id=f"{job.id}-{item['row']}",
                    job_id=job.id,
                    source_name=source_name,
                    source_listing_id=None,
                    severity="error",
                    code="feed_row_rejected",
                    message=str(item["message"]),
                    payload=item,
                    created_at=datetime.now(UTC).replace(tzinfo=None),
                )
            )
        if records:
            import_result = import_partner_records_in_session(
                session,
                records,
                job_id=job.id,
                mark_missing_removed=mark_missing_removed and complete,
            )
            for key, value in import_result.as_dict().items():
                setattr(job, key, value)
            from domarion.services.market_metrics import refresh_market_metrics

            market_metrics = refresh_market_metrics(session, city="Wrocław")
        job.status = "succeeded"
        job.errors_count = len(rejected)
        job.finished_at = datetime.now(UTC).replace(tzinfo=None)
        job.updated_at = datetime.now(UTC).replace(tzinfo=None)
        session.flush()
    return FeedImportResult(
        source_name=source_name,
        rows_seen=len(rows),
        rows_accepted=len(records),
        rows_rejected=len(rejected),
        dry_run=dry_run,
        import_result=import_result,
        market_metrics=market_metrics,
        rejected_rows=tuple(rejected[:100]),
    )


def _assert_source_is_approved(source: ListingSource | None) -> None:
    if source is None:
        raise AuthorizedFeedError(
            "Source is not registered. Create a source registry entry before importing."
        )
    if not source.is_active or source.legal_status != "approved":
        raise AuthorizedFeedError(
            f"Source '{source.name}' is not approved for production ingestion."
        )
    if source.ingestion_method not in ALLOWED_INGESTION_METHODS:
        raise AuthorizedFeedError(
            f"Source '{source.name}' does not use an authorized feed/API ingestion method."
        )
    if not set(source.allowed_use_json or []).intersection(ALLOWED_MARKET_USES):
        raise AuthorizedFeedError(
            f"Source '{source.name}' is not approved for market metrics or reports."
        )
    if source.is_demo:
        raise AuthorizedFeedError("Demo sources cannot be used as market evidence.")


def _assert_feed_url_is_in_source_scope(source: ListingSource, feed_url: str) -> None:
    if not source.base_url:
        raise AuthorizedFeedError("An approved remote feed requires source.base_url scope.")
    source_host = (urlparse(source.base_url).hostname or "").casefold()
    feed_host = (urlparse(feed_url).hostname or "").casefold()
    if not source_host or feed_host != source_host:
        raise AuthorizedFeedError("Feed URL is outside the registered source domain scope.")


def _extract_rows(payload: object) -> list[object]:
    if isinstance(payload, list):
        rows = payload
    elif isinstance(payload, dict) and isinstance(payload.get("listings"), list):
        rows = payload["listings"]
    else:
        raise AuthorizedFeedError(
            "Feed JSON must be an array or an object with a 'listings' array."
        )
    return list(rows)


def _json_scalar_to_text(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (dict, list)):
        raise AuthorizedFeedError("Nested values are not supported in listing fields.")
    return str(value)


def _slug(value: str) -> str:
    return (
        value.strip()
        .casefold()
        .replace("ą", "a")
        .replace("ć", "c")
        .replace("ę", "e")
        .replace("ł", "l")
        .replace("ń", "n")
        .replace("ó", "o")
        .replace("ś", "s")
        .replace("ź", "z")
        .replace("ż", "z")
        .replace(" ", "-")
    )
