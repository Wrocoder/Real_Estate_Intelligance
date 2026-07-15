from statistics import mean

from domarion.schemas import (
    CompareItemMetrics,
    CompareMortgageAssumptions,
    CompareResponse,
    CompareSummary,
    ListingAnalysis,
    MortgageCalculationRequest,
)
from domarion.services.mortgage import calculate_mortgage

DEFAULT_DOWN_PAYMENT_PCT = 20.0
DEFAULT_LOAN_YEARS = 25
DEFAULT_ANNUAL_INTEREST_RATE_PCT = 7.5


def build_listing_comparison(analyses: list[ListingAnalysis]) -> CompareResponse:
    if len(analyses) < 2:
        raise ValueError("At least two listing analyses are required")

    assumptions = CompareMortgageAssumptions(
        down_payment_pct=DEFAULT_DOWN_PAYMENT_PCT,
        loan_years=DEFAULT_LOAN_YEARS,
        annual_interest_rate_pct=DEFAULT_ANNUAL_INTEREST_RATE_PCT,
        rate_type="fixed",
    )
    unranked = [_build_item_metrics(analysis, assumptions) for analysis in analyses]
    ranked = [
        metric.model_copy(update={"rank": rank})
        for rank, metric in enumerate(
            sorted(
                unranked,
                key=lambda metric: (
                    -metric.decision_score,
                    metric.risk_score,
                    metric.estimated_monthly_payment_pln,
                    metric.listing_id,
                ),
            ),
            start=1,
        )
    ]

    return CompareResponse(
        items=analyses,
        metrics=ranked,
        summary=_build_summary(ranked),
        mortgage_assumptions=assumptions,
    )


def _build_item_metrics(
    analysis: ListingAnalysis,
    assumptions: CompareMortgageAssumptions,
) -> CompareItemMetrics:
    listing = analysis.listing
    scores = analysis.scores
    down_payment = round(listing.price * assumptions.down_payment_pct / 100)
    mortgage = calculate_mortgage(
        MortgageCalculationRequest(
            property_price_pln=listing.price,
            down_payment_pln=down_payment,
            loan_years=assumptions.loan_years,
            annual_interest_rate_pct=assumptions.annual_interest_rate_pct,
            rate_type=assumptions.rate_type,
            market_type=listing.market_type,
            include_pcc=listing.market_type == "secondary",
        )
    )
    fair_price_gap = listing.price - scores.fair_price_mid
    estimated_rental_yield = _estimated_gross_rental_yield_pct(analysis)
    estimated_monthly_rent = round(listing.price * estimated_rental_yield / 100 / 12)
    decision_score = _decision_score(analysis)

    return CompareItemMetrics(
        listing_id=listing.id,
        rank=1,
        decision_score=decision_score,
        decision_label=scores.decision_label,
        price_label=scores.price_label,
        risk_label=scores.risk_label,
        liquidity_label=scores.liquidity_label,
        rental_potential_label=scores.rental_potential_label,
        investment_score=scores.investment_score,
        risk_score=scores.risk_score,
        negotiation_score=scores.negotiation_score,
        liquidity_score=scores.liquidity_score,
        rental_potential_score=scores.rental_potential_score,
        price_per_m2_pln=listing.price_per_m2,
        fair_price_mid_pln=scores.fair_price_mid,
        price_delta_to_fair_mid_pct=scores.price_delta_to_fair_mid_pct,
        fair_price_gap_pln=fair_price_gap,
        estimated_discount_to_fair_mid_pln=max(fair_price_gap, 0),
        down_payment_pln=mortgage.costs.down_payment_pln,
        loan_amount_pln=mortgage.costs.loan_amount_pln,
        estimated_monthly_payment_pln=mortgage.base_scenario.monthly_total_payment_pln,
        estimated_monthly_payment_per_m2_pln=round(
            mortgage.base_scenario.monthly_total_payment_pln / listing.area_m2
        ),
        upfront_cash_needed_pln=mortgage.costs.upfront_cash_needed_pln,
        estimated_gross_rental_yield_pct=estimated_rental_yield,
        estimated_monthly_rent_pln=estimated_monthly_rent,
        recommendation=_recommendation(analysis, decision_score),
        reasons=scores.reasons[:3],
        warnings=(scores.warnings + analysis.data_quality_notes)[:3],
    )


def _build_summary(metrics: list[CompareItemMetrics]) -> CompareSummary:
    best = min(metrics, key=lambda metric: metric.rank)
    best_value = min(
        metrics,
        key=lambda metric: (
            metric.price_delta_to_fair_mid_pct,
            -metric.investment_score,
            metric.listing_id,
        ),
    )
    lowest_payment = min(
        metrics,
        key=lambda metric: (metric.estimated_monthly_payment_pln, metric.listing_id),
    )
    strongest_liquidity = max(
        metrics,
        key=lambda metric: (metric.liquidity_score, -metric.risk_score, metric.listing_id),
    )
    strongest_rental = max(
        metrics,
        key=lambda metric: (metric.rental_potential_score, -metric.risk_score, metric.listing_id),
    )
    riskiest = max(metrics, key=lambda metric: (metric.risk_score, metric.listing_id))

    return CompareSummary(
        best_listing_id=best.listing_id,
        best_value_listing_id=best_value.listing_id,
        lowest_monthly_payment_listing_id=lowest_payment.listing_id,
        strongest_liquidity_listing_id=strongest_liquidity.listing_id,
        strongest_rental_listing_id=strongest_rental.listing_id,
        riskiest_listing_id=riskiest.listing_id,
        average_price_per_m2=round(mean(metric.price_per_m2_pln for metric in metrics)),
        average_estimated_monthly_payment_pln=round(
            mean(metric.estimated_monthly_payment_pln for metric in metrics)
        ),
        average_liquidity_score=round(mean(metric.liquidity_score for metric in metrics)),
        average_rental_potential_score=round(
            mean(metric.rental_potential_score for metric in metrics)
        ),
        notes=[
            "Ипотека рассчитана на едином baseline: 20% wkład własny, 25 лет, 7.5% fixed.",
            (
                "Decision score балансирует investment, risk, liquidity, "
                "rental potential и переплату к fair price."
            ),
        ],
    )


def _decision_score(analysis: ListingAnalysis) -> int:
    scores = analysis.scores
    overpricing_penalty = max(scores.price_delta_to_fair_mid_pct, 0) * 0.65
    value = (
        scores.investment_score * 0.42
        + (100 - scores.risk_score) * 0.16
        + scores.liquidity_score * 0.17
        + scores.rental_potential_score * 0.15
        + scores.negotiation_score * 0.10
        - overpricing_penalty
    )
    return round(_clamp(value, 0, 100))


def _estimated_gross_rental_yield_pct(analysis: ListingAnalysis) -> float:
    scores = analysis.scores
    area = analysis.area_statistics
    estimate = 4.0 + (scores.rental_potential_score - 50) * 0.035
    estimate += max(min(area.price_change_90d_pct, 8), -8) * 0.03
    estimate -= max(analysis.listing.distance_to_center_km - 6, 0) * 0.04
    return round(_clamp(estimate, 2.5, 7.5), 2)


def _recommendation(analysis: ListingAnalysis, decision_score: int) -> str:
    scores = analysis.scores
    if scores.risk_score >= 70:
        return (
            "Сначала проверить юридические и рыночные риски; "
            "объект не стоит брать без сильного дисконта."
        )
    if scores.price_delta_to_fair_mid_pct >= 12:
        return "Цена заметно выше fair range; основной сценарий - торг или ожидание снижения."
    if decision_score >= 75 and scores.liquidity_score >= 60:
        return "Лучший кандидат для короткого списка: хорошее сочетание цены, ликвидности и рисков."
    if scores.rental_potential_score >= 70:
        return "Сильнее подходит инвестору: стоит проверить реалистичную аренду и расходы."
    if scores.liquidity_score < 40:
        return "Покупка возможна, но выход из объекта может быть медленнее среднего."
    return "Можно рассматривать после проверки документов, состояния здания и реальных расходов."


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(value, high))
