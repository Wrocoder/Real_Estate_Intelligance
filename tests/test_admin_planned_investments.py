import json

from fastapi.testclient import TestClient

from domarion.auth_store.factory import memory_auth_store
from domarion.ingestion_admin_store.factory import memory_ingestion_admin_store
from domarion.main import app

client = TestClient(app)

ADMIN_HEADERS = {
    "X-Domarion-User-Id": "planned-admin",
    "X-Domarion-Email": "planned-admin@example.com",
    "X-Domarion-Role": "admin",
    "X-Domarion-Plan": "enterprise",
}


def setup_function() -> None:
    memory_auth_store.clear()
    memory_ingestion_admin_store.reset_demo()


def test_planned_investment_crud_requires_admin() -> None:
    response = client.get("/api/v1/admin/planned-investments")

    assert response.status_code == 403
    assert response.json()["detail"] == "Admin role required"

    import_response = client.post(
        "/api/v1/admin/planned-investments/import",
        data={"source_name": "Unauthorized Test", "dry_run": "true"},
        files={
            "file": (
                "planned.json",
                json.dumps([_planned_import_row("unauthorized-import-test")]).encode("utf-8"),
                "application/json",
            )
        },
    )
    assert import_response.status_code == 403
    assert import_response.json()["detail"] == "Admin role required"


def test_admin_can_create_update_and_delete_planned_investment() -> None:
    created_response = client.post(
        "/api/v1/admin/planned-investments",
        headers=ADMIN_HEADERS,
        json={
            "name": "Admin test tram stop",
            "investment_type": "tram",
            "status": "planned",
            "city": "Wrocław",
            "district": "Fabryczna",
            "expected_year": 2028,
            "lat": 51.11,
            "lon": 16.97,
            "source_url": "https://example.com/admin-test-tram",
            "confidence_score": 64,
            "notes": "Created by API test",
        },
    )
    created = created_response.json()

    assert created_response.status_code == 201
    assert created["id"].startswith("pi-")
    assert created["name"] == "Admin test tram stop"

    updated_response = client.patch(
        f"/api/v1/admin/planned-investments/{created['id']}",
        headers=ADMIN_HEADERS,
        json={"status": "approved", "confidence_score": 82},
    )
    updated = updated_response.json()

    assert updated_response.status_code == 200
    assert updated["status"] == "approved"
    assert updated["confidence_score"] == 82

    map_response = client.get("/api/v1/map/features", params={"district": "Fabryczna"})
    map_payload = map_response.json()
    planned_names = {
        feature["properties"].get("name")
        for feature in map_payload["features"]
        if feature["properties"]["feature_type"] == "planned_investment"
    }
    assert "Admin test tram stop" in planned_names

    delete_response = client.delete(
        f"/api/v1/admin/planned-investments/{created['id']}",
        headers=ADMIN_HEADERS,
    )
    assert delete_response.status_code == 204

    missing_response = client.get(
        f"/api/v1/admin/planned-investments/{created['id']}",
        headers=ADMIN_HEADERS,
    )
    assert missing_response.status_code == 404


def test_admin_can_dry_run_planned_investments_import() -> None:
    response = client.post(
        "/api/v1/admin/planned-investments/import",
        headers=ADMIN_HEADERS,
        data={"source_name": "WPT Dry Run Test", "dry_run": "true"},
        files={
            "file": (
                "planned.json",
                json.dumps([_planned_import_row("dry-run-planned-import-test")]).encode("utf-8"),
                "application/json",
            )
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["dry_run"] is True
    assert payload["rows_seen"] == 1
    assert payload["created"] == 0
    assert payload["updated"] == 0
    assert payload["source_ids"] == ["dry-run-planned-import-test"]
    assert payload["job"]["status"] == "succeeded"
    assert payload["job"]["rows_seen"] == 1
    assert payload["job"]["properties_created"] == 0

    investments = client.get(
        "/api/v1/admin/planned-investments",
        headers=ADMIN_HEADERS,
        params={"city": "Wrocław"},
    ).json()
    assert all(item["name"] != "Dry Run Planned Import Test" for item in investments)


def test_admin_can_import_planned_investments_idempotently() -> None:
    files_payload = [
        _planned_import_row(
            source_id="api-import-planned-investment-test",
            name="API Import Planned Investment Test",
            source_url="https://example.com/api-import-planned-investment-test",
        )
    ]

    first_response = _post_import(files_payload, dry_run=False)
    second_response = _post_import(files_payload, dry_run=False)
    first = first_response.json()
    second = second_response.json()

    assert first_response.status_code == 200
    assert first["created"] == 1
    assert first["updated"] == 0
    assert first["job"]["properties_created"] == 1
    assert second_response.status_code == 200
    assert second["created"] == 0
    assert second["updated"] == 1
    assert second["job"]["properties_updated"] == 1
    assert first["investment_ids"] == second["investment_ids"]

    delete_response = client.delete(
        f"/api/v1/admin/planned-investments/{first['investment_ids'][0]}",
        headers=ADMIN_HEADERS,
    )
    assert delete_response.status_code == 204


def _post_import(rows: list[dict[str, object]], dry_run: bool):
    return client.post(
        "/api/v1/admin/planned-investments/import",
        headers=ADMIN_HEADERS,
        data={"source_name": "WPT API Import Test", "dry_run": str(dry_run).lower()},
        files={
            "file": (
                "planned.json",
                json.dumps(rows, ensure_ascii=False).encode("utf-8"),
                "application/json",
            )
        },
    )


def _planned_import_row(
    source_id: str,
    name: str = "Dry Run Planned Import Test",
    source_url: str = "https://example.com/dry-run-planned-import-test",
) -> dict[str, object]:
    return {
        "source_id": source_id,
        "name": name,
        "investment_type": "tramwaj",
        "status": "Projekt: W realizacji",
        "city": "Wrocław",
        "district": "Fabryczna",
        "expected_year": 2029,
        "lat": 51.112,
        "lon": 16.968,
        "source_url": source_url,
        "confidence_score": 67,
    }
