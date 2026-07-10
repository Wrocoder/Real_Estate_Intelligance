from datetime import datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from domarion.db.models import PaymentWebhookEvent as PaymentWebhookEventModel
from domarion.db.models import ReportOrder as ReportOrderModel
from domarion.db.models import ReportOrderEvent as ReportOrderEventModel
from domarion.schemas import (
    PaymentWebhookEvent,
    PaymentWebhookEventCreate,
    ReportOrder,
    ReportOrderCreate,
    ReportOrderEvent,
    ReportOrderEventCreate,
    ReportProduct,
)


class PostgresReportOrderStore:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create_order(
        self,
        owner_id: str,
        payload: ReportOrderCreate,
        product: ReportProduct,
        checkout_url: str | None = None,
    ) -> ReportOrder:
        now = datetime.utcnow()
        row = ReportOrderModel(
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
        self.session.add(row)
        self.session.commit()
        self.session.refresh(row)
        return self._order_from_row(row)

    def list_orders(self, owner_id: str, limit: int = 50) -> list[ReportOrder]:
        rows = self.session.scalars(
            select(ReportOrderModel)
            .where(ReportOrderModel.owner_id == owner_id)
            .order_by(ReportOrderModel.created_at.desc())
            .limit(limit)
        ).all()
        return [self._order_from_row(row) for row in rows]

    def get_order(self, owner_id: str, order_id: str) -> ReportOrder | None:
        row = self.session.get(ReportOrderModel, order_id)
        if row is None or row.owner_id != owner_id:
            return None
        return self._order_from_row(row)

    def get_order_by_id(self, order_id: str) -> ReportOrder | None:
        row = self.session.get(ReportOrderModel, order_id)
        if row is None:
            return None
        return self._order_from_row(row)

    def set_checkout_url(self, owner_id: str, order_id: str, checkout_url: str) -> ReportOrder:
        row = self.session.get(ReportOrderModel, order_id)
        if row is None or row.owner_id != owner_id:
            raise KeyError(order_id)
        row.checkout_url = checkout_url
        row.updated_at = datetime.utcnow()
        self.session.commit()
        self.session.refresh(row)
        return self._order_from_row(row)

    def mark_paid(self, owner_id: str, order_id: str) -> ReportOrder | None:
        row = self.session.get(ReportOrderModel, order_id)
        if row is None or row.owner_id != owner_id:
            return None
        if row.status not in {"fulfilled", "canceled"}:
            now = datetime.utcnow()
            row.status = "paid"
            row.paid_at = now
            row.updated_at = now
            self.session.commit()
            self.session.refresh(row)
        return self._order_from_row(row)

    def mark_fulfilled(
        self,
        owner_id: str,
        order_id: str,
        generated_report_id: str,
    ) -> ReportOrder | None:
        row = self.session.get(ReportOrderModel, order_id)
        if row is None or row.owner_id != owner_id:
            return None
        now = datetime.utcnow()
        row.status = "fulfilled"
        row.generated_report_id = generated_report_id
        row.fulfilled_at = now
        row.updated_at = now
        self.session.commit()
        self.session.refresh(row)
        return self._order_from_row(row)

    def record_event(
        self,
        owner_id: str,
        order_id: str,
        payload: ReportOrderEventCreate,
    ) -> ReportOrderEvent:
        order = self.session.get(ReportOrderModel, order_id)
        if order is None or order.owner_id != owner_id:
            raise KeyError(order_id)

        row = ReportOrderEventModel(
            id=str(uuid4()),
            order_id=order_id,
            owner_id=owner_id,
            event_type=payload.event_type,
            actor_id=payload.actor_id,
            message=payload.message,
            metadata_json=payload.metadata,
            created_at=datetime.utcnow(),
        )
        self.session.add(row)
        self.session.commit()
        self.session.refresh(row)
        return self._event_from_row(row)

    def list_events(
        self,
        owner_id: str,
        order_id: str,
        limit: int = 100,
    ) -> list[ReportOrderEvent]:
        order = self.session.get(ReportOrderModel, order_id)
        if order is None or order.owner_id != owner_id:
            return []
        rows = self.session.scalars(
            select(ReportOrderEventModel)
            .where(
                ReportOrderEventModel.owner_id == owner_id,
                ReportOrderEventModel.order_id == order_id,
            )
            .order_by(ReportOrderEventModel.created_at.desc())
            .limit(limit)
        ).all()
        return [self._event_from_row(row) for row in rows]

    def get_payment_webhook_event(
        self,
        provider: str,
        provider_event_id: str,
    ) -> PaymentWebhookEvent | None:
        row = self.session.scalar(
            select(PaymentWebhookEventModel).where(
                PaymentWebhookEventModel.provider == provider,
                PaymentWebhookEventModel.provider_event_id == provider_event_id,
            )
        )
        if row is None:
            return None
        return self._webhook_event_from_row(row)

    def record_payment_webhook_event(
        self,
        payload: PaymentWebhookEventCreate,
    ) -> PaymentWebhookEvent:
        existing = self.get_payment_webhook_event(payload.provider, payload.provider_event_id)
        if existing is not None:
            return existing

        row = PaymentWebhookEventModel(
            id=str(uuid4()),
            provider=payload.provider,
            provider_event_id=payload.provider_event_id,
            order_id=payload.order_id,
            event_type=payload.event_type,
            status=payload.status,
            payload_hash=payload.payload_hash,
            metadata_json=payload.metadata,
            created_at=datetime.utcnow(),
        )
        self.session.add(row)
        try:
            self.session.commit()
        except IntegrityError:
            self.session.rollback()
            existing = self.get_payment_webhook_event(payload.provider, payload.provider_event_id)
            if existing is not None:
                return existing
            raise
        self.session.refresh(row)
        return self._webhook_event_from_row(row)

    @staticmethod
    def _order_from_row(row: ReportOrderModel) -> ReportOrder:
        return ReportOrder(
            id=row.id,
            owner_id=row.owner_id,
            listing_id=row.listing_id,
            product_code=row.product_code,
            audience=row.audience,
            report_format=row.report_format,
            status=row.status,
            amount_grosz=row.amount_grosz,
            currency=row.currency,
            checkout_url=row.checkout_url,
            generated_report_id=row.generated_report_id,
            created_at=row.created_at,
            updated_at=row.updated_at,
            paid_at=row.paid_at,
            fulfilled_at=row.fulfilled_at,
        )

    @staticmethod
    def _event_from_row(row: ReportOrderEventModel) -> ReportOrderEvent:
        return ReportOrderEvent(
            id=row.id,
            order_id=row.order_id,
            owner_id=row.owner_id,
            event_type=row.event_type,
            actor_id=row.actor_id,
            message=row.message,
            metadata=row.metadata_json,
            created_at=row.created_at,
        )

    @staticmethod
    def _webhook_event_from_row(row: PaymentWebhookEventModel) -> PaymentWebhookEvent:
        return PaymentWebhookEvent(
            id=row.id,
            provider=row.provider,
            provider_event_id=row.provider_event_id,
            order_id=row.order_id,
            event_type=row.event_type,
            status=row.status,
            payload_hash=row.payload_hash,
            metadata=row.metadata_json,
            created_at=row.created_at,
        )
