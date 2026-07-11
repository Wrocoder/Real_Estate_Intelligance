from math import asin, cos, radians, sin, sqrt
from typing import Any

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import Listing, MapFeature, MapFeatureCollection, MapPointGeometry
from domarion.schemas import PlannedInvestment as PlannedInvestmentSchema
from domarion.services.scoring import build_listing_analysis

BBox = tuple[float, float, float, float]
WROCLAW_CENTER = (17.0385, 51.1079)


class MapQueryError(ValueError):
    pass


def parse_bbox(raw_bbox: str | None) -> BBox | None:
    if raw_bbox is None:
        return None

    try:
        values = tuple(float(part.strip()) for part in raw_bbox.split(","))
    except ValueError as exc:
        raise MapQueryError("bbox must contain four numeric values") from exc

    if len(values) != 4:
        raise MapQueryError("bbox must use format min_lon,min_lat,max_lon,max_lat")

    min_lon, min_lat, max_lon, max_lat = values
    if min_lon >= max_lon or min_lat >= max_lat:
        raise MapQueryError("bbox min values must be smaller than max values")
    if not (-180 <= min_lon <= 180 and -180 <= max_lon <= 180):
        raise MapQueryError("bbox longitude values must be between -180 and 180")
    if not (-90 <= min_lat <= 90 and -90 <= max_lat <= 90):
        raise MapQueryError("bbox latitude values must be between -90 and 90")

    return min_lon, min_lat, max_lon, max_lat


def build_map_feature_collection(
    repository: RealEstateRepository,
    *,
    city: str | None = None,
    district: str | None = None,
    rooms: int | None = None,
    max_price: int | None = None,
    min_area_m2: float | None = None,
    bbox: BBox | None = None,
    lat: float | None = None,
    lon: float | None = None,
    radius_km: float | None = None,
    min_investment_score: int | None = None,
    max_risk_score: int | None = None,
) -> MapFeatureCollection:
    if radius_km is not None and (lat is None or lon is None):
        raise MapQueryError("radius_km requires lat and lon")

    listings = repository.list_listings(
        city=city,
        district=district,
        rooms=rooms,
        max_price=max_price,
        min_area_m2=min_area_m2,
    )
    planned_investments = repository.list_planned_investments(city=city, district=district)

    features: list[MapFeature] = []
    skipped_listings = 0

    for listing in listings:
        if not _is_inside_spatial_window(listing.lat, listing.lon, bbox, lat, lon, radius_km):
            continue

        try:
            analysis = build_listing_analysis(repository, listing)
        except ValueError:
            skipped_listings += 1
            continue

        scores = analysis.scores
        if min_investment_score is not None and scores.investment_score < min_investment_score:
            continue
        if max_risk_score is not None and scores.risk_score > max_risk_score:
            continue

        features.append(_listing_to_feature(listing, scores.model_dump(mode="json")))

    for investment in planned_investments:
        if not _is_inside_spatial_window(
            investment.lat,
            investment.lon,
            bbox,
            lat,
            lon,
            radius_km,
        ):
            continue
        features.append(_planned_investment_to_feature(investment))

    listing_count = sum(
        1 for feature in features if feature.properties["feature_type"] == "listing"
    )
    planned_count = sum(
        1 for feature in features if feature.properties["feature_type"] == "planned_investment"
    )

    return MapFeatureCollection(
        features=features,
        bbox=_calculate_bbox(features),
        metadata={
            "listing_count": listing_count,
            "planned_investment_count": planned_count,
            "skipped_listings": skipped_listings,
            "filters": {
                "city": city,
                "district": district,
                "rooms": rooms,
                "max_price": max_price,
                "min_area_m2": min_area_m2,
                "bbox": bbox,
                "center": (lon, lat) if lat is not None and lon is not None else None,
                "radius_km": radius_km,
                "min_investment_score": min_investment_score,
                "max_risk_score": max_risk_score,
            },
        },
    )


def _listing_to_feature(listing: Listing, scores: dict[str, Any]) -> MapFeature:
    properties: dict[str, Any] = {
        "feature_type": "listing",
        "listing_id": listing.id,
        "title": listing.title,
        "source_name": listing.source_name,
        "source_url": listing.source_url,
        "city": listing.city,
        "district": listing.district,
        "address": listing.address,
        "market_type": listing.market_type,
        "price": listing.price,
        "price_label": _compact_price(listing.price),
        "area_m2": listing.area_m2,
        "rooms": listing.rooms,
        "price_per_m2": listing.price_per_m2,
        "days_on_market": listing.days_on_market,
        "price_reductions": listing.price_reductions,
        "nearest_stop_m": listing.nearest_stop_m,
        "nearest_school_m": listing.nearest_school_m,
        "nearest_industrial_zone_m": listing.nearest_industrial_zone_m,
        "planned_investments_within_2km": listing.planned_investments_within_2km,
        "data_quality_score": listing.data_quality_score,
        "growth_class": _growth_class(scores["investment_score"]),
        "risk_class": _risk_class(scores["risk_score"]),
    }
    properties.update(
        {
            "investment_score": scores["investment_score"],
            "risk_score": scores["risk_score"],
            "negotiation_score": scores["negotiation_score"],
            "liquidity_score": scores["liquidity_score"],
            "rental_potential_score": scores["rental_potential_score"],
            "fair_price_mid": scores["fair_price_mid"],
            "fair_price_confidence_score": scores["fair_price_confidence_score"],
            "price_delta_to_fair_mid_pct": scores["price_delta_to_fair_mid_pct"],
        }
    )

    return MapFeature(
        id=f"listing-{listing.id}",
        geometry=MapPointGeometry(coordinates=(listing.lon, listing.lat)),
        properties=properties,
    )


def _planned_investment_to_feature(investment: PlannedInvestmentSchema) -> MapFeature:
    return MapFeature(
        id=f"planned-investment-{investment.id}",
        geometry=MapPointGeometry(coordinates=(investment.lon, investment.lat)),
        properties={
            "feature_type": "planned_investment",
            "investment_id": investment.id,
            "name": investment.name,
            "investment_type": investment.investment_type,
            "status": investment.status,
            "city": investment.city,
            "district": investment.district,
            "expected_year": investment.expected_year,
            "source_url": investment.source_url,
            "confidence_score": investment.confidence_score,
            "notes": investment.notes,
            "growth_impact": _investment_growth_impact(investment),
        },
    )


def _is_inside_spatial_window(
    lat: float,
    lon: float,
    bbox: BBox | None,
    center_lat: float | None,
    center_lon: float | None,
    radius_km: float | None,
) -> bool:
    if bbox is not None:
        min_lon, min_lat, max_lon, max_lat = bbox
        if not (min_lon <= lon <= max_lon and min_lat <= lat <= max_lat):
            return False

    if radius_km is not None:
        distance_km = _haversine_km(center_lat or 0, center_lon or 0, lat, lon)
        if distance_km > radius_km:
            return False

    return True


def _haversine_km(lat_1: float, lon_1: float, lat_2: float, lon_2: float) -> float:
    radius = 6371.0
    delta_lat = radians(lat_2 - lat_1)
    delta_lon = radians(lon_2 - lon_1)
    a = (
        sin(delta_lat / 2) ** 2
        + cos(radians(lat_1)) * cos(radians(lat_2)) * sin(delta_lon / 2) ** 2
    )
    return 2 * radius * asin(sqrt(a))


def _calculate_bbox(features: list[MapFeature]) -> BBox | None:
    if not features:
        return None

    lon_values = [feature.geometry.coordinates[0] for feature in features]
    lat_values = [feature.geometry.coordinates[1] for feature in features]
    return (
        round(min(lon_values), 6),
        round(min(lat_values), 6),
        round(max(lon_values), 6),
        round(max(lat_values), 6),
    )


def _compact_price(price: int) -> str:
    if price >= 1_000_000:
        return f"{price / 1_000_000:.1f}m zł"
    return f"{round(price / 1000)}k zł"


def _growth_class(investment_score: int) -> str:
    if investment_score >= 75:
        return "high_growth"
    if investment_score >= 60:
        return "growth_watch"
    return "neutral"


def _risk_class(risk_score: int) -> str:
    if risk_score >= 55:
        return "high_risk"
    if risk_score >= 35:
        return "medium_risk"
    return "low_risk"


def _investment_growth_impact(investment: PlannedInvestmentSchema) -> str:
    if investment.investment_type in {"tram", "school", "park"}:
        return "positive"
    if investment.investment_type in {"road_transport", "road"}:
        return "mixed"
    return "unknown"
