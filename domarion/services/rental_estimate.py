from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from math import asin, cos, radians, sin, sqrt
from statistics import median

from domarion.schemas import (
    Listing,
    ListingRentalEstimate,
    MortgageCalculationRequest,
    PropertyScores,
    RentalAssumption,
    RentalCashflowScenario,
    RentalComparableEvidence,
    RentalConfidence,
    RentalConfidenceFactor,
    RentalObservation,
)
from domarion.services.mortgage import calculate_mortgage

RENTAL_MINIMUM_SAMPLE = 3
RENTAL_TARGET_SAMPLE = 5
RENTAL_FRESHNESS_DAYS = 120
DEFAULT_VACANCY_RATE_PCT = 7.0
DEFAULT_MANAGEMENT_RESERVE_PCT = 4.0
DEFAULT_MAINTENANCE_RESERVE_PER_M2_PLN = 5.0
RENTAL_ESTIMATE_METHODOLOGY_NOTE = (
    "Monthly rent is estimated from recent, independently sourced long-term rental "
    "observations. Gross yield uses asking price as the acquisition-price denominator. "
    "Net yield deducts explicit vacancy and operating-cost scenario assumptions and is "
    "shown before income tax, financing and one-off repairs."
)


@dataclass(frozen=True)
class RentalComparableSelection:
    items: list[RentalObservation]
    level: int
    geographic_scope: str
    stage_counts: dict[str, int]
    excluded_counts: dict[str, int]

    @property
    def status(self) -> str:
        if len(self.items) >= RENTAL_TARGET_SAMPLE and self.level <= 1:
            return "strong"
        if len(self.items) >= RENTAL_MINIMUM_SAMPLE:
            return "limited"
        return "insufficient"


def select_rental_comparables(repository, listing: Listing) -> RentalComparableSelection:
    observations = repository.find_rental_observations(listing, limit=200)
    today = date.today()
    fresh: list[RentalObservation] = []
    excluded = {"stale": 0, "different_city": 0, "non_apartment": 0}
    for item in observations:
        if item.city.casefold() != listing.city.casefold():
            excluded["different_city"] += 1
            continue
        if item.property_type.casefold() not in {"apartment", "flat", "mieszkanie"}:
            excluded["non_apartment"] += 1
            continue
        if (today - item.last_confirmed_at).days > RENTAL_FRESHNESS_DAYS:
            excluded["stale"] += 1
            continue
        fresh.append(item)

    stages = (
        (
            "same_district_close_match",
            lambda item: _same_district(item, listing)
            and _area_within(item, listing, 0.20)
            and _rooms_within(item, listing, 0)
            and _building_matches(item, listing),
            f"{listing.district}, close property match",
        ),
        (
            "same_district_wider_property",
            lambda item: _same_district(item, listing)
            and _area_within(item, listing, 0.30)
            and _rooms_within(item, listing, 1),
            f"{listing.district}, wider property match",
        ),
        (
            "same_city_similar_property",
            lambda item: _area_within(item, listing, 0.25)
            and _rooms_within(item, listing, 1),
            f"{listing.city}, similar property",
        ),
        (
            "same_city_wider_property",
            lambda item: _area_within(item, listing, 0.40)
            and _rooms_within(item, listing, 2),
            f"{listing.city}, wider property match",
        ),
    )
    selected: dict[str, RentalObservation] = {}
    stage_counts: dict[str, int] = {}
    level = len(stages) - 1
    scope = stages[-1][2]
    for stage_level, (code, predicate, stage_scope) in enumerate(stages):
        matches = [item for item in fresh if predicate(item)]
        stage_counts[code] = len(matches)
        for item in matches:
            selected.setdefault(item.id, item)
        level = stage_level
        scope = stage_scope
        if len(selected) >= RENTAL_MINIMUM_SAMPLE:
            break

    ordered = sorted(
        selected.values(),
        key=lambda item: (
            -_similarity_score(item, listing),
            _distance_m(item, listing) if _distance_m(item, listing) is not None else 10**9,
            abs(item.area_m2 - listing.area_m2),
            abs((item.rooms or listing.rooms) - listing.rooms),
            -item.last_confirmed_at.toordinal(),
            item.id,
        ),
    )[:12]
    return RentalComparableSelection(
        items=ordered,
        level=level,
        geographic_scope=scope,
        stage_counts=stage_counts,
        excluded_counts={key: value for key, value in excluded.items() if value},
    )


def rental_potential_from_observations(
    listing: Listing,
    selection: RentalComparableSelection,
) -> int | None:
    if len(selection.items) < RENTAL_MINIMUM_SAMPLE:
        return None
    monthly_rent = median(item.rent_per_m2_pln for item in selection.items) * listing.area_m2
    gross_yield = monthly_rent * 12 / listing.price * 100
    yield_score = _clamp((gross_yield - 2.5) / 3.5 * 100)
    confidence = _rental_confidence(listing, selection).score
    transport = (
        _clamp(100 - min(listing.nearest_stop_m, 1200) / 12)
        if listing.nearest_stop_m is not None
        else None
    )
    components = [(yield_score, 0.55), (confidence, 0.30)]
    if transport is not None:
        components.append((transport, 0.15))
    return _clamp(
        sum(value * weight for value, weight in components)
        / sum(weight for _, weight in components)
    )


def build_listing_rental_estimate(
    listing: Listing,
    scores: PropertyScores,
    *,
    selection: RentalComparableSelection,
) -> ListingRentalEstimate:
    confidence = _rental_confidence(listing, selection)
    evidence = _evidence(listing, selection.items)
    source_names = sorted({item.source_name for item in selection.items})
    observed_from = min((item.observed_at for item in selection.items), default=None)
    observed_to = max((item.last_confirmed_at for item in selection.items), default=None)
    period = (
        f"{observed_from.isoformat()}–{observed_to.isoformat()}"
        if observed_from is not None and observed_to is not None
        else None
    )
    assumptions = _assumptions()
    if len(selection.items) < RENTAL_MINIMUM_SAMPLE:
        return ListingRentalEstimate(
            listing_id=listing.id,
            status="insufficient_data",
            source_names=source_names,
            period=period,
            observed_from=observed_from,
            observed_to=observed_to,
            geographic_scope=selection.geographic_scope,
            sample_size=len(selection.items),
            target_sample_size=RENTAL_MINIMUM_SAMPLE,
            selection_level=selection.level,
            freshness_days=RENTAL_FRESHNESS_DAYS,
            vacancy_rate_pct=DEFAULT_VACANCY_RATE_PCT,
            confidence_score=confidence.score,
            confidence=confidence,
            comparables=evidence,
            assumptions=assumptions,
            risk_notes=[
                "Fewer than three relevant rental observations are available; "
                "rent and yield are not calculated."
            ],
            methodology_note=RENTAL_ESTIMATE_METHODOLOGY_NOTE,
        )

    rates = sorted(item.rent_per_m2_pln for item in selection.items)
    low_rate = _percentile(rates, 0.25)
    mid_rate = median(rates)
    high_rate = _percentile(rates, 0.75)
    monthly_rent_low = _round_rent(low_rate * listing.area_m2)
    monthly_rent_mid = _round_rent(mid_rate * listing.area_m2)
    monthly_rent_high = _round_rent(high_rate * listing.area_m2)
    monthly_rent_low = min(monthly_rent_low, monthly_rent_mid - 50)
    monthly_rent_high = max(monthly_rent_high, monthly_rent_mid + 50)
    vacancy_loss = round(monthly_rent_mid * DEFAULT_VACANCY_RATE_PCT / 100)
    operating_costs = _operating_costs_monthly(listing, monthly_rent_mid)
    net_operating_income = monthly_rent_mid - vacancy_loss - operating_costs
    gross_yield = round(monthly_rent_mid * 12 / listing.price * 100, 2)
    net_yield = round(net_operating_income * 12 / listing.price * 100, 2)

    return ListingRentalEstimate(
        listing_id=listing.id,
        status="estimated",
        source_names=source_names,
        period=period,
        observed_from=observed_from,
        observed_to=observed_to,
        geographic_scope=selection.geographic_scope,
        sample_size=len(selection.items),
        target_sample_size=RENTAL_MINIMUM_SAMPLE,
        selection_level=selection.level,
        freshness_days=RENTAL_FRESHNESS_DAYS,
        monthly_rent_low_pln=monthly_rent_low,
        monthly_rent_mid_pln=monthly_rent_mid,
        monthly_rent_high_pln=monthly_rent_high,
        rent_per_m2_mid_pln=round(mid_rate),
        gross_yield_pct=gross_yield,
        net_yield_pct=net_yield,
        net_yield_on_cash_pct=net_yield,
        vacancy_rate_pct=DEFAULT_VACANCY_RATE_PCT,
        operating_costs_monthly_pln=operating_costs,
        net_operating_income_monthly_pln=net_operating_income,
        confidence_score=confidence.score,
        confidence=confidence,
        comparables=evidence,
        cashflow_scenarios=_cashflow_scenarios(
            listing=listing,
            monthly_rent=monthly_rent_mid,
            vacancy_loss=vacancy_loss,
            operating_costs=operating_costs,
            gross_yield_pct=gross_yield,
        ),
        assumptions=assumptions,
        risk_notes=_risk_notes(listing, scores, confidence),
        methodology_note=RENTAL_ESTIMATE_METHODOLOGY_NOTE,
    )


def _rental_confidence(
    listing: Listing,
    selection: RentalComparableSelection,
) -> RentalConfidence:
    items = selection.items
    sample_score = (
        100 if len(items) >= 8 else 85 if len(items) >= 5 else 65 if len(items) >= 3 else 25
    )
    similarities = [_similarity_score(item, listing) for item in items]
    relevance_score = round(median(similarities)) if similarities else 20
    ages = [(date.today() - item.last_confirmed_at).days for item in items]
    median_age = median(ages) if ages else RENTAL_FRESHNESS_DAYS * 2
    freshness_score = (
        100 if median_age <= 30 else 80 if median_age <= 60 else 55 if median_age <= 120 else 20
    )
    geography_score = {0: 100, 1: 88, 2: 65, 3: 48}.get(selection.level, 30)
    rates = [item.rent_per_m2_pln for item in items]
    dispersion = (
        (max(rates) - min(rates)) / median(rates) * 100
        if len(rates) >= 2 and median(rates) > 0
        else None
    )
    consistency_score = (
        90
        if dispersion is not None and dispersion <= 15
        else 68
        if dispersion is not None and dispersion <= 25
        else 35
        if dispersion is not None
        else 45
    )
    source_score = (
        round(sum(item.data_quality_score for item in items) / len(items)) if items else 20
    )
    raw_factors = [
        ("sample_size", sample_score, 25),
        ("relevance", relevance_score, 25),
        ("freshness", freshness_score, 15),
        ("geographic_scope", geography_score, 15),
        ("rent_consistency", consistency_score, 10),
        ("source_quality", source_score, 10),
    ]
    score = round(sum(value * weight for _, value, weight in raw_factors) / 100)
    limitations: list[str] = []
    if len(items) < RENTAL_MINIMUM_SAMPLE:
        score = min(score, 39)
        limitations.append("rental_sample_insufficient")
    elif len(items) < RENTAL_TARGET_SAMPLE:
        score = min(score, 74)
        limitations.append("rental_sample_limited")
    if selection.level >= 2:
        score = min(score, 69 if selection.level == 2 else 59)
        limitations.append("rental_geography_widened")
    if dispersion is not None and dispersion > 25:
        score = min(score, 49)
        limitations.append("rental_rates_inconsistent")
    level = "high" if score >= 75 and len(items) >= 5 else "medium" if score >= 55 else "low"
    return RentalConfidence(
        level=level,
        score=score,
        factors=[
            RentalConfidenceFactor(
                code=code,
                score=value,
                weight=weight,
                status=(
                    "supporting" if value >= 75 else "neutral" if value >= 55 else "limiting"
                ),
            )
            for code, value, weight in raw_factors
        ],
        limitation_codes=limitations,
    )


def _evidence(
    listing: Listing,
    items: list[RentalObservation],
) -> list[RentalComparableEvidence]:
    return [
        RentalComparableEvidence(
            observation_id=item.id,
            source_name=item.source_name,
            source_type=item.source_type,
            observed_at=item.observed_at,
            district=item.district,
            monthly_rent_pln=item.monthly_rent_pln,
            rent_per_m2_pln=item.rent_per_m2_pln,
            area_m2=item.area_m2,
            rooms=item.rooms,
            similarity_score=_similarity_score(item, listing),
        )
        for item in items
    ]


def _assumptions() -> list[RentalAssumption]:
    return [
        RentalAssumption(
            code="vacancy_rate",
            label="Vacancy allowance",
            value=DEFAULT_VACANCY_RATE_PCT,
            unit="percent",
            source="scenario_default",
        ),
        RentalAssumption(
            code="management_reserve",
            label="Management reserve",
            value=DEFAULT_MANAGEMENT_RESERVE_PCT,
            unit="percent",
            source="scenario_default",
        ),
        RentalAssumption(
            code="maintenance_reserve",
            label="Maintenance reserve",
            value=DEFAULT_MAINTENANCE_RESERVE_PER_M2_PLN,
            unit="pln_per_m2_month",
            source="scenario_default",
        ),
    ]


def _operating_costs_monthly(listing: Listing, monthly_rent: int) -> int:
    management_reserve = round(monthly_rent * DEFAULT_MANAGEMENT_RESERVE_PCT / 100)
    maintenance_reserve = round(listing.area_m2 * DEFAULT_MAINTENANCE_RESERVE_PER_M2_PLN)
    return management_reserve + maintenance_reserve


def _cashflow_scenarios(
    *,
    listing: Listing,
    monthly_rent: int,
    vacancy_loss: int,
    operating_costs: int,
    gross_yield_pct: float,
) -> list[RentalCashflowScenario]:
    cash_purchase = calculate_mortgage(
        MortgageCalculationRequest(
            property_price_pln=listing.price,
            down_payment_pln=listing.price,
            market_type=listing.market_type,
        )
    )
    financed = calculate_mortgage(
        MortgageCalculationRequest(
            property_price_pln=listing.price,
            down_payment_pln=round(listing.price * 0.2),
            loan_years=25,
            annual_interest_rate_pct=7.5,
            rate_type="variable",
            market_type=listing.market_type,
        )
    )
    return [
        _cashflow_scenario(
            code="cash_purchase",
            label="Cash purchase, before income tax",
            monthly_rent=monthly_rent,
            vacancy_loss=vacancy_loss,
            operating_costs=operating_costs,
            mortgage_payment=0,
            cash_invested=cash_purchase.costs.upfront_cash_needed_pln,
            gross_yield_pct=gross_yield_pct,
        ),
        _cashflow_scenario(
            code="financed_80_ltv",
            label="80% LTV, 25 years, 7.5% variable rate, before income tax",
            monthly_rent=monthly_rent,
            vacancy_loss=vacancy_loss,
            operating_costs=operating_costs,
            mortgage_payment=financed.base_scenario.monthly_total_payment_pln,
            cash_invested=financed.costs.upfront_cash_needed_pln,
            gross_yield_pct=gross_yield_pct,
        ),
    ]


def _cashflow_scenario(
    *,
    code: str,
    label: str,
    monthly_rent: int,
    vacancy_loss: int,
    operating_costs: int,
    mortgage_payment: int,
    cash_invested: int,
    gross_yield_pct: float,
) -> RentalCashflowScenario:
    net_cashflow_monthly = monthly_rent - vacancy_loss - operating_costs - mortgage_payment
    annual_net_cashflow = net_cashflow_monthly * 12
    net_yield_on_cash_pct = (
        round(annual_net_cashflow / cash_invested * 100, 2) if cash_invested else 0
    )
    return RentalCashflowScenario(
        code=code,
        label=label,
        monthly_rent_pln=monthly_rent,
        vacancy_loss_pln=vacancy_loss,
        operating_costs_pln=operating_costs,
        mortgage_payment_pln=mortgage_payment,
        net_cashflow_monthly_pln=net_cashflow_monthly,
        annual_net_cashflow_pln=annual_net_cashflow,
        cash_invested_pln=cash_invested,
        gross_yield_pct=gross_yield_pct,
        net_yield_on_cash_pct=net_yield_on_cash_pct,
    )


def _risk_notes(
    listing: Listing,
    scores: PropertyScores,
    confidence: RentalConfidence,
) -> list[str]:
    notes = [
        "Net yield excludes income tax, financing and one-off repairs.",
        "Vacancy and operating costs are scenario assumptions, not observed facts.",
    ]
    if confidence.level == "low":
        notes.append("Rental evidence confidence is low; verify current rental offers manually.")
    if listing.nearest_stop_m is not None and listing.nearest_stop_m > 800:
        notes.append("Weak transport access may increase vacancy risk.")
    if scores.price_delta_to_fair_mid_pct > 7:
        notes.append("A higher acquisition price reduces both gross and net yield.")
    return notes


def _same_district(item: RentalObservation, listing: Listing) -> bool:
    return item.district is not None and item.district.casefold() == listing.district.casefold()


def _area_within(item: RentalObservation, listing: Listing, tolerance: float) -> bool:
    return abs(item.area_m2 - listing.area_m2) <= listing.area_m2 * tolerance


def _rooms_within(item: RentalObservation, listing: Listing, tolerance: int) -> bool:
    return item.rooms is not None and abs(item.rooms - listing.rooms) <= tolerance


def _building_matches(item: RentalObservation, listing: Listing) -> bool:
    return (
        item.building_type is None
        or listing.building_type is None
        or item.building_type.casefold() == listing.building_type.casefold()
    )


def _similarity_score(item: RentalObservation, listing: Listing) -> int:
    components = [max(0.0, 100 - abs(item.area_m2 - listing.area_m2) / listing.area_m2 * 180)]
    if item.rooms is not None:
        components.append(max(0.0, 100 - abs(item.rooms - listing.rooms) * 28))
    if item.district is not None:
        components.append(100.0 if _same_district(item, listing) else 45.0)
    if item.building_type is not None and listing.building_type is not None:
        components.append(100.0 if _building_matches(item, listing) else 45.0)
    return _clamp(sum(components) / len(components))


def _distance_m(item: RentalObservation, listing: Listing) -> int | None:
    if item.lat is None or item.lon is None or listing.lat is None or listing.lon is None:
        return None
    lat1, lon1, lat2, lon2 = map(radians, (listing.lat, listing.lon, item.lat, item.lon))
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    haversine = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return round(6_371_000 * 2 * asin(sqrt(haversine)))


def _percentile(values: list[float], percentile: float) -> float:
    if len(values) == 1:
        return values[0]
    position = (len(values) - 1) * percentile
    lower = int(position)
    upper = min(lower + 1, len(values) - 1)
    fraction = position - lower
    return values[lower] * (1 - fraction) + values[upper] * fraction


def _round_rent(value: float) -> int:
    return int(round(value / 50) * 50)


def _clamp(value: float) -> int:
    return int(max(0, min(100, round(value))))
