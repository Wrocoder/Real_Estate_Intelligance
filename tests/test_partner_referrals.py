from fastapi.testclient import TestClient

from domarion.auth_store.factory import memory_auth_store
from domarion.main import app
from domarion.partner_referral_store.factory import memory_partner_referral_store

client = TestClient(app)


def setup_function() -> None:
    memory_auth_store.clear()
    memory_partner_referral_store.clear()


def test_partner_referral_create_list_and_owner_scope() -> None:
    headers = {
        "X-Domarion-User-Id": "buyer-1",
        "X-Domarion-Email": "buyer@example.com",
    }

    created = client.post(
        "/api/v1/partner-referrals",
        headers=headers,
        json={
            "referral_type": "mortgage",
            "source_context": "mortgage_calculator",
            "city": "Wrocław",
            "district": "Fabryczna",
            "contact_name": "Buyer One",
            "contact_phone": "+48 500 000 001",
            "message": "Need financing options.",
            "consent_to_contact": True,
            "metadata": {"property_price_pln": 800000},
        },
    )
    payload = created.json()

    assert created.status_code == 201
    assert payload["owner_id"] == "buyer-1"
    assert payload["status"] == "new"
    assert payload["contact_email"] == "buyer@example.com"
    assert payload["metadata"]["property_price_pln"] == 800000

    listed = client.get("/api/v1/partner-referrals", headers=headers).json()
    assert len(listed) == 1
    assert listed[0]["id"] == payload["id"]

    other_owner = client.get(
        f"/api/v1/partner-referrals/{payload['id']}",
        headers={"X-Domarion-User-Id": "buyer-2"},
    )
    assert other_owner.status_code == 404


def test_partner_referral_requires_consent() -> None:
    response = client.post(
        "/api/v1/partner-referrals",
        headers={"X-Domarion-User-Id": "buyer-1"},
        json={
            "referral_type": "legal",
            "contact_email": "buyer@example.com",
            "consent_to_contact": False,
        },
    )

    assert response.status_code == 422


def test_partner_referral_requires_contact_or_account_email() -> None:
    response = client.post(
        "/api/v1/partner-referrals",
        headers={"X-Domarion-User-Id": "buyer-1"},
        json={
            "referral_type": "renovation",
            "contact_email": "",
            "contact_phone": "",
            "consent_to_contact": True,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "Provide contact_email or contact_phone for partner referral"
    )


def test_paid_beta_leads_use_partner_referral_queue() -> None:
    admin_headers = {
        "X-Domarion-User-Id": "admin-1",
        "X-Domarion-Role": "admin",
        "X-Domarion-Plan": "enterprise",
    }

    buyer_lead = client.post(
        "/api/v1/partner-referrals",
        json={
            "referral_type": "buyer_beta",
            "source_context": "buyer_beta_landing",
            "city": "Wrocław",
            "contact_email": "buyer@example.com",
            "message": "Need an object report this week.",
            "consent_to_contact": True,
            "metadata": {
                "entry_point": "/beta",
                "object_reference_private": "https://www.otodom.pl/example",
            },
        },
    )
    realtor_lead = client.post(
        "/api/v1/partner-referrals",
        json={
            "referral_type": "realtor_beta",
            "source_context": "realtor_beta_landing",
            "city": "Wrocław",
            "contact_phone": "+48 500 000 003",
            "message": "Agency wants a 5-report beta bundle.",
            "consent_to_contact": True,
            "metadata": {"entry_point": "/realtors", "agency_name": "Demo Realty"},
        },
    )

    assert buyer_lead.status_code == 201
    assert realtor_lead.status_code == 201
    assert buyer_lead.json()["referral_type"] == "buyer_beta"
    assert buyer_lead.json()["metadata"]["object_reference_private"].startswith(
        "https://www.otodom.pl/"
    )
    assert realtor_lead.json()["referral_type"] == "realtor_beta"
    assert realtor_lead.json()["metadata"]["agency_name"] == "Demo Realty"

    listed = client.get(
        "/api/v1/admin/partner-referrals?status=new&referral_type=buyer_beta",
        headers=admin_headers,
    )
    payload = listed.json()

    assert listed.status_code == 200
    assert len(payload) == 1
    assert payload[0]["id"] == buyer_lead.json()["id"]


def test_admin_can_list_filter_and_update_partner_referrals() -> None:
    buyer_headers = {
        "X-Domarion-User-Id": "buyer-1",
        "X-Domarion-Email": "buyer@example.com",
    }
    admin_headers = {
        "X-Domarion-User-Id": "admin-1",
        "X-Domarion-Role": "admin",
        "X-Domarion-Plan": "enterprise",
    }

    created = client.post(
        "/api/v1/partner-referrals",
        headers=buyer_headers,
        json={
            "referral_type": "renovation",
            "city": "Wrocław",
            "contact_phone": "+48 500 000 002",
            "consent_to_contact": True,
        },
    ).json()

    listed = client.get(
        "/api/v1/admin/partner-referrals?status=new&referral_type=renovation",
        headers=admin_headers,
    )
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [created["id"]]

    updated = client.patch(
        f"/api/v1/admin/partner-referrals/{created['id']}",
        headers=admin_headers,
        json={
            "status": "qualified",
            "assigned_to": "ops@example.com",
            "partner_name": "Renovation Partner",
            "notes": "Ready to hand off.",
        },
    )
    payload = updated.json()

    assert updated.status_code == 200
    assert payload["status"] == "qualified"
    assert payload["assigned_to"] == "ops@example.com"
    assert payload["partner_name"] == "Renovation Partner"
    assert payload["notes"] == "Ready to hand off."


def test_partner_referral_admin_endpoints_require_admin_role() -> None:
    response = client.get(
        "/api/v1/admin/partner-referrals",
        headers={"X-Domarion-User-Id": "buyer-1"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Admin role required"
