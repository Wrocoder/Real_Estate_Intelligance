from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi.testclient import TestClient

from domarion.main import app
from domarion.product_analytics_store.factory import memory_product_analytics_store
from domarion.product_analytics_store.memory import InMemoryProductAnalyticsStore
from domarion.schemas import ProductEventCreate
from domarion.services.product_analytics import EVENT_PROPERTY_KEYS, PRODUCT_EVENT_ORDER

client = TestClient(app)
ADMIN_HEADERS = {
    "X-Domarion-User-Id": "product-analytics-admin",
    "X-Domarion-Email": "product-analytics-admin@example.com",
    "X-Domarion-Role": "admin",
    "X-Domarion-Plan": "enterprise",
}


def setup_function() -> None:
    memory_product_analytics_store.clear()


def test_product_event_contract_has_all_version_one_funnel_names() -> None:
    assert set(PRODUCT_EVENT_ORDER) == {
        "check_started",
        "check_completed",
        "report_opened",
        "verdict_viewed",
        "comparables_opened",
        "risk_opened",
        "negotiation_opened",
        "negotiation_message_generated",
        "property_saved",
        "comparison_started",
        "comparison_completed",
        "pricing_viewed",
        "checkout_started",
        "purchase_completed",
    }
    assert set(EVENT_PROPERTY_KEYS) == set(PRODUCT_EVENT_ORDER)


def _event(event_name: str, properties: dict[str, str | int]) -> dict[str, object]:
    return {
        "event_name": event_name,
        "journey_id": str(uuid4()),
        "schema_version": "1.0",
        "locale": "pl",
        "properties": properties,
    }


def test_product_events_accept_allowlisted_non_pii_properties() -> None:
    response = client.post(
        "/api/v1/product-events",
        json=_event(
            "check_completed",
            {
                "surface": "check",
                "intent": "living",
                "market_type": "secondary",
                "result_state": "success",
                "confidence_level": "medium",
            },
        ),
    )

    assert response.status_code == 202
    assert response.json() == {
        "accepted": True,
        "event_name": "check_completed",
        "schema_version": "1.0",
    }


def test_product_events_reject_listing_url_address_and_free_text() -> None:
    for forbidden_property in ("source_url", "address", "email", "message"):
        response = client.post(
            "/api/v1/product-events",
            json=_event(
                "check_started",
                {"surface": "check", forbidden_property: "sensitive value"},
            ),
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "invalid_product_event"


def test_product_events_reject_unbounded_property_values() -> None:
    response = client.post(
        "/api/v1/product-events",
        json=_event("check_started", {"surface": "arbitrary-free-text"}),
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "invalid_product_event"


def test_admin_product_funnel_returns_ordered_aggregate_without_raw_events() -> None:
    journey_id = str(uuid4())
    for event_name, properties in (
        ("check_started", {"surface": "check", "entry_mode": "url"}),
        (
            "check_completed",
            {"surface": "check", "result_state": "success", "confidence_level": "high"},
        ),
    ):
        payload = _event(event_name, properties)
        payload["journey_id"] = journey_id
        assert client.post("/api/v1/product-events", json=payload).status_code == 202

    response = client.get("/api/v1/admin/product-funnel?days=30", headers=ADMIN_HEADERS)
    payload = response.json()

    assert response.status_code == 200
    assert payload["total_events"] == 2
    assert payload["unique_journeys"] == 1
    assert payload["stages"][0] == {
        "event_name": "check_started",
        "event_count": 1,
        "unique_journeys": 1,
    }
    assert "events" not in payload


def test_memory_store_removes_events_outside_retention_window() -> None:
    store = InMemoryProductAnalyticsStore()
    now = datetime.now(UTC)
    old_event = ProductEventCreate.model_validate(_event("pricing_viewed", {"surface": "pricing"}))
    current_event = ProductEventCreate.model_validate(
        _event("check_started", {"surface": "check", "entry_mode": "manual"})
    )

    store.record_event(old_event, now - timedelta(days=181))
    store.record_event(current_event, now)

    total_events, unique_journeys, counts = store.summarize(now - timedelta(days=365))
    assert total_events == 1
    assert unique_journeys == 1
    assert counts == {"check_started": (1, 1)}
