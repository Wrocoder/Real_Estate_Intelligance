from fastapi.testclient import TestClient

from domarion.agency_store.factory import memory_agency_store
from domarion.auth_store.factory import memory_auth_store
from domarion.main import app

client = TestClient(app)

OWNER_HEADERS = {
    "X-Domarion-User-Id": "agency-owner-1",
    "X-Domarion-Email": "owner@example.com",
    "X-Domarion-Display-Name": "Owner One",
    "X-Domarion-Role": "agency_admin",
    "X-Domarion-Plan": "agency",
}


def setup_function() -> None:
    memory_auth_store.clear()
    memory_agency_store.clear()


def test_agency_plan_user_can_create_workspace_and_owner_membership() -> None:
    response = client.post(
        "/api/v1/agencies",
        headers=OWNER_HEADERS,
        json={
            "name": "Example Realty",
            "billing_email": "Billing@Example.com",
            "website_url": "https://example.com",
            "city": "Wrocław",
        },
    )
    payload = response.json()

    assert response.status_code == 201
    assert payload["name"] == "Example Realty"
    assert payload["billing_email"] == "billing@example.com"
    assert payload["current_user_role"] == "owner"
    assert payload["members_count"] == 1
    assert payload["members"][0]["user_id"] == "agency-owner-1"
    assert payload["members"][0]["role"] == "owner"

    listed = client.get("/api/v1/agencies", headers=OWNER_HEADERS).json()
    assert len(listed) == 1
    assert listed[0]["id"] == payload["id"]


def test_agency_creation_requires_agency_plan() -> None:
    response = client.post(
        "/api/v1/agencies",
        headers={"X-Domarion-User-Id": "free-owner"},
        json={"name": "Free Plan Agency"},
    )

    assert response.status_code == 403
    assert response.json()["detail"]["resource"] == "agency_accounts"
    assert response.json()["detail"]["required_plan"] == "agency"


def test_agency_owner_can_add_and_update_member_roles() -> None:
    agency = _create_agency()

    created_member = client.post(
        f"/api/v1/agencies/{agency['id']}/members",
        headers=OWNER_HEADERS,
        json={
            "user_id": "agency-agent-1",
            "email": "agent@example.com",
            "display_name": "Agent One",
            "role": "agent",
        },
    ).json()

    assert created_member["role"] == "agent"
    assert created_member["status"] == "active"

    updated = client.patch(
        f"/api/v1/agencies/{agency['id']}/members/{created_member['id']}",
        headers=OWNER_HEADERS,
        json={"role": "admin"},
    ).json()

    assert updated["role"] == "admin"

    detail = client.get(f"/api/v1/agencies/{agency['id']}", headers=OWNER_HEADERS).json()
    assert detail["members_count"] == 2
    assert {member["role"] for member in detail["members"]} == {"owner", "admin"}


def test_agency_agent_can_read_but_cannot_manage_members() -> None:
    agency = _create_agency()
    client.post(
        f"/api/v1/agencies/{agency['id']}/members",
        headers=OWNER_HEADERS,
        json={"user_id": "agency-agent-2", "email": "agent2@example.com", "role": "agent"},
    )
    agent_headers = {"X-Domarion-User-Id": "agency-agent-2"}

    readable = client.get(f"/api/v1/agencies/{agency['id']}", headers=agent_headers)
    denied = client.post(
        f"/api/v1/agencies/{agency['id']}/members",
        headers=agent_headers,
        json={"user_id": "agency-agent-3", "role": "agent"},
    )

    assert readable.status_code == 200
    assert readable.json()["current_user_role"] == "agent"
    assert denied.status_code == 403
    assert denied.json()["detail"]["code"] == "agency_permission_denied"


def test_agency_cannot_remove_last_active_owner() -> None:
    agency = _create_agency()
    owner_member_id = agency["members"][0]["id"]

    deleted = client.delete(
        f"/api/v1/agencies/{agency['id']}/members/{owner_member_id}",
        headers=OWNER_HEADERS,
    )
    demoted = client.patch(
        f"/api/v1/agencies/{agency['id']}/members/{owner_member_id}",
        headers=OWNER_HEADERS,
        json={"role": "admin"},
    )

    assert deleted.status_code == 400
    assert deleted.json()["detail"] == "Agency must keep at least one active owner"
    assert demoted.status_code == 400
    assert demoted.json()["detail"] == "Agency must keep at least one active owner"


def _create_agency() -> dict:
    response = client.post(
        "/api/v1/agencies",
        headers=OWNER_HEADERS,
        json={"name": "Example Realty", "city": "Wrocław"},
    )
    assert response.status_code == 201
    return response.json()
