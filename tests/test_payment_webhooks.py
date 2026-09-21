import hashlib
import hmac
import json
import time

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


def test_stripe_paid_webhook_fulfills_order_once(monkeypatch) -> None:
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_test")
    get_settings.cache_clear()
    headers = {"X-Domarion-User-Id": "stripe-buyer"}
    order = _create_order(headers)
    body = _json_bytes(
        {
            "id": "evt_stripe_paid_1",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test_1",
                    "payment_status": "paid",
                    "metadata": {"order_id": order["id"]},
                }
            },
        }
    )

    response = client.post(
        "/api/v1/payment-webhooks/stripe",
        content=body,
        headers={"Stripe-Signature": _stripe_signature(body, "whsec_test")},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["status"] == "processed"
    assert payload["order"]["status"] == "fulfilled"
    assert payload["generated_report_id"] is not None
    assert payload["webhook_event"]["provider_event_id"] == "evt_stripe_paid_1"

    duplicate = client.post(
        "/api/v1/payment-webhooks/stripe",
        content=body,
        headers={"Stripe-Signature": _stripe_signature(body, "whsec_test")},
    ).json()
    reports = client.get("/api/v1/reports", headers=headers).json()
    events = client.get(f"/api/v1/report-orders/{order['id']}/events", headers=headers).json()

    assert duplicate["status"] == "duplicate"
    assert len(reports) == 1
    assert {event["event_type"] for event in events} >= {
        "payment_webhook_processed",
        "report_fulfilled",
    }


def test_stripe_paid_webhook_rejects_amount_mismatch(monkeypatch) -> None:
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_test")
    get_settings.cache_clear()
    headers = {"X-Domarion-User-Id": "stripe-mismatch-buyer"}
    order = _create_stripe_checkout_order(monkeypatch, headers, session_id="cs_expected_amount")
    body = _json_bytes(
        {
            "id": "evt_stripe_amount_mismatch",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_expected_amount",
                    "payment_status": "paid",
                    "amount_total": order["amount_grosz"] - 100,
                    "currency": order["currency"].lower(),
                    "metadata": {"order_id": order["id"]},
                }
            },
        }
    )

    response = client.post(
        "/api/v1/payment-webhooks/stripe",
        content=body,
        headers={"Stripe-Signature": _stripe_signature(body, "whsec_test")},
    )
    payload = response.json()
    updated = client.get(f"/api/v1/report-orders/{order['id']}", headers=headers).json()
    events = client.get(f"/api/v1/report-orders/{order['id']}/events", headers=headers).json()

    assert response.status_code == 200
    assert payload["status"] == "rejected"
    assert payload["order"]["status"] == "unpaid"
    assert payload["webhook_event"]["metadata"]["reason"] == "amount_mismatch"
    assert updated["status"] == "unpaid"
    assert updated["generated_report_id"] is None
    assert "payment_webhook_rejected" in {event["event_type"] for event in events}


def test_stripe_paid_webhook_rejects_checkout_reference_mismatch(monkeypatch) -> None:
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_test")
    get_settings.cache_clear()
    headers = {"X-Domarion-User-Id": "stripe-reference-buyer"}
    order = _create_stripe_checkout_order(monkeypatch, headers, session_id="cs_expected_reference")
    body = _json_bytes(
        {
            "id": "evt_stripe_reference_mismatch",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_wrong_reference",
                    "payment_status": "paid",
                    "amount_total": order["amount_grosz"],
                    "currency": order["currency"].lower(),
                    "metadata": {"order_id": order["id"]},
                }
            },
        }
    )

    response = client.post(
        "/api/v1/payment-webhooks/stripe",
        content=body,
        headers={"Stripe-Signature": _stripe_signature(body, "whsec_test")},
    )
    payload = response.json()
    reports = client.get("/api/v1/reports", headers=headers).json()

    assert response.status_code == 200
    assert payload["status"] == "rejected"
    assert payload["order"]["status"] == "unpaid"
    assert payload["webhook_event"]["metadata"]["reason"] == "checkout_reference_mismatch"
    assert reports == []


def test_stripe_failed_webhook_marks_order_failed_without_report(monkeypatch) -> None:
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_test")
    get_settings.cache_clear()
    headers = {"X-Domarion-User-Id": "stripe-failed-buyer"}
    order = _create_order(headers)
    body = _json_bytes(
        {
            "id": "evt_stripe_failed_1",
            "type": "payment_intent.payment_failed",
            "data": {
                "object": {
                    "id": "pi_failed_1",
                    "status": "failed",
                    "metadata": {"order_id": order["id"]},
                }
            },
        }
    )

    response = client.post(
        "/api/v1/payment-webhooks/stripe",
        content=body,
        headers={"Stripe-Signature": _stripe_signature(body, "whsec_test")},
    )
    payload = response.json()
    reports = client.get("/api/v1/reports", headers=headers).json()
    events = client.get(f"/api/v1/report-orders/{order['id']}/events", headers=headers).json()

    assert response.status_code == 200
    assert payload["status"] == "processed"
    assert payload["order"]["status"] == "failed"
    assert payload["generated_report_id"] is None
    assert reports == []
    assert "payment_failed" in {event["event_type"] for event in events}


def test_stripe_refund_webhook_marks_fulfilled_order_refunded(monkeypatch) -> None:
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_test")
    get_settings.cache_clear()
    headers = {"X-Domarion-User-Id": "stripe-refund-buyer"}
    order = _create_order(headers)
    client.post(f"/api/v1/report-orders/{order['id']}/mock-pay", headers=headers)
    fulfilled = client.post(f"/api/v1/report-orders/{order['id']}/fulfill", headers=headers).json()
    body = _json_bytes(
        {
            "id": "evt_stripe_refund_1",
            "type": "charge.refunded",
            "data": {
                "object": {
                    "id": "ch_refunded_1",
                    "status": "refunded",
                    "amount": order["amount_grosz"],
                    "currency": order["currency"].lower(),
                    "metadata": {"order_id": order["id"]},
                }
            },
        }
    )

    response = client.post(
        "/api/v1/payment-webhooks/stripe",
        content=body,
        headers={"Stripe-Signature": _stripe_signature(body, "whsec_test")},
    )
    payload = response.json()
    events = client.get(f"/api/v1/report-orders/{order['id']}/events", headers=headers).json()

    assert response.status_code == 200
    assert payload["status"] == "processed"
    assert payload["order"]["status"] == "refunded"
    assert payload["generated_report_id"] == fulfilled["generated_report_id"]
    assert "payment_refunded" in {event["event_type"] for event in events}


def test_stripe_webhook_rejects_invalid_signature(monkeypatch) -> None:
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_test")
    get_settings.cache_clear()
    body = _json_bytes({"id": "evt_invalid", "type": "checkout.session.completed"})

    response = client.post(
        "/api/v1/payment-webhooks/stripe",
        content=body,
        headers={"Stripe-Signature": f"t={int(time.time())},v1=wrong"},
    )

    assert response.status_code == 400
    assert "signature" in response.json()["detail"].lower()


def test_stripe_paid_webhook_fulfills_user_submitted_draft_order(monkeypatch) -> None:
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_test")
    get_settings.cache_clear()
    headers = {"X-Domarion-User-Id": "stripe-draft-buyer"}
    source_url = "https://www.otodom.pl/pl/oferta/webhook-draft-reference"
    draft = _create_user_submitted_draft(headers, source_url)
    order = _create_order(headers, listing_id=f"draft:{draft['draft_id']}")
    body = _json_bytes(
        {
            "id": "evt_stripe_paid_draft_1",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test_draft_1",
                    "payment_status": "paid",
                    "metadata": {"order_id": order["id"]},
                }
            },
        }
    )

    response = client.post(
        "/api/v1/payment-webhooks/stripe",
        content=body,
        headers={"Stripe-Signature": _stripe_signature(body, "whsec_test")},
    )
    payload = response.json()
    report = client.get(
        f"/api/v1/reports/{payload['generated_report_id']}",
        headers=headers,
    ).json()

    assert response.status_code == 200
    assert payload["status"] == "processed"
    assert payload["order"]["status"] == "fulfilled"
    assert report["listing_id"].startswith("user-submitted-")
    assert source_url not in report["content"]
    assert report["report_metadata"]["user_submitted_draft_id"] == draft["draft_id"]
    assert "source_url_private" not in report["report_metadata"]


def test_payu_completed_webhook_fulfills_order(monkeypatch) -> None:
    monkeypatch.setenv("PAYU_SECOND_KEY", "second-key-test")
    get_settings.cache_clear()
    headers = {"X-Domarion-User-Id": "payu-buyer"}
    order = _create_order(headers)
    body = _json_bytes(
        {
            "order": {
                "orderId": "payu-order-1",
                "extOrderId": order["id"],
                "status": "COMPLETED",
            }
        }
    )

    response = client.post(
        "/api/v1/payment-webhooks/payu",
        content=body,
        headers={"OpenPayU-Signature": _payu_signature(body, "second-key-test")},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["status"] == "processed"
    assert payload["order"]["status"] == "fulfilled"
    assert payload["generated_report_id"] is not None
    assert payload["webhook_event"]["metadata"]["payu_order_id"] == "payu-order-1"


def _create_order(headers: dict[str, str], listing_id: str = "wr-001") -> dict:
    return client.post(
        "/api/v1/report-orders",
        headers=headers,
        json={"listing_id": listing_id, "product_code": "object_report"},
    ).json()["order"]


def _create_stripe_checkout_order(monkeypatch, headers: dict[str, str], session_id: str) -> dict:
    monkeypatch.setenv("PAYMENT_PROVIDER", "stripe")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_domarion")
    monkeypatch.setenv("PAYMENT_CHECKOUT_BASE_URL", "https://app.example")
    get_settings.cache_clear()

    def fake_post_form(url, payload, *, headers, timeout):
        return payments.HttpJsonResponse(
            status_code=200,
            headers={},
            payload={
                "id": session_id,
                "url": f"https://checkout.stripe.com/c/pay/{session_id}",
            },
        )

    monkeypatch.setattr(payments, "_post_form", fake_post_form)
    return _create_order(headers)


def _create_user_submitted_draft(headers: dict[str, str], source_url: str) -> dict:
    return client.post(
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


def _json_bytes(payload: dict) -> bytes:
    return json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _stripe_signature(body: bytes, secret: str) -> str:
    timestamp = int(time.time())
    signed_payload = f"{timestamp}.".encode() + body
    signature = hmac.new(secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()
    return f"t={timestamp},v1={signature}"


def _payu_signature(body: bytes, second_key: str) -> str:
    signature = hashlib.md5(
        body + second_key.encode("utf-8"),
        usedforsecurity=False,
    ).hexdigest()
    return f"sender=checkout;signature={signature};algorithm=MD5;content=DOCUMENT"
