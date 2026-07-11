from datetime import date

from domarion.schemas import Listing, PriceHistoryPoint
from domarion.services.price_history import (
    listing_with_price_history_metrics,
    summarize_price_history,
)


def test_price_history_summary_counts_market_time_and_price_moves() -> None:
    history = [
        PriceHistoryPoint(observed_at=date(2026, 7, 20), price=710000, price_per_m2=11993),
        PriceHistoryPoint(observed_at=date(2026, 7, 1), price=700000, price_per_m2=11824),
        PriceHistoryPoint(observed_at=date(2026, 7, 10), price=720000, price_per_m2=12162),
        PriceHistoryPoint(observed_at=date(2026, 7, 25), price=710000, price_per_m2=11993),
    ]

    metrics = summarize_price_history(history)

    assert metrics is not None
    assert metrics.first_seen_at == date(2026, 7, 1)
    assert metrics.last_seen_at == date(2026, 7, 25)
    assert metrics.current_price == 710000
    assert metrics.current_price_per_m2 == 11993
    assert metrics.days_on_market == 24
    assert metrics.price_increases == 1
    assert metrics.price_reductions == 1


def test_listing_price_history_metrics_can_be_calculated_for_historical_snapshot() -> None:
    listing = _listing()
    history = [
        PriceHistoryPoint(observed_at=date(2026, 7, 1), price=700000, price_per_m2=11824),
        PriceHistoryPoint(observed_at=date(2026, 7, 10), price=720000, price_per_m2=12162),
        PriceHistoryPoint(observed_at=date(2026, 7, 20), price=710000, price_per_m2=11993),
    ]

    historical_listing = listing_with_price_history_metrics(listing, history, current_index=1)
    latest_listing = listing_with_price_history_metrics(listing, history)

    assert historical_listing.price == 720000
    assert historical_listing.last_seen_at == date(2026, 7, 10)
    assert historical_listing.days_on_market == 9
    assert historical_listing.price_increases == 1
    assert historical_listing.price_reductions == 0

    assert latest_listing.price == 710000
    assert latest_listing.last_seen_at == date(2026, 7, 20)
    assert latest_listing.days_on_market == 19
    assert latest_listing.price_increases == 1
    assert latest_listing.price_reductions == 1


def _listing() -> Listing:
    return Listing(
        id="history-test",
        title="History test listing",
        source_name="History Partner",
        source_url="https://agency.test/history-test",
        city="Wrocław",
        district="Fabryczna",
        area_id="wroclaw-fabryczna",
        municipality="Wrocław",
        address="Nowy Dwór",
        market_type="secondary",
        price=999999,
        currency="PLN",
        area_m2=59.2,
        price_per_m2=16892,
        rooms=3,
        first_seen_at=date(2026, 7, 1),
        last_seen_at=date(2026, 7, 1),
        days_on_market=0,
        price_reductions=0,
        price_increases=0,
        relisted=False,
        lat=51.1117,
        lon=16.9653,
        distance_to_center_km=6.8,
        nearest_stop_m=260,
        nearest_school_m=620,
        nearest_major_road_m=420,
        nearest_industrial_zone_m=1900,
        parks_within_1km=2,
        schools_within_1km=2,
        planned_investments_within_2km=3,
        data_quality_score=82,
    )
