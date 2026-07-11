from datetime import datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from domarion.db.models import GeneratedReport as GeneratedReportModel
from domarion.schemas import GeneratedReport, GeneratedReportCreate, GeneratedReportListItem


class PostgresReportStore:
    def __init__(self, session: Session) -> None:
        self.session = session

    def save_report(self, payload: GeneratedReportCreate) -> GeneratedReport:
        row = GeneratedReportModel(
            id=str(uuid4()),
            owner_id=payload.owner_id,
            listing_id=payload.listing_id,
            audience=payload.audience,
            report_format=payload.report_format,
            content_type=payload.content_type,
            title=payload.title,
            summary=payload.summary,
            content=payload.content,
            report_metadata=payload.report_metadata,
            created_at=datetime.utcnow(),
        )
        self.session.add(row)
        self.session.commit()
        self.session.refresh(row)
        return self._row_to_report(row)

    def list_reports(
        self,
        limit: int = 50,
        owner_id: str | None = None,
    ) -> list[GeneratedReportListItem]:
        rows = self._list_report_rows(limit=limit, owner_id=owner_id)
        return [self._row_to_list_item(row) for row in rows]

    def list_reports_with_metadata(
        self,
        limit: int = 50,
        owner_id: str | None = None,
    ) -> list[GeneratedReport]:
        rows = self._list_report_rows(limit=limit, owner_id=owner_id)
        return [self._row_to_report(row) for row in rows]

    def _list_report_rows(
        self,
        limit: int = 50,
        owner_id: str | None = None,
    ) -> list[GeneratedReportModel]:
        statement = select(GeneratedReportModel)
        if owner_id is not None:
            statement = statement.where(GeneratedReportModel.owner_id == owner_id)
        return list(
            self.session.scalars(
                statement.order_by(GeneratedReportModel.created_at.desc()).limit(limit)
            ).all()
        )

    def get_report(
        self,
        report_id: str,
        owner_id: str | None = None,
    ) -> GeneratedReport | None:
        row = self.session.get(GeneratedReportModel, report_id)
        if row is None or (owner_id is not None and row.owner_id != owner_id):
            return None
        return self._row_to_report(row)

    @staticmethod
    def _row_to_report(row: GeneratedReportModel) -> GeneratedReport:
        return GeneratedReport(
            id=row.id,
            owner_id=row.owner_id,
            listing_id=row.listing_id,
            audience=row.audience,
            report_format=row.report_format,
            content_type=row.content_type,
            title=row.title,
            summary=row.summary,
            content=row.content,
            report_metadata=row.report_metadata,
            created_at=row.created_at,
        )

    @staticmethod
    def _row_to_list_item(row: GeneratedReportModel) -> GeneratedReportListItem:
        return GeneratedReportListItem(
            id=row.id,
            owner_id=row.owner_id,
            listing_id=row.listing_id,
            audience=row.audience,
            report_format=row.report_format,
            content_type=row.content_type,
            title=row.title,
            summary=row.summary,
            created_at=row.created_at,
        )
