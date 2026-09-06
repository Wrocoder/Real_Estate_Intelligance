"""Import authoritative Wrocław district/osiedle boundary polygons.

The importer intentionally accepts a local GeoJSON or ESRI Shapefile/ZIP. The
official Wrocław download is in EPSG:2177, while RCN points are in EPSG:2180;
PostGIS performs the CRS transformation during the assignment join.
"""

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
class DistrictBoundaryRecord:
    district: str
    slug: str
    source_crs: int
    geometry_wkt: str
    metadata: dict[str, Any]


@dataclass(frozen=True)
class DistrictBoundaryImportResult:
    source_name: str
    rows_seen: int
    boundaries_created: int
    boundaries_updated: int
    boundaries_removed: int
    dry_run: bool

    def as_dict(self) -> dict[str, object]:
        return {
            "source_name": self.source_name,
            "rows_seen": self.rows_seen,
            "boundaries_created": self.boundaries_created,
            "boundaries_updated": self.boundaries_updated,
            "boundaries_removed": self.boundaries_removed,
            "dry_run": self.dry_run,
        }


def import_district_boundaries(
    session: Session,
    location: str | Path,
    *,
    source_name: str,
    source_url: str | None = DEFAULT_BOUNDARY_SOURCE_URL,
    source_crs: int = DEFAULT_BOUNDARY_CRS,
    dry_run: bool = False,
) -> DistrictBoundaryImportResult:
    records = load_district_boundaries(location, source_crs=source_crs)
    if not records:
        raise DistrictBoundaryError("District boundary source contains no polygons.")
    if dry_run:
        return DistrictBoundaryImportResult(source_name, len(records), 0, 0, 0, True)

    existing = {
        row.slug: row
        for row in session.scalars(
            select(DistrictBoundary).where(DistrictBoundary.city == "Wrocław")
        ).all()
    }
    seen_slugs: set[str] = set()
    created = updated = 0
    now = datetime.now(UTC).replace(tzinfo=None)
    for record in records:
        seen_slugs.add(record.slug)
        row = existing.get(record.slug)
        if row is None:
            row = DistrictBoundary(id=f"wroclaw-{record.slug}", city="Wrocław", slug=record.slug)
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
    return DistrictBoundaryImportResult(source_name, len(records), created, updated, removed, False)


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
        with TemporaryDirectory(prefix="wroclaw-boundaries-") as temp_dir:
            with zipfile.ZipFile(path) as archive:
                archive.extractall(temp_dir)
            return _load_shapefile(Path(temp_dir), source_crs=source_crs)
    return _load_shapefile(path.parent, source_crs=source_crs, stem=path.stem)


def assign_transaction_districts(session: Session) -> dict[str, int]:
    """Assign only points covered by an imported boundary polygon.

    RCN uses EPSG:2180 and the city boundary download uses EPSG:2177. The
    query is deliberately a PostGIS join, preserving the source coordinates.
    """

    execute = getattr(session, "execute", None)
    if not callable(execute):
        return {"matched": 0, "unresolved": 0, "boundaries": 0}
    from sqlalchemy import text

    boundary_count = session.scalar(select(func.count()).select_from(DistrictBoundary)) or 0
    if boundary_count == 0:
        return {"matched": 0, "unresolved": 0, "boundaries": 0}
    matched = session.execute(
        text(
            """
            WITH boundaries AS MATERIALIZED (
                SELECT district, slug, source_name, source_url,
                       ST_Transform(
                           ST_GeomFromText(geometry_wkt, source_crs),
                           2180
                       ) AS geometry
                FROM district_boundaries
            )
            UPDATE transaction_observations AS observation
            SET district = boundary.district,
                area_id = 'wroclaw-' || boundary.slug,
                normalized_payload = observation.normalized_payload || jsonb_build_object(
                    'district', boundary.district,
                    'area_id', 'wroclaw-' || boundary.slug,
                    'district_assignment_source', boundary.source_name,
                    'district_assignment_source_url', boundary.source_url
                ),
                updated_at = CURRENT_TIMESTAMP
            FROM boundaries AS boundary
            WHERE observation.city = 'Wrocław'
              AND observation.geometry_x IS NOT NULL
              AND observation.geometry_y IS NOT NULL
              AND observation.geometry_crs ILIKE '%2180%'
              AND ST_Covers(
                    boundary.geometry,
                    ST_SetSRID(
                        ST_Point(observation.geometry_x, observation.geometry_y),
                        2180
                    )
              )
              AND (
                    observation.district IS DISTINCT FROM boundary.district
                 OR observation.area_id IS DISTINCT FROM 'wroclaw-' || boundary.slug
                 OR observation.normalized_payload->>'district_assignment_source'
                    IS DISTINCT FROM boundary.source_name
              )
            RETURNING observation.id
            """
        )
    ).fetchall()
    unresolved = session.scalar(
        select(func.count())
        .select_from(TransactionObservation)
        .where(
            TransactionObservation.city == "Wrocław",
            TransactionObservation.geometry_x.is_not(None),
            TransactionObservation.geometry_y.is_not(None),
            TransactionObservation.area_id == "wroclaw-city",
        )
    ) or 0
    return {"matched": len(matched), "unresolved": int(unresolved), "boundaries": boundary_count}


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
        name = _property_text(properties, "NAZWAOSIED", "name", "district", "osiedle")
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
        name = _property_text(properties, "NAZWAOSIED", "name", "district", "osiedle")
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
