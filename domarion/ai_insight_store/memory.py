from datetime import UTC, datetime
from uuid import uuid4

from domarion.schemas import (
    AIInsight,
    AIInsightCreate,
    AIInsightListItem,
    AIInsightSubjectType,
    AIInsightType,
)


class InMemoryAIInsightStore:
    def __init__(self) -> None:
        self._items: dict[str, AIInsight] = {}

    def save_insight(self, payload: AIInsightCreate) -> AIInsight:
        existing = self._find_existing(payload)
        if existing is not None:
            return existing

        insight = AIInsight(
            id=str(uuid4()),
            created_at=datetime.now(UTC),
            **payload.model_dump(),
        )
        self._items[insight.id] = insight
        return insight

    def list_insights(
        self,
        owner_id: str | None = None,
        subject_type: AIInsightSubjectType | None = None,
        subject_id: str | None = None,
        insight_type: AIInsightType | None = None,
        limit: int = 50,
    ) -> list[AIInsightListItem]:
        insights = list(self._items.values())
        if owner_id is not None:
            insights = [item for item in insights if item.owner_id == owner_id]
        if subject_type is not None:
            insights = [item for item in insights if item.subject_type == subject_type]
        if subject_id is not None:
            insights = [item for item in insights if item.subject_id == subject_id]
        if insight_type is not None:
            insights = [item for item in insights if item.insight_type == insight_type]

        return [
            AIInsightListItem(**item.model_dump(exclude={"content", "input_hash", "metadata"}))
            for item in sorted(
                insights,
                key=lambda insight: insight.created_at,
                reverse=True,
            )[:limit]
        ]

    def get_insight(
        self,
        insight_id: str,
        owner_id: str | None = None,
    ) -> AIInsight | None:
        insight = self._items.get(insight_id)
        if insight is None:
            return None
        if owner_id is not None and insight.owner_id != owner_id:
            return None
        return insight

    def clear(self) -> None:
        self._items.clear()

    def _find_existing(self, payload: AIInsightCreate) -> AIInsight | None:
        if payload.source_report_id is None:
            return None
        for insight in self._items.values():
            if (
                insight.source_report_id == payload.source_report_id
                and insight.insight_type == payload.insight_type
                and insight.input_hash == payload.input_hash
            ):
                return insight
        return None
