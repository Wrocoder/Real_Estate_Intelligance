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
    AreaComparisonItem,
    AreaImpactSummary,
    AreaStatistics,
    MarketDashboard,
    PlannedInvestment,
)
from domarion.services.area_comparison import build_area_comparison
from domarion.services.market_dashboard import build_market_dashboard

AREA_AI_PROMPT_VERSION = "area-impact-summary-grounded-v1"
AREA_AI_PROVIDER = "domarion_rule_based"
AREA_AI_MODEL = "domarion-deterministic-v1"
AREA_AI_DISCLAIMER = (
    "This area summary is source-grounded market screening guidance, not a price "
    "forecast, legal advice, tax advice or investment recommendation."
)


def build_area_impact_summary(
    repository: RealEstateRepository,
    area_id: str,
) -> AreaImpactSummary:
    area = repository.get_area_statistics(area_id)
    if area is None:
        raise ValueError(f"Area not found: {area_id}")

    comparison = build_area_comparison(repository, city=area.city, sort="value", limit=500)
    comparison_item = next(
        (item for item in comparison.areas if item.area_id == area.area_id),
        None,
    )
    if comparison_item is None:
        raise ValueError(f"Area comparison not available for {area_id}")

    dashboard = build_market_dashboard(repository, city=area.city, district=area.name)
    investments = repository.list_planned_investments(city=area.city, district=area.name)
    posture = _posture(comparison_item)
    positive_signals = _positive_signals(comparison_item, investments)
    risk_signals = _risk_signals(comparison_item, investments)
    buyer_notes = _buyer_notes(comparison_item, area)
    investor_notes = _investor_notes(comparison_item, area, investments)
    citations = _citations(area, comparison_item, dashboard, investments)
    input_hash = _input_hash(area, comparison_item, dashboard, investments)

    return AreaImpactSummary(
        subject_id=area.area_id,
        area_id=area.area_id,
        name=area.name,
        city=area.city,
        posture=posture,
        summary=_summary(comparison_item, posture, positive_signals, risk_signals),
        value_index=comparison_item.value_index,
        growth_index=comparison_item.growth_index,
        buyer_market_index=comparison_item.buyer_market_index,
        seller_market_index=comparison_item.seller_market_index,
        liquidity_index=comparison_item.liquidity_index,
        overheated_index=comparison_item.overheated_index,
        positive_signals=positive_signals,
        risk_signals=risk_signals,
        buyer_notes=buyer_notes,
        investor_notes=investor_notes,
        citations=citations,
        guardrails=[
            AIAnswerGuardrail(
                code="source_grounded_only",
                message="Summary uses only structured Domarion area and open-data fields.",
            ),
            AIAnswerGuardrail(
                code="no_price_forecast",
                message="No guaranteed future price, legal or investment advice is provided.",
            ),
        ],
        provider=AREA_AI_PROVIDER,
        model_name=AREA_AI_MODEL,
        prompt_version=AREA_AI_PROMPT_VERSION,
        input_hash=input_hash,
        disclaimer=AREA_AI_DISCLAIMER,
    )


def save_area_impact_summary(
    store: AIInsightStore,
    summary: AreaImpactSummary,
    *,
    owner_id: str,
) -> AIInsight:
    content = "\n".join(
        [
            summary.summary,
            "",
            "Positive signals:",
            *[f"- {item}" for item in summary.positive_signals],
            "",
            "Risk signals:",
            *[f"- {item}" for item in summary.risk_signals],
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
            subject_type="area",
            subject_id=summary.area_id,
            insight_type="area_summary",
            provider=summary.provider,
            model_name=summary.model_name,
            prompt_version=summary.prompt_version,
            title=f"Area impact summary: {summary.name}",
            summary=summary.summary,
            content=content,
            input_hash=summary.input_hash,
            metadata={
                "city": summary.city,
                "posture": summary.posture,
                "value_index": summary.value_index,
                "growth_index": summary.growth_index,
                "citation_source_ids": [
                    citation.source_id for citation in summary.citations
                ],
            },
        )
    )


def _posture(area: AreaComparisonItem) -> str:
    if area.overheated_index >= 70:
        return "overheated_watch"
    if area.value_index >= 65 and area.growth_index >= 55:
        return "strong_value_growth"
    if area.buyer_market_index >= 65:
        return "buyer_leverage"
    if area.growth_index >= 65:
        return "growth_watch"
    if area.liquidity_index >= 70:
        return "liquid_balanced"
    return "balanced_watch"


def _positive_signals(
    area: AreaComparisonItem,
    investments: list[PlannedInvestment],
) -> list[str]:
    signals = [
        f"Value index {area.value_index}/100 and growth index {area.growth_index}/100.",
        (
            f"Liquidity index {area.liquidity_index}/100 with average DOM "
            f"{area.average_days_on_market}."
        ),
    ]
    if area.price_per_m2_vs_city_pct is not None and area.price_per_m2_vs_city_pct < 0:
        signals.append(
            f"Median price is {abs(area.price_per_m2_vs_city_pct):.1f}% below city median."
        )
    if area.buyer_market_index > area.seller_market_index:
        signals.append("Buyer leverage is stronger than seller pressure in current area metrics.")
    if investments:
        signals.append(
            f"{len(investments)} planned investment signals are linked to the area dataset."
        )
    return signals[:5]


def _risk_signals(
    area: AreaComparisonItem,
    investments: list[PlannedInvestment],
) -> list[str]:
    signals: list[str] = []
    if area.overheated_index >= 60:
        signals.append(f"Overheated index is elevated at {area.overheated_index}/100.")
    if area.price_per_m2_vs_city_pct is not None and area.price_per_m2_vs_city_pct > 10:
        signals.append(f"Median price is {area.price_per_m2_vs_city_pct:.1f}% above city median.")
    if area.supply_change_90d_pct > 10:
        signals.append(
            f"Supply grew {area.supply_change_90d_pct:.1f}% in 90 days; check oversupply."
        )
    low_confidence = [item for item in investments if item.confidence_score < 60]
    if low_confidence:
        signals.append("Some planned-investment records have limited confidence; verify freshness.")
    return signals or ["No dominant area-level risk signal in current structured data."]


def _buyer_notes(area: AreaComparisonItem, area_stats: AreaStatistics) -> list[str]:
    notes = [
        f"Use {area_stats.median_price_per_m2} PLN/m2 as the district baseline before negotiating.",
        f"Compare object DOM with district average of {area_stats.average_days_on_market} days.",
    ]
    if area.buyer_market_index >= area.seller_market_index:
        notes.append(
            "Ask for stronger negotiation evidence: price history, competition and "
            "condition checks."
        )
    else:
        notes.append(
            "Seller pressure is stronger; validate whether the object still has defects "
            "or stale pricing."
        )
    return notes


def _investor_notes(
    area: AreaComparisonItem,
    area_stats: AreaStatistics,
    investments: list[PlannedInvestment],
) -> list[str]:
    notes = [
        f"Growth index {area.growth_index}/100 should be paired with rent and liquidity checks.",
        f"90-day price change is {area_stats.price_change_90d_pct:+.1f}%.",
    ]
    if investments:
        notes.append(
            "Verify delivery timing and disruption for planned investments before "
            "underwriting growth."
        )
    else:
        notes.append(
            "No direct planned-investment records matched this area; avoid growth assumptions."
        )
    return notes


def _summary(
    area: AreaComparisonItem,
    posture: str,
    positive_signals: list[str],
    risk_signals: list[str],
) -> str:
    posture_text = posture.replace("_", " ")
    return (
        f"{area.name} is a {posture_text} area in current Domarion metrics. "
        f"{positive_signals[0]} Main caveat: {risk_signals[0]}"
    )


def _citations(
    area: AreaStatistics,
    comparison: AreaComparisonItem,
    dashboard: MarketDashboard,
    investments: list[PlannedInvestment],
) -> list[AIAnswerCitation]:
    citations = [
        AIAnswerCitation(
            source_id=f"area:{area.area_id}:statistics",
            source_type="area_statistics",
            title=f"{area.name} market statistics",
            excerpt=(
                f"Median {area.median_price_per_m2} PLN/m2, DOM "
                f"{area.average_days_on_market}, price 90d "
                f"{area.price_change_90d_pct:+.1f}%, supply 90d "
                f"{area.supply_change_90d_pct:+.1f}%."
            ),
        ),
        AIAnswerCitation(
            source_id=f"area:{area.area_id}:comparison",
            source_type="area_comparison",
            title=f"{area.name} comparison metrics",
            excerpt=(
                f"Value {comparison.value_index}/100, growth "
                f"{comparison.growth_index}/100, market label "
                f"{comparison.market_label}."
            ),
        ),
        AIAnswerCitation(
            source_id=f"area:{area.area_id}:dashboard",
            source_type="market_dashboard",
            title=f"{area.name} dashboard baseline",
            excerpt=(
                f"Listings {dashboard.listings_count}, active supply "
                f"{dashboard.active_listings}, median price "
                f"{dashboard.median_price_per_m2 or 'n/a'} PLN/m2."
            ),
        ),
    ]
    if investments:
        citations.append(
            AIAnswerCitation(
                source_id=f"area:{area.area_id}:planned-investments",
                source_type="planned_investments",
                title=f"{area.name} planned investment signals",
                excerpt=", ".join(
                    f"{item.name} ({item.status}, confidence {item.confidence_score}/100)"
                    for item in investments[:3]
                ),
            )
        )
    return citations


def _input_hash(
    area: AreaStatistics,
    comparison: AreaComparisonItem,
    dashboard: MarketDashboard,
    investments: list[PlannedInvestment],
) -> str:
    payload = {
        "area": area.model_dump(mode="json"),
        "comparison": comparison.model_dump(mode="json"),
        "dashboard": dashboard.model_dump(mode="json"),
        "investments": [item.model_dump(mode="json") for item in investments],
    }
    serialized = json.dumps(payload, sort_keys=True, ensure_ascii=False, default=str)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
