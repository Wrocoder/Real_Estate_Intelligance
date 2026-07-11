from statistics import mean, median

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    Listing,
    PriceHistoryPoint,
    ScoringBacktestItem,
    ScoringBacktestResult,
)
from domarion.services.scoring import (
    SCORING_FORMULA_VERSION,
    calculate_scores,
    get_scoring_weights,
    scoring_weights_profile,
)


def run_scoring_backtest(
    repository: RealEstateRepository,
    city: str | None = None,
    district: str | None = None,
    item_limit: int = 50,
) -> ScoringBacktestResult:
    listings = repository.list_listings(city=city, district=district)
    weights_profile = scoring_weights_profile(get_scoring_weights())
    items: list[ScoringBacktestItem] = []
    listings_evaluated = set()

    for listing in listings:
        area_statistics = repository.get_area_statistics(listing.area_id)
        history = repository.get_price_history(listing.id)
        if area_statistics is None or len(history) < 2:
            continue

        history = sorted(history, key=lambda point: point.observed_at)
        for index, point in enumerate(history[:-1]):
            target = history[index + 1]
            if target.price <= 0:
                continue

            historical_listing = _listing_at_history_point(listing, history, index)
            scores = calculate_scores(
                historical_listing,
                area_statistics,
                repository.find_comparables(historical_listing),
            )
            absolute_error_pct = abs(scores.fair_price_mid - target.price) / target.price * 100
            items.append(
                ScoringBacktestItem(
                    listing_id=listing.id,
                    title=listing.title,
                    area_id=listing.area_id,
                    observed_at=point.observed_at,
                    target_observed_at=target.observed_at,
                    predicted_fair_price_mid=scores.fair_price_mid,
                    actual_price=target.price,
                    absolute_error_pct=round(absolute_error_pct, 1),
                    formula_version=scores.formula_version,
                    weights_profile=scores.weights_profile,
                )
            )
            listings_evaluated.add(listing.id)

    error_values = [item.absolute_error_pct for item in items]
    return ScoringBacktestResult(
        formula_version=SCORING_FORMULA_VERSION,
        weights_profile=weights_profile,
        listings_seen=len(listings),
        listings_evaluated=len(listings_evaluated),
        evaluated_points=len(items),
        mean_absolute_error_pct=round(mean(error_values), 1) if error_values else None,
        median_absolute_error_pct=round(median(error_values), 1) if error_values else None,
        within_5_pct=_within_threshold_pct(error_values, 5),
        within_10_pct=_within_threshold_pct(error_values, 10),
        items=items[:item_limit],
    )


def _listing_at_history_point(
    listing: Listing,
    history: list[PriceHistoryPoint],
    index: int,
) -> Listing:
    point = history[index]
    return listing.model_copy(
        update={
            "price": point.price,
            "price_per_m2": point.price_per_m2,
            "last_seen_at": point.observed_at,
            "days_on_market": max(0, (point.observed_at - listing.first_seen_at).days),
            "price_reductions": _count_price_moves(history, index, direction="down"),
            "price_increases": _count_price_moves(history, index, direction="up"),
        }
    )


def _count_price_moves(
    history: list[PriceHistoryPoint],
    index: int,
    direction: str,
) -> int:
    count = 0
    for current_index in range(1, index + 1):
        previous_price = history[current_index - 1].price
        current_price = history[current_index].price
        if direction == "down" and current_price < previous_price:
            count += 1
        elif direction == "up" and current_price > previous_price:
            count += 1
    return count


def _within_threshold_pct(values: list[float], threshold: float) -> float | None:
    if not values:
        return None
    matched = sum(1 for value in values if value <= threshold)
    return round(matched / len(values) * 100, 1)
