import csv
from datetime import date
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from domarion.ingestion.db_writer import (
    DeduplicationCandidateContext,
    _evaluate_deduplication_candidate,
)
from domarion.ingestion.partner_csv import read_partner_csv
from domarion.main import app
from domarion.schemas import Listing

ADMIN_HEADERS = {
    "X-Domarion-User-Id": "data-quality-acceptance-admin",
    "X-Domarion-Email": "data-quality-acceptance@domarion.local",
    "X-Domarion-Role": "admin",
    "X-Domarion-Plan": "enterprise",
}

client = TestClient(app)


def test_data_quality_acceptance_geocodes_suburban_aliases_and_caps_score(tmp_path) -> None:
    path = tmp_path / "partner_geocoding_acceptance.csv"
    rows = [
        _partner_row(
            source_listing_id="dq-geo-wysoka",
            city="Kobierzyce",
            district="Wysoka",
            address="Radosna 4",
        ),
        _partner_row(
            source_listing_id="dq-geo-medlow-region",
            city="Mędłów",
            district="Dolnośląskie",
            address="Piastów Śląskich 10",
        ),
        _partner_row(
            source_listing_id="dq-geo-wroclaw-accent",
            city="Wrocław",
            district="Krzyki",
            address="Jagodno Wrocław",
        ),
    ]
    _write_partner_csv(path, rows)

    records = read_partner_csv(path, default_source_name="Data Quality Acceptance Feed")
    records_by_id = {record.source_listing_id: record for record in records}

    wysoka = records_by_id["dq-geo-wysoka"]
    assert wysoka.listing.lat == 51.0337
    assert wysoka.listing.lon == 17.0264
    assert wysoka.raw_payload["geocoding_precision"] == "street"
    assert wysoka.listing.data_quality_score <= 72

    medlow = records_by_id["dq-geo-medlow-region"]
    assert medlow.listing.lat == 51.007355
    assert medlow.listing.lon == 17.048521
    assert medlow.raw_payload["geocoding_precision"] == "street"
    assert medlow.listing.data_quality_score <= 76

    wroclaw = records_by_id["dq-geo-wroclaw-accent"]
    assert wroclaw.listing.lat == 51.0592
    assert wroclaw.listing.lon == 17.0641
    assert wroclaw.raw_payload["geocoding_provider"] == "offline_wroclaw_v1"
    assert wroclaw.raw_payload["geocoding_confidence_score"] == "72"


def test_data_quality_acceptance_dedup_review_blocks_conflicting_building_evidence() -> None:
    listing = _listing(
        title="Jasne mieszkanie Nowy Dwor balkon",
        source_name="Partner B",
        floor=4,
    )
    existing_property = _property(floor=2)
    context = DeduplicationCandidateContext(
        source_names=("Partner A",),
        source_listing_ids=("partner-a-001",),
        latest_title="Jasne mieszkanie Nowy Dwor po remoncie",
        latest_description_hash="description-v1",
    )

    decision = _evaluate_deduplication_candidate(
        existing_property,
        listing,
        candidate_context=context,
        incoming_description_hash="description-v1",
        incoming_source_name="Partner B",
        incoming_source_listing_id="partner-b-001",
    )

    assert decision.decision == "review_required"
    assert decision.match_score == 100
    assert "floor differs; requires dedup review" in decision.reasons
    assert "description hash matches" in decision.reasons
    assert decision.candidate_payload["floor"] == 2
    assert decision.candidate_payload["latest_description_hash"] == "description-v1"


def test_data_quality_acceptance_source_health_prioritizes_fresh_failures() -> None:
    suffix = uuid4().hex[:8]
    failing_source = f"DQ Acceptance Broken {suffix}"
    warning_source = f"DQ Acceptance Warning {suffix}"
    healthy_source = f"DQ Acceptance Healthy {suffix}"

    failing_job = _create_ingestion_job(failing_source, status="failed", errors_count=1)
    _create_quality_log(
        failing_job["id"],
        failing_source,
        severity="error",
        code="source_unavailable",
        message="Feed returned HTTP 503 during acceptance check.",
    )

    warning_job = _create_ingestion_job(warning_source, status="succeeded", errors_count=1)
    _create_quality_log(
        warning_job["id"],
        warning_source,
        severity="warning",
        code="stale_source_snapshot",
        message="Latest source snapshot is older than accepted freshness window.",
    )
    _create_ingestion_job(healthy_source, status="succeeded", errors_count=0)

    response = client.get("/api/v1/admin/ingestion/source-health", headers=ADMIN_HEADERS)

    assert 200 <= response.status_code < 300
    health = response.json()
    by_source = {item["source_name"]: item for item in health}
    assert by_source[failing_source]["health_status"] == "failing"
    assert by_source[failing_source]["last_error_message"] == (
        "Feed returned HTTP 503 during acceptance check."
    )
    assert by_source[warning_source]["health_status"] == "warning"
    assert by_source[healthy_source]["health_status"] == "healthy"

    positions = {
        item["source_name"]: index
        for index, item in enumerate(health)
        if item["source_name"] in {failing_source, warning_source, healthy_source}
    }
    assert positions[failing_source] < positions[warning_source] < positions[healthy_source]


def _partner_row(
    *,
    source_listing_id: str,
    city: str,
    district: str,
    address: str,
) -> dict[str, str]:
    return {
        "source_listing_id": source_listing_id,
        "title": f"Acceptance row {source_listing_id}",
        "source_url": f"https://partner.example.test/{source_listing_id}",
        "city": city,
        "district": district,
        "address": address,
        "market_type": "secondary",
        "price": "720000",
        "area_m2": "60",
        "rooms": "3",
        "data_quality_score": "95",
        "observed_at": "2026-07-10",
    }


def _write_partner_csv(path, rows: list[dict[str, str]]) -> None:
    fieldnames = [
        "source_listing_id",
        "title",
        "source_url",
        "city",
        "district",
        "address",
        "market_type",
        "price",
        "area_m2",
        "rooms",
        "data_quality_score",
        "observed_at",
    ]
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def _listing(**updates) -> Listing:
    payload = {
        "id": "dq-dedup-candidate",
        "title": "Dedup acceptance candidate",
        "source_name": "Partner B",
        "source_url": "https://partner.example.test/dq-dedup-candidate",
        "city": "Wrocław",
        "district": "Fabryczna",
        "area_id": "wroclaw-fabryczna",
        "municipality": "Wrocław",
        "address": "Nowy Dwór 12",
        "market_type": "secondary",
        "price": 690000,
        "currency": "PLN",
        "area_m2": 59.2,
        "price_per_m2": 11655,
        "rooms": 3,
        "floor": None,
        "building_floors": None,
        "building_year": None,
        "first_seen_at": date(2026, 7, 1),
        "last_seen_at": date(2026, 7, 9),
        "days_on_market": 8,
        "price_reductions": 0,
        "price_increases": 0,
        "relisted": False,
        "lat": 51.1117,
        "lon": 16.9653,
        "distance_to_center_km": 0.0,
        "nearest_stop_m": 260,
        "nearest_school_m": 9999,
        "nearest_major_road_m": 9999,
        "nearest_industrial_zone_m": 9999,
        "parks_within_1km": 0,
        "schools_within_1km": 0,
        "planned_investments_within_2km": 0,
        "data_quality_score": 85,
    }
    payload.update(updates)
    return Listing(**payload)


def _property(**updates):
    payload = {
        "id": 2001,
        "canonical_address": "ul. Nowy Dwór 12",
        "city": "Wrocław",
        "district": "Fabryczna",
        "market_type": "secondary",
        "area_m2": Decimal("59.0"),
        "rooms": 3,
        "floor": None,
        "building_floors": None,
        "building_year": None,
        "lat": Decimal("51.1118"),
        "lon": Decimal("16.9652"),
    }
    payload.update(updates)
    return SimpleNamespace(**payload)


def _create_ingestion_job(source_name: str, *, status: str, errors_count: int) -> dict:
    response = client.post(
        "/api/v1/admin/ingestion/jobs",
        headers=ADMIN_HEADERS,
        json={
            "source_name": source_name,
            "source_type": "partner_csv",
            "status": status,
            "rows_seen": 1,
            "errors_count": errors_count,
            "created_by": "data-quality-acceptance",
        },
    )
    assert 200 <= response.status_code < 300
    return response.json()


def _create_quality_log(
    job_id: str,
    source_name: str,
    *,
    severity: str,
    code: str,
    message: str,
) -> dict:
    response = client.post(
        "/api/v1/admin/data-quality/logs",
        headers=ADMIN_HEADERS,
        json={
            "job_id": job_id,
            "source_name": source_name,
            "source_listing_id": None,
            "severity": severity,
            "code": code,
            "message": message,
            "payload": {"acceptance": True},
        },
    )
    assert 200 <= response.status_code < 300
    return response.json()
