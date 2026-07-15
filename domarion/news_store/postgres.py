from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from domarion.db.models import NewsArticle as NewsArticleModel
from domarion.schemas import (
    NewsArticle,
    NewsArticleCreate,
    NewsArticleListItem,
    NewsArticleUpdate,
    NewsCategory,
)


class PostgresNewsStore:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_articles(
        self,
        *,
        category: NewsCategory | None = None,
        area_id: str | None = None,
        published_only: bool = True,
        limit: int = 50,
    ) -> list[NewsArticleListItem]:
        statement = select(NewsArticleModel)
        if published_only:
            statement = statement.where(NewsArticleModel.is_published.is_(True))
        if category is not None:
            statement = statement.where(NewsArticleModel.category == category)

        rows = self.session.scalars(
            statement.order_by(NewsArticleModel.published_at.desc()).limit(limit)
        ).all()
        articles = [self._row_to_article(row) for row in rows]
        if area_id is not None:
            articles = [
                article for article in articles if area_id in article.affected_area_ids
            ]
        return [NewsArticleListItem(**article.model_dump(exclude={"body"})) for article in articles]

    def get_article(self, article_id: str, *, published_only: bool = True) -> NewsArticle | None:
        row = self.session.get(NewsArticleModel, article_id)
        if row is None:
            return None
        if published_only and not row.is_published:
            return None
        return self._row_to_article(row)

    def create_article(self, payload: NewsArticleCreate) -> NewsArticle:
        now = datetime.utcnow()
        row = NewsArticleModel(
            id=f"news-{uuid4().hex[:12]}",
            title=payload.title,
            summary=payload.summary,
            body=payload.body,
            category=payload.category,
            source_name=payload.source_name,
            source_url=payload.source_url,
            published_at=payload.published_at,
            affected_area_ids_json=payload.affected_area_ids,
            affected_districts_json=payload.affected_districts,
            price_impact_hypothesis=payload.price_impact_hypothesis,
            audience_relevance_json=payload.audience_relevance,
            impact_level=payload.impact_level,
            tags_json=payload.tags,
            is_published=payload.is_published,
            created_at=now,
            updated_at=now,
        )
        self.session.add(row)
        self.session.commit()
        self.session.refresh(row)
        return self._row_to_article(row)

    def update_article(self, article_id: str, payload: NewsArticleUpdate) -> NewsArticle | None:
        row = self.session.get(NewsArticleModel, article_id)
        if row is None:
            return None
        update = payload.model_dump(exclude_unset=True)
        for key, value in update.items():
            if key == "affected_area_ids":
                row.affected_area_ids_json = value
            elif key == "affected_districts":
                row.affected_districts_json = value
            elif key == "audience_relevance":
                row.audience_relevance_json = value
            elif key == "tags":
                row.tags_json = value
            else:
                setattr(row, key, value)
        row.updated_at = datetime.utcnow()
        self.session.commit()
        self.session.refresh(row)
        return self._row_to_article(row)

    @staticmethod
    def _row_to_article(row: NewsArticleModel) -> NewsArticle:
        return NewsArticle(
            id=row.id,
            title=row.title,
            summary=row.summary,
            body=row.body,
            category=row.category,
            source_name=row.source_name,
            source_url=row.source_url,
            published_at=row.published_at,
            affected_area_ids=row.affected_area_ids_json or [],
            affected_districts=row.affected_districts_json or [],
            price_impact_hypothesis=row.price_impact_hypothesis,
            audience_relevance=row.audience_relevance_json or [],
            impact_level=row.impact_level,
            tags=row.tags_json or [],
            is_published=row.is_published,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
