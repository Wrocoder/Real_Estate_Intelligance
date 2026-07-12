from __future__ import annotations

import argparse
import json
import os
import sys
from typing import Any

from alembic.config import Config
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from alembic import command
from domarion.core.config import get_settings
from domarion.ingestion.db_writer import import_partner_records_in_session
from domarion.ingestion.partner_csv import PartnerListingRecord
from domarion.repositories.postgres import PostgresRealEstateRepository
from domarion.schemas import PlannedInvestmentCreate, PlannedInvestmentUpdate
from domarion.scripts.seed_demo import seed_demo_data_in_session


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Verify Alembic migrations, PostGIS and repository behavior on live Postgres.",
    )
    parser.add_argument(
        "--database-url",
        default=os.getenv("TEST_DATABASE_URL") or os.getenv("DATABASE_URL"),
        help="SQLAlchemy database URL. Defaults to TEST_DATABASE_URL or DATABASE_URL.",
    )
    parser.add_argument(
        "--skip-migrations",
        action="store_true",
        help="Do not run Alembic upgrade head before verification.",
    )
    args = parser.parse_args()

    if not args.database_url:
        print(
            "Missing database URL. Set TEST_DATABASE_URL or DATABASE_URL, "
            "or pass --database-url.",
            file=sys.stderr,
        )
        return 2

    os.environ["DATABASE_URL"] = args.database_url
    get_settings.cache_clear()

    if not args.skip_migrations:
        alembic_config = Config("alembic.ini")
        command.upgrade(alembic_config, "head")

    engine = create_engine(args.database_url, pool_pre_ping=True)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    with engine.connect() as connection:
        postgres_version = connection.scalar(text("select version()"))
        postgis_version = connection.scalar(text("select postgis_full_version()"))

    with session_factory() as session:
        seed_result = seed_demo_data_in_session(session)
        repository = PostgresRealEstateRepository(session)
        checks = _run_repository_checks(repository)

    print(
        json.dumps(
            {
                "status": "ok",
                "postgres_version": postgres_version,
                "postgis_version": postgis_version,
                "seed": seed_result,
                "checks": checks,
            },
            ensure_ascii=False,
            indent=2,
            default=str,
        )
    )
    return 0


def _run_repository_checks(repository: PostgresRealEstateRepository) -> dict[str, Any]:
    listings = repository.list_listings(city="Wrocław")
    areas = repository.list_area_statistics()
    investments = repository.list_planned_investments(city="Wrocław")
    listing = repository.get_listing("wr-001")
    if listing is None:
        raise RuntimeError("Expected demo listing wr-001 after seed.")

    price_history = repository.get_price_history("wr-001")
    listing_events = repository.get_listing_events("wr-001")
    comparables = repository.find_comparables(listing)
    nearby_listing_ids = [
        item.id for item in repository.list_listings(lat=51.1117, lon=16.9653, radius_km=1)
    ]
    nearby_planned_investments = repository.list_planned_investments(
        lat=51.1117,
        lon=16.9653,
        radius_km=1,
    )
    if nearby_listing_ids != ["wr-001"]:
        raise RuntimeError("Expected PostGIS radius listing query to return only wr-001.")
    if not any("Nowy Dwór tram corridor" in item.name for item in nearby_planned_investments):
        raise RuntimeError("Expected PostGIS radius planned investment query near wr-001.")
    listing_event_types = [event.event_type for event in listing_events]
    if "first_seen" not in listing_event_types or "price_reduced" not in listing_event_types:
        raise RuntimeError("Expected derived listing events for wr-001.")

    deduplication_check = _run_deduplication_check(repository, listing)
    location_reference_check = _run_location_reference_check(repository)

    created = repository.create_planned_investment(
        PlannedInvestmentCreate(
            name="Staging verifier planned investment",
            investment_type="verification",
            status="planned",
            city="Wrocław",
            district="Fabryczna",
            expected_year=2029,
            lat=51.11,
            lon=16.97,
            source_url="https://example.com/staging-verifier",
            confidence_score=51,
            notes="Created by scripts/verify_postgres_staging.py",
        )
    )
    created_spatial = _planned_investment_spatial_check(repository, created.id)
    updated = repository.update_planned_investment(
        created.id,
        PlannedInvestmentUpdate(status="verified", confidence_score=77, lat=51.12, lon=16.98),
    )
    updated_spatial = _planned_investment_spatial_check(repository, created.id)
    deleted = repository.delete_planned_investment(created.id)
    missing_after_delete = repository.get_planned_investment(created.id)

    if updated is None or updated.status != "verified":
        raise RuntimeError("Planned investment update check failed.")
    if not deleted or missing_after_delete is not None:
        raise RuntimeError("Planned investment delete check failed.")

    return {
        "listing_count": len(listings),
        "area_count": len(areas),
        "planned_investment_count": len(investments),
        "price_history_points": len(price_history),
        "listing_event_count": len(listing_events),
        "listing_event_types": listing_event_types,
        "comparable_count": len(comparables),
        "deduplication": deduplication_check,
        "location_references": location_reference_check,
        "planned_investment_crud": "ok",
        "spatial": {
            **_spatial_schema_checks(repository),
            "nearby_listing_ids": nearby_listing_ids,
            "nearby_planned_investment_count": len(nearby_planned_investments),
            "created_planned_investment_geom": created_spatial,
            "updated_planned_investment_geom": updated_spatial,
        },
    }


def _run_location_reference_check(repository: PostgresRealEstateRepository) -> dict[str, Any]:
    municipalities = repository.list_municipalities()
    districts = repository.list_district_references(city="Wrocław")
    locations = repository.list_location_references(query="Nowy", limit=10)
    if not any(item.id == "wroclaw" for item in municipalities):
        raise RuntimeError("Expected Wrocław municipality reference after seed.")
    if not any(item.id == "wroclaw-fabryczna" for item in districts):
        raise RuntimeError("Expected Fabryczna district reference after seed.")
    if not any(item.name == "Nowy Dwór" for item in locations):
        raise RuntimeError("Expected Nowy Dwór location reference after seed.")
    return {
        "municipality_count": len(municipalities),
        "district_count": len(districts),
        "query_count": len(locations),
    }


def _run_deduplication_check(
    repository: PostgresRealEstateRepository,
    listing,
) -> dict[str, Any]:
    source_listing_id = "staging-dedup-wr-001"
    duplicate_listing = listing.model_copy(
        update={
            "id": source_listing_id,
            "title": "Staging verifier duplicate listing",
            "source_name": "Staging verifier partner",
            "source_url": "https://example.com/staging-dedup-wr-001",
        }
    )
    raw_payload = {
        key: str(value)
        for key, value in duplicate_listing.model_dump(mode="json").items()
        if value is not None
    }
    record = PartnerListingRecord(
        source_name="Staging verifier partner",
        source_type="partner_csv",
        source_base_url="https://example.com",
        source_listing_id=source_listing_id,
        source_url="https://example.com/staging-dedup-wr-001",
        observed_at=duplicate_listing.last_seen_at,
        raw_payload=raw_payload,
        listing=duplicate_listing,
    )

    import_partner_records_in_session(repository.session, [record])
    row = repository.session.execute(
        text(
            """
            select decision, review_status, match_score
            from property_deduplication_matches
            where source_listing_id = :source_listing_id
            order by id desc
            limit 1
            """
        ),
        {"source_listing_id": source_listing_id},
    ).one_or_none()
    if row is None:
        raise RuntimeError("Expected property_deduplication_matches row after duplicate import.")
    if row.decision != "matched" or row.review_status != "auto_resolved":
        raise RuntimeError("Expected staging duplicate import to be auto matched.")
    if row.match_score < 95:
        raise RuntimeError("Expected staging duplicate import match_score >= 95.")
    return {
        "decision": row.decision,
        "review_status": row.review_status,
        "match_score": row.match_score,
    }


def _spatial_schema_checks(repository: PostgresRealEstateRepository) -> dict[str, Any]:
    rows = repository.session.execute(
        text(
            """
            select
                (
                    select count(*)
                    from properties
                    where geom is not null and ST_SRID(geom) = 4326
                ) as properties_with_geom,
                (
                    select count(*)
                    from planned_investments
                    where geom is not null and ST_SRID(geom) = 4326
                ) as planned_investments_with_geom,
                (
                    select count(*)
                    from pg_indexes
                    where schemaname = 'public'
                      and indexname in (
                        'ix_properties_geom_gist',
                        'ix_planned_investments_geom_gist'
                      )
                ) as spatial_index_count
            """
        )
    ).one()
    if rows.properties_with_geom <= 0:
        raise RuntimeError("Expected generated geometry on seeded properties.")
    if rows.planned_investments_with_geom <= 0:
        raise RuntimeError("Expected generated geometry on seeded planned investments.")
    if rows.spatial_index_count != 2:
        raise RuntimeError("Expected GiST indexes for properties and planned investments.")
    return {
        "properties_with_geom": rows.properties_with_geom,
        "planned_investments_with_geom": rows.planned_investments_with_geom,
        "spatial_index_count": rows.spatial_index_count,
    }


def _planned_investment_spatial_check(
    repository: PostgresRealEstateRepository,
    investment_id: str,
) -> dict[str, Any]:
    row_id = investment_id.removeprefix("planned-")
    row = repository.session.execute(
        text(
            """
            select
                ST_SRID(geom) as srid,
                round(ST_Y(geom)::numeric, 6) as lat,
                round(ST_X(geom)::numeric, 6) as lon
            from planned_investments
            where id = :row_id
            """
        ),
        {"row_id": int(row_id)},
    ).one()
    if row.srid != 4326:
        raise RuntimeError("Expected generated planned investment geometry SRID 4326.")
    return {"srid": row.srid, "lat": row.lat, "lon": row.lon}


if __name__ == "__main__":
    raise SystemExit(main())
