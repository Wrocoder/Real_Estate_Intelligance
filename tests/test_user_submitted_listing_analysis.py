from fastapi.testclient import TestClient

from domarion.main import app
from domarion.report_store.factory import memory_report_store
from domarion.user_submitted_listing_store.factory import memory_user_submitted_listing_store

client = TestClient(app)


def setup_function() -> None:
    memory_user_submitted_listing_store.clear()
    memory_report_store.clear()


def test_user_submitted_listing_analysis_keeps_source_url_private() -> None:
    source_url = "https://www.otodom.pl/pl/oferta/demo-private-reference"
    response = client.post(
        "/api/v1/user-submitted-listings/analyze",
        json={
            "source_url": source_url,
            "address": "Nowy Dwór, Wrocław",
            "city": "Wrocław",
            "district": "Fabryczna",
            "market_type": "secondary",
            "price": 675000,
            "area_m2": 58.4,
            "rooms": 3,
            "floor": 3,
            "building_floors": 6,
            "building_year": 2014,
            "confirm_private_analysis": True,
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["source_url_private"] == source_url
    assert payload["source_domain"] == "otodom.pl"
    assert payload["analysis"]["listing"]["id"].startswith("user-submitted-")
    assert payload["analysis"]["listing"]["source_url"] != source_url
    assert payload["analysis"]["listing"]["source_url"].startswith("private:")
    assert payload["analysis"]["listing"]["price_per_m2"] == round(675000 / 58.4)
    assert payload["analysis"]["area_statistics"]["area_id"] == "wroclaw-fabryczna"
    assert 0 <= payload["confidence_score"] <= 100
    assert payload["draft_id"]
    assert payload["draft_expires_at"]
    assert payload["analysis"]["comparables"]
    assert "legal-first" in payload["comparables_basis"]
    assert any("No live portal data was fetched" in item for item in payload["warnings"])


def test_user_submitted_listing_reference_preview_for_otodom_url() -> None:
    source_url = "www.otodom.pl/pl/oferta/mieszkanie-3-pokoje-wroclaw-ID4abc123"

    response = client.post(
        "/api/v1/user-submitted-listings/reference-preview",
        json={"source_url": source_url},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["source_url_private"] == f"https://{source_url}"
    assert payload["source_domain"] == "otodom.pl"
    assert payload["provider"] == "otodom"
    assert payload["provider_label"] == "Otodom"
    assert payload["listing_reference_id"] == "ID4abc123"
    assert payload["suggested_title"] == "Mieszkanie 3 pokoje wroclaw"
    assert "price" in payload["manual_fields_required"]
    assert any("No portal page was fetched" in item for item in payload["warnings"])


def test_user_submitted_listing_reference_preview_for_olx_url() -> None:
    response = client.post(
        "/api/v1/user-submitted-listings/reference-preview",
        json={
            "source_url": "https://www.olx.pl/d/oferta/kawalerka-wroclaw-krzyki-IDabc987.html"
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["source_domain"] == "olx.pl"
    assert payload["provider"] == "olx"
    assert payload["provider_label"] == "OLX"
    assert payload["listing_reference_id"] == "IDabc987"
    assert payload["source_slug"] == "kawalerka-wroclaw-krzyki-IDabc987"


def test_user_submitted_listing_analysis_requires_private_confirmation() -> None:
    response = client.post(
        "/api/v1/user-submitted-listings/analyze",
        json={
            "address": "Nowy Dwór, Wrocław",
            "city": "Wrocław",
            "district": "Fabryczna",
            "market_type": "secondary",
            "price": 675000,
            "area_m2": 58.4,
            "rooms": 3,
            "confirm_private_analysis": False,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Private analysis confirmation is required"


def test_user_submitted_listing_report_uses_buyer_template_without_source_url_leak() -> None:
    source_url = "https://www.otodom.pl/pl/oferta/demo-private-reference"
    response = client.post(
        "/api/v1/user-submitted-listings/report",
        json={
            "source_url": source_url,
            "address": "Nowy Dwór, Wrocław",
            "city": "Wrocław",
            "district": "Fabryczna",
            "market_type": "secondary",
            "price": 675000,
            "area_m2": 58.4,
            "rooms": 3,
            "floor": 3,
            "building_floors": 6,
            "building_year": 2014,
            "audience": "buyer",
            "confirm_private_analysis": True,
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["analysis"]["source_url_private"] == source_url
    assert payload["analysis"]["draft_id"]
    assert payload["analysis"]["analysis"]["listing"]["source_url"] != source_url
    assert payload["report"]["template_code"] == "buyer_object_report_v1"
    assert payload["report"]["listing_id"].startswith("user-submitted-")
    assert "не финансовая" in payload["report"]["disclaimer"]
    section_titles = {section["title"] for section in payload["report"]["sections"]}
    assert "Вопросы продавцу" in section_titles
    assert "Чеклист проверки перед оффером" in section_titles


def test_user_submitted_listing_drafts_are_owner_scoped_and_deletable() -> None:
    owner_a = {"X-Domarion-User-Id": "draft-owner-a"}
    owner_b = {"X-Domarion-User-Id": "draft-owner-b"}
    created = client.post(
        "/api/v1/user-submitted-listings/analyze",
        headers=owner_a,
        json={
            "source_url": "https://www.otodom.pl/pl/oferta/demo-owner-a",
            "address": "Nowy Dwór, Wrocław",
            "city": "Wrocław",
            "district": "Fabryczna",
            "market_type": "secondary",
            "price": 675000,
            "area_m2": 58.4,
            "rooms": 3,
            "confirm_private_analysis": True,
            "retention_days": 7,
        },
    ).json()
    draft_id = created["draft_id"]

    owner_a_list = client.get("/api/v1/user-submitted-listings/drafts", headers=owner_a)
    owner_b_list = client.get("/api/v1/user-submitted-listings/drafts", headers=owner_b)
    owner_b_get = client.get(f"/api/v1/user-submitted-listings/drafts/{draft_id}", headers=owner_b)
    owner_a_get = client.get(f"/api/v1/user-submitted-listings/drafts/{draft_id}", headers=owner_a)
    owner_a_delete = client.delete(
        f"/api/v1/user-submitted-listings/drafts/{draft_id}",
        headers=owner_a,
    )
    owner_a_get_deleted = client.get(
        f"/api/v1/user-submitted-listings/drafts/{draft_id}",
        headers=owner_a,
    )

    assert owner_a_list.status_code == 200
    assert owner_a_list.json()[0]["id"] == draft_id
    assert owner_a_list.json()[0]["source_url_private"].endswith("demo-owner-a")
    assert owner_b_list.status_code == 200
    assert owner_b_list.json() == []
    assert owner_b_get.status_code == 404
    assert owner_a_get.status_code == 200
    assert owner_a_get.json()["request_payload"]["retention_days"] == 7
    assert owner_a_delete.status_code == 204
    assert owner_a_get_deleted.status_code == 404


def test_user_submitted_listing_analysis_can_skip_private_draft() -> None:
    response = client.post(
        "/api/v1/user-submitted-listings/analyze",
        headers={"X-Domarion-User-Id": "draft-skip-owner"},
        json={
            "address": "Nowy Dwór, Wrocław",
            "city": "Wrocław",
            "district": "Fabryczna",
            "market_type": "secondary",
            "price": 675000,
            "area_m2": 58.4,
            "rooms": 3,
            "confirm_private_analysis": True,
            "save_private_draft": False,
        },
    )
    drafts = client.get(
        "/api/v1/user-submitted-listings/drafts",
        headers={"X-Domarion-User-Id": "draft-skip-owner"},
    )

    assert response.status_code == 200
    assert response.json()["draft_id"] is None
    assert drafts.json() == []


def test_admin_can_list_and_prune_user_submitted_listing_drafts() -> None:
    client.post(
        "/api/v1/user-submitted-listings/analyze",
        headers={"X-Domarion-User-Id": "draft-admin-source"},
        json={
            "source_url": "https://www.otodom.pl/pl/oferta/demo-admin",
            "address": "Nowy Dwór, Wrocław",
            "city": "Wrocław",
            "district": "Fabryczna",
            "market_type": "secondary",
            "price": 675000,
            "area_m2": 58.4,
            "rooms": 3,
            "confirm_private_analysis": True,
        },
    )
    admin_headers = {
        "X-Domarion-User-Id": "draft-admin",
        "X-Domarion-Role": "admin",
        "X-Domarion-Plan": "enterprise",
    }

    response = client.get("/api/v1/admin/user-submitted-listing-drafts", headers=admin_headers)
    prune_response = client.post(
        "/api/v1/admin/user-submitted-listing-drafts/prune-expired",
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()[0]["owner_id"] == "draft-admin-source"
    assert response.json()[0]["source_domain"] == "otodom.pl"
    assert prune_response.status_code == 200
    assert prune_response.json() == {"deleted": 0}


def test_user_submitted_listing_draft_can_generate_saved_report_without_url_leak() -> None:
    headers = {"X-Domarion-User-Id": "draft-report-owner"}
    source_url = "https://www.otodom.pl/pl/oferta/demo-draft-report"
    created = client.post(
        "/api/v1/user-submitted-listings/analyze",
        headers=headers,
        json={
            "source_url": source_url,
            "address": "Nowy Dwór, Wrocław",
            "city": "Wrocław",
            "district": "Fabryczna",
            "market_type": "secondary",
            "price": 675000,
            "area_m2": 58.4,
            "rooms": 3,
            "confirm_private_analysis": True,
        },
    ).json()

    response = client.post(
        f"/api/v1/user-submitted-listings/drafts/{created['draft_id']}/reports/generate",
        headers=headers,
        json={"audience": "buyer", "report_format": "html"},
    )
    payload = response.json()
    reports = client.get("/api/v1/reports", headers=headers).json()

    assert response.status_code == 200
    assert payload["owner_id"] == "draft-report-owner"
    assert payload["listing_id"].startswith("user-submitted-")
    assert payload["content_type"].startswith("text/html")
    assert source_url not in payload["content"]
    assert payload["report_metadata"]["user_submitted_draft_id"] == created["draft_id"]
    assert payload["report_metadata"]["source_domain"] == "otodom.pl"
    assert payload["report_metadata"]["private_source_reference_present"] is True
    assert "source_url_private" not in payload["report_metadata"]
    assert reports[0]["id"] == payload["id"]


def test_user_submitted_listing_draft_report_generation_is_owner_scoped() -> None:
    owner_a = {"X-Domarion-User-Id": "draft-report-owner-a"}
    owner_b = {"X-Domarion-User-Id": "draft-report-owner-b"}
    created = client.post(
        "/api/v1/user-submitted-listings/analyze",
        headers=owner_a,
        json={
            "address": "Nowy Dwór, Wrocław",
            "city": "Wrocław",
            "district": "Fabryczna",
            "market_type": "secondary",
            "price": 675000,
            "area_m2": 58.4,
            "rooms": 3,
            "confirm_private_analysis": True,
        },
    ).json()

    response = client.post(
        f"/api/v1/user-submitted-listings/drafts/{created['draft_id']}/reports/generate",
        headers=owner_b,
        json={"audience": "buyer", "report_format": "html"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "User-submitted listing draft not found"


def test_user_submitted_listing_analysis_rejects_unknown_area() -> None:
    response = client.post(
        "/api/v1/user-submitted-listings/analyze",
        json={
            "address": "Unknown street",
            "city": "Wrocław",
            "district": "Unknown District",
            "market_type": "secondary",
            "price": 675000,
            "area_m2": 58.4,
            "rooms": 3,
            "confirm_private_analysis": True,
        },
    )

    assert response.status_code == 400
    assert "Area statistics are not available" in response.json()["detail"]
