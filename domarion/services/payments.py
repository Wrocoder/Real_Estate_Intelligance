from dataclasses import dataclass
from typing import Protocol

from domarion.schemas import ReportOrder


@dataclass(frozen=True)
class PaymentSession:
    provider: str
    mode: str
    checkout_url: str


class PaymentProvider(Protocol):
    def create_checkout_session(self, order: ReportOrder) -> PaymentSession:
        raise NotImplementedError


class MockPaymentProvider:
    provider = "mock"
    mode = "mock"

    def create_checkout_session(self, order: ReportOrder) -> PaymentSession:
        return PaymentSession(
            provider=self.provider,
            mode=self.mode,
            checkout_url=f"/api/v1/report-orders/{order.id}/mock-pay",
        )
