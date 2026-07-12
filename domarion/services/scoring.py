import json
from dataclasses import asdict, dataclass, field, replace
from functools import lru_cache
from hashlib import sha256
from statistics import median
from typing import Any

from domarion.core import get_settings
from domarion.schemas import (
    AreaStatistics,
    Listing,
    ListingAnalysis,
    PropertyScores,
    ScoreBreakdown,
)


class ScoringConfigurationError(ValueError):
    pass


SCORING_FORMULA_VERSION = "domarion-scoring-v1"
DEFAULT_SCORING_WEIGHTS_PROFILE = "default-v1"


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


def calculate_scores(
    listing: Listing,
    area_statistics: AreaStatistics,
    comparables: list[Listing],
    weights: ScoringWeights | None = None,
) -> PropertyScores:
    weights = weights or get_scoring_weights()
    median_price = area_statistics.median_price_per_m2
    price_delta_pct = ((listing.price_per_m2 / median_price) - 1) * 100

    comparable_prices = [item.price_per_m2 for item in comparables] or [median_price]
    comparable_median = int(median(comparable_prices))
    fair_price_mid = int(
        (
            (median_price * weights.fair_price.area_median)
            + (comparable_median * weights.fair_price.comparable_median)
        )
        * listing.area_m2
    )
    fair_price_low = int(fair_price_mid * 0.94)
    fair_price_high = int(fair_price_mid * 1.06)
    fair_price_confidence_score = _fair_price_confidence_score(
        listing,
        area_statistics,
        comparables,
    )
    price_delta_to_fair_mid_pct = ((listing.price / fair_price_mid) - 1) * 100

    price_position = clamp(70 - price_delta_pct * 2.2)
    area_trend = clamp(50 + area_statistics.price_change_90d_pct * 6)
    transport = clamp(100 - max(0, listing.nearest_stop_m - 200) / 8)
    future_infrastructure = clamp(45 + listing.planned_investments_within_2km * 13)
    liquidity = clamp(
        100
        - area_statistics.average_days_on_market * 0.45
        + max(0, area_statistics.removed_listings_30d - area_statistics.new_listings_30d) * 0.2
    )
    lifestyle_infrastructure = clamp(
        35
        + listing.schools_within_1km * 12
        + listing.parks_within_1km * 10
        - max(0, listing.nearest_school_m - 700) / 20
    )
    rental_potential = clamp(
        55
        + (100 - min(listing.nearest_stop_m, 1000) / 10) * 0.25
        + listing.schools_within_1km * 3
        - max(0, listing.distance_to_center_km - 6) * 2.5
    )

    pricing_risk = clamp(max(0, price_delta_pct) * 3.5)
    market_risk = clamp(
        listing.days_on_market * 0.28
        + listing.price_reductions * 8
        + max(0, area_statistics.supply_change_90d_pct) * 1.3
    )
    location_risk = clamp(
        max(0, 700 - listing.nearest_major_road_m) / 12
        + max(0, 1500 - listing.nearest_industrial_zone_m) / 25
        + max(0, listing.nearest_stop_m - 700) / 8
    )
    building_risk = clamp(
        (15 if listing.floor == 0 else 0)
        + (12 if listing.building_floors and listing.floor == listing.building_floors else 0)
        + (10 if listing.building_year and listing.building_year < 1980 else 0)
    )
    data_risk = clamp(100 - listing.data_quality_score)
    risk_score = clamp(
        pricing_risk * weights.risk.pricing
        + market_risk * weights.risk.market
        + location_risk * weights.risk.location
        + building_risk * weights.risk.building
        + data_risk * weights.risk.data_quality
    )

    risk_penalty = clamp(risk_score * weights.risk_penalty_multiplier)
    investment_score = clamp(
        price_position * weights.investment.price_position
        + area_trend * weights.investment.area_trend
        + transport * weights.investment.transport
        + future_infrastructure * weights.investment.future_infrastructure
        + liquidity * weights.investment.liquidity
        + lifestyle_infrastructure * weights.investment.lifestyle_infrastructure
        + rental_potential * weights.investment.rental_potential
        + listing.data_quality_score * weights.investment.data_quality
        - risk_penalty * weights.investment.risk_penalty
    )

    negotiation_score = clamp(
        20
        + listing.days_on_market * 0.35
        + listing.price_reductions * 12
        + max(0, price_delta_pct) * 2
        + (12 if listing.relisted else 0)
        + max(0, area_statistics.supply_change_90d_pct) * 1.2
    )

    reasons = []
    warnings = []

    if price_delta_pct < -5:
        reasons.append("Цена за m2 ниже медианы района.")
    if listing.planned_investments_within_2km >= 2:
        reasons.append("Рядом есть несколько planned investments в радиусе 2 км.")
    if listing.nearest_stop_m <= 400:
        reasons.append("Хорошая транспортная доступность по расстоянию до остановки.")
    if listing.price_reductions > 0:
        reasons.append("Цена уже снижалась, это усиливает переговорную позицию.")

    if price_delta_pct > 10:
        warnings.append("Цена за m2 заметно выше медианы района.")
    if listing.days_on_market > area_statistics.average_days_on_market * 1.5:
        warnings.append("Объект находится на рынке существенно дольше среднего по району.")
    if listing.nearest_industrial_zone_m < 1500:
        warnings.append("Промышленная зона находится относительно близко.")
    if listing.data_quality_score < 70:
        warnings.append("Качество данных ниже желательного уровня, выводы нужно перепроверить.")

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
    )


def build_listing_analysis(repository, listing: Listing) -> ListingAnalysis:
    area_statistics = repository.get_area_statistics(listing.area_id)
    if area_statistics is None:
        raise ValueError(f"Missing area statistics for {listing.area_id}")

    price_history = repository.get_price_history(listing.id)
    listing_events = repository.get_listing_events(listing.id)
    comparables = repository.find_comparables(listing)
    scores = calculate_scores(listing, area_statistics, comparables)

    insights = [
        (
            f"Объект стоит {listing.price_per_m2} PLN/m2 при медиане района "
            f"{area_statistics.median_price_per_m2} PLN/m2."
        ),
        (
            f"Среднее время экспозиции в районе: {area_statistics.average_days_on_market} дней; "
            f"этот объект на рынке {listing.days_on_market} дней."
        ),
        (
            f"За 90 дней цена района изменилась на {area_statistics.price_change_90d_pct}%, "
            f"а предложение на {area_statistics.supply_change_90d_pct}%."
        ),
    ]

    if comparables:
        insights.append(f"Для первичного сравнения найдено {len(comparables)} похожих объекта.")
    else:
        insights.append("Похожих объектов в MVP-выборке недостаточно для сильного сравнения.")

    negotiation_arguments = []
    if listing.days_on_market > area_statistics.average_days_on_market:
        negotiation_arguments.append("Объект продается дольше среднего по району.")
    if listing.price_reductions:
        negotiation_arguments.append(f"Цена снижалась {listing.price_reductions} раз(а).")
    if scores.price_delta_to_fair_mid_pct > 5:
        negotiation_arguments.append("Текущая цена выше середины расчетного fair price диапазона.")
    if area_statistics.supply_change_90d_pct > 5:
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
    ]

    return ListingAnalysis(
        listing=listing,
        area_statistics=area_statistics,
        price_history=price_history,
        listing_events=listing_events,
        comparables=comparables,
        scores=scores,
        insights=insights,
        negotiation_arguments=negotiation_arguments,
        data_quality_notes=data_quality_notes,
    )


def _fair_price_confidence_score(
    listing: Listing,
    area_statistics: AreaStatistics,
    comparables: list[Listing],
) -> int:
    return clamp(
        listing.data_quality_score * 0.35
        + min(len(comparables), 5) * 8
        + min(area_statistics.active_listings, 80) * 0.25
        + (10 if area_statistics.median_price_per_m2 > 0 else 0)
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


def _potential_label(score: int) -> str:
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
