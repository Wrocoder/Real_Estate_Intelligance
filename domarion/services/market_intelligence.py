from datetime import UTC, datetime
from statistics import mean

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    AreaComparisonItem,
    MarketDashboard,
    MarketIntelligenceAudience,
    MarketIntelligenceFinding,
    MarketIntelligenceKpi,
    MarketIntelligenceReport,
)
from domarion.services.area_comparison import build_area_comparison
from domarion.services.market_dashboard import build_market_dashboard

MARKET_INTELLIGENCE_DISCLAIMER = (
    "This market intelligence report is an analytical screening product based on current "
    "normalized listings, area statistics and Domarion scoring context. It is not financial, "
    "legal, valuation or investment advice and does not guarantee demand, price, liquidity or "
    "future performance."
)


def build_market_intelligence_report(
    repository: RealEstateRepository,
    *,
    audience: MarketIntelligenceAudience,
    city: str | None = "Wrocław",
    district: str | None = None,
    area_limit: int = 5,
) -> MarketIntelligenceReport:
    dashboard = build_market_dashboard(repository, city=city, district=district)
    comparison_sort = _comparison_sort(audience)
    comparison = build_area_comparison(
        repository,
        city=city,
        sort=comparison_sort,
        limit=max(area_limit, 1),
    )
    area_watchlist = _area_watchlist(
        comparison.areas,
        district=dashboard.district,
        limit=area_limit,
    )
    kpis = _kpis(dashboard)
    findings = _findings(dashboard, area_watchlist)

    return MarketIntelligenceReport(
        audience=audience,
        city=city,
        district=district,
        generated_at=datetime.now(UTC),
        market_scope=_market_scope(city, district),
        executive_summary=_executive_summary(audience, dashboard, area_watchlist),
        data_confidence=_data_confidence(dashboard),
        kpis=kpis,
        findings=findings,
        opportunities=_opportunities(audience, dashboard, area_watchlist),
        risks=_risks(audience, dashboard, area_watchlist),
        recommended_actions=_recommended_actions(audience),
        area_watchlist=area_watchlist,
        dashboard=dashboard,
        area_comparison=comparison,
        source_notes=[
            "Dashboard metrics come from normalized active listings and area statistics.",
            (
                "Area watchlist uses Domarion value, growth, buyer/seller pressure "
                "and liquidity indexes."
            ),
            (
                "Source URLs, contacts, photos, raw HTML and private user-submitted "
                "references are not used in this report output."
            ),
        ],
        disclaimer=MARKET_INTELLIGENCE_DISCLAIMER,
    )


def _comparison_sort(audience: MarketIntelligenceAudience) -> str:
    if audience == "bank":
        return "liquidity"
    if audience == "developer":
        return "seller_market"
    return "growth"


def _area_watchlist(
    areas: list[AreaComparisonItem],
    *,
    district: str | None,
    limit: int,
) -> list[AreaComparisonItem]:
    if district:
        district_areas = [area for area in areas if area.name.casefold() == district.casefold()]
        if district_areas:
            return district_areas[:limit]
    return areas[:limit]


def _kpis(dashboard: MarketDashboard) -> list[MarketIntelligenceKpi]:
    return [
        MarketIntelligenceKpi(
            code="listings_count",
            label="Listings observed",
            value=dashboard.listings_count,
            unit="listings",
            interpretation=_listing_depth_note(dashboard.listings_count),
        ),
        MarketIntelligenceKpi(
            code="median_price_per_m2",
            label="Median price per m2",
            value=dashboard.median_price_per_m2,
            unit="PLN/m2",
            interpretation="Primary pricing baseline for market and collateral comparison.",
        ),
        MarketIntelligenceKpi(
            code="average_days_on_market",
            label="Average days on market",
            value=dashboard.average_days_on_market,
            unit="days",
            interpretation=_days_on_market_note(dashboard.average_days_on_market),
        ),
        MarketIntelligenceKpi(
            code="price_change_90d_pct",
            label="90-day price momentum",
            value=dashboard.price_change_90d_pct,
            unit="pct",
            interpretation=_momentum_note(dashboard.price_change_90d_pct),
        ),
        MarketIntelligenceKpi(
            code="supply_change_90d_pct",
            label="90-day supply change",
            value=dashboard.supply_change_90d_pct,
            unit="pct",
            interpretation=_supply_note(dashboard.supply_change_90d_pct),
        ),
        MarketIntelligenceKpi(
            code="liquidity_index",
            label="Average liquidity index",
            value=_average_index(dashboard, "liquidity_index"),
            unit="score",
            interpretation=(
                "Higher liquidity means stronger observable depth and faster potential exit."
            ),
        ),
        MarketIntelligenceKpi(
            code="overheated_index",
            label="Average overheated index",
            value=_average_index(dashboard, "overheated_index"),
            unit="score",
            interpretation=(
                "Higher overheating means price and supply pressure need tighter review."
            ),
        ),
    ]


def _findings(
    dashboard: MarketDashboard,
    area_watchlist: list[AreaComparisonItem],
) -> list[MarketIntelligenceFinding]:
    liquidity = _average_index(dashboard, "liquidity_index") or 0
    overheated = _average_index(dashboard, "overheated_index") or 0
    price_momentum = dashboard.price_change_90d_pct or 0
    supply_change = dashboard.supply_change_90d_pct or 0

    findings = [
        MarketIntelligenceFinding(
            title="Market depth",
            severity="positive" if dashboard.listings_count >= 20 else "watch",
            metric_code="listings_count",
            detail=_listing_depth_note(dashboard.listings_count),
        ),
        MarketIntelligenceFinding(
            title="Liquidity posture",
            severity="positive" if liquidity >= 60 else "watch",
            metric_code="liquidity_index",
            detail=f"Average area liquidity index is {liquidity or 'n/a'}/100.",
        ),
        MarketIntelligenceFinding(
            title="Overheating pressure",
            severity="risk" if overheated >= 65 else "neutral",
            metric_code="overheated_index",
            detail=f"Average overheated index is {overheated or 'n/a'}/100.",
        ),
        MarketIntelligenceFinding(
            title="Price momentum",
            severity="positive" if price_momentum > 0 else "watch",
            metric_code="price_change_90d_pct",
            detail=_momentum_note(dashboard.price_change_90d_pct),
        ),
        MarketIntelligenceFinding(
            title="Supply pressure",
            severity="risk" if supply_change > 15 else "neutral",
            metric_code="supply_change_90d_pct",
            detail=_supply_note(dashboard.supply_change_90d_pct),
        ),
    ]
    if area_watchlist:
        findings.append(
            MarketIntelligenceFinding(
                title="Top area signal",
                severity="positive",
                metric_code="area_watchlist",
                detail=area_watchlist[0].summary,
            )
        )
    return findings


def _opportunities(
    audience: MarketIntelligenceAudience,
    dashboard: MarketDashboard,
    area_watchlist: list[AreaComparisonItem],
) -> list[str]:
    lead_area = area_watchlist[0] if area_watchlist else None
    if audience == "bank":
        return [
            "Use liquidity and days-on-market metrics to segment collateral review depth.",
            (
                "Prioritize manual underwriting for areas with elevated overheating "
                "or weak market depth."
            ),
            _lead_area_opportunity(lead_area, "stronger collateral monitoring"),
        ]
    if audience == "developer":
        return [
            "Use seller-market and supply-change signals to shortlist launch/pricing test areas.",
            "Compare active inventory by room and area distributions before product mix decisions.",
            _lead_area_opportunity(lead_area, "a potential project feasibility screen"),
        ]
    return [
        (
            "Use value/growth area rankings to shortlist acquisition markets before "
            "object-level diligence."
        ),
        "Filter for liquidity and price-to-fair-value gaps before committing analyst time.",
        _lead_area_opportunity(lead_area, "fund pipeline prioritization"),
    ]


def _risks(
    audience: MarketIntelligenceAudience,
    dashboard: MarketDashboard,
    area_watchlist: list[AreaComparisonItem],
) -> list[str]:
    risks = [
        (
            "Small sample areas should be treated as low-confidence and checked against "
            "partner/open-data feeds."
        ),
        (
            "Dashboard metrics are current analytical signals, not certified valuations "
            "or demand forecasts."
        ),
    ]
    overheated = _average_index(dashboard, "overheated_index") or 0
    if overheated >= 60:
        risks.append("Elevated overheating index may hide affordability and exit-liquidity risk.")
    if dashboard.supply_change_90d_pct and dashboard.supply_change_90d_pct > 15:
        risks.append("Rising supply may weaken pricing power if absorption does not keep pace.")
    if audience == "bank":
        risks.append("Collateral policy should not rely only on median price per m2.")
    elif audience == "developer":
        risks.append(
            "Project feasibility still needs land, zoning, MPZP/Studium and pipeline checks."
        )
    else:
        risks.append(
            "Fund underwriting still needs object-level capex, rent, legal and exit assumptions."
        )
    if not area_watchlist:
        risks.append("No area watchlist is available for this market scope.")
    return risks


def _recommended_actions(audience: MarketIntelligenceAudience) -> list[str]:
    if audience == "bank":
        return [
            "Create policy thresholds for liquidity, overheating and days-on-market by area.",
            "Run collateral stress review for areas with weak market depth or high price momentum.",
            "Refresh the report before credit committee decisions.",
        ]
    if audience == "developer":
        return [
            "Compare area watchlist with land availability, zoning and competing projects.",
            "Validate product mix against rooms and area distributions.",
            "Use partner/open-data checks before committing acquisition spend.",
        ]
    return [
        "Move top areas into object-level sourcing and fair-price screening.",
        "Compare liquidity and growth scores with rent/yield assumptions.",
        "Use dataset export/API-lite for repeatable pipeline monitoring.",
    ]


def _executive_summary(
    audience: MarketIntelligenceAudience,
    dashboard: MarketDashboard,
    area_watchlist: list[AreaComparisonItem],
) -> str:
    scope = _market_scope(dashboard.city, dashboard.district)
    lead = area_watchlist[0].name if area_watchlist else "no ranked area"
    base = (
        f"{scope} has {dashboard.listings_count} observed listings, "
        f"median {dashboard.median_price_per_m2 or 'n/a'} PLN/m2, "
        f"{dashboard.average_days_on_market} average days on market and "
        f"{_price_momentum_value(dashboard)}% "
        "90-day price momentum."
    )
    if audience == "bank":
        return (
            f"Bank view: {base} Lead liquidity area: {lead}. "
            "Focus on collateral depth and overheating risk."
        )
    if audience == "developer":
        return (
            f"Developer view: {base} Lead demand-pressure area: {lead}. "
            "Focus on supply gaps and launch timing."
        )
    return (
        f"Fund view: {base} Lead growth area: {lead}. "
        "Focus on acquisition pipeline and exit liquidity."
    )


def _market_scope(city: str | None, district: str | None) -> str:
    if city and district:
        return f"{district}, {city}"
    if city:
        return city
    if district:
        return district
    return "All covered markets"


def _price_momentum_value(dashboard: MarketDashboard) -> float | str:
    return dashboard.price_change_90d_pct if dashboard.price_change_90d_pct is not None else "n/a"


def _data_confidence(dashboard: MarketDashboard) -> str:
    if dashboard.listings_count >= 50 and len(dashboard.areas) >= 5:
        return "high"
    if dashboard.listings_count >= 10 and len(dashboard.areas) >= 2:
        return "medium"
    return "limited"


def _average_index(dashboard: MarketDashboard, attr: str) -> int | None:
    if not dashboard.areas:
        return None
    return round(mean(getattr(area, attr) for area in dashboard.areas))


def _listing_depth_note(listings_count: int) -> str:
    if listings_count >= 50:
        return "Strong observable market depth for repeated monitoring."
    if listings_count >= 10:
        return "Usable market depth, but outliers still need review."
    return "Limited sample; treat outputs as directional until more data is available."


def _days_on_market_note(days: int) -> str:
    if days <= 45:
        return "Fast exposure suggests stronger demand or tighter inventory."
    if days <= 90:
        return "Moderate exposure suggests a balanced market."
    return "Longer exposure suggests stronger buyer leverage or weaker liquidity."


def _momentum_note(value: float | None) -> str:
    if value is None:
        return "No price momentum baseline is available."
    if value > 5:
        return f"Price momentum is elevated at {value}% over 90 days."
    if value > 0:
        return f"Price momentum is positive at {value}% over 90 days."
    if value < 0:
        return f"Price momentum is negative at {value}% over 90 days."
    return "Price momentum is flat over 90 days."


def _supply_note(value: float | None) -> str:
    if value is None:
        return "No supply change baseline is available."
    if value > 15:
        return f"Supply is expanding quickly at {value}% over 90 days."
    if value > 0:
        return f"Supply is expanding at {value}% over 90 days."
    if value < -10:
        return f"Supply is tightening at {value}% over 90 days."
    return f"Supply change is stable at {value}% over 90 days."


def _lead_area_opportunity(area: AreaComparisonItem | None, context: str) -> str:
    if area is None:
        return f"No lead area is available for {context}; broaden the market scope."
    return f"{area.name} is the lead watchlist area for {context}: {area.summary}"
