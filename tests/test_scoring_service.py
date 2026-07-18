from fastapi.testclient import TestClient

from domarion.main import app
from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.schemas import ScoringServiceRequest
from domarion.services.scoring_service import evaluate_scoring_service_listing

client = TestClient(app)


SCORING_PAYLOAD = {
    "external_reference": "crm-lead-4821",
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
    "developer_name": "Fabryczna Estate Partners",
    "investment_name": "Nowy Dwór Residence",
    "audience": "underwriting",
}


def test_scoring_service_evaluates_listing_without_persistence() -> None:
    result = evaluate_scoring_service_listing(
        InMemoryRealEstateRepository(),
        ScoringServiceRequest(**SCORING_PAYLOAD),
    )

    assert result.request_id.startswith("score-")
    assert result.persisted is False
    assert result.input.external_reference == "crm-lead-4821"
    assert result.valuation.asking_price == 675000
    assert result.valuation.price_per_m2 == round(675000 / 58.4)
    assert result.scores.investment_score >= 0
    assert result.area_statistics.area_id == "wroclaw-fabryczna"
    assert result.comparables
    assert result.developer_reputation is not None
    assert result.developer_reputation.developer.name == "Fabryczna Estate Partners"
    assert "does not create a draft" in result.methodology_notes[0]
    assert "not financial" in result.disclaimer


def test_scoring_service_api_requires_api_capability() -> None:
    response = client.post(
        "/api/v1/scoring/evaluate",
        headers={"X-Domarion-User-Id": "free-scoring-service"},
        json=SCORING_PAYLOAD,
    )

    assert response.status_code == 403
    assert response.json()["detail"]["required_capability"] == "can_use_api"


def test_scoring_service_api_returns_enterprise_result() -> None:
    response = client.post(
        "/api/v1/scoring/evaluate",
        headers={
            "X-Domarion-User-Id": "enterprise-scoring-service",
            "X-Domarion-Plan": "enterprise",
            "X-Domarion-Role": "admin",
        },
        json=SCORING_PAYLOAD,
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["request_id"].startswith("score-")
    assert payload["audience"] == "underwriting"
    assert payload["persisted"] is False
    assert payload["input"]["external_reference"] == "crm-lead-4821"
    assert payload["valuation"]["asking_price"] == 675000
    assert payload["area_statistics"]["area_id"] == "wroclaw-fabryczna"
    assert payload["comparables"]
    assert payload["recommended_actions"]
    assert payload["risk_flags"]
    assert "draft_id" not in payload
    assert "source_url_private" not in payload


def test_scoring_service_api_validates_coordinate_pair() -> None:
    response = client.post(
        "/api/v1/scoring/evaluate",
        headers={
            "X-Domarion-User-Id": "enterprise-scoring-service-invalid",
            "X-Domarion-Plan": "enterprise",
        },
        json={**SCORING_PAYLOAD, "lat": 51.1117},
    )

    assert response.status_code == 422
    assert "lat and lon must be provided together" in response.text
