from datetime import datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from domarion.db.models import AIInsight as AIInsightModel
from domarion.schemas import (
    AIInsight,
    AIInsightCreate,
    AIInsightListItem,
    AIInsightSubjectType,
    AIInsightType,
)


class PostgresAIInsightStore:
    def __init__(self, session: Session) -> None:
        self.session = session

    def save_insight(self, payload: AIInsightCreate) -> AIInsight:
        existing = self._find_existing(payload)
        if existing is not None:
            return self._row_to_insight(existing)

        row = AIInsightModel(
            id=str(uuid4()),
            owner_id=payload.owner_id,
            subject_type=payload.subject_type,
            subject_id=payload.subject_id,
            insight_type=payload.insight_type,
            provider=payload.provider,
            model_name=payload.model_name,
            prompt_version=payload.prompt_version,
            source_report_id=payload.source_report_id,
            title=payload.title,
            summary=payload.summary,
            content=payload.content,
            input_hash=payload.input_hash,
            metadata_json=payload.metadata,
            created_at=datetime.utcnow(),
        )
        self.session.add(row)
        self.session.commit()
        self.session.refresh(row)
        return self._row_to_insight(row)

    def list_insights(
        self,
        owner_id: str | None = None,
        subject_type: AIInsightSubjectType | None = None,
        subject_id: str | None = None,
        insight_type: AIInsightType | None = None,
        limit: int = 50,
    ) -> list[AIInsightListItem]:
        statement = select(AIInsightModel)
        if owner_id is not None:
            statement = statement.where(AIInsightModel.owner_id == owner_id)
        if subject_type is not None:
            statement = statement.where(AIInsightModel.subject_type == subject_type)
        if subject_id is not None:
            statement = statement.where(AIInsightModel.subject_id == subject_id)
        if insight_type is not None:
            statement = statement.where(AIInsightModel.insight_type == insight_type)

        rows = self.session.scalars(
            statement.order_by(AIInsightModel.created_at.desc()).limit(limit)
        ).all()
        return [self._row_to_list_item(row) for row in rows]

    def get_insight(
        self,
        insight_id: str,
        owner_id: str | None = None,
    ) -> AIInsight | None:
        row = self.session.get(AIInsightModel, insight_id)
        if row is None or (owner_id is not None and row.owner_id != owner_id):
            return None
        return self._row_to_insight(row)

    def _find_existing(self, payload: AIInsightCreate) -> AIInsightModel | None:
        if payload.source_report_id is None:
            return None
        return self.session.scalar(
            select(AIInsightModel).where(
                AIInsightModel.source_report_id == payload.source_report_id,
                AIInsightModel.insight_type == payload.insight_type,
                AIInsightModel.input_hash == payload.input_hash,
            )
        )

    @staticmethod
    def _row_to_insight(row: AIInsightModel) -> AIInsight:
        return AIInsight(
            id=row.id,
            owner_id=row.owner_id,
            subject_type=row.subject_type,
            subject_id=row.subject_id,
            insight_type=row.insight_type,
            provider=row.provider,
            model_name=row.model_name,
            prompt_version=row.prompt_version,
            source_report_id=row.source_report_id,
            title=row.title,
            summary=row.summary,
            content=row.content,
            input_hash=row.input_hash,
            metadata=row.metadata_json,
            created_at=row.created_at,
        )

    @staticmethod
    def _row_to_list_item(row: AIInsightModel) -> AIInsightListItem:
        return AIInsightListItem(
            id=row.id,
            owner_id=row.owner_id,
            subject_type=row.subject_type,
            subject_id=row.subject_id,
            insight_type=row.insight_type,
            provider=row.provider,
            model_name=row.model_name,
            prompt_version=row.prompt_version,
            source_report_id=row.source_report_id,
            title=row.title,
            summary=row.summary,
            created_at=row.created_at,
        )
