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


def test_listing_analysis() -> None:
    response = client.get("/api/v1/listings/wr-001/analysis")
    payload = response.json()

    assert response.status_code == 200
    assert payload["listing"]["id"] == "wr-001"
    assert 0 <= payload["scores"]["investment_score"] <= 100
    assert payload["price_history"]


def test_compare_requires_existing_ids() -> None:
    response = client.post("/api/v1/compare", json={"listing_ids": ["wr-001", "missing"]})

    assert response.status_code == 404
    assert response.json()["detail"]["missing_listing_ids"] == ["missing"]


def test_object_report() -> None:
    response = client.post("/api/v1/reports/object", json={"listing_id": "wr-001"})
    payload = response.json()

    assert response.status_code == 200
    assert payload["listing_id"] == "wr-001"
    assert payload["sections"]
    assert "не финансовая" in payload["disclaimer"]
