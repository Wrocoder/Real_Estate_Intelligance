from typing import Protocol

from domarion.schemas import (
    PaymentWebhookEvent,
    PaymentWebhookEventCreate,
    ReportOrder,
    ReportOrderCreate,
    ReportOrderEvent,
    ReportOrderEventCreate,
    ReportProduct,
)


class ReportOrderStore(Protocol):
    def create_order(
        self,
        owner_id: str,
        payload: ReportOrderCreate,
        product: ReportProduct,
        checkout_url: str | None = None,
    ) -> ReportOrder:
        raise NotImplementedError

    def list_orders(self, owner_id: str, limit: int = 50) -> list[ReportOrder]:
        raise NotImplementedError

    def get_order(self, owner_id: str, order_id: str) -> ReportOrder | None:
        raise NotImplementedError

    def get_order_by_id(self, order_id: str) -> ReportOrder | None:
        raise NotImplementedError

    def set_checkout_url(self, owner_id: str, order_id: str, checkout_url: str) -> ReportOrder:
        raise NotImplementedError

    def mark_paid(self, owner_id: str, order_id: str) -> ReportOrder | None:
        raise NotImplementedError

    def mark_fulfilled(
        self,
        owner_id: str,
        order_id: str,
        generated_report_id: str,
    ) -> ReportOrder | None:
        raise NotImplementedError

    def record_event(
        self,
        owner_id: str,
        order_id: str,
        payload: ReportOrderEventCreate,
    ) -> ReportOrderEvent:
        raise NotImplementedError

    def list_events(
        self,
        owner_id: str,
        order_id: str,
        limit: int = 100,
    ) -> list[ReportOrderEvent]:
        raise NotImplementedError

    def get_payment_webhook_event(
        self,
        provider: str,
        provider_event_id: str,
    ) -> PaymentWebhookEvent | None:
        raise NotImplementedError

    def record_payment_webhook_event(
        self,
        payload: PaymentWebhookEventCreate,
    ) -> PaymentWebhookEvent:
        raise NotImplementedError
