from fastapi.testclient import TestClient

from domarion.ai_insight_store.factory import memory_ai_insight_store
from domarion.auth_store.factory import memory_auth_store
from domarion.core.config import get_settings
from domarion.main import app
from domarion.report_order_store.factory import memory_report_order_store
from domarion.report_store.factory import memory_report_store
from domarion.services import payments
from domarion.user_store.factory import memory_user_store
from domarion.user_submitted_listing_store.factory import memory_user_submitted_listing_store

client = TestClient(app)


def setup_function() -> None:
    get_settings.cache_clear()
    memory_ai_insight_store.clear()
    memory_auth_store.clear()
    memory_report_order_store.clear()
    memory_report_store.clear()
    memory_user_submitted_listing_store.clear()
    memory_user_store.clear()


def teardown_function() -> None:
    get_settings.cache_clear()


def test_report_products_are_available() -> None:
    response = client.get("/api/v1/report-products")
    payload = response.json()

    assert response.status_code == 200
    assert {item["code"] for item in payload} == {
        "area_report",
        "object_report",
        "full_object_analysis",
        "investor_report",
        "report_bundle_5",
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


def test_stripe_report_order_uses_hosted_checkout_api(monkeypatch) -> None:
    monkeypatch.setenv("PAYMENT_PROVIDER", "stripe")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_domarion")
    monkeypatch.setenv("PAYMENT_CHECKOUT_BASE_URL", "https://app.example")
    get_settings.cache_clear()
    calls: list[dict] = []

    def fake_post_form(url, payload, *, headers, timeout):
        calls.append(
            {
                "url": url,
                "payload": payload,
                "headers": headers,
                "timeout": timeout,
            }
        )
        return payments.HttpJsonResponse(
            status_code=200,
            headers={},
            payload={
                "id": "cs_test_123",
                "url": "https://checkout.stripe.com/c/pay/cs_test_123",
            },
        )

    monkeypatch.setattr(payments, "_post_form", fake_post_form)

    response = client.post(
        "/api/v1/report-orders",
        headers={"X-Domarion-User-Id": "stripe-checkout-buyer"},
        json={"listing_id": "wr-001", "product_code": "object_report"},
    )
    payload = response.json()
    checkout_payload = calls[0]["payload"]

    assert response.status_code == 201
    assert payload["provider"] == "stripe"
    assert payload["checkout_url"] == "https://checkout.stripe.com/c/pay/cs_test_123"
    assert payload["external_reference"] == "cs_test_123"
    assert payload["metadata"]["stripe_session_id"] == "cs_test_123"
    assert calls[0]["url"] == "https://api.stripe.com/v1/checkout/sessions"
    assert calls[0]["headers"]["Authorization"].startswith("Basic ")
    assert checkout_payload["mode"] == "payment"
    assert checkout_payload["client_reference_id"] == payload["order"]["id"]
    assert checkout_payload["line_items[0][price_data][unit_amount]"] == "4900"
    assert checkout_payload["line_items[0][price_data][currency]"] == "pln"
    assert checkout_payload["metadata[order_id]"] == payload["order"]["id"]
    assert checkout_payload["payment_intent_data[metadata][order_id]"] == payload["order"]["id"]
    assert checkout_payload["success_url"].startswith("https://app.example/pricing?payment=success")
    assert checkout_payload["cancel_url"].startswith("https://app.example/pricing?payment=cancel")
    assert payload["order"]["checkout_url"] == payload["checkout_url"]


def test_payu_report_order_uses_oauth_and_hosted_order_api(monkeypatch) -> None:
    monkeypatch.setenv("PAYMENT_PROVIDER", "payu")
    monkeypatch.setenv("PAYMENT_CHECKOUT_BASE_URL", "https://app.example")
    monkeypatch.setenv("PAYU_CLIENT_ID", "payu-client-id")
    monkeypatch.setenv("PAYU_CLIENT_SECRET", "payu-client-secret")
    monkeypatch.setenv("PAYU_MERCHANT_POS_ID", "payu-pos-id")
    monkeypatch.setenv("PAYU_NOTIFY_URL", "https://api.example/api/v1/payment-webhooks/payu")
    get_settings.cache_clear()
    form_calls: list[dict] = []
    json_calls: list[dict] = []

    def fake_post_form(url, payload, *, headers, timeout):
        form_calls.append(
            {
                "url": url,
                "payload": payload,
                "headers": headers,
                "timeout": timeout,
            }
        )
        return payments.HttpJsonResponse(
            status_code=200,
            headers={},
            payload={"access_token": "payu-access-token"},
        )

    def fake_post_json(url, payload, *, headers, timeout):
        json_calls.append(
            {
                "url": url,
                "payload": payload,
                "headers": headers,
                "timeout": timeout,
            }
        )
        return payments.HttpJsonResponse(
            status_code=302,
            headers={"location": "https://secure.snd.payu.com/pay/?orderId=payu-order-123"},
            payload={
                "orderId": "payu-order-123",
                "status": {"statusCode": "SUCCESS"},
            },
        )

    monkeypatch.setattr(payments, "_post_form", fake_post_form)
    monkeypatch.setattr(payments, "_post_json", fake_post_json)

    response = client.post(
        "/api/v1/report-orders",
        headers={"X-Domarion-User-Id": "payu-checkout-buyer"},
        json={"listing_id": "wr-001", "product_code": "object_report"},
    )
    payload = response.json()
    order_payload = json_calls[0]["payload"]

    assert response.status_code == 201
    assert payload["provider"] == "payu"
    assert payload["checkout_url"] == "https://secure.snd.payu.com/pay/?orderId=payu-order-123"
    assert payload["external_reference"] == "payu-order-123"
    assert payload["metadata"]["payu_order_id"] == "payu-order-123"
    assert form_calls[0]["url"] == (
        "https://secure.snd.payu.com/pl/standard/user/oauth/authorize"
    )
    assert form_calls[0]["payload"] == {
        "grant_type": "client_credentials",
        "client_id": "payu-client-id",
        "client_secret": "payu-client-secret",
    }
    assert json_calls[0]["url"] == "https://secure.snd.payu.com/api/v2_1/orders"
    assert json_calls[0]["headers"]["Authorization"] == "Bearer payu-access-token"
    assert order_payload["merchantPosId"] == "payu-pos-id"
    assert order_payload["extOrderId"] == payload["order"]["id"]
    assert order_payload["totalAmount"] == "4900"
    assert order_payload["currencyCode"] == "PLN"
    assert order_payload["notifyUrl"] == "https://api.example/api/v1/payment-webhooks/payu"
    assert order_payload["continueUrl"].startswith(
        "https://app.example/pricing?payment=success"
    )
    assert order_payload["products"] == [
        {
            "name": "Object Check",
            "unitPrice": "4900",
            "quantity": "1",
            "virtual": True,
        }
    ]
    assert payload["order"]["checkout_url"] == payload["checkout_url"]


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

    insights = client.get(
        "/api/v1/ai-insights",
        headers=headers,
        params={"subject_type": "area", "subject_id": "wroclaw-fabryczna"},
    ).json()
    assert [item["insight_type"] for item in insights] == ["area_summary"]
    assert insights[0]["source_report_id"] == fulfilled.json()["generated_report_id"]


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


def test_report_bundle_grants_and_consumes_report_credits() -> None:
    headers = {"X-Domarion-User-Id": "bundle-buyer"}
    included = client.post(
        "/api/v1/reports/object/generate",
        headers=headers,
        json={"listing_id": "wr-001", "audience": "buyer", "report_format": "html"},
    )
    blocked_before_bundle = client.post(
        "/api/v1/reports/object/generate",
        headers=headers,
        json={"listing_id": "wr-002", "audience": "buyer", "report_format": "html"},
    )

    checkout = client.post(
        "/api/v1/report-orders",
        headers=headers,
        json={"listing_id": "bundle:reports-5", "product_code": "report_bundle_5"},
    )
    order = checkout.json()["order"]
    client.post(f"/api/v1/report-orders/{order['id']}/mock-pay", headers=headers)
    fulfilled = client.post(f"/api/v1/report-orders/{order['id']}/fulfill", headers=headers)
    receipt = client.get(
        f"/api/v1/reports/{fulfilled.json()['generated_report_id']}",
        headers=headers,
    ).json()
    account_after_purchase = client.get("/api/v1/me", headers=headers).json()

    assert included.status_code == 200
    assert blocked_before_bundle.status_code == 403
    assert checkout.status_code == 201
    assert order["listing_id"] == "bundle:reports-5"
    assert fulfilled.status_code == 200
    assert receipt["report_metadata"]["report_bundle_receipt"] is True
    assert receipt["report_metadata"]["report_credits_granted"] == 5
    assert account_after_purchase["usage"]["reports_this_month"] == 1
    assert account_after_purchase["usage"]["report_credits_available"] == 5

    for _ in range(5):
        generated = client.post(
            "/api/v1/reports/object/generate",
            headers=headers,
            json={"listing_id": "wr-002", "audience": "buyer", "report_format": "html"},
        )
        payload = generated.json()
        assert generated.status_code == 200
        assert payload["report_metadata"]["report_credit_consumed"] == 1
        assert payload["report_metadata"]["report_credit_source_order_id"] == order["id"]

    account_after_consumption = client.get("/api/v1/me", headers=headers).json()
    blocked_after_credits = client.post(
        "/api/v1/reports/object/generate",
        headers=headers,
        json={"listing_id": "wr-003", "audience": "buyer", "report_format": "html"},
    )

    assert account_after_consumption["usage"]["reports_this_month"] == 1
    assert account_after_consumption["usage"]["report_credits_available"] == 0
    assert blocked_after_credits.status_code == 403
    assert blocked_after_credits.json()["detail"]["report_credits_available"] == 0


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
