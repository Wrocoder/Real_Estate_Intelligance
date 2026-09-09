import json
from dataclasses import asdict, dataclass, field, replace
from functools import lru_cache
from hashlib import sha256
from math import ceil, floor
from statistics import median
from typing import Any

from domarion.core import get_settings
from domarion.schemas import (
    AreaStatistics,
    FairPriceConfidence,
    FairPriceConfidenceFactor,
    Listing,
    ListingAnalysis,
    PropertyScores,
    PurchaseIntent,
    ScoreBreakdown,
    ScoreDimensionExplainability,
    ScoreDriver,
    ScoreExplainability,
)
from domarion.services.buyer_decision import build_buyer_decision
from domarion.services.comparables import (
    ComparableSelection,
    build_comparable_evidence,
    select_comparables,
)
from domarion.services.future_impact import build_listing_future_impact
from domarion.services.growth_analysis import build_listing_growth_analysis
from domarion.services.rental_estimate import (
    RentalComparableSelection,
    build_listing_rental_estimate,
    rental_potential_from_observations,
    select_rental_comparables,
)
from domarion.services.risk_profile import build_listing_risk_profile


class ScoringConfigurationError(ValueError):
    pass


def _legacy_comparable_selection(repository, listing: Listing) -> ComparableSelection:
    items = repository.find_comparables(listing)
    return ComparableSelection(items, 0, "legacy alert matching", 0, [])


SCORING_FORMULA_VERSION = "domarion-scoring-v1"
DEFAULT_SCORING_WEIGHTS_PROFILE = "default-v1"
SCORE_EXPLANATION_VERSION = "score-explanation-v2"
SCORING_DISCLAIMER = (
    "Scoring outputs are decision-support screening signals, not financial, legal or "
    "investment advice, not a valuation certificate and not a guarantee of price, financing, "
    "legal status or future performance."
)


@dataclass(frozen=True)
class FairPriceWeights:
    area_median: float = 0.65
    comparable_median: float = 0.35


@dataclass(frozen=True)
class RiskScoreWeights:
    pricing: float = 0.27
    market: float = 0.26
    location: float = 0.24
    building: float = 0.10
    data_quality: float = 0.13


@dataclass(frozen=True)
class InvestmentScoreWeights:
    price_position: float = 0.20
    area_trend: float = 0.15
    transport: float = 0.15
    future_infrastructure: float = 0.15
    liquidity: float = 0.10
    lifestyle_infrastructure: float = 0.10
    rental_potential: float = 0.10
    data_quality: float = 0.05
    risk_penalty: float = 0.25


@dataclass(frozen=True)
class ScoringWeights:
    fair_price: FairPriceWeights = field(default_factory=FairPriceWeights)
    risk: RiskScoreWeights = field(default_factory=RiskScoreWeights)
    investment: InvestmentScoreWeights = field(default_factory=InvestmentScoreWeights)
    risk_penalty_multiplier: float = 0.65

    @classmethod
    def from_json(cls, raw_json: str | None) -> "ScoringWeights":
        if not raw_json:
            return cls()
        try:
            payload = json.loads(raw_json)
        except json.JSONDecodeError as exc:
            raise ScoringConfigurationError("SCORING_WEIGHTS_JSON must be valid JSON") from exc
        if not isinstance(payload, dict):
            raise ScoringConfigurationError("SCORING_WEIGHTS_JSON must be a JSON object")
        return cls.from_mapping(payload)

    @classmethod
    def from_mapping(cls, payload: dict[str, Any]) -> "ScoringWeights":
        allowed_keys = {"fair_price", "risk", "investment", "risk_penalty_multiplier"}
        unknown_keys = set(payload) - allowed_keys
        if unknown_keys:
            raise ScoringConfigurationError(
                f"Unknown scoring weight sections: {', '.join(sorted(unknown_keys))}"
            )
        return cls(
            fair_price=_override_dataclass(
                FairPriceWeights(),
                payload.get("fair_price", {}),
                section="fair_price",
            ),
            risk=_override_dataclass(RiskScoreWeights(), payload.get("risk", {}), section="risk"),
            investment=_override_dataclass(
                InvestmentScoreWeights(),
                payload.get("investment", {}),
                section="investment",
            ),
            risk_penalty_multiplier=_optional_float(
                payload,
                "risk_penalty_multiplier",
                default=cls().risk_penalty_multiplier,
            ),
        )


def get_scoring_weights() -> ScoringWeights:
    return _get_scoring_weights(get_settings().scoring_weights_json)


def scoring_weights_profile(weights: ScoringWeights) -> str:
    if weights == ScoringWeights():
        return DEFAULT_SCORING_WEIGHTS_PROFILE
    body = json.dumps(asdict(weights), sort_keys=True, separators=(",", ":"))
    return f"custom-{sha256(body.encode('utf-8')).hexdigest()[:12]}"


@lru_cache
def _get_scoring_weights(raw_json: str | None) -> ScoringWeights:
    return ScoringWeights.from_json(raw_json)


def clamp(value: float, minimum: int = 0, maximum: int = 100) -> int:
    return int(max(minimum, min(maximum, round(value))))


def _weighted_available(components: list[tuple[int | None, float]]) -> int:
    available = [
        (value, weight) for value, weight in components if value is not None and weight > 0
    ]
    total_weight = sum(weight for _, weight in available)
    if not available or total_weight <= 0:
        return 0
    return clamp(sum(value * weight for value, weight in available) / total_weight)


def calculate_scores(
    listing: Listing,
    area_statistics: AreaStatistics,
    comparables: list[Listing],
    weights: ScoringWeights | None = None,
    comparable_selection: ComparableSelection | None = None,
    rental_selection: RentalComparableSelection | None = None,
) -> PropertyScores:
    weights = weights or get_scoring_weights()
    median_price = area_statistics.median_price_per_m2
    price_delta_pct = ((listing.price_per_m2 / median_price) - 1) * 100
    missing_inputs = {
        name
        for name, value in {
            "distance_to_center_km": listing.distance_to_center_km,
            "nearest_stop_m": listing.nearest_stop_m,
            "nearest_school_m": listing.nearest_school_m,
            "nearest_major_road_m": listing.nearest_major_road_m,
            "nearest_industrial_zone_m": listing.nearest_industrial_zone_m,
            "parks_within_1km": listing.parks_within_1km,
            "schools_within_1km": listing.schools_within_1km,
            "planned_investments_within_2km": listing.planned_investments_within_2km,
        }.items()
        if value is None
    }
    fair_price_confidence = _fair_price_confidence(
        listing,
        area_statistics,
        comparables,
        comparable_selection,
    )
    if missing_inputs:
        fair_price_confidence = _cap_fair_price_confidence(
            fair_price_confidence,
            55,
            "property_context_incomplete",
        )
    comparable_prices = [item.price_per_m2 for item in comparables]
    if len(comparable_prices) >= 3:
        comparable_median = int(median(comparable_prices))
        fair_price_per_m2 = (
            median_price * weights.fair_price.area_median
            + comparable_median * weights.fair_price.comparable_median
        )
    else:
        fair_price_per_m2 = median_price
    fair_price_mid = _round_price(fair_price_per_m2 * listing.area_m2)
    range_width = _fair_price_range_width(fair_price_confidence)
    fair_price_low = _round_price(fair_price_mid * (1 - range_width), direction="down")
    fair_price_high = _round_price(fair_price_mid * (1 + range_width), direction="up")
    fair_price_confidence_score = fair_price_confidence.score
    price_delta_to_fair_mid_pct = ((listing.price / fair_price_mid) - 1) * 100

    price_position = clamp(70 - price_delta_pct * 2.2)
    area_trend = clamp(50 + area_statistics.price_change_90d_pct * 6)
    transport = (
        clamp(100 - max(0, listing.nearest_stop_m - 200) / 8)
        if listing.nearest_stop_m is not None
        else None
    )
    future_infrastructure = (
        clamp(45 + listing.planned_investments_within_2km * 13)
        if listing.planned_investments_within_2km is not None
        else None
    )
    liquidity = (
        clamp(
            100
            - area_statistics.average_days_on_market * 0.45
            + max(0, area_statistics.removed_listings_30d - area_statistics.new_listings_30d) * 0.2
        )
        if area_statistics.listing_metrics_available
        else None
    )
    lifestyle_infrastructure = (
        clamp(
            35
            + listing.schools_within_1km * 12
            + listing.parks_within_1km * 10
            - max(0, listing.nearest_school_m - 700) / 20
        )
        if listing.schools_within_1km is not None
        and listing.parks_within_1km is not None
        and listing.nearest_school_m is not None
        else None
    )
    rental_potential = (
        rental_potential_from_observations(listing, rental_selection)
        if rental_selection is not None
        else None
    )

    pricing_risk = clamp(max(0, price_delta_pct) * 3.5)
    market_risk = clamp(
        listing.days_on_market * 0.28
        + listing.price_reductions * 8
        + (
            max(0, area_statistics.supply_change_90d_pct) * 1.3
            if area_statistics.listing_metrics_available
            else 0
        )
    )
    location_risk_terms = [
        max(0, 700 - listing.nearest_major_road_m) / 12
        if listing.nearest_major_road_m is not None
        else None,
        max(0, 1500 - listing.nearest_industrial_zone_m) / 25
        if listing.nearest_industrial_zone_m is not None
        else None,
        max(0, listing.nearest_stop_m - 700) / 8 if listing.nearest_stop_m is not None else None,
    ]
    location_risk = (
        clamp(sum(term for term in location_risk_terms if term is not None))
        if any(term is not None for term in location_risk_terms)
        else None
    )
    building_risk_terms = [
        15 if listing.floor == 0 else 0 if listing.floor is not None else None,
        (
            12
            if listing.building_floors is not None
            and listing.floor is not None
            and listing.floor == listing.building_floors
            else 0
            if listing.building_floors is not None and listing.floor is not None
            else None
        ),
        10
        if listing.building_year is not None and listing.building_year < 1980
        else 0
        if listing.building_year is not None
        else None,
    ]
    building_risk = (
        clamp(sum(term for term in building_risk_terms if term is not None))
        if any(term is not None for term in building_risk_terms)
        else None
    )
    data_risk = clamp(100 - listing.data_quality_score)
    risk_score = _weighted_available(
        [
            (pricing_risk, weights.risk.pricing),
            (market_risk, weights.risk.market),
            (location_risk, weights.risk.location),
            (building_risk, weights.risk.building),
            (data_risk, weights.risk.data_quality),
        ]
    )

    risk_penalty = clamp(risk_score * weights.risk_penalty_multiplier)
    investment_score = clamp(
        _weighted_available(
            [
                (price_position, weights.investment.price_position),
                (area_trend, weights.investment.area_trend),
                (transport, weights.investment.transport),
                (future_infrastructure, weights.investment.future_infrastructure),
                (liquidity, weights.investment.liquidity),
                (lifestyle_infrastructure, weights.investment.lifestyle_infrastructure),
                (rental_potential, weights.investment.rental_potential),
                (listing.data_quality_score, weights.investment.data_quality),
            ]
        )
        - risk_penalty * weights.investment.risk_penalty
    )

    negotiation_score = clamp(
        20
        + listing.days_on_market * 0.35
        + listing.price_reductions * 12
        + max(0, price_delta_pct) * 2
        + (12 if listing.relisted else 0)
        + (
            max(0, area_statistics.supply_change_90d_pct) * 1.2
            if area_statistics.listing_metrics_available
            else 0
        )
    )

    reasons = []
    warnings = []

    if price_delta_pct < -5:
        reasons.append("Цена за m2 ниже медианы района.")
    if (
        listing.planned_investments_within_2km is not None
        and listing.planned_investments_within_2km >= 2
    ):
        reasons.append("Рядом есть несколько planned investments в радиусе 2 км.")
    if listing.nearest_stop_m is not None and listing.nearest_stop_m <= 400:
        reasons.append("Хорошая транспортная доступность по расстоянию до остановки.")
    if listing.price_reductions > 0:
        reasons.append("Цена уже снижалась, это усиливает переговорную позицию.")

    if price_delta_pct > 10:
        warnings.append("Цена за m2 заметно выше медианы района.")
    if (
        area_statistics.listing_metrics_available
        and listing.days_on_market > area_statistics.average_days_on_market * 1.5
    ):
        warnings.append("Объект находится на рынке существенно дольше среднего по району.")
    if listing.nearest_industrial_zone_m is not None and listing.nearest_industrial_zone_m < 1500:
        warnings.append("Промышленная зона находится относительно близко.")
    if listing.data_quality_score < 70:
        warnings.append("Качество данных ниже желательного уровня, выводы нужно перепроверить.")
    if not area_statistics.listing_metrics_available:
        warnings.append(
            "Dla tego obszaru nie ma aktywnej historii ofert; fair-price opiera się na "
            f"obserwacjach transakcyjnych RCN ({area_statistics.transaction_observation_count})."
        )
    if missing_inputs:
        warnings.append(
            "Недостающие поля инфраструктуры не подставлялись; зависимые сигналы имеют "
            "пониженную уверенность: " + ", ".join(sorted(missing_inputs)) + "."
        )

    explainability = _build_score_explainability(
        listing=listing,
        area_statistics=area_statistics,
        comparables=comparables,
        rental_selection=rental_selection,
        price_delta_pct=price_delta_pct,
        price_position=price_position,
        area_trend=area_trend,
        transport=transport,
        future_infrastructure=future_infrastructure,
        liquidity=liquidity,
        lifestyle_infrastructure=lifestyle_infrastructure,
        rental_potential=rental_potential,
        pricing_risk=pricing_risk,
        market_risk=market_risk,
        location_risk=location_risk,
        building_risk=building_risk,
        data_risk=data_risk,
        risk_penalty=risk_penalty,
        investment_score=investment_score,
        risk_score=risk_score,
        negotiation_score=negotiation_score,
    )

    return PropertyScores(
        formula_version=SCORING_FORMULA_VERSION,
        weights_profile=scoring_weights_profile(weights),
        decision_label=_decision_label(
            investment_score,
            risk_score,
            price_delta_to_fair_mid_pct,
            negotiation_score,
        ),
        price_label=_price_label(price_delta_to_fair_mid_pct),
        risk_label=_risk_label(risk_score),
        negotiation_label=_negotiation_label(negotiation_score),
        liquidity_label=_potential_label(liquidity),
        rental_potential_label=_potential_label(rental_potential),
        investment_score=investment_score,
        risk_score=risk_score,
        negotiation_score=negotiation_score,
        liquidity_score=liquidity,
        rental_potential_score=rental_potential,
        fair_price_low=fair_price_low,
        fair_price_mid=fair_price_mid,
        fair_price_high=fair_price_high,
        fair_price_confidence_score=fair_price_confidence_score,
        fair_price_confidence=fair_price_confidence,
        price_delta_to_fair_mid_pct=round(price_delta_to_fair_mid_pct, 1),
        breakdown=ScoreBreakdown(
            price_position=price_position,
            area_trend=area_trend,
            transport=transport,
            future_infrastructure=future_infrastructure,
            liquidity=liquidity,
            lifestyle_infrastructure=lifestyle_infrastructure,
            rental_potential=rental_potential,
            data_quality=listing.data_quality_score,
            risk_penalty=risk_penalty,
        ),
        reasons=reasons,
        warnings=warnings,
        explainability=explainability,
    )


def _build_score_explainability(
    *,
    listing: Listing,
    area_statistics: AreaStatistics,
    comparables: list[Listing],
    rental_selection: RentalComparableSelection | None,
    price_delta_pct: float,
    price_position: int,
    area_trend: int,
    transport: int | None,
    future_infrastructure: int | None,
    liquidity: int | None,
    lifestyle_infrastructure: int | None,
    rental_potential: int | None,
    pricing_risk: int,
    market_risk: int,
    location_risk: int | None,
    building_risk: int | None,
    data_risk: int,
    risk_penalty: int,
    investment_score: int,
    risk_score: int,
    negotiation_score: int,
) -> ScoreExplainability:
    market_evidence_available = bool(
        comparables or area_statistics.transaction_observation_count
    )
    investment_missing = _missing_codes(
        ("nearest_stop_m", transport is not None),
        ("planned_investments_within_2km", future_infrastructure is not None),
        ("listing_market_metrics", liquidity is not None),
        ("lifestyle_infrastructure", lifestyle_infrastructure is not None),
        ("rental_observations", rental_potential is not None),
        ("market_evidence", market_evidence_available),
    )
    investment_drivers: list[ScoreDriver] = []
    _append_threshold_driver(
        investment_drivers,
        price_position,
        positive_code="price_position_supportive",
        negative_code="price_position_unfavorable",
    )
    _append_threshold_driver(
        investment_drivers,
        area_trend,
        positive_code="area_trend_supportive",
        negative_code="area_trend_weak",
        positive_threshold=58,
        negative_threshold=42,
    )
    _append_threshold_driver(
        investment_drivers,
        transport,
        positive_code="transport_access_strong",
        negative_code="transport_access_weak",
    )
    _append_threshold_driver(
        investment_drivers,
        liquidity,
        positive_code="liquidity_signal_strong",
        negative_code="liquidity_signal_weak",
    )
    _append_threshold_driver(
        investment_drivers,
        rental_potential,
        positive_code="rental_signal_strong",
        negative_code="rental_signal_weak",
    )
    _append_inverse_driver(
        investment_drivers,
        risk_penalty,
        positive_code="risk_burden_low",
        negative_code="risk_burden_high",
        positive_threshold=20,
        negative_threshold=45,
    )
    _append_threshold_driver(
        investment_drivers,
        listing.data_quality_score,
        positive_code="data_quality_strong",
        negative_code="data_quality_weak",
        positive_threshold=80,
        negative_threshold=60,
    )
    _append_missing_drivers(investment_drivers, investment_missing)
    investment_coverage = _weighted_coverage(
        (True, 0.20),
        (True, 0.15),
        (transport is not None, 0.15),
        (future_infrastructure is not None, 0.15),
        (liquidity is not None, 0.10),
        (lifestyle_infrastructure is not None, 0.10),
        (rental_potential is not None, 0.10),
        (True, 0.05),
        (location_risk is not None or building_risk is not None, 0.25),
    )

    risk_missing = _missing_codes(
        ("listing_market_metrics", area_statistics.listing_metrics_available),
        ("nearest_major_road_m", listing.nearest_major_road_m is not None),
        ("nearest_industrial_zone_m", listing.nearest_industrial_zone_m is not None),
        ("nearest_stop_m", listing.nearest_stop_m is not None),
        ("floor", listing.floor is not None),
        ("building_floors", listing.building_floors is not None),
        ("building_year", listing.building_year is not None),
    )
    risk_drivers: list[ScoreDriver] = []
    _append_inverse_driver(
        risk_drivers,
        pricing_risk,
        positive_code="price_risk_low",
        negative_code="price_risk_high",
        positive_threshold=20,
        negative_threshold=45,
    )
    _append_inverse_driver(
        risk_drivers,
        market_risk,
        positive_code="market_risk_low",
        negative_code="market_risk_high",
        positive_threshold=20,
        negative_threshold=45,
    )
    _append_inverse_driver(
        risk_drivers,
        location_risk,
        positive_code="location_risk_low",
        negative_code="location_risk_high",
        positive_threshold=20,
        negative_threshold=45,
    )
    _append_inverse_driver(
        risk_drivers,
        building_risk,
        positive_code="building_risk_low",
        negative_code="building_risk_high",
        positive_threshold=15,
        negative_threshold=35,
    )
    _append_inverse_driver(
        risk_drivers,
        data_risk,
        positive_code="data_risk_low",
        negative_code="data_risk_high",
        positive_threshold=20,
        negative_threshold=40,
    )
    _append_missing_drivers(risk_drivers, risk_missing)
    risk_coverage = _weighted_coverage(
        (True, 0.27),
        (True, 0.18),
        (area_statistics.listing_metrics_available, 0.08),
        (listing.nearest_major_road_m is not None, 0.08),
        (listing.nearest_industrial_zone_m is not None, 0.08),
        (listing.nearest_stop_m is not None, 0.08),
        (listing.floor is not None, 0.035),
        (listing.building_floors is not None, 0.035),
        (listing.building_year is not None, 0.03),
        (True, 0.13),
    )

    negotiation_missing = _missing_codes(
        ("listing_market_metrics", area_statistics.listing_metrics_available),
    )
    negotiation_drivers: list[ScoreDriver] = []
    if price_delta_pct >= 5:
        negotiation_drivers.append(_driver("price_premium_leverage", "positive"))
    elif price_delta_pct <= 0:
        negotiation_drivers.append(_driver("price_position_limits_leverage", "negative"))
    if listing.days_on_market >= 60:
        negotiation_drivers.append(_driver("long_market_exposure", "positive"))
    elif listing.days_on_market <= 14:
        negotiation_drivers.append(_driver("fresh_market_entry", "negative"))
    if listing.price_reductions > 0:
        negotiation_drivers.append(_driver("price_reduction_history", "positive"))
    if listing.relisted:
        negotiation_drivers.append(_driver("relisted_listing", "positive"))
    if area_statistics.listing_metrics_available:
        if area_statistics.supply_change_90d_pct >= 5:
            negotiation_drivers.append(_driver("buyer_supply_leverage", "positive"))
        elif area_statistics.supply_change_90d_pct <= -5:
            negotiation_drivers.append(_driver("seller_supply_leverage", "negative"))
    _append_missing_drivers(negotiation_drivers, negotiation_missing)
    negotiation_coverage = _weighted_coverage(
        (True, 0.20),
        (True, 0.20),
        (True, 0.20),
        (True, 0.20),
        (area_statistics.listing_metrics_available, 0.20),
    )

    liquidity_missing = _missing_codes(
        ("listing_market_metrics", liquidity is not None),
    )
    liquidity_drivers: list[ScoreDriver] = []
    _append_threshold_driver(
        liquidity_drivers,
        liquidity,
        positive_code="liquidity_signal_strong",
        negative_code="liquidity_signal_weak",
    )
    if liquidity is not None:
        if area_statistics.average_days_on_market <= 45:
            liquidity_drivers.append(_driver("short_area_market_exposure", "positive"))
        elif area_statistics.average_days_on_market >= 90:
            liquidity_drivers.append(_driver("long_area_market_exposure", "negative"))
        supply_balance = (
            area_statistics.removed_listings_30d - area_statistics.new_listings_30d
        )
        if supply_balance >= 5:
            liquidity_drivers.append(_driver("demand_exceeds_new_supply", "positive"))
        elif supply_balance <= -5:
            liquidity_drivers.append(_driver("new_supply_exceeds_removals", "negative"))
    _append_missing_drivers(liquidity_drivers, liquidity_missing)
    liquidity_coverage = 100 if liquidity is not None else 0

    rental_missing = _missing_codes(
        (
            "rental_observations",
            rental_selection is not None and rental_selection.status != "insufficient",
        ),
        ("nearest_stop_m", listing.nearest_stop_m is not None),
    )
    rental_drivers: list[ScoreDriver] = []
    if rental_selection is not None and rental_selection.status != "insufficient":
        if rental_selection.status == "strong":
            rental_drivers.append(_driver("rental_evidence_strong", "positive"))
        else:
            rental_drivers.append(_driver("rental_evidence_limited", "unknown"))
        monthly_rent = (
            median(item.rent_per_m2_pln for item in rental_selection.items)
            * listing.area_m2
        )
        gross_yield = monthly_rent * 12 / listing.price * 100
        if gross_yield >= 5:
            rental_drivers.append(_driver("rental_yield_signal_strong", "positive"))
        elif gross_yield <= 3.5:
            rental_drivers.append(_driver("rental_yield_signal_weak", "negative"))
    _append_threshold_driver(
        rental_drivers,
        transport,
        positive_code="transport_access_strong",
        negative_code="transport_access_weak",
    )
    _append_missing_drivers(rental_drivers, rental_missing)
    rental_coverage = _weighted_coverage(
        (
            rental_selection is not None and rental_selection.status != "insufficient",
            0.85,
        ),
        (listing.nearest_stop_m is not None, 0.15),
    )
    rental_confidence = (
        "high"
        if rental_selection is not None
        and rental_selection.status == "strong"
        and rental_coverage >= 90
        else "medium"
        if rental_selection is not None and rental_selection.status != "insufficient"
        else "low"
    )

    details = [
        _score_detail(
            "investment",
            investment_score,
            investment_coverage,
            investment_drivers,
            investment_missing,
        ),
        _score_detail("risk", risk_score, risk_coverage, risk_drivers, risk_missing),
        _score_detail(
            "negotiation",
            negotiation_score,
            negotiation_coverage,
            negotiation_drivers,
            negotiation_missing,
        ),
        _score_detail(
            "liquidity",
            liquidity,
            liquidity_coverage,
            liquidity_drivers,
            liquidity_missing,
        ),
        _score_detail(
            "rental",
            rental_potential,
            rental_coverage,
            rental_drivers,
            rental_missing,
            confidence_level=rental_confidence,
        ),
    ]
    legacy_drivers: list[ScoreDriver] = []
    if price_delta_pct <= -5:
        legacy_drivers.append(_driver("price_below_area_median", "positive"))
    elif price_delta_pct >= 5:
        legacy_drivers.append(_driver("price_above_area_median", "negative"))
    if area_statistics.price_change_90d_pct > 0:
        legacy_drivers.append(_driver("area_price_trend_up", "positive"))
    elif area_statistics.price_change_90d_pct < 0:
        legacy_drivers.append(_driver("area_price_trend_down", "negative"))
    if listing.nearest_stop_m is not None and listing.nearest_stop_m <= 400:
        legacy_drivers.append(_driver("transport_access", "positive"))
    if liquidity is not None and liquidity >= 65:
        legacy_drivers.append(_driver("local_liquidity", "positive"))
    if (
        area_statistics.listing_metrics_available
        and listing.days_on_market > area_statistics.average_days_on_market * 1.5
    ):
        legacy_drivers.append(_driver("long_market_exposure", "negative"))
    if listing.price_reductions > 0:
        legacy_drivers.append(_driver("price_reduction_history", "positive"))
    infrastructure_missing = {
        code
        for code in (
            "distance_to_center_km",
            "nearest_stop_m",
            "nearest_school_m",
            "nearest_major_road_m",
            "nearest_industrial_zone_m",
            "parks_within_1km",
            "schools_within_1km",
            "planned_investments_within_2km",
        )
        if getattr(listing, code) is None
    }
    if infrastructure_missing:
        legacy_drivers.append(_driver("missing_infrastructure_data", "unknown"))
    if not market_evidence_available:
        legacy_drivers.append(_driver("comparable_sample_insufficient", "unknown"))
    if area_statistics.transaction_observation_count:
        legacy_drivers.append(_driver("rcn_transaction_baseline", "positive"))
    if rental_selection is None or rental_selection.status == "insufficient":
        legacy_drivers.append(_driver("rental_sample_insufficient", "unknown"))
    legacy_missing = set(infrastructure_missing)
    if rental_selection is None or rental_selection.status == "insufficient":
        legacy_missing.add("rental_observations")
    return ScoreExplainability(
        version=SCORE_EXPLANATION_VERSION,
        coverage_score=max(
            0,
            min(100, listing.data_quality_score - len(legacy_missing) * 5),
        ),
        drivers=_deduplicate_drivers(legacy_drivers),
        missing_data_codes=sorted(legacy_missing),
        score_details=details,
    )


def _score_detail(
    score_code: str,
    value: int | None,
    coverage_score: int,
    drivers: list[ScoreDriver],
    missing_data_codes: list[str],
    *,
    confidence_level: str | None = None,
) -> ScoreDimensionExplainability:
    status = (
        "insufficient_data"
        if value is None
        else "available"
        if coverage_score >= 90
        else "partial"
    )
    return ScoreDimensionExplainability(
        score_code=score_code,
        status=status,
        calculation_version=SCORING_FORMULA_VERSION,
        coverage_score=coverage_score,
        confidence_level=confidence_level or _confidence_level(coverage_score),
        drivers=drivers,
        missing_data_codes=missing_data_codes,
    )


def _weighted_coverage(*components: tuple[bool, float]) -> int:
    total_weight = sum(weight for _, weight in components)
    if total_weight <= 0:
        return 0
    available_weight = sum(weight for available, weight in components if available)
    return clamp(available_weight / total_weight * 100)


def _missing_codes(*items: tuple[str, bool]) -> list[str]:
    return [code for code, available in items if not available]


def _driver(code: str, direction: str) -> ScoreDriver:
    return ScoreDriver(code=code, direction=direction)


def _append_threshold_driver(
    drivers: list[ScoreDriver],
    value: int | None,
    *,
    positive_code: str,
    negative_code: str,
    positive_threshold: int = 65,
    negative_threshold: int = 40,
) -> None:
    if value is None:
        return
    if value >= positive_threshold:
        drivers.append(_driver(positive_code, "positive"))
    elif value <= negative_threshold:
        drivers.append(_driver(negative_code, "negative"))


def _append_inverse_driver(
    drivers: list[ScoreDriver],
    value: int | None,
    *,
    positive_code: str,
    negative_code: str,
    positive_threshold: int,
    negative_threshold: int,
) -> None:
    if value is None:
        return
    if value <= positive_threshold:
        drivers.append(_driver(positive_code, "positive"))
    elif value >= negative_threshold:
        drivers.append(_driver(negative_code, "negative"))


def _append_missing_drivers(drivers: list[ScoreDriver], missing_codes: list[str]) -> None:
    drivers.extend(_driver(f"missing_{code}", "unknown") for code in missing_codes)


def _deduplicate_drivers(drivers) -> list[ScoreDriver]:
    result: list[ScoreDriver] = []
    seen: set[tuple[str, str]] = set()
    for driver in drivers:
        key = (driver.code, driver.direction)
        if key in seen:
            continue
        seen.add(key)
        result.append(driver)
    return result


def build_listing_analysis(
    repository,
    listing: Listing,
    *,
    use_relevant_comparables: bool = True,
    purchase_intent: PurchaseIntent = "unsure",
) -> ListingAnalysis:
    area_statistics = repository.get_area_statistics(listing.area_id)
    if area_statistics is None:
        raise ValueError(f"Missing area statistics for {listing.area_id}")

    price_history = repository.get_price_history(listing.id)
    listing_events = repository.get_listing_events(listing.id)
    comparable_selection = (
        select_comparables(repository, listing)
        if use_relevant_comparables
        else _legacy_comparable_selection(repository, listing)
    )
    comparables = comparable_selection.items
    rental_selection = select_rental_comparables(repository, listing)
    developer_reputation = repository.get_developer_reputation_for_listing(listing.id)
    future_area_impact = build_listing_future_impact(repository, listing)
    growth_analysis = build_listing_growth_analysis(
        repository,
        listing,
        area_statistics,
        future_area_impact=future_area_impact,
    )
    scores = calculate_scores(
        listing,
        area_statistics,
        comparables,
        comparable_selection=comparable_selection,
        rental_selection=rental_selection,
    )
    if len(comparables) < 3:
        scores = scores.model_copy(
            update={
                "warnings": [
                    *scores.warnings,
                    (
                        "Brak wystarczającej liczby aktualnych ofert porównawczych; "
                        "fair-price opiera się głównie na transakcjach RCN."
                        if area_statistics.transaction_observation_count
                        else (
                            "Comparable sample is insufficient; the fair-price range is indicative."
                        )
                    ),
                ]
            }
        )
    rental_estimate = build_listing_rental_estimate(
        listing,
        scores,
        selection=rental_selection,
    )
    risk_profile = build_listing_risk_profile(
        listing=listing,
        area_statistics=area_statistics,
        scores=scores,
        developer_reputation=developer_reputation,
        future_area_impact=future_area_impact,
    )

    insights = [
        (
            f"Объект стоит {listing.price_per_m2} PLN/m2 при медиане района "
            f"{area_statistics.median_price_per_m2} PLN/m2."
        )
    ]
    if area_statistics.listing_metrics_available:
        insights.extend(
            [
                (
                    "Среднее время экспозиции в районе: "
                    f"{area_statistics.average_days_on_market} дней; этот объект на рынке "
                    f"{listing.days_on_market} дней."
                ),
                (
                    f"За 90 дней цена района изменилась на "
                    f"{area_statistics.price_change_90d_pct}%, а предложение на "
                    f"{area_statistics.supply_change_90d_pct}%."
                ),
            ]
        )

    if comparables:
        insights.append(f"Для первичного сравнения найдено {len(comparables)} похожих объекта.")
    else:
        insights.append("Похожих объектов в MVP-выборке недостаточно для сильного сравнения.")

    negotiation_arguments = []
    if (
        area_statistics.listing_metrics_available
        and listing.days_on_market > area_statistics.average_days_on_market
    ):
        negotiation_arguments.append("Объект продается дольше среднего по району.")
    if listing.price_reductions:
        negotiation_arguments.append(f"Цена снижалась {listing.price_reductions} раз(а).")
    if scores.price_delta_to_fair_mid_pct > 5:
        negotiation_arguments.append("Текущая цена выше середины расчетного fair price диапазона.")
    if area_statistics.listing_metrics_available and area_statistics.supply_change_90d_pct > 5:
        negotiation_arguments.append(
            "Предложение в районе растет, что может усиливать позицию покупателя."
        )
    if not negotiation_arguments:
        negotiation_arguments.append(
            "Сильных автоматических аргументов для торга в MVP-данных нет."
        )

    data_quality_notes = [
        f"Data Quality Score: {listing.data_quality_score}/100.",
        "Расчеты основаны на MVP-данных и требуют проверки источников перед реальной сделкой.",
        f"Comparable sample: {len(comparables)} objects; scope: {comparable_selection.scope}; "
        f"freshness window: {comparable_selection.freshness_days} days.",
        *comparable_selection.excluded_reasons,
    ]
    if rental_estimate.status == "insufficient_data":
        data_quality_notes.append(
            "Rental estimate: insufficient_data; no comparable rental observations are available."
        )
    buyer_decision = build_buyer_decision(
        listing=listing,
        area_statistics=area_statistics,
        scores=scores,
        comparables=comparables,
        data_quality_notes=data_quality_notes,
        developer_reputation=developer_reputation,
        future_area_impact=future_area_impact,
        risk_profile=risk_profile,
        rental_estimate=rental_estimate,
        purchase_intent=purchase_intent,
        comparables_scope=comparable_selection.scope,
        comparables_freshness_days=comparable_selection.freshness_days,
    )

    return ListingAnalysis(
        listing=listing,
        area_statistics=area_statistics,
        price_history=price_history,
        listing_events=listing_events,
        comparables=comparables,
        comparable_evidence=build_comparable_evidence(listing, comparables),
        developer_reputation=developer_reputation,
        future_area_impact=future_area_impact,
        growth_analysis=growth_analysis,
        risk_profile=risk_profile,
        rental_estimate=rental_estimate,
        buyer_decision=buyer_decision,
        scores=scores,
        insights=insights,
        negotiation_arguments=negotiation_arguments,
        data_quality_notes=data_quality_notes,
        comparables_scope=comparable_selection.scope,
        comparables_selection_level=comparable_selection.level,
        comparables_freshness_days=comparable_selection.freshness_days,
        comparables_excluded_reasons=comparable_selection.excluded_reasons,
        comparables_status=comparable_selection.status,
        comparables_target_sample_size=comparable_selection.target_sample_size,
        comparables_stage_counts=comparable_selection.stage_counts,
        comparables_exclusions=[
            {"code": item.code, "count": item.count} for item in comparable_selection.exclusions
        ],
        comparables_observed_from=comparable_selection.observed_from,
        comparables_observed_to=comparable_selection.observed_to,
        comparables_source_names=comparable_selection.source_names,
        disclaimer=SCORING_DISCLAIMER,
    )


def _fair_price_confidence(
    listing: Listing,
    area_statistics: AreaStatistics,
    comparables: list[Listing],
    selection: ComparableSelection | None,
) -> FairPriceConfidence:
    similarities = [
        item.similarity_score for item in build_comparable_evidence(listing, comparables)
    ]
    median_similarity = round(median(similarities)) if similarities else None
    prices = [item.price_per_m2 for item in comparables]
    dispersion = (
        round((max(prices) - min(prices)) / median(prices) * 100, 1)
        if len(prices) >= 2 and median(prices) > 0
        else None
    )
    transaction_count = area_statistics.transaction_observation_count
    sample_score = (
        100
        if len(comparables) >= 5
        else 78
        if len(comparables) >= 3
        else 62
        if transaction_count >= 30
        else 48
        if transaction_count >= 10
        else 30
        if comparables
        else 15
    )
    relevance_score = median_similarity if median_similarity is not None else 35
    level = selection.level if selection is not None else 0
    geography_score = {0: 100, 1: 88, 2: 68, 3: 52}.get(level, 25)
    freshness_score = _freshness_score(listing, selection, area_statistics)
    consistency_score = (
        90
        if dispersion is not None and dispersion <= 12
        else 70
        if dispersion is not None and dispersion <= 22
        else 35
        if dispersion is not None
        else 55
    )
    source_quality_score = (
        90
        if transaction_count >= 30
        else 78
        if transaction_count >= 10
        else 65
        if comparables
        else 25
    )
    completeness_score = listing.data_quality_score
    weighted = [
        ("sample_size", sample_score, 20),
        ("relevance", relevance_score, 20),
        ("freshness", freshness_score, 15),
        ("geographic_scope", geography_score, 15),
        ("price_consistency", consistency_score, 15),
        ("source_quality", source_quality_score, 10),
        ("property_completeness", completeness_score, 5),
    ]
    score = round(sum(value * weight for _, value, weight in weighted) / 100)
    limitations = []
    if len(comparables) < 3:
        limitations.append("comparable_sample_insufficient")
        score = min(score, 74 if transaction_count >= 10 else 49)
    if dispersion is not None and dispersion > 22:
        limitations.append("comparable_prices_inconsistent")
        score = min(score, 49)
    if level >= 2:
        limitations.append("geographic_scope_widened")
        score = min(score, 69)
    if transaction_count == 0:
        limitations.append("transaction_baseline_unavailable")
    if not comparables and transaction_count == 0:
        limitations.append("market_evidence_insufficient")
        score = min(score, 35)
    factors = [
        FairPriceConfidenceFactor(
            code=code,
            score=value,
            weight=weight,
            status="supporting" if value >= 70 else "neutral" if value >= 50 else "limiting",
        )
        for code, value, weight in weighted
    ]
    return FairPriceConfidence(
        level=_confidence_level(score),
        score=score,
        comparable_count=len(comparables),
        transaction_observation_count=transaction_count,
        median_similarity_score=median_similarity,
        price_dispersion_pct=dispersion,
        factors=factors,
        limitation_codes=limitations,
    )


def _freshness_score(
    listing: Listing,
    selection: ComparableSelection | None,
    area_statistics: AreaStatistics,
) -> int:
    if selection is not None and selection.items:
        age = max(
            0,
            (listing.last_seen_at - min(item.last_seen_at for item in selection.items)).days,
        )
        return 95 if age <= 30 else 80 if age <= 90 else 60
    if area_statistics.transaction_observed_to is not None:
        transaction_age = max(
            0,
            (listing.last_seen_at - area_statistics.transaction_observed_to.date()).days,
        )
        return 95 if transaction_age <= 30 else 80 if transaction_age <= 90 else 60
    return 30


def _fair_price_range_width(confidence: FairPriceConfidence) -> float:
    base = {"high": 0.06, "medium": 0.10, "low": 0.15}[confidence.level]
    if confidence.price_dispersion_pct is None:
        return base
    return max(base, min(0.20, confidence.price_dispersion_pct / 200))


def _round_price(value: float, *, direction: str = "nearest") -> int:
    step = 5_000
    if direction == "down":
        return floor(value / step) * step
    if direction == "up":
        return ceil(value / step) * step
    return round(value / step) * step


def _confidence_level(score: int) -> str:
    if score >= 75:
        return "high"
    if score >= 50:
        return "medium"
    return "low"


def _cap_fair_price_confidence(
    confidence: FairPriceConfidence,
    cap: int,
    limitation_code: str,
) -> FairPriceConfidence:
    score = min(confidence.score, cap)
    return confidence.model_copy(
        update={
            "score": score,
            "level": _confidence_level(score),
            "limitation_codes": [*confidence.limitation_codes, limitation_code],
        }
    )


def _decision_label(
    investment_score: int,
    risk_score: int,
    price_delta_to_fair_mid_pct: float,
    negotiation_score: int,
) -> str:
    if risk_score >= 70:
        return "risky"
    if price_delta_to_fair_mid_pct >= 12 and investment_score < 65:
        return "overpriced"
    if investment_score >= 75 and risk_score <= 35 and price_delta_to_fair_mid_pct <= 5:
        return "strong_candidate"
    if investment_score >= 62 and risk_score <= 50:
        return "good_option"
    if negotiation_score >= 70 and price_delta_to_fair_mid_pct > 5:
        return "overpriced"
    if investment_score < 45 or risk_score >= 60:
        return "weak_fit"
    return "fair_option"


def _price_label(price_delta_to_fair_mid_pct: float) -> str:
    if price_delta_to_fair_mid_pct <= -6:
        return "below_fair"
    if price_delta_to_fair_mid_pct >= 12:
        return "overpriced"
    if price_delta_to_fair_mid_pct >= 5:
        return "above_fair"
    return "fair"


def _risk_label(risk_score: int) -> str:
    if risk_score >= 70:
        return "high_risk"
    if risk_score >= 50:
        return "elevated_risk"
    if risk_score >= 30:
        return "moderate_risk"
    return "low_risk"


def _negotiation_label(negotiation_score: int) -> str:
    if negotiation_score >= 75:
        return "strong_negotiation"
    if negotiation_score >= 55:
        return "negotiable"
    if negotiation_score >= 35:
        return "some_negotiation"
    return "weak_negotiation"


def _potential_label(score: int | None) -> str:
    if score is None:
        return "unknown"
    if score >= 75:
        return "strong"
    if score >= 60:
        return "good"
    if score >= 40:
        return "moderate"
    return "weak"


def _override_dataclass(instance, payload: Any, section: str):
    if payload is None:
        return instance
    if not isinstance(payload, dict):
        raise ScoringConfigurationError(f"Scoring weights section '{section}' must be an object")
    allowed_keys = set(instance.__dataclass_fields__)
    unknown_keys = set(payload) - allowed_keys
    if unknown_keys:
        raise ScoringConfigurationError(
            f"Unknown scoring weights in '{section}': {', '.join(sorted(unknown_keys))}"
        )
    overrides = {key: _to_float(value, f"{section}.{key}") for key, value in payload.items()}
    return replace(instance, **overrides)


def _optional_float(payload: dict[str, Any], key: str, default: float) -> float:
    if key not in payload:
        return default
    return _to_float(payload[key], key)


def _to_float(value: Any, key: str) -> float:
    if isinstance(value, bool):
        raise ScoringConfigurationError(f"Scoring weight '{key}' must be numeric")
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise ScoringConfigurationError(f"Scoring weight '{key}' must be numeric") from exc
