from __future__ import annotations

import csv
import json
import re
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Any, Literal

from sqlalchemy.orm import Session

from domarion.db.models import (
    Amenity,
    IndustrialZone,
    Kindergarten,
    School,
    TransportRoute,
    TransportStop,
)
from domarion.schemas import (
    AmenityReference,
    IndustrialZoneReference,
    KindergartenReference,
    SchoolReference,
    TransportRouteReference,
    TransportStopReference,
)

InfrastructureImportLayer = Literal[
    "transport_stops",
    "transport_routes",
    "schools",
    "kindergartens",
    "amenities",
    "industrial_zones",
]
InfrastructureReference = (
    AmenityReference
    | IndustrialZoneReference
    | KindergartenReference
    | SchoolReference
    | TransportRouteReference
    | TransportStopReference
)


class InfrastructureReferenceImportError(ValueError):
    pass


@dataclass(frozen=True)
class InfrastructureReferenceImportRecord:
    layer: InfrastructureImportLayer
    item: InfrastructureReference


@dataclass
class InfrastructureReferenceImportResult:
    rows_seen: int = 0
    created: int = 0
    updated: int = 0
    skipped: int = 0
    dry_run: bool = False
    layer_counts: dict[str, int] = field(default_factory=dict)
    item_ids: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        return {
            "rows_seen": self.rows_seen,
            "created": self.created,
            "updated": self.updated,
            "skipped": self.skipped,
            "dry_run": self.dry_run,
            "layer_counts": self.layer_counts,
            "item_ids": self.item_ids,
            "errors": self.errors,
        }


LAYER_ALIASES: dict[str, InfrastructureImportLayer] = {
    "transport_stop": "transport_stops",
    "transport_stops": "transport_stops",
    "stop": "transport_stops",
    "stops": "transport_stops",
    "transport_route": "transport_routes",
    "transport_routes": "transport_routes",
    "route": "transport_routes",
    "routes": "transport_routes",
    "school": "schools",
    "schools": "schools",
    "szkola": "schools",
    "szkoła": "schools",
    "kindergarten": "kindergartens",
    "kindergartens": "kindergartens",
    "przedszkole": "kindergartens",
    "amenity": "amenities",
    "amenities": "amenities",
    "poi": "amenities",
    "park": "amenities",
    "healthcare": "amenities",
    "industrial_zone": "industrial_zones",
    "industrial_zones": "industrial_zones",
    "industry": "industrial_zones",
}
def read_infrastructure_reference_records(
    path: str | Path,
    *,
    default_layer: str | None = None,
    default_source_name: str | None = None,
) -> list[InfrastructureReferenceImportRecord]:
    source_path = Path(path)
    if not source_path.exists():
        raise InfrastructureReferenceImportError(f"Infrastructure file not found: {source_path}")

    if source_path.suffix.lower() == ".json":
        rows, file_layer, source_name = _read_json_rows(source_path, default_source_name)
    elif source_path.suffix.lower() == ".csv":
        rows, file_layer, source_name = _read_csv_rows(source_path, default_source_name)
    else:
        raise InfrastructureReferenceImportError(
            "Supported infrastructure reference formats: .json, .csv"
        )

    fallback_layer = (
        _normalize_layer(default_layer or file_layer) if default_layer or file_layer else None
    )
    records = []
    errors = []
    for index, row in enumerate(rows, start=1):
        try:
            records.append(
                _row_to_record(
                    row,
                    default_layer=fallback_layer,
                    source_name=source_name,
                )
            )
        except (KeyError, TypeError, ValueError) as exc:
            errors.append(f"row {index}: {exc}")

    if errors:
        raise InfrastructureReferenceImportError("; ".join(errors))
    return records


def dry_run_infrastructure_references(
    path: str | Path,
    *,
    default_layer: str | None = None,
    default_source_name: str | None = None,
) -> InfrastructureReferenceImportResult:
    records = read_infrastructure_reference_records(
        path,
        default_layer=default_layer,
        default_source_name=default_source_name,
    )
    return InfrastructureReferenceImportResult(
        rows_seen=len(records),
        dry_run=True,
        layer_counts=dict(Counter(record.layer for record in records)),
        item_ids=[record.item.id for record in records],
    )


def import_infrastructure_references_in_session(
    session: Session,
    records: list[InfrastructureReferenceImportRecord],
) -> InfrastructureReferenceImportResult:
    result = InfrastructureReferenceImportResult(
        rows_seen=len(records),
        layer_counts=dict(Counter(record.layer for record in records)),
    )
    for record in records:
        created = _upsert_record(session, record)
        result.created += int(created)
        result.updated += int(not created)
        result.item_ids.append(record.item.id)
    session.flush()
    return result


def import_infrastructure_references(
    path: str | Path,
    session: Session,
    *,
    default_layer: str | None = None,
    default_source_name: str | None = None,
    dry_run: bool = False,
) -> InfrastructureReferenceImportResult:
    records = read_infrastructure_reference_records(
        path,
        default_layer=default_layer,
        default_source_name=default_source_name,
    )
    if dry_run:
        return InfrastructureReferenceImportResult(
            rows_seen=len(records),
            dry_run=True,
            layer_counts=dict(Counter(record.layer for record in records)),
            item_ids=[record.item.id for record in records],
        )
    return import_infrastructure_references_in_session(session, records)


def _read_json_rows(
    path: Path,
    default_source_name: str | None,
) -> tuple[list[dict[str, Any]], str | None, str | None]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(payload, list):
        return payload, None, default_source_name
    if isinstance(payload, dict):
        items = payload.get("items")
        if not isinstance(items, list):
            raise InfrastructureReferenceImportError(
                "JSON infrastructure file must contain an items list"
            )
        source_name = _optional_str(payload.get("source_name")) or default_source_name
        return items, _optional_str(payload.get("layer")), source_name
    raise InfrastructureReferenceImportError("JSON infrastructure file must be an object or list")


def _read_csv_rows(
    path: Path,
    default_source_name: str | None,
) -> tuple[list[dict[str, Any]], str | None, str | None]:
    with path.open("r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)
        if reader.fieldnames is None:
            raise InfrastructureReferenceImportError("CSV file has no header")
        return list(reader), None, default_source_name


def _row_to_record(
    row: dict[str, Any],
    *,
    default_layer: InfrastructureImportLayer | None,
    source_name: str | None,
) -> InfrastructureReferenceImportRecord:
    layer = _normalize_layer(_row_value(row, "layer") or default_layer)
    metadata = _metadata(row, source_name=source_name, layer=layer)
    if layer == "transport_stops":
        item = TransportStopReference(
            **_common_point_fields(row, metadata=metadata, id_prefix="stop"),
            stop_type=_required_str(_row_value(row, "stop_type"), "stop_type"),
            lines=_optional_str_list(_row_value(row, "lines")),
        )
    elif layer == "transport_routes":
        item = TransportRouteReference(
            **_common_route_fields(row, metadata=metadata, id_prefix="route"),
            route_number=_required_str(_row_value(row, "route_number"), "route_number"),
            route_name=_required_str(_row_value(row, "route_name"), "route_name"),
            route_type=_required_str(_row_value(row, "route_type"), "route_type"),
            operator=_optional_str(_row_value(row, "operator")),
            status=_optional_str(_row_value(row, "status")) or "active",
            stop_ids=_optional_str_list(_row_value(row, "stop_ids")),
        )
    elif layer == "schools":
        item = SchoolReference(
            **_common_point_fields(row, metadata=metadata, id_prefix="school"),
            school_type=_required_str(_row_value(row, "school_type"), "school_type"),
            operator_type=_optional_str(_row_value(row, "operator_type")),
        )
    elif layer == "kindergartens":
        item = KindergartenReference(
            **_common_point_fields(row, metadata=metadata, id_prefix="kindergarten"),
            kindergarten_type=_required_str(
                _row_value(row, "kindergarten_type"),
                "kindergarten_type",
            ),
            operator_type=_optional_str(_row_value(row, "operator_type")),
        )
    elif layer == "amenities":
        item = AmenityReference(
            **_common_point_fields(row, metadata=metadata, id_prefix="amenity"),
            amenity_type=_required_str(_row_value(row, "amenity_type"), "amenity_type"),
        )
    else:
        item = IndustrialZoneReference(
            **_common_point_fields(row, metadata=metadata, id_prefix="industrial-zone"),
            zone_type=_required_str(_row_value(row, "zone_type"), "zone_type"),
            risk_level=_optional_str(_row_value(row, "risk_level")) or "unknown",
            impact_radius_m=_optional_int(_row_value(row, "impact_radius_m")),
        )
    return InfrastructureReferenceImportRecord(layer=layer, item=item)


def _common_point_fields(
    row: dict[str, Any],
    *,
    metadata: dict[str, Any],
    id_prefix: str,
) -> dict[str, Any]:
    name = _required_str(_row_value(row, "name"), "name")
    municipality_id = _required_str(_row_value(row, "municipality_id"), "municipality_id")
    return {
        "id": _record_id(row, id_prefix, municipality_id, name),
        "municipality_id": municipality_id,
        "municipality_name": _optional_str(_row_value(row, "municipality_name")) or municipality_id,
        "district_id": _optional_str(_row_value(row, "district_id")),
        "district_name": _optional_str(_row_value(row, "district_name")),
        "name": name,
        "lat": _optional_float(_row_value(row, "lat")),
        "lon": _optional_float(_row_value(row, "lon")),
        "source_url": _optional_str(_row_value(row, "source_url")),
        "metadata": metadata,
    }


def _common_route_fields(
    row: dict[str, Any],
    *,
    metadata: dict[str, Any],
    id_prefix: str,
) -> dict[str, Any]:
    route_name = _required_str(_row_value(row, "route_name"), "route_name")
    municipality_id = _required_str(_row_value(row, "municipality_id"), "municipality_id")
    return {
        "id": _record_id(row, id_prefix, municipality_id, route_name),
        "municipality_id": municipality_id,
        "municipality_name": _optional_str(_row_value(row, "municipality_name")) or municipality_id,
        "district_id": _optional_str(_row_value(row, "district_id")),
        "district_name": _optional_str(_row_value(row, "district_name")),
        "metadata": metadata,
    }


def _upsert_record(
    session: Session,
    record: InfrastructureReferenceImportRecord,
) -> bool:
    if record.layer == "transport_stops":
        return _upsert_transport_stop(session, record.item)
    if record.layer == "transport_routes":
        return _upsert_transport_route(session, record.item)
    if record.layer == "schools":
        return _upsert_school(session, record.item)
    if record.layer == "kindergartens":
        return _upsert_kindergarten(session, record.item)
    if record.layer == "amenities":
        return _upsert_amenity(session, record.item)
    return _upsert_industrial_zone(session, record.item)


def _upsert_transport_stop(session: Session, item: TransportStopReference) -> bool:
    row = session.get(TransportStop, item.id)
    created = row is None
    if row is None:
        row = TransportStop(id=item.id)
        session.add(row)
    _apply_point_reference(row, item)
    row.stop_type = item.stop_type
    row.lines_json = item.lines
    session.flush()
    return created


def _upsert_transport_route(session: Session, item: TransportRouteReference) -> bool:
    row = session.get(TransportRoute, item.id)
    created = row is None
    if row is None:
        row = TransportRoute(id=item.id)
        session.add(row)
    row.municipality_id = item.municipality_id
    row.district_id = item.district_id
    row.route_number = item.route_number
    row.route_name = item.route_name
    row.route_type = item.route_type
    row.operator = item.operator
    row.status = item.status
    row.stop_ids_json = item.stop_ids
    row.metadata_json = item.metadata
    row.updated_at = datetime.utcnow()
    session.flush()
    return created


def _upsert_school(session: Session, item: SchoolReference) -> bool:
    row = session.get(School, item.id)
    created = row is None
    if row is None:
        row = School(id=item.id)
        session.add(row)
    _apply_point_reference(row, item)
    row.school_type = item.school_type
    row.operator_type = item.operator_type
    session.flush()
    return created


def _upsert_kindergarten(session: Session, item: KindergartenReference) -> bool:
    row = session.get(Kindergarten, item.id)
    created = row is None
    if row is None:
        row = Kindergarten(id=item.id)
        session.add(row)
    _apply_point_reference(row, item)
    row.kindergarten_type = item.kindergarten_type
    row.operator_type = item.operator_type
    session.flush()
    return created


def _upsert_amenity(session: Session, item: AmenityReference) -> bool:
    row = session.get(Amenity, item.id)
    created = row is None
    if row is None:
        row = Amenity(id=item.id)
        session.add(row)
    _apply_point_reference(row, item)
    row.amenity_type = item.amenity_type
    session.flush()
    return created


def _upsert_industrial_zone(session: Session, item: IndustrialZoneReference) -> bool:
    row = session.get(IndustrialZone, item.id)
    created = row is None
    if row is None:
        row = IndustrialZone(id=item.id)
        session.add(row)
    _apply_point_reference(row, item)
    row.zone_type = item.zone_type
    row.risk_level = item.risk_level
    row.impact_radius_m = item.impact_radius_m
    session.flush()
    return created


def _apply_point_reference(row, item: InfrastructureReference) -> None:
    row.municipality_id = item.municipality_id
    row.district_id = item.district_id
    row.name = item.name
    row.lat = _optional_decimal(item.lat)
    row.lon = _optional_decimal(item.lon)
    row.source_url = item.source_url
    row.metadata_json = item.metadata
    row.updated_at = datetime.utcnow()


def _row_value(row: dict[str, Any], field_name: str) -> Any:
    aliases = {
        "layer": ("layer", "reference_layer"),
        "id": ("id", "source_id", "external_id"),
        "municipality_id": ("municipality_id", "municipality", "city_id"),
        "municipality_name": ("municipality_name", "city", "municipality_label"),
        "district_id": ("district_id", "district_slug", "area_id"),
        "district_name": ("district_name", "district", "osiedle"),
        "name": ("name", "title", "label"),
        "lat": ("lat", "latitude", "y"),
        "lon": ("lon", "lng", "longitude", "x"),
        "source_url": ("source_url", "url", "link"),
        "stop_type": ("stop_type", "type"),
        "route_number": ("route_number", "number", "line", "line_number"),
        "route_name": ("route_name", "name", "title"),
        "route_type": ("route_type", "type", "mode"),
        "school_type": ("school_type", "type"),
        "kindergarten_type": ("kindergarten_type", "type"),
        "amenity_type": ("amenity_type", "type", "category"),
        "zone_type": ("zone_type", "type", "category"),
        "operator_type": ("operator_type", "operator_kind"),
        "operator": ("operator", "agency"),
        "status": ("status",),
        "lines": ("lines", "route_numbers"),
        "stop_ids": ("stop_ids", "stops"),
        "risk_level": ("risk_level", "risk"),
        "impact_radius_m": ("impact_radius_m", "radius_m"),
    }
    for alias in aliases.get(field_name, (field_name,)):
        if alias in row:
            return row[alias]
    coordinates = row.get("coordinates")
    if isinstance(coordinates, dict):
        if field_name == "lat":
            return coordinates.get("lat") or coordinates.get("latitude")
        if field_name == "lon":
            return coordinates.get("lon") or coordinates.get("lng") or coordinates.get("longitude")
    return None


def _metadata(
    row: dict[str, Any],
    *,
    source_name: str | None,
    layer: InfrastructureImportLayer,
) -> dict[str, Any]:
    raw_metadata = row.get("metadata") if isinstance(row.get("metadata"), dict) else {}
    metadata = {
        **raw_metadata,
        "source_name": _optional_str(row.get("source_name")) or source_name,
        "source_updated_at": _optional_str(row.get("source_updated_at")),
        "infrastructure_layer": layer,
    }
    return {key: value for key, value in metadata.items() if value is not None}


def _record_id(row: dict[str, Any], prefix: str, municipality_id: str, name: str) -> str:
    value = _optional_str(_row_value(row, "id"))
    if value:
        return value
    return f"{prefix}-{_slugify(municipality_id)}-{_slugify(name)}"


def _normalize_layer(value: Any) -> InfrastructureImportLayer:
    normalized = _slugify(_required_str(value, "layer")).replace("-", "_")
    try:
        return LAYER_ALIASES[normalized]
    except KeyError as exc:
        allowed = ", ".join(sorted(set(LAYER_ALIASES.values())))
        raise InfrastructureReferenceImportError(
            f"unsupported infrastructure layer '{value}'. Use one of: {allowed}"
        ) from exc


def _required_str(value: Any, field_name: str) -> str:
    normalized = _optional_str(value)
    if normalized is None:
        raise InfrastructureReferenceImportError(f"{field_name} is required")
    return normalized


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    normalized = str(value).strip()
    return normalized or None


def _optional_str_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [item for item in (_optional_str(item) for item in value) if item]
    return [item.strip() for item in str(value).split(",") if item.strip()]


def _optional_int(value: Any) -> int | None:
    if _optional_str(value) is None:
        return None
    return int(float(str(value).strip().replace(",", ".")))


def _optional_float(value: Any) -> float | None:
    if _optional_str(value) is None:
        return None
    return float(str(value).strip().replace(",", "."))


def _optional_decimal(value: float | None) -> Decimal | None:
    if value is None:
        return None
    return Decimal(str(value))


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
