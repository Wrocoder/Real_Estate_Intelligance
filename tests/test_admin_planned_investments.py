from fastapi.testclient import TestClient

from domarion.auth_store.factory import memory_auth_store
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


def test_planned_investment_crud_requires_admin() -> None:
    response = client.get("/api/v1/admin/planned-investments")

    assert response.status_code == 403
    assert response.json()["detail"] == "Admin role required"


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
