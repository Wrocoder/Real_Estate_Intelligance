from fastapi.testclient import TestClient

from domarion.main import app
from domarion.user_store.factory import memory_user_store

client = TestClient(app)


def test_favorite_crud_with_listing_attachment() -> None:
    memory_user_store.clear()

    created = client.post(
        "/api/v1/favorites?owner_id=buyer-1",
        json={"listing_id": "wr-001", "note": "Check transport plans"},
    )
    payload = created.json()

    assert created.status_code == 201
    assert payload["listing_id"] == "wr-001"
    assert payload["listing"]["id"] == "wr-001"
    assert payload["note"] == "Check transport plans"

    favorite_id = payload["id"]
    listed = client.get("/api/v1/favorites?owner_id=buyer-1").json()
    assert len(listed) == 1
    assert listed[0]["id"] == favorite_id

    updated = client.patch(
        f"/api/v1/favorites/{favorite_id}?owner_id=buyer-1",
        json={"note": "Strong negotiation candidate"},
    ).json()
    assert updated["note"] == "Strong negotiation candidate"

    deleted = client.delete(f"/api/v1/favorites/{favorite_id}?owner_id=buyer-1")
    assert deleted.status_code == 204
    assert client.get("/api/v1/favorites?owner_id=buyer-1").json() == []


def test_favorites_are_owner_scoped() -> None:
    memory_user_store.clear()

    created = client.post(
        "/api/v1/favorites?owner_id=buyer-1",
        json={"listing_id": "wr-001"},
    ).json()

    other_owner_response = client.get(f"/api/v1/favorites/{created['id']}?owner_id=buyer-2")

    assert other_owner_response.status_code == 404


def test_favorite_rejects_missing_listing() -> None:
    memory_user_store.clear()

    response = client.post(
        "/api/v1/favorites?owner_id=buyer-1",
        json={"listing_id": "missing"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Listing not found"


def test_alert_crud_and_preview() -> None:
    memory_user_store.clear()

    created = client.post(
        "/api/v1/alerts?owner_id=buyer-1",
        json={
            "name": "Fabryczna hidden gems",
            "channel": "email",
            "frequency": "daily",
            "filters": {
                "city": "Wrocław",
                "district": "Fabryczna",
                "max_price": 700000,
                "min_investment_score": 40,
            },
        },
    )
    payload = created.json()

    assert created.status_code == 201
    assert payload["name"] == "Fabryczna hidden gems"
    assert payload["filters"]["district"] == "Fabryczna"
    assert payload["is_active"] is True

    alert_id = payload["id"]
    preview = client.get(f"/api/v1/alerts/{alert_id}/preview?owner_id=buyer-1").json()
    assert preview["total_matches"] >= 1
    assert preview["matches"][0]["listing"]["district"] == "Fabryczna"
    assert preview["applied_filters"]["max_price"] == 700000

    updated = client.patch(
        f"/api/v1/alerts/{alert_id}?owner_id=buyer-1",
        json={"is_active": False, "frequency": "weekly"},
    ).json()
    assert updated["is_active"] is False
    assert updated["frequency"] == "weekly"

    listed = client.get("/api/v1/alerts?owner_id=buyer-1").json()
    assert len(listed) == 1
    assert listed[0]["id"] == alert_id

    deleted = client.delete(f"/api/v1/alerts/{alert_id}?owner_id=buyer-1")
    assert deleted.status_code == 204
    assert client.get("/api/v1/alerts?owner_id=buyer-1").json() == []


def test_alert_owner_scope() -> None:
    memory_user_store.clear()

    created = client.post(
        "/api/v1/alerts?owner_id=buyer-1",
        json={"name": "All Wrocław", "filters": {"city": "Wrocław"}},
    ).json()

    response = client.get(f"/api/v1/alerts/{created['id']}?owner_id=buyer-2")

    assert response.status_code == 404


def test_alert_delivery_dry_run_is_persisted() -> None:
    memory_user_store.clear()
    headers = {
        "X-Domarion-User-Id": "alert-delivery-owner",
        "X-Domarion-Email": "buyer@example.com",
    }

    created = client.post(
        "/api/v1/alerts",
        headers=headers,
        json={
            "name": "Fabryczna delivery",
            "channel": "email",
            "frequency": "daily",
            "filters": {"city": "Wrocław", "district": "Fabryczna"},
        },
    ).json()

    assert created["delivery_target"] == "buyer@example.com"

    delivered = client.post(
        f"/api/v1/alerts/{created['id']}/deliver",
        headers=headers,
        json={"dry_run": True, "max_matches": 2},
    )
    job = delivered.json()

    assert delivered.status_code == 200
    assert job["status"] == "dry_run"
    assert job["provider"] == "email:dry-run"
    assert job["total_matches"] >= 1
    assert 1 <= len(job["listing_ids"]) <= 2

    jobs = client.get("/api/v1/alert-delivery-jobs", headers=headers).json()
    assert jobs[0]["id"] == job["id"]


def test_telegram_delivery_without_target_is_skipped() -> None:
    memory_user_store.clear()
    headers = {"X-Domarion-User-Id": "telegram-alert-owner"}

    created = client.post(
        "/api/v1/alerts",
        headers=headers,
        json={
            "name": "Telegram delivery",
            "channel": "telegram",
            "frequency": "instant",
            "filters": {"city": "Wrocław", "district": "Fabryczna"},
        },
    ).json()

    delivered = client.post(
        f"/api/v1/alerts/{created['id']}/deliver",
        headers=headers,
        json={"dry_run": False, "max_matches": 3},
    )
    job = delivered.json()

    assert delivered.status_code == 200
    assert job["status"] == "skipped"
    assert job["provider"] == "telegram:bot-api"
    assert job["delivered_count"] == 0
    assert "Telegram chat id is missing" in job["message"]
