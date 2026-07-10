from datetime import datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from domarion.db.models import ReportOrder as ReportOrderModel
from domarion.schemas import ReportOrder, ReportOrderCreate, ReportProduct


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
