"""Import authoritative city district/osiedle boundary polygons."""

from __future__ import annotations

import json
import struct
import zipfile
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from domarion.db.models import DistrictBoundary, TransactionObservation
from domarion.ingestion.partner_csv import slugify

DEFAULT_BOUNDARY_SOURCE_URL = "https://geoportal.wroclaw.pl/www/pliki/osiedla/granice-osiedli.zip"
DEFAULT_BOUNDARY_CRS = 2177
class DistrictBoundaryError(ValueError):
    pass


@dataclass(frozen=True)
class DistrictBoundarySourceConfig:
    city: str
    location: str
    source_name: str
    source_url: str | None
    source_crs: int


@dataclass(frozen=True)
class DistrictBoundaryRecord:
    district: str
    slug: str
    source_crs: int
    geometry_wkt: str
    metadata: dict[str, Any]


@dataclass(frozen=True)
class DistrictBoundaryImportResult:
    city: str
    source_name: str
    rows_seen: int
    boundaries_created: int
    boundaries_updated: int
    boundaries_removed: int
    dry_run: bool

    def as_dict(self) -> dict[str, object]:
        return {
            "city": self.city,
            "source_name": self.source_name,
            "rows_seen": self.rows_seen,
            "boundaries_created": self.boundaries_created,
            "boundaries_updated": self.boundaries_updated,
            "boundaries_removed": self.boundaries_removed,
            "dry_run": self.dry_run,
        }


def load_district_boundary_manifest(
    location: str | Path,
) -> tuple[DistrictBoundarySourceConfig, ...]:
    path = Path(location)
    if not path.exists() or not path.is_file():
        raise DistrictBoundaryError(f"District boundary manifest does not exist: {path}")
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise DistrictBoundaryError(f"Invalid district boundary manifest JSON: {exc}") from exc
    if not isinstance(payload, list) or not payload:
        raise DistrictBoundaryError("District boundary manifest must be a non-empty JSON array.")

    configs: list[DistrictBoundarySourceConfig] = []
    seen_cities: set[str] = set()
    for index, item in enumerate(payload, start=1):
        if not isinstance(item, dict):
            raise DistrictBoundaryError(f"Boundary manifest entry {index} must be an object.")
        city = str(item.get("city") or "").strip()
        source_location = str(item.get("location") or "").strip()
        source_name = str(item.get("source_name") or "").strip()
        if not city or not source_location or not source_name:
            raise DistrictBoundaryError(
                f"Boundary manifest entry {index} requires city, location and source_name."
            )
        city_key = city.casefold()
        if city_key in seen_cities:
            raise DistrictBoundaryError(f"Duplicate boundary city in manifest: {city}")
        seen_cities.add(city_key)
        source_path = Path(source_location)
        if not source_path.is_absolute():
            source_path = path.parent / source_path
        try:
            source_crs = int(item.get("source_crs") or 2180)
        except (TypeError, ValueError) as exc:
            raise DistrictBoundaryError(
                f"Boundary manifest entry {index} has an invalid source_crs."
            ) from exc
        if source_crs <= 0:
            raise DistrictBoundaryError(
                f"Boundary manifest entry {index} has an invalid source_crs."
            )
        source_url_value = item.get("source_url")
        configs.append(
            DistrictBoundarySourceConfig(
                city=city,
                location=str(source_path),
                source_name=source_name,
                source_url=(
                    str(source_url_value).strip() if source_url_value is not None else None
                ),
                source_crs=source_crs,
            )
        )
    return tuple(configs)


def import_district_boundaries(
    session: Session,
    location: str | Path,
    *,
    city: str = "Wrocław",
    source_name: str,
    source_url: str | None = DEFAULT_BOUNDARY_SOURCE_URL,
    source_crs: int = DEFAULT_BOUNDARY_CRS,
    dry_run: bool = False,
) -> DistrictBoundaryImportResult:
    city = city.strip()
    if not city or len(city) > 80:
        raise DistrictBoundaryError("Boundary city must contain 1-80 characters.")
    records = load_district_boundaries(location, source_crs=source_crs)
    if not records:
        raise DistrictBoundaryError("District boundary source contains no polygons.")
    if dry_run:
        return DistrictBoundaryImportResult(city, source_name, len(records), 0, 0, 0, True)

    existing = {
        row.slug: row
        for row in session.scalars(
            select(DistrictBoundary).where(DistrictBoundary.city == city)
        ).all()
    }
    seen_slugs: set[str] = set()
    created = updated = 0
    now = datetime.now(UTC).replace(tzinfo=None)
    for record in records:
        seen_slugs.add(record.slug)
        row = existing.get(record.slug)
        if row is None:
            row = DistrictBoundary(
                id=f"{slugify(city)}-{record.slug}",
                city=city,
                slug=record.slug,
            )
            session.add(row)
            created += 1
        else:
            updated += 1
        row.district = record.district
        row.source_name = source_name
        row.source_url = source_url
        row.source_crs = record.source_crs
        row.geometry_wkt = record.geometry_wkt
        row.metadata_json = record.metadata
        row.updated_at = now

    removed = 0
    for slug, row in existing.items():
        if slug not in seen_slugs:
            session.delete(row)
            removed += 1
    session.flush()
    return DistrictBoundaryImportResult(
        city,
        source_name,
        len(records),
        created,
        updated,
        removed,
        False,
    )


def load_district_boundaries(
    location: str | Path,
    *,
    source_crs: int = DEFAULT_BOUNDARY_CRS,
) -> list[DistrictBoundaryRecord]:
    path = Path(location)
    if not path.exists():
        raise DistrictBoundaryError(f"District boundary source does not exist: {path}")
    if path.suffix.casefold() in {".json", ".geojson"}:
        return _load_geojson(path.read_text(encoding="utf-8"), source_crs=source_crs)
    if path.suffix.casefold() == ".zip":
        with TemporaryDirectory(prefix="city-boundaries-") as temp_dir:
            with zipfile.ZipFile(path) as archive:
                archive.extractall(temp_dir)
            return _load_shapefile(Path(temp_dir), source_crs=source_crs)
    return _load_shapefile(path.parent, source_crs=source_crs, stem=path.stem)


def assign_transaction_districts(
    session: Session,
    *,
    cities: list[str] | tuple[str, ...] | set[str] | None = None,
) -> dict[str, object]:
    """Assign only points covered by an authoritative city boundary polygon.

    RCN uses EPSG:2180. Each boundary row retains its declared source CRS and
    PostGIS transforms it during the join, preserving the source coordinates.
    """

    execute = getattr(session, "execute", None)
    if not callable(execute):
        return {
            "matched": 0,
            "reset": 0,
            "unresolved": 0,
            "boundaries": 0,
            "cities": [],
            "affected_scopes": [],
        }
    from sqlalchemy import text

    requested_cities = sorted({city for city in cities or () if city})
    city_filter = (
        (DistrictBoundary.city.in_(requested_cities),) if requested_cities else ()
    )
    boundary_count = session.scalar(
        select(func.count()).select_from(DistrictBoundary).where(*city_filter)
    ) or 0
    if boundary_count == 0:
        return {
            "matched": 0,
            "reset": 0,
            "unresolved": 0,
            "boundaries": 0,
            "cities": [],
            "affected_scopes": [],
        }
    boundary_cities = session.scalars(
        select(DistrictBoundary.city).where(*city_filter).distinct()
    ).all()
    target_cities = sorted(set(boundary_cities))
    matched = session.execute(
        text(
            """
            WITH boundaries AS MATERIALIZED (
                SELECT id, city, district, slug, source_name, source_url,
                       ST_Transform(
                           ST_GeomFromText(geometry_wkt, source_crs),
                           2180
                       ) AS geometry
                FROM district_boundaries
                WHERE city = ANY(:cities)
            ), assignments AS MATERIALIZED (
                SELECT DISTINCT ON (observation.id)
                       observation.id,
                       observation.city,
                       observation.area_id AS old_area_id,
                       boundary.id AS new_area_id,
                       boundary.district,
                       boundary.source_name,
                       boundary.source_url
                FROM transaction_observations AS observation
                JOIN boundaries AS boundary ON boundary.city = observation.city
                WHERE observation.geometry_x IS NOT NULL
                  AND observation.geometry_y IS NOT NULL
                  AND observation.geometry_crs ILIKE '%2180%'
                  AND ST_Covers(
                        boundary.geometry,
                        ST_SetSRID(
                            ST_Point(observation.geometry_x, observation.geometry_y),
                            2180
                        )
                )
                ORDER BY observation.id, boundary.id
            ), unmatched AS MATERIALIZED (
                SELECT observation.id,
                       observation.city,
                       observation.area_id AS old_area_id,
                       COALESCE(
                           observation.normalized_payload->>'locality_area_id',
                           CASE WHEN observation.city = 'Wrocław' THEN 'wroclaw-city' END
                       ) AS new_area_id
                FROM transaction_observations AS observation
                WHERE observation.city = ANY(:cities)
                  AND observation.normalized_payload ? 'district_assignment_source'
                  AND NOT EXISTS (
                        SELECT 1 FROM assignments
                        WHERE assignments.id = observation.id
                  )
            ), updated AS (
            UPDATE transaction_observations AS observation
            SET district = assignment.district,
                area_id = assignment.new_area_id,
                normalized_payload = observation.normalized_payload || jsonb_build_object(
                    'district', assignment.district,
                    'area_id', assignment.new_area_id,
                    'district_assignment_source', assignment.source_name,
                    'district_assignment_source_url', assignment.source_url
                ),
                updated_at = CURRENT_TIMESTAMP
            FROM assignments AS assignment
            WHERE observation.id = assignment.id
              AND (
                    observation.district IS DISTINCT FROM assignment.district
                 OR observation.area_id IS DISTINCT FROM assignment.new_area_id
                 OR observation.normalized_payload->>'district_assignment_source'
                    IS DISTINCT FROM assignment.source_name
              )
            RETURNING assignment.city, assignment.old_area_id, assignment.new_area_id
            ), reset AS (
            UPDATE transaction_observations AS observation
            SET district = NULL,
                area_id = unmatched.new_area_id,
                normalized_payload = (
                    observation.normalized_payload
                    - 'district'
                    - 'area_id'
                    - 'district_assignment_source'
                    - 'district_assignment_source_url'
                ) || jsonb_build_object(
                    'district', NULL,
                    'area_id', unmatched.new_area_id
                ),
                updated_at = CURRENT_TIMESTAMP
            FROM unmatched
            WHERE observation.id = unmatched.id
              AND unmatched.new_area_id IS NOT NULL
            RETURNING unmatched.city, unmatched.old_area_id, unmatched.new_area_id
            )
            SELECT city, old_area_id, new_area_id, TRUE AS assigned FROM updated
            UNION ALL
            SELECT city, old_area_id, new_area_id, FALSE AS assigned FROM reset
            """
        ),
        {"cities": target_cities},
    ).fetchall()
    unresolved = session.scalar(
        select(func.count())
        .select_from(TransactionObservation)
        .where(
            TransactionObservation.city.in_(target_cities),
            TransactionObservation.geometry_x.is_not(None),
            TransactionObservation.geometry_y.is_not(None),
            TransactionObservation.district.is_(None),
        )
    ) or 0
    affected_scopes = {
        (str(city), str(area_id))
        for city, old_area_id, new_area_id, _assigned in matched
        for area_id in (old_area_id, new_area_id)
        if area_id
    }
    return {
        "matched": sum(1 for *_scope, assigned in matched if assigned),
        "reset": sum(1 for *_scope, assigned in matched if not assigned),
        "unresolved": int(unresolved),
        "boundaries": int(boundary_count),
        "cities": target_cities,
        "affected_scopes": sorted(affected_scopes),
    }


def _load_geojson(payload_text: str, *, source_crs: int) -> list[DistrictBoundaryRecord]:
    try:
        payload = json.loads(payload_text)
    except json.JSONDecodeError as exc:
        raise DistrictBoundaryError(f"Invalid district GeoJSON: {exc}") from exc
    features = payload.get("features") if isinstance(payload, dict) else None
    if not isinstance(features, list):
        raise DistrictBoundaryError("District GeoJSON must contain a features array.")
    records: list[DistrictBoundaryRecord] = []
    for feature in features:
        if not isinstance(feature, dict):
            continue
        properties = feature.get("properties")
        geometry = feature.get("geometry")
        if not isinstance(properties, dict) or not isinstance(geometry, dict):
            continue
        name = _boundary_name(properties)
        if not name:
            continue
        wkt = _geometry_to_wkt(geometry)
        records.append(
            DistrictBoundaryRecord(
                district=name,
                slug=slugify(name),
                source_crs=source_crs,
                geometry_wkt=wkt,
                metadata={"boundary_source_format": "geojson"},
            )
        )
    return records


def _load_shapefile(
    directory: Path,
    *,
    source_crs: int,
    stem: str | None = None,
) -> list[DistrictBoundaryRecord]:
    shp_files = [directory / f"{stem}.shp"] if stem else list(directory.rglob("*.shp"))
    if not shp_files or not shp_files[0].exists():
        raise DistrictBoundaryError("District source must be GeoJSON or an ESRI Shapefile/ZIP.")
    shp_path = shp_files[0]
    dbf_path = shp_path.with_suffix(".dbf")
    if not dbf_path.exists():
        raise DistrictBoundaryError(f"Shapefile companion DBF is missing: {dbf_path}")
    fields, rows = _read_dbf(dbf_path)
    geometry_rows = _read_polygon_shp(shp_path)
    if len(rows) != len(geometry_rows):
        raise DistrictBoundaryError("Shapefile and DBF record counts do not match.")
    records = []
    for properties, geometry_wkt in zip(rows, geometry_rows, strict=True):
        name = _boundary_name(properties)
        if not name:
            continue
        records.append(
            DistrictBoundaryRecord(
                district=name,
                slug=slugify(name),
                source_crs=source_crs,
                geometry_wkt=geometry_wkt,
                metadata={"boundary_source_format": "esri_shapefile", "fields": fields},
            )
        )
    return records


def _read_dbf(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    payload = path.read_bytes()
    header_length = struct.unpack_from("<H", payload, 8)[0]
    record_count = struct.unpack_from("<I", payload, 4)[0]
    record_length = struct.unpack_from("<H", payload, 10)[0]
    fields: list[tuple[str, int]] = []
    position = 32
    while position < header_length - 1:
        descriptor = payload[position : position + 32]
        name = descriptor[:11].split(b"\0", 1)[0].decode("ascii", "ignore").strip()
        fields.append((name, descriptor[16]))
        position += 32
    encoding = "utf-8"
    cpg_path = path.with_suffix(".cpg")
    if cpg_path.exists():
        encoding = cpg_path.read_text(encoding="ascii", errors="ignore").strip() or encoding
    rows: list[dict[str, str]] = []
    for index in range(record_count):
        start = header_length + index * record_length
        raw_record = payload[start : start + record_length]
        if not raw_record or raw_record[:1] == b"*":
            continue
        offset = 1
        values: dict[str, str] = {}
        for name, width in fields:
            values[name] = raw_record[offset : offset + width].decode(encoding, "ignore").strip()
            offset += width
        rows.append(values)
    return [name for name, _ in fields], rows


def _read_polygon_shp(path: Path) -> list[str]:
    payload = path.read_bytes()
    position = 100
    geometries: list[str] = []
    while position + 8 <= len(payload):
        _, content_words = struct.unpack_from(">ii", payload, position)
        content_start = position + 8
        shape_type = struct.unpack_from("<i", payload, content_start)[0]
        if shape_type == 0:
            geometries.append("MULTIPOLYGON EMPTY")
        elif shape_type == 5:
            geometries.append(_polygon_wkt(payload, content_start))
        else:
            raise DistrictBoundaryError(f"Unsupported Shapefile geometry type: {shape_type}")
        position += 8 + content_words * 2
    return geometries


def _polygon_wkt(payload: bytes, start: int) -> str:
    parts_count = struct.unpack_from("<i", payload, start + 36)[0]
    points_count = struct.unpack_from("<i", payload, start + 40)[0]
    parts = struct.unpack_from(f"<{parts_count}i", payload, start + 44)
    points_start = start + 44 + parts_count * 4
    points = [
        struct.unpack_from("<dd", payload, points_start + index * 16)
        for index in range(points_count)
    ]
    rings: list[str] = []
    for index, part_start in enumerate(parts):
        part_end = parts[index + 1] if index + 1 < parts_count else points_count
        ring = points[part_start:part_end]
        if len(ring) < 4:
            continue
        rings.append("(" + ",".join(f"{x:.3f} {y:.3f}" for x, y in ring) + ")")
    if not rings:
        return "MULTIPOLYGON EMPTY"
    return "MULTIPOLYGON(" + ",".join("(" + ring + ")" for ring in rings) + ")"


def _geometry_to_wkt(geometry: dict[str, Any]) -> str:
    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates")
    if geometry_type == "Polygon" and isinstance(coordinates, list):
        polygons = [coordinates]
    elif geometry_type == "MultiPolygon" and isinstance(coordinates, list):
        polygons = coordinates
    else:
        raise DistrictBoundaryError(f"Unsupported GeoJSON geometry type: {geometry_type}")
    return "MULTIPOLYGON(" + ",".join(
        "(" + ",".join(
            "(" + ",".join(f"{point[0]} {point[1]}" for point in ring) + ")"
            for ring in polygon
        ) + ")"
        for polygon in polygons
    ) + ")"


def _property_text(properties: dict[str, Any], *keys: str) -> str | None:
    folded = {str(key).casefold(): value for key, value in properties.items()}
    for key in keys:
        value = folded.get(key.casefold())
        if value is not None and str(value).strip():
            return str(value).strip()
    return None


def _boundary_name(properties: dict[str, Any]) -> str | None:
    return _property_text(
        properties,
        "NAZWAOSIED",
        "NAZWA_DZ",
        "NAZWA",
        "DZIELNICA",
        "OSIEDLE",
        "JEDN_POM",
        "name",
        "district",
    )
