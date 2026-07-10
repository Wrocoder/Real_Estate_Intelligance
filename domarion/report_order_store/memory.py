from datetime import UTC, datetime
from uuid import uuid4

from domarion.schemas import ReportOrder, ReportOrderCreate, ReportProduct


class InMemoryReportOrderStore:
    def __init__(self) -> None:
        self._orders: dict[str, ReportOrder] = {}

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

    def clear(self) -> None:
        self._orders.clear()


def _now() -> datetime:
    return datetime.now(UTC)
