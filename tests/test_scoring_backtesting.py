from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.services.backtesting import build_scoring_backtest_report, run_scoring_backtest
from domarion.services.scoring import SCORING_FORMULA_VERSION


def test_scoring_backtest_evaluates_historical_price_transitions() -> None:
    repository = InMemoryRealEstateRepository()

    result = run_scoring_backtest(repository, city="Wrocław", item_limit=2)

    assert result.formula_version == SCORING_FORMULA_VERSION
    assert result.weights_profile == "default-v1"
    assert result.listings_seen == 3
    assert result.listings_evaluated == 3
    assert result.evaluated_points == 6
    assert result.mean_absolute_error_pct is not None
    assert result.median_absolute_error_pct is not None
    assert result.within_10_pct is not None
    assert len(result.items) == 2
    assert result.items[0].predicted_fair_price_mid > 0
    assert result.items[0].actual_price > 0


def test_scoring_backtest_report_groups_drift_and_recommendations() -> None:
    repository = InMemoryRealEstateRepository()

    report = build_scoring_backtest_report(repository, city="Wrocław", item_limit=3)

    assert report.backtest.formula_version == SCORING_FORMULA_VERSION
    assert report.backtest.evaluated_points == 6
    assert report.overall_severity in {"healthy", "watch", "drift", "critical"}
    assert report.error_buckets
    assert sum(bucket.evaluated_points for bucket in report.error_buckets) == 6
    assert report.area_drift
    assert report.period_drift
    assert report.high_error_examples
    assert report.findings
    assert report.recommendations
    assert "model monitoring" in report.methodology_note
