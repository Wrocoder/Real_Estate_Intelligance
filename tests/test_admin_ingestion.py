import csv
from io import StringIO

from fastapi.testclient import TestClient

from domarion.auth_store.factory import memory_auth_store
from domarion.ingestion_admin_store.factory import memory_ingestion_admin_store
from domarion.ingestion_admin_store.system_sources import (
    USER_SUBMITTED_REFERENCE_SOURCE_NAME,
    USER_SUBMITTED_REFERENCE_SOURCE_TYPE,
)
from domarion.main import app

client = TestClient(app)

ADMIN_HEADERS = {
    "X-Domarion-User-Id": "admin-test",
    "X-Domarion-Email": "admin@example.com",
    "X-Domarion-Role": "admin",
    "X-Domarion-Plan": "enterprise",
}


def setup_function() -> None:
    memory_auth_store.clear()
    memory_ingestion_admin_store.reset_demo()


def test_admin_endpoints_require_admin_role() -> None:
    response = client.get("/api/v1/admin/ingestion/jobs")

    assert response.status_code == 403
    assert response.json()["detail"] == "Admin role required"

    health_response = client.get("/api/v1/admin/ingestion/source-health")
    assert health_response.status_code == 403
    assert health_response.json()["detail"] == "Admin role required"

    source_checks_response = client.get("/api/v1/admin/ingestion/source-checks")
    assert source_checks_response.status_code == 403
    assert source_checks_response.json()["detail"] == "Admin role required"

    source_errors_response = client.get("/api/v1/admin/ingestion/source-errors")
    assert source_errors_response.status_code == 403
    assert source_errors_response.json()["detail"] == "Admin role required"

    sources_response = client.get("/api/v1/admin/ingestion/sources")
    assert sources_response.status_code == 403
    assert sources_response.json()["detail"] == "Admin role required"

    open_data_response = client.get("/api/v1/admin/ingestion/open-data-roadmap")
    assert open_data_response.status_code == 403
    assert open_data_response.json()["detail"] == "Admin role required"

    infrastructure_import_response = client.post(
        "/api/v1/admin/infrastructure/import",
        data={"dry_run": "true"},
        files={"file": ("infrastructure.json", b"{}", "application/json")},
    )
    assert infrastructure_import_response.status_code == 403
    assert infrastructure_import_response.json()["detail"] == "Admin role required"

    backtest_response = client.get("/api/v1/admin/scoring/backtest")
    assert backtest_response.status_code == 403
    assert backtest_response.json()["detail"] == "Admin role required"

    snapshot_response = client.post("/api/v1/admin/area-market-snapshots")
    assert snapshot_response.status_code == 403
    assert snapshot_response.json()["detail"] == "Admin role required"

    rebuild_response = client.post("/api/v1/admin/price-history/rebuild")
    assert rebuild_response.status_code == 403
    assert rebuild_response.json()["detail"] == "Admin role required"

    enrichment_response = client.post("/api/v1/admin/infrastructure/enrich")
    assert enrichment_response.status_code == 403
    assert enrichment_response.json()["detail"] == "Admin role required"

    import_response = client.post(
        "/api/v1/admin/listings/import-csv",
        data={"source_name": "Unauthorized Partner", "dry_run": "true"},
        files={"file": ("partner.csv", _partner_csv_bytes(), "text/csv")},
    )
    assert import_response.status_code == 403
    assert import_response.json()["detail"] == "Admin role required"

    dedup_response = client.get("/api/v1/admin/deduplication/matches")
    assert dedup_response.status_code == 403
    assert dedup_response.json()["detail"] == "Admin role required"

    dedup_update_response = client.patch(
        "/api/v1/admin/deduplication/matches/1",
        json={"review_status": "auto_resolved"},
    )
    assert dedup_update_response.status_code == 403
    assert dedup_update_response.json()["detail"] == "Admin role required"


def test_admin_can_list_ingestion_jobs_logs_and_raw_listings() -> None:
    jobs = client.get("/api/v1/admin/ingestion/jobs", headers=ADMIN_HEADERS).json()
    logs = client.get("/api/v1/admin/data-quality/logs", headers=ADMIN_HEADERS).json()
    raw_listings = client.get("/api/v1/admin/raw-listings", headers=ADMIN_HEADERS).json()
    dedup_matches = client.get(
        "/api/v1/admin/deduplication/matches",
        headers=ADMIN_HEADERS,
    ).json()
    source_health = client.get(
        "/api/v1/admin/ingestion/source-health",
        headers=ADMIN_HEADERS,
    ).json()
    source_checks = client.get(
        "/api/v1/admin/ingestion/source-checks",
        headers=ADMIN_HEADERS,
    ).json()
    source_errors = client.get(
        "/api/v1/admin/ingestion/source-errors",
        headers=ADMIN_HEADERS,
    ).json()

    assert len(jobs) == 1
    assert jobs[0]["status"] == "succeeded"
    assert jobs[0]["rows_seen"] == 3
    assert len(logs) == 1
    assert logs[0]["severity"] == "warning"
    assert len(raw_listings) == 3
    assert dedup_matches == []
    assert raw_listings[0]["source_name"] == "Demo Partner"
    assert source_health[0]["source_name"] == "Demo Partner"
    assert source_health[0]["health_status"] == "warning"
    assert source_health[0]["warning_count"] == 1
    assert source_checks[0]["source_name"] == "Demo Partner"
    assert source_checks[0]["check_type"] == "partner_feed"
    assert source_errors[0]["source_name"] == "Demo Partner"
    assert source_errors[0]["status"] == "open"
    assert source_errors[0]["retryable"] is True


def test_admin_dedup_review_update_requires_postgres_backend() -> None:
    response = client.patch(
        "/api/v1/admin/deduplication/matches/1",
        headers=ADMIN_HEADERS,
        json={"review_status": "auto_resolved"},
    )

    assert response.status_code == 409
    assert "PostgreSQL" in response.json()["detail"]


def test_admin_can_manage_source_registry() -> None:
    sources = client.get("/api/v1/admin/ingestion/sources", headers=ADMIN_HEADERS).json()

    assert {source["name"] for source in sources} == {
        "Demo Partner",
        "wroclaw.pl WPT",
        USER_SUBMITTED_REFERENCE_SOURCE_NAME,
    }
    demo_source = next(source for source in sources if source["name"] == "Demo Partner")
    assert demo_source["legal_status"] == "approved"
    assert demo_source["ingestion_method"] == "admin_csv_upload"
    assert "price_history" in demo_source["allowed_use"]
    user_reference_source = next(
        source for source in sources if source["name"] == USER_SUBMITTED_REFERENCE_SOURCE_NAME
    )
    assert user_reference_source["source_type"] == USER_SUBMITTED_REFERENCE_SOURCE_TYPE
    assert user_reference_source["legal_status"] == "approved"
    assert user_reference_source["refresh_cadence"] == "one_off_user_action"
    assert "private_analysis" in user_reference_source["allowed_use"]
    assert "No bulk crawling" in user_reference_source["notes"]

    create_response = client.post(
        "/api/v1/admin/ingestion/sources",
        headers=ADMIN_HEADERS,
        json={
            "name": "Agency Beta Feed",
            "source_type": "partner_csv",
            "base_url": "https://agency.example",
            "legal_status": "review_required",
            "refresh_cadence": "weekly",
            "owner": "partnerships",
            "ingestion_method": "admin_csv_upload",
            "allowed_use": ["analytics", "reports"],
            "robots_txt_url": "https://agency.example/robots.txt",
            "terms_url": "https://agency.example/terms",
            "notes": "Waiting for signed DPA.",
            "is_active": True,
        },
    )
    created = create_response.json()

    assert create_response.status_code == 201
    assert created["name"] == "Agency Beta Feed"
    assert created["legal_status"] == "review_required"
    assert created["allowed_use"] == ["analytics", "reports"]

    duplicate_response = client.post(
        "/api/v1/admin/ingestion/sources",
        headers=ADMIN_HEADERS,
        json={"name": "Agency Beta Feed"},
    )
    assert duplicate_response.status_code == 409

    update_response = client.patch(
        f"/api/v1/admin/ingestion/sources/{created['id']}",
        headers=ADMIN_HEADERS,
        json={
            "legal_status": "approved",
            "allowed_use": ["analytics", "reports", "price_history"],
            "notes": "DPA signed.",
        },
    )
    updated = update_response.json()

    assert update_response.status_code == 200
    assert updated["legal_status"] == "approved"
    assert updated["allowed_use"] == ["analytics", "reports", "price_history"]
    assert updated["notes"] == "DPA signed."


def test_admin_can_list_and_filter_open_data_roadmap() -> None:
    response = client.get("/api/v1/admin/ingestion/open-data-roadmap", headers=ADMIN_HEADERS)
    items = response.json()

    assert response.status_code == 200
    assert [item["priority"] for item in items] == sorted(item["priority"] for item in items)
    assert {item["id"] for item in items} >= {
        "gus-bdl",
        "gugik-geoportal-services",
        "gugik-rcn",
        "wroclaw-sip",
        "wroclaw-open-data",
        "openstreetmap",
    }

    rcn = next(item for item in items if item["id"] == "gugik-rcn")
    assert rcn["status"] == "needs_legal_review"
    assert rcn["data_url"] == "https://mapy.geoportal.gov.pl/wss/service/rcn"
    assert "transaction_prices" in rcn["domains"]
    assert "area_market_snapshots" in rcn["target_tables"]

    transport_response = client.get(
        "/api/v1/admin/ingestion/open-data-roadmap",
        headers=ADMIN_HEADERS,
        params={"domain": "transport"},
    )
    assert {item["id"] for item in transport_response.json()} == {
        "wroclaw-open-data",
        "openstreetmap",
    }

    ready_response = client.get(
        "/api/v1/admin/ingestion/open-data-roadmap",
        headers=ADMIN_HEADERS,
        params={"status": "ready_for_import"},
    )
    assert {item["status"] for item in ready_response.json()} == {"ready_for_import"}


def test_admin_can_dry_run_infrastructure_reference_import() -> None:
    sample_path = "data/samples/infrastructure_references_wroclaw_open_data.json"
    with open(sample_path, "rb") as file:
        response = client.post(
            "/api/v1/admin/infrastructure/import",
            headers=ADMIN_HEADERS,
            data={"dry_run": "true", "source_name": "OpenData Wroclaw Sample"},
            files={"file": ("infrastructure.json", file, "application/json")},
        )
    payload = response.json()

    assert response.status_code == 200
    assert payload["dry_run"] is True
    assert payload["rows_seen"] == 7
    assert payload["created"] == 0
    assert payload["updated"] == 0
    assert payload["layer_counts"]["amenities"] == 2
    assert "wro-school-sp-fabryczna-demo" in payload["item_ids"]
    assert payload["job"]["source_name"] == "OpenData Wroclaw Sample"
    assert payload["job"]["source_type"] == "infrastructure_reference_import"
    assert payload["job"]["status"] == "succeeded"
    assert payload["job"]["rows_seen"] == 7


def test_admin_can_run_scoring_backtest() -> None:
    response = client.get(
        "/api/v1/admin/scoring/backtest",
        headers=ADMIN_HEADERS,
        params={"city": "Wrocław", "limit": 2},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["formula_version"] == "domarion-scoring-v1"
    assert payload["weights_profile"] == "default-v1"
    assert payload["listings_seen"] == 3
    assert payload["evaluated_points"] == 6
    assert len(payload["items"]) == 2
    assert payload["items"][0]["absolute_error_pct"] >= 0


def test_admin_can_get_scoring_backtest_report() -> None:
    response = client.get(
        "/api/v1/admin/scoring/backtest-report",
        headers=ADMIN_HEADERS,
        params={"city": "Wrocław", "limit": 3},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["backtest"]["formula_version"] == "domarion-scoring-v1"
    assert payload["backtest"]["evaluated_points"] == 6
    assert payload["overall_severity"] in {"healthy", "watch", "drift", "critical"}
    assert payload["quality_label"]
    assert payload["error_buckets"]
    assert payload["area_drift"]
    assert payload["period_drift"]
    assert payload["high_error_examples"]
    assert payload["findings"]
    assert payload["recommendations"]
    assert "model monitoring" in payload["methodology_note"]


def test_admin_can_dry_run_area_market_snapshot_job() -> None:
    response = client.post(
        "/api/v1/admin/area-market-snapshots",
        headers=ADMIN_HEADERS,
        params={"dry_run": "true"},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["dry_run"] is True
    assert payload["snapshots_created"] == 0
    assert len(payload["snapshots"]) == 8
    assert {snapshot["area_id"] for snapshot in payload["snapshots"]} >= {
        "bielany-wroclawskie-bielany-wroclawskie",
        "kobierzyce-kobierzyce",
        "medlow-medlow",
        "olawa-olawa",
        "wysoka-wysoka",
        "wroclaw-fabryczna",
        "wroclaw-krzyki",
        "wroclaw-psie-pole",
    }


def test_area_market_snapshot_write_requires_postgres_in_memory_mode() -> None:
    response = client.post(
        "/api/v1/admin/area-market-snapshots",
        headers=ADMIN_HEADERS,
        params={"dry_run": "false"},
    )

    assert response.status_code == 409
    assert (
        response.json()["detail"]
        == "Area market snapshot writes require DATA_REPOSITORY_BACKEND=postgres"
    )


def test_price_history_rebuild_requires_postgres_in_memory_mode() -> None:
    response = client.post(
        "/api/v1/admin/price-history/rebuild",
        headers=ADMIN_HEADERS,
    )

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "Price history rebuild requires DATA_REPOSITORY_BACKEND=postgres"
    )


def test_infrastructure_enrichment_requires_postgres_in_memory_mode() -> None:
    response = client.post(
        "/api/v1/admin/infrastructure/enrich",
        headers=ADMIN_HEADERS,
        params={"dry_run": "true"},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "Infrastructure enrichment requires DATA_REPOSITORY_BACKEND=postgres"
    )


def test_admin_can_create_manual_ingestion_job() -> None:
    response = client.post(
        "/api/v1/admin/ingestion/jobs",
        headers=ADMIN_HEADERS,
        json={
            "source_name": "Manual Import",
            "source_type": "manual",
            "status": "queued",
            "notes": "Follow up with partner",
        },
    )
    payload = response.json()

    assert response.status_code == 201
    assert payload["source_name"] == "Manual Import"
    assert payload["created_by"] == "admin-test"

    jobs = client.get("/api/v1/admin/ingestion/jobs", headers=ADMIN_HEADERS).json()
    assert [job["source_name"] for job in jobs][:2] == ["Manual Import", "Demo Partner"]


def test_admin_can_manage_source_errors_and_retry_actions() -> None:
    source_check = client.post(
        "/api/v1/admin/ingestion/source-checks",
        headers=ADMIN_HEADERS,
        json={
            "source_name": "Agency Retry Feed",
            "source_type": "partner_csv",
            "check_type": "connectivity",
            "target_domain": "agency.example",
            "metadata": {"legal_status": "review_required"},
        },
    ).json()
    created_error_response = client.post(
        "/api/v1/admin/ingestion/source-errors",
        headers=ADMIN_HEADERS,
        json={
            "source_name": "Agency Retry Feed",
            "source_type": "partner_csv",
            "source_check_job_id": source_check["id"],
            "severity": "error",
            "error_code": "partner_feed_timeout",
            "message": "Partner feed timed out.",
            "retryable": True,
            "metadata": {
                "source_domain": "agency.example",
                "private_source_url_omitted": True,
            },
        },
    )
    created_error = created_error_response.json()

    retry_response = client.post(
        f"/api/v1/admin/ingestion/source-errors/{created_error['id']}/retry",
        headers=ADMIN_HEADERS,
    )
    retry_payload = retry_response.json()
    filtered_errors = client.get(
        "/api/v1/admin/ingestion/source-errors",
        headers=ADMIN_HEADERS,
        params={"source_name": "Agency Retry Feed", "status": "retry_scheduled"},
    ).json()
    resolved = client.patch(
        f"/api/v1/admin/ingestion/source-errors/{created_error['id']}",
        headers=ADMIN_HEADERS,
        json={"status": "resolved", "resolution_note": "Partner endpoint restored."},
    ).json()

    assert created_error_response.status_code == 201
    assert created_error["status"] == "open"
    assert source_check["created_by"] == "admin-test"
    assert retry_response.status_code == 200
    assert retry_payload["error"]["status"] == "retry_scheduled"
    assert retry_payload["error"]["retry_count"] == 1
    assert retry_payload["retry_job"]["status"] == "queued"
    assert retry_payload["retry_job"]["created_by"] == "admin-test"
    assert retry_payload["retry_job"]["target_domain"] == "agency.example"
    assert filtered_errors[0]["last_retry_job_id"] == retry_payload["retry_job"]["id"]
    assert resolved["status"] == "resolved"
    assert resolved["resolved_by"] == "admin-test"
    assert resolved["resolution_note"] == "Partner endpoint restored."


def test_admin_can_filter_quality_logs_by_job() -> None:
    jobs = client.get("/api/v1/admin/ingestion/jobs", headers=ADMIN_HEADERS).json()

    response = client.get(
        "/api/v1/admin/data-quality/logs",
        headers=ADMIN_HEADERS,
        params={"job_id": jobs[0]["id"], "severity": "warning"},
    )
    payload = response.json()

    assert response.status_code == 200
    assert len(payload) == 1
    assert payload[0]["job_id"] == jobs[0]["id"]


def test_admin_source_health_reports_failing_sources_first() -> None:
    job = client.post(
        "/api/v1/admin/ingestion/jobs",
        headers=ADMIN_HEADERS,
        json={
            "source_name": "Broken Partner",
            "source_type": "partner_csv",
            "status": "failed",
            "notes": "Failed during monitoring test.",
        },
    ).json()
    client.post(
        "/api/v1/admin/data-quality/logs",
        headers=ADMIN_HEADERS,
        json={
            "job_id": job["id"],
            "source_name": "Broken Partner",
            "source_listing_id": None,
            "severity": "error",
            "code": "source_unavailable",
            "message": "Partner feed is unavailable.",
            "payload": {"http_status": 503},
        },
    )

    health = client.get(
        "/api/v1/admin/ingestion/source-health",
        headers=ADMIN_HEADERS,
    ).json()

    assert health[0]["source_name"] == "Broken Partner"
    assert health[0]["health_status"] == "failing"
    assert health[0]["error_count"] == 1
    assert health[0]["last_error_message"] == "Partner feed is unavailable."


def test_admin_can_dry_run_partner_csv_import() -> None:
    response = client.post(
        "/api/v1/admin/listings/import-csv",
        headers=ADMIN_HEADERS,
        data={"source_name": "API Partner Dry Run", "dry_run": "true"},
        files={
            "file": (
                "partner.csv",
                _partner_csv_bytes(source_listing_id="api-partner-dry-run"),
                "text/csv",
            )
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["dry_run"] is True
    assert payload["rows_seen"] == 1
    assert payload["raw_created"] == 0
    assert payload["listing_ids"] == ["api-partner-dry-run"]
    assert payload["job"]["status"] == "succeeded"
    assert payload["job"]["rows_seen"] == 1
    assert payload["job"]["errors_count"] == 1

    logs = client.get(
        "/api/v1/admin/data-quality/logs",
        headers=ADMIN_HEADERS,
        params={"job_id": payload["job"]["id"]},
    ).json()
    assert len(logs) == 1
    assert logs[0]["severity"] == "warning"
    assert logs[0]["source_listing_id"] == "api-partner-dry-run"


def test_partner_csv_import_requires_postgres_for_writes_in_memory_mode() -> None:
    response = client.post(
        "/api/v1/admin/listings/import-csv",
        headers=ADMIN_HEADERS,
        data={"source_name": "API Partner Import", "dry_run": "false"},
        files={
            "file": (
                "partner.csv",
                _partner_csv_bytes(source_listing_id="api-partner-write"),
                "text/csv",
            )
        },
    )
    payload = response.json()

    assert response.status_code == 409
    assert (
        payload["detail"]["message"]
        == "Partner CSV import requires Postgres ingestion admin store"
    )

    logs = client.get(
        "/api/v1/admin/data-quality/logs",
        headers=ADMIN_HEADERS,
        params={"job_id": payload["detail"]["job_id"], "severity": "error"},
    ).json()
    assert len(logs) == 1
    assert logs[0]["code"] == "partner_csv_import_requires_postgres"


def _partner_csv_bytes(source_listing_id: str = "api-partner-import") -> bytes:
    output = StringIO()
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
        "lat",
        "lon",
        "observed_at",
        "nearest_stop_m",
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerow(
        {
            "source_listing_id": source_listing_id,
            "title": "API partner import listing",
            "source_url": f"https://agency.test/{source_listing_id}",
            "city": "Wrocław",
            "district": "Fabryczna",
            "address": "Nowy Dwór",
            "market_type": "secondary",
            "price": "690000",
            "area_m2": "59.2",
            "rooms": "3",
            "lat": "51.1117",
            "lon": "16.9653",
            "observed_at": "2026-07-09",
            "nearest_stop_m": "260",
        }
    )
    return output.getvalue().encode("utf-8")
