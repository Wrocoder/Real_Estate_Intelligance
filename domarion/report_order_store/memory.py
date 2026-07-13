from datetime import UTC, datetime
from uuid import uuid4

from domarion.schemas import (
    PaymentWebhookEvent,
    PaymentWebhookEventCreate,
    ReportOrder,
    ReportOrderCreate,
    ReportOrderEvent,
    ReportOrderEventCreate,
    ReportProduct,
)


class InMemoryReportOrderStore:
    def __init__(self) -> None:
        self._orders: dict[str, ReportOrder] = {}
        self._events: dict[str, list[ReportOrderEvent]] = {}
        self._webhook_events: dict[tuple[str, str], PaymentWebhookEvent] = {}

    def create_order(
        self,
        owner_id: str,
        payload: ReportOrderCreate,
        product: ReportProduct,
        checkout_url: str | None = None,
    ) -> ReportOrder:
        now = datetime.now(UTC)
        order = ReportOrder(
            id=str(uuid4()),
            owner_id=owner_id,
            listing_id=payload.listing_id,
            product_code=payload.product_code,
            audience=payload.audience or product.audience,
            report_format=payload.report_format,
            status="unpaid",
            amount_grosz=product.amount_grosz,
            currency=product.currency,
            checkout_url=checkout_url,
            billing_details=payload.billing_details,
            created_at=now,
            updated_at=now,
        )
        self._orders[order.id] = order
        return order

    def list_orders(self, owner_id: str, limit: int = 50) -> list[ReportOrder]:
        orders = [order for order in self._orders.values() if order.owner_id == owner_id]
        return sorted(orders, key=lambda item: item.created_at, reverse=True)[:limit]

    def get_order(self, owner_id: str, order_id: str) -> ReportOrder | None:
        order = self._orders.get(order_id)
        if order is None or order.owner_id != owner_id:
            return None
        return order

    def get_order_by_id(self, order_id: str) -> ReportOrder | None:
        return self._orders.get(order_id)

    def set_checkout_url(self, owner_id: str, order_id: str, checkout_url: str) -> ReportOrder:
        order = self.get_order(owner_id, order_id)
        if order is None:
            raise KeyError(order_id)
        updated = order.model_copy(update={"checkout_url": checkout_url, "updated_at": _now()})
        self._orders[order_id] = updated
        return updated

    def mark_paid(self, owner_id: str, order_id: str) -> ReportOrder | None:
        order = self.get_order(owner_id, order_id)
        if order is None:
            return None
        if order.status in {"fulfilled", "canceled"}:
            return order
        now = _now()
        updated = order.model_copy(update={"status": "paid", "paid_at": now, "updated_at": now})
        self._orders[order_id] = updated
        return updated

    def mark_fulfilled(
        self,
        owner_id: str,
        order_id: str,
        generated_report_id: str,
    ) -> ReportOrder | None:
        order = self.get_order(owner_id, order_id)
        if order is None:
            return None
        updated = order.model_copy(
            update={
                "status": "fulfilled",
                "generated_report_id": generated_report_id,
                "fulfilled_at": _now(),
                "updated_at": _now(),
            }
        )
        self._orders[order_id] = updated
        return updated

    def record_event(
        self,
        owner_id: str,
        order_id: str,
        payload: ReportOrderEventCreate,
    ) -> ReportOrderEvent:
        order = self.get_order(owner_id, order_id)
        if order is None:
            raise KeyError(order_id)

        event = ReportOrderEvent(
            id=str(uuid4()),
            order_id=order_id,
            owner_id=owner_id,
            event_type=payload.event_type,
            actor_id=payload.actor_id,
            message=payload.message,
            metadata=payload.metadata,
            created_at=_now(),
        )
        self._events.setdefault(order_id, []).append(event)
        return event

    def list_events(
        self,
        owner_id: str,
        order_id: str,
        limit: int = 100,
    ) -> list[ReportOrderEvent]:
        order = self.get_order(owner_id, order_id)
        if order is None:
            return []
        events = [event for event in self._events.get(order_id, []) if event.owner_id == owner_id]
        return sorted(events, key=lambda item: item.created_at, reverse=True)[:limit]

    def get_payment_webhook_event(
        self,
        provider: str,
        provider_event_id: str,
    ) -> PaymentWebhookEvent | None:
        return self._webhook_events.get((provider, provider_event_id))

    def record_payment_webhook_event(
        self,
        payload: PaymentWebhookEventCreate,
    ) -> PaymentWebhookEvent:
        existing = self.get_payment_webhook_event(payload.provider, payload.provider_event_id)
        if existing is not None:
            return existing

        event = PaymentWebhookEvent(
            id=str(uuid4()),
            provider=payload.provider,
            provider_event_id=payload.provider_event_id,
            order_id=payload.order_id,
            event_type=payload.event_type,
            status=payload.status,
            payload_hash=payload.payload_hash,
            metadata=payload.metadata,
            created_at=_now(),
        )
        self._webhook_events[(event.provider, event.provider_event_id)] = event
        return event

    def clear(self) -> None:
        self._orders.clear()
        self._events.clear()
        self._webhook_events.clear()


def _now() -> datetime:
    return datetime.now(UTC)
