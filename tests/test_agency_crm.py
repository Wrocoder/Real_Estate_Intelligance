from fastapi.testclient import TestClient

from domarion.agency_store.factory import memory_agency_store
from domarion.auth_store.factory import memory_auth_store
from domarion.crm_store.factory import memory_crm_store
from domarion.main import app

client = TestClient(app)

OWNER_HEADERS = {
    "X-Domarion-User-Id": "crm-owner-1",
    "X-Domarion-Email": "owner@example.com",
    "X-Domarion-Display-Name": "CRM Owner",
    "X-Domarion-Role": "agency_admin",
    "X-Domarion-Plan": "agency",
}

AGENT_HEADERS = {
    "X-Domarion-User-Id": "crm-agent-1",
    "X-Domarion-Email": "agent@example.com",
    "X-Domarion-Display-Name": "CRM Agent",
}


def setup_function() -> None:
    memory_auth_store.clear()
    memory_agency_store.clear()
    memory_crm_store.clear()


def test_agency_crm_client_notes_shortlist_and_public_share() -> None:
    agency = _create_agency()
    _add_agent(agency["id"])

    created_client_response = client.post(
        f"/api/v1/agencies/{agency['id']}/crm/clients",
        headers=OWNER_HEADERS,
        json={
            "display_name": " Anna Buyer ",
            "email": "ANNA@example.com",
            "city": "Wrocław",
            "district": "Fabryczna",
            "budget_min": 650_000,
            "budget_max": 900_000,
            "preferred_rooms": [3, 2, 3],
            "tags": ["urgent", "Family", "urgent"],
            "consent_to_contact": True,
        },
    )
    created_client = created_client_response.json()

    assert created_client_response.status_code == 201
    assert created_client["display_name"] == "Anna Buyer"
    assert created_client["email"] == "anna@example.com"
    assert created_client["preferred_rooms"] == [3, 2]
    assert created_client["tags"] == ["urgent", "Family"]
    assert created_client["owner_id"] == "crm-owner-1"

    note_response = client.post(
        f"/api/v1/agencies/{agency['id']}/crm/clients/{created_client['id']}/notes",
        headers=AGENT_HEADERS,
        json={
            "body": "Client prefers a quiet building and quick tram access.",
            "visibility": "client_shareable",
            "pinned": True,
        },
    )
    note = note_response.json()

    assert note_response.status_code == 201
    assert note["author_id"] == "crm-agent-1"
    assert note["visibility"] == "client_shareable"

    shortlist_response = client.post(
        f"/api/v1/agencies/{agency['id']}/crm/clients/{created_client['id']}/shortlists",
        headers=AGENT_HEADERS,
        json={
            "title": "Top Wrocław options",
            "listing_ids": ["wr-001", "wr-002", "wr-001"],
            "client_message": "These two options are worth discussing before viewings.",
            "share_enabled": True,
        },
    )
    shortlist = shortlist_response.json()

    assert shortlist_response.status_code == 201
    assert shortlist["status"] == "shared"
    assert shortlist["listing_ids"] == ["wr-001", "wr-002"]
    assert shortlist["share_token"]
    assert shortlist["share_url"].endswith(shortlist["share_token"])
    assert len(shortlist["items"]) == 2
    assert {item["listing_id"] for item in shortlist["items"]} == {"wr-001", "wr-002"}
    assert all("source_url" not in item for item in shortlist["items"])
    assert shortlist["items"][0]["developer_reputation_score"] is not None
    assert shortlist["items"][0]["decision_score"] >= shortlist["items"][1]["decision_score"]

    preview = client.post(
        (
            f"/api/v1/agencies/{agency['id']}/crm/clients/{created_client['id']}"
            f"/shortlists/{shortlist['id']}/share-preview"
        ),
        headers=OWNER_HEADERS,
    ).json()

    assert preview["title"] == "Top Wrocław options"
    assert preview["client_display_name"] == "Anna Buyer"
    assert preview["client_shareable_notes"] == [
        "Client prefers a quiet building and quick tram access."
    ]
    assert "not financial, legal or investment advice" in preview["disclaimer"]

    public_preview_response = client.get(
        f"/api/v1/crm/shared-shortlists/{shortlist['share_token']}"
    )
    public_preview = public_preview_response.json()

    assert public_preview_response.status_code == 200
    assert public_preview["share_token"] == shortlist["share_token"]
    assert public_preview["items"] == preview["items"]

    detail = client.get(
        f"/api/v1/agencies/{agency['id']}/crm/clients/{created_client['id']}",
        headers=AGENT_HEADERS,
    ).json()

    assert len(detail["notes"]) == 1
    assert len(detail["shortlists"]) == 1
    assert detail["shortlists"][0]["items"]

    disabled = client.patch(
        (
            f"/api/v1/agencies/{agency['id']}/crm/clients/{created_client['id']}"
            f"/shortlists/{shortlist['id']}"
        ),
        headers=OWNER_HEADERS,
        json={"share_enabled": False},
    ).json()

    assert disabled["share_enabled"] is False
    assert disabled["share_token"] is None
    disabled_public = client.get(f"/api/v1/crm/shared-shortlists/{shortlist['share_token']}")
    assert disabled_public.status_code == 404


def test_agency_crm_is_workspace_scoped() -> None:
    agency = _create_agency()
    created_client = _create_client(agency["id"])

    response = client.get(
        f"/api/v1/agencies/{agency['id']}/crm/clients/{created_client['id']}",
        headers={"X-Domarion-User-Id": "outside-user"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Agency workspace not found"


def test_agency_crm_shortlist_rejects_missing_listings() -> None:
    agency = _create_agency()
    created_client = _create_client(agency["id"])

    response = client.post(
        f"/api/v1/agencies/{agency['id']}/crm/clients/{created_client['id']}/shortlists",
        headers=OWNER_HEADERS,
        json={
            "title": "Broken shortlist",
            "listing_ids": ["wr-001", "missing-listing"],
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == {"missing_listing_ids": ["missing-listing"]}


def _create_agency() -> dict:
    response = client.post(
        "/api/v1/agencies",
        headers=OWNER_HEADERS,
        json={"name": "CRM Realty", "city": "Wrocław"},
    )
    assert response.status_code == 201
    return response.json()


def _add_agent(agency_id: str) -> dict:
    response = client.post(
        f"/api/v1/agencies/{agency_id}/members",
        headers=OWNER_HEADERS,
        json={
            "user_id": "crm-agent-1",
            "email": "agent@example.com",
            "display_name": "CRM Agent",
            "role": "agent",
        },
    )
    assert response.status_code == 201
    return response.json()


def _create_client(agency_id: str) -> dict:
    response = client.post(
        f"/api/v1/agencies/{agency_id}/crm/clients",
        headers=OWNER_HEADERS,
        json={"display_name": "Scoped Client"},
    )
    assert response.status_code == 201
    return response.json()
