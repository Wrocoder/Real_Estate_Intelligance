from fastapi.testclient import TestClient

from domarion.auth_store.factory import memory_auth_store
from domarion.main import app
from domarion.report_order_store.factory import memory_report_order_store
from domarion.report_store.factory import memory_report_store
from domarion.user_store.factory import memory_user_store
from domarion.user_submitted_listing_store.factory import memory_user_submitted_listing_store

client = TestClient(app)


def setup_function() -> None:
    memory_auth_store.clear()
    memory_report_order_store.clear()
    memory_report_store.clear()
    memory_user_submitted_listing_store.clear()
    memory_user_store.clear()


def test_report_products_are_available() -> None:
    response = client.get("/api/v1/report-products")
    payload = response.json()

    assert response.status_code == 200
    assert {item["code"] for item in payload} == {
        "area_report",
        "object_report",
        "full_object_analysis",
        "investor_report",
    }
    assert payload[0]["amount_grosz"] > 0


def test_report_order_mock_payment_and_fulfillment() -> None:
    headers = {"X-Domarion-User-Id": "paid-buyer"}

    checkout = client.post(
        "/api/v1/report-orders",
        headers=headers,
        json={"listing_id": "wr-001", "product_code": "object_report"},
    )
    checkout_payload = checkout.json()
    order = checkout_payload["order"]

    assert checkout.status_code == 201
    assert checkout_payload["provider"] == "mock"
    assert checkout_payload["external_reference"] == f"mock:{order['id']}"
    assert order["status"] == "unpaid"
    assert order["checkout_url"].endswith(f"/report-orders/{order['id']}/mock-pay")

    unpaid_fulfill = client.post(f"/api/v1/report-orders/{order['id']}/fulfill", headers=headers)
    assert unpaid_fulfill.status_code == 402

    paid = client.post(f"/api/v1/report-orders/{order['id']}/mock-pay", headers=headers).json()
    assert paid["status"] == "paid"
    assert paid["paid_at"] is not None

    fulfilled = client.post(f"/api/v1/report-orders/{order['id']}/fulfill", headers=headers).json()
    assert fulfilled["status"] == "fulfilled"
    assert fulfilled["generated_report_id"] is not None

    reports = client.get("/api/v1/reports", headers=headers).json()
    assert len(reports) == 1
    assert reports[0]["id"] == fulfilled["generated_report_id"]

    events = client.get(f"/api/v1/report-orders/{order['id']}/events", headers=headers).json()
    event_types = {event["event_type"] for event in events}
    assert {
        "order_created",
        "checkout_created",
        "payment_marked_paid",
        "report_fulfilled",
    }.issubset(event_types)
    assert any(event["metadata"].get("generated_report_id") == reports[0]["id"] for event in events)


def test_report_orders_are_user_scoped() -> None:
    owner_a = {"X-Domarion-User-Id": "order-owner-a"}
    owner_b = {"X-Domarion-User-Id": "order-owner-b"}

    created = client.post(
        "/api/v1/report-orders",
        headers=owner_a,
        json={"listing_id": "wr-001", "product_code": "object_report"},
    ).json()["order"]

    owner_b_list = client.get("/api/v1/report-orders", headers=owner_b).json()
    owner_b_get = client.get(f"/api/v1/report-orders/{created['id']}", headers=owner_b)
    owner_b_events = client.get(f"/api/v1/report-orders/{created['id']}/events", headers=owner_b)

    assert owner_b_list == []
    assert owner_b_get.status_code == 404
    assert owner_b_events.status_code == 404


def test_paid_order_can_fulfill_after_free_report_limit_is_reached() -> None:
    headers = {"X-Domarion-User-Id": "free-paid-bridge"}

    included = client.post(
        "/api/v1/reports/object/generate",
        headers=headers,
        json={"listing_id": "wr-001", "audience": "buyer", "report_format": "html"},
    )
    blocked = client.post(
        "/api/v1/reports/object/generate",
        headers=headers,
        json={"listing_id": "wr-002", "audience": "buyer", "report_format": "html"},
    )

    assert included.status_code == 200
    assert blocked.status_code == 403

    order = client.post(
        "/api/v1/report-orders",
        headers=headers,
        json={"listing_id": "wr-002", "product_code": "full_object_analysis"},
    ).json()["order"]
    client.post(f"/api/v1/report-orders/{order['id']}/mock-pay", headers=headers)
    fulfilled = client.post(f"/api/v1/report-orders/{order['id']}/fulfill", headers=headers)
    report = client.get(
        f"/api/v1/reports/{fulfilled.json()['generated_report_id']}",
        headers=headers,
    ).json()

    assert fulfilled.status_code == 200
    assert fulfilled.json()["generated_report_id"] is not None
    assert report["report_metadata"]["report_product_code"] == "full_object_analysis"
    assert report["report_metadata"]["report_template_code"] == "full_object_analysis_v1"
    assert report["title"].startswith("Full Object Analysis - ")
    assert "Full Object Analysis Summary" in report["content"]
    assert "Due diligence deep dive" in report["content"]
    assert "Scenario matrix" in report["content"]
    assert len(client.get("/api/v1/reports", headers=headers).json()) == 2


def test_report_order_rejects_missing_listing() -> None:
    response = client.post(
        "/api/v1/report-orders",
        json={"listing_id": "missing", "product_code": "object_report"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Listing not found"


def test_area_report_order_mock_payment_and_fulfillment() -> None:
    headers = {"X-Domarion-User-Id": "paid-area-buyer"}

    checkout = client.post(
        "/api/v1/report-orders",
        headers=headers,
        json={
            "listing_id": "area:wroclaw-fabryczna",
            "product_code": "area_report",
            "report_format": "html",
        },
    )
    order = checkout.json()["order"]
    client.post(f"/api/v1/report-orders/{order['id']}/mock-pay", headers=headers)
    fulfilled = client.post(f"/api/v1/report-orders/{order['id']}/fulfill", headers=headers)
    report = client.get(
        f"/api/v1/reports/{fulfilled.json()['generated_report_id']}",
        headers=headers,
    ).json()

    assert checkout.status_code == 201
    assert order["listing_id"] == "area:wroclaw-fabryczna"
    assert order["product_code"] == "area_report"
    assert order["audience"] == "realtor"
    assert fulfilled.status_code == 200
    assert fulfilled.json()["status"] == "fulfilled"
    assert report["listing_id"] == "area:wroclaw-fabryczna"
    assert report["content_type"].startswith("text/html")
    assert "Area Market Report" in report["content"]
    assert report["report_metadata"]["report_template_code"] == "area_market_report_v1"
    assert report["report_metadata"]["area_id"] == "wroclaw-fabryczna"
    assert report["report_metadata"]["liquidity_index"] >= 0


def test_area_report_order_rejects_missing_area() -> None:
    response = client.post(
        "/api/v1/report-orders",
        headers={"X-Domarion-User-Id": "missing-area-order"},
        json={"listing_id": "area:not-found", "product_code": "area_report"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Area not found"


def test_area_reference_requires_area_report_product() -> None:
    response = client.post(
        "/api/v1/report-orders",
        headers={"X-Domarion-User-Id": "wrong-area-product"},
        json={"listing_id": "area:wroclaw-fabryczna", "product_code": "object_report"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Area references require area_report product"


def test_user_submitted_draft_report_order_mock_payment_and_fulfillment() -> None:
    headers = {"X-Domarion-User-Id": "paid-draft-buyer"}
    source_url = "https://www.otodom.pl/pl/oferta/paid-draft-reference"
    draft = client.post(
        "/api/v1/user-submitted-listings/analyze",
        headers=headers,
        json={
            "source_url": source_url,
            "address": "Nowy Dwór, Wrocław",
            "city": "Wrocław",
            "district": "Fabryczna",
            "market_type": "secondary",
            "price": 675000,
            "area_m2": 58.4,
            "rooms": 3,
            "confirm_private_analysis": True,
        },
    ).json()

    checkout = client.post(
        "/api/v1/report-orders",
        headers=headers,
        json={
            "listing_id": f"draft:{draft['draft_id']}",
            "product_code": "object_report",
            "audience": "buyer",
        },
    )
    order = checkout.json()["order"]
    client.post(f"/api/v1/report-orders/{order['id']}/mock-pay", headers=headers)
    fulfilled = client.post(f"/api/v1/report-orders/{order['id']}/fulfill", headers=headers)
    report = client.get(
        f"/api/v1/reports/{fulfilled.json()['generated_report_id']}",
        headers=headers,
    ).json()

    assert checkout.status_code == 201
    assert order["listing_id"] == f"draft:{draft['draft_id']}"
    assert fulfilled.status_code == 200
    assert fulfilled.json()["status"] == "fulfilled"
    assert report["listing_id"].startswith("user-submitted-")
    assert source_url not in report["content"]
    assert report["report_metadata"]["user_submitted_draft_id"] == draft["draft_id"]
    assert report["report_metadata"]["source_domain"] == "otodom.pl"
    assert "source_url_private" not in report["report_metadata"]


def test_report_order_rejects_missing_user_submitted_draft() -> None:
    response = client.post(
        "/api/v1/report-orders",
        headers={"X-Domarion-User-Id": "missing-draft-order"},
        json={"listing_id": "draft:not-found", "product_code": "object_report"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "User-submitted listing draft not found"
