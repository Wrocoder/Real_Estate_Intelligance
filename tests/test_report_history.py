from fastapi.testclient import TestClient

from domarion.main import app
from domarion.report_store.factory import memory_report_store

client = TestClient(app)


def test_generate_and_list_saved_html_report() -> None:
    memory_report_store.clear()

    response = client.post(
        "/api/v1/reports/object/generate",
        json={"listing_id": "wr-001", "audience": "buyer", "report_format": "html"},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["listing_id"] == "wr-001"
    assert payload["report_format"] == "html"
    assert payload["content_type"].startswith("text/html")
    assert "Domarion Analytics" in payload["content"]
    assert payload["report_metadata"]["investment_score"] >= 0

    list_response = client.get("/api/v1/reports")
    reports = list_response.json()

    assert list_response.status_code == 200
    assert len(reports) == 1
    assert reports[0]["id"] == payload["id"]
    assert "content" not in reports[0]


def test_get_saved_report_and_content() -> None:
    memory_report_store.clear()
    created = client.post(
        "/api/v1/reports/object/generate",
        json={"listing_id": "wr-001", "audience": "investor", "report_format": "html"},
    ).json()

    report_response = client.get(f"/api/v1/reports/{created['id']}")
    content_response = client.get(f"/api/v1/reports/{created['id']}/content")

    assert report_response.status_code == 200
    assert report_response.json()["audience"] == "investor"
    assert content_response.status_code == 200
    assert content_response.headers["content-type"].startswith("text/html")
    assert "Инвестиционная оценка" in content_response.text


def test_generate_saved_json_report() -> None:
    memory_report_store.clear()

    response = client.post(
        "/api/v1/reports/object/generate",
        json={"listing_id": "wr-001", "audience": "buyer", "report_format": "json"},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["report_format"] == "json"
    assert payload["content_type"] == "application/json"
    assert '"listing_id": "wr-001"' in payload["content"]


def test_get_missing_saved_report_returns_404() -> None:
    memory_report_store.clear()

    response = client.get("/api/v1/reports/not-found")

    assert response.status_code == 404
    assert response.json()["detail"] == "Report not found"

