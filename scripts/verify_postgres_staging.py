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
    comparables = repository.find_comparables(listing)

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
        "comparable_count": len(comparables),
        "planned_investment_crud": "ok",
        "spatial": {
            **_spatial_schema_checks(repository),
            "created_planned_investment_geom": created_spatial,
            "updated_planned_investment_geom": updated_spatial,
        },
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
