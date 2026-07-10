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


def test_admin_can_list_ingestion_jobs_logs_and_raw_listings() -> None:
    jobs = client.get("/api/v1/admin/ingestion/jobs", headers=ADMIN_HEADERS).json()
    logs = client.get("/api/v1/admin/data-quality/logs", headers=ADMIN_HEADERS).json()
    raw_listings = client.get("/api/v1/admin/raw-listings", headers=ADMIN_HEADERS).json()

    assert len(jobs) == 1
    assert jobs[0]["status"] == "succeeded"
    assert jobs[0]["rows_seen"] == 3
    assert len(logs) == 1
    assert logs[0]["severity"] == "warning"
    assert len(raw_listings) == 3
    assert raw_listings[0]["source_name"] == "Demo Partner"


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
