"""Bounded regional orchestration for Poland-wide RCN ingestion."""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timedelta
from hashlib import sha256
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from sqlalchemy import select
from sqlalchemy.orm import Session

from domarion.db.models import IngestionJob

POLISH_VOIVODESHIPS = {
    "02": "dolnośląskie",
    "04": "kujawsko-pomorskie",
    "06": "lubelskie",
    "08": "lubuskie",
    "10": "łódzkie",
    "12": "małopolskie",
    "14": "mazowieckie",
    "16": "opolskie",
    "18": "podkarpackie",
    "20": "podlaskie",
    "22": "pomorskie",
    "24": "śląskie",
    "26": "świętokrzyskie",
    "28": "warmińsko-mazurskie",
    "30": "wielkopolskie",
    "32": "zachodniopomorskie",
}
DEFAULT_POLAND_REGION_CODES = tuple(POLISH_VOIVODESHIPS)


@dataclass(frozen=True)
class RcnRegionCheckpoint:
    teryt_prefix: str
    latest_source_version: str
    last_successful_at: datetime | None = None


def voivodeship_for_teryt(teryt: str | None) -> str | None:
    if not teryt:
        return None
    return POLISH_VOIVODESHIPS.get(teryt[:2])


def parse_region_codes(value: str | None) -> tuple[str, ...]:
    if not value or value.strip().casefold() in {"all", "poland"}:
        return DEFAULT_POLAND_REGION_CODES
    codes = tuple(dict.fromkeys(item.strip() for item in value.split(",") if item.strip()))
    invalid = [code for code in codes if code not in POLISH_VOIVODESHIPS]
    if invalid:
        raise ValueError(f"Unknown Polish voivodeship TERYT prefixes: {', '.join(invalid)}")
    if not codes:
        raise ValueError("At least one Polish voivodeship TERYT prefix is required.")
    return codes


def build_rcn_region_url(
    base_url: str,
    *,
    teryt_prefix: str,
    since_version: str,
    page_size: int = 1_000,
) -> str:
    if teryt_prefix not in POLISH_VOIVODESHIPS:
        raise ValueError(f"Unknown Polish voivodeship TERYT prefix: {teryt_prefix}")
    since = _parse_source_version(since_version).isoformat(timespec="seconds")
    parsed = urlparse(base_url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ValueError("Poland-wide RCN ingestion requires an HTTP(S) WFS base URL.")

    ignored = {
        "bbox",
        "filter",
        "startindex",
        "count",
        "sortby",
        "resulttype",
        "service",
        "version",
        "request",
        "typenames",
        "outputformat",
    }
    query = [
        (key, value)
        for key, value in parse_qsl(parsed.query)
        if key.casefold() not in ignored
    ]
    defaults = {
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "typeNames": "ms:lokale",
        "outputFormat": "GML3",
    }
    query.extend(defaults.items())
    query.extend(
        [
            ("count", str(page_size)),
            ("sortBy", "tran_lokalny_id_iip A,lok_id_lokalu A,tran_wersja_id A"),
            ("FILTER", _region_filter(teryt_prefix, since)),
        ]
    )
    return urlunparse(parsed._replace(query=urlencode(query)))


def load_rcn_region_checkpoints(
    session: Session,
    *,
    source_name: str,
) -> dict[str, RcnRegionCheckpoint]:
    jobs = session.scalars(
        select(IngestionJob)
        .where(
            IngestionJob.source_name == source_name,
            IngestionJob.source_type == "transaction_register",
            IngestionJob.status == "succeeded",
        )
        .order_by(IngestionJob.finished_at.desc())
        .limit(1_000)
    ).all()
    checkpoints: dict[str, RcnRegionCheckpoint] = {}
    for job in jobs:
        metadata = job.metadata_json or {}
        prefix = str(metadata.get("teryt_prefix") or "")
        latest = str(metadata.get("latest_source_version") or "")
        if prefix in POLISH_VOIVODESHIPS and latest and prefix not in checkpoints:
            checkpoints[prefix] = RcnRegionCheckpoint(
                prefix,
                latest,
                getattr(job, "finished_at", None) or getattr(job, "updated_at", None),
            )
        if len(checkpoints) == len(POLISH_VOIVODESHIPS):
            break
    return checkpoints


def checkpoint_since_version(
    checkpoint: RcnRegionCheckpoint | None,
    *,
    initial_since: datetime,
    overlap_days: int,
) -> str:
    if checkpoint is None:
        value = initial_since
    else:
        value = _parse_source_version(checkpoint.latest_source_version) - timedelta(
            days=max(1, overlap_days)
        )
    return value.isoformat(timespec="seconds")


def combine_rcn_region_results(results: list[dict[str, object]]) -> dict[str, object]:
    counters = Counter()
    rejection_reasons: Counter[str] = Counter()
    fingerprints: list[str] = []
    latest_versions: list[str] = []
    latest_dates: list[str] = []
    for result in results:
        for key in (
            "rows_seen",
            "rows_accepted",
            "rows_rejected",
            "transactions_created",
            "transactions_changed",
            "transactions_reconfirmed",
            "districts_assigned",
            "transactions_with_unresolved_district",
        ):
            counters[key] += int(result.get(key) or 0)
        reasons = result.get("rejection_reason_counts")
        if isinstance(reasons, dict):
            rejection_reasons.update({str(key): int(value) for key, value in reasons.items()})
        if fingerprint := result.get("accepted_snapshot_fingerprint"):
            fingerprints.append(str(fingerprint))
        if version := result.get("latest_source_version"):
            latest_versions.append(str(version))
        if transaction_date := result.get("latest_transaction_date"):
            latest_dates.append(str(transaction_date))

    return {
        "scope_label": f"Poland ({len(results)} voivodeships processed)",
        "regions_processed": len(results),
        **dict(counters),
        "rejection_reason_counts": dict(rejection_reasons.most_common()),
        "accepted_snapshot_fingerprint": (
            sha256("\n".join(sorted(fingerprints)).encode("utf-8")).hexdigest()
            if fingerprints
            else None
        ),
        "latest_source_version": max(latest_versions, default=None),
        "latest_transaction_date": max(latest_dates, default=None),
        "regions": results,
    }


def _region_filter(teryt_prefix: str, since_version: str) -> str:
    return (
        '<fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0" '
        'xmlns:ms="http://mapserver.gis.umn.edu/mapserver"><fes:And>'
        '<fes:PropertyIsLike wildCard="*" singleChar="?" escapeChar="!">'
        "<fes:ValueReference>ms:teryt</fes:ValueReference>"
        f"<fes:Literal>{teryt_prefix}*</fes:Literal></fes:PropertyIsLike>"
        "<fes:PropertyIsEqualTo><fes:ValueReference>ms:lok_funkcja</fes:ValueReference>"
        "<fes:Literal>mieszkalna</fes:Literal></fes:PropertyIsEqualTo>"
        "<fes:PropertyIsGreaterThanOrEqualTo>"
        "<fes:ValueReference>ms:tran_wersja_id</fes:ValueReference>"
        f"<fes:Literal>{since_version}</fes:Literal>"
        "</fes:PropertyIsGreaterThanOrEqualTo></fes:And></fes:Filter>"
    )


def _parse_source_version(value: str) -> datetime:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError(f"Invalid RCN source-version checkpoint: {value}") from exc
