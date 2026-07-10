from dataclasses import dataclass
from typing import Protocol

from domarion.core import get_settings
from domarion.schemas import ReportOrder


@dataclass(frozen=True)
class PaymentSession:
    provider: str
    mode: str
    checkout_url: str
    external_reference: str | None = None
    metadata: dict[str, str | int] | None = None


class PaymentProvider(Protocol):
    def create_checkout_session(self, order: ReportOrder) -> PaymentSession:
        raise NotImplementedError


class PaymentConfigurationError(RuntimeError):
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
