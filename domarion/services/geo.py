from math import asin, cos, radians, sin, sqrt
from typing import Any

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import Listing, MapFeature, MapFeatureCollection, MapPointGeometry
from domarion.schemas import PlannedInvestment as PlannedInvestmentSchema
from domarion.services.building_filters import matches_building_filters
from domarion.services.lifestyle_filters import matches_lifestyle_filters
from domarion.services.scoring import build_listing_analysis

BBox = tuple[float, float, float, float]
WROCLAW_CENTER = (17.0385, 51.1079)
INFRASTRUCTURE_FEATURE_TYPES = {
    "transport_stop",
    "school",
    "kindergarten",
    "amenity",
    "industrial_zone",
}
INFRASTRUCTURE_LAYER_LIMIT = 500


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
    voivodeship: str | None = None,
    city: str | None = None,
    district: str | None = None,
    municipality: str | None = None,
    rooms: int | None = None,
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
        voivodeship=voivodeship,
        city=city,
        district=district,
        municipality=municipality,
        rooms=rooms,
        max_price=max_price,
        min_area_m2=min_area_m2,
        bbox=bbox,
        lat=lat,
        lon=lon,
        radius_km=radius_km,
    )
    location_city = municipality or city
    planned_investments = repository.list_planned_investments(
        city=location_city,
        district=district,
        bbox=bbox,
        lat=lat,
        lon=lon,
        radius_km=radius_km,
    )
    infrastructure_features = _infrastructure_features(
        repository,
        city=location_city,
        district=district,
        municipality=municipality,
        bbox=bbox,
        lat=lat,
        lon=lon,
        radius_km=radius_km,
    )

    features: list[MapFeature] = []
    skipped_listings = 0

    for listing in listings:
        if not _is_inside_spatial_window(listing.lat, listing.lon, bbox, lat, lon, radius_km):
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

    features.extend(infrastructure_features)

    listing_count = sum(
        1 for feature in features if feature.properties["feature_type"] == "listing"
    )
    planned_count = sum(
        1 for feature in features if feature.properties["feature_type"] == "planned_investment"
    )
    infrastructure_counts = {
        f"{feature_type}_count": sum(
            1 for feature in features if feature.properties["feature_type"] == feature_type
        )
        for feature_type in sorted(INFRASTRUCTURE_FEATURE_TYPES)
    }

    return MapFeatureCollection(
        features=features,
        bbox=_calculate_bbox(features),
        metadata={
            "listing_count": listing_count,
            "planned_investment_count": planned_count,
            "infrastructure_count": sum(infrastructure_counts.values()),
            "infrastructure_counts": infrastructure_counts,
            "skipped_listings": skipped_listings,
            "filters": {
                "voivodeship": voivodeship,
                "city": city,
                "district": district,
                "municipality": municipality,
                "rooms": rooms,
                "max_price": max_price,
                "min_area_m2": min_area_m2,
                "building_type": building_type,
                "renovation_state": renovation_state,
                "has_balcony": has_balcony,
                "has_terrace": has_terrace,
                "has_garden": has_garden,
                "has_elevator": has_elevator,
                "parking_type": parking_type,
                "heating_type": heating_type,
                "min_floor": min_floor,
                "max_floor": max_floor,
                "max_building_floors": max_building_floors,
                "min_building_year": min_building_year,
                "max_building_year": max_building_year,
                "bbox": bbox,
                "center": (lon, lat) if lat is not None and lon is not None else None,
                "radius_km": radius_km,
                "min_investment_score": min_investment_score,
                "max_risk_score": max_risk_score,
            },
        },
    )


def _infrastructure_features(
    repository: RealEstateRepository,
    *,
    city: str | None,
    district: str | None,
    municipality: str | None,
    bbox: BBox | None,
    lat: float | None,
    lon: float | None,
    radius_km: float | None,
) -> list[MapFeature]:
    features: list[MapFeature] = []
    layer_builders = [
        (
            repository.list_transport_stops(city=city, limit=INFRASTRUCTURE_LAYER_LIMIT),
            _transport_stop_to_feature,
        ),
        (
            repository.list_schools(city=city, limit=INFRASTRUCTURE_LAYER_LIMIT),
            _school_to_feature,
        ),
        (
            repository.list_kindergartens(city=city, limit=INFRASTRUCTURE_LAYER_LIMIT),
            _kindergarten_to_feature,
        ),
        (
            repository.list_amenities(city=city, limit=INFRASTRUCTURE_LAYER_LIMIT),
            _amenity_to_feature,
        ),
        (
            repository.list_industrial_zones(city=city, limit=INFRASTRUCTURE_LAYER_LIMIT),
            _industrial_zone_to_feature,
        ),
    ]

    for references, builder in layer_builders:
        for reference in references:
            if not _reference_matches_municipality(reference, municipality):
                continue
            if not _reference_matches_district(reference, district):
                continue
            if reference.lat is None or reference.lon is None:
                continue
            if not _is_inside_spatial_window(
                reference.lat,
                reference.lon,
                bbox,
                lat,
                lon,
                radius_km,
            ):
                continue
            features.append(builder(reference))

    return features


def _reference_matches_municipality(reference: Any, municipality: str | None) -> bool:
    if not municipality:
        return True
    return getattr(reference, "municipality_name", "").casefold() == municipality.casefold()


def _listing_to_feature(listing: Listing, scores: dict[str, Any]) -> MapFeature:
    properties: dict[str, Any] = {
        "feature_type": "listing",
        "listing_id": listing.id,
        "title": listing.title,
        "source_name": listing.source_name,
        "source_url": listing.source_url,
        "voivodeship": listing.voivodeship,
        "city": listing.city,
        "district": listing.district,
        "municipality": listing.municipality,
        "address": listing.address,
        "market_type": listing.market_type,
        "building_type": listing.building_type,
        "renovation_state": listing.renovation_state,
        "has_balcony": listing.has_balcony,
        "has_terrace": listing.has_terrace,
        "has_garden": listing.has_garden,
        "has_elevator": listing.has_elevator,
        "parking_type": listing.parking_type,
        "heating_type": listing.heating_type,
        "price": listing.price,
        "price_label": _compact_price(listing.price),
        "area_m2": listing.area_m2,
        "rooms": listing.rooms,
        "floor": listing.floor,
        "building_floors": listing.building_floors,
        "building_year": listing.building_year,
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


def _transport_stop_to_feature(stop) -> MapFeature:
    return _infrastructure_reference_to_feature(
        feature_type="transport_stop",
        reference_id=stop.id,
        lat=stop.lat,
        lon=stop.lon,
        properties={
            "name": stop.name,
            "municipality": stop.municipality_name,
            "district": stop.district_name,
            "stop_type": stop.stop_type,
            "lines_label": ", ".join(stop.lines),
            "source_url": stop.source_url,
        },
    )


def _school_to_feature(school) -> MapFeature:
    return _infrastructure_reference_to_feature(
        feature_type="school",
        reference_id=school.id,
        lat=school.lat,
        lon=school.lon,
        properties={
            "name": school.name,
            "municipality": school.municipality_name,
            "district": school.district_name,
            "school_type": school.school_type,
            "operator_type": school.operator_type,
            "source_url": school.source_url,
        },
    )


def _kindergarten_to_feature(kindergarten) -> MapFeature:
    return _infrastructure_reference_to_feature(
        feature_type="kindergarten",
        reference_id=kindergarten.id,
        lat=kindergarten.lat,
        lon=kindergarten.lon,
        properties={
            "name": kindergarten.name,
            "municipality": kindergarten.municipality_name,
            "district": kindergarten.district_name,
            "kindergarten_type": kindergarten.kindergarten_type,
            "operator_type": kindergarten.operator_type,
            "source_url": kindergarten.source_url,
        },
    )


def _amenity_to_feature(amenity) -> MapFeature:
    return _infrastructure_reference_to_feature(
        feature_type="amenity",
        reference_id=amenity.id,
        lat=amenity.lat,
        lon=amenity.lon,
        properties={
            "name": amenity.name,
            "municipality": amenity.municipality_name,
            "district": amenity.district_name,
            "amenity_type": amenity.amenity_type,
            "source_url": amenity.source_url,
        },
    )


def _industrial_zone_to_feature(zone) -> MapFeature:
    return _infrastructure_reference_to_feature(
        feature_type="industrial_zone",
        reference_id=zone.id,
        lat=zone.lat,
        lon=zone.lon,
        properties={
            "name": zone.name,
            "municipality": zone.municipality_name,
            "district": zone.district_name,
            "zone_type": zone.zone_type,
            "risk_level": zone.risk_level,
            "impact_radius_m": zone.impact_radius_m,
            "source_url": zone.source_url,
        },
    )


def _infrastructure_reference_to_feature(
    *,
    feature_type: str,
    reference_id: str,
    lat: float,
    lon: float,
    properties: dict[str, Any],
) -> MapFeature:
    return MapFeature(
        id=f"{feature_type}-{reference_id}",
        geometry=MapPointGeometry(coordinates=(lon, lat)),
        properties={
            "feature_type": feature_type,
            "reference_id": reference_id,
            **properties,
        },
    )


def _reference_matches_district(reference, district: str | None) -> bool:
    if district is None:
        return True
    reference_district = getattr(reference, "district_name", None)
    return reference_district is not None and reference_district.casefold() == district.casefold()


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
