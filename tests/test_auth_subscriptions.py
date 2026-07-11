from fastapi.testclient import TestClient

from domarion.auth_store.factory import memory_auth_store
from domarion.main import app
from domarion.report_order_store.factory import memory_report_order_store
from domarion.report_store.factory import memory_report_store
from domarion.user_store.factory import memory_user_store

client = TestClient(app)


def setup_function() -> None:
    memory_auth_store.clear()
    memory_report_order_store.clear()
    memory_user_store.clear()
    memory_report_store.clear()


def test_default_demo_account_summary() -> None:
    response = client.get("/api/v1/me")
    payload = response.json()

    assert response.status_code == 200
    assert payload["user"]["id"] == "demo-user"
    assert payload["user"]["role"] == "buyer"
    assert payload["subscription"]["plan"] == "free"
    assert payload["limits"]["monthly_reports"] == 1
    assert payload["usage"] == {
        "favorites": 0,
        "alerts": 0,
        "reports_this_month": 0,
        "report_credits_available": 0,
    }


def test_header_identity_creates_realtor_account() -> None:
    response = client.get(
        "/api/v1/me",
        headers={
            "X-Domarion-User-Id": "agent-1",
            "X-Domarion-Email": "agent@example.com",
            "X-Domarion-Display-Name": "Agent One",
            "X-Domarion-Role": "realtor",
            "X-Domarion-Plan": "realtor",
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["user"]["id"] == "agent-1"
    assert payload["user"]["email"] == "agent@example.com"
    assert payload["user"]["role"] == "realtor"
    assert payload["subscription"]["plan"] == "realtor"
    assert payload["limits"]["can_white_label"] is True


def test_subscription_update_changes_plan_limits() -> None:
    response = client.patch(
        "/api/v1/me/subscription",
        headers={"X-Domarion-User-Id": "buyer-probe"},
        json={"plan": "buyer_pro"},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["subscription"]["plan"] == "buyer_pro"
    assert payload["limits"]["max_alerts"] == 10
    assert payload["limits"]["monthly_reports"] == 20


def test_free_plan_alert_limit_is_enforced() -> None:
    headers = {"X-Domarion-User-Id": "limit-user"}

    first = client.post("/api/v1/alerts", headers=headers, json={"name": "A", "filters": {}})
    second = client.post("/api/v1/alerts", headers=headers, json={"name": "B", "filters": {}})
    third = client.post("/api/v1/alerts", headers=headers, json={"name": "C", "filters": {}})

    assert first.status_code == 201
    assert second.status_code == 201
    assert third.status_code == 403
    assert third.json()["detail"]["resource"] == "alerts"
    assert third.json()["detail"]["limit"] == 2


def test_saved_reports_are_user_scoped() -> None:
    owner_a_headers = {"X-Domarion-User-Id": "report-owner-a"}
    owner_b_headers = {"X-Domarion-User-Id": "report-owner-b"}

    created = client.post(
        "/api/v1/reports/object/generate",
        headers=owner_a_headers,
        json={"listing_id": "wr-001", "audience": "buyer", "report_format": "html"},
    ).json()

    owner_a_reports = client.get("/api/v1/reports", headers=owner_a_headers).json()
    owner_b_reports = client.get("/api/v1/reports", headers=owner_b_headers).json()
    owner_b_report = client.get(f"/api/v1/reports/{created['id']}", headers=owner_b_headers)

    assert created["owner_id"] == "report-owner-a"
    assert len(owner_a_reports) == 1
    assert owner_a_reports[0]["id"] == created["id"]
    assert owner_b_reports == []
    assert owner_b_report.status_code == 404


def test_free_plan_compare_limit_is_enforced() -> None:
    response = client.post(
        "/api/v1/compare",
        headers={"X-Domarion-User-Id": "compare-free"},
        json={"listing_ids": ["wr-001", "wr-002", "wr-003"]},
    )

    assert response.status_code == 403
    assert response.json()["detail"]["resource"] == "compare_items"
