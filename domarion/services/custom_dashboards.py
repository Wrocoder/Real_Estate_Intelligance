from datetime import UTC, datetime
from statistics import mean

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    AreaComparison,
    CustomDashboardAudience,
    CustomDashboardConfig,
    CustomDashboardPreview,
    CustomDashboardWidgetCode,
    CustomDashboardWidgetSnapshot,
    MarketDashboard,
    MarketIntelligenceAudience,
    MarketIntelligenceReport,
)
from domarion.services.area_comparison import build_area_comparison
from domarion.services.market_dashboard import build_market_dashboard
from domarion.services.market_intelligence import build_market_intelligence_report
from domarion.services.scoring import build_listing_analysis

CUSTOM_DASHBOARD_DISCLAIMER = (
    "Custom dashboard preview is an enterprise screening view based on current normalized "
    "listings, area statistics, Domarion scores and open-data layers. It is not financial, "
    "legal, valuation, underwriting or investment advice and does not guarantee demand, "
    "price, liquidity or future performance."
)


def build_custom_dashboard_preview(
    repository: RealEstateRepository,
    config: CustomDashboardConfig,
) -> CustomDashboardPreview:
    dashboard = build_market_dashboard(
        repository,
        city=config.city,
        district=config.district,
    )
    comparison = build_area_comparison(
        repository,
        city=config.city,
        sort=_comparison_sort(config.audience),
        limit=5,
    )
    intelligence = build_market_intelligence_report(
        repository,
        audience=_market_intelligence_audience(config.audience),
        city=config.city,
        district=config.district,
        area_limit=5,
    )

    return CustomDashboardPreview(
        config=config,
        generated_at=datetime.now(UTC),
        dashboard=dashboard,
        area_comparison=comparison,
        market_intelligence=intelligence,
        widgets=[
            _widget_snapshot(
                repository,
                code,
                dashboard=dashboard,
                comparison=comparison,
                intelligence=intelligence,
            )
            for code in config.widget_codes
        ],
        source_notes=[
            "Preview uses saved dashboard configuration and live in-memory market analytics.",
            "Source URLs, contacts, photos, full descriptions and raw HTML are not exposed.",
            "Widgets marked planned/needs_data are contractual backlog slots for enterprise setup.",
        ],
        disclaimer=CUSTOM_DASHBOARD_DISCLAIMER,
    )


def _widget_snapshot(
    repository: RealEstateRepository,
    code: CustomDashboardWidgetCode,
    *,
    dashboard: MarketDashboard,
    comparison: AreaComparison,
    intelligence: MarketIntelligenceReport,
) -> CustomDashboardWidgetSnapshot:
    if code == "market_kpis":
        return _market_kpis_widget(dashboard)
    if code == "area_watchlist":
        return _area_watchlist_widget(comparison)
    if code == "listing_pipeline":
        return _listing_pipeline_widget(repository, dashboard)
    if code == "risk_flags":
        return _risk_flags_widget(intelligence)
    if code == "developer_ranking":
        return _developer_ranking_widget(repository, dashboard)
    if code == "scoring_distribution":
        return _scoring_distribution_widget(repository, dashboard)
    if code == "lead_funnel":
        return _planned_widget(
            code,
            "Lead funnel",
            "Lead scoring and funnel stages need CRM or partner referral mapping.",
        )
    if code == "api_usage":
        return _planned_widget(
            code,
            "API usage",
            "API usage can be wired from API-lite key logs per enterprise account.",
        )
    if code == "saved_reports":
        return _planned_widget(
            code,
            "Saved reports",
            "Saved report activity needs owner-scoped report-store aggregation.",
        )
    return CustomDashboardWidgetSnapshot(
        widget_code=code,
        title="Custom notes",
        status="planned",
        summary="Custom enterprise notes are reserved for account-specific onboarding.",
        metrics={},
        actions=["Collect target KPI definitions during enterprise onboarding."],
    )


def _market_kpis_widget(dashboard: MarketDashboard) -> CustomDashboardWidgetSnapshot:
    return CustomDashboardWidgetSnapshot(
        widget_code="market_kpis",
        title="Market KPIs",
        status="ready",
        summary=(
            f"{_scope(dashboard)} has {dashboard.listings_count} observed listings, "
            f"median {dashboard.median_price_per_m2 or 'n/a'} PLN/m2 and "
            f"{dashboard.average_days_on_market} average days on market."
        ),
        metrics={
            "listings_count": dashboard.listings_count,
            "active_listings": dashboard.active_listings,
            "median_price_per_m2": dashboard.median_price_per_m2,
            "average_days_on_market": dashboard.average_days_on_market,
            "price_change_90d_pct": dashboard.price_change_90d_pct,
            "supply_change_90d_pct": dashboard.supply_change_90d_pct,
        },
        actions=["Use these KPIs as top-of-dashboard market monitoring thresholds."],
    )


def _area_watchlist_widget(comparison: AreaComparison) -> CustomDashboardWidgetSnapshot:
    lead = comparison.areas[0] if comparison.areas else None
    return CustomDashboardWidgetSnapshot(
        widget_code="area_watchlist",
        title="Area watchlist",
        status="ready" if lead is not None else "needs_data",
        summary=(
            f"Lead area is {lead.name}: {lead.summary}"
            if lead is not None
            else "No ranked area is available for this scope."
        ),
        metrics={
            "area_count": comparison.area_count,
            "top_value_area_id": comparison.top_value_area_id,
            "top_growth_area_id": comparison.top_growth_area_id,
            "top_liquidity_area_id": comparison.top_liquidity_area_id,
        },
        actions=["Review top areas before acquisition, sales or collateral decisions."],
    )


def _listing_pipeline_widget(
    repository: RealEstateRepository,
    dashboard: MarketDashboard,
) -> CustomDashboardWidgetSnapshot:
    listings = repository.list_listings(city=dashboard.city, district=dashboard.district)
    if not listings:
        return CustomDashboardWidgetSnapshot(
            widget_code="listing_pipeline",
            title="Listing pipeline",
            status="needs_data",
            summary="No listings are available for this dashboard scope.",
            metrics={"listings": 0},
            actions=["Broaden city/district filters or ingest partner listings."],
        )
    prices = [listing.price for listing in listings]
    return CustomDashboardWidgetSnapshot(
        widget_code="listing_pipeline",
        title="Listing pipeline",
        status="ready",
        summary=f"{len(listings)} listings available for pipeline screening.",
        metrics={
            "listings": len(listings),
            "median_price": sorted(prices)[len(prices) // 2],
            "average_price": round(mean(prices)),
            "primary_market": sum(1 for item in listings if item.market_type == "primary"),
            "secondary_market": sum(1 for item in listings if item.market_type == "secondary"),
        },
        actions=["Route high-value candidates into scoring or report generation."],
    )


def _risk_flags_widget(intelligence: MarketIntelligenceReport) -> CustomDashboardWidgetSnapshot:
    risk_findings = [
        finding
        for finding in intelligence.findings
        if finding.severity in {"risk", "watch"}
    ]
    return CustomDashboardWidgetSnapshot(
        widget_code="risk_flags",
        title="Risk flags",
        status="ready",
        summary=(
            f"{len(risk_findings)} market findings require attention."
            if risk_findings
            else "No elevated market finding is visible in current dashboard data."
        ),
        metrics={
            "risk_findings": sum(1 for item in risk_findings if item.severity == "risk"),
            "watch_findings": sum(1 for item in risk_findings if item.severity == "watch"),
            "risks_count": len(intelligence.risks),
        },
        actions=[
            "Send risk/watch findings to manual review before enterprise decision meetings.",
        ],
    )


def _developer_ranking_widget(
    repository: RealEstateRepository,
    dashboard: MarketDashboard,
) -> CustomDashboardWidgetSnapshot:
    reputations = repository.list_developer_reputations(city=dashboard.city)
    if not reputations:
        return CustomDashboardWidgetSnapshot(
            widget_code="developer_ranking",
            title="Developer ranking",
            status="needs_data",
            summary="No developer reputation records are available for this scope.",
            metrics={"developers": 0},
            actions=["Ingest developer registry/project evidence for this market."],
        )
    top = max(reputations, key=lambda item: item.reputation_score)
    risk_reviews = sum(1 for item in reputations if item.risk_signals)
    return CustomDashboardWidgetSnapshot(
        widget_code="developer_ranking",
        title="Developer ranking",
        status="ready",
        summary=(
            f"Top developer is {top.developer.name} with reputation "
            f"{top.reputation_score}/100."
        ),
        metrics={
            "developers": len(reputations),
            "top_developer_id": top.developer.id,
            "top_reputation_score": top.reputation_score,
            "risk_review_developers": risk_reviews,
        },
        actions=["Use weak-confidence or risk-signal developers as diligence triggers."],
    )


def _scoring_distribution_widget(
    repository: RealEstateRepository,
    dashboard: MarketDashboard,
) -> CustomDashboardWidgetSnapshot:
    listings = repository.list_listings(city=dashboard.city, district=dashboard.district)[:100]
    if not listings:
        return CustomDashboardWidgetSnapshot(
            widget_code="scoring_distribution",
            title="Scoring distribution",
            status="needs_data",
            summary="No listings are available for scoring distribution.",
            metrics={"listings": 0},
            actions=["Ingest listings before enabling score distribution monitoring."],
        )

    scores = [build_listing_analysis(repository, listing).scores for listing in listings]
    return CustomDashboardWidgetSnapshot(
        widget_code="scoring_distribution",
        title="Scoring distribution",
        status="ready",
        summary=f"{len(scores)} listings scored for distribution monitoring.",
        metrics={
            "listings": len(scores),
            "average_investment_score": round(mean(score.investment_score for score in scores)),
            "average_risk_score": round(mean(score.risk_score for score in scores)),
            "strong_candidates": sum(
                1 for score in scores if score.decision_label == "strong_candidate"
            ),
            "overpriced_or_risky": sum(
                1 for score in scores if score.decision_label in {"overpriced", "risky"}
            ),
        },
        actions=["Watch distribution drift before changing acquisition or underwriting rules."],
    )


def _planned_widget(
    code: CustomDashboardWidgetCode,
    title: str,
    summary: str,
) -> CustomDashboardWidgetSnapshot:
    return CustomDashboardWidgetSnapshot(
        widget_code=code,
        title=title,
        status="planned",
        summary=summary,
        metrics={},
        actions=["Define data source, owner and refresh cadence during enterprise onboarding."],
    )


def _comparison_sort(audience: CustomDashboardAudience) -> str:
    if audience == "underwriting":
        return "liquidity"
    if audience in {"acquisition", "portfolio"}:
        return "growth"
    if audience == "sales":
        return "seller_market"
    return "value"


def _market_intelligence_audience(
    audience: CustomDashboardAudience,
) -> MarketIntelligenceAudience:
    if audience == "underwriting":
        return "bank"
    if audience == "sales":
        return "developer"
    return "fund"


def _scope(dashboard: MarketDashboard) -> str:
    if dashboard.city and dashboard.district:
        return f"{dashboard.district}, {dashboard.city}"
    if dashboard.city:
        return dashboard.city
    if dashboard.district:
        return dashboard.district
    return "Covered markets"
