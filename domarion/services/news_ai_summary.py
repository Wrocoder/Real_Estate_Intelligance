from __future__ import annotations

import hashlib
import json

from domarion.ai_insight_store.base import AIInsightStore
from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    AIAnswerCitation,
    AIAnswerGuardrail,
    AIInsight,
    AIInsightCreate,
    AreaStatistics,
    NewsArticle,
    NewsArticleAISummary,
)

NEWS_AI_PROMPT_VERSION = "news-summary-grounded-v1"
NEWS_AI_PROVIDER = "domarion_rule_based"
NEWS_AI_MODEL = "domarion-deterministic-v1"
NEWS_AI_DISCLAIMER = (
    "This news summary is source-grounded screening context, not legal, tax, "
    "financial or investment advice and not a guaranteed price forecast."
)


def build_news_ai_summary(
    repository: RealEstateRepository,
    article: NewsArticle,
) -> NewsArticleAISummary:
    areas = [
        area
        for area_id in article.affected_area_ids
        if (area := repository.get_area_statistics(area_id)) is not None
    ]
    key_points = _key_points(article)
    area_impact = _area_impact(article, areas)
    buyer_notes = _buyer_notes(article, areas)
    investor_notes = _investor_notes(article, areas)
    citations = _citations(article, areas)
    input_hash = _input_hash(article, areas)

    return NewsArticleAISummary(
        subject_id=article.id,
        article_id=article.id,
        category=article.category,
        headline=article.title,
        summary=_summary(article, key_points, area_impact),
        key_points=key_points,
        area_impact=area_impact,
        buyer_notes=buyer_notes,
        investor_notes=investor_notes,
        citations=citations,
        guardrails=[
            AIAnswerGuardrail(
                code="source_grounded_only",
                message="Summary uses only stored article fields and Domarion area statistics.",
            ),
            AIAnswerGuardrail(
                code="no_price_forecast",
                message="Area impact is a hypothesis, not a guaranteed market forecast.",
            ),
        ],
        provider=NEWS_AI_PROVIDER,
        model_name=NEWS_AI_MODEL,
        prompt_version=NEWS_AI_PROMPT_VERSION,
        input_hash=input_hash,
        disclaimer=NEWS_AI_DISCLAIMER,
    )


def save_news_ai_summary(
    store: AIInsightStore,
    summary: NewsArticleAISummary,
    *,
    owner_id: str,
) -> AIInsight:
    content = "\n".join(
        [
            summary.summary,
            "",
            "Key points:",
            *[f"- {item}" for item in summary.key_points],
            "",
            "Area impact:",
            *[f"- {item}" for item in summary.area_impact],
            "",
            "Buyer notes:",
            *[f"- {item}" for item in summary.buyer_notes],
            "",
            "Investor notes:",
            *[f"- {item}" for item in summary.investor_notes],
            "",
            "Citations:",
            *[f"- {citation.title}: {citation.excerpt}" for citation in summary.citations],
            "",
            summary.disclaimer,
        ]
    )
    return store.save_insight(
        AIInsightCreate(
            owner_id=owner_id,
            subject_type="news",
            subject_id=summary.article_id,
            insight_type="news_summary",
            provider=summary.provider,
            model_name=summary.model_name,
            prompt_version=summary.prompt_version,
            title=f"News summary: {summary.headline}",
            summary=summary.summary,
            content=content,
            input_hash=summary.input_hash,
            metadata={
                "category": summary.category,
                "citation_source_ids": [
                    citation.source_id for citation in summary.citations
                ],
            },
        )
    )


def _key_points(article: NewsArticle) -> list[str]:
    points = [
        article.summary,
        f"Category: {article.category}; impact level: {article.impact_level}.",
    ]
    if article.price_impact_hypothesis:
        points.append(f"Price impact hypothesis: {article.price_impact_hypothesis}")
    if article.affected_districts:
        points.append("Affected districts: " + ", ".join(article.affected_districts) + ".")
    if article.tags:
        points.append("Tags: " + ", ".join(article.tags[:5]) + ".")
    return points[:5]


def _area_impact(article: NewsArticle, areas: list[AreaStatistics]) -> list[str]:
    if not article.affected_area_ids and not article.affected_districts:
        return ["No district-specific impact field is attached to this article."]
    impacts = []
    for area in areas:
        impacts.append(
            f"{area.name}: median {area.median_price_per_m2} PLN/m2, "
            f"price 90d {area.price_change_90d_pct:+.1f}%, "
            f"supply 90d {area.supply_change_90d_pct:+.1f}%."
        )
    if not impacts and article.affected_districts:
        impacts.append(
            "District names are tagged, but no matching area statistics were found."
        )
    return impacts


def _buyer_notes(article: NewsArticle, areas: list[AreaStatistics]) -> list[str]:
    notes = [
        "Treat this as context for questions and checks, not as a buy/no-buy decision.",
    ]
    if article.price_impact_hypothesis:
        notes.append("Verify whether the hypothesis applies within 500 m - 2 km of the object.")
    if areas:
        notes.append("Compare target listing price with the affected area's median PLN/m2.")
    if article.category in {"legal", "tax", "mortgage"}:
        notes.append("Use a licensed professional for regulated advice before signing.")
    return notes


def _investor_notes(article: NewsArticle, areas: list[AreaStatistics]) -> list[str]:
    notes = [
        "Underwrite rent, liquidity and exit timing separately from the headline.",
    ]
    if article.category in {"transport", "city_investment", "mpzp"}:
        notes.append("Check project delivery status and disruption before pricing growth.")
    if areas:
        strongest = max(areas, key=lambda area: area.price_change_90d_pct)
        notes.append(
            f"Strongest tagged area momentum is {strongest.name} at "
            f"{strongest.price_change_90d_pct:+.1f}% over 90 days."
        )
    return notes


def _summary(
    article: NewsArticle,
    key_points: list[str],
    area_impact: list[str],
) -> str:
    return (
        f"{article.title}: {key_points[0]} Area relevance: {area_impact[0]} "
        f"Use this as source-grounded market context."
    )


def _citations(article: NewsArticle, areas: list[AreaStatistics]) -> list[AIAnswerCitation]:
    citations = [
        AIAnswerCitation(
            source_id=f"news:{article.id}",
            source_type="news_article",
            title=article.title,
            excerpt=article.summary,
        )
    ]
    citations.extend(
        AIAnswerCitation(
            source_id=f"area:{area.area_id}:statistics",
            source_type="area_statistics",
            title=f"{area.name} market statistics",
            excerpt=(
                f"Median {area.median_price_per_m2} PLN/m2, DOM "
                f"{area.average_days_on_market}, price 90d "
                f"{area.price_change_90d_pct:+.1f}%."
            ),
        )
        for area in areas[:4]
    )
    return citations


def _input_hash(article: NewsArticle, areas: list[AreaStatistics]) -> str:
    payload = {
        "article": article.model_dump(mode="json"),
        "areas": [area.model_dump(mode="json") for area in areas],
    }
    serialized = json.dumps(payload, sort_keys=True, ensure_ascii=False, default=str)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
