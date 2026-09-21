from datetime import datetime

from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.schemas import TransactionBacktestObservation
from domarion.services.backtesting import (
    FAIR_PRICE_BACKTEST_VERSION,
    build_scoring_backtest_report,
    run_scoring_backtest,
)
from domarion.services.scoring import SCORING_FORMULA_VERSION


def _transaction(
    index: int,
    *,
    price_per_m2: int,
    month: int,
    day: int = 10,
    logical_id: str | None = None,
    city: str = "Wrocław",
    district: str = "Fabryczna",
    area_id: str = "wroclaw-fabryczna",
    observed_at: datetime | None = None,
) -> TransactionBacktestObservation:
    area_m2 = 60.0
    return TransactionBacktestObservation(
        id=f"txn-{index}",
        logical_transaction_id=logical_id or f"logical-{index}",
        source_name="Test RCN",
        source_type="transaction_register",
        transaction_date=datetime(2026, month, day, 12, 0),
        observed_at=observed_at or datetime(2026, month, day, 13, 0),
        city=city,
        district=district,
        area_id=area_id,
        municipality=city,
        address=f"Testowa {index}",
        market_type="secondary",
        property_price_gross=round(price_per_m2 * area_m2),
        area_m2=area_m2,
        price_per_m2=price_per_m2,
        rooms=3,
        floor=2,
        building_year=2010,
        lat=51.1200 + index * 0.001,
        lon=16.9500 + index * 0.001,
        data_quality_score=90,
    )


def _repository(transactions: list[TransactionBacktestObservation]) -> InMemoryRealEstateRepository:
    repository = InMemoryRealEstateRepository(include_demo_data=False)
    repository._transaction_observations = transactions
    return repository


def test_scoring_backtest_evaluates_temporal_transaction_holdouts() -> None:
    repository = _repository(
        [
            _transaction(1, price_per_m2=10_000, month=1),
            _transaction(2, price_per_m2=10_200, month=2),
            _transaction(3, price_per_m2=9_800, month=3),
            _transaction(4, price_per_m2=10_100, month=4),
            _transaction(5, price_per_m2=10_300, month=5),
            _transaction(6, price_per_m2=9_900, month=6),
        ]
    )

    result = run_scoring_backtest(repository, city="Wrocław", item_limit=2)

    assert result.formula_version == SCORING_FORMULA_VERSION
    assert result.backtest_version == FAIR_PRICE_BACKTEST_VERSION
    assert result.methodology == "temporal_transaction_holdout"
    assert result.weights_profile == "default-v1"
    assert result.transactions_seen == 6
    assert result.transactions_evaluated == 3
    assert result.skipped_insufficient_history == 3
    assert result.evaluated_points == 3
    assert result.mean_absolute_error_pln is not None
    assert result.median_absolute_percentage_error is not None
    assert result.rmse_pln is not None
    assert result.prediction_interval_coverage_pct is not None
    assert result.within_10_pct is not None
    assert len(result.items) == 2
    assert result.items[0].backtest_method == "temporal_transaction_holdout"
    assert result.items[0].comparable_count == 3
    assert result.items[0].evidence_observed_to < result.items[0].target_observed_at
    assert result.items[0].leakage_cutoff == result.items[0].target_observed_at
    assert result.items[0].predicted_fair_price_low <= result.items[0].predicted_fair_price_mid
    assert result.items[0].predicted_fair_price_high >= result.items[0].predicted_fair_price_mid


def test_scoring_backtest_prevents_future_same_day_and_late_observed_leakage() -> None:
    base_transactions = [
        _transaction(1, price_per_m2=10_000, month=1),
        _transaction(2, price_per_m2=10_200, month=2),
        _transaction(3, price_per_m2=9_800, month=3),
        _transaction(4, price_per_m2=10_100, month=4),
    ]
    baseline = run_scoring_backtest(_repository(base_transactions), city="Wrocław", item_limit=10)
    baseline_target = next(item for item in baseline.items if item.listing_id == "txn-4")

    with_leaks = run_scoring_backtest(
        _repository(
            [
                *base_transactions,
                _transaction(5, price_per_m2=30_000, month=4, day=10),
                _transaction(6, price_per_m2=35_000, month=5),
                _transaction(
                    7,
                    price_per_m2=40_000,
                    month=2,
                    logical_id="late-observed-history",
                    observed_at=datetime(2026, 4, 11, 13, 0),
                ),
            ]
        ),
        city="Wrocław",
        item_limit=10,
    )
    leak_target = next(item for item in with_leaks.items if item.listing_id == "txn-4")

    assert leak_target.predicted_fair_price_mid == baseline_target.predicted_fair_price_mid
    assert leak_target.predicted_fair_price_low == baseline_target.predicted_fair_price_low
    assert leak_target.predicted_fair_price_high == baseline_target.predicted_fair_price_high
    assert leak_target.comparable_count == baseline_target.comparable_count
    assert leak_target.evidence_observed_to == baseline_target.evidence_observed_to


def test_scoring_backtest_is_deterministic() -> None:
    repository = _repository(
        [
            _transaction(1, price_per_m2=10_000, month=1),
            _transaction(2, price_per_m2=10_200, month=2),
            _transaction(3, price_per_m2=9_800, month=3),
            _transaction(4, price_per_m2=10_100, month=4),
            _transaction(5, price_per_m2=10_300, month=5),
        ]
    )

    first = run_scoring_backtest(repository, city="Wrocław", item_limit=10)
    second = run_scoring_backtest(repository, city="Wrocław", item_limit=10)

    assert second.model_dump() == first.model_dump()


def test_scoring_backtest_report_groups_segments_and_recommendations() -> None:
    repository = _repository(
        [
            _transaction(1, price_per_m2=10_000, month=1),
            _transaction(2, price_per_m2=10_200, month=2),
            _transaction(3, price_per_m2=9_800, month=3),
            _transaction(4, price_per_m2=10_100, month=4),
            _transaction(5, price_per_m2=10_300, month=5),
            _transaction(6, price_per_m2=9_900, month=6),
        ]
    )

    report = build_scoring_backtest_report(repository, city="Wrocław", item_limit=3)

    assert report.backtest.formula_version == SCORING_FORMULA_VERSION
    assert report.backtest.backtest_version == FAIR_PRICE_BACKTEST_VERSION
    assert report.backtest.evaluated_points == 3
    assert report.overall_severity in {"healthy", "watch", "drift", "critical"}
    assert report.error_buckets
    assert sum(bucket.evaluated_points for bucket in report.error_buckets) == 3
    assert report.area_drift
    assert report.period_drift
    assert {segment.segment_type for segment in report.segments} >= {
        "city",
        "district",
        "market_type",
        "size_band",
        "rooms",
        "building_age_band",
        "confidence_band",
        "comparable_count",
    }
    assert report.high_error_examples
    assert report.findings
    assert report.recommendations
    assert "Temporal fair-price backtesting" in report.methodology_note
