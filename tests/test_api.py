from fastapi.testclient import TestClient

from domarion.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_listings() -> None:
    response = client.get("/api/v1/listings")

    assert response.status_code == 200
    assert len(response.json()) >= 3


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
