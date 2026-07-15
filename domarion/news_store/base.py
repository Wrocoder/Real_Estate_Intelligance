from typing import Protocol

from domarion.schemas import (
    NewsArticle,
    NewsArticleCreate,
    NewsArticleListItem,
    NewsArticleUpdate,
    NewsCategory,
)


class NewsStore(Protocol):
    def list_articles(
        self,
        *,
        category: NewsCategory | None = None,
        area_id: str | None = None,
        published_only: bool = True,
        limit: int = 50,
    ) -> list[NewsArticleListItem]:
        raise NotImplementedError

    def get_article(self, article_id: str, *, published_only: bool = True) -> NewsArticle | None:
        raise NotImplementedError

    def create_article(self, payload: NewsArticleCreate) -> NewsArticle:
        raise NotImplementedError

    def update_article(self, article_id: str, payload: NewsArticleUpdate) -> NewsArticle | None:
        raise NotImplementedError
