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


def test_admin_can_score_partner_referrals_for_handoff_priority() -> None:
    buyer_headers = {
        "X-Domarion-User-Id": "mortgage-buyer-1",
        "X-Domarion-Email": "buyer@example.com",
    }
    admin_headers = {
        "X-Domarion-User-Id": "admin-1",
        "X-Domarion-Role": "admin",
        "X-Domarion-Plan": "enterprise",
    }
    hot_lead = client.post(
        "/api/v1/partner-referrals",
        headers=buyer_headers,
        json={
            "referral_type": "mortgage",
            "source_context": "mortgage_calculator",
            "listing_id": "wr-001",
            "city": "Wrocław",
            "district": "Fabryczna",
            "contact_name": "Buyer One",
            "contact_email": "buyer@example.com",
            "contact_phone": "+48 500 000 009",
            "message": "Urgent mortgage financing. Ready to make an offer this week.",
            "consent_to_contact": True,
            "metadata": {
                "property_price_pln": 800000,
                "purchase_timeline": "this month",
            },
        },
    ).json()
    nurture_lead = client.post(
        "/api/v1/partner-referrals",
        headers={"X-Domarion-User-Id": "buyer-beta-1", "X-Domarion-Email": "beta@example.com"},
        json={
            "referral_type": "buyer_beta",
            "source_context": "buyer_beta_landing",
            "city": "Wrocław",
            "contact_email": "beta@example.com",
            "consent_to_contact": True,
        },
    ).json()

    scores_response = client.get(
        "/api/v1/admin/partner-referrals/lead-scores?min_score=60",
        headers=admin_headers,
    )
    scores = scores_response.json()

    assert scores_response.status_code == 200
    assert [score["referral"]["id"] for score in scores] == [hot_lead["id"]]
    assert scores[0]["priority"] == "hot"
    assert scores[0]["partner_fit"] == "mortgage"
    assert scores[0]["qualification_status"] == "ready_for_partner_handoff"
    assert scores[0]["estimated_deal_value_pln"] == 800000
    assert scores[0]["next_action_due_hours"] == 4
    assert "mortgage" in scores[0]["routing_tags"]
    assert scores[0]["components"]
    assert "not credit advice" in scores[0]["disclaimer"]

    single_response = client.get(
        f"/api/v1/admin/partner-referrals/{nurture_lead['id']}/lead-score",
        headers=admin_headers,
    )
    single = single_response.json()

    assert single_response.status_code == 200
    assert single["referral"]["id"] == nurture_lead["id"]
    assert single["partner_fit"] == "beta_sales"
    assert single["priority"] in {"nurture", "warm"}
    assert single["recommended_actions"]


def test_admin_paid_beta_tracking_sheet_defaults_and_update() -> None:
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
            "district": "Krzyki",
            "contact_email": "buyer@example.com",
            "message": "Need a report before making an offer.",
            "consent_to_contact": True,
            "metadata": {
                "entry_point": "/beta",
                "beta_segment": "buyer_beta",
                "object_reference_private": "https://www.otodom.pl/example",
            },
        },
    ).json()
    client.post(
        "/api/v1/partner-referrals",
        json={
            "referral_type": "mortgage",
            "source_context": "mortgage_calculator",
            "city": "Wrocław",
            "contact_email": "mortgage@example.com",
            "consent_to_contact": True,
        },
    )

    listed = client.get("/api/v1/admin/paid-beta/tracking", headers=admin_headers)
    rows = listed.json()

    assert listed.status_code == 200
    assert len(rows) == 1
    assert rows[0]["referral_id"] == buyer_lead["id"]
    assert rows[0]["tracking"]["lead_source"] == "/beta"
    assert rows[0]["tracking"]["segment"] == "buyer_beta"
    assert rows[0]["tracking"]["payment_status"] == "unpaid"
    assert rows[0]["tracking"]["price_paid_pln"] == 0
    assert rows[0]["tracking"]["report_type"] == "buyer_check"
    assert rows[0]["tracking"]["decision_impact"] == "pending"

    updated = client.patch(
        f"/api/v1/admin/paid-beta/tracking/{buyer_lead['id']}",
        headers=admin_headers,
        json={
            "lead_source": "facebook-buyer-group",
            "payment_status": "paid",
            "price_paid_pln": 149,
            "report_type": "full_due_diligence",
            "decision_impact": "negotiated_lower",
            "decision_impact_note": "Buyer used opening offer in seller call.",
            "objections": ["wanted more legal certainty"],
            "missing_trust_data": ["noise data"],
            "refund_risk": "low",
            "next_follow_up_date": "2026-09-03",
            "expert_review_interest": True,
            "manual_qa_status": "passed",
            "manual_qa_notes": "No source URL leak.",
        },
    )
    payload = updated.json()

    assert updated.status_code == 200
    tracking = payload["tracking"]
    assert tracking["lead_source"] == "facebook-buyer-group"
    assert tracking["payment_status"] == "paid"
    assert tracking["price_paid_pln"] == 149
    assert tracking["report_type"] == "full_due_diligence"
    assert tracking["decision_impact"] == "negotiated_lower"
    assert tracking["objections"] == ["wanted more legal certainty"]
    assert tracking["missing_trust_data"] == ["noise data"]
    assert tracking["refund_risk"] == "low"
    assert tracking["next_follow_up_date"] == "2026-09-03"
    assert tracking["expert_review_interest"] is True
    assert tracking["manual_qa_status"] == "passed"

    stored = client.get(
        f"/api/v1/partner-referrals/{buyer_lead['id']}",
        headers={"X-Domarion-User-Id": buyer_lead["owner_id"]},
    ).json()
    assert stored["metadata"]["paid_beta_tracking"]["price_paid_pln"] == 149
    assert stored["metadata"]["object_reference_private"].startswith("https://www.otodom.pl/")


def test_paid_beta_tracking_requires_admin_and_beta_referral() -> None:
    created = client.post(
        "/api/v1/partner-referrals",
        json={
            "referral_type": "legal",
            "source_context": "manual",
            "city": "Wrocław",
            "contact_email": "buyer@example.com",
            "consent_to_contact": True,
        },
    ).json()

    forbidden = client.get(
        "/api/v1/admin/paid-beta/tracking",
        headers={"X-Domarion-User-Id": "buyer-1"},
    )
    rejected = client.patch(
        f"/api/v1/admin/paid-beta/tracking/{created['id']}",
        headers={
            "X-Domarion-User-Id": "admin-1",
            "X-Domarion-Role": "admin",
            "X-Domarion-Plan": "enterprise",
        },
        json={"payment_status": "paid"},
    )

    assert forbidden.status_code == 403
    assert forbidden.json()["detail"] == "Admin role required"
    assert rejected.status_code == 400
    assert rejected.json()["detail"] == "Referral is not a paid beta lead"


def test_partner_referral_lead_scores_require_admin_role() -> None:
    response = client.get(
        "/api/v1/admin/partner-referrals/lead-scores",
        headers={"X-Domarion-User-Id": "buyer-1"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Admin role required"


def test_partner_referral_admin_endpoints_require_admin_role() -> None:
    response = client.get(
        "/api/v1/admin/partner-referrals",
        headers={"X-Domarion-User-Id": "buyer-1"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Admin role required"
