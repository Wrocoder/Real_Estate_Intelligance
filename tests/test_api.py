from fastapi.testclient import TestClient

from domarion.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_listings() -> None:
    response = client.get("/api/v1/listings")
    payload = response.json()

    assert response.status_code == 200
    assert payload["total"] >= 3
    assert payload["page"] == 1
    assert payload["page_size"] == 20
    assert payload["items"][0]["listing"]["id"]
    assert "investment_score" in payload["items"][0]["scores"]
    assert "decision_label" in payload["items"][0]["scores"]
    assert "price_label" in payload["items"][0]["scores"]


def test_listings_support_pagination_sorting_and_score_filters() -> None:
    response = client.get(
        "/api/v1/listings",
        params={
            "page": 1,
            "page_size": 2,
            "sort": "price_asc",
            "min_investment_score": 40,
            "max_risk_score": 70,
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["page"] == 1
    assert payload["page_size"] == 2
    assert payload["total"] >= 2
    assert len(payload["items"]) == 2
    prices = [item["listing"]["price"] for item in payload["items"]]
    assert prices == sorted(prices)
    assert all(item["scores"]["investment_score"] >= 40 for item in payload["items"])
    assert all(item["scores"]["risk_score"] <= 70 for item in payload["items"])


def test_listings_radius_requires_center() -> None:
    response = client.get("/api/v1/listings", params={"radius_km": 5})

    assert response.status_code == 400
    assert response.json()["detail"] == "radius_km requires lat and lon"


def test_areas() -> None:
    response = client.get("/api/v1/areas")

    assert response.status_code == 200
    assert len(response.json()) >= 3


def test_location_reference_endpoints() -> None:
    municipalities_response = client.get("/api/v1/locations/municipalities")
    districts_response = client.get("/api/v1/locations/districts", params={"city": "Wrocław"})
    locations_response = client.get("/api/v1/locations", params={"query": "Nowy"})

    assert municipalities_response.status_code == 200
    assert municipalities_response.json()[0]["id"] == "wroclaw"

    districts = districts_response.json()
    assert districts_response.status_code == 200
    assert {district["id"] for district in districts} >= {"wroclaw-fabryczna"}

    locations = locations_response.json()
    assert locations_response.status_code == 200
    assert locations[0]["name"] == "Nowy Dwór"
    assert locations[0]["district_id"] == "wroclaw-fabryczna"


def test_infrastructure_reference_endpoints() -> None:
    stops_response = client.get(
        "/api/v1/infrastructure/transport-stops",
        params={"city": "Wrocław"},
    )
    routes_response = client.get("/api/v1/infrastructure/transport-routes")
    schools_response = client.get(
        "/api/v1/infrastructure/schools",
        params={"district_id": "wroclaw-fabryczna"},
    )
    kindergartens_response = client.get("/api/v1/infrastructure/kindergartens")
    amenities_response = client.get(
        "/api/v1/infrastructure/amenities",
        params={"amenity_type": "park"},
    )
    industrial_response = client.get("/api/v1/infrastructure/industrial-zones")

    assert stops_response.status_code == 200
    assert stops_response.json()[0]["name"] == "Jagodno Buforowa"
    assert routes_response.status_code == 200
    assert {route["route_number"] for route in routes_response.json()} >= {"13", "145"}
    assert schools_response.status_code == 200
    assert schools_response.json()[0]["district_id"] == "wroclaw-fabryczna"
    assert kindergartens_response.status_code == 200
    assert len(kindergartens_response.json()) >= 2
    assert amenities_response.status_code == 200
    assert amenities_response.json()[0]["amenity_type"] == "park"
    assert industrial_response.status_code == 200
    assert industrial_response.json()[0]["risk_level"] == "moderate"


def test_listing_analysis() -> None:
    response = client.get("/api/v1/listings/wr-001/analysis")
    payload = response.json()

    assert response.status_code == 200
    assert payload["listing"]["id"] == "wr-001"
    assert 0 <= payload["scores"]["investment_score"] <= 100
    assert payload["price_history"]
    assert payload["listing_events"]
    assert payload["listing_events"][0]["event_type"] == "first_seen"


def test_compare_requires_existing_ids() -> None:
    response = client.post("/api/v1/compare", json={"listing_ids": ["wr-001", "missing"]})

    assert response.status_code == 404
    assert response.json()["detail"]["missing_listing_ids"] == ["missing"]


def test_object_report() -> None:
    response = client.post("/api/v1/reports/object", json={"listing_id": "wr-001"})
    payload = response.json()

    assert response.status_code == 200
    assert payload["listing_id"] == "wr-001"
    assert payload["template_code"] == "buyer_object_report_v1"
    assert payload["template_name"] == "Buyer decision report v1"
    assert payload["sections"]
    section_titles = {section["title"] for section in payload["sections"]}
    assert "Ипотека и бюджет покупки" in section_titles
    assert "Вопросы продавцу" in section_titles
    assert "Чеклист проверки перед оффером" in section_titles
    assert "не финансовая" in payload["disclaimer"]


def test_object_report_accepts_realtor_branding() -> None:
    response = client.post(
        "/api/v1/reports/object",
        json={
            "listing_id": "wr-001",
            "audience": "realtor",
            "branding": {
                "agency_name": "Example Realty",
                "agent_name": "Anna Agent",
                "agent_email": "anna@example.com",
            },
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["template_code"] == "realtor_client_report_v1"
    assert payload["branding"]["agency_name"] == "Example Realty"
    assert payload["branding"]["agent_name"] == "Anna Agent"
    section_titles = {section["title"] for section in payload["sections"]}
    assert "Клиентская аргументация цены" in section_titles
    assert "Сравнение с аналогами" in section_titles
    assert "Карта и локация для клиента" in section_titles


def test_report_templates_endpoint_returns_audience_templates() -> None:
    response = client.get("/api/v1/reports/templates")
    payload = response.json()

    assert response.status_code == 200
    assert {item["audience"] for item in payload} == {"buyer", "realtor", "investor"}
    assert {item["code"] for item in payload} == {
        "buyer_object_report_v1",
        "realtor_client_report_v1",
        "investor_object_report_v1",
    }
    assert all(item["default_sections"] for item in payload)
    buyer_template = next(item for item in payload if item["audience"] == "buyer")
    assert "Вопросы продавцу" in buyer_template["default_sections"]
    assert "Чеклист проверки перед оффером" in buyer_template["default_sections"]
    realtor_template = next(item for item in payload if item["audience"] == "realtor")
    assert "Клиентская аргументация цены" in realtor_template["default_sections"]
    assert "Сравнение с аналогами" in realtor_template["default_sections"]
    assert "Карта и локация для клиента" in realtor_template["default_sections"]
    investor_template = next(item for item in payload if item["audience"] == "investor")
    assert "Арендная доходность" in investor_template["default_sections"]
    assert "Сравнение с альтернативами" in investor_template["default_sections"]
    assert "Ликвидность и тезис роста" in investor_template["default_sections"]
