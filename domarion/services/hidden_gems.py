from math import ceil
from typing import Any

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import HiddenGemItem, HiddenGemsResponse, ListingAnalysis, MarketType
from domarion.services.scoring import build_listing_analysis

DEFAULT_MAX_PRICE_DELTA_TO_FAIR_MID_PCT = 5.0
DEFAULT_MIN_INVESTMENT_SCORE = 55
DEFAULT_MAX_RISK_SCORE = 60
DEFAULT_MIN_LIQUIDITY_SCORE = 40
DEFAULT_MIN_RENTAL_POTENTIAL_SCORE = 40
DEFAULT_MIN_DATA_QUALITY_SCORE = 60


def find_hidden_gems(
    repository: RealEstateRepository,
    *,
    city: str | None = None,
    district: str | None = None,
    rooms: int | None = None,
    market_type: MarketType | None = None,
    max_price: int | None = None,
    min_area_m2: float | None = None,
    max_distance_to_center_km: float | None = None,
    max_nearest_stop_m: int | None = None,
    max_nearest_school_m: int | None = None,
    min_nearest_major_road_m: int | None = None,
    min_nearest_industrial_zone_m: int | None = None,
    max_price_delta_to_fair_mid_pct: float = DEFAULT_MAX_PRICE_DELTA_TO_FAIR_MID_PCT,
    min_investment_score: int = DEFAULT_MIN_INVESTMENT_SCORE,
    max_risk_score: int = DEFAULT_MAX_RISK_SCORE,
    min_liquidity_score: int = DEFAULT_MIN_LIQUIDITY_SCORE,
    min_rental_potential_score: int = DEFAULT_MIN_RENTAL_POTENTIAL_SCORE,
    min_data_quality_score: int = DEFAULT_MIN_DATA_QUALITY_SCORE,
    page: int = 1,
    page_size: int = 20,
) -> HiddenGemsResponse:
    listings = repository.list_listings(
        city=city,
        district=district,
        rooms=rooms,
        max_price=max_price,
        min_area_m2=min_area_m2,
    )

    items: list[HiddenGemItem] = []
    skipped_missing_area = 0
    for listing in listings:
        if market_type is not None and listing.market_type != market_type:
            continue
        if listing.data_quality_score < min_data_quality_score:
            continue
        if (
            max_distance_to_center_km is not None
            and listing.distance_to_center_km > max_distance_to_center_km
        ):
            continue
        if max_nearest_stop_m is not None and listing.nearest_stop_m > max_nearest_stop_m:
            continue
        if max_nearest_school_m is not None and listing.nearest_school_m > max_nearest_school_m:
            continue
        if (
            min_nearest_major_road_m is not None
            and listing.nearest_major_road_m < min_nearest_major_road_m
        ):
            continue
        if (
            min_nearest_industrial_zone_m is not None
            and listing.nearest_industrial_zone_m < min_nearest_industrial_zone_m
        ):
            continue

        try:
            analysis = build_listing_analysis(repository, listing)
        except ValueError:
            skipped_missing_area += 1
            continue

        scores = analysis.scores
        if scores.price_delta_to_fair_mid_pct > max_price_delta_to_fair_mid_pct:
            continue
        if scores.investment_score < min_investment_score:
            continue
        if scores.risk_score > max_risk_score:
            continue
        if scores.liquidity_score < min_liquidity_score:
            continue
        if scores.rental_potential_score < min_rental_potential_score:
            continue

        items.append(
            HiddenGemItem(
                analysis=analysis,
                gem_score=_gem_score(analysis),
                price_delta_to_fair_mid_pct=scores.price_delta_to_fair_mid_pct,
                estimated_discount_to_fair_mid_pln=max(listing.price - scores.fair_price_mid, 0),
                signals=_signals(analysis),
            )
        )

    sorted_items = sorted(
        items,
        key=lambda item: (
            -item.gem_score,
            item.price_delta_to_fair_mid_pct,
            item.analysis.scores.risk_score,
            item.analysis.listing.price,
            item.analysis.listing.id,
        ),
    )
    total = len(sorted_items)
    total_pages = ceil(total / page_size) if total else 0
    start = (page - 1) * page_size
    end = start + page_size

    return HiddenGemsResponse(
        items=sorted_items[start:end],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        filters=_filters_payload(
            city=city,
            district=district,
            rooms=rooms,
            market_type=market_type,
            max_price=max_price,
            min_area_m2=min_area_m2,
            max_distance_to_center_km=max_distance_to_center_km,
            max_nearest_stop_m=max_nearest_stop_m,
            max_nearest_school_m=max_nearest_school_m,
            min_nearest_major_road_m=min_nearest_major_road_m,
            min_nearest_industrial_zone_m=min_nearest_industrial_zone_m,
            max_price_delta_to_fair_mid_pct=max_price_delta_to_fair_mid_pct,
            min_investment_score=min_investment_score,
            max_risk_score=max_risk_score,
            min_liquidity_score=min_liquidity_score,
            min_rental_potential_score=min_rental_potential_score,
            min_data_quality_score=min_data_quality_score,
            skipped_missing_area=skipped_missing_area,
        ),
    )


def _gem_score(analysis: ListingAnalysis) -> int:
    scores = analysis.scores
    discount_signal = _clamp((5 - scores.price_delta_to_fair_mid_pct) * 2.4, 0, 35)
    value = (
        scores.investment_score * 0.30
        + (100 - scores.risk_score) * 0.18
        + scores.negotiation_score * 0.16
        + scores.liquidity_score * 0.16
        + scores.rental_potential_score * 0.12
        + analysis.listing.data_quality_score * 0.08
        + discount_signal
    )
    return round(_clamp(value, 0, 100))


def _signals(analysis: ListingAnalysis) -> list[str]:
    listing = analysis.listing
    scores = analysis.scores
    signals: list[str] = []

    if scores.price_delta_to_fair_mid_pct < 0:
        signals.append(
            f"{abs(scores.price_delta_to_fair_mid_pct):.1f}% below model fair price."
        )
    elif scores.price_delta_to_fair_mid_pct <= 5:
        signals.append("At or near model fair price.")

    if scores.negotiation_score >= 60:
        signals.append("Negotiation leverage is above average.")
    if scores.liquidity_score >= 60:
        signals.append("Liquidity signal is healthy.")
    if scores.rental_potential_score >= 60:
        signals.append("Rental potential is above average.")
    if scores.risk_score <= 40:
        signals.append("Risk score is within a conservative range.")
    if listing.days_on_market >= 30:
        signals.append("Longer exposure may support negotiation.")

    return signals[:5] or ["Matches hidden-gem thresholds."]


def _filters_payload(**values: Any) -> dict[str, Any]:
    return {key: value for key, value in values.items() if value is not None}


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(value, high))
