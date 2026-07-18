import hashlib
import json

from fastapi.testclient import TestClient

from domarion.core import get_settings
from domarion.main import app
from domarion.services.api_lite import (
    DEFAULT_LOCAL_API_LITE_KEY,
    memory_api_lite_usage_tracker,
)

client = TestClient(app)


def setup_function() -> None:
    get_settings.cache_clear()
    memory_api_lite_usage_tracker.clear()


def test_api_lite_requires_api_key() -> None:
    response = client.get("/api/v1/api-lite/listings")

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "api_key_required"


def test_api_lite_lists_sanitized_scored_listings_and_logs_usage() -> None:
    headers = {"X-Domarion-API-Key": DEFAULT_LOCAL_API_LITE_KEY}

    response = client.get(
        "/api/v1/api-lite/listings",
        headers=headers,
        params={"city": "Wrocław", "page_size": 2, "min_investment_score": 1},
    )
    payload = response.json()
    item = payload["items"][0]

    assert response.status_code == 200
    assert payload["total"] >= 1
    assert payload["data_policy"].startswith("API-lite returns normalized")
    assert "source_url" not in json.dumps(item)
    assert item["scores"]["investment_score"] >= 1
    assert item["scores"]["fair_price_mid"] > 0
    assert item["data_quality_score"] >= 0

    usage = client.get("/api/v1/api-lite/usage", headers=headers).json()
    assert usage["key_id"] == "local-demo-key"
    assert usage["plan"] == "enterprise"
    assert usage["rate_limit_per_minute"] == 60
    assert usage["used_units"] == 1
    assert usage["remaining_units"] == usage["monthly_quota"] - 1
    assert usage["logs"][0]["endpoint"] == "/api/v1/api-lite/listings"
    assert usage["logs"][0]["status_code"] == 200


def test_api_lite_listing_detail_omits_source_urls_and_raw_event_payloads() -> None:
    response = client.get(
        "/api/v1/api-lite/listings/wr-001",
        headers={"X-Domarion-API-Key": DEFAULT_LOCAL_API_LITE_KEY},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["id"] == "wr-001"
    assert payload["area_statistics"]["area_id"] == payload["area_id"]
    assert payload["comparables_count"] == len(payload["comparable_listing_ids"])
    assert "source_url" not in json.dumps(payload)
    assert all("payload" not in event for event in payload["listing_events"])


def test_api_lite_accepts_hashed_configured_key(monkeypatch) -> None:
    secret = "agency-secret"
    monkeypatch.setenv(
        "API_LITE_KEYS_JSON",
        json.dumps(
            [
                {
                    "key_id": "agency-hash",
                    "label": "Agency hash key",
                    "owner_id": "agency-owner-1",
                    "plan": "agency",
                    "monthly_quota": 5,
                    "scopes": ["areas:read", "usage:read"],
                    "key_sha256": hashlib.sha256(secret.encode("utf-8")).hexdigest(),
                }
            ]
        ),
    )
    get_settings.cache_clear()

    response = client.get(
        "/api/v1/api-lite/areas/compare",
        headers={"X-Domarion-API-Key": secret},
        params={"city": "Wrocław", "limit": 2},
    )
    usage = client.get("/api/v1/api-lite/usage", headers={"X-Domarion-API-Key": secret}).json()

    assert response.status_code == 200
    assert response.json()["area_count"] >= 1
    assert usage["key_id"] == "agency-hash"
    assert usage["owner_id"] == "agency-owner-1"
    assert usage["used_units"] == 1


def test_api_lite_rejects_key_without_api_capability(monkeypatch) -> None:
    monkeypatch.setenv(
        "API_LITE_KEYS_JSON",
        json.dumps([{"key": "free-key", "key_id": "free-key", "plan": "free"}]),
    )
    get_settings.cache_clear()

    response = client.get(
        "/api/v1/api-lite/listings",
        headers={"X-Domarion-API-Key": "free-key"},
    )

    assert response.status_code == 403
    assert response.json()["detail"]["required_capability"] == "can_use_api"


def test_api_lite_enforces_monthly_quota(monkeypatch) -> None:
    monkeypatch.setenv(
        "API_LITE_KEYS_JSON",
        json.dumps(
            [
                {
                    "key": "tiny-key",
                    "key_id": "tiny-key",
                    "plan": "enterprise",
                    "monthly_quota": 1,
                }
            ]
        ),
    )
    get_settings.cache_clear()
    headers = {"X-Domarion-API-Key": "tiny-key"}

    first = client.get("/api/v1/api-lite/listings/wr-001", headers=headers)
    second = client.get("/api/v1/api-lite/listings/wr-002", headers=headers)
    usage = client.get("/api/v1/api-lite/usage", headers=headers).json()

    assert first.status_code == 200
    assert second.status_code == 429
    assert second.json()["detail"]["code"] == "api_quota_exceeded"
    assert second.json()["detail"]["used_units"] == 1
    assert usage["used_units"] == 1


def test_api_lite_enforces_per_minute_rate_limit(monkeypatch) -> None:
    monkeypatch.setenv(
        "API_LITE_KEYS_JSON",
        json.dumps(
            [
                {
                    "key": "slow-key",
                    "key_id": "slow-key",
                    "plan": "enterprise",
                    "monthly_quota": 10,
                    "rate_limit_per_minute": 1,
                }
            ]
        ),
    )
    get_settings.cache_clear()
    headers = {"X-Domarion-API-Key": "slow-key"}

    first = client.get("/api/v1/api-lite/listings/wr-001", headers=headers)
    second = client.get("/api/v1/api-lite/listings/wr-002", headers=headers)
    usage = client.get("/api/v1/api-lite/usage", headers=headers).json()

    assert first.status_code == 200
    assert second.status_code == 429
    assert second.json()["detail"]["code"] == "api_rate_limit_exceeded"
    assert second.json()["detail"]["recent_units"] == 1
    assert usage["used_units"] == 1
