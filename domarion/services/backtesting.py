from collections import defaultdict
from datetime import UTC, datetime
from statistics import mean, median

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    Listing,
    PriceHistoryPoint,
    ScoringBacktestDriftSegment,
    ScoringBacktestErrorBucket,
    ScoringBacktestItem,
    ScoringBacktestReport,
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


def build_scoring_backtest_report(
    repository: RealEstateRepository,
    city: str | None = None,
    district: str | None = None,
    item_limit: int = 50,
    analysis_item_limit: int = 1000,
) -> ScoringBacktestReport:
    backtest = run_scoring_backtest(
        repository,
        city=city,
        district=district,
        item_limit=max(item_limit, analysis_item_limit),
    )
    analysis_items = backtest.items
    public_backtest = backtest.model_copy(update={"items": analysis_items[:item_limit]})
    error_buckets = _error_buckets(analysis_items)
    area_drift = _drift_segments(analysis_items, segment_type="area")
    period_drift = _drift_segments(analysis_items, segment_type="period")
    high_error_examples = sorted(
        analysis_items,
        key=lambda item: (
            item.absolute_error_pct,
            abs(item.predicted_fair_price_mid - item.actual_price),
        ),
        reverse=True,
    )[: min(item_limit, 10)]
    overall_severity = _overall_severity(backtest)

    return ScoringBacktestReport(
        generated_at=datetime.now(UTC),
        city=city,
        district=district,
        overall_severity=overall_severity,
        quality_label=_quality_label(overall_severity),
        backtest=public_backtest,
        error_buckets=error_buckets,
        area_drift=area_drift,
        period_drift=period_drift,
        high_error_examples=high_error_examples,
        findings=_findings(
            backtest=backtest,
            error_buckets=error_buckets,
            area_drift=area_drift,
            period_drift=period_drift,
        ),
        recommendations=_recommendations(overall_severity, area_drift, period_drift),
        methodology_note=(
            "Backtesting report compares historical fair-price midpoint predictions with "
            "the next observed listing snapshot price. It is a model monitoring tool, not "
            "proof of transaction prices; use it to tune confidence, inspect drift and "
            "prioritize data-quality fixes."
        ),
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


def _error_buckets(items: list[ScoringBacktestItem]) -> list[ScoringBacktestErrorBucket]:
    bucket_defs = [
        ("0_5", "0-5% error", 0.0, 5.0),
        ("5_10", "5-10% error", 5.0, 10.0),
        ("10_15", "10-15% error", 10.0, 15.0),
        ("15_plus", "15%+ error", 15.0, None),
    ]
    total = len(items)
    buckets: list[ScoringBacktestErrorBucket] = []
    for code, label, min_error, max_error in bucket_defs:
        bucket_items = [
            item
            for item in items
            if item.absolute_error_pct >= min_error
            and (max_error is None or item.absolute_error_pct < max_error)
        ]
        errors = [item.absolute_error_pct for item in bucket_items]
        buckets.append(
            ScoringBacktestErrorBucket(
                code=code,
                label=label,
                min_error_pct=min_error,
                max_error_pct=max_error,
                evaluated_points=len(bucket_items),
                share_pct=round(len(bucket_items) / total * 100, 1) if total else 0,
                mean_absolute_error_pct=round(mean(errors), 1) if errors else None,
                overestimate_count=sum(
                    1 for item in bucket_items if item.predicted_fair_price_mid > item.actual_price
                ),
                underestimate_count=sum(
                    1 for item in bucket_items if item.predicted_fair_price_mid < item.actual_price
                ),
            )
        )
    return buckets


def _drift_segments(
    items: list[ScoringBacktestItem],
    *,
    segment_type: str,
) -> list[ScoringBacktestDriftSegment]:
    grouped: dict[str, list[ScoringBacktestItem]] = defaultdict(list)
    for item in items:
        key = item.area_id if segment_type == "area" else item.target_observed_at.strftime("%Y-%m")
        grouped[key].append(item)

    segments = [
        _drift_segment(segment_type=segment_type, key=key, items=segment_items)
        for key, segment_items in grouped.items()
    ]
    return sorted(
        segments,
        key=lambda segment: (
            _severity_rank(segment.severity),
            segment.mean_absolute_error_pct or 0,
            segment.evaluated_points,
            segment.key,
        ),
        reverse=True,
    )


def _drift_segment(
    *,
    segment_type: str,
    key: str,
    items: list[ScoringBacktestItem],
) -> ScoringBacktestDriftSegment:
    errors = [item.absolute_error_pct for item in items]
    mean_error = round(mean(errors), 1) if errors else None
    median_error = round(median(errors), 1) if errors else None
    within_10 = _within_threshold_pct(errors, 10)
    severity = _error_severity(mean_error, within_10)
    label = key if segment_type == "area" else f"Target period {key}"
    return ScoringBacktestDriftSegment(
        segment_type=segment_type,  # type: ignore[arg-type]
        key=key,
        label=label,
        evaluated_points=len(items),
        mean_absolute_error_pct=mean_error,
        median_absolute_error_pct=median_error,
        within_10_pct=within_10,
        severity=severity,
        trend_note=_trend_note(severity, mean_error, within_10),
    )


def _overall_severity(backtest: ScoringBacktestResult) -> str:
    if backtest.evaluated_points == 0:
        return "watch"
    return _error_severity(backtest.mean_absolute_error_pct, backtest.within_10_pct)


def _error_severity(mean_error: float | None, within_10: float | None) -> str:
    if mean_error is None:
        return "watch"
    if mean_error <= 8 and (within_10 is None or within_10 >= 70):
        return "healthy"
    if mean_error <= 12 and (within_10 is None or within_10 >= 50):
        return "watch"
    if mean_error <= 18:
        return "drift"
    return "critical"


def _quality_label(severity: str) -> str:
    match severity:
        case "healthy":
            return "Fair-price model is within the current monitoring target."
        case "watch":
            return "Fair-price model is usable, but monitor confidence and data freshness."
        case "drift":
            return "Fair-price model shows drift; review area baselines and comparables."
        case _:
            return "Fair-price model has high error; reduce confidence until recalibrated."


def _findings(
    *,
    backtest: ScoringBacktestResult,
    error_buckets: list[ScoringBacktestErrorBucket],
    area_drift: list[ScoringBacktestDriftSegment],
    period_drift: list[ScoringBacktestDriftSegment],
) -> list[str]:
    if backtest.evaluated_points == 0:
        return ["No historical transitions are available for fair-price drift monitoring."]

    findings = [
        (
            f"Mean absolute fair-price error is {backtest.mean_absolute_error_pct:.1f}% "
            f"across {backtest.evaluated_points} historical transitions."
        )
        if backtest.mean_absolute_error_pct is not None
        else f"Evaluated {backtest.evaluated_points} historical transitions."
    ]
    if backtest.within_10_pct is not None:
        findings.append(f"{backtest.within_10_pct:.1f}% of points are within 10% error.")

    high_error_bucket = next((bucket for bucket in error_buckets if bucket.code == "15_plus"), None)
    if high_error_bucket and high_error_bucket.evaluated_points:
        findings.append(
            f"{high_error_bucket.share_pct:.1f}% of monitored points exceed 15% error."
        )

    if area_drift:
        worst_area = area_drift[0]
        findings.append(
            f"Worst monitored area: {worst_area.label} with "
            f"{worst_area.mean_absolute_error_pct:.1f}% mean error."
        )
    if period_drift:
        worst_period = period_drift[0]
        findings.append(
            f"Worst monitored period: {worst_period.label} with "
            f"{worst_period.mean_absolute_error_pct:.1f}% mean error."
        )
    return findings


def _recommendations(
    severity: str,
    area_drift: list[ScoringBacktestDriftSegment],
    period_drift: list[ScoringBacktestDriftSegment],
) -> list[str]:
    recommendations = [
        "Use the drift report to size fair-price confidence and decide where to recalibrate.",
        "Review high-error examples before changing scoring weights globally.",
    ]
    if severity in {"drift", "critical"}:
        recommendations.append(
            "Reduce confidence for reports in drifting segments until area baselines and "
            "comparables are refreshed."
        )
    if area_drift:
        recommendations.append(
            f"Prioritize data-quality review for {area_drift[0].label}: comparables, "
            "area median and stale snapshots."
        )
    if period_drift:
        recommendations.append(
            f"Check market regime around {period_drift[0].label}: price drops, supply shock "
            "or source mix change."
        )
    return recommendations


def _trend_note(
    severity: str,
    mean_error: float | None,
    within_10: float | None,
) -> str:
    if mean_error is None:
        return "No enough points to evaluate segment drift."
    if severity == "healthy":
        return "Segment is within current monitoring target."
    if severity == "watch":
        return "Segment is acceptable but should stay on watch."
    if within_10 is not None and within_10 < 50:
        return "Less than half of points are within 10%; recalibration is needed."
    return "Mean error is elevated; inspect source freshness and comparable mix."


def _severity_rank(severity: str) -> int:
    return {
        "healthy": 0,
        "watch": 1,
        "drift": 2,
        "critical": 3,
    }[severity]
