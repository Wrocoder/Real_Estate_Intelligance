import hashlib
import hmac
import json
import time
from dataclasses import dataclass
from typing import Any, Protocol

from domarion.core import get_settings
from domarion.schemas import PaymentProviderName, ReportOrder


@dataclass(frozen=True)
class PaymentSession:
    provider: str
    mode: str
    checkout_url: str
    external_reference: str | None = None
    metadata: dict[str, str | int] | None = None


@dataclass(frozen=True)
class VerifiedPaymentWebhook:
    provider: PaymentProviderName
    provider_event_id: str
    event_type: str
    order_id: str | None
    payment_status: str
    should_mark_paid: bool
    payload: dict[str, Any]
    metadata: dict[str, Any]


class PaymentProvider(Protocol):
    def create_checkout_session(self, order: ReportOrder) -> PaymentSession:
        raise NotImplementedError


class PaymentConfigurationError(RuntimeError):
    pass


class PaymentWebhookVerificationError(RuntimeError):
    pass


class MockPaymentProvider:
    provider = "mock"
    mode = "mock"

    def create_checkout_session(self, order: ReportOrder) -> PaymentSession:
        return PaymentSession(
            provider=self.provider,
            mode=self.mode,
            checkout_url=f"/api/v1/report-orders/{order.id}/mock-pay",
            external_reference=f"mock:{order.id}",
            metadata={"order_id": order.id, "amount_grosz": order.amount_grosz},
        )


class ConfiguredCheckoutPaymentProvider:
    mode = "live"

    def __init__(self, provider: str, checkout_base_url: str | None) -> None:
        self.provider = provider
        self.checkout_base_url = checkout_base_url.rstrip("/") if checkout_base_url else None

    def create_checkout_session(self, order: ReportOrder) -> PaymentSession:
        if not self.checkout_base_url:
            raise PaymentConfigurationError(
                f"{self.provider.upper()} checkout is not configured. "
                "Set PAYMENT_CHECKOUT_BASE_URL or switch PAYMENT_PROVIDER=mock."
            )

        external_reference = f"{self.provider}:{order.id}"
        return PaymentSession(
            provider=self.provider,
            mode=self.mode,
            checkout_url=f"{self.checkout_base_url}/{self.provider}/checkout/{order.id}",
            external_reference=external_reference,
            metadata={
                "order_id": order.id,
                "listing_id": order.listing_id,
                "amount_grosz": order.amount_grosz,
                "currency": order.currency,
            },
        )


def get_payment_provider() -> PaymentProvider:
    settings = get_settings()
    provider = settings.payment_provider.lower()

    if provider == "mock":
        return MockPaymentProvider()
    if provider in {"stripe", "payu"}:
        return ConfiguredCheckoutPaymentProvider(provider, settings.payment_checkout_base_url)

    raise PaymentConfigurationError(
        "Unsupported PAYMENT_PROVIDER. Use 'mock', 'stripe', or 'payu'."
    )


def verify_payment_webhook(
    provider: str,
    body: bytes,
    headers: dict[str, str],
) -> VerifiedPaymentWebhook:
    normalized_provider = provider.lower()
    if normalized_provider == "stripe":
        return _verify_stripe_webhook(body, headers)
    if normalized_provider == "payu":
        return _verify_payu_webhook(body, headers)
    if normalized_provider == "mock":
        return _verify_mock_webhook(body)
    raise PaymentWebhookVerificationError("Unsupported payment webhook provider.")


def payment_payload_hash(body: bytes) -> str:
    return hashlib.sha256(body).hexdigest()


def _verify_stripe_webhook(
    body: bytes,
    headers: dict[str, str],
) -> VerifiedPaymentWebhook:
    settings = get_settings()
    if not settings.stripe_webhook_secret:
        raise PaymentConfigurationError("STRIPE_WEBHOOK_SECRET is not configured.")

    signature_header = _header(headers, "stripe-signature")
    if not signature_header:
        raise PaymentWebhookVerificationError("Missing Stripe-Signature header.")

    signature_parts = _parse_signature_header(signature_header, separator=",")
    timestamp = _single_header_value(signature_parts, "t")
    signatures = signature_parts.get("v1", [])
    if timestamp is None or not signatures:
        raise PaymentWebhookVerificationError("Invalid Stripe-Signature header.")

    try:
        timestamp_int = int(timestamp)
    except ValueError as exc:
        raise PaymentWebhookVerificationError("Invalid Stripe webhook timestamp.") from exc

    tolerance = settings.payment_webhook_tolerance_seconds
    if tolerance > 0 and abs(int(time.time()) - timestamp_int) > tolerance:
        raise PaymentWebhookVerificationError("Stripe webhook timestamp is outside tolerance.")

    signed_payload = f"{timestamp}.".encode() + body
    expected_signature = hmac.new(
        settings.stripe_webhook_secret.encode("utf-8"),
        signed_payload,
        hashlib.sha256,
    ).hexdigest()
    if not any(hmac.compare_digest(expected_signature, signature) for signature in signatures):
        raise PaymentWebhookVerificationError("Stripe webhook signature mismatch.")

    payload = _decode_json_body(body)
    event_type = str(payload.get("type") or "unknown")
    provider_event_id = str(payload.get("id") or payment_payload_hash(body))
    data_object = _as_dict(_as_dict(payload.get("data")).get("object"))
    metadata = _as_dict(data_object.get("metadata"))
    order_id = _first_string(
        metadata.get("order_id"),
        data_object.get("client_reference_id"),
        data_object.get("id"),
    )
    payment_status = str(
        data_object.get("payment_status")
        or data_object.get("status")
        or payload.get("payment_status")
        or "unknown"
    ).lower()

    return VerifiedPaymentWebhook(
        provider="stripe",
        provider_event_id=provider_event_id,
        event_type=event_type,
        order_id=order_id,
        payment_status=payment_status,
        should_mark_paid=_is_paid_webhook_status(event_type, payment_status),
        payload=payload,
        metadata={
            "stripe_object_id": data_object.get("id"),
            "payment_status": payment_status,
        },
    )


def _verify_payu_webhook(
    body: bytes,
    headers: dict[str, str],
) -> VerifiedPaymentWebhook:
    settings = get_settings()
    if not settings.payu_second_key:
        raise PaymentConfigurationError("PAYU_SECOND_KEY is not configured.")

    signature_header = _header(headers, "openpayu-signature")
    if not signature_header:
        raise PaymentWebhookVerificationError("Missing OpenPayU-Signature header.")

    signature_parts = _parse_signature_header(signature_header, separator=";")
    incoming_signature = _single_header_value(signature_parts, "signature")
    algorithm = (_single_header_value(signature_parts, "algorithm") or "MD5").lower()
    if not incoming_signature:
        raise PaymentWebhookVerificationError("Invalid OpenPayU-Signature header.")

    digest = _payu_digest(body, settings.payu_second_key, algorithm)
    if not hmac.compare_digest(digest.lower(), incoming_signature.lower()):
        raise PaymentWebhookVerificationError("PayU webhook signature mismatch.")

    payload = _decode_json_body(body)
    order = _as_dict(payload.get("order"))
    event_type = str(payload.get("eventType") or payload.get("event_type") or "order_status")
    payment_status = str(
        order.get("status")
        or payload.get("status")
        or payload.get("payment_status")
        or "unknown"
    ).lower()
    provider_order_id = _first_string(order.get("orderId"), order.get("order_id"))
    order_id = _first_string(
        order.get("extOrderId"),
        order.get("ext_order_id"),
        payload.get("order_id"),
        payload.get("extOrderId"),
    )
    provider_event_id = str(
        payload.get("eventId")
        or payload.get("event_id")
        or f"{provider_order_id or order_id or payment_payload_hash(body)}:{payment_status}"
    )

    return VerifiedPaymentWebhook(
        provider="payu",
        provider_event_id=provider_event_id,
        event_type=event_type,
        order_id=order_id,
        payment_status=payment_status,
        should_mark_paid=_is_paid_webhook_status(event_type, payment_status),
        payload=payload,
        metadata={
            "payu_order_id": provider_order_id,
            "payment_status": payment_status,
            "signature_algorithm": algorithm,
        },
    )


def _verify_mock_webhook(body: bytes) -> VerifiedPaymentWebhook:
    settings = get_settings()
    if settings.environment == "production":
        raise PaymentWebhookVerificationError("Mock payment webhooks are disabled in production.")

    payload = _decode_json_body(body)
    event_type = str(payload.get("event_type") or "mock.payment_succeeded")
    payment_status = str(payload.get("status") or payload.get("payment_status") or "paid").lower()
    provider_event_id = str(payload.get("event_id") or payment_payload_hash(body))
    order_id = _first_string(payload.get("order_id"))

    return VerifiedPaymentWebhook(
        provider="mock",
        provider_event_id=provider_event_id,
        event_type=event_type,
        order_id=order_id,
        payment_status=payment_status,
        should_mark_paid=_is_paid_webhook_status(event_type, payment_status),
        payload=payload,
        metadata={"payment_status": payment_status},
    )


def _decode_json_body(body: bytes) -> dict[str, Any]:
    try:
        payload = json.loads(body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise PaymentWebhookVerificationError("Webhook body must be valid JSON.") from exc
    if not isinstance(payload, dict):
        raise PaymentWebhookVerificationError("Webhook body must be a JSON object.")
    return payload


def _parse_signature_header(
    signature_header: str,
    separator: str,
) -> dict[str, list[str]]:
    parsed: dict[str, list[str]] = {}
    for part in signature_header.split(separator):
        if "=" not in part:
            continue
        key, value = part.split("=", 1)
        key = key.strip().lower()
        value = value.strip()
        parsed.setdefault(key, []).append(value)
    return parsed


def _single_header_value(
    values: dict[str, list[str]],
    key: str,
) -> str | None:
    candidates = values.get(key.lower(), [])
    return candidates[0] if candidates else None


def _payu_digest(body: bytes, second_key: str, algorithm: str) -> str:
    digest_input = body + second_key.encode("utf-8")
    if algorithm == "md5":
        return hashlib.md5(digest_input, usedforsecurity=False).hexdigest()
    if algorithm in {"sha256", "sha-256"}:
        return hashlib.sha256(digest_input).hexdigest()
    raise PaymentWebhookVerificationError(f"Unsupported PayU signature algorithm: {algorithm}.")


def _header(headers: dict[str, str], name: str) -> str | None:
    lowered = name.lower()
    for key, value in headers.items():
        if key.lower() == lowered:
            return value
    return None


def _as_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _first_string(*values: Any) -> str | None:
    for value in values:
        if isinstance(value, str) and value:
            return value
    return None


def _is_paid_webhook_status(event_type: str, payment_status: str) -> bool:
    normalized_event = event_type.lower()
    normalized_status = payment_status.lower()
    paid_statuses = {"paid", "succeeded", "success", "completed", "complete"}
    paid_events = {
        "checkout.session.completed",
        "payment_intent.succeeded",
        "charge.succeeded",
        "payment.succeeded",
        "mock.payment_succeeded",
    }
    return normalized_status in paid_statuses or normalized_event in paid_events
