from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime
from math import sqrt
from statistics import mean, median

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    AreaStatistics,
    DataProvenance,
    Listing,
    ScoringBacktestDriftSegment,
    ScoringBacktestErrorBucket,
    ScoringBacktestItem,
    ScoringBacktestReport,
    ScoringBacktestResult,
    TransactionBacktestObservation,
)
from domarion.services.comparables import select_comparables
from domarion.services.scoring import (
    SCORING_FORMULA_VERSION,
    calculate_scores,
    get_scoring_weights,
    scoring_weights_profile,
)

FAIR_PRICE_BACKTEST_VERSION = "fair-price-temporal-backtest-v1"
MINIMUM_BACKTEST_HISTORY = 3


class _TemporalTransactionRepository:
    def __init__(self, listings: list[Listing]) -> None:
        self._listings = listings

    def list_listings(self, *args, **kwargs) -> list[Listing]:
        return list(self._listings)


def run_scoring_backtest(
    repository: RealEstateRepository,
    city: str | None = None,
    district: str | None = None,
    item_limit: int = 50,
) -> ScoringBacktestResult:
    transactions = repository.list_transaction_observations(city=city, district=district)
    weights_profile = scoring_weights_profile(get_scoring_weights())
    all_items: list[ScoringBacktestItem] = []
    skipped_insufficient_history = 0

    for target in transactions:
        if target.property_price_gross <= 0 or not _has_coordinates(target):
            skipped_insufficient_history += 1
            continue

        evidence = [
            item
            for item in transactions
            if item.transaction_date < target.transaction_date
            and item.observed_at < target.transaction_date
            and item.logical_transaction_id != target.logical_transaction_id
            and item.city.casefold() == target.city.casefold()
            and item.market_type == target.market_type
            and _has_coordinates(item)
        ]
        baseline = [item for item in evidence if item.area_id == target.area_id] or evidence
        if len(baseline) < MINIMUM_BACKTEST_HISTORY:
            skipped_insufficient_history += 1
            continue

        area_statistics = _historical_area_statistics(target, baseline)
        subject = _subject_listing(target, area_statistics)
        comparable_candidates = [_transaction_to_listing(item) for item in evidence]
        selection = select_comparables(
            _TemporalTransactionRepository(comparable_candidates),
            subject,
        )
        scores = calculate_scores(
            subject,
            area_statistics,
            selection.items,
            comparable_selection=selection,
            evaluation_date=target.transaction_date.date(),
        )
        absolute_error_pln = abs(scores.fair_price_mid - target.property_price_gross)
        absolute_error_pct = absolute_error_pln / target.property_price_gross * 100
        interval_hit = (
            scores.fair_price_low <= target.property_price_gross <= scores.fair_price_high
        )
        confidence = scores.fair_price_confidence
        confidence_band = (
            "insufficient"
            if confidence is not None and confidence.evidence_status == "insufficient"
            else confidence.level
            if confidence is not None
            else None
        )
        all_items.append(
            ScoringBacktestItem(
                listing_id=target.id,
                title=f"Historical transaction {target.logical_transaction_id}",
                area_id=target.area_id,
                city=target.city,
                district=target.district,
                market_type=target.market_type,
                size_band=_size_band(target.area_m2),
                rooms=target.rooms,
                building_age_band=_building_age_band(target.building_year, target.transaction_date),
                confidence_band=confidence_band,  # type: ignore[arg-type]
                comparable_count=len(selection.items),
                observed_at=_max_transaction_date(baseline),
                target_observed_at=target.transaction_date.date(),
                predicted_fair_price_mid=scores.fair_price_mid,
                predicted_fair_price_low=scores.fair_price_low,
                predicted_fair_price_high=scores.fair_price_high,
                actual_price=target.property_price_gross,
                absolute_error_pln=absolute_error_pln,
                absolute_error_pct=round(absolute_error_pct, 1),
                interval_hit=interval_hit,
                leakage_cutoff=target.transaction_date.date(),
                evidence_observed_to=_max_transaction_date(baseline),
                backtest_method="temporal_transaction_holdout",
                formula_version=scores.formula_version,
                weights_profile=scores.weights_profile,
            )
        )

    return _backtest_result(
        transactions_seen=len(transactions),
        transactions_evaluated=len({item.listing_id for item in all_items}),
        skipped_insufficient_history=skipped_insufficient_history,
        items=all_items,
        item_limit=item_limit,
        weights_profile=weights_profile,
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
    segments = [
        segment
        for segment_type in (
            "city",
            "district",
            "market_type",
            "size_band",
            "rooms",
            "building_age_band",
            "confidence_band",
            "comparable_count",
        )
        for segment in _drift_segments(analysis_items, segment_type=segment_type)
    ]
    high_error_examples = sorted(
        analysis_items,
        key=lambda item: (item.absolute_error_pct, item.absolute_error_pln),
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
        segments=segments,
        high_error_examples=high_error_examples,
        findings=_findings(
            backtest=backtest,
            error_buckets=error_buckets,
            area_drift=area_drift,
            period_drift=period_drift,
        ),
        recommendations=_recommendations(overall_severity, area_drift, period_drift),
        methodology_note=(
            "Temporal fair-price backtesting holds out each historical transaction price, "
            "uses only transaction evidence dated before that transaction, calculates the "
            "fair-price midpoint and compares the prediction with the actual transaction "
            "price. It is reproducible model monitoring, not a valuation certificate."
        ),
    )


def _backtest_result(
    *,
    transactions_seen: int,
    transactions_evaluated: int,
    skipped_insufficient_history: int,
    items: list[ScoringBacktestItem],
    item_limit: int,
    weights_profile: str,
) -> ScoringBacktestResult:
    absolute_errors = [item.absolute_error_pln for item in items]
    percent_errors = [item.absolute_error_pct for item in items]
    return ScoringBacktestResult(
        formula_version=SCORING_FORMULA_VERSION,
        weights_profile=weights_profile,
        backtest_version=FAIR_PRICE_BACKTEST_VERSION,
        methodology="temporal_transaction_holdout",
        listings_seen=transactions_seen,
        listings_evaluated=transactions_evaluated,
        transactions_seen=transactions_seen,
        transactions_evaluated=transactions_evaluated,
        skipped_insufficient_history=skipped_insufficient_history,
        evaluated_points=len(items),
        mean_absolute_error_pln=round(mean(absolute_errors), 1) if absolute_errors else None,
        mean_absolute_error_pct=round(mean(percent_errors), 1) if percent_errors else None,
        median_absolute_error_pct=round(median(percent_errors), 1) if percent_errors else None,
        rmse_pln=round(sqrt(mean(error * error for error in absolute_errors)), 1)
        if absolute_errors
        else None,
        median_absolute_percentage_error=round(median(percent_errors), 1)
        if percent_errors
        else None,
        prediction_interval_coverage_pct=_coverage_pct(items),
        within_5_pct=_within_threshold_pct(percent_errors, 5),
        within_10_pct=_within_threshold_pct(percent_errors, 10),
        items=items[:item_limit],
    )


def _historical_area_statistics(
    target: TransactionBacktestObservation,
    evidence: list[TransactionBacktestObservation],
) -> AreaStatistics:
    prices = [item.price_per_m2 for item in evidence]
    observed_from = min(item.transaction_date for item in evidence)
    observed_to = max(item.transaction_date for item in evidence)
    return AreaStatistics(
        area_id=target.area_id,
        name=target.district or target.city,
        city=target.city,
        median_price_per_m2=round(median(prices)),
        average_price_per_m2=round(mean(prices)),
        active_listings=0,
        new_listings_30d=0,
        removed_listings_30d=0,
        average_days_on_market=0,
        price_change_90d_pct=0,
        supply_change_90d_pct=0,
        price_basis="transaction_observed",
        listing_metrics_available=False,
        transaction_observation_count=len(evidence),
        transaction_median_price_per_m2=round(median(prices)),
        transaction_observed_from=observed_from,
        transaction_observed_to=observed_to,
        transaction_window_days=max(1, (observed_to - observed_from).days or 1),
        transaction_history_observation_count=len(evidence),
        transaction_history_observed_from=observed_from,
        transaction_history_observed_to=observed_to,
        data_sources=sorted({item.source_name for item in evidence}),
        data_provenance=DataProvenance(
            source_type="transaction_register",
            source_name=", ".join(sorted({item.source_name for item in evidence})[:2])
            or "transaction register",
            calculation_type="calculated",
            sample_size=len(evidence),
            geographic_scope=target.district or target.city,
            time_range=f"{observed_from.date().isoformat()}-{observed_to.date().isoformat()}",
            updated_at=observed_to,
        ),
    )


def _subject_listing(
    target: TransactionBacktestObservation,
    area_statistics: AreaStatistics,
) -> Listing:
    reference_price_per_m2 = area_statistics.median_price_per_m2
    reference_price = round(reference_price_per_m2 * target.area_m2)
    return _transaction_to_listing(
        target,
        listing_id=f"subject-{target.id}",
        title=f"Backtest subject {target.logical_transaction_id}",
        price=reference_price,
        price_per_m2=reference_price_per_m2,
    )


def _transaction_to_listing(
    transaction: TransactionBacktestObservation,
    *,
    listing_id: str | None = None,
    title: str | None = None,
    price: int | None = None,
    price_per_m2: int | None = None,
) -> Listing:
    observed_date = transaction.transaction_date.date()
    return Listing(
        id=listing_id or transaction.id,
        title=title or f"Historical comparable {transaction.logical_transaction_id}",
        source_name=transaction.source_name,
        source_url="",
        data_provenance=DataProvenance(
            source_type=transaction.source_type,
            source_name=transaction.source_name,
            calculation_type="observed",
            updated_at=transaction.observed_at,
        ),
        city=transaction.city,
        district=transaction.district or "Unknown",
        area_id=transaction.area_id,
        municipality=transaction.municipality or transaction.city,
        address=transaction.address or "Address unavailable",
        market_type=transaction.market_type,
        price=price or transaction.property_price_gross,
        currency=transaction.currency,
        area_m2=transaction.area_m2,
        price_per_m2=price_per_m2 or round(transaction.price_per_m2),
        rooms=transaction.rooms or 1,
        floor=transaction.floor,
        building_year=transaction.building_year,
        first_seen_at=observed_date,
        last_seen_at=observed_date,
        days_on_market=0,
        price_reductions=0,
        price_increases=0,
        relisted=False,
        lat=transaction.lat if transaction.lat is not None else 0,
        lon=transaction.lon if transaction.lon is not None else 0,
        data_quality_score=transaction.data_quality_score,
    )


def _has_coordinates(transaction: TransactionBacktestObservation) -> bool:
    return transaction.lat is not None and transaction.lon is not None


def _max_transaction_date(items: list[TransactionBacktestObservation]):
    return max(item.transaction_date for item in items).date()


def _size_band(area_m2: float) -> str:
    if area_m2 < 35:
        return "under_35_m2"
    if area_m2 < 50:
        return "35_49_m2"
    if area_m2 < 70:
        return "50_69_m2"
    if area_m2 < 90:
        return "70_89_m2"
    return "90_plus_m2"


def _building_age_band(building_year: int | None, observed_at: datetime) -> str:
    if building_year is None:
        return "unknown"
    age = observed_at.year - building_year
    if age <= 5:
        return "0_5_years"
    if age <= 15:
        return "6_15_years"
    if age <= 30:
        return "16_30_years"
    return "30_plus_years"


def _comparable_count_band(count: int) -> str:
    if count < 3:
        return "0_2"
    if count < 5:
        return "3_4"
    return "5_plus"


def _within_threshold_pct(values: list[float], threshold: float) -> float | None:
    if not values:
        return None
    matched = sum(1 for value in values if value <= threshold)
    return round(matched / len(values) * 100, 1)


def _coverage_pct(items: list[ScoringBacktestItem]) -> float | None:
    interval_items = [item for item in items if item.interval_hit is not None]
    if not interval_items:
        return None
    matched = sum(1 for item in interval_items if item.interval_hit)
    return round(matched / len(interval_items) * 100, 1)


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
        key = _segment_key(item, segment_type)
        if key:
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


def _segment_key(item: ScoringBacktestItem, segment_type: str) -> str | None:
    if segment_type == "area":
        return item.area_id
    if segment_type == "period":
        return item.target_observed_at.strftime("%Y-%m")
    if segment_type == "city":
        return item.city
    if segment_type == "district":
        return item.district or "unknown"
    if segment_type == "market_type":
        return item.market_type
    if segment_type == "size_band":
        return item.size_band
    if segment_type == "rooms":
        return str(item.rooms) if item.rooms is not None else "unknown"
    if segment_type == "building_age_band":
        return item.building_age_band
    if segment_type == "confidence_band":
        return item.confidence_band
    if segment_type == "comparable_count":
        return _comparable_count_band(item.comparable_count)
    return None


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
    return ScoringBacktestDriftSegment(
        segment_type=segment_type,  # type: ignore[arg-type]
        key=key,
        label=_segment_label(segment_type, key),
        evaluated_points=len(items),
        mean_absolute_error_pct=mean_error,
        median_absolute_error_pct=median_error,
        within_10_pct=within_10,
        severity=severity,
        trend_note=_trend_note(severity, mean_error, within_10),
    )


def _segment_label(segment_type: str, key: str) -> str:
    if segment_type == "period":
        return f"Transaction period {key}"
    if segment_type == "comparable_count":
        return f"Comparable count {key}"
    return key


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
            return "Fair-price temporal backtest is within the current monitoring target."
        case "watch":
            return "Fair-price temporal backtest is usable, but sample quality needs watching."
        case "drift":
            return (
                "Fair-price temporal backtest shows drift; review area baselines and comparables."
            )
        case _:
            return (
                "Fair-price temporal backtest has high error; reduce confidence until recalibrated."
            )


def _findings(
    *,
    backtest: ScoringBacktestResult,
    error_buckets: list[ScoringBacktestErrorBucket],
    area_drift: list[ScoringBacktestDriftSegment],
    period_drift: list[ScoringBacktestDriftSegment],
) -> list[str]:
    if backtest.evaluated_points == 0:
        return ["No historical transactions are available for temporal fair-price backtesting."]

    findings = [
        (
            f"Mean absolute fair-price error is {backtest.mean_absolute_error_pct:.1f}% "
            f"across {backtest.evaluated_points} historical transactions."
        )
        if backtest.mean_absolute_error_pct is not None
        else f"Evaluated {backtest.evaluated_points} historical transactions."
    ]
    if backtest.median_absolute_percentage_error is not None:
        findings.append(
            f"Median absolute percentage error is {backtest.median_absolute_percentage_error:.1f}%."
        )
    if backtest.prediction_interval_coverage_pct is not None:
        findings.append(
            f"{backtest.prediction_interval_coverage_pct:.1f}% of held-out transaction "
            "prices fall inside the predicted fair-price range."
        )

    high_error_bucket = next((bucket for bucket in error_buckets if bucket.code == "15_plus"), None)
    if high_error_bucket and high_error_bucket.evaluated_points:
        findings.append(
            f"{high_error_bucket.share_pct:.1f}% of temporal backtest points exceed 15% error."
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
        "Use temporal backtest metrics to calibrate fair-price confidence and range width.",
        "Review high-error examples before changing scoring weights globally.",
    ]
    if severity in {"drift", "critical"}:
        recommendations.append(
            "Reduce confidence for reports in drifting segments until transaction baselines "
            "and comparable selection are reviewed."
        )
    if area_drift:
        recommendations.append(
            f"Prioritize data-quality review for {area_drift[0].label}: historical "
            "transaction density, coordinates and comparable filters."
        )
    if period_drift:
        recommendations.append(
            f"Check market regime around {period_drift[0].label}: sparse RCN evidence, "
            "price shock or source-version changes."
        )
    return recommendations


def _trend_note(
    severity: str,
    mean_error: float | None,
    within_10: float | None,
) -> str:
    if mean_error is None:
        return "Not enough points to evaluate this segment."
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
