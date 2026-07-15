from datetime import UTC, datetime

from fastapi.testclient import TestClient

from domarion.main import app

client = TestClient(app)


def test_news_public_list_and_detail() -> None:
    response = client.get("/api/v1/news", params={"category": "transport"})
    payload = response.json()
    detail = client.get(f"/api/v1/news/{payload[0]['id']}").json()

    assert response.status_code == 200
    assert payload
    assert payload[0]["category"] == "transport"
    assert "body" not in payload[0]
    assert detail["id"] == payload[0]["id"]
    assert detail["body"]


def test_admin_can_manually_create_news_article() -> None:
    headers = {
        "X-Domarion-User-Id": "news-admin",
        "X-Domarion-Role": "admin",
    }
    response = client.post(
        "/api/v1/admin/news/articles",
        headers=headers,
        json={
            "title": "MPZP consultation opens for test district",
            "summary": "A local plan consultation creates a due-diligence item for buyers.",
            "body": "Buyers should verify exact parcel status and timing before signing.",
            "category": "mpzp",
            "source_name": "Manual admin entry",
            "published_at": datetime.now(UTC).isoformat(),
            "affected_area_ids": ["wroclaw-fabryczna"],
            "affected_districts": ["Fabryczna"],
            "price_impact_hypothesis": "Planning clarity can support liquidity.",
            "audience_relevance": ["buyer", "investor"],
            "impact_level": "mixed",
            "tags": ["mpzp", "planning"],
        },
    )
    payload = response.json()

    assert response.status_code == 201
    assert payload["id"].startswith("news-")
    assert payload["category"] == "mpzp"
    assert payload["affected_area_ids"] == ["wroclaw-fabryczna"]


def test_news_ai_summary_persists_news_insight() -> None:
    headers = {"X-Domarion-User-Id": "news-ai-owner"}
    response = client.post(
        "/api/v1/ai/news/news-wroclaw-tram-fabryczna/summary",
        headers=headers,
    )
    payload = response.json()
    insights = client.get(
        "/api/v1/ai-insights",
        headers=headers,
        params={
            "subject_type": "news",
            "subject_id": "news-wroclaw-tram-fabryczna",
            "insight_type": "news_summary",
        },
    ).json()

    assert response.status_code == 200
    assert payload["subject_type"] == "news"
    assert payload["article_id"] == "news-wroclaw-tram-fabryczna"
    assert payload["key_points"]
    assert payload["area_impact"]
    assert payload["buyer_notes"]
    assert payload["investor_notes"]
    assert payload["citations"]
    assert payload["usage_log_id"]
    assert insights[0]["id"] == payload["usage_log_id"]


def test_news_ai_summary_returns_404_for_unknown_article() -> None:
    response = client.post("/api/v1/ai/news/missing-news/summary")

    assert response.status_code == 404
    assert response.json()["detail"] == "News article not found"
