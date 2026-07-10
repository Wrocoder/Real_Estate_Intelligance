from __future__ import annotations

import csv
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    PlannedInvestment,
    PlannedInvestmentCreate,
    PlannedInvestmentUpdate,
)


class PlannedInvestmentImportError(ValueError):
    pass


@dataclass(frozen=True)
class PlannedInvestmentImportRecord:
    source_id: str
    payload: PlannedInvestmentCreate


@dataclass
class PlannedInvestmentImportResult:
    rows_seen: int = 0
    created: int = 0
    updated: int = 0
    skipped: int = 0
    dry_run: bool = False
    investment_ids: list[str] = field(default_factory=list)
    source_ids: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        return {
            "rows_seen": self.rows_seen,
            "created": self.created,
            "updated": self.updated,
            "skipped": self.skipped,
            "dry_run": self.dry_run,
            "investment_ids": self.investment_ids,
            "source_ids": self.source_ids,
            "errors": self.errors,
        }


REQUIRED_FIELDS = {"name", "investment_type", "status", "city", "lat", "lon"}
FIELD_ALIASES = {
    "name": ("name", "title"),
    "investment_type": ("investment_type", "type", "category"),
    "status": ("status", "stage"),
    "city": ("city", "municipality"),
    "lat": ("lat", "latitude", "y"),
    "lon": ("lon", "lng", "longitude", "x"),
    "district": ("district", "area", "osiedle"),
    "expected_year": ("expected_year", "year", "planned_year"),
    "source_url": ("source_url", "url", "link"),
    "source_id": ("source_id", "id", "external_id"),
    "source_name": ("source_name", "source"),
    "source_updated_at": ("source_updated_at", "updated_at"),
    "confidence_score": ("confidence_score", "confidence"),
    "notes": ("notes", "description"),
}
STATUS_ALIASES = {
    "plan": "planned",
    "planned": "planned",
    "planowane": "planned",
    "koncepcja": "planned",
    "ustalenia": "in_consultation",
    "konsultacje": "in_consultation",
    "consultation": "in_consultation",
    "in_consultation": "in_consultation",
    "projekt": "in_design",
    "projektowanie": "in_design",
    "projekt: przetarg": "in_design_tender",
    "projekt: w realizacji": "in_design",
    "design": "in_design",
    "in_design": "in_design",
    "budowa: przetarg": "construction_tender",
    "budowa: w realizacji": "in_progress",
    "w realizacji": "in_progress",
    "realizacja": "in_progress",
    "construction": "in_progress",
    "in_progress": "in_progress",
    "completed": "completed",
    "zakończono": "completed",
    "zrealizowane": "completed",
}
TYPE_ALIASES = {
    "tram": "tram",
    "tramwaj": "tram",
    "linia tramwajowa": "tram",
    "tat": "tram_bus_priority",
    "trasa autobusowo-tramwajowa": "tram_bus_priority",
    "bus": "bus",
    "autobus": "bus",
    "road": "road",
    "droga": "road",
    "transport": "road_transport",
    "road_transport": "road_transport",
    "school": "school",
    "szkoła": "school",
    "kindergarten": "kindergarten",
    "przedszkole": "kindergarten",
    "park": "park",
    "greenery": "park",
    "zieleń": "park",
    "public_service": "public_service",
}


def read_planned_investment_records(
    path: str | Path,
    default_source_name: str | None = None,
) -> list[PlannedInvestmentImportRecord]:
    source_path = Path(path)
    if not source_path.exists():
        raise PlannedInvestmentImportError(f"Planned investments file not found: {source_path}")

    if source_path.suffix.lower() == ".json":
        rows, source_name = _read_json_rows(source_path, default_source_name)
    elif source_path.suffix.lower() == ".csv":
        rows, source_name = _read_csv_rows(source_path, default_source_name)
    else:
        raise PlannedInvestmentImportError("Supported planned investment formats: .json, .csv")

    records = []
    errors = []
    for index, row in enumerate(rows, start=1):
        try:
            records.append(_row_to_record(row, source_name=source_name))
        except (KeyError, TypeError, ValueError) as exc:
            errors.append(f"row {index}: {exc}")

    if errors:
        raise PlannedInvestmentImportError("; ".join(errors))
    return records


def import_planned_investments(
    path: str | Path,
    repository: RealEstateRepository,
    default_source_name: str | None = None,
    dry_run: bool = False,
) -> PlannedInvestmentImportResult:
    records = read_planned_investment_records(path, default_source_name)
    result = PlannedInvestmentImportResult(
        rows_seen=len(records),
        dry_run=dry_run,
        source_ids=[record.source_id for record in records],
    )

    if dry_run:
        return result

    for record in records:
        existing = _find_existing_investment(repository, record.payload)
        if existing is None:
            created = repository.create_planned_investment(record.payload)
            result.created += 1
            result.investment_ids.append(created.id)
            continue

        updated = repository.update_planned_investment(
            existing.id,
            PlannedInvestmentUpdate(**record.payload.model_dump()),
        )
        if updated is None:
            result.errors.append(f"failed to update {existing.id}")
            continue
        result.updated += 1
        result.investment_ids.append(updated.id)

    return result


def dry_run_planned_investments(
    path: str | Path,
    default_source_name: str | None = None,
) -> PlannedInvestmentImportResult:
    records = read_planned_investment_records(path, default_source_name)
    return PlannedInvestmentImportResult(
        rows_seen=len(records),
        dry_run=True,
        source_ids=[record.source_id for record in records],
    )


def _read_json_rows(
    path: Path,
    default_source_name: str | None,
) -> tuple[list[dict[str, Any]], str | None]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(payload, list):
        return payload, default_source_name
    if isinstance(payload, dict):
        items = payload.get("items")
        if not isinstance(items, list):
            raise PlannedInvestmentImportError(
                "JSON planned investment file must contain items list"
            )
        source_name = payload.get("source_name") or default_source_name
        return items, str(source_name) if source_name else None
    raise PlannedInvestmentImportError("JSON planned investment file must be an object or list")


def _read_csv_rows(
    path: Path,
    default_source_name: str | None,
) -> tuple[list[dict[str, Any]], str | None]:
    with path.open("r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)
        if reader.fieldnames is None:
            raise PlannedInvestmentImportError("CSV file has no header")
        missing = [
            field_name
            for field_name in REQUIRED_FIELDS
            if not any(alias in reader.fieldnames for alias in FIELD_ALIASES[field_name])
        ]
        if missing:
            raise PlannedInvestmentImportError(
                f"CSV file is missing required columns: {', '.join(sorted(missing))}"
            )
        return list(reader), default_source_name


def _row_to_record(
    row: dict[str, Any],
    source_name: str | None,
) -> PlannedInvestmentImportRecord:
    missing = [
        field_name
        for field_name in REQUIRED_FIELDS
        if _is_blank(_row_value(row, field_name))
    ]
    if missing:
        raise PlannedInvestmentImportError(
            f"missing required fields: {', '.join(sorted(missing))}"
        )

    source_id = _optional_str(_row_value(row, "source_id")) or _slugify(
        str(_row_value(row, "name"))
    )
    notes = _notes_with_source(
        notes=_optional_str(_row_value(row, "notes")),
        source_name=_optional_str(_row_value(row, "source_name")) or source_name,
        source_id=source_id,
        source_updated_at=_optional_str(_row_value(row, "source_updated_at")),
    )
    payload = PlannedInvestmentCreate(
        name=str(_row_value(row, "name")).strip(),
        investment_type=_normalize_investment_type(str(_row_value(row, "investment_type"))),
        status=_normalize_status(str(_row_value(row, "status"))),
        city=str(_row_value(row, "city")).strip(),
        district=_optional_str(_row_value(row, "district")),
        expected_year=_optional_int(_row_value(row, "expected_year")),
        lat=_required_float(_row_value(row, "lat"), "lat"),
        lon=_required_float(_row_value(row, "lon"), "lon"),
        source_url=_optional_str(_row_value(row, "source_url")),
        confidence_score=_optional_int(_row_value(row, "confidence_score")) or 50,
        notes=notes,
    )
    return PlannedInvestmentImportRecord(source_id=source_id, payload=payload)


def _find_existing_investment(
    repository: RealEstateRepository,
    payload: PlannedInvestmentCreate,
) -> PlannedInvestment | None:
    investments = repository.list_planned_investments(city=payload.city)
    if payload.source_url:
        for investment in investments:
            if investment.source_url == payload.source_url and _same_name(
                investment.name,
                payload.name,
            ):
                return investment

    for investment in investments:
        if _same_name(investment.name, payload.name):
            return investment
    return None


def _row_value(row: dict[str, Any], canonical_field: str) -> Any:
    for alias in FIELD_ALIASES.get(canonical_field, (canonical_field,)):
        if alias in row:
            return row[alias]

    coordinates = row.get("coordinates")
    if isinstance(coordinates, dict):
        if canonical_field == "lat":
            return coordinates.get("lat") or coordinates.get("latitude")
        if canonical_field == "lon":
            return coordinates.get("lon") or coordinates.get("lng") or coordinates.get("longitude")

    return None


def _same_name(left: str, right: str) -> bool:
    return _slugify(left) == _slugify(right)


def _normalize_status(value: str) -> str:
    normalized = value.strip().lower()
    return STATUS_ALIASES.get(normalized, normalized.replace(" ", "_"))


def _normalize_investment_type(value: str) -> str:
    normalized = value.strip().lower()
    return TYPE_ALIASES.get(normalized, normalized.replace(" ", "_"))


def _notes_with_source(
    notes: str | None,
    source_name: str | None,
    source_id: str,
    source_updated_at: str | None,
) -> str:
    parts = []
    if notes:
        parts.append(notes)

    source_bits = [f"source_id={source_id}"]
    if source_name:
        source_bits.append(f"source={source_name}")
    if source_updated_at:
        source_bits.append(f"source_updated_at={source_updated_at}")
    parts.append("Open-data import metadata: " + "; ".join(source_bits) + ".")
    return "\n".join(parts)


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    normalized = str(value).strip()
    return normalized or None


def _optional_int(value: Any) -> int | None:
    if _is_blank(value):
        return None
    return int(float(str(value).strip().replace(",", ".")))


def _required_float(value: Any, field_name: str) -> float:
    if _is_blank(value):
        raise PlannedInvestmentImportError(f"{field_name} is required")
    return float(str(value).replace(",", ".").strip())


def _is_blank(value: Any) -> bool:
    return value is None or str(value).strip() == ""


def _slugify(value: str) -> str:
    normalized = value.lower()
    normalized = (
        normalized.replace("ą", "a")
        .replace("ć", "c")
        .replace("ę", "e")
        .replace("ł", "l")
        .replace("ń", "n")
        .replace("ó", "o")
        .replace("ś", "s")
        .replace("ż", "z")
        .replace("ź", "z")
    )
    normalized = re.sub(r"[^a-z0-9]+", "-", normalized)
    return normalized.strip("-")
