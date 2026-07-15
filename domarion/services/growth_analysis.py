from __future__ import annotations

from math import asin, cos, radians, sin, sqrt
from typing import Any

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    AmenityReference,
    AreaStatistics,
    Listing,
    ListingFutureImpact,
    ListingGrowthAnalysis,
    ListingGrowthFactor,
    PlannedInvestment,
)

GROWTH_ANALYSIS_METHODOLOGY_NOTE = (
    "Growth analysis is a deterministic screening heuristic based on current listing "
    "location signals, market momentum, known planned investments and available open-data "
    "infrastructure layers. It is not a price forecast; verify source freshness, exact "
    "geometry, delivery timing and local constraints before making a purchase decision."
)

FACTOR_WEIGHTS = {
    "transport": 0.18,
    "education": 0.14,
    "parks_greenery": 0.12,
    "healthcare": 0.10,
    "retail_services": 0.11,
    "offices_jobs": 0.15,
    "universities": 0.08,
    "population_jobs_growth": 0.12,
}


def build_listing_growth_analysis(
    repository: RealEstateRepository,
    listing: Listing,
    area_statistics: AreaStatistics,
    *,
    future_area_impact: ListingFutureImpact | None = None,
) -> ListingGrowthAnalysis:
    amenities = repository.list_amenities(city=listing.city, limit=500)
    schools = repository.list_schools(city=listing.city, limit=500)
    kindergartens = repository.list_kindergartens(city=listing.city, limit=500)
    transport_stops = repository.list_transport_stops(city=listing.city, limit=500)
    planned_investments = repository.list_planned_investments(
        lat=listing.lat,
        lon=listing.lon,
        radius_km=5,
    )

    factors = [
        _transport_factor(listing, transport_stops, planned_investments),
        _education_factor(listing, schools, kindergartens),
        _parks_greenery_factor(listing, amenities, planned_investments),
        _healthcare_factor(listing, amenities),
        _retail_services_factor(listing, amenities),
        _offices_jobs_factor(listing, amenities, planned_investments),
        _universities_factor(listing, amenities),
        _population_jobs_growth_factor(
            listing,
            area_statistics,
            future_area_impact,
            planned_investments,
        ),
    ]
    growth_score = _weighted_score(factors)

    return ListingGrowthAnalysis(
        listing_id=listing.id,
        growth_score=growth_score,
        growth_label=_growth_label(growth_score),
        factors=factors,
        positive_signals=_positive_signals(factors),
        drag_signals=_drag_signals(factors),
        missing_layers=_missing_layers(factors),
        summary=_summary(growth_score, factors),
        methodology_note=GROWTH_ANALYSIS_METHODOLOGY_NOTE,
    )


def _transport_factor(
    listing: Listing,
    transport_stops: list[Any],
    planned_investments: list[PlannedInvestment],
) -> ListingGrowthFactor:
    nearby_stops = _nearby_refs(listing, transport_stops, radius_km=0.8)
    planned_transport = [
        investment
        for investment in planned_investments
        if _contains_any(investment.investment_type, ("tram", "bus", "transport", "metro"))
    ]
    score = _clamp(
        88
        - max(0, listing.nearest_stop_m - 250) / 7
        + min(len(nearby_stops), 3) * 4
        + min(len(planned_transport), 2) * 8
    )
    evidence = [
        f"Nearest public transport stop: {listing.nearest_stop_m} m.",
        f"Stops within 800 m in current data: {len(nearby_stops)}.",
    ]
    if nearby_stops:
        evidence.append(f"Nearest named stops: {_names(nearby_stops, limit=2)}.")
    if planned_transport:
        evidence.append(f"Planned transport catalysts within 5 km: {len(planned_transport)}.")
    return _factor(
        code="transport",
        label="Transport access",
        score=score,
        evidence=evidence,
        recommended_checks=[
            "Check real walking route to the stop, service frequency and night/weekend coverage.",
            "Verify planned transport status, funding and delivery timeline.",
        ],
        data_status="listing distances + transport stop/open-data references",
    )


def _education_factor(
    listing: Listing,
    schools: list[Any],
    kindergartens: list[Any],
) -> ListingGrowthFactor:
    nearby_schools = _nearby_refs(listing, schools, radius_km=1.5)
    nearby_kindergartens = _nearby_refs(listing, kindergartens, radius_km=1.5)
    score = _clamp(
        36
        + min(listing.schools_within_1km, 4) * 12
        + min(len(nearby_kindergartens), 3) * 9
        - max(0, listing.nearest_school_m - 800) / 24
    )
    evidence = [
        f"Schools within 1 km: {listing.schools_within_1km}.",
        f"Nearest school: {listing.nearest_school_m} m.",
        f"Kindergartens within 1.5 km in current data: {len(nearby_kindergartens)}.",
    ]
    if nearby_schools:
        evidence.append(f"Nearby schools: {_names(nearby_schools, limit=2)}.")
    return _factor(
        code="education",
        label="Schools and childcare",
        score=score,
        evidence=evidence,
        recommended_checks=[
            "Check school catchment, capacity, commute route and actual quality indicators.",
            "For family buyers, verify kindergarten availability and waiting-list risk.",
        ],
        data_status="listing distances + schools/kindergartens open-data references",
    )


def _parks_greenery_factor(
    listing: Listing,
    amenities: list[AmenityReference],
    planned_investments: list[PlannedInvestment],
) -> ListingGrowthFactor:
    park_amenities = _amenities_by_type(amenities, ("park", "green", "garden", "recreation"))
    nearby_parks = _nearby_refs(listing, park_amenities, radius_km=1.5)
    planned_greenery = [
        investment
        for investment in planned_investments
        if _contains_any(investment.investment_type, ("park", "green", "public_space"))
    ]
    score = _clamp(
        35
        + min(listing.parks_within_1km, 4) * 14
        + min(len(nearby_parks), 3) * 8
        + min(len(planned_greenery), 2) * 7
    )
    evidence = [
        f"Parks within 1 km: {listing.parks_within_1km}.",
        f"Park/green amenities within 1.5 km in current data: {len(nearby_parks)}.",
    ]
    if planned_greenery:
        evidence.append(
            "Planned greenery/public-space projects within 5 km: "
            f"{len(planned_greenery)}."
        )
    return _factor(
        code="parks_greenery",
        label="Parks and greenery",
        score=score,
        evidence=evidence,
        recommended_checks=[
            "Check exact park access, noise, lighting and whether green areas are protected.",
            "Verify whether nearby planned greenery is funded or only conceptual.",
        ],
        data_status="listing counts + amenities/planned-investment references",
    )


def _healthcare_factor(
    listing: Listing,
    amenities: list[AmenityReference],
) -> ListingGrowthFactor:
    healthcare = _amenities_by_type(amenities, ("healthcare", "hospital", "clinic", "medical"))
    nearby_2km = _nearby_refs(listing, healthcare, radius_km=2)
    nearby_5km = _nearby_refs(listing, healthcare, radius_km=5)
    if not healthcare:
        return _missing_factor(
            code="healthcare",
            label="Healthcare and hospitals",
            missing_layer="healthcare/hospitals amenity layer",
            evidence=[
                "No healthcare or hospital references are loaded for this city in current data."
            ],
            recommended_checks=[
                "Check nearby clinics, emergency access and hospital commute manually.",
            ],
        )
    score = _clamp(34 + min(len(nearby_2km), 3) * 18 + min(len(nearby_5km), 4) * 5)
    evidence = [
        f"Healthcare amenities within 2 km: {len(nearby_2km)}.",
        f"Healthcare amenities within 5 km: {len(nearby_5km)}.",
    ]
    if nearby_2km:
        evidence.append(f"Nearest healthcare references: {_names(nearby_2km, limit=2)}.")
    return _factor(
        code="healthcare",
        label="Healthcare and hospitals",
        score=score,
        evidence=evidence,
        recommended_checks=[
            "Verify opening hours, public/private access and actual walking/driving time.",
        ],
        data_status="amenity open-data references",
    )


def _retail_services_factor(
    listing: Listing,
    amenities: list[AmenityReference],
) -> ListingGrowthFactor:
    retail_services = _amenities_by_type(
        amenities,
        ("retail", "shopping", "supermarket", "grocery", "services", "public_services"),
    )
    nearby_15 = _nearby_refs(listing, retail_services, radius_km=1.5)
    nearby_25 = _nearby_refs(listing, retail_services, radius_km=2.5)
    if not retail_services:
        return _missing_factor(
            code="retail_services",
            label="Retail and everyday services",
            missing_layer="retail/services amenity layer",
            evidence=[
                "No retail or everyday-services references are loaded for this city "
                "in current data."
            ],
            recommended_checks=[
                "Check groceries, pharmacies, gyms, parcel lockers and everyday services manually.",
            ],
        )
    center_access_bonus = 6 if listing.distance_to_center_km <= 5 else 0
    score = _clamp(
        34
        + min(len(nearby_15), 4) * 13
        + min(len(nearby_25), 5) * 5
        + center_access_bonus
    )
    evidence = [
        f"Retail/services amenities within 1.5 km: {len(nearby_15)}.",
        f"Retail/services amenities within 2.5 km: {len(nearby_25)}.",
        f"Distance to center: {listing.distance_to_center_km:.1f} km.",
    ]
    return _factor(
        code="retail_services",
        label="Retail and everyday services",
        score=score,
        evidence=evidence,
        recommended_checks=[
            "Verify whether services are reachable on foot and suitable for daily use.",
        ],
        data_status="amenity open-data references + center-distance proxy",
    )


def _offices_jobs_factor(
    listing: Listing,
    amenities: list[AmenityReference],
    planned_investments: list[PlannedInvestment],
) -> ListingGrowthFactor:
    offices = _amenities_by_type(
        amenities,
        ("office", "business", "coworking", "employment", "jobs"),
    )
    nearby_offices = _nearby_refs(listing, offices, radius_km=3)
    planned_jobs = [
        investment
        for investment in planned_investments
        if _contains_any(
            investment.investment_type,
            ("office", "business", "employment", "jobs", "economic"),
        )
    ]
    if not offices and not planned_jobs:
        return _missing_factor(
            code="offices_jobs",
            label="Offices and jobs access",
            missing_layer="offices/jobs layer",
            evidence=[
                "No office/job-center amenities or planned job catalysts are loaded for this city."
            ],
            recommended_checks=[
                "Check commute to major employment nodes and planned business parks manually.",
            ],
        )
    center_access_score = max(0, 24 - listing.distance_to_center_km * 3)
    score = _clamp(
        35
        + min(len(nearby_offices), 4) * 11
        + min(len(planned_jobs), 3) * 9
        + center_access_score
    )
    evidence = [
        f"Office/job amenities within 3 km: {len(nearby_offices)}.",
        f"Planned job/economic catalysts within 5 km: {len(planned_jobs)}.",
        f"Center access proxy: {listing.distance_to_center_km:.1f} km from center.",
    ]
    return _factor(
        code="offices_jobs",
        label="Offices and jobs access",
        score=score,
        evidence=evidence,
        recommended_checks=[
            "Check commute time to major employment nodes by car and public transport.",
            "Do not rely on planned office/job catalysts until source and timeline are verified.",
        ],
        data_status="amenity references + planned-investment/job-access proxy",
    )


def _universities_factor(
    listing: Listing,
    amenities: list[AmenityReference],
) -> ListingGrowthFactor:
    universities = _amenities_by_type(
        amenities,
        ("university", "higher_education", "campus", "student"),
    )
    nearby_4km = _nearby_refs(listing, universities, radius_km=4)
    nearby_7km = _nearby_refs(listing, universities, radius_km=7)
    if not universities:
        return _missing_factor(
            code="universities",
            label="Universities and student demand",
            missing_layer="universities/student-demand layer",
            evidence=["No university/campus references are loaded for this city in current data."],
            recommended_checks=[
                "For rental thesis, check access to universities and student demand manually.",
            ],
        )
    score = _clamp(30 + min(len(nearby_4km), 3) * 18 + min(len(nearby_7km), 4) * 6)
    evidence = [
        f"University/campus references within 4 km: {len(nearby_4km)}.",
        f"University/campus references within 7 km: {len(nearby_7km)}.",
    ]
    if nearby_7km:
        evidence.append(f"Relevant campus references: {_names(nearby_7km, limit=2)}.")
    return _factor(
        code="universities",
        label="Universities and student demand",
        score=score,
        evidence=evidence,
        recommended_checks=[
            "Verify public transport commute to campuses and seasonality of student demand.",
        ],
        data_status="amenity open-data references",
    )


def _population_jobs_growth_factor(
    listing: Listing,
    area_statistics: AreaStatistics,
    future_area_impact: ListingFutureImpact | None,
    planned_investments: list[PlannedInvestment],
) -> ListingGrowthFactor:
    future_score = future_area_impact.impact_score if future_area_impact is not None else 0
    planned_count = len(planned_investments)
    score = _clamp(
        48
        + area_statistics.price_change_90d_pct * 4.2
        - max(0, area_statistics.supply_change_90d_pct - 8) * 1.4
        + max(0, 65 - area_statistics.average_days_on_market) * 0.22
        + min(listing.planned_investments_within_2km, 4) * 5
        + min(future_score, 80) * 0.12
    )
    evidence = [
        f"Area price change 90d: {area_statistics.price_change_90d_pct:+.1f}%.",
        f"Area supply change 90d: {area_statistics.supply_change_90d_pct:+.1f}%.",
        f"Average days on market: {area_statistics.average_days_on_market}.",
        f"Planned investments within 2 km: {listing.planned_investments_within_2km}.",
    ]
    if future_area_impact is not None:
        evidence.append(f"Future impact score: {future_area_impact.impact_score}/100.")
    else:
        evidence.append(f"Planned investments within 5 km in current data: {planned_count}.")
    return _factor(
        code="population_jobs_growth",
        label="Population/jobs growth momentum",
        score=score,
        evidence=evidence,
        recommended_checks=[
            "Validate population/jobs growth with GUS/BDL, municipal plans and employer pipeline.",
            "Watch oversupply if new listings grow faster than demand absorption.",
        ],
        data_status="area market snapshot + planned-investment proxy",
    )


def _factor(
    *,
    code: str,
    label: str,
    score: int,
    evidence: list[str],
    recommended_checks: list[str],
    data_status: str,
) -> ListingGrowthFactor:
    return ListingGrowthFactor(
        code=code,  # type: ignore[arg-type]
        label=label,
        score=score,
        weight=FACTOR_WEIGHTS[code],
        posture=_posture(score),
        evidence=evidence,
        recommended_checks=recommended_checks,
        data_status=data_status,
    )


def _missing_factor(
    *,
    code: str,
    label: str,
    missing_layer: str,
    evidence: list[str],
    recommended_checks: list[str],
) -> ListingGrowthFactor:
    return ListingGrowthFactor(
        code=code,  # type: ignore[arg-type]
        label=label,
        score=35,
        weight=FACTOR_WEIGHTS[code],
        posture="missing",
        evidence=evidence,
        recommended_checks=recommended_checks,
        data_status=f"missing: {missing_layer}",
    )


def _amenities_by_type(
    amenities: list[AmenityReference],
    tokens: tuple[str, ...],
) -> list[AmenityReference]:
    return [
        amenity
        for amenity in amenities
        if _contains_any(amenity.amenity_type, tokens)
        or _contains_any(amenity.name, tokens)
    ]


def _nearby_refs(listing: Listing, refs: list[Any], *, radius_km: float) -> list[Any]:
    nearby: list[tuple[float, Any]] = []
    for ref in refs:
        lat = getattr(ref, "lat", None)
        lon = getattr(ref, "lon", None)
        if lat is None or lon is None:
            continue
        distance = _haversine_km(listing.lat, listing.lon, lat, lon)
        if distance <= radius_km:
            nearby.append((distance, ref))
    return [ref for _, ref in sorted(nearby, key=lambda item: (item[0], item[1].name))]


def _weighted_score(factors: list[ListingGrowthFactor]) -> int:
    weighted = sum(factor.score * factor.weight for factor in factors)
    total_weight = sum(factor.weight for factor in factors) or 1
    return round(weighted / total_weight)


def _positive_signals(factors: list[ListingGrowthFactor]) -> list[str]:
    signals = [
        f"{factor.label}: {factor.score}/100 ({factor.posture})"
        for factor in factors
        if factor.score >= 65 and factor.posture != "missing"
    ]
    return signals[:5] or ["No strong growth catalyst is visible in current data."]


def _drag_signals(factors: list[ListingGrowthFactor]) -> list[str]:
    signals = [
        f"{factor.label}: {factor.posture}; {factor.evidence[0]}"
        for factor in factors
        if factor.posture in {"weak", "missing"}
    ]
    return signals[:5] or ["No major growth drag is visible in current data."]


def _missing_layers(factors: list[ListingGrowthFactor]) -> list[str]:
    layers = [
        factor.data_status.removeprefix("missing: ")
        for factor in factors
        if factor.posture == "missing"
    ]
    return sorted(set(layers))


def _summary(growth_score: int, factors: list[ListingGrowthFactor]) -> str:
    strongest = max(factors, key=lambda factor: factor.score)
    weakest = min(factors, key=lambda factor: factor.score)
    if growth_score >= 70:
        label = "strong growth setup"
    elif growth_score >= 58:
        label = "moderate growth setup"
    elif growth_score >= 45:
        label = "mixed growth setup"
    else:
        label = "weak growth setup"
    return (
        f"{label}: strongest factor is {strongest.label} ({strongest.score}/100); "
        f"main drag/check is {weakest.label} ({weakest.posture})."
    )


def _growth_label(growth_score: int) -> str:
    if growth_score >= 70:
        return "strong_growth"
    if growth_score >= 58:
        return "moderate_growth"
    if growth_score >= 45:
        return "mixed_growth"
    return "weak_growth"


def _posture(score: int) -> str:
    if score >= 70:
        return "strong"
    if score >= 50:
        return "moderate"
    return "weak"


def _contains_any(value: str | None, tokens: tuple[str, ...]) -> bool:
    if not value:
        return False
    normalized = value.casefold()
    return any(token.casefold() in normalized for token in tokens)


def _names(items: list[Any], *, limit: int) -> str:
    return ", ".join(item.name for item in items[:limit])


def _clamp(value: float, minimum: int = 0, maximum: int = 100) -> int:
    return round(min(max(value, minimum), maximum))


def _haversine_km(lat_1: float, lon_1: float, lat_2: float, lon_2: float) -> float:
    radius = 6371.0
    delta_lat = radians(lat_2 - lat_1)
    delta_lon = radians(lon_2 - lon_1)
    a = (
        sin(delta_lat / 2) ** 2
        + cos(radians(lat_1)) * cos(radians(lat_2)) * sin(delta_lon / 2) ** 2
    )
    return 2 * radius * asin(sqrt(a))
