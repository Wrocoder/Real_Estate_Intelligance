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


def test_suburban_partner_sample_is_loaded_as_repository_data() -> None:
    response = client.get("/api/v1/listings", params={"city": "Wysoka"})
    payload = response.json()

    assert response.status_code == 200
    assert payload["total"] >= 2
    assert {item["listing"]["source_name"] for item in payload["items"]} == {
        "Demo Suburban Partner Feed"
    }
    assert {item["listing"]["area_id"] for item in payload["items"]} == {"wysoka-wysoka"}


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


def test_listings_support_developer_reputation_filters_and_sort() -> None:
    response = client.get(
        "/api/v1/listings",
        params={
            "city": "Wrocław",
            "page_size": 20,
            "sort": "developer_reputation_score_desc",
            "min_developer_reputation_score": 60,
            "min_developer_confidence_score": 59,
            "require_developer_reputation": True,
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["filters"]["min_developer_reputation_score"] == 60
    assert payload["filters"]["min_developer_confidence_score"] == 59
    assert payload["filters"]["require_developer_reputation"] is True
    assert payload["total"] >= 2
    reputations = [
        item["developer_reputation"]["reputation_score"] for item in payload["items"]
    ]
    assert reputations == sorted(reputations, reverse=True)
    for item in payload["items"]:
        reputation = item["developer_reputation"]
        assert reputation is not None
        assert reputation["reputation_score"] >= 60
        assert reputation["confidence_score"] >= 59


def test_listings_support_text_query_search() -> None:
    response = client.get(
        "/api/v1/listings",
        params={"city": "Wrocław", "query": "Nowy Dwor", "page_size": 20},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["filters"]["query"] == "Nowy Dwor"
    assert payload["total"] == 1
    assert payload["items"][0]["listing"]["id"] == "wr-001"
    assert "Nowy Dwór" in payload["items"][0]["listing"]["address"]


def test_listings_support_proximity_filters() -> None:
    response = client.get(
        "/api/v1/listings",
        params={
            "city": "Wrocław",
            "max_distance_to_center_km": 8,
            "max_nearest_stop_m": 700,
            "max_nearest_school_m": 900,
            "min_nearest_major_road_m": 100,
            "min_nearest_industrial_zone_m": 900,
            "page_size": 20,
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["total"] >= 1
    assert payload["filters"]["max_distance_to_center_km"] == 8.0
    for item in payload["items"]:
        listing = item["listing"]
        assert listing["distance_to_center_km"] <= 8
        assert listing["nearest_stop_m"] <= 700
        assert listing["nearest_school_m"] <= 900
        assert listing["nearest_major_road_m"] >= 100
        assert listing["nearest_industrial_zone_m"] >= 900


def test_hidden_gems_returns_ranked_candidates() -> None:
    response = client.get(
        "/api/v1/listings/hidden-gems",
        params={
            "city": "Wrocław",
            "page_size": 5,
            "max_price_delta_to_fair_mid_pct": 5,
            "min_investment_score": 50,
            "max_risk_score": 70,
            "max_nearest_stop_m": 700,
            "min_nearest_industrial_zone_m": 900,
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["total"] >= 1
    assert payload["filters"]["city"] == "Wrocław"
    assert payload["filters"]["max_price_delta_to_fair_mid_pct"] == 5.0
    assert payload["filters"]["max_nearest_stop_m"] == 700
    scores = [item["gem_score"] for item in payload["items"]]
    assert scores == sorted(scores, reverse=True)
    for item in payload["items"]:
        assert item["analysis"]["listing"]["id"]
        assert item["analysis"]["listing"]["nearest_stop_m"] <= 700
        assert item["analysis"]["listing"]["nearest_industrial_zone_m"] >= 900
        assert 0 <= item["gem_score"] <= 100
        assert item["price_delta_to_fair_mid_pct"] <= 5
        assert item["signals"]


def test_hidden_gems_support_text_query_search() -> None:
    response = client.get(
        "/api/v1/listings/hidden-gems",
        params={
            "city": "Wrocław",
            "query": "Nowy Dwor",
            "min_investment_score": 40,
            "max_risk_score": 70,
            "page_size": 20,
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["filters"]["query"] == "Nowy Dwor"
    assert payload["total"] == 1
    assert payload["items"][0]["analysis"]["listing"]["id"] == "wr-001"
    assert payload["items"][0]["signals"]


def test_hidden_gems_support_developer_reputation_filters() -> None:
    response = client.get(
        "/api/v1/listings/hidden-gems",
        params={
            "city": "Wrocław",
            "page_size": 20,
            "min_investment_score": 40,
            "max_risk_score": 70,
            "min_developer_reputation_score": 60,
            "require_developer_reputation": True,
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["filters"]["min_developer_reputation_score"] == 60
    assert payload["filters"]["require_developer_reputation"] is True
    assert payload["total"] >= 1
    for item in payload["items"]:
        reputation = item["analysis"]["developer_reputation"]
        assert reputation is not None
        assert reputation["reputation_score"] >= 60


def test_listings_radius_requires_center() -> None:
    response = client.get("/api/v1/listings", params={"radius_km": 5})

    assert response.status_code == 400
    assert response.json()["detail"] == "radius_km requires lat and lon"


def test_areas() -> None:
    response = client.get("/api/v1/areas")

    assert response.status_code == 200
    assert len(response.json()) >= 3


def test_developer_ranking_returns_source_backed_scores() -> None:
    response = client.get(
        "/api/v1/developers",
        params={"city": "Wrocław", "min_confidence_score": 50},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["total"] >= 3
    assert payload["filters"]["city"] == "Wrocław"
    assert payload["items"][0]["developer"]["id"]
    assert payload["items"][0]["reputation_score"] >= payload["items"][-1]["reputation_score"]
    assert payload["items"][0]["source_citations"]
    assert payload["items"][0]["due_diligence_questions"]


def test_listing_developer_lookup_returns_reputation_profile() -> None:
    response = client.get("/api/v1/listings/wr-002/developer")
    payload = response.json()

    assert response.status_code == 200
    assert payload["developer"]["id"] == "demo-development"
    assert payload["reputation_score"] > 0
    assert payload["projects"]
    assert payload["quality_signals"]


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
    assert payload["developer_reputation"]["developer"]["id"] == "fabryczna-estate-partners"
    assert payload["developer_reputation"]["due_diligence_questions"]
    assert payload["future_area_impact"]["listing_id"] == "wr-001"
    assert payload["future_area_impact"]["impact_score"] > 0
    assert payload["future_area_impact"]["buckets"][0]["radius_m"] == 500
    assert payload["future_area_impact"]["nearest_investments"]
    assert payload["risk_profile"]["listing_id"] == "wr-001"
    assert payload["risk_profile"]["risk_score"] == payload["scores"]["risk_score"]
    assert payload["risk_profile"]["factors"]
    assert payload["risk_profile"]["priority_checks"]
    assert payload["rental_estimate"]["listing_id"] == "wr-001"
    assert payload["rental_estimate"]["monthly_rent_mid_pln"] > 0
    assert payload["rental_estimate"]["cashflow_scenarios"]


def test_listing_future_impact_returns_radius_buckets() -> None:
    response = client.get("/api/v1/listings/wr-001/future-impact")
    payload = response.json()

    assert response.status_code == 200
    assert payload["listing_id"] == "wr-001"
    assert payload["radii_m"] == [500, 1000, 2000, 5000, 10000]
    assert payload["impact_score"] > 0
    assert payload["buckets"][0]["radius_m"] == 500
    assert payload["buckets"][2]["radius_m"] == 2000
    assert payload["buckets"][2]["count"] >= 1
    assert payload["nearest_investments"][0]["distance_m"] <= 2000
    assert payload["growth_signals"]
    assert "guarantee" in payload["methodology_note"]


def test_listing_risk_profile_returns_structured_factors() -> None:
    response = client.get("/api/v1/listings/wr-001/risk-profile")
    payload = response.json()

    assert response.status_code == 200
    assert payload["listing_id"] == "wr-001"
    assert 0 <= payload["risk_score"] <= 100
    assert payload["overall_severity"] in {"minimal", "low", "medium", "high"}
    factor_codes = {factor["code"] for factor in payload["factors"]}
    assert {"price_position", "market_liquidity", "weak_transport"} <= factor_codes
    assert payload["priority_checks"]
    assert "flood risk" in payload["missing_risk_layers"]
    assert "Missing public layers" in payload["methodology_note"]


def test_listing_rental_estimate_returns_cashflow_scenarios() -> None:
    response = client.get("/api/v1/listings/wr-001/rental-estimate")
    payload = response.json()

    assert response.status_code == 200
    assert payload["listing_id"] == "wr-001"
    assert payload["monthly_rent_low_pln"] < payload["monthly_rent_mid_pln"]
    assert payload["monthly_rent_high_pln"] > payload["monthly_rent_mid_pln"]
    assert payload["gross_yield_pct"] > 0
    assert payload["net_operating_income_monthly_pln"] > 0
    scenario_codes = {scenario["code"] for scenario in payload["cashflow_scenarios"]}
    assert scenario_codes == {"cash_purchase", "financed_80_ltv"}
    assert payload["confidence_score"] > 0
    assert payload["assumptions"]
    assert "screening" in payload["methodology_note"]


def test_compare_requires_existing_ids() -> None:
    response = client.post("/api/v1/compare", json={"listing_ids": ["wr-001", "missing"]})

    assert response.status_code == 404
    assert response.json()["detail"]["missing_listing_ids"] == ["missing"]


def test_compare_returns_decision_metrics_and_mortgage_baseline() -> None:
    response = client.post("/api/v1/compare", json={"listing_ids": ["wr-001", "wr-002"]})
    payload = response.json()

    assert response.status_code == 200
    assert [item["listing"]["id"] for item in payload["items"]] == ["wr-001", "wr-002"]
    assert [item["developer_reputation"]["developer"]["id"] for item in payload["items"]] == [
        "fabryczna-estate-partners",
        "demo-development",
    ]
    assert payload["mortgage_assumptions"] == {
        "down_payment_pct": 20.0,
        "loan_years": 25,
        "annual_interest_rate_pct": 7.5,
        "rate_type": "fixed",
    }

    metrics = payload["metrics"]
    assert len(metrics) == 2
    assert sorted(metric["rank"] for metric in metrics) == [1, 2]
    assert {metric["listing_id"] for metric in metrics} == {"wr-001", "wr-002"}
    for metric in metrics:
        assert 0 <= metric["decision_score"] <= 100
        assert metric["estimated_monthly_payment_pln"] > 0
        assert metric["upfront_cash_needed_pln"] > 0
        assert metric["estimated_gross_rental_yield_pct"] > 0
        assert metric["estimated_monthly_rent_pln"] > 0
        assert metric["liquidity_score"] >= 0
        assert metric["rental_potential_score"] >= 0
        assert metric["recommendation"]

    summary = payload["summary"]
    assert summary["best_listing_id"] in {"wr-001", "wr-002"}
    assert summary["lowest_monthly_payment_listing_id"] in {"wr-001", "wr-002"}
    assert summary["strongest_liquidity_listing_id"] in {"wr-001", "wr-002"}
    assert summary["strongest_rental_listing_id"] in {"wr-001", "wr-002"}
    assert summary["average_estimated_monthly_payment_pln"] > 0
    assert summary["notes"]


def test_object_report() -> None:
    response = client.post("/api/v1/reports/object", json={"listing_id": "wr-001"})
    payload = response.json()

    assert response.status_code == 200
    assert payload["listing_id"] == "wr-001"
    assert payload["template_code"] == "buyer_object_report_v1"
    assert payload["template_name"] == "Buyer decision report v1"
    assert payload["sections"]
    section_titles = {section["title"] for section in payload["sections"]}
    assert "Краткое решение" in section_titles
    assert "Ипотека и бюджет покупки" in section_titles
    assert "Жизнь, аренда и развитие района" in section_titles
    assert "Вопросы продавцу" in section_titles
    assert "Чеклист проверки перед оффером" in section_titles
    assert "Застройщик и репутация" in section_titles
    decision_section = next(
        section for section in payload["sections"] if section["title"] == "Краткое решение"
    )
    decision_items = "\n".join(decision_section["items"])
    assert "Верхняя цена" in decision_items
    assert "Перед zadatek/umowa rezerwacyjna" in decision_items
    assert "Score snapshot" in decision_items
    fit_section = next(
        section
        for section in payload["sections"]
        if section["title"] == "Жизнь, аренда и развитие района"
    )
    fit_items = "\n".join(fit_section["items"])
    assert "Для жизни:" in fit_items
    assert "Для аренды:" in fit_items
    assert "Развитие района:" in fit_items
    assert "Future impact score:" in fit_items
    assert "Ближайшие planned investments:" in fit_items
    developer_section = next(
        section
        for section in payload["sections"]
        if section["title"] == "Застройщик и репутация"
    )
    developer_items = "\n".join(developer_section["items"])
    assert "Позиция по застройщику" in developer_items
    assert "Developer due diligence:" in developer_items
    assert "Source citation:" in developer_items
    assert "Registry check: KRS" in developer_items
    risk_section = next(section for section in payload["sections"] if section["title"] == "Риски")
    risk_items = "\n".join(risk_section["items"])
    assert "Risk profile:" in risk_items
    assert "Priority checks:" in risk_items
    assert "Missing public risk layers" in risk_items
    assert "не финансовая" in payload["disclaimer"]


def test_investor_object_report_includes_rental_cashflow() -> None:
    response = client.post(
        "/api/v1/reports/object",
        json={"listing_id": "wr-001", "audience": "investor"},
    )
    payload = response.json()

    assert response.status_code == 200
    section = next(
        section for section in payload["sections"] if section["title"] == "Арендная доходность"
    )
    items = "\n".join(section["items"])
    assert "Rent estimate:" in items
    assert "Gross yield" in items
    assert "Cash purchase" in items
    assert "80% LTV" in items


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
    assert "Краткое решение" in buyer_template["default_sections"]
    assert "Жизнь, аренда и развитие района" in buyer_template["default_sections"]
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
