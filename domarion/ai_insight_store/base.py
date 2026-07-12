from typing import Protocol

from domarion.schemas import (
    AIInsight,
    AIInsightCreate,
    AIInsightListItem,
    AIInsightSubjectType,
    AIInsightType,
)


class AIInsightStore(Protocol):
    def save_insight(self, payload: AIInsightCreate) -> AIInsight:
        raise NotImplementedError

    def list_insights(
        self,
        owner_id: str | None = None,
        subject_type: AIInsightSubjectType | None = None,
        subject_id: str | None = None,
        insight_type: AIInsightType | None = None,
        limit: int = 50,
    ) -> list[AIInsightListItem]:
        raise NotImplementedError

    def get_insight(
        self,
        insight_id: str,
        owner_id: str | None = None,
    ) -> AIInsight | None:
        raise NotImplementedError
