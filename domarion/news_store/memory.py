from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import uuid4

from domarion.schemas import (
    NewsArticle,
    NewsArticleCreate,
    NewsArticleListItem,
    NewsArticleUpdate,
    NewsCategory,
)


class InMemoryNewsStore:
    def __init__(self) -> None:
        self._articles: dict[str, NewsArticle] = {}
        self._seed()

    def list_articles(
        self,
        *,
        category: NewsCategory | None = None,
        area_id: str | None = None,
        published_only: bool = True,
        limit: int = 50,
    ) -> list[NewsArticleListItem]:
        articles = list(self._articles.values())
        if published_only:
            articles = [article for article in articles if article.is_published]
        if category is not None:
            articles = [article for article in articles if article.category == category]
        if area_id is not None:
            articles = [
                article for article in articles if area_id in article.affected_area_ids
            ]
        return [
            _to_list_item(article)
            for article in sorted(
                articles,
                key=lambda item: item.published_at,
                reverse=True,
            )[:limit]
        ]

    def get_article(self, article_id: str, *, published_only: bool = True) -> NewsArticle | None:
        article = self._articles.get(article_id)
        if article is None:
            return None
        if published_only and not article.is_published:
            return None
        return article

    def create_article(self, payload: NewsArticleCreate) -> NewsArticle:
        now = _now()
        article = NewsArticle(
            id=f"news-{uuid4().hex[:12]}",
            created_at=now,
            updated_at=now,
            **payload.model_dump(),
        )
        self._articles[article.id] = article
        return article

    def update_article(self, article_id: str, payload: NewsArticleUpdate) -> NewsArticle | None:
        article = self._articles.get(article_id)
        if article is None:
            return None
        update = payload.model_dump(exclude_unset=True)
        updated = article.model_copy(update={**update, "updated_at": _now()})
        self._articles[article_id] = updated
        return updated

    def clear(self) -> None:
        self._articles.clear()
        self._seed()

    def _seed(self) -> None:
        if self._articles:
            return
        now = _now()
        seeded = [
            NewsArticle(
                id="news-wroclaw-tram-fabryczna",
                title="Wrocław transport plan strengthens western districts",
                summary=(
                    "City investment signals around western Wrocław add a transport "
                    "watch item for buyers comparing Fabryczna and nearby suburbs."
                ),
                body=(
                    "The current open-data sample tracks planned transport and road "
                    "projects that may affect access times, liquidity and construction "
                    "disruption in western Wrocław. Buyers should compare the exact "
                    "street radius, not only the district label."
                ),
                category="transport",
                source_name="Domarion open-data monitor",
                source_url=None,
                published_at=now - timedelta(days=2),
                affected_area_ids=["wroclaw-fabryczna"],
                affected_districts=["Fabryczna"],
                price_impact_hypothesis=(
                    "Better access can support liquidity, but construction timing may "
                    "temporarily reduce comfort near the corridor."
                ),
                audience_relevance=["buyer", "investor"],
                impact_level="mixed",
                tags=["transport", "liquidity", "planned-investments"],
                is_published=True,
                created_at=now - timedelta(days=2),
                updated_at=now - timedelta(days=2),
            ),
            NewsArticle(
                id="news-mortgage-cost-watch",
                title="Mortgage cost sensitivity remains central for buyer reports",
                summary=(
                    "Affordability checks should pair asking price with monthly payment, "
                    "cash needed and stress-tested interest assumptions."
                ),
                body=(
                    "Domarion buyer reports now treat mortgage baseline and upfront cash "
                    "as decision inputs. The same listing can look acceptable by price "
                    "per square meter but fail affordability once taxes, fees and renovation "
                    "reserve are included."
                ),
                category="mortgage",
                source_name="Domarion market desk",
                source_url=None,
                published_at=now - timedelta(days=5),
                affected_area_ids=[],
                affected_districts=[],
                price_impact_hypothesis=(
                    "Higher financing sensitivity can increase negotiation pressure on "
                    "overpriced secondary-market listings."
                ),
                audience_relevance=["buyer", "realtor"],
                impact_level="neutral",
                tags=["mortgage", "buyer-report", "affordability"],
                is_published=True,
                created_at=now - timedelta(days=5),
                updated_at=now - timedelta(days=5),
            ),
            NewsArticle(
                id="news-krzyki-supply-watch",
                title="Krzyki supply watch: value depends on micro-location",
                summary=(
                    "Krzyki remains liquid in the MVP sample, but buyer value varies "
                    "strongly by school, road and comparable-listing context."
                ),
                body=(
                    "The district baseline alone is not enough for a decision. Buyers "
                    "should compare local supply, exposure time and noise/road proxies. "
                    "Investor screening should add rental yield and liquidity checks."
                ),
                category="market",
                source_name="Domarion market desk",
                source_url=None,
                published_at=now - timedelta(days=8),
                affected_area_ids=["wroclaw-krzyki"],
                affected_districts=["Krzyki"],
                price_impact_hypothesis=(
                    "No broad price uplift assumption; object-level comparables remain "
                    "more reliable than district-level momentum."
                ),
                audience_relevance=["buyer", "investor", "realtor"],
                impact_level="neutral",
                tags=["krzyki", "market", "liquidity"],
                is_published=True,
                created_at=now - timedelta(days=8),
                updated_at=now - timedelta(days=8),
            ),
        ]
        self._articles = {article.id: article for article in seeded}


def _to_list_item(article: NewsArticle) -> NewsArticleListItem:
    return NewsArticleListItem(**article.model_dump(exclude={"body"}))


def _now() -> datetime:
    return datetime.now(UTC)
