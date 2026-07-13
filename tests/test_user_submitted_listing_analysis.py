from fastapi.testclient import TestClient

from domarion.ingestion_admin_store.factory import memory_ingestion_admin_store
from domarion.ingestion_admin_store.system_sources import (
    USER_SUBMITTED_REFERENCE_SOURCE_NAME,
    USER_SUBMITTED_REFERENCE_SOURCE_TYPE,
)
from domarion.main import app
from domarion.report_store.factory import memory_report_store
from domarion.services import user_submitted_listings as user_submitted_listing_service
from domarion.user_submitted_listing_store.factory import memory_user_submitted_listing_store

client = TestClient(app)


def setup_function() -> None:
    memory_ingestion_admin_store.reset_demo()
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
    assert any("confirmed user-submitted fields" in item for item in payload["warnings"])


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


def test_user_submitted_listing_import_from_url_extracts_minimal_fields(monkeypatch) -> None:
    page_html = """
    <html>
      <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Apartment",
          "name": "Mieszkanie 3 pokoje Fabryczna",
          "price": "675000",
          "floorSize": {"value": 58.4, "unitCode": "MTK"},
          "numberOfRooms": 3,
          "floorNumber": 3,
          "building_floors_num": "6",
          "marketType": "secondary",
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 51.1117,
            "longitude": 16.9653
          },
          "address": {
            "streetAddress": "ul. Rogowska 10",
            "addressLocality": "Wrocław",
            "addressRegion": "Fabryczna"
          }
        }
        </script>
      </head>
      <body>Rok budowy 2014</body>
    </html>
    """

    def fake_fetch(source_url: str, timeout_seconds: float):
        assert source_url == "https://www.otodom.pl/pl/oferta/demo-ID4abc123"
        assert timeout_seconds == 8
        return user_submitted_listing_service.SourceFetchResult(
            body=page_html,
            final_url=source_url,
            status_code=200,
            content_type="text/html",
        )

    monkeypatch.setattr(
        user_submitted_listing_service,
        "_fetch_source_url_html",
        fake_fetch,
    )

    response = client.post(
        "/api/v1/user-submitted-listings/import-from-url",
        json={"source_url": "https://www.otodom.pl/pl/oferta/demo-ID4abc123"},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["status"] == "extracted"
    assert payload["reference_preview"]["provider"] == "otodom"
    assert payload["fields"]["title"] == "Mieszkanie 3 pokoje Fabryczna"
    assert payload["fields"]["address"] == "ul. Rogowska 10"
    assert payload["fields"]["city"] == "Wrocław"
    assert payload["fields"]["district"] == "Fabryczna"
    assert payload["fields"]["market_type"] == "secondary"
    assert payload["fields"]["price"] == 675000
    assert payload["fields"]["area_m2"] == 58.4
    assert payload["fields"]["rooms"] == 3
    assert payload["fields"]["floor"] == 3
    assert payload["fields"]["building_floors"] == 6
    assert payload["fields"]["building_year"] == 2014
    assert payload["fields"]["lat"] == 51.1117
    assert payload["fields"]["lon"] == 16.9653
    assert "price" in payload["fields_extracted"]
    assert "building_floors" in payload["fields_extracted"]
    assert "description" not in payload["fields"]
    assert "photos" not in payload["fields"]
    assert payload["fetch_status_code"] == 200
    assert payload["reference_preview"]["warnings"] == []
    assert any("Photos, contacts and full description" in item for item in payload["warnings"])


def test_user_submitted_listing_import_from_url_extracts_labeled_portal_parameters(
    monkeypatch,
) -> None:
    page_html = """
    <html>
      <head>
        <script id="__NEXT_DATA__" type="application/json">
        {
          "props": {
            "pageProps": {
              "ad": {
                "title": "Funkcjonalne 3 pokoje",
                "parameters": [
                  {"label": "Cena", "value": "729 000 zł"},
                  {"label": "Powierzchnia", "value": "62,5 m²"},
                  {"label": "Liczba pokoi", "value": "3 pokoje"},
                  {"label": "Piętro", "value": "2/4"},
                  {"label": "Rok budowy", "value": "2018"},
                  {"label": "Rynek", "value": "wtórny"},
                  {"label": "Adres", "value": "ul. Kwiatowa 5"},
                  {"label": "Miasto", "value": "Wrocław"},
                  {"label": "Dzielnica", "value": "Krzyki"}
                ]
              }
            }
          }
        }
        </script>
      </head>
    </html>
    """

    def fake_fetch(source_url: str, timeout_seconds: float):
        return user_submitted_listing_service.SourceFetchResult(
            body=page_html,
            final_url=source_url,
            status_code=200,
            content_type="text/html",
        )

    monkeypatch.setattr(
        user_submitted_listing_service,
        "_fetch_source_url_html",
        fake_fetch,
    )

    response = client.post(
        "/api/v1/user-submitted-listings/import-from-url",
        json={"source_url": "https://www.olx.pl/d/oferta/demo-IDabc987.html"},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["status"] == "extracted"
    assert payload["fields"]["title"] == "Funkcjonalne 3 pokoje"
    assert payload["fields"]["price"] == 729000
    assert payload["fields"]["area_m2"] == 62.5
    assert payload["fields"]["rooms"] == 3
    assert payload["fields"]["floor"] == 2
    assert payload["fields"]["building_floors"] == 4
    assert payload["fields"]["building_year"] == 2018
    assert payload["fields"]["market_type"] == "secondary"
    assert payload["fields"]["address"] == "ul. Kwiatowa 5"
    assert payload["fields"]["city"] == "Wrocław"
    assert payload["fields"]["district"] == "Krzyki"


def test_user_submitted_listing_import_from_url_rejects_unsupported_provider(
    monkeypatch,
) -> None:
    def fail_fetch(source_url: str, timeout_seconds: float):
        raise AssertionError("unsupported providers must not be fetched")

    monkeypatch.setattr(
        user_submitted_listing_service,
        "_fetch_source_url_html",
        fail_fetch,
    )

    response = client.post(
        "/api/v1/user-submitted-listings/import-from-url",
        json={"source_url": "https://example.com/listing"},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["status"] == "unsupported"
    assert payload["fields"] == {
        "title": None,
        "address": None,
        "city": None,
        "district": None,
        "market_type": None,
        "price": None,
        "area_m2": None,
        "rooms": None,
        "floor": None,
        "building_floors": None,
        "building_year": None,
        "lat": None,
        "lon": None,
    }
    assert payload["fields_extracted"] == []


def test_user_submitted_listing_import_from_url_ignores_invalid_extracted_values(
    monkeypatch,
) -> None:
    page_html = """
    <script type="application/ld+json">
    {
      "price": 675000,
      "area_m2": 58.4,
      "rooms": 99,
      "floor": 120,
      "buildingYear": 1700,
      "address": "ul. Rogowska 10",
      "district": "Fabryczna"
    }
    </script>
    """

    def fake_fetch(source_url: str, timeout_seconds: float):
        return user_submitted_listing_service.SourceFetchResult(
            body=page_html,
            final_url=source_url,
            status_code=200,
            content_type="text/html",
        )

    monkeypatch.setattr(
        user_submitted_listing_service,
        "_fetch_source_url_html",
        fake_fetch,
    )

    response = client.post(
        "/api/v1/user-submitted-listings/import-from-url",
        json={"source_url": "https://www.otodom.pl/pl/oferta/dirty-ID4abc123"},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["status"] == "partial"
    assert payload["fields"]["price"] == 675000
    assert payload["fields"]["area_m2"] == 58.4
    assert payload["fields"]["rooms"] is None
    assert payload["fields"]["floor"] is None
    assert payload["fields"]["building_year"] is None
    assert "rooms" not in payload["fields_extracted"]


def test_user_submitted_listing_import_from_url_returns_failed_on_fetch_error(
    monkeypatch,
) -> None:
    source_url = "https://www.olx.pl/d/oferta/demo-IDabc987.html"

    def fail_fetch(source_url: str, timeout_seconds: float):
        raise user_submitted_listing_service.SourceUrlImportError("Portal blocked ordinary fetch.")

    monkeypatch.setattr(
        user_submitted_listing_service,
        "_fetch_source_url_html",
        fail_fetch,
    )

    response = client.post(
        "/api/v1/user-submitted-listings/import-from-url",
        json={"source_url": source_url},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["status"] == "failed"
    assert payload["reference_preview"]["provider"] == "olx"
    assert payload["fields_extracted"] == []
    assert any("Portal blocked ordinary fetch" in item for item in payload["warnings"])

    admin_headers = {
        "X-Domarion-User-Id": "draft-admin",
        "X-Domarion-Role": "admin",
        "X-Domarion-Plan": "enterprise",
    }
    jobs = client.get("/api/v1/admin/ingestion/jobs", headers=admin_headers).json()
    reference_job = next(
        job for job in jobs if job["source_type"] == USER_SUBMITTED_REFERENCE_SOURCE_TYPE
    )
    logs = client.get(
        "/api/v1/admin/data-quality/logs",
        headers=admin_headers,
        params={"job_id": reference_job["id"]},
    ).json()
    source_errors = client.get(
        "/api/v1/admin/ingestion/source-errors",
        headers=admin_headers,
        params={"source_name": USER_SUBMITTED_REFERENCE_SOURCE_NAME},
    ).json()
    source_checks = client.get(
        "/api/v1/admin/ingestion/source-checks",
        headers=admin_headers,
        params={"source_name": USER_SUBMITTED_REFERENCE_SOURCE_NAME},
    ).json()
    health = client.get("/api/v1/admin/ingestion/source-health", headers=admin_headers).json()

    assert reference_job["source_name"] == USER_SUBMITTED_REFERENCE_SOURCE_NAME
    assert reference_job["status"] == "failed"
    assert reference_job["rows_seen"] == 1
    assert reference_job["metadata"]["provider"] == "olx"
    assert reference_job["metadata"]["source_domain"] == "olx.pl"
    assert reference_job["metadata"]["private_source_url_omitted"] is True
    assert source_url not in str(reference_job)
    assert logs[0]["code"] == "user_submitted_reference_failed"
    assert logs[0]["source_listing_id"] is None
    assert logs[0]["payload"]["missing_required_fields"] == [
        "address",
        "district",
        "price",
        "area_m2",
        "rooms",
    ]
    assert source_url not in str(logs[0])
    assert source_errors[0]["error_code"] == "user_submitted_reference_failed"
    assert source_errors[0]["ingestion_job_id"] == reference_job["id"]
    assert source_errors[0]["source_check_job_id"] == source_checks[0]["id"]
    assert source_errors[0]["metadata"]["source_domain"] == "olx.pl"
    assert source_errors[0]["metadata"]["source_url_hash"]
    assert source_url not in str(source_errors[0])
    assert source_checks[0]["check_type"] == "one_off_user_url"
    assert source_checks[0]["target_domain"] == "olx.pl"
    assert source_checks[0]["target_url_hash"] == source_errors[0]["metadata"]["source_url_hash"]
    assert source_url not in str(source_checks[0])
    reference_health = next(
        item for item in health if item["source_type"] == USER_SUBMITTED_REFERENCE_SOURCE_TYPE
    )
    assert reference_health["health_status"] == "failing"


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


def test_user_submitted_listing_analysis_uses_nearest_market_proxy_for_uncovered_location() -> None:
    response = client.post(
        "/api/v1/user-submitted-listings/analyze",
        json={
            "source_url": "https://www.otodom.pl/pl/oferta/outside-wroclaw-ID4C0bS",
            "address": "Piastów Śląskich, Mędłów",
            "city": "Mędłów",
            "district": "dolnośląskie",
            "market_type": "secondary",
            "price": 625000,
            "area_m2": 59.74,
            "rooms": 3,
            "floor": 1,
            "building_floors": 2,
            "building_year": 2011,
            "lat": 51.007355,
            "lon": 17.048521,
            "confirm_private_analysis": True,
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["analysis"]["listing"]["city"] == "Wrocław"
    assert payload["analysis"]["listing"]["municipality"] == "Mędłów"
    assert payload["analysis"]["comparables"]
    assert any("nearest available market proxy" in item for item in payload["warnings"])


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
    assert "Источник и надежность отчета" in section_titles
    assert "Цена: fair value и решение" in section_titles
    assert "Что делать дальше" in section_titles
    assert "Вопросы продавцу" in section_titles
    assert "Чеклист проверки перед оффером" in section_titles
    assert source_url not in str(payload["report"])


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
    assert "Источник и надежность отчета" in payload["content"]
    assert "Цена: fair value и решение" in payload["content"]
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
