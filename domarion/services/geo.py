from math import asin, cos, pi, radians, sin, sqrt
from typing import Any

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    AreaStatistics,
    DistrictReference,
    Listing,
    MapFeature,
    MapFeatureCollection,
    MapPointGeometry,
    MapPolygonGeometry,
    MunicipalityReference,
)
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
ADMINISTRATIVE_FEATURE_TYPES = {
    "district_boundary",
    "municipality_boundary",
    "voivodeship_boundary",
}
RISK_FEATURE_TYPES = {
    "industrial_risk_zone",
    "major_road_noise_zone",
    "rail_noise_review_zone",
    "airport_noise_review_zone",
    "flood_risk_review_zone",
    "pollution_review_zone",
}
INFRASTRUCTURE_LAYER_LIMIT = 500
VOIVODESHIP_NAMES = {
    "dolnoslaskie": "Dolnośląskie",
    "dolnośląskie": "Dolnośląskie",
}
MAJOR_ROAD_NOISE_THRESHOLD_M = 600
RISK_REVIEW_ZONES = (
    {
        "feature_type": "rail_noise_review_zone",
        "reference_id": "wroclaw-central-rail-corridor-review",
        "name": "Central rail corridor review",
        "city": "Wrocław",
        "district": "Krzyki",
        "lat": 51.0987,
        "lon": 17.0308,
        "radius_km": 1.35,
        "risk_level": "review",
        "review_reason": "Rail proximity/noise needs official map and site visit verification.",
    },
    {
        "feature_type": "airport_noise_review_zone",
        "reference_id": "wroclaw-airport-approach-review",
        "name": "Airport approach review",
        "city": "Wrocław",
        "district": "Fabryczna",
        "lat": 51.1027,
        "lon": 16.8858,
        "radius_km": 2.6,
        "risk_level": "review",
        "review_reason": "Airport/approach corridor exposure requires official noise map check.",
    },
    {
        "feature_type": "flood_risk_review_zone",
        "reference_id": "wroclaw-odra-floodplain-review",
        "name": "Odra floodplain review",
        "city": "Wrocław",
        "district": "Psie Pole",
        "lat": 51.1308,
        "lon": 17.0645,
        "radius_km": 2.4,
        "risk_level": "review",
        "review_reason": "Flood exposure needs official flood hazard map verification.",
    },
    {
        "feature_type": "pollution_review_zone",
        "reference_id": "wroclaw-west-industrial-pollution-review",
        "name": "West industrial/traffic pollution review",
        "city": "Wrocław",
        "district": "Fabryczna",
        "lat": 51.1055,
        "lon": 16.944,
        "radius_km": 2.1,
        "risk_level": "review",
        "review_reason": (
            "Air quality and industrial/traffic exposure need official/public data check."
        ),
    },
)


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
    administrative_features = _administrative_features(
        repository,
        city=city,
        district=district,
        municipality=municipality,
        voivodeship=voivodeship,
        bbox=bbox,
        lat=lat,
        lon=lon,
        radius_km=radius_km,
    )
    risk_features = _risk_features(
        repository,
        listings,
        city=city,
        district=district,
        municipality=municipality,
        bbox=bbox,
        lat=lat,
        lon=lon,
        radius_km=radius_km,
    )

    features: list[MapFeature] = [*administrative_features, *risk_features]
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
    administrative_counts = {
        f"{feature_type}_count": sum(
            1 for feature in features if feature.properties["feature_type"] == feature_type
        )
        for feature_type in sorted(ADMINISTRATIVE_FEATURE_TYPES)
    }
    risk_counts = {
        f"{feature_type}_count": sum(
            1 for feature in features if feature.properties["feature_type"] == feature_type
        )
        for feature_type in sorted(RISK_FEATURE_TYPES)
    }

    return MapFeatureCollection(
        features=features,
        bbox=_calculate_bbox(features),
        metadata={
            "listing_count": listing_count,
            "planned_investment_count": planned_count,
            "infrastructure_count": sum(infrastructure_counts.values()),
            "infrastructure_counts": infrastructure_counts,
            "administrative_layer_count": sum(administrative_counts.values()),
            "administrative_counts": administrative_counts,
            "risk_layer_count": sum(risk_counts.values()),
            "risk_counts": risk_counts,
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


def _administrative_features(
    repository: RealEstateRepository,
    *,
    city: str | None,
    district: str | None,
    municipality: str | None,
    voivodeship: str | None,
    bbox: BBox | None,
    lat: float | None,
    lon: float | None,
    radius_km: float | None,
) -> list[MapFeature]:
    features: list[MapFeature] = []
    area_statistics = {area.area_id: area for area in repository.list_area_statistics()}
    district_city = municipality or city

    for reference in repository.list_district_references(city=district_city):
        if not _district_reference_matches_filters(reference, district, municipality):
            continue
        if reference.lat is None or reference.lon is None:
            continue
        if not _is_inside_spatial_window(reference.lat, reference.lon, bbox, lat, lon, radius_km):
            continue
        features.append(_district_boundary_to_feature(reference, area_statistics.get(reference.id)))

    for reference in repository.list_municipalities():
        if not _municipality_reference_matches_filters(reference, city, municipality):
            continue
        if reference.lat is None or reference.lon is None:
            continue
        if not _is_inside_spatial_window(reference.lat, reference.lon, bbox, lat, lon, radius_km):
            continue
        features.append(_municipality_boundary_to_feature(reference))

    has_location_filter = city is not None or district is not None or municipality is not None
    voivodeship_feature = _voivodeship_boundary_to_feature(voivodeship)
    voivodeship_in_window = _is_inside_spatial_window(
        WROCLAW_CENTER[1],
        WROCLAW_CENTER[0],
        bbox,
        lat,
        lon,
        radius_km,
    )
    if (
        voivodeship_feature is not None
        and voivodeship_in_window
        and (not has_location_filter or features)
    ):
        features.append(voivodeship_feature)

    return features


def _risk_features(
    repository: RealEstateRepository,
    listings: list[Listing],
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
    location_city = municipality or city

    for zone in repository.list_industrial_zones(
        city=location_city,
        limit=INFRASTRUCTURE_LAYER_LIMIT,
    ):
        if not _reference_matches_municipality(zone, municipality):
            continue
        if not _reference_matches_district(zone, district):
            continue
        if zone.lat is None or zone.lon is None:
            continue
        if not _is_inside_spatial_window(zone.lat, zone.lon, bbox, lat, lon, radius_km):
            continue
        features.append(_industrial_risk_zone_to_feature(zone))

    for listing in listings:
        if listing.nearest_major_road_m > MAJOR_ROAD_NOISE_THRESHOLD_M:
            continue
        if not _is_inside_spatial_window(listing.lat, listing.lon, bbox, lat, lon, radius_km):
            continue
        features.append(_major_road_noise_zone_to_feature(listing))

    for zone in RISK_REVIEW_ZONES:
        if not _risk_review_zone_matches_filters(zone, city, district, municipality):
            continue
        if not _is_inside_spatial_window(
            zone["lat"],
            zone["lon"],
            bbox,
            lat,
            lon,
            radius_km,
        ):
            continue
        features.append(_risk_review_zone_to_feature(zone))

    return features


def _industrial_risk_zone_to_feature(zone: Any) -> MapFeature:
    impact_radius_m = zone.impact_radius_m or 900
    return MapFeature(
        id=f"industrial-risk-zone-{zone.id}",
        geometry=MapPolygonGeometry(
            coordinates=_circle_polygon(zone.lon, zone.lat, impact_radius_m / 1000),
        ),
        properties={
            "feature_type": "industrial_risk_zone",
            "risk_layer": "industrial",
            "reference_id": zone.id,
            "name": zone.name,
            "municipality": zone.municipality_name,
            "district": zone.district_name,
            "zone_type": zone.zone_type,
            "risk_level": zone.risk_level,
            "impact_radius_m": impact_radius_m,
            "source_url": zone.source_url,
            "geometry_accuracy": "source_radius_proxy",
            "geometry_source": "industrial zone point and impact radius",
            "review_reason": "Verify exact land-use, truck routes, smell and noise on site.",
        },
    )


def _major_road_noise_zone_to_feature(listing: Listing) -> MapFeature:
    nearest_major_road_m = listing.nearest_major_road_m
    risk_level = "high" if nearest_major_road_m <= 350 else "moderate"
    radius_km = max(0.25, (MAJOR_ROAD_NOISE_THRESHOLD_M - nearest_major_road_m + 220) / 1000)
    return MapFeature(
        id=f"major-road-noise-zone-{listing.id}",
        geometry=MapPolygonGeometry(
            coordinates=_circle_polygon(listing.lon, listing.lat, radius_km, points=32),
        ),
        properties={
            "feature_type": "major_road_noise_zone",
            "risk_layer": "major_road_noise",
            "reference_id": listing.id,
            "listing_id": listing.id,
            "name": "Major-road noise proxy",
            "address": listing.address,
            "city": listing.city,
            "district": listing.district,
            "municipality": listing.municipality,
            "risk_level": risk_level,
            "nearest_major_road_m": nearest_major_road_m,
            "impact_radius_m": round(radius_km * 1000),
            "geometry_accuracy": "listing_distance_proxy",
            "geometry_source": "listing nearest_major_road_m enrichment",
            "review_reason": "Check official noise map and visit during peak traffic.",
        },
    )


def _risk_review_zone_matches_filters(
    zone: dict[str, Any],
    city: str | None,
    district: str | None,
    municipality: str | None,
) -> bool:
    if municipality and zone["city"].casefold() != municipality.casefold():
        return False
    if city and zone["city"].casefold() != city.casefold():
        return False
    if district and zone["district"].casefold() != district.casefold():
        return False
    return True


def _risk_review_zone_to_feature(zone: dict[str, Any]) -> MapFeature:
    return MapFeature(
        id=str(zone["reference_id"]),
        geometry=MapPolygonGeometry(
            coordinates=_circle_polygon(zone["lon"], zone["lat"], zone["radius_km"]),
        ),
        properties={
            "feature_type": zone["feature_type"],
            "risk_layer": str(zone["feature_type"]).replace("_review_zone", ""),
            "reference_id": zone["reference_id"],
            "name": zone["name"],
            "city": zone["city"],
            "district": zone["district"],
            "municipality": zone["city"],
            "risk_level": zone["risk_level"],
            "impact_radius_m": round(zone["radius_km"] * 1000),
            "geometry_accuracy": "screening_proxy",
            "geometry_source": "MVP review zone; replace with official GIS feed",
            "review_reason": zone["review_reason"],
        },
    )


def _district_reference_matches_filters(
    reference: DistrictReference,
    district: str | None,
    municipality: str | None,
) -> bool:
    if municipality and reference.municipality_name.casefold() != municipality.casefold():
        return False
    if district and reference.name.casefold() != district.casefold():
        return False
    return True


def _municipality_reference_matches_filters(
    reference: MunicipalityReference,
    city: str | None,
    municipality: str | None,
) -> bool:
    location_name = municipality or city
    if location_name and reference.name.casefold() != location_name.casefold():
        return False
    return True


def _district_boundary_to_feature(
    reference: DistrictReference,
    area: AreaStatistics | None,
) -> MapFeature:
    radius_km = _district_boundary_radius_km(reference, area)
    return MapFeature(
        id=f"district-boundary-{reference.id}",
        geometry=MapPolygonGeometry(
            coordinates=_circle_polygon(reference.lon or 0, reference.lat or 0, radius_km),
        ),
        properties={
            "feature_type": "district_boundary",
            "admin_level": "district",
            "reference_id": reference.id,
            "area_id": reference.area_id,
            "name": reference.name,
            "city": reference.municipality_name,
            "municipality": reference.municipality_name,
            "median_price_per_m2": area.median_price_per_m2 if area else None,
            "active_listings": area.active_listings if area else None,
            "price_change_90d_pct": area.price_change_90d_pct if area else None,
            "geometry_accuracy": "approximate",
            "geometry_source": "district centroid and market area radius",
        },
    )


def _municipality_boundary_to_feature(reference: MunicipalityReference) -> MapFeature:
    return MapFeature(
        id=f"municipality-boundary-{reference.id}",
        geometry=MapPolygonGeometry(
            coordinates=_circle_polygon(reference.lon or 0, reference.lat or 0, 4.8),
        ),
        properties={
            "feature_type": "municipality_boundary",
            "admin_level": "municipality",
            "reference_id": reference.id,
            "name": reference.name,
            "municipality": reference.name,
            "voivodeship": reference.region,
            "geometry_accuracy": "approximate",
            "geometry_source": "municipality centroid and reference radius",
        },
    )


def _voivodeship_boundary_to_feature(voivodeship: str | None) -> MapFeature | None:
    if voivodeship:
        voivodeship_name = VOIVODESHIP_NAMES.get(voivodeship.casefold())
        if voivodeship_name is None:
            return None
    else:
        voivodeship_name = "Dolnośląskie"

    return MapFeature(
        id="voivodeship-boundary-dolnoslaskie",
        geometry=MapPolygonGeometry(
            coordinates=_circle_polygon(WROCLAW_CENTER[0], WROCLAW_CENTER[1], 34),
        ),
        properties={
            "feature_type": "voivodeship_boundary",
            "admin_level": "voivodeship",
            "reference_id": "dolnoslaskie",
            "name": voivodeship_name,
            "voivodeship": voivodeship_name,
            "geometry_accuracy": "approximate",
            "geometry_source": "regional centroid and MVP coverage radius",
        },
    )


def _district_boundary_radius_km(
    reference: DistrictReference,
    area: AreaStatistics | None,
) -> float:
    if area is None:
        return 1.8
    active_listings_factor = min(area.active_listings / 700, 1)
    base_radius = 1.2 + active_listings_factor * 1.6
    if reference.municipality_name.casefold() == "wrocław".casefold():
        return max(base_radius, 2.4)
    return base_radius


def _circle_polygon(
    center_lon: float,
    center_lat: float,
    radius_km: float,
    points: int = 48,
) -> tuple[tuple[tuple[float, float], ...], ...]:
    lat_radius = radius_km / 111.32
    lon_scale = max(cos(radians(center_lat)), 0.2)
    lon_radius = radius_km / (111.32 * lon_scale)
    ring = [
        (
            round(center_lon + lon_radius * cos(2 * pi * index / points), 6),
            round(center_lat + lat_radius * sin(2 * pi * index / points), 6),
        )
        for index in range(points)
    ]
    ring.append(ring[0])
    return (tuple(ring),)


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

    coordinate_pairs = [
        coordinate for feature in features for coordinate in _feature_coordinate_pairs(feature)
    ]
    lon_values = [coordinate[0] for coordinate in coordinate_pairs]
    lat_values = [coordinate[1] for coordinate in coordinate_pairs]
    return (
        round(min(lon_values), 6),
        round(min(lat_values), 6),
        round(max(lon_values), 6),
        round(max(lat_values), 6),
    )


def _feature_coordinate_pairs(feature: MapFeature) -> list[tuple[float, float]]:
    if feature.geometry.type == "Point":
        return [feature.geometry.coordinates]
    return [
        coordinate
        for ring in feature.geometry.coordinates
        for coordinate in ring
    ]


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
