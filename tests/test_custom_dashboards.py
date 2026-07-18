from fastapi.testclient import TestClient

from domarion.auth_store.factory import memory_auth_store
from domarion.custom_dashboard_store.factory import memory_custom_dashboard_store
from domarion.main import app

client = TestClient(app)

ENTERPRISE_HEADERS = {
    "X-Domarion-User-Id": "enterprise-dashboard-owner",
    "X-Domarion-Email": "enterprise@example.com",
    "X-Domarion-Role": "agency_admin",
    "X-Domarion-Plan": "enterprise",
}


def setup_function() -> None:
    memory_auth_store.clear()
    memory_custom_dashboard_store.clear()


def test_enterprise_user_can_manage_custom_dashboard_and_preview() -> None:
    created_response = client.post(
        "/api/v1/enterprise/custom-dashboards",
        headers=ENTERPRISE_HEADERS,
        json={
            "name": "Underwriting Wrocław",
            "description": "Credit committee market dashboard",
            "audience": "underwriting",
            "city": "Wrocław",
            "district": "Fabryczna",
            "widget_codes": [
                "market_kpis",
                "area_watchlist",
                "market_kpis",
                "risk_flags",
                "developer_ranking",
                "scoring_distribution",
            ],
            "filters": {"min_liquidity_score": 55},
            "refresh_interval_minutes": 120,
            "is_default": True,
            "shared_with_agency_ids": ["bank-team-a", "bank-team-a"],
        },
    )
    created = created_response.json()

    assert created_response.status_code == 201
    assert created["owner_id"] == "enterprise-dashboard-owner"
    assert created["audience"] == "underwriting"
    assert created["widget_codes"].count("market_kpis") == 1
    assert created["shared_with_agency_ids"] == ["bank-team-a"]
    assert created["is_default"] is True

    listed = client.get(
        "/api/v1/enterprise/custom-dashboards",
        headers=ENTERPRISE_HEADERS,
    ).json()
    assert len(listed) == 1
    assert listed[0]["id"] == created["id"]

    updated_response = client.patch(
        f"/api/v1/enterprise/custom-dashboards/{created['id']}",
        headers=ENTERPRISE_HEADERS,
        json={
            "name": "Underwriting Wrocław v2",
            "notes": "Pilot dashboard for bank analyst team.",
            "widget_codes": ["market_kpis", "risk_flags", "api_usage"],
        },
    )
    updated = updated_response.json()

    assert updated_response.status_code == 200
    assert updated["name"] == "Underwriting Wrocław v2"
    assert updated["notes"] == "Pilot dashboard for bank analyst team."
    assert updated["widget_codes"] == ["market_kpis", "risk_flags", "api_usage"]

    preview_response = client.post(
        f"/api/v1/enterprise/custom-dashboards/{created['id']}/preview",
        headers=ENTERPRISE_HEADERS,
    )
    preview = preview_response.json()

    assert preview_response.status_code == 200
    assert preview["config"]["id"] == created["id"]
    assert preview["dashboard"]["district"] == "Fabryczna"
    assert preview["market_intelligence"]["audience"] == "bank"
    assert [widget["widget_code"] for widget in preview["widgets"]] == [
        "market_kpis",
        "risk_flags",
        "api_usage",
    ]
    assert preview["widgets"][0]["status"] == "ready"
    assert preview["widgets"][2]["status"] == "planned"
    assert "raw HTML" in preview["source_notes"][1]
    assert "not financial" in preview["disclaimer"]

    deleted = client.delete(
        f"/api/v1/enterprise/custom-dashboards/{created['id']}",
        headers=ENTERPRISE_HEADERS,
    )
    missing = client.get(
        f"/api/v1/enterprise/custom-dashboards/{created['id']}",
        headers=ENTERPRISE_HEADERS,
    )

    assert deleted.status_code == 204
    assert missing.status_code == 404


def test_custom_dashboard_requires_enterprise_plan() -> None:
    response = client.post(
        "/api/v1/enterprise/custom-dashboards",
        headers={
            "X-Domarion-User-Id": "agency-dashboard-owner",
            "X-Domarion-Plan": "agency",
        },
        json={"name": "Agency dashboard"},
    )

    assert response.status_code == 403
    assert response.json()["detail"]["resource"] == "enterprise_dashboards"
    assert response.json()["detail"]["required_plan"] == "enterprise"


def test_custom_dashboard_is_owner_scoped() -> None:
    created = client.post(
        "/api/v1/enterprise/custom-dashboards",
        headers=ENTERPRISE_HEADERS,
        json={"name": "Private enterprise dashboard"},
    ).json()
    other_headers = {
        "X-Domarion-User-Id": "other-enterprise-dashboard-owner",
        "X-Domarion-Plan": "enterprise",
    }

    other_list = client.get(
        "/api/v1/enterprise/custom-dashboards",
        headers=other_headers,
    )
    other_get = client.get(
        f"/api/v1/enterprise/custom-dashboards/{created['id']}",
        headers=other_headers,
    )
    other_preview = client.post(
        f"/api/v1/enterprise/custom-dashboards/{created['id']}/preview",
        headers=other_headers,
    )

    assert other_list.status_code == 200
    assert other_list.json() == []
    assert other_get.status_code == 404
    assert other_preview.status_code == 404
