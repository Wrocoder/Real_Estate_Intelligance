from math import ceil
from typing import Any

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import HiddenGemItem, HiddenGemsResponse, ListingAnalysis, MarketType
from domarion.services.building_filters import matches_building_filters
from domarion.services.developer_filters import matches_developer_reputation_filters
from domarion.services.lifestyle_filters import matches_lifestyle_filters
from domarion.services.listing_text_search import listing_matches_query
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
    voivodeship: str | None = None,
    city: str | None = None,
    district: str | None = None,
    municipality: str | None = None,
    query: str | None = None,
    rooms: int | None = None,
    market_type: MarketType | None = None,
    max_price: int | None = None,
    min_area_m2: float | None = None,
    building_type: str | None = None,
    renovation_state: str | None = None,
    has_balcony: bool | None = None,
    has_terrace: bool | None = None,
    has_garden: bool | None = None,
    has_elevator: bool | None = None,
    parking_type: str | None = None,
    heating_type: str | None = None,
    min_floor: int | None = None,
    max_floor: int | None = None,
    max_building_floors: int | None = None,
    min_building_year: int | None = None,
    max_building_year: int | None = None,
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
    min_developer_reputation_score: int | None = None,
    min_developer_confidence_score: int | None = None,
    min_developer_completed_projects: int | None = None,
    min_developer_active_projects: int | None = None,
    require_developer_reputation: bool = False,
    exclude_developer_risk_signals: bool = False,
    page: int = 1,
    page_size: int = 20,
) -> HiddenGemsResponse:
    listings = repository.list_listings(
        voivodeship=voivodeship,
        city=city,
        district=district,
        municipality=municipality,
        rooms=rooms,
        max_price=max_price,
        min_area_m2=min_area_m2,
    )

    items: list[HiddenGemItem] = []
    skipped_missing_area = 0
    for listing in listings:
        if not listing_matches_query(listing, query):
            continue
        if market_type is not None and listing.market_type != market_type:
            continue
        if not matches_building_filters(
            listing,
            building_type=building_type,
            renovation_state=renovation_state,
            min_floor=min_floor,
            max_floor=max_floor,
            max_building_floors=max_building_floors,
            min_building_year=min_building_year,
            max_building_year=max_building_year,
        ):
            continue
        if not matches_lifestyle_filters(
            listing,
            has_balcony=has_balcony,
            has_terrace=has_terrace,
            has_garden=has_garden,
            has_elevator=has_elevator,
            parking_type=parking_type,
            heating_type=heating_type,
        ):
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
        if not matches_developer_reputation_filters(
            analysis,
            min_developer_reputation_score=min_developer_reputation_score,
            min_developer_confidence_score=min_developer_confidence_score,
            min_developer_completed_projects=min_developer_completed_projects,
            min_developer_active_projects=min_developer_active_projects,
            require_developer_reputation=require_developer_reputation,
            exclude_developer_risk_signals=exclude_developer_risk_signals,
        ):
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
            municipality=municipality,
            voivodeship=voivodeship,
            query=query,
            rooms=rooms,
            market_type=market_type,
            max_price=max_price,
            min_area_m2=min_area_m2,
            building_type=building_type,
            renovation_state=renovation_state,
            has_balcony=has_balcony,
            has_terrace=has_terrace,
            has_garden=has_garden,
            has_elevator=has_elevator,
            parking_type=parking_type,
            heating_type=heating_type,
            min_floor=min_floor,
            max_floor=max_floor,
            max_building_floors=max_building_floors,
            min_building_year=min_building_year,
            max_building_year=max_building_year,
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
            min_developer_reputation_score=min_developer_reputation_score,
            min_developer_confidence_score=min_developer_confidence_score,
            min_developer_completed_projects=min_developer_completed_projects,
            min_developer_active_projects=min_developer_active_projects,
            require_developer_reputation=require_developer_reputation,
            exclude_developer_risk_signals=exclude_developer_risk_signals,
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
