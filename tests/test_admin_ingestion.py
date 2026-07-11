import csv
from io import StringIO

from fastapi.testclient import TestClient

from domarion.auth_store.factory import memory_auth_store
from domarion.ingestion_admin_store.factory import memory_ingestion_admin_store
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

    backtest_response = client.get("/api/v1/admin/scoring/backtest")
    assert backtest_response.status_code == 403
    assert backtest_response.json()["detail"] == "Admin role required"

    snapshot_response = client.post("/api/v1/admin/area-market-snapshots")
    assert snapshot_response.status_code == 403
    assert snapshot_response.json()["detail"] == "Admin role required"

    import_response = client.post(
        "/api/v1/admin/listings/import-csv",
        data={"source_name": "Unauthorized Partner", "dry_run": "true"},
        files={"file": ("partner.csv", _partner_csv_bytes(), "text/csv")},
    )
    assert import_response.status_code == 403
    assert import_response.json()["detail"] == "Admin role required"


def test_admin_can_list_ingestion_jobs_logs_and_raw_listings() -> None:
    jobs = client.get("/api/v1/admin/ingestion/jobs", headers=ADMIN_HEADERS).json()
    logs = client.get("/api/v1/admin/data-quality/logs", headers=ADMIN_HEADERS).json()
    raw_listings = client.get("/api/v1/admin/raw-listings", headers=ADMIN_HEADERS).json()
    source_health = client.get(
        "/api/v1/admin/ingestion/source-health",
        headers=ADMIN_HEADERS,
    ).json()

    assert len(jobs) == 1
    assert jobs[0]["status"] == "succeeded"
    assert jobs[0]["rows_seen"] == 3
    assert len(logs) == 1
    assert logs[0]["severity"] == "warning"
    assert len(raw_listings) == 3
    assert raw_listings[0]["source_name"] == "Demo Partner"
    assert source_health[0]["source_name"] == "Demo Partner"
    assert source_health[0]["health_status"] == "warning"
    assert source_health[0]["warning_count"] == 1


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
    assert len(payload["snapshots"]) == 3
    assert payload["snapshots"][0]["area_id"] == "wroclaw-fabryczna"


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
