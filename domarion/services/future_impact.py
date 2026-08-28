from __future__ import annotations

from math import asin, cos, radians, sin, sqrt

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    FutureImpactNarrativeCategory,
    FutureImpactNarrativeItem,
    FutureImpactRadiusBucket,
    Listing,
    ListingFutureImpact,
    PlannedInvestment,
    PlannedInvestmentImpactItem,
)

FUTURE_IMPACT_RADII_M = (500, 1000, 2000, 5000, 10000)
METHODOLOGY_NOTE = (
    "Future-area impact is a proximity and confidence heuristic based on known planned "
    "investments. It is not a price forecast or guarantee that a project will be delivered."
)


def build_listing_future_impact(
    repository: RealEstateRepository,
    listing: Listing,
    *,
    radii_m: tuple[int, ...] = FUTURE_IMPACT_RADII_M,
) -> ListingFutureImpact:
    max_radius_m = max(radii_m)
    investments = repository.list_planned_investments(
        lat=listing.lat,
        lon=listing.lon,
        radius_km=max_radius_m / 1000,
    )
    impact_items = sorted(
        (
            _impact_item(listing, investment, radii_m)
            for investment in investments
        ),
        key=lambda item: (
            item.distance_m,
            -item.investment.confidence_score,
            item.investment.name,
        ),
    )
    buckets = [_radius_bucket(radius_m, impact_items) for radius_m in radii_m]
    impact_score = _impact_score(impact_items)
    narrative_items = [_narrative_item(item) for item in impact_items[:6]]
    growth_signals = _growth_signals(impact_items)
    risk_signals = _risk_signals(impact_items, buckets, narrative_items)

    return ListingFutureImpact(
        listing_id=listing.id,
        max_radius_m=max_radius_m,
        radii_m=list(radii_m),
        buckets=buckets,
        nearest_investments=impact_items[:6],
        impact_score=impact_score,
        summary=_summary(impact_score, impact_items, buckets),
        impact_narrative=[item.narrative for item in narrative_items],
        positive_catalysts=[
            item for item in narrative_items if item.category == "positive_catalyst"
        ],
        negative_or_supply_projects=[
            item
            for item in narrative_items
            if item.category in {"mixed", "disruption_risk", "supply_pressure"}
        ],
        growth_signals=growth_signals,
        risk_signals=risk_signals,
        methodology_note=METHODOLOGY_NOTE,
    )


def _impact_item(
    listing: Listing,
    investment: PlannedInvestment,
    radii_m: tuple[int, ...],
) -> PlannedInvestmentImpactItem:
    distance_m = round(
        _haversine_km(listing.lat, listing.lon, investment.lat, investment.lon) * 1000
    )
    radius_m = next((radius for radius in radii_m if distance_m <= radius), max(radii_m))
    return PlannedInvestmentImpactItem(
        investment=investment,
        distance_m=distance_m,
        radius_m=radius_m,
        impact_weight=round(_investment_weight(investment, distance_m), 2),
    )


def _radius_bucket(
    radius_m: int,
    impact_items: list[PlannedInvestmentImpactItem],
) -> FutureImpactRadiusBucket:
    items = [item for item in impact_items if item.distance_m <= radius_m]
    return FutureImpactRadiusBucket(
        radius_m=radius_m,
        count=len(items),
        high_confidence_count=sum(1 for item in items if item.investment.confidence_score >= 65),
        investment_types=sorted({item.investment.investment_type for item in items}),
        statuses=sorted({item.investment.status for item in items}),
        nearest_distance_m=items[0].distance_m if items else None,
    )


def _investment_weight(investment: PlannedInvestment, distance_m: int) -> float:
    if distance_m <= 500:
        base = 28
    elif distance_m <= 1000:
        base = 20
    elif distance_m <= 2000:
        base = 13
    elif distance_m <= 5000:
        base = 6
    else:
        base = 3

    confidence_multiplier = 0.5 + investment.confidence_score / 200
    type_multiplier = _type_multiplier(investment.investment_type)
    status_multiplier = _status_multiplier(investment.status)
    return base * confidence_multiplier * type_multiplier * status_multiplier


def _type_multiplier(investment_type: str) -> float:
    normalized = investment_type.lower()
    if any(token in normalized for token in ("tram", "tat", "transport", "bus")):
        return 1.25
    if any(token in normalized for token in ("school", "park", "green", "public")):
        return 1.1
    if any(token in normalized for token in ("road", "rail")):
        return 0.9
    return 1.0


def _status_multiplier(status: str) -> float:
    normalized = status.lower()
    if any(token in normalized for token in ("realizacji", "active", "construction", "budowa")):
        return 1.1
    if any(token in normalized for token in ("consult", "ustalenia", "analysis")):
        return 0.75
    return 1.0


def _impact_score(impact_items: list[PlannedInvestmentImpactItem]) -> int:
    return round(min(sum(item.impact_weight for item in impact_items), 100))


def _growth_signals(impact_items: list[PlannedInvestmentImpactItem]) -> list[str]:
    signals: list[str] = []
    for item in impact_items[:5]:
        investment = item.investment
        if item.distance_m <= 2000 and investment.confidence_score >= 60:
            signals.append(
                f"{investment.name}: {investment.investment_type}, {item.distance_m} m, "
                f"confidence {investment.confidence_score}/100."
            )
    return signals or ["No strong planned-investment signal within 2 km in current data."]


def _risk_signals(
    impact_items: list[PlannedInvestmentImpactItem],
    buckets: list[FutureImpactRadiusBucket],
    narrative_items: list[FutureImpactNarrativeItem],
) -> list[str]:
    signals: list[str] = []
    near_items = [item for item in impact_items if item.distance_m <= 1000]
    if len(near_items) >= 3:
        signals.append(
            "Several planned projects within 1 km: verify noise, construction timing "
            "and disruption."
        )
    low_confidence_near = [
        item for item in near_items if item.investment.confidence_score < 60
    ]
    if low_confidence_near:
        signals.append("Some nearby projects have limited confidence; verify source freshness.")
    for item in narrative_items:
        signals.extend(item.disruption_risks[:1])
        signals.extend(item.supply_pressure_risks[:1])
    if buckets and buckets[-1].count == 0:
        signals.append("No known planned-investment catalyst within 10 km in current data.")
    return _deduplicate(signals)


def _narrative_item(item: PlannedInvestmentImpactItem) -> FutureImpactNarrativeItem:
    investment = item.investment
    positive_effects = _positive_effects(investment)
    disruption_risks = _disruption_risks(item)
    supply_pressure_risks = _supply_pressure_risks(investment)
    category = _narrative_category(
        positive_effects,
        disruption_risks,
        supply_pressure_risks,
    )
    return FutureImpactNarrativeItem(
        investment_id=investment.id,
        name=investment.name,
        investment_type=investment.investment_type,
        category=category,
        distance_m=item.distance_m,
        status=investment.status,
        expected_year=investment.expected_year,
        confidence_score=investment.confidence_score,
        positive_effects=positive_effects,
        disruption_risks=disruption_risks,
        supply_pressure_risks=supply_pressure_risks,
        narrative=_investment_narrative(
            item,
            positive_effects=positive_effects,
            disruption_risks=disruption_risks,
            supply_pressure_risks=supply_pressure_risks,
        ),
    )


def _positive_effects(investment: PlannedInvestment) -> list[str]:
    normalized = _investment_text(investment)
    effects: list[str] = []
    if any(token in normalized for token in ("tram", "bus", "transport", "tat")):
        effects.append("commute access and renter/buyer catchment may improve")
    if "school" in normalized or "kindergarten" in normalized:
        effects.append("family infrastructure may improve")
    if any(token in normalized for token in ("park", "green", "greenery")):
        effects.append("greenery and daily-living appeal may improve")
    if any(token in normalized for token in ("public", "services", "healthcare")):
        effects.append("public-service access may improve")
    if "road" in normalized:
        effects.append("car access may improve")
    return effects


def _disruption_risks(item: PlannedInvestmentImpactItem) -> list[str]:
    investment = item.investment
    normalized = _investment_text(investment)
    risks: list[str] = []
    if item.distance_m <= 1000 and _status_is_pre_completion(investment.status):
        risks.append(
            f"{investment.name}: construction/access disruption risk before completion "
            f"at {item.distance_m} m."
        )
    if item.distance_m <= 1000 and any(token in normalized for token in ("road", "rail")):
        risks.append(
            f"{investment.name}: road/rail project may add noise or traffic exposure."
        )
    if investment.expected_year is None:
        risks.append(f"{investment.name}: expected year is unknown.")
    if investment.confidence_score < 60:
        risks.append(
            f"{investment.name}: confidence {investment.confidence_score}/100 needs source check."
        )
    return risks


def _supply_pressure_risks(investment: PlannedInvestment) -> list[str]:
    normalized = _investment_text(investment)
    if any(
        token in normalized
        for token in ("housing", "residential", "apartments", "estate", "mieszkan")
    ):
        return [
            f"{investment.name}: nearby new housing supply may compete with resale/rental demand."
        ]
    return []


def _narrative_category(
    positive_effects: list[str],
    disruption_risks: list[str],
    supply_pressure_risks: list[str],
) -> FutureImpactNarrativeCategory:
    if supply_pressure_risks:
        return "supply_pressure"
    if positive_effects and disruption_risks:
        return "mixed"
    if disruption_risks:
        return "disruption_risk"
    return "positive_catalyst"


def _investment_narrative(
    item: PlannedInvestmentImpactItem,
    *,
    positive_effects: list[str],
    disruption_risks: list[str],
    supply_pressure_risks: list[str],
) -> str:
    investment = item.investment
    expected = (
        f"expected around {investment.expected_year}"
        if investment.expected_year is not None
        else "expected year unknown"
    )
    positive = "; ".join(positive_effects) if positive_effects else "no clear positive catalyst"
    risks = [*disruption_risks, *supply_pressure_risks]
    risk_text = "; ".join(risks) if risks else "no specific disruption/supply risk flagged"
    return (
        f"{investment.name} is {item.distance_m} m away, status {investment.status}, "
        f"{expected}, confidence {investment.confidence_score}/100. "
        f"Positive effects: {positive}. Checks: {risk_text}."
    )


def _status_is_pre_completion(status: str) -> bool:
    normalized = status.lower()
    return not any(token in normalized for token in ("completed", "done", "finished", "oddane"))


def _investment_text(investment: PlannedInvestment) -> str:
    return " ".join(
        item
        for item in (
            investment.name,
            investment.investment_type,
            investment.status,
            investment.notes,
        )
        if item
    ).lower()


def _deduplicate(items: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for item in items:
        key = item.casefold()
        if key not in seen:
            seen.add(key)
            result.append(item)
    return result


def _summary(
    impact_score: int,
    impact_items: list[PlannedInvestmentImpactItem],
    buckets: list[FutureImpactRadiusBucket],
) -> str:
    nearest = impact_items[0] if impact_items else None
    within_2km = next((bucket for bucket in buckets if bucket.radius_m == 2000), None)
    if nearest is None:
        return "No planned investments found within 10 km in current data."
    count_2km = within_2km.count if within_2km is not None else 0
    if impact_score >= 60:
        posture = "strong future-area signal"
    elif impact_score >= 30:
        posture = "moderate future-area signal"
    else:
        posture = "limited future-area signal"
    expected = (
        f"expected {nearest.investment.expected_year}"
        if nearest.investment.expected_year is not None
        else "expected year unknown"
    )
    return (
        f"{posture}: {count_2km} planned investments within 2 km; nearest is "
        f"{nearest.investment.name} at {nearest.distance_m} m "
        f"({nearest.investment.status}, {expected}, "
        f"confidence {nearest.investment.confidence_score}/100)."
    )


def _haversine_km(lat_1: float, lon_1: float, lat_2: float, lon_2: float) -> float:
    radius = 6371.0
    delta_lat = radians(lat_2 - lat_1)
    delta_lon = radians(lon_2 - lon_1)
    a = (
        sin(delta_lat / 2) ** 2
        + cos(radians(lat_1)) * cos(radians(lat_2)) * sin(delta_lon / 2) ** 2
    )
    return 2 * radius * asin(sqrt(a))
