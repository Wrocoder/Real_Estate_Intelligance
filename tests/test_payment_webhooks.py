import hashlib
import hmac
import json
import time

from fastapi.testclient import TestClient

from domarion.auth_store.factory import memory_auth_store
from domarion.core.config import get_settings
from domarion.main import app
from domarion.report_order_store.factory import memory_report_order_store
from domarion.report_store.factory import memory_report_store
from domarion.user_store.factory import memory_user_store

client = TestClient(app)


def setup_function() -> None:
    get_settings.cache_clear()
    memory_auth_store.clear()
    memory_report_order_store.clear()
    memory_report_store.clear()
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


def _create_order(headers: dict[str, str]) -> dict:
    return client.post(
        "/api/v1/report-orders",
        headers=headers,
        json={"listing_id": "wr-001", "product_code": "object_report"},
    ).json()["order"]


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
