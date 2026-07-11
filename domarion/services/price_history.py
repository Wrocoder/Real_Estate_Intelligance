from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date

from domarion.schemas import Listing, PriceHistoryPoint


@dataclass(frozen=True)
class PriceHistoryMetrics:
    first_seen_at: date
    last_seen_at: date
    current_price: int
    current_price_per_m2: int
    days_on_market: int
    price_reductions: int
    price_increases: int


def summarize_price_history(
    history: Sequence[PriceHistoryPoint],
    current_index: int | None = None,
) -> PriceHistoryMetrics | None:
    if not history:
        return None

    ordered_history = sorted(history, key=lambda point: point.observed_at)
    if current_index is None:
        current_index = len(ordered_history) - 1
    current_index = max(0, min(current_index, len(ordered_history) - 1))
    active_history = ordered_history[: current_index + 1]
    current = active_history[-1]

    return PriceHistoryMetrics(
        first_seen_at=active_history[0].observed_at,
        last_seen_at=current.observed_at,
        current_price=current.price,
        current_price_per_m2=current.price_per_m2,
        days_on_market=max((current.observed_at - active_history[0].observed_at).days, 0),
        price_reductions=_count_price_moves(active_history, direction="down"),
        price_increases=_count_price_moves(active_history, direction="up"),
    )


def listing_with_price_history_metrics(
    listing: Listing,
    history: Sequence[PriceHistoryPoint],
    current_index: int | None = None,
) -> Listing:
    metrics = summarize_price_history(history, current_index=current_index)
    if metrics is None:
        return listing

    return listing.model_copy(
        update={
            "price": metrics.current_price,
            "price_per_m2": metrics.current_price_per_m2,
            "first_seen_at": metrics.first_seen_at,
            "last_seen_at": metrics.last_seen_at,
            "days_on_market": metrics.days_on_market,
            "price_reductions": metrics.price_reductions,
            "price_increases": metrics.price_increases,
        }
    )


def _count_price_moves(
    history: Sequence[PriceHistoryPoint],
    direction: str,
) -> int:
    moves = 0
    for previous, current in zip(history, history[1:], strict=False):
        if direction == "down" and current.price < previous.price:
            moves += 1
        elif direction == "up" and current.price > previous.price:
            moves += 1
    return moves
