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
from domarion.ai_insight_store.postgres import PostgresAIInsightStore
from domarion.core.config import get_settings
from domarion.ingestion.db_writer import import_partner_records_in_session
from domarion.ingestion.partner_csv import PartnerListingRecord
from domarion.ingestion_admin_store.postgres import PostgresIngestionAdminStore
from domarion.report_store.postgres import PostgresReportStore
from domarion.repositories.postgres import PostgresRealEstateRepository
from domarion.schemas import (
    GeneratedReportCreate,
    PlannedInvestmentCreate,
    PlannedInvestmentUpdate,
    SourceCheckJobCreate,
    SourceErrorCreate,
    SourceErrorUpdate,
)
from domarion.scripts.seed_demo import seed_demo_data_in_session
from domarion.services.ai_insights import persist_generated_report_insights
from domarion.services.infrastructure_enrichment import run_infrastructure_enrichment_job


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
    infrastructure_check = _run_infrastructure_check(repository)
    ai_insight_check = _run_ai_insight_check(repository)
    source_error_check = _run_source_error_check(repository)
    enrichment_check = _run_infrastructure_enrichment_check(repository)

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
        "infrastructure": infrastructure_check,
        "ai_insights": ai_insight_check,
        "source_errors": source_error_check,
        "infrastructure_enrichment": enrichment_check,
        "planned_investment_crud": "ok",
        "spatial": {
            **_spatial_schema_checks(repository),
            "nearby_listing_ids": nearby_listing_ids,
            "nearby_planned_investment_count": len(nearby_planned_investments),
            "created_planned_investment_geom": created_spatial,
            "updated_planned_investment_geom": updated_spatial,
        },
    }


def _run_infrastructure_check(repository: PostgresRealEstateRepository) -> dict[str, Any]:
    stops = repository.list_transport_stops(city="Wrocław")
    routes = repository.list_transport_routes(city="Wrocław")
    schools = repository.list_schools(district_id="wroclaw-fabryczna")
    kindergartens = repository.list_kindergartens(city="Wrocław")
    amenities = repository.list_amenities(amenity_type="park")
    industrial_zones = repository.list_industrial_zones(city="Wrocław")
    if not any(item.id == "stop-wroclaw-nowy-dwor-pr" for item in stops):
        raise RuntimeError("Expected seeded Nowy Dwór transport stop.")
    if not any(item.route_number == "13" for item in routes):
        raise RuntimeError("Expected seeded transport route 13.")
    if not schools:
        raise RuntimeError("Expected seeded Fabryczna school.")
    if not kindergartens:
        raise RuntimeError("Expected seeded kindergartens.")
    if not amenities:
        raise RuntimeError("Expected seeded park amenity.")
    if not industrial_zones:
        raise RuntimeError("Expected seeded industrial zone.")

    spatial = repository.session.execute(
        text(
            """
            select
                (
                    select count(*)
                    from transport_stops
                    where geom is not null and ST_SRID(geom) = 4326
                ) as transport_stops_with_geom,
                (
                    select count(*)
                    from schools
                    where geom is not null and ST_SRID(geom) = 4326
                ) as schools_with_geom,
                (
                    select count(*)
                    from kindergartens
                    where geom is not null and ST_SRID(geom) = 4326
                ) as kindergartens_with_geom,
                (
                    select count(*)
                    from amenities
                    where geom is not null and ST_SRID(geom) = 4326
                ) as amenities_with_geom,
                (
                    select count(*)
                    from industrial_zones
                    where geom is not null and ST_SRID(geom) = 4326
                ) as industrial_zones_with_geom,
                (
                    select count(*)
                    from pg_indexes
                    where schemaname = 'public'
                      and indexname in (
                        'ix_transport_stops_geom_gist',
                        'ix_schools_geom_gist',
                        'ix_kindergartens_geom_gist',
                        'ix_amenities_geom_gist',
                        'ix_industrial_zones_geom_gist'
                      )
                ) as infrastructure_spatial_index_count
            """
        )
    ).one()
    if spatial.infrastructure_spatial_index_count != 5:
        raise RuntimeError("Expected GiST indexes for infrastructure point tables.")
    return {
        "transport_stop_count": len(stops),
        "transport_route_count": len(routes),
        "school_count": len(schools),
        "kindergarten_count": len(kindergartens),
        "amenity_count": len(amenities),
        "industrial_zone_count": len(industrial_zones),
        "spatial": {
            "transport_stops_with_geom": spatial.transport_stops_with_geom,
            "schools_with_geom": spatial.schools_with_geom,
            "kindergartens_with_geom": spatial.kindergartens_with_geom,
            "amenities_with_geom": spatial.amenities_with_geom,
            "industrial_zones_with_geom": spatial.industrial_zones_with_geom,
            "infrastructure_spatial_index_count": (
                spatial.infrastructure_spatial_index_count
            ),
        },
    }


def _run_ai_insight_check(repository: PostgresRealEstateRepository) -> dict[str, Any]:
    owner_id = "staging-ai-insight-owner"
    report_store = PostgresReportStore(repository.session)
    ai_insight_store = PostgresAIInsightStore(repository.session)
    report = report_store.save_report(
        GeneratedReportCreate(
            owner_id=owner_id,
            listing_id="wr-001",
            audience="buyer",
            report_format="html",
            content_type="text/html; charset=utf-8",
            title="Staging verifier object report",
            summary="Staging verifier summary for wr-001.",
            content="<html><body>Staging verifier object report</body></html>",
            report_metadata={
                "report_product_code": "object_report",
                "report_template_code": "buyer_object_report_v1",
                "report_template_name": "Buyer Object Report v1",
                "area_id": "wroclaw-fabryczna",
                "city": "Wrocław",
                "district": "Fabryczna",
                "investment_score": 72,
                "risk_score": 31,
                "negotiation_score": 66,
                "decision_label": "good_option",
                "price_label": "fair",
                "risk_label": "moderate_risk",
                "negotiation_label": "negotiable",
                "fair_price_confidence_score": 74,
                "scoring_formula_version": "staging-verifier",
                "scoring_weights_profile": "default",
            },
        )
    )
    created = persist_generated_report_insights(ai_insight_store, report)
    repeated = persist_generated_report_insights(ai_insight_store, report)
    insights = ai_insight_store.list_insights(owner_id=owner_id, subject_id="wr-001")
    detail = ai_insight_store.get_insight(created[0].id, owner_id=owner_id)
    other_owner_detail = ai_insight_store.get_insight(created[0].id, owner_id="other-owner")
    index_count = repository.session.scalar(
        text(
            """
            select count(*)
            from pg_indexes
            where schemaname = 'public'
              and indexname in (
                'ix_ai_insights_owner_id',
                'ix_ai_insights_subject_type',
                'ix_ai_insights_subject_id',
                'ix_ai_insights_insight_type',
                'ix_ai_insights_source_report_id',
                'ix_ai_insights_input_hash',
                'ix_ai_insights_created_at'
              )
            """
        )
    )

    insight_types = {item.insight_type for item in insights}
    if insight_types != {"report_summary", "object_explanation"}:
        raise RuntimeError("Expected report_summary and object_explanation AI insights.")
    if len(created) != 2 or [item.id for item in repeated] != [item.id for item in created]:
        raise RuntimeError("Expected AI insight persistence to be idempotent per report.")
    if detail is None or detail.source_report_id != report.id:
        raise RuntimeError("Expected owner-scoped AI insight detail by id.")
    if other_owner_detail is not None:
        raise RuntimeError("Expected AI insight detail to be owner-scoped.")
    if index_count != 7:
        raise RuntimeError("Expected seven AI insight lookup indexes.")

    return {
        "created_count": len(created),
        "listed_count": len(insights),
        "insight_types": sorted(insight_types),
        "index_count": index_count,
    }


def _run_source_error_check(repository: PostgresRealEstateRepository) -> dict[str, Any]:
    admin_store = PostgresIngestionAdminStore(repository.session)
    source_check = admin_store.create_source_check_job(
        SourceCheckJobCreate(
            source_name="Staging Source Check Feed",
            source_type="partner_csv",
            check_type="connectivity",
            status="failed",
            target_domain="staging-source.example",
            target_url_hash="staging-url-hash",
            created_by="staging-verifier",
            notes="Created by scripts/verify_postgres_staging.py",
            metadata={"private_source_url_omitted": True},
        )
    )
    source_error = admin_store.create_source_error(
        SourceErrorCreate(
            source_name="Staging Source Check Feed",
            source_type="partner_csv",
            source_check_job_id=source_check.id,
            severity="error",
            error_code="staging_source_timeout",
            message="Staging source check timeout.",
            retryable=True,
            metadata={
                "source_domain": "staging-source.example",
                "source_url_hash": "staging-url-hash",
                "private_source_url_omitted": True,
            },
        )
    )
    retry_result = admin_store.retry_source_error(source_error.id, created_by="staging-verifier")
    if retry_result is None:
        raise RuntimeError("Expected retryable source error to create retry job.")
    resolved = admin_store.update_source_error(
        source_error.id,
        SourceErrorUpdate(
            status="resolved",
            resolved_by="staging-verifier",
            resolution_note="Verifier resolved retry queue item.",
        ),
    )
    listed_errors = admin_store.list_source_errors(source_name="Staging Source Check Feed")
    listed_checks = admin_store.list_source_check_jobs(source_name="Staging Source Check Feed")
    index_count = repository.session.scalar(
        text(
            """
            select count(*)
            from pg_indexes
            where schemaname = 'public'
              and indexname in (
                'ix_source_check_jobs_source_name',
                'ix_source_check_jobs_status',
                'ix_source_check_jobs_target_domain',
                'ix_source_errors_source_name',
                'ix_source_errors_status',
                'ix_source_errors_retryable',
                'ix_source_errors_next_retry_at',
                'ix_source_errors_last_retry_job_id'
              )
            """
        )
    )

    if resolved is None or resolved.status != "resolved":
        raise RuntimeError("Expected source error resolve update to succeed.")
    if retry_result.error.retry_count != 1:
        raise RuntimeError("Expected source error retry_count to increment.")
    if retry_result.retry_job.status != "queued":
        raise RuntimeError("Expected source error retry to create queued source check job.")
    if len(listed_errors) != 1:
        raise RuntimeError("Expected one staging source error.")
    if len(listed_checks) != 2:
        raise RuntimeError("Expected original and retry source check jobs.")
    if index_count != 8:
        raise RuntimeError("Expected source check/source error lookup indexes.")

    return {
        "source_check_count": len(listed_checks),
        "source_error_count": len(listed_errors),
        "retry_count": retry_result.error.retry_count,
        "resolved_status": resolved.status,
        "index_count": index_count,
    }


def _run_infrastructure_enrichment_check(
    repository: PostgresRealEstateRepository,
) -> dict[str, Any]:
    dry_run = run_infrastructure_enrichment_job(repository.session, dry_run=True, limit=100)
    write_result = run_infrastructure_enrichment_job(repository.session, dry_run=False, limit=100)
    repository.session.commit()
    latest_payload_row = repository.session.execute(
        text(
            """
            select
                p.nearest_stop_m as property_nearest_stop_m,
                p.nearest_school_m as property_nearest_school_m,
                p.parks_within_1km as property_parks_within_1km,
                (snap.normalized_payload ->> 'nearest_stop_m')::int
                    as snapshot_nearest_stop_m,
                (snap.normalized_payload ->> 'nearest_school_m')::int
                    as snapshot_nearest_school_m,
                (snap.normalized_payload ->> 'parks_within_1km')::int
                    as snapshot_parks_within_1km
            from property_sources ps
            join properties p on p.id = ps.property_id
            join listing_snapshots snap on snap.property_source_id = ps.id
            where snap.normalized_payload ->> 'id' = 'wr-001'
            order by snap.observed_at desc
            limit 1
            """
        )
    ).one()
    if dry_run.properties_seen < 3:
        raise RuntimeError("Expected infrastructure enrichment to see seeded properties.")
    if dry_run.properties_with_changes <= 0:
        raise RuntimeError("Expected infrastructure enrichment dry-run to detect changes.")
    if write_result.properties_updated != dry_run.properties_with_changes:
        raise RuntimeError("Expected infrastructure enrichment write count to match dry-run.")
    if write_result.snapshots_updated <= 0:
        raise RuntimeError("Expected infrastructure enrichment to update snapshot payloads.")
    if latest_payload_row.property_nearest_stop_m != latest_payload_row.snapshot_nearest_stop_m:
        raise RuntimeError("Expected nearest stop enrichment in property and snapshot payload.")
    if latest_payload_row.property_nearest_school_m != latest_payload_row.snapshot_nearest_school_m:
        raise RuntimeError("Expected nearest school enrichment in property and snapshot payload.")
    if latest_payload_row.property_parks_within_1km != latest_payload_row.snapshot_parks_within_1km:
        raise RuntimeError("Expected park count enrichment in property and snapshot payload.")

    return {
        "properties_seen": write_result.properties_seen,
        "properties_with_changes": dry_run.properties_with_changes,
        "properties_updated": write_result.properties_updated,
        "snapshots_updated": write_result.snapshots_updated,
        "wr_001_nearest_stop_m": latest_payload_row.property_nearest_stop_m,
        "wr_001_nearest_school_m": latest_payload_row.property_nearest_school_m,
        "wr_001_parks_within_1km": latest_payload_row.property_parks_within_1km,
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
