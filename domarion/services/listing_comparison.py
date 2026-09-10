from statistics import mean

from domarion.schemas import (
    BuyerDecisionPackage,
    BuyerPriority,
    BuyerProfile,
    CompareItemMetrics,
    CompareMortgageAssumptions,
    CompareRecommendation,
    CompareRecommendationSignal,
    CompareResponse,
    CompareSummary,
    ListingAnalysis,
    MortgageCalculationRequest,
    PurchaseIntent,
)
from domarion.services.buyer_decision import build_buyer_decision
from domarion.services.mortgage import calculate_mortgage

DEFAULT_DOWN_PAYMENT_PCT = 20.0
DEFAULT_LOAN_YEARS = 25
DEFAULT_ANNUAL_INTEREST_RATE_PCT = 7.5


def build_listing_comparison(
    analyses: list[ListingAnalysis],
    *,
    purchase_intent: PurchaseIntent | None = None,
    buyer_profile: BuyerProfile | None = None,
    requested_listing_ids: list[str] | None = None,
    unavailable_listing_ids: list[str] | None = None,
) -> CompareResponse:
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

    effective_intent = purchase_intent or _comparison_intent(analyses)
    return CompareResponse(
        requested_listing_ids=requested_listing_ids
        or [analysis.listing.id for analysis in analyses],
        unavailable_listing_ids=unavailable_listing_ids or [],
        items=analyses,
        metrics=ranked,
        summary=_build_summary(ranked),
        recommendation=_build_recommendation(
            analyses,
            ranked,
            effective_intent,
            buyer_profile,
        ),
        mortgage_assumptions=assumptions,
    )


def _build_item_metrics(
    analysis: ListingAnalysis,
    assumptions: CompareMortgageAssumptions,
) -> CompareItemMetrics:
    listing = analysis.listing
    scores = analysis.scores
    buyer_decision = _buyer_decision(analysis)
    total_acquisition = buyer_decision.total_acquisition
    verdict = buyer_decision.verdict
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
            renovation_budget_pln=total_acquisition.renovation_estimate_pln,
            bank_commission_pct=0.5,
        )
    )
    fair_price_gap = listing.price - scores.fair_price_mid
    estimated_rental_yield = (
        analysis.rental_estimate.gross_yield_pct
        if analysis.rental_estimate is not None
        and analysis.rental_estimate.status == "estimated"
        else None
    )
    estimated_monthly_rent = (
        analysis.rental_estimate.monthly_rent_mid_pln
        if analysis.rental_estimate is not None
        and analysis.rental_estimate.status == "estimated"
        else None
    )
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
        upfront_cash_needed_pln=total_acquisition.upfront_cash_needed_pln,
        renovation_estimate_pln=total_acquisition.renovation_estimate_pln,
        furniture_estimate_pln=total_acquisition.furniture_estimate_pln,
        transaction_costs_pln=total_acquisition.transaction_costs_pln,
        total_move_in_cost_pln=total_acquisition.total_move_in_cost_pln,
        ready_to_move_alternative_price_pln=(
            total_acquisition.ready_to_move_alternative_price_pln
        ),
        post_renovation_value_gap_pln=total_acquisition.post_renovation_value_gap_pln,
        max_reasonable_offer_pln=verdict.max_reasonable_offer_pln,
        opening_offer_pln=verdict.opening_offer_pln,
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
    best_total_cost = min(
        metrics,
        key=lambda metric: (
            metric.total_move_in_cost_pln,
            -metric.decision_score,
            metric.listing_id,
        ),
    )
    liquidity_metrics = [item for item in metrics if item.liquidity_score is not None]
    rental_metrics = [item for item in metrics if item.rental_potential_score is not None]
    strongest_liquidity = (
        max(
            liquidity_metrics,
            key=lambda metric: (
                metric.liquidity_score,
                -metric.risk_score,
                metric.listing_id,
            ),
        )
        if liquidity_metrics
        else None
    )
    strongest_rental = (
        max(
            rental_metrics,
            key=lambda metric: (
                metric.rental_potential_score,
                -metric.risk_score,
                metric.listing_id,
            ),
        )
        if rental_metrics
        else None
    )
    riskiest = max(metrics, key=lambda metric: (metric.risk_score, metric.listing_id))

    return CompareSummary(
        best_listing_id=best.listing_id,
        best_value_listing_id=best_value.listing_id,
        best_total_cost_listing_id=best_total_cost.listing_id,
        lowest_monthly_payment_listing_id=lowest_payment.listing_id,
        strongest_liquidity_listing_id=(
            strongest_liquidity.listing_id if strongest_liquidity is not None else None
        ),
        strongest_rental_listing_id=(
            strongest_rental.listing_id if strongest_rental is not None else None
        ),
        riskiest_listing_id=riskiest.listing_id,
        average_price_per_m2=round(mean(metric.price_per_m2_pln for metric in metrics)),
        average_estimated_monthly_payment_pln=round(
            mean(metric.estimated_monthly_payment_pln for metric in metrics)
        ),
        average_total_move_in_cost_pln=round(
            mean(metric.total_move_in_cost_pln for metric in metrics)
        ),
        average_liquidity_score=_optional_mean(
            [metric.liquidity_score for metric in metrics]
        ),
        average_rental_potential_score=_optional_mean(
            [metric.rental_potential_score for metric in metrics]
        ),
        notes=[
            "Ипотека рассчитана на едином baseline: 20% wkład własny, 25 лет, 7.5% fixed.",
            (
                "Decision score балансирует только доступные investment, risk, liquidity, "
                "rental potential и negotiation signals, затем учитывает переплату."
            ),
            (
                "Total move-in cost включает цену, transaction costs, ремонт "
                "и базовую мебель/оборудование."
            ),
        ],
    )


def _decision_score(analysis: ListingAnalysis) -> int:
    scores = analysis.scores
    total_acquisition = _buyer_decision(analysis).total_acquisition
    overpricing_penalty = max(scores.price_delta_to_fair_mid_pct, 0) * 0.65
    renovation_gap_penalty = max(total_acquisition.post_renovation_value_gap_pln or 0, 0) / 8000
    value = _weighted_available_score(
        (
            (scores.investment_score, 0.42),
            (100 - scores.risk_score, 0.16),
            (scores.liquidity_score, 0.17),
            (scores.rental_potential_score, 0.15),
            (scores.negotiation_score, 0.10),
        )
    )
    return round(_clamp(value - overpricing_penalty - renovation_gap_penalty, 0, 100))


def _build_recommendation(
    analyses: list[ListingAnalysis],
    metrics: list[CompareItemMetrics],
    purchase_intent: PurchaseIntent,
    buyer_profile: BuyerProfile | None,
) -> CompareRecommendation:
    analyses_by_id = {analysis.listing.id: analysis for analysis in analyses}
    profile_priorities = buyer_profile.priorities if buyer_profile is not None else []
    budget = buyer_profile.budget_pln if buyer_profile is not None else None
    within_budget = [
        metric
        for metric in metrics
        if budget is None or analyses_by_id[metric.listing_id].listing.price <= budget
    ]
    all_over_budget = budget is not None and not within_budget
    candidates = within_budget or metrics

    scored = [
        (
            _recommendation_score(
                analyses_by_id[metric.listing_id],
                metric,
                purchase_intent,
                profile_priorities,
            ),
            metric,
        )
        for metric in candidates
    ]
    score, best = min(
        scored,
        key=lambda item: (-item[0], item[1].rank, item[1].listing_id),
    )
    best_analysis = analyses_by_id[best.listing_id]

    return CompareRecommendation(
        purchase_intent=purchase_intent,
        listing_id=best.listing_id,
        score=round(score),
        personalized=buyer_profile is not None,
        all_over_budget=all_over_budget,
        applied_priorities=profile_priorities,
        reasons=_recommendation_reasons(
            best_analysis,
            best,
            candidates,
            analyses_by_id,
            purchase_intent,
            profile_priorities,
            budget,
        ),
        tradeoffs=_recommendation_tradeoffs(best_analysis, best, metrics, analyses_by_id, budget),
    )


def _recommendation_score(
    analysis: ListingAnalysis,
    metric: CompareItemMetrics,
    purchase_intent: PurchaseIntent,
    priorities: list[BuyerPriority],
) -> float:
    intent_fit = _intent_fit_score(analysis, purchase_intent)
    price_value = _price_value_score(metric)
    low_risk = 100 - metric.risk_score
    if purchase_intent in {"self", "family"}:
        base_score = _weighted_available_score(
            (
                (intent_fit, 0.55),
                (metric.decision_score, 0.20),
                (low_risk, 0.15),
                (price_value, 0.10),
            )
        )
    elif purchase_intent == "rental":
        base_score = _weighted_available_score(
            (
                (intent_fit, 0.45),
                (metric.rental_potential_score, 0.25),
                (metric.liquidity_score, 0.15),
                (metric.investment_score, 0.10),
                (low_risk, 0.05),
            )
        )
    elif purchase_intent == "investment":
        base_score = _weighted_available_score(
            (
                (intent_fit, 0.40),
                (metric.investment_score, 0.25),
                (metric.rental_potential_score, 0.15),
                (metric.liquidity_score, 0.10),
                (low_risk, 0.10),
            )
        )
    else:
        base_score = metric.decision_score

    priority_values = [
        value
        for priority in priorities
        if (value := _priority_value(priority, analysis, metric)) is not None
    ]
    if not priority_values:
        return base_score
    return base_score * 0.65 + mean(priority_values) * 0.35


def _recommendation_reasons(
    analysis: ListingAnalysis,
    metric: CompareItemMetrics,
    candidates: list[CompareItemMetrics],
    analyses_by_id: dict[str, ListingAnalysis],
    purchase_intent: PurchaseIntent,
    priorities: list[BuyerPriority],
    budget: int | None,
) -> list[CompareRecommendationSignal]:
    signals: list[CompareRecommendationSignal] = []
    intent_fit = _intent_fit_score(analysis, purchase_intent)
    intent_values = [
        value
        for candidate in candidates
        if (value := _intent_fit_score(analyses_by_id[candidate.listing_id], purchase_intent))
        is not None
    ]
    if purchase_intent != "unsure" and intent_fit is not None:
        signals.append(
            CompareRecommendationSignal(
                code="intent_fit",
                value=intent_fit,
                reference_value=max(intent_values) if intent_values else None,
            )
        )
    if budget is not None and analysis.listing.price <= budget:
        signals.append(
            CompareRecommendationSignal(
                code="budget_fit",
                value=analysis.listing.price,
                reference_value=budget,
            )
        )

    for priority in priorities:
        value = _priority_value(priority, analysis, metric)
        available = [
            candidate_value
            for candidate in candidates
            if (
                candidate_value := _priority_value(
                    priority,
                    analyses_by_id[candidate.listing_id],
                    candidate,
                )
            )
            is not None
        ]
        if value is not None and available and value >= max(available):
            signal_value, reference_value = _priority_signal_values(
                priority,
                analysis,
                metric,
                candidates,
                analyses_by_id,
            )
            signals.append(
                CompareRecommendationSignal(
                    code=priority,
                    value=signal_value,
                    reference_value=reference_value,
                )
            )

    fallback = [
        CompareRecommendationSignal(
            code="overall_balance",
            value=metric.decision_score,
            reference_value=max(item.decision_score for item in candidates),
        ),
        CompareRecommendationSignal(
            code="price_value",
            value=metric.price_delta_to_fair_mid_pct,
            reference_value=min(item.price_delta_to_fair_mid_pct for item in candidates),
        ),
        CompareRecommendationSignal(
            code="low_risk",
            value=metric.risk_score,
            reference_value=min(item.risk_score for item in candidates),
        ),
    ]
    if metric.liquidity_score is not None:
        liquidity_values = [
            item.liquidity_score for item in candidates if item.liquidity_score is not None
        ]
        fallback.append(
            CompareRecommendationSignal(
                code="liquidity",
                value=metric.liquidity_score,
                reference_value=max(liquidity_values),
            )
        )
    if metric.rental_potential_score is not None:
        rental_values = [
            item.rental_potential_score
            for item in candidates
            if item.rental_potential_score is not None
        ]
        fallback.append(
            CompareRecommendationSignal(
                code="rental_income",
                value=metric.rental_potential_score,
                reference_value=max(rental_values),
            )
        )

    existing_codes = {signal.code for signal in signals}
    for signal in fallback:
        if len(signals) >= 4:
            break
        if signal.code not in existing_codes and signal.value == signal.reference_value:
            signals.append(signal)
            existing_codes.add(signal.code)
    return signals[:4]


def _recommendation_tradeoffs(
    analysis: ListingAnalysis,
    metric: CompareItemMetrics,
    metrics: list[CompareItemMetrics],
    analyses_by_id: dict[str, ListingAnalysis],
    budget: int | None,
) -> list[CompareRecommendationSignal]:
    signals: list[CompareRecommendationSignal] = []
    listing = analysis.listing
    prices = [item.listing.price for item in analyses_by_id.values()]
    areas = [item.listing.area_m2 for item in analyses_by_id.values()]
    distances = [
        item.listing.distance_to_center_km
        for item in analyses_by_id.values()
        if item.listing.distance_to_center_km is not None
    ]
    liquidity_values = [
        item.liquidity_score for item in metrics if item.liquidity_score is not None
    ]
    rental_values = [
        item.rental_potential_score for item in metrics if item.rental_potential_score is not None
    ]

    if budget is not None and listing.price > budget:
        signals.append(
            CompareRecommendationSignal(
                code="over_budget", value=listing.price, reference_value=budget
            )
        )
    if listing.price > min(prices):
        signals.append(
            CompareRecommendationSignal(
                code="higher_price", value=listing.price, reference_value=min(prices)
            )
        )
    if listing.area_m2 < max(areas):
        signals.append(
            CompareRecommendationSignal(
                code="smaller_area", value=listing.area_m2, reference_value=max(areas)
            )
        )
    if (
        listing.distance_to_center_km is not None
        and distances
        and listing.distance_to_center_km > min(distances)
    ):
        signals.append(
            CompareRecommendationSignal(
                code="farther_from_center",
                value=listing.distance_to_center_km,
                reference_value=min(distances),
            )
        )
    minimum_risk = min(item.risk_score for item in metrics)
    if metric.risk_score > minimum_risk:
        signals.append(
            CompareRecommendationSignal(
                code="higher_risk", value=metric.risk_score, reference_value=minimum_risk
            )
        )
    if (
        metric.liquidity_score is not None
        and liquidity_values
        and metric.liquidity_score < max(liquidity_values)
    ):
        signals.append(
            CompareRecommendationSignal(
                code="weaker_liquidity",
                value=metric.liquidity_score,
                reference_value=max(liquidity_values),
            )
        )
    if (
        metric.rental_potential_score is not None
        and rental_values
        and metric.rental_potential_score < max(rental_values)
    ):
        signals.append(
            CompareRecommendationSignal(
                code="weaker_rental_income",
                value=metric.rental_potential_score,
                reference_value=max(rental_values),
            )
        )
    return signals[:3]


def _priority_value(
    priority: BuyerPriority,
    analysis: ListingAnalysis,
    metric: CompareItemMetrics,
) -> int | None:
    if priority == "price_value":
        return _price_value_score(metric)
    if priority == "low_risk":
        return 100 - metric.risk_score
    if priority == "daily_living":
        return _intent_fit_score(analysis, "self")
    if priority == "family_fit":
        return _intent_fit_score(analysis, "family")
    if priority == "liquidity":
        return metric.liquidity_score
    return metric.rental_potential_score


def _priority_signal_values(
    priority: BuyerPriority,
    analysis: ListingAnalysis,
    metric: CompareItemMetrics,
    candidates: list[CompareItemMetrics],
    analyses_by_id: dict[str, ListingAnalysis],
) -> tuple[int | float | None, int | float | None]:
    if priority == "price_value":
        return (
            metric.price_delta_to_fair_mid_pct,
            min(item.price_delta_to_fair_mid_pct for item in candidates),
        )
    if priority == "low_risk":
        return metric.risk_score, min(item.risk_score for item in candidates)
    values = [
        value
        for candidate in candidates
        if (
            value := _priority_value(
                priority,
                analyses_by_id[candidate.listing_id],
                candidate,
            )
        )
        is not None
    ]
    return _priority_value(priority, analysis, metric), max(values) if values else None


def _price_value_score(metric: CompareItemMetrics) -> int:
    return round(_clamp(100 - max(metric.price_delta_to_fair_mid_pct, 0) * 3, 0, 100))


def _intent_fit_score(
    analysis: ListingAnalysis,
    purchase_intent: PurchaseIntent,
) -> int | None:
    if purchase_intent == "unsure":
        return None
    buyer_decision = _buyer_decision(analysis)
    for intent_fit in buyer_decision.intent_fit:
        if intent_fit.intent == purchase_intent:
            return intent_fit.score
    return None


def _comparison_intent(analyses: list[ListingAnalysis]) -> PurchaseIntent:
    buyer_decision = _buyer_decision(analyses[0])
    return buyer_decision.selected_intent


def _recommendation(analysis: ListingAnalysis, decision_score: int) -> str:
    scores = analysis.scores
    buyer_decision = _buyer_decision(analysis)
    if scores.risk_score >= 70:
        return (
            "Сначала проверить юридические и рыночные риски; "
            "объект не стоит брать без сильного дисконта."
        )
    if scores.price_delta_to_fair_mid_pct >= 12:
        return "Цена заметно выше fair range; основной сценарий - торг или ожидание снижения."
    if (
        buyer_decision.total_acquisition.post_renovation_value_gap_pln is not None
        and buyer_decision.total_acquisition.post_renovation_value_gap_pln > 0
    ):
        return (
            "После ремонта и мебели объект теряет ценовое преимущество; сравнить с готовыми "
            "вариантами перед оффером."
        )
    if (
        decision_score >= 75
        and scores.liquidity_score is not None
        and scores.liquidity_score >= 60
    ):
        return "Лучший кандидат для короткого списка: хорошее сочетание цены, ликвидности и рисков."
    if scores.rental_potential_score is not None and scores.rental_potential_score >= 70:
        return "Сильнее подходит инвестору: стоит проверить реалистичную аренду и расходы."
    if scores.liquidity_score is not None and scores.liquidity_score < 40:
        return "Покупка возможна, но выход из объекта может быть медленнее среднего."
    return "Можно рассматривать после проверки документов, состояния здания и реальных расходов."


def _buyer_decision(analysis: ListingAnalysis) -> BuyerDecisionPackage:
    if analysis.buyer_decision is not None:
        return analysis.buyer_decision
    return build_buyer_decision(
        listing=analysis.listing,
        area_statistics=analysis.area_statistics,
        scores=analysis.scores,
        comparables=analysis.comparables,
        data_quality_notes=analysis.data_quality_notes,
        developer_reputation=analysis.developer_reputation,
        future_area_impact=analysis.future_area_impact,
        risk_profile=analysis.risk_profile,
        rental_estimate=analysis.rental_estimate,
        comparables_scope=analysis.comparables_scope,
        comparables_freshness_days=analysis.comparables_freshness_days,
    )


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(value, high))


def _weighted_available_score(components: tuple[tuple[int | None, float], ...]) -> float:
    available = [(value, weight) for value, weight in components if value is not None]
    total_weight = sum(weight for _, weight in available)
    return sum(value * weight for value, weight in available) / total_weight


def _optional_mean(values: list[int | None]) -> int | None:
    available = [value for value in values if value is not None]
    return round(mean(available)) if available else None
