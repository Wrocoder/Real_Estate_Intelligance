from __future__ import annotations

from domarion.schemas import (
    AreaStatistics,
    DeveloperReputation,
    Listing,
    ListingFutureImpact,
    ListingRiskFactor,
    ListingRiskProfile,
    PropertyScores,
)

RISK_PROFILE_METHODOLOGY_NOTE = (
    "Risk profile explains known MVP risk factors from listing, area, developer and "
    "planned-investment data. Missing public layers are flagged separately and must be "
    "checked before a real transaction."
)
MISSING_RISK_LAYERS = [
    "flood risk",
    "official noise map",
    "air pollution",
    "rail/airport corridors",
]


def build_listing_risk_profile(
    *,
    listing: Listing,
    area_statistics: AreaStatistics,
    scores: PropertyScores,
    developer_reputation: DeveloperReputation | None = None,
    future_area_impact: ListingFutureImpact | None = None,
) -> ListingRiskProfile:
    factors = [
        _price_factor(listing, area_statistics, scores),
        _market_liquidity_factor(listing, area_statistics, scores),
        _transport_factor(listing),
        _road_noise_factor(listing),
        _industrial_factor(listing),
        _building_factor(listing),
        _rental_factor(scores),
        _data_quality_factor(listing),
    ]
    if developer_reputation is not None:
        factors.append(_developer_factor(developer_reputation))
    if future_area_impact is not None:
        factors.append(_future_area_factor(future_area_impact))

    factors = sorted(
        factors,
        key=lambda factor: (
            _severity_rank(factor.severity),
            -factor.score,
            factor.category,
        ),
    )
    priority_checks = _priority_checks(factors)

    return ListingRiskProfile(
        listing_id=listing.id,
        risk_score=scores.risk_score,
        risk_label=scores.risk_label,
        overall_severity=_severity_from_score(scores.risk_score),
        factors=factors,
        priority_checks=priority_checks,
        missing_risk_layers=MISSING_RISK_LAYERS,
        methodology_note=RISK_PROFILE_METHODOLOGY_NOTE,
    )


def _price_factor(
    listing: Listing,
    area_statistics: AreaStatistics,
    scores: PropertyScores,
) -> ListingRiskFactor:
    delta = scores.price_delta_to_fair_mid_pct
    if delta >= 12:
        severity = "high"
        summary = "Asking price is materially above model fair mid."
    elif delta >= 5:
        severity = "medium"
        summary = "Asking price is above model fair mid."
    elif delta <= -6:
        severity = "low"
        summary = "Price is below fair mid; verify why the market offers a discount."
    else:
        severity = "low"
        summary = "Price is close to model fair range."
    return ListingRiskFactor(
        code="price_position",
        category="pricing",
        severity=severity,
        score=_score_from_severity(severity),
        summary=summary,
        evidence=[
            f"Price per m2: {listing.price_per_m2} PLN.",
            f"Area median: {area_statistics.median_price_per_m2} PLN/m2.",
            f"Delta to fair mid: {delta:+.1f}%.",
        ],
        recommended_checks=[
            "Compare final negotiated price against fair range and closest comparables.",
        ],
    )


def _market_liquidity_factor(
    listing: Listing,
    area_statistics: AreaStatistics,
    scores: PropertyScores,
) -> ListingRiskFactor:
    evidence = [
        f"Days on market: {listing.days_on_market}.",
        f"Area average days on market: {area_statistics.average_days_on_market}.",
        f"Supply change 90d: {area_statistics.supply_change_90d_pct:+.1f}%.",
        f"Liquidity Score: {scores.liquidity_score}/100.",
    ]
    if area_statistics.supply_change_90d_pct > 15:
        severity = "high"
        summary = "Supply is growing quickly; check oversupply and resale pressure."
    elif listing.days_on_market > area_statistics.average_days_on_market * 1.5:
        severity = "medium"
        summary = "Listing exposure is materially longer than area average."
    elif scores.liquidity_score < 45:
        severity = "medium"
        summary = "Liquidity score is weak relative to the platform model."
    else:
        severity = "low"
        summary = "No major liquidity warning in current market data."
    return ListingRiskFactor(
        code="market_liquidity",
        category="market",
        severity=severity,
        score=_score_from_severity(severity),
        summary=summary,
        evidence=evidence,
        recommended_checks=[
            "Check current comparable listings and whether similar offers are staying unsold.",
        ],
    )


def _transport_factor(listing: Listing) -> ListingRiskFactor:
    if listing.nearest_stop_m > 1000:
        severity = "high"
        summary = "Public transport access appears weak."
    elif listing.nearest_stop_m > 700:
        severity = "medium"
        summary = "Public transport access needs on-site validation."
    else:
        severity = "low"
        summary = "Public transport proximity is acceptable in current data."
    return ListingRiskFactor(
        code="weak_transport",
        category="location",
        severity=severity,
        score=_score_from_severity(severity),
        summary=summary,
        evidence=[f"Nearest stop: {listing.nearest_stop_m} m."],
        recommended_checks=[
            "Check real walking route, service frequency and evening/weekend schedules.",
        ],
    )


def _road_noise_factor(listing: Listing) -> ListingRiskFactor:
    if listing.nearest_major_road_m < 120:
        severity = "high"
        summary = "Major road is very close; noise and air quality require inspection."
    elif listing.nearest_major_road_m < 250:
        severity = "medium"
        summary = "Major road proximity can affect comfort and resale."
    else:
        severity = "low"
        summary = "Major road distance is not a major warning in current data."
    return ListingRiskFactor(
        code="major_road_noise",
        category="environment",
        severity=severity,
        score=_score_from_severity(severity),
        summary=summary,
        evidence=[f"Nearest major road: {listing.nearest_major_road_m} m."],
        recommended_checks=[
            "Visit during rush hour and check official noise maps when available.",
        ],
    )


def _industrial_factor(listing: Listing) -> ListingRiskFactor:
    if listing.nearest_industrial_zone_m < 700:
        severity = "high"
        summary = "Industrial zone is close; check noise, traffic and emissions."
    elif listing.nearest_industrial_zone_m < 1500:
        severity = "medium"
        summary = "Industrial zone is within a range worth checking."
    else:
        severity = "low"
        summary = "Industrial-zone distance is not a major warning in current data."
    return ListingRiskFactor(
        code="industrial_zone",
        category="environment",
        severity=severity,
        score=_score_from_severity(severity),
        summary=summary,
        evidence=[f"Nearest industrial zone: {listing.nearest_industrial_zone_m} m."],
        recommended_checks=[
            "Check land-use plan, site activity, truck routes and smell/noise during visit.",
        ],
    )


def _building_factor(listing: Listing) -> ListingRiskFactor:
    if listing.building_year is None:
        severity = "medium"
        summary = "Building year is missing; technical age risk is unknown."
        evidence = ["Building year: unknown."]
    elif listing.building_year < 1980:
        severity = "medium"
        summary = "Older building; technical systems and renovation fund need review."
        evidence = [f"Building year: {listing.building_year}."]
    else:
        severity = "low"
        summary = "Building age is not a major warning in current data."
        evidence = [f"Building year: {listing.building_year}."]
    return ListingRiskFactor(
        code="building_age",
        category="technical",
        severity=severity,
        score=_score_from_severity(severity),
        summary=summary,
        evidence=evidence,
        recommended_checks=[
            "Check electrical, plumbing, ventilation, moisture, roof/facade and renovation fund.",
        ],
    )


def _rental_factor(scores: PropertyScores) -> ListingRiskFactor:
    if scores.rental_potential_score < 40:
        severity = "high"
        summary = "Rental potential is weak; do not rely on rental exit."
    elif scores.rental_potential_score < 55:
        severity = "medium"
        summary = "Rental scenario is average or below; verify real rent comparables."
    else:
        severity = "low"
        summary = "Rental potential does not show a major warning."
    return ListingRiskFactor(
        code="weak_rental_yield",
        category="investment",
        severity=severity,
        score=_score_from_severity(severity),
        summary=summary,
        evidence=[f"Rental Potential Score: {scores.rental_potential_score}/100."],
        recommended_checks=[
            "Check real rent listings, vacancy, furnishing costs, taxes and HOA fees.",
        ],
    )


def _data_quality_factor(listing: Listing) -> ListingRiskFactor:
    if listing.data_quality_score < 55:
        severity = "high"
        summary = "Data quality is weak; analysis confidence is limited."
    elif listing.data_quality_score < 70:
        severity = "medium"
        summary = "Data quality is below desired level; confirm listing parameters."
    else:
        severity = "low"
        summary = "Data quality is acceptable for initial screening."
    return ListingRiskFactor(
        code="data_quality",
        category="data",
        severity=severity,
        score=_score_from_severity(severity),
        summary=summary,
        evidence=[f"Data Quality Score: {listing.data_quality_score}/100."],
        recommended_checks=[
            "Verify price, area, floor, building year, coordinates and source freshness.",
        ],
    )


def _developer_factor(reputation: DeveloperReputation) -> ListingRiskFactor:
    if reputation.risk_signals or reputation.label == "risk_review":
        severity = "high"
        summary = "Developer profile contains risk signals."
    elif reputation.confidence_score < 65 or reputation.label == "limited_data":
        severity = "medium"
        summary = "Developer profile has limited confidence."
    else:
        severity = "low"
        summary = "Developer reputation does not show a major warning."
    return ListingRiskFactor(
        code="developer_reputation",
        category="developer",
        severity=severity,
        score=_score_from_severity(severity),
        summary=summary,
        evidence=[
            f"Developer: {reputation.developer.name}.",
            f"Reputation score: {reputation.reputation_score}/100.",
            f"Confidence score: {reputation.confidence_score}/100.",
            *reputation.risk_signals[:2],
        ],
        recommended_checks=reputation.due_diligence_questions[:3],
    )


def _future_area_factor(future_area_impact: ListingFutureImpact) -> ListingRiskFactor:
    if future_area_impact.risk_signals:
        severity = "medium"
        summary = "Future-area projects require timing/disruption checks."
    elif future_area_impact.impact_score < 20:
        severity = "medium"
        summary = "No strong future-area catalyst is visible in current data."
    else:
        severity = "low"
        summary = "Future-area signal does not show a major risk warning."
    return ListingRiskFactor(
        code="future_area_uncertainty",
        category="future_area",
        severity=severity,
        score=_score_from_severity(severity),
        summary=summary,
        evidence=[
            f"Future impact score: {future_area_impact.impact_score}/100.",
            future_area_impact.summary,
            *future_area_impact.risk_signals[:2],
        ],
        recommended_checks=[
            "Verify planned-investment source, exact geometry, timeline and "
            "construction disruption.",
        ],
    )


def _priority_checks(factors: list[ListingRiskFactor]) -> list[str]:
    checks: list[str] = []
    for factor in factors:
        if factor.severity not in {"high", "medium"}:
            continue
        checks.extend(factor.recommended_checks[:2])
    if not checks:
        for factor in factors[:4]:
            checks.extend(factor.recommended_checks[:1])
    return _deduplicate(checks)[:8]


def _severity_from_score(score: int) -> str:
    if score >= 70:
        return "high"
    if score >= 50:
        return "medium"
    if score >= 30:
        return "low"
    return "minimal"


def _score_from_severity(severity: str) -> int:
    return {
        "high": 85,
        "medium": 60,
        "low": 30,
        "minimal": 15,
    }.get(severity, 45)


def _severity_rank(severity: str) -> int:
    return {
        "high": 0,
        "medium": 1,
        "low": 2,
        "minimal": 3,
    }.get(severity, 4)


def _deduplicate(items: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result
