from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from domarion.db.models import ListingSnapshot, Property, PropertySource
from domarion.schemas import InfrastructureEnrichmentItem, InfrastructureEnrichmentJobResult

ENRICHMENT_FIELDS = (
    "distance_to_center_km",
    "nearest_stop_m",
    "nearest_school_m",
    "nearest_industrial_zone_m",
    "parks_within_1km",
    "schools_within_1km",
    "planned_investments_within_2km",
)


def run_infrastructure_enrichment_job(
    session: Session,
    dry_run: bool = True,
    limit: int = 1_000,
    calculated_at: datetime | None = None,
) -> InfrastructureEnrichmentJobResult:
    timestamp = calculated_at or datetime.utcnow()
    rows = session.execute(
        text(
            """
            select
                p.id as property_id,
                latest.listing_id as listing_id,
                p.city as city,
                p.district as district,
                p.distance_to_center_km as current_distance_to_center_km,
                p.nearest_stop_m as current_nearest_stop_m,
                p.nearest_school_m as current_nearest_school_m,
                p.nearest_industrial_zone_m as current_nearest_industrial_zone_m,
                p.parks_within_1km as current_parks_within_1km,
                p.schools_within_1km as current_schools_within_1km,
                p.planned_investments_within_2km as current_planned_investments_within_2km,
                round(center.distance_to_center_km::numeric, 2) as distance_to_center_km,
                stop.nearest_stop_m as nearest_stop_m,
                school.nearest_school_m as nearest_school_m,
                industrial.nearest_industrial_zone_m as nearest_industrial_zone_m,
                coalesce(parks.parks_within_1km, 0) as parks_within_1km,
                coalesce(school_count.schools_within_1km, 0) as schools_within_1km,
                coalesce(planned.planned_investments_within_2km, 0)
                    as planned_investments_within_2km
            from properties p
            left join municipalities m
                on lower(m.name) = lower(coalesce(p.municipality, p.city))
               and m.lat is not null
               and m.lon is not null
            left join lateral (
                select ST_Distance(
                    p.geom::geography,
                    ST_SetSRID(
                        ST_MakePoint(m.lon::double precision, m.lat::double precision),
                        4326
                    )::geography
                ) / 1000.0 as distance_to_center_km
                where m.id is not null
            ) center on true
            left join lateral (
                select round(ST_Distance(p.geom::geography, ts.geom::geography))::int
                    as nearest_stop_m
                from transport_stops ts
                where ts.geom is not null
                order by p.geom <-> ts.geom
                limit 1
            ) stop on true
            left join lateral (
                select round(ST_Distance(p.geom::geography, s.geom::geography))::int
                    as nearest_school_m
                from schools s
                where s.geom is not null
                order by p.geom <-> s.geom
                limit 1
            ) school on true
            left join lateral (
                select round(ST_Distance(p.geom::geography, iz.geom::geography))::int
                    as nearest_industrial_zone_m
                from industrial_zones iz
                where iz.geom is not null
                order by p.geom <-> iz.geom
                limit 1
            ) industrial on true
            left join lateral (
                select count(*)::int as parks_within_1km
                from amenities a
                where a.geom is not null
                  and a.amenity_type = 'park'
                  and ST_DWithin(p.geom::geography, a.geom::geography, 1000)
            ) parks on true
            left join lateral (
                select count(*)::int as schools_within_1km
                from schools s
                where s.geom is not null
                  and ST_DWithin(p.geom::geography, s.geom::geography, 1000)
            ) school_count on true
            left join lateral (
                select count(*)::int as planned_investments_within_2km
                from planned_investments pi
                where pi.geom is not null
                  and ST_DWithin(p.geom::geography, pi.geom::geography, 2000)
            ) planned on true
            left join lateral (
                select snap.normalized_payload ->> 'id' as listing_id
                from property_sources ps
                join listing_snapshots snap on snap.property_source_id = ps.id
                where ps.property_id = p.id
                  and snap.normalized_payload ? 'id'
                order by snap.observed_at desc
                limit 1
            ) latest on true
            where p.geom is not null
            order by p.id
            limit :limit
            """
        ),
        {"limit": limit},
    ).mappings().all()

    items: list[InfrastructureEnrichmentItem] = []
    properties_with_changes = 0
    properties_updated = 0
    snapshots_updated = 0

    for row in rows:
        values = _enrichment_values(row)
        changed_fields = _changed_fields(row, values)
        if changed_fields:
            properties_with_changes += 1

        items.append(
            InfrastructureEnrichmentItem(
                property_id=row["property_id"],
                listing_id=row["listing_id"],
                city=row["city"],
                district=row["district"],
                changed_fields=changed_fields,
                **values,
            )
        )

        if dry_run or not changed_fields:
            continue

        property_row = session.get(Property, row["property_id"])
        if property_row is None:
            continue
        _apply_property_values(property_row, values)
        properties_updated += 1
        snapshots_updated += _update_snapshot_payloads(session, property_row.id, values)

    if not dry_run:
        session.flush()

    return InfrastructureEnrichmentJobResult(
        calculated_at=timestamp,
        dry_run=dry_run,
        properties_seen=len(rows),
        properties_with_changes=properties_with_changes,
        properties_updated=properties_updated,
        snapshots_updated=snapshots_updated,
        items=items,
    )


def _enrichment_values(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "distance_to_center_km": _optional_float(row["distance_to_center_km"]),
        "nearest_stop_m": _optional_int(row["nearest_stop_m"]),
        "nearest_school_m": _optional_int(row["nearest_school_m"]),
        "nearest_industrial_zone_m": _optional_int(row["nearest_industrial_zone_m"]),
        "parks_within_1km": _optional_int(row["parks_within_1km"]) or 0,
        "schools_within_1km": _optional_int(row["schools_within_1km"]) or 0,
        "planned_investments_within_2km": (
            _optional_int(row["planned_investments_within_2km"]) or 0
        ),
    }


def _changed_fields(row: dict[str, Any], values: dict[str, Any]) -> list[str]:
    changed = []
    for field in ENRICHMENT_FIELDS:
        next_value = values[field]
        if next_value is None:
            continue
        if _normalized_current(row[f"current_{field}"]) != next_value:
            changed.append(field)
    return changed


def _apply_property_values(property_row: Property, values: dict[str, Any]) -> None:
    if values["distance_to_center_km"] is not None:
        property_row.distance_to_center_km = Decimal(str(values["distance_to_center_km"]))
    for field in ENRICHMENT_FIELDS:
        if field == "distance_to_center_km" or values[field] is None:
            continue
        setattr(property_row, field, values[field])


def _update_snapshot_payloads(
    session: Session,
    property_id: int,
    values: dict[str, Any],
) -> int:
    snapshots = session.scalars(
        select(ListingSnapshot)
        .join(PropertySource)
        .where(PropertySource.property_id == property_id)
        .order_by(ListingSnapshot.observed_at)
    ).all()
    updated = 0
    for snapshot in snapshots:
        payload = dict(snapshot.normalized_payload)
        changed = False
        for field in ENRICHMENT_FIELDS:
            value = values[field]
            if value is None or payload.get(field) == value:
                continue
            payload[field] = value
            changed = True
        if changed:
            snapshot.normalized_payload = payload
            updated += 1
    return updated


def _normalized_current(value: Any) -> float | int | None:
    if isinstance(value, Decimal):
        return float(value)
    return value


def _optional_float(value: Any) -> float | None:
    if value is None:
        return None
    return round(float(value), 2)


def _optional_int(value: Any) -> int | None:
    if value is None:
        return None
    return int(value)
