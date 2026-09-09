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
    assert payload["buyer_profile"] is None


def test_buyer_profile_can_be_saved_updated_and_deleted() -> None:
    headers = {"X-Domarion-User-Id": "profile-owner"}

    created = client.put(
        "/api/v1/me/buyer-profile",
        headers=headers,
        json={
            "intent": "family",
            "budget_pln": 850_000,
            "priorities": ["family_fit", "low_risk", "price_value"],
        },
    )

    assert created.status_code == 200
    profile = created.json()
    assert profile["owner_id"] == "profile-owner"
    assert profile["intent"] == "family"
    assert profile["budget_pln"] == 850_000
    assert profile["priorities"] == ["family_fit", "low_risk", "price_value"]
    assert client.get("/api/v1/me", headers=headers).json()["buyer_profile"] == profile

    updated = client.put(
        "/api/v1/me/buyer-profile",
        headers=headers,
        json={
            "intent": "investment",
            "budget_pln": None,
            "priorities": ["liquidity", "rental_income"],
        },
    )
    assert updated.status_code == 200
    assert updated.json()["created_at"] == profile["created_at"]
    assert updated.json()["intent"] == "investment"
    assert updated.json()["budget_pln"] is None

    deleted = client.delete("/api/v1/me/buyer-profile", headers=headers)
    assert deleted.status_code == 204
    assert client.get("/api/v1/me", headers=headers).json()["buyer_profile"] is None


def test_buyer_profile_is_scoped_and_validates_priorities() -> None:
    owner_headers = {"X-Domarion-User-Id": "profile-owner-a"}
    other_headers = {"X-Domarion-User-Id": "profile-owner-b"}
    payload = {
        "intent": "self",
        "budget_pln": 700_000,
        "priorities": ["daily_living", "low_risk"],
    }

    saved = client.put("/api/v1/me/buyer-profile", headers=owner_headers, json=payload)
    assert saved.status_code == 200
    assert client.get("/api/v1/me", headers=other_headers).json()["buyer_profile"] is None

    too_many = client.put(
        "/api/v1/me/buyer-profile",
        headers=owner_headers,
        json={
            "intent": "self",
            "priorities": ["price_value", "low_risk", "daily_living", "liquidity"],
        },
    )
    duplicate = client.put(
        "/api/v1/me/buyer-profile",
        headers=owner_headers,
        json={"intent": "self", "priorities": ["low_risk", "low_risk"]},
    )

    assert too_many.status_code == 422
    assert duplicate.status_code == 422


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


def test_investor_plan_limits_are_available() -> None:
    plans = client.get("/api/v1/plans").json()
    investor_plan = next(item for item in plans if item["plan"] == "investor")

    response = client.patch(
        "/api/v1/me/subscription",
        headers={"X-Domarion-User-Id": "investor-probe"},
        json={"plan": "investor"},
    )
    payload = response.json()

    assert investor_plan["monthly_reports"] == 60
    assert investor_plan["can_export"] is True
    assert investor_plan["can_use_api"] is False
    assert payload["subscription"]["plan"] == "investor"
    assert payload["limits"]["max_alerts"] == 40
    assert payload["limits"]["monthly_reports"] == 60


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
