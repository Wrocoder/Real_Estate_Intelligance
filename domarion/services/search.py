from math import asin, ceil, cos, radians, sin, sqrt
from typing import Any

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    ListingAnalysis,
    ListingSearchResponse,
    ListingSort,
    MarketType,
)
from domarion.services.listing_text_search import listing_matches_query
from domarion.services.scoring import build_listing_analysis


class ListingSearchError(ValueError):
    pass


def search_listing_analyses(
    repository: RealEstateRepository,
    *,
    city: str | None = None,
    district: str | None = None,
    query: str | None = None,
    rooms: int | None = None,
    market_type: MarketType | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    min_price_per_m2: int | None = None,
    max_price_per_m2: int | None = None,
    min_area_m2: float | None = None,
    max_area_m2: float | None = None,
    max_days_on_market: int | None = None,
    max_distance_to_center_km: float | None = None,
    max_nearest_stop_m: int | None = None,
    max_nearest_school_m: int | None = None,
    min_nearest_major_road_m: int | None = None,
    min_nearest_industrial_zone_m: int | None = None,
    min_investment_score: int | None = None,
    max_risk_score: int | None = None,
    min_negotiation_score: int | None = None,
    min_liquidity_score: int | None = None,
    min_rental_potential_score: int | None = None,
    min_data_quality_score: int | None = None,
    lat: float | None = None,
    lon: float | None = None,
    radius_km: float | None = None,
    sort: ListingSort = "investment_score_desc",
    page: int = 1,
    page_size: int = 20,
) -> ListingSearchResponse:
    if radius_km is not None and (lat is None or lon is None):
        raise ListingSearchError("radius_km requires lat and lon")

    listings = repository.list_listings(
        city=city,
        district=district,
        rooms=rooms,
        max_price=max_price,
        min_area_m2=min_area_m2,
        lat=lat,
        lon=lon,
        radius_km=radius_km,
    )

    analyses: list[ListingAnalysis] = []
    skipped_missing_area = 0
    for listing in listings:
        if not _matches_listing_filters(
            listing,
            query=query,
            market_type=market_type,
            min_price=min_price,
            min_price_per_m2=min_price_per_m2,
            max_price_per_m2=max_price_per_m2,
            max_area_m2=max_area_m2,
            max_days_on_market=max_days_on_market,
            max_distance_to_center_km=max_distance_to_center_km,
            max_nearest_stop_m=max_nearest_stop_m,
            max_nearest_school_m=max_nearest_school_m,
            min_nearest_major_road_m=min_nearest_major_road_m,
            min_nearest_industrial_zone_m=min_nearest_industrial_zone_m,
            min_data_quality_score=min_data_quality_score,
            lat=lat,
            lon=lon,
            radius_km=radius_km,
        ):
            continue

        try:
            analysis = build_listing_analysis(repository, listing)
        except ValueError:
            skipped_missing_area += 1
            continue

        if not _matches_score_filters(
            analysis,
            min_investment_score=min_investment_score,
            max_risk_score=max_risk_score,
            min_negotiation_score=min_negotiation_score,
            min_liquidity_score=min_liquidity_score,
            min_rental_potential_score=min_rental_potential_score,
        ):
            continue

        analyses.append(analysis)

    sorted_items = sorted(
        analyses,
        key=lambda analysis: _sort_key(analysis, sort),
        reverse=_sort_descending(sort),
    )
    total = len(sorted_items)
    total_pages = ceil(total / page_size) if total else 0
    start = (page - 1) * page_size
    end = start + page_size

    return ListingSearchResponse(
        items=sorted_items[start:end],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        sort=sort,
        filters={
            "city": city,
            "district": district,
            "query": query,
            "rooms": rooms,
            "market_type": market_type,
            "min_price": min_price,
            "max_price": max_price,
            "min_price_per_m2": min_price_per_m2,
            "max_price_per_m2": max_price_per_m2,
            "min_area_m2": min_area_m2,
            "max_area_m2": max_area_m2,
            "max_days_on_market": max_days_on_market,
            "max_distance_to_center_km": max_distance_to_center_km,
            "max_nearest_stop_m": max_nearest_stop_m,
            "max_nearest_school_m": max_nearest_school_m,
            "min_nearest_major_road_m": min_nearest_major_road_m,
            "min_nearest_industrial_zone_m": min_nearest_industrial_zone_m,
            "min_investment_score": min_investment_score,
            "max_risk_score": max_risk_score,
            "min_negotiation_score": min_negotiation_score,
            "min_liquidity_score": min_liquidity_score,
            "min_rental_potential_score": min_rental_potential_score,
            "min_data_quality_score": min_data_quality_score,
            "center": (lon, lat) if lat is not None and lon is not None else None,
            "radius_km": radius_km,
            "skipped_missing_area": skipped_missing_area,
        },
    )


def _matches_listing_filters(
    listing,
    *,
    query: str | None,
    market_type: MarketType | None,
    min_price: int | None,
    min_price_per_m2: int | None,
    max_price_per_m2: int | None,
    max_area_m2: float | None,
    max_days_on_market: int | None,
    max_distance_to_center_km: float | None,
    max_nearest_stop_m: int | None,
    max_nearest_school_m: int | None,
    min_nearest_major_road_m: int | None,
    min_nearest_industrial_zone_m: int | None,
    min_data_quality_score: int | None,
    lat: float | None,
    lon: float | None,
    radius_km: float | None,
) -> bool:
    if not listing_matches_query(listing, query):
        return False
    if market_type is not None and listing.market_type != market_type:
        return False
    if min_price is not None and listing.price < min_price:
        return False
    if min_price_per_m2 is not None and listing.price_per_m2 < min_price_per_m2:
        return False
    if max_price_per_m2 is not None and listing.price_per_m2 > max_price_per_m2:
        return False
    if max_area_m2 is not None and listing.area_m2 > max_area_m2:
        return False
    if max_days_on_market is not None and listing.days_on_market > max_days_on_market:
        return False
    if (
        max_distance_to_center_km is not None
        and listing.distance_to_center_km > max_distance_to_center_km
    ):
        return False
    if max_nearest_stop_m is not None and listing.nearest_stop_m > max_nearest_stop_m:
        return False
    if max_nearest_school_m is not None and listing.nearest_school_m > max_nearest_school_m:
        return False
    if (
        min_nearest_major_road_m is not None
        and listing.nearest_major_road_m < min_nearest_major_road_m
    ):
        return False
    if (
        min_nearest_industrial_zone_m is not None
        and listing.nearest_industrial_zone_m < min_nearest_industrial_zone_m
    ):
        return False
    if min_data_quality_score is not None and listing.data_quality_score < min_data_quality_score:
        return False
    if (
        radius_km is not None
        and _haversine_km(lat or 0, lon or 0, listing.lat, listing.lon) > radius_km
    ):
        return False
    return True


def _matches_score_filters(
    analysis: ListingAnalysis,
    *,
    min_investment_score: int | None,
    max_risk_score: int | None,
    min_negotiation_score: int | None,
    min_liquidity_score: int | None,
    min_rental_potential_score: int | None,
) -> bool:
    scores = analysis.scores
    if min_investment_score is not None and scores.investment_score < min_investment_score:
        return False
    if max_risk_score is not None and scores.risk_score > max_risk_score:
        return False
    if min_negotiation_score is not None and scores.negotiation_score < min_negotiation_score:
        return False
    if min_liquidity_score is not None and scores.liquidity_score < min_liquidity_score:
        return False
    if (
        min_rental_potential_score is not None
        and scores.rental_potential_score < min_rental_potential_score
    ):
        return False
    return True


def _sort_key(analysis: ListingAnalysis, sort: ListingSort) -> tuple[Any, str]:
    listing = analysis.listing
    scores = analysis.scores
    value: Any
    match sort:
        case "price_asc" | "price_desc":
            value = listing.price
        case "price_per_m2_asc" | "price_per_m2_desc":
            value = listing.price_per_m2
        case "investment_score_asc" | "investment_score_desc":
            value = scores.investment_score
        case "risk_score_asc" | "risk_score_desc":
            value = scores.risk_score
        case "negotiation_score_asc" | "negotiation_score_desc":
            value = scores.negotiation_score
        case "days_on_market_asc" | "days_on_market_desc":
            value = listing.days_on_market
        case "newest" | "oldest":
            value = listing.first_seen_at
    return value, listing.id


def _sort_descending(sort: ListingSort) -> bool:
    return sort in {
        "price_desc",
        "price_per_m2_desc",
        "investment_score_desc",
        "risk_score_desc",
        "negotiation_score_desc",
        "days_on_market_desc",
        "newest",
    }


def _haversine_km(lat_1: float, lon_1: float, lat_2: float, lon_2: float) -> float:
    radius = 6371.0
    delta_lat = radians(lat_2 - lat_1)
    delta_lon = radians(lon_2 - lon_1)
    a = (
        sin(delta_lat / 2) ** 2
        + cos(radians(lat_1)) * cos(radians(lat_2)) * sin(delta_lon / 2) ** 2
    )
    return 2 * radius * asin(sqrt(a))
