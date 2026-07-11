from fastapi.testclient import TestClient

from domarion.main import app

client = TestClient(app)


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
    assert payload["analysis"]["comparables"]
    assert "legal-first" in payload["comparables_basis"]
    assert any("No live portal data was fetched" in item for item in payload["warnings"])


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
