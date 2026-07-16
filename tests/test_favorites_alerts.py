from fastapi.testclient import TestClient

import domarion.services.alert_delivery as alert_delivery
from domarion.auth_store.factory import memory_auth_store
from domarion.core.config import get_settings
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
                "query": "Nowy Dwor",
                "max_price": 700000,
                "min_floor": 2,
                "max_floor": 4,
                "max_building_floors": 6,
                "min_building_year": 2010,
                "max_building_year": 2013,
                "min_investment_score": 40,
            },
        },
    )
    payload = created.json()

    assert created.status_code == 201
    assert payload["name"] == "Fabryczna hidden gems"
    assert payload["filters"]["district"] == "Fabryczna"
    assert payload["filters"]["query"] == "Nowy Dwor"
    assert payload["filters"]["min_floor"] == 2
    assert payload["filters"]["max_building_year"] == 2013
    assert payload["is_active"] is True

    alert_id = payload["id"]
    preview = client.get(f"/api/v1/alerts/{alert_id}/preview?owner_id=buyer-1").json()
    assert preview["total_matches"] >= 1
    assert preview["matches"][0]["listing"]["district"] == "Fabryczna"
    assert preview["matches"][0]["listing"]["id"] == "wr-001"
    assert preview["applied_filters"]["query"] == "Nowy Dwor"
    assert preview["applied_filters"]["max_price"] == 700000
    assert preview["applied_filters"]["max_building_floors"] == 6
    assert preview["applied_filters"]["min_building_year"] == 2010

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


def test_alert_preview_supports_municipality_filter() -> None:
    memory_user_store.clear()

    created = client.post(
        "/api/v1/alerts?owner_id=buyer-1",
        json={
            "name": "Kobierzyce value watch",
            "filters": {
                "municipality": "Kobierzyce",
                "max_price": 600000,
            },
        },
    )
    payload = created.json()

    assert created.status_code == 201
    assert payload["filters"]["municipality"] == "Kobierzyce"

    preview = client.get(f"/api/v1/alerts/{payload['id']}/preview?owner_id=buyer-1").json()

    assert preview["applied_filters"]["municipality"] == "Kobierzyce"
    assert preview["total_matches"] == 2
    assert {item["listing"]["municipality"] for item in preview["matches"]} == {"Kobierzyce"}


def test_alert_preview_supports_building_attribute_filters() -> None:
    memory_user_store.clear()

    created = client.post(
        "/api/v1/alerts?owner_id=buyer-1",
        json={
            "name": "Ready apartment block",
            "filters": {
                "city": "Wrocław",
                "building_type": "apartment_block",
                "renovation_state": "ready_to_move_in",
            },
        },
    )
    payload = created.json()

    assert created.status_code == 201
    assert payload["filters"]["building_type"] == "apartment_block"
    assert payload["filters"]["renovation_state"] == "ready_to_move_in"

    preview = client.get(f"/api/v1/alerts/{payload['id']}/preview?owner_id=buyer-1").json()

    assert preview["total_matches"] == 1
    assert preview["matches"][0]["listing"]["id"] == "wr-001"
    assert preview["applied_filters"]["building_type"] == "apartment_block"


def test_alert_owner_scope() -> None:
    memory_user_store.clear()

    created = client.post(
        "/api/v1/alerts?owner_id=buyer-1",
        json={"name": "All Wrocław", "filters": {"city": "Wrocław"}},
    ).json()

    response = client.get(f"/api/v1/alerts/{created['id']}?owner_id=buyer-2")

    assert response.status_code == 404


def test_realtor_saved_search_digest_builds_client_copy() -> None:
    memory_auth_store.clear()
    memory_user_store.clear()
    headers = {
        "X-Domarion-User-Id": "realtor-digest-owner",
        "X-Domarion-Email": "agent@example.com",
        "X-Domarion-Display-Name": "Agent One",
        "X-Domarion-Role": "realtor",
        "X-Domarion-Plan": "realtor",
    }

    created = client.post(
        "/api/v1/alerts",
        headers=headers,
        json={
            "name": "Fabryczna client shortlist",
            "filters": {
                "city": "Wrocław",
                "district": "Fabryczna",
                "query": "Nowy Dwor",
                "max_price": 700000,
            },
        },
    ).json()

    response = client.post(
        f"/api/v1/alerts/{created['id']}/realtor-digest",
        headers=headers,
        json={
            "client_name": "Anna",
            "intro": "I picked the strongest options for your current budget.",
            "max_matches": 2,
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["alert"]["id"] == created["id"]
    assert payload["client_name"] == "Anna"
    assert payload["agent_name"] == "Agent One"
    assert payload["agent_email"] == "agent@example.com"
    assert payload["subject"].startswith("Anna: Fabryczna client shortlist")
    assert payload["total_matches"] >= 1
    assert 1 <= len(payload["items"]) <= 2
    assert payload["items"][0]["listing_id"] == "wr-001"
    assert payload["items"][0]["source_url"] is None
    assert "Hi Anna" in payload["client_message"]
    assert "I picked the strongest options" in payload["client_message"]
    assert "Prepared by Agent One" in payload["client_message"]
    assert "not financial, legal or investment advice" in payload["disclaimer"]


def test_realtor_saved_search_digest_keeps_alert_owner_scope() -> None:
    memory_auth_store.clear()
    memory_user_store.clear()
    owner_headers = {"X-Domarion-User-Id": "digest-owner"}
    other_headers = {"X-Domarion-User-Id": "digest-other"}

    created = client.post(
        "/api/v1/alerts",
        headers=owner_headers,
        json={"name": "Owner digest", "filters": {"city": "Wrocław"}},
    ).json()

    response = client.post(
        f"/api/v1/alerts/{created['id']}/realtor-digest",
        headers=other_headers,
        json={"max_matches": 2},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Alert not found"


def test_advanced_investor_alert_filters() -> None:
    memory_user_store.clear()

    created = client.post(
        "/api/v1/alerts?owner_id=investor-alert-owner",
        json={
            "name": "Below-market investor candidates",
            "filters": {
                "city": "Wrocław",
                "district": "Fabryczna",
                "max_price_delta_to_fair_mid_pct": -4,
                "min_negotiation_score": 80,
                "min_liquidity_score": 60,
                "min_rental_potential_score": 75,
                "min_price_reductions": 2,
                "max_days_on_market": 90,
            },
        },
    )
    payload = created.json()

    assert created.status_code == 201
    assert payload["filters"]["max_price_delta_to_fair_mid_pct"] == -4
    assert payload["filters"]["min_rental_potential_score"] == 75
    assert payload["filters"]["min_price_reductions"] == 2

    preview = client.get(
        f"/api/v1/alerts/{payload['id']}/preview?owner_id=investor-alert-owner"
    ).json()

    assert preview["total_matches"] == 1
    assert preview["applied_filters"]["max_days_on_market"] == 90
    match = preview["matches"][0]
    assert match["listing"]["id"] == "wr-001"
    assert match["listing"]["price_reductions"] >= 2
    assert match["listing"]["days_on_market"] <= 90
    assert match["scores"]["price_delta_to_fair_mid_pct"] <= -4
    assert match["scores"]["negotiation_score"] >= 80
    assert match["scores"]["liquidity_score"] >= 60
    assert match["scores"]["rental_potential_score"] >= 75


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


def test_admin_daily_email_alert_batch_dry_run_does_not_persist_jobs() -> None:
    memory_auth_store.clear()
    memory_user_store.clear()
    buyer_headers = {
        "X-Domarion-User-Id": "daily-owner",
        "X-Domarion-Email": "daily@example.com",
    }
    admin_headers = {"X-Domarion-User-Id": "admin-1", "X-Domarion-Role": "admin"}

    daily_alert = client.post(
        "/api/v1/alerts",
        headers=buyer_headers,
        json={
            "name": "Daily email",
            "channel": "email",
            "frequency": "daily",
            "filters": {"city": "Wrocław", "district": "Fabryczna"},
        },
    ).json()
    client.post(
        "/api/v1/alerts",
        headers=buyer_headers,
        json={
            "name": "Instant email",
            "channel": "email",
            "frequency": "instant",
            "filters": {"city": "Wrocław"},
        },
    )
    client.post(
        "/api/v1/alerts",
        headers=buyer_headers,
        json={
            "name": "Daily telegram",
            "channel": "telegram",
            "frequency": "daily",
            "delivery_target": "123",
            "filters": {"city": "Wrocław"},
        },
    )

    response = client.post(
        "/api/v1/admin/alerts/deliver-daily-email",
        headers=admin_headers,
        json={"dry_run": True, "max_matches": 2},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["alerts_seen"] == 1
    assert payload["jobs_prepared"] == 1
    assert payload["jobs_persisted"] == 0
    assert payload["jobs"][0]["alert_id"] == daily_alert["id"]
    assert payload["jobs"][0]["status"] == "dry_run"

    jobs = client.get("/api/v1/alert-delivery-jobs", headers=buyer_headers).json()
    assert jobs == []


def test_admin_daily_email_alert_batch_live_run_uses_cooldown() -> None:
    memory_auth_store.clear()
    memory_user_store.clear()
    buyer_headers = {
        "X-Domarion-User-Id": "daily-live-owner",
        "X-Domarion-Email": "daily-live@example.com",
    }
    admin_headers = {"X-Domarion-User-Id": "admin-1", "X-Domarion-Role": "admin"}

    created = client.post(
        "/api/v1/alerts",
        headers=buyer_headers,
        json={
            "name": "Daily live",
            "channel": "email",
            "frequency": "daily",
            "filters": {"city": "Wrocław", "district": "Fabryczna"},
        },
    ).json()

    first = client.post(
        "/api/v1/admin/alerts/deliver-daily-email",
        headers=admin_headers,
        json={"dry_run": False, "max_matches": 2},
    ).json()
    second = client.post(
        "/api/v1/admin/alerts/deliver-daily-email",
        headers=admin_headers,
        json={"dry_run": False, "max_matches": 2},
    ).json()

    assert first["alerts_seen"] == 1
    assert first["jobs_prepared"] == 1
    assert first["jobs_persisted"] == 1
    assert first["jobs"][0]["alert_id"] == created["id"]
    assert first["jobs"][0]["status"] == "skipped"
    assert "Email delivery is not configured" in first["jobs"][0]["message"]

    assert second["alerts_seen"] == 1
    assert second["jobs_prepared"] == 0
    assert second["jobs_persisted"] == 0
    assert second["skipped_count"] == 1
    assert second["skipped"][0]["reason"] == "cooldown"
    assert second["skipped"][0]["alert_id"] == created["id"]

    jobs = client.get("/api/v1/alert-delivery-jobs", headers=buyer_headers).json()
    assert len(jobs) == 1


def test_admin_daily_email_alert_batch_requires_admin_role() -> None:
    memory_auth_store.clear()
    memory_user_store.clear()

    response = client.post(
        "/api/v1/admin/alerts/deliver-daily-email",
        headers={"X-Domarion-User-Id": "buyer-1"},
        json={"dry_run": True},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Admin role required"


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


def test_email_delivery_sends_smtp_message(monkeypatch) -> None:
    memory_user_store.clear()
    sent_messages = []
    smtp_sessions = []

    class FakeSMTP:
        def __init__(self, host: str, port: int, timeout: float) -> None:
            self.host = host
            self.port = port
            self.timeout = timeout
            self.started_tls = False
            self.login_args = None
            smtp_sessions.append(self)

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback) -> None:
            return None

        def starttls(self) -> None:
            self.started_tls = True

        def login(self, username: str, password: str) -> None:
            self.login_args = (username, password)

        def send_message(self, message) -> None:
            sent_messages.append(message)

    monkeypatch.setenv("ALERT_EMAIL_ENABLED", "true")
    monkeypatch.setenv("ALERT_EMAIL_SENDER", "alerts@example.com")
    monkeypatch.setenv("ALERT_SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("ALERT_SMTP_PORT", "2525")
    monkeypatch.setenv("ALERT_SMTP_USERNAME", "smtp-user")
    monkeypatch.setenv("ALERT_SMTP_PASSWORD", "smtp-pass")
    monkeypatch.setenv("ALERT_SMTP_USE_TLS", "true")
    monkeypatch.setattr(alert_delivery.smtplib, "SMTP", FakeSMTP)
    get_settings.cache_clear()
    headers = {
        "X-Domarion-User-Id": "smtp-alert-owner",
        "X-Domarion-Email": "buyer@example.com",
    }

    created = client.post(
        "/api/v1/alerts",
        headers=headers,
        json={
            "name": "Email delivery",
            "channel": "email",
            "frequency": "instant",
            "filters": {"city": "Wrocław", "district": "Fabryczna"},
        },
    ).json()
    delivered = client.post(
        f"/api/v1/alerts/{created['id']}/deliver",
        headers=headers,
        json={"dry_run": False, "max_matches": 2},
    )
    job = delivered.json()

    assert delivered.status_code == 200
    assert job["status"] == "sent"
    assert job["provider"] == "email:smtp"
    assert job["delivered_count"] == 1
    assert smtp_sessions[0].host == "smtp.example.com"
    assert smtp_sessions[0].port == 2525
    assert smtp_sessions[0].started_tls is True
    assert smtp_sessions[0].login_args == ("smtp-user", "smtp-pass")
    assert sent_messages[0]["To"] == "buyer@example.com"
    assert "Domarion alert" in sent_messages[0]["Subject"]
    assert "Fabryczna" in sent_messages[0].get_content()
    get_settings.cache_clear()


def test_telegram_delivery_sends_bot_api_payload(monkeypatch) -> None:
    memory_user_store.clear()
    requests = []

    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback) -> None:
            return None

        def read(self) -> bytes:
            return b'{"ok":true}'

    def fake_urlopen(request, timeout: float):
        requests.append((request, timeout))
        return FakeResponse()

    monkeypatch.setenv("ALERT_TELEGRAM_ENABLED", "true")
    monkeypatch.setenv("ALERT_TELEGRAM_BOT_TOKEN", "token-123")
    monkeypatch.setenv("ALERT_TELEGRAM_BOT_NAME", "DomarionTestBot")
    monkeypatch.setenv("ALERT_TELEGRAM_API_BASE_URL", "https://telegram.local")
    monkeypatch.setattr(alert_delivery, "urlopen", fake_urlopen)
    get_settings.cache_clear()
    headers = {"X-Domarion-User-Id": "telegram-send-owner"}

    created = client.post(
        "/api/v1/alerts",
        headers=headers,
        json={
            "name": "Telegram delivery",
            "channel": "telegram",
            "frequency": "instant",
            "delivery_target": "123456",
            "filters": {"city": "Wrocław", "district": "Fabryczna"},
        },
    ).json()
    delivered = client.post(
        f"/api/v1/alerts/{created['id']}/deliver",
        headers=headers,
        json={"dry_run": False, "max_matches": 2},
    )
    job = delivered.json()
    request, timeout = requests[0]

    assert delivered.status_code == 200
    assert job["status"] == "sent"
    assert job["provider"] == "telegram:bot-api"
    assert job["metadata"]["bot_name"] == "DomarionTestBot"
    assert request.full_url == "https://telegram.local/bottoken-123/sendMessage"
    assert timeout == 10.0
    payload = request.data.decode("utf-8")
    assert '"chat_id": "123456"' in payload
    assert "Fabryczna" in payload
    get_settings.cache_clear()
