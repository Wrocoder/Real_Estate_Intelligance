from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from math import asin, cos, radians, sin, sqrt
from statistics import median

from domarion.schemas import ComparableEvidence, Listing

MINIMUM_COMPARABLE_SAMPLE = 3
COMPARABLE_FRESHNESS_DAYS = 180


@dataclass(frozen=True)
class ComparableExclusion:
    code: str
    count: int


@dataclass(frozen=True)
class ComparableSelection:
    items: list[Listing]
    level: int
    scope: str
    freshness_days: int
    excluded_reasons: list[str]
    status: str = "insufficient"
    target_sample_size: int = MINIMUM_COMPARABLE_SAMPLE
    stage_counts: dict[str, int] = field(default_factory=dict)
    exclusions: list[ComparableExclusion] = field(default_factory=list)
    observed_from: date | None = None
    observed_to: date | None = None
    source_names: list[str] = field(default_factory=list)
    median_similarity_score: int | None = None


def select_comparables(repository, listing: Listing, limit: int = 5) -> ComparableSelection:
    candidates = [item for item in repository.list_listings() if item.id != listing.id]
    fresh_cutoff = listing.last_seen_at - timedelta(days=COMPARABLE_FRESHNESS_DAYS)
    exclusions = _exclusion_summary(candidates, listing, fresh_cutoff)
    fresh = [
        item
        for item in candidates
        if item.last_seen_at >= fresh_cutoff
        and item.city.casefold() == listing.city.casefold()
        and item.market_type == listing.market_type
    ]

    levels = (
        (0, "same district, market, type, condition, size and rooms", _strict),
        (1, "same district and market, widened property attributes", _same_district),
        (2, "same city and market, similar size and rooms", _same_city),
        (3, "same city and market, widened size and rooms", _widened),
    )
    stage_counts: dict[str, int] = {}
    fallback: tuple[int, str, list[Listing]] | None = None
    selected_level = len(levels)
    selected_scope = "no relevant fresh comparables"
    selected: list[Listing] = []

    for level, scope, predicate in levels:
        stage_items = [item for item in fresh if predicate(item, listing)]
        stage_counts[f"level_{level}"] = len(stage_items)
        if stage_items:
            fallback = (level, scope, stage_items)
        if len(stage_items) >= MINIMUM_COMPARABLE_SAMPLE:
            selected_level, selected_scope, selected = level, scope, stage_items
            break
    else:
        if fallback is not None:
            selected_level, selected_scope, selected = fallback

    selected.sort(key=lambda item: _relevance_sort_key(item, listing))
    selected = selected[:limit]
    similarities = [_similarity_score(listing, item) for item in selected]
    status = _selection_status(selected_level, similarities, len(selected))
    observed_dates = [item.last_seen_at for item in selected]
    source_names = sorted({item.source_name for item in selected})
    legacy_exclusions = [f"{item.code}:{item.count}" for item in exclusions]
    return ComparableSelection(
        items=selected,
        level=selected_level,
        scope=selected_scope,
        freshness_days=COMPARABLE_FRESHNESS_DAYS,
        excluded_reasons=legacy_exclusions,
        status=status,
        stage_counts=stage_counts,
        exclusions=exclusions,
        observed_from=min(observed_dates) if observed_dates else None,
        observed_to=max(observed_dates) if observed_dates else None,
        source_names=source_names,
        median_similarity_score=round(median(similarities)) if similarities else None,
    )


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


def _exclusion_summary(
    candidates: list[Listing], listing: Listing, fresh_cutoff: date
) -> list[ComparableExclusion]:
    counts = {
        "stale": sum(item.last_seen_at < fresh_cutoff for item in candidates),
        "different_city": sum(
            item.city.casefold() != listing.city.casefold() for item in candidates
        ),
        "different_market": sum(
            item.city.casefold() == listing.city.casefold()
            and item.market_type != listing.market_type
            for item in candidates
        ),
    }
    return [ComparableExclusion(code=code, count=count) for code, count in counts.items() if count]


def _strict(item: Listing, listing: Listing) -> bool:
    return (
        item.district.casefold() == listing.district.casefold()
        and _optional_match(item.building_type, listing.building_type)
        and _optional_match(item.renovation_state, listing.renovation_state)
        and abs(item.area_m2 - listing.area_m2) <= max(10, listing.area_m2 * 0.15)
        and item.rooms == listing.rooms
    )


def _same_district(item: Listing, listing: Listing) -> bool:
    return (
        item.district.casefold() == listing.district.casefold()
        and abs(item.area_m2 - listing.area_m2) <= max(15, listing.area_m2 * 0.20)
        and abs(item.rooms - listing.rooms) <= 1
    )


def _same_city(item: Listing, listing: Listing) -> bool:
    return (
        abs(item.area_m2 - listing.area_m2) <= max(15, listing.area_m2 * 0.20)
        and abs(item.rooms - listing.rooms) <= 1
    )


def _widened(item: Listing, listing: Listing) -> bool:
    return (
        abs(item.area_m2 - listing.area_m2) <= max(25, listing.area_m2 * 0.30)
        and abs(item.rooms - listing.rooms) <= 2
    )


def _optional_match(left: str | None, right: str | None) -> bool:
    return left is None or right is None or left == right


def _relevance_sort_key(item: Listing, listing: Listing) -> tuple:
    distance = _distance_m(item, listing)
    return (
        -_similarity_score(listing, item),
        distance if distance is not None else 10_000_000,
        abs(item.area_m2 - listing.area_m2),
        abs(item.rooms - listing.rooms),
        -item.last_seen_at.toordinal(),
        item.id,
    )


def _selection_status(level: int, similarities: list[int], count: int) -> str:
    if count < MINIMUM_COMPARABLE_SAMPLE:
        return "insufficient"
    if level <= 1 and median(similarities) >= 70:
        return "strong"
    return "limited"


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
    if subject.district.casefold() == comparable.district.casefold():
        score += 25
    elif subject.city.casefold() == comparable.city.casefold():
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
    if subject.district.casefold() == comparable.district.casefold():
        factors.append("same_district")
    elif subject.city.casefold() == comparable.city.casefold():
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
