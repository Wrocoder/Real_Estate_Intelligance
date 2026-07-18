import csv
import io
import json

from fastapi.testclient import TestClient

from domarion.main import app

client = TestClient(app)


def test_export_listing_dataset_json_and_csv_for_export_capable_plan() -> None:
    headers = {
        "X-Domarion-User-Id": "dataset-export-owner",
        "X-Domarion-Role": "realtor",
        "X-Domarion-Plan": "realtor",
    }

    json_response = client.get(
        "/api/v1/datasets/listings/export",
        headers=headers,
        params={"format": "json", "city": "Wrocław", "limit": 2},
    )
    csv_response = client.get(
        "/api/v1/datasets/listings/export",
        headers=headers,
        params={"format": "csv", "city": "Wrocław", "limit": 2},
    )
    json_payload = json_response.json()
    csv_rows = list(csv.DictReader(io.StringIO(csv_response.text)))

    assert json_response.status_code == 200
    assert json_response.headers["content-disposition"] == (
        'attachment; filename="domarion-listings-dataset.json"'
    )
    assert json_payload["metadata"]["dataset"] == "listings_analytics"
    assert json_payload["metadata"]["rows"] == 2
    assert json_payload["metadata"]["data_policy"].startswith("Dataset export contains")
    assert len(json_payload["items"]) == 2
    assert "source_url" not in json.dumps(json_payload, ensure_ascii=False)
    assert {"listing_id", "price", "investment_score", "fair_price_mid"} <= set(
        json_payload["items"][0]
    )
    assert json_payload["items"][0]["data_policy"].startswith("Dataset export contains")

    assert csv_response.status_code == 200
    assert csv_response.headers["content-disposition"] == (
        'attachment; filename="domarion-listings-dataset.csv"'
    )
    assert len(csv_rows) == 2
    assert {"listing_id", "price", "investment_score", "fair_price_mid"} <= set(csv_rows[0])
    assert "source_url" not in csv_response.text


def test_export_listing_dataset_supports_investor_plan() -> None:
    response = client.get(
        "/api/v1/datasets/listings/export",
        headers={
            "X-Domarion-User-Id": "investor-dataset-export",
            "X-Domarion-Role": "buyer",
            "X-Domarion-Plan": "investor",
        },
        params={"format": "json", "limit": 1, "min_investment_score": 1},
    )

    assert response.status_code == 200
    assert response.json()["metadata"]["rows"] == 1
    assert response.json()["items"][0]["investment_score"] >= 1


def test_export_listing_dataset_requires_export_capability() -> None:
    response = client.get(
        "/api/v1/datasets/listings/export",
        headers={"X-Domarion-User-Id": "free-dataset-export"},
    )

    assert response.status_code == 403
    assert response.json()["detail"]["resource"] == "exports"
    assert response.json()["detail"]["required_capability"] == "can_export"
