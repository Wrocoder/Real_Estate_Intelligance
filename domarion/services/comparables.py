from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
from math import asin, cos, radians, sin, sqrt

from domarion.schemas import ComparableEvidence, Listing


@dataclass(frozen=True)
class ComparableSelection:
    items: list[Listing]
    level: int
    scope: str
    freshness_days: int
    excluded_reasons: list[str]


def select_comparables(repository, listing: Listing, limit: int = 5) -> ComparableSelection:
    candidates = [item for item in repository.list_listings() if item.id != listing.id]
    fresh_cutoff = listing.last_seen_at - timedelta(days=180)
    fresh = [item for item in candidates if item.last_seen_at >= fresh_cutoff]
    excluded = []
    if len(fresh) < len(candidates):
        excluded.append(f"{len(candidates) - len(fresh)} stale listings (>180 days)")

    levels = (
        (0, "same district, market, type, size and rooms", lambda item: _strict(item, listing)),
        (1, "same city, market, type, size and rooms", lambda item: _same_city(item, listing)),
        (2, "same city and market, widened size/rooms", lambda item: _widened(item, listing)),
        (3, "same city, widened market fallback", lambda item: item.city == listing.city),
    )
    for level, scope, predicate in levels:
        selected = [item for item in fresh if predicate(item)]
        if selected:
            selected.sort(key=lambda item: _distance(item, listing))
            return ComparableSelection(selected[:limit], level, scope, 180, excluded)

    return ComparableSelection([], len(levels), "no relevant fresh comparables", 180, excluded)


def build_comparable_evidence(
    subject: Listing,
    comparables: list[Listing],
) -> list[ComparableEvidence]:
    return [
        ComparableEvidence(
            listing_id=item.id,
            title=item.title,
            source_name=item.source_name,
            data_provenance=item.data_provenance,
            address=item.address,
            city=item.city,
            district=item.district,
            market_type=item.market_type,
            observed_at=item.last_seen_at,
            price=item.price,
            area_m2=item.area_m2,
            rooms=item.rooms,
            price_per_m2=item.price_per_m2,
            floor=item.floor,
            building_year=item.building_year,
            renovation_state=item.renovation_state,
            distance_m=_distance_m(subject, item),
            similarity_score=_similarity_score(subject, item),
            similarity_factors=_similarity_factors(subject, item),
            price_delta_to_subject_pct=_pct_delta(item.price, subject.price),
            price_per_m2_delta_to_subject_pct=_pct_delta(
                item.price_per_m2,
                subject.price_per_m2,
            ),
        )
        for item in comparables
    ]


def _strict(item: Listing, listing: Listing) -> bool:
    return (
        item.city == listing.city
        and item.district == listing.district
        and item.market_type == listing.market_type
        and _optional_match(item.building_type, listing.building_type)
        and _optional_match(item.renovation_state, listing.renovation_state)
        and abs(item.area_m2 - listing.area_m2) <= max(10, listing.area_m2 * 0.15)
        and abs(item.rooms - listing.rooms) <= 1
    )


def _same_city(item: Listing, listing: Listing) -> bool:
    return (
        item.city == listing.city
        and item.market_type == listing.market_type
        and abs(item.area_m2 - listing.area_m2) <= max(15, listing.area_m2 * 0.20)
        and abs(item.rooms - listing.rooms) <= 1
    )


def _widened(item: Listing, listing: Listing) -> bool:
    return (
        item.city == listing.city
        and item.market_type == listing.market_type
        and abs(item.area_m2 - listing.area_m2) <= max(25, listing.area_m2 * 0.30)
        and abs(item.rooms - listing.rooms) <= 2
    )


def _optional_match(left: str | None, right: str | None) -> bool:
    return left is None or right is None or left == right


def _distance(item: Listing, listing: Listing) -> tuple[int, float, int]:
    return (
        0 if item.district == listing.district else 1,
        abs(item.area_m2 - listing.area_m2) + abs(item.price_per_m2 - listing.price_per_m2) / 1000,
        abs(item.rooms - listing.rooms),
    )


def _distance_m(left: Listing, right: Listing) -> int | None:
    if left.lat is None or left.lon is None or right.lat is None or right.lon is None:
        return None
    latitude_delta = radians(right.lat - left.lat)
    longitude_delta = radians(right.lon - left.lon)
    latitude_left = radians(left.lat)
    latitude_right = radians(right.lat)
    haversine = (
        sin(latitude_delta / 2) ** 2
        + cos(latitude_left) * cos(latitude_right) * sin(longitude_delta / 2) ** 2
    )
    return round(6_371_000 * 2 * asin(sqrt(haversine)))


def _similarity_score(subject: Listing, comparable: Listing) -> int:
    score = 0
    if subject.district == comparable.district:
        score += 25
    elif subject.city == comparable.city:
        score += 12
    if subject.market_type == comparable.market_type:
        score += 20
    area_delta_pct = abs(subject.area_m2 - comparable.area_m2) / max(subject.area_m2, 1)
    score += 20 if area_delta_pct <= 0.10 else 12 if area_delta_pct <= 0.20 else 4
    rooms_delta = abs(subject.rooms - comparable.rooms)
    score += 15 if rooms_delta == 0 else 8 if rooms_delta == 1 else 3
    if subject.building_type and comparable.building_type:
        score += 10 if subject.building_type == comparable.building_type else 3
    if subject.renovation_state and comparable.renovation_state:
        score += 10 if subject.renovation_state == comparable.renovation_state else 3
    distance = _distance_m(subject, comparable)
    score += (
        10
        if distance is not None and distance <= 1_000
        else 7
        if distance is not None and distance <= 3_000
        else 3
        if distance is not None
        else 0
    )
    return max(0, min(100, score))


def _similarity_factors(subject: Listing, comparable: Listing) -> list[str]:
    factors = []
    if subject.district == comparable.district:
        factors.append("same_district")
    elif subject.city == comparable.city:
        factors.append("same_city_different_district")
    else:
        factors.append("different_city")
    if subject.market_type == comparable.market_type:
        factors.append("same_market")
    else:
        factors.append("different_market")
    area_delta_pct = abs(subject.area_m2 - comparable.area_m2) / max(subject.area_m2, 1)
    factors.append("similar_size" if area_delta_pct <= 0.20 else "wider_size_range")
    factors.append("same_rooms" if subject.rooms == comparable.rooms else "rooms_differ")
    if subject.building_type and comparable.building_type:
        factors.append(
            "same_building_type"
            if subject.building_type == comparable.building_type
            else "building_type_differs"
        )
    else:
        factors.append("building_type_unknown")
    if subject.renovation_state and comparable.renovation_state:
        factors.append(
            "same_condition"
            if subject.renovation_state == comparable.renovation_state
            else "condition_differs"
        )
    else:
        factors.append("condition_unknown")
    distance = _distance_m(subject, comparable)
    factors.append(
        "nearby"
        if distance is not None and distance <= 1_000
        else "same_area_proximity"
        if distance is not None and distance <= 3_000
        else "distance_unknown"
        if distance is None
        else "wider_area_proximity"
    )
    return factors


def _pct_delta(value: int, subject_value: int) -> float:
    if subject_value == 0:
        return 0.0
    return round((value - subject_value) / subject_value * 100, 2)
