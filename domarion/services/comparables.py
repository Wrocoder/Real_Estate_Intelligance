from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

from domarion.schemas import Listing


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
