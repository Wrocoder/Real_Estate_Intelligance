from collections.abc import Callable
from dataclasses import dataclass

from domarion.schemas import (
    BuyerDecisionPackage,
    ListingAnalysis,
    MortgageCalculationRequest,
    ReportAudience,
    ReportSection,
    ReportTemplateDescriptor,
)
from domarion.services.mortgage import calculate_mortgage
from domarion.services.provenance import provenance_evidence_details

SectionBuilder = Callable[[ListingAnalysis | None], ReportSection]

ACTION_REPORT_LABELS = {
    "verify_kw_owner": "Verify the owner and seller authority in the land register",
    "verify_kw_encumbrances": "Check mortgages, claims, easements and restrictions",
    "request_debt_certificate": "Request confirmation of no community/cooperative debt",
    "review_monthly_costs": "Verify service charges, utilities and renovation fund",
    "review_planned_repairs": "Review planned building repairs and resolutions",
    "verify_area_documents": "Match apartment area and layout to documents",
    "inspect_installations": "Inspect electrical, plumbing, heating and ventilation",
    "verify_developer_identity": "Verify developer, project company and land title",
    "review_escrow_schedule": "Verify escrow account and payment schedule",
    "verify_permits_and_title": "Check building permit, land title and project status",
    "review_prospekt_and_contract": "Review prospectus, annexes and draft contract",
    "review_delay_rights": "Check handover timing, delay penalties and withdrawal rights",
    "inspect_finish_standard": "Compare finish standard with contract and paid extras",
    "ask_sale_context": "Ask why the property is being sold and expected timing",
    "ask_included_items": "Confirm furnishings, parking and storage included in price",
    "ask_monthly_costs": "Ask for actual monthly costs and recent settlements",
    "ask_known_defects": "Ask about leaks, moisture, noise, failures and disputes",
    "ask_long_exposure": "Ask why the listing has remained active for a long time",
    "ask_price_history": "Ask about prior prices and reasons for reductions",
    "inspect_apartment_condition": "Inspect condition, windows, ventilation and moisture",
    "photograph_defects": "Photograph defects and items requiring repair estimates",
    "inspect_common_areas": "Inspect common areas, lift, facade, basement or garage",
    "record_viewing_findings": "Record findings and recalculate before offer or deposit",
    "compare_price_evidence": "Compare price with fair range and closest comparables",
    "compare_market_supply": "Check competing listings and similar-property exposure",
    "test_transport_route": "Walk the route to transport and check service frequency",
    "inspect_noise": "Check noise with windows open and closed during busy hours",
    "inspect_industrial_context": "Check traffic, smell, noise and local land-use plan",
    "inspect_building_systems": "Check systems, roof, facade and renovation fund",
    "verify_rental_case": "Verify rent, vacancy, furnishing, tax and fee assumptions",
    "confirm_listing_parameters": "Confirm price, area, floor, year, address and freshness",
    "verify_developer_record": "Check delivery history, delays, disputes and contracting entity",
    "verify_planning_projects": (
        "Verify source, geometry, timing and disruption of planned projects"
    ),
}


@dataclass(frozen=True)
class ReportTemplate:
    code: str
    name: str
    audience: ReportAudience
    description: str
    section_builders: tuple[SectionBuilder, ...]

    def descriptor(self) -> ReportTemplateDescriptor:
        return ReportTemplateDescriptor(
            code=self.code,
            name=self.name,
            audience=self.audience,
            description=self.description,
            default_sections=[builder(None).title for builder in self.section_builders],
        )

    def build_sections(self, analysis: ListingAnalysis) -> list[ReportSection]:
        return [builder(analysis) for builder in self.section_builders]


def list_report_templates() -> list[ReportTemplateDescriptor]:
    return [template.descriptor() for template in REPORT_TEMPLATES.values()]


def get_report_template(audience: ReportAudience) -> ReportTemplate:
    return REPORT_TEMPLATES[audience]


def _buyer_decision_summary_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Краткое решение", items=[])

    listing = analysis.listing
    scores = analysis.scores
    decision = analysis.buyer_decision
    if decision is not None:
        verdict = decision.verdict
        decision_text = f"{verdict.score:.1f}/10 - {verdict.headline}"
    else:
        decision_text = _buyer_recommendation(analysis)
    items = [
        f"Decision: {decision_text}",
        (
            f"Цена продавца: {_money(listing.price)}; fair range "
            f"{_money(scores.fair_price_low)}-{_money(scores.fair_price_high)}; "
            f"delta к fair mid {scores.price_delta_to_fair_mid_pct:+.1f}%."
        ),
        (
            f"Score snapshot: Investment {scores.investment_score}/100, "
            f"Risk {scores.risk_score}/100, Negotiation {scores.negotiation_score}/100, "
            f"Data quality {listing.data_quality_score}/100."
        ),
    ]
    if decision is not None and decision.negotiation.scenario_status == "available":
        items.insert(
            1,
            (
                f"Сценарный потолок до дополнительных проверок: "
                f"{_money(decision.negotiation.max_reasonable_offer_pln)}; "
                f"стартовый сценарий: {_money(decision.negotiation.opening_offer_pln)}."
            ),
        )
    else:
        items.insert(
            1,
            "Ценовой сценарий переговоров недоступен до получения достаточных рыночных данных.",
        )
    risks = _buyer_top_risks(analysis)
    if risks:
        items.append(f"Главные риски: {'; '.join(risks)}.")
    if decision is not None:
        items.append(
            "Не удалось проверить автоматически: "
            f"{'; '.join(decision.verdict.critical_unknowns[:5])}."
        )
    items.append(
        "Перед zadatek/umowa rezerwacyjna обязательно закрыть проверки: "
        f"{'; '.join(_buyer_required_checks(analysis))}."
    )
    if analysis.developer_reputation is not None:
        reputation = analysis.developer_reputation
        items.append(
            f"Застройщик: {reputation.developer.name}, "
            f"reputation {reputation.reputation_score}/100, "
            f"confidence {reputation.confidence_score}/100; "
            "сверить проектную компанию и договор с due-diligence секцией."
        )
    return ReportSection(title="Краткое решение", items=_deduplicate(items))


def _domarion_verdict_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="WartoMetr Verdict", items=[])
    decision = analysis.buyer_decision
    if decision is None:
        return _buyer_decision_summary_section(analysis).model_copy(
            update={"title": "WartoMetr Verdict"}
        )

    verdict = decision.verdict
    total = decision.total_acquisition
    items = [
        f"{verdict.score:.1f}/10 - {verdict.headline}.",
        verdict.summary,
        (
            f"Цена продавца: {_money(verdict.seller_price_pln)}; fair range "
            f"{_money(verdict.fair_price_low_pln)}-{_money(verdict.fair_price_high_pln)}."
        ),
    ]
    if decision.negotiation.scenario_status == "available":
        items.append(
            f"Сценарная цена: target {_money(verdict.recommended_offer_pln)}; "
            f"старт {_money(verdict.opening_offer_pln)}; "
            f"не превышать без новых данных {_money(verdict.max_reasonable_offer_pln)}."
        )
    else:
        items.append(
            "Ценовой сценарий не сформирован: имеющихся рыночных наблюдений недостаточно."
        )
    items.extend(
        [
            (
                f"Реальная стоимость въезда: {_money(total.total_move_in_cost_pln)} "
                f"(ремонт {_money(total.renovation_estimate_pln)}, "
                f"мебель/оборудование {_money(total.furniture_estimate_pln)})."
            ),
            f"Полнота проверки: {decision.knowledge.check_completeness_score}/100.",
        ]
    )
    return ReportSection(
        title="WartoMetr Verdict",
        items=items,
    )


def _negotiation_assistant_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Negotiation Assistant", items=[])
    decision = analysis.buyer_decision
    if decision is None:
        return ReportSection(
            title="Negotiation Assistant",
            items=[
                "Price scenario unavailable: rebuild the analysis with structured market evidence."
            ],
        )

    negotiation = decision.negotiation
    if negotiation.scenario_status != "available":
        return ReportSection(
            title="Negotiation Assistant",
            items=[
                "Price scenario unavailable: market evidence is insufficient.",
                *[
                    f"Limitation: {_negotiation_limitation_report_text(code)}."
                    for code in negotiation.limitation_codes
                ],
                *[
                    f"Next action: {_negotiation_action_report_text(item.code, item.params)}."
                    for item in negotiation.next_actions
                ],
            ],
        )
    evidence_by_id = {item.id: item for item in negotiation.argument_evidence}
    return ReportSection(
        title="Negotiation Assistant",
        items=_deduplicate(
            [
                (
                    f"Старт: {_money(negotiation.opening_offer_pln)}; реалистичная сделка "
                    f"{_money(negotiation.realistic_deal_low_pln)}-"
                    f"{_money(negotiation.realistic_deal_high_pln)}; потолок "
                    f"{_money(negotiation.max_reasonable_offer_pln)}."
                ),
                f"Posture: {negotiation.posture}; score {negotiation.negotiation_score}/100.",
                "Scenario: figures are indicative negotiation scenarios, not a guaranteed "
                "market truth.",
                *[
                    (
                        f"Аргумент: {_negotiation_argument_report_text(item.code, item.params)}; "
                        "evidence: "
                        f"{', '.join(
                            evidence_by_id[ref].source_name for ref in item.evidence_refs
                        )}."
                    )
                    for item in negotiation.arguments[:6]
                ],
                *[
                    f"Next action: {_negotiation_action_report_text(item.code, item.params)}."
                    for item in negotiation.next_actions
                ],
                *[
                    f"Guardrail: {_negotiation_guardrail_report_text(code)}."
                    for code in negotiation.guardrail_codes
                ],
            ]
        ),
    )


def _property_due_diligence_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Property Due Diligence", items=[])
    decision = analysis.buyer_decision
    if decision is None:
        return _purchase_checklist_section(analysis).model_copy(
            update={"title": "Property Due Diligence"}
        )

    diligence = decision.due_diligence
    return ReportSection(
        title="Property Due Diligence",
        items=_deduplicate(
            [
                f"Due-diligence score: {diligence.score}/100 ({diligence.label}).",
                *_action_plan_report_items(
                    decision,
                    phases={"before_offer"},
                    limit=18,
                ),
                (
                    "Human-review handoff: if critical unknowns remain before zadatek, "
                    "route KW, building, debt and contract checks to a legal/expert reviewer."
                ),
                diligence.disclaimer,
            ]
        ),
    )


def _what_we_know_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Что мы знаем, оцениваем и не знаем", items=[])
    decision = analysis.buyer_decision
    if decision is None:
        return _data_quality_section(analysis).model_copy(
            update={"title": "Что мы знаем, оцениваем и не знаем"}
        )

    knowledge = decision.knowledge
    source_items = [
        (
            f"Source: {item.topic} -> {item.basis}; {item.source_name}; "
            f"confidence {item.confidence_score}/100; "
            f"{'; '.join(provenance_evidence_details(item))}."
        )
        for item in knowledge.source_evidence[:6]
    ]
    return ReportSection(
        title="Что мы знаем, оцениваем и не знаем",
        items=_deduplicate(
            [
                f"Общая полнота проверки: {knowledge.check_completeness_score}/100.",
                *[f"Знаем: {item}" for item in knowledge.known[:6]],
                *[f"Оцениваем: {item}" for item in knowledge.estimated[:6]],
                *[f"Не удалось проверить: {item}" for item in knowledge.could_not_verify[:8]],
                *source_items,
            ]
        ),
    )


def _total_acquisition_cost_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Total Acquisition Cost", items=[])
    decision = analysis.buyer_decision
    if decision is None:
        return _mortgage_budget_section(analysis).model_copy(
            update={"title": "Total Acquisition Cost"}
        )

    total = decision.total_acquisition
    items = [
        f"Цена: {_money(total.purchase_price_pln)}.",
        f"Состояние ремонта: {total.renovation_condition or 'не указано'}.",
        f"Источник бюджета ремонта: {total.renovation_budget_source}.",
        f"PCC: {_money(total.pcc_tax_pln)}.",
        f"Нотариус + суд: {_money(total.notary_and_court_pln)}.",
        f"Банк: {_money(total.bank_costs_pln)}.",
        f"Ремонт: {_money(total.renovation_estimate_pln)}.",
        f"Мебель/оборудование: {_money(total.furniture_estimate_pln)}.",
        f"Реальная стоимость въезда: {_money(total.total_move_in_cost_pln)}.",
        f"Upfront cash baseline: {_money(total.upfront_cash_needed_pln)}.",
        f"Ипотечный платеж baseline: {_money(total.monthly_payment_baseline_pln)}/мес.",
    ]
    if total.ready_to_move_alternative_price_pln is not None:
        items.append(
            f"Готовая альтернатива proxy: {_money(total.ready_to_move_alternative_price_pln)}."
        )
    if total.post_renovation_value_gap_pln is not None:
        gap = total.post_renovation_value_gap_pln
        if gap > 0:
            items.append(f"После ремонта объект дороже ready proxy примерно на {_money(gap)}.")
        else:
            items.append(f"После ремонта остается запас около {_money(abs(gap))}.")
    items.extend(total.notes)
    return ReportSection(title="Total Acquisition Cost", items=_deduplicate(items))


def _buyer_better_alternatives_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Есть ли варианты лучше", items=[])

    if not analysis.comparables:
        return ReportSection(
            title="Есть ли варианты лучше",
            items=[
                (
                    "В текущей выборке недостаточно сопоставимых объектов; "
                    "перед оффером расширить поиск по району и соседним локациям."
                )
            ],
        )

    listing = analysis.listing
    decision = analysis.buyer_decision
    max_offer = (
        decision.verdict.max_reasonable_offer_pln
        if decision is not None
        else None
    )
    alternatives = sorted(
        analysis.comparables,
        key=lambda item: (
            item.price > max_offer if max_offer is not None else False,
            item.price_per_m2,
            item.nearest_stop_m is None,
            item.nearest_stop_m or 0,
            item.id,
        ),
    )[:3]
    items = []
    for comparable in alternatives:
        reasons = []
        if max_offer is not None and comparable.price <= max_offer:
            reasons.append("цена не выше разумного потолка по текущему объекту")
        if comparable.price_per_m2 < listing.price_per_m2:
            reasons.append("ниже цена за m2")
        if (
            listing.nearest_stop_m is not None
            and comparable.nearest_stop_m is not None
            and comparable.nearest_stop_m < listing.nearest_stop_m
        ):
            reasons.append("лучше транспортная близость")
        if comparable.days_on_market < listing.days_on_market:
            reasons.append("меньше экспозиция на рынке")
        if not reasons:
            reasons.append("проверить как альтернативу до определения цены оффера")
        items.append(
            f"{comparable.title}: {_money(comparable.price)}, "
            f"{_money(comparable.price_per_m2)}/m2, {comparable.district}; "
            f"{'; '.join(reasons[:3])}."
        )
    return ReportSection(title="Есть ли варианты лучше", items=items)


def _pre_viewing_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="До просмотра", items=[])
    decision = analysis.buyer_decision
    if decision is None:
        return _next_action_like_section(analysis)

    return ReportSection(
        title="До просмотра",
        items=_action_plan_report_items(
            decision,
            phases={"on_viewing", "after_viewing"},
            limit=18,
        ),
    )


def _personalization_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Для кого подходит", items=[])
    decision = analysis.buyer_decision
    if decision is None:
        return ReportSection(
            title="Для кого подходит",
            items=[
                f"Для жизни: {_own_living_fit(analysis)}",
                f"Для семьи: {_family_fit(analysis)}",
                f"Для аренды: {_rental_fit(analysis)}",
            ],
        )

    selected = decision.selected_intent_fit
    selected_items = (
        [
            (
                f"For you ({selected.intent}): {selected.score}/100 ({selected.label}); "
                f"плюсы: {', '.join(selected.reasons) or 'нет'}; "
                f"проверить: {', '.join(selected.tradeoffs) or 'нет'}."
            )
        ]
        if selected is not None
        else []
    )
    return ReportSection(
        title="Для кого подходит",
        items=selected_items
        + [
            (
                f"{item.intent}: {item.score}/100 ({item.label}); "
                f"плюсы: {', '.join(item.reasons) or 'нет'}; "
                f"проверить: {', '.join(item.tradeoffs) or 'нет'}."
            )
            for item in decision.intent_fit
        ],
    )


def _buyer_decision_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Решение покупателя", items=[])
    listing = analysis.listing
    scores = analysis.scores
    items = [
        f"Fair price confidence: {scores.fair_price_confidence_score}/100.",
        (
            f"Объект на рынке {listing.days_on_market} дней, "
            f"снижений цены: {listing.price_reductions}."
        ),
    ]
    if scores.risk_score >= 60:
        items.append("Перед оффером стоит отдельно проверить факторы риска.")
    else:
        items.append("Автоматическая риск-оценка не показывает критичного уровня риска.")
    return ReportSection(title="Решение покупателя", items=items)


def _next_action_like_section(analysis: ListingAnalysis) -> ReportSection:
    return ReportSection(
        title="До просмотра",
        items=[
            (
                "Перед просмотром: запросить czynsz, fundusz remontowy, media "
                "и список того, что входит в цену."
            ),
            ("На просмотре: сверить состояние окон/электрики/воды/вентиляции и проверить шум."),
        ],
    )


def _buyer_lifestyle_rental_outlook_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Жизнь, аренда и развитие района", items=[])

    listing = analysis.listing
    area = analysis.area_statistics
    scores = analysis.scores
    rental_item = f"Для аренды: {_rental_fit(analysis)}"
    if (
        analysis.rental_estimate is not None
        and analysis.rental_estimate.status == "estimated"
        and analysis.rental_estimate.gross_yield_pct is not None
    ):
        rental_item += (
            f" Rental Potential {_score_text(scores.rental_potential_score)}; "
            f"ориентировочная gross yield {analysis.rental_estimate.gross_yield_pct:.1f}%."
        )
    else:
        rental_item += " Оценка доходности недоступна без достаточных арендных данных."

    liquidity_item = (
        f"Ликвидность: {_liquidity_fit(analysis)} Liquidity Score "
        f"{_score_text(scores.liquidity_score)}."
    )
    if area.listing_metrics_available:
        liquidity_item += (
            f" Средняя экспозиция района {area.average_days_on_market} дней, "
            f"объект {listing.days_on_market} дней."
        )

    development_item = f"Развитие района: {_future_area_outlook(analysis)}"
    if listing.planned_investments_within_2km is not None:
        development_item += (
            f" Планируемые инвестиции в 2 km: {listing.planned_investments_within_2km}."
        )
    if area.listing_metrics_available:
        development_item += (
            f" Цены 90d {area.price_change_90d_pct:+.1f}%, "
            f"предложение 90d {area.supply_change_90d_pct:+.1f}%."
        )
    items = [
        f"Для жизни: {_own_living_fit(analysis)}",
        f"Для семьи: {_family_fit(analysis)}",
        rental_item,
        liquidity_item,
        development_item,
    ]
    items.extend(_future_impact_report_items(analysis))
    if analysis.growth_analysis is not None:
        growth = analysis.growth_analysis
        items.append(
            f"Growth analysis: {_score_text(growth.growth_score)} "
            f"({growth.growth_label}). {growth.summary}"
        )
        if growth.positive_signals:
            items.append(f"Growth positives: {'; '.join(growth.positive_signals[:3])}.")
        if growth.drag_signals:
            items.append(f"Growth drags/checks: {'; '.join(growth.drag_signals[:3])}.")
        if growth.missing_layers:
            items.append(f"Growth data gaps to verify: {'; '.join(growth.missing_layers[:3])}.")
    if (
        analysis.rental_estimate is not None
        and analysis.rental_estimate.status == "estimated"
        and analysis.rental_estimate.monthly_rent_low_pln is not None
        and analysis.rental_estimate.monthly_rent_mid_pln is not None
        and analysis.rental_estimate.monthly_rent_high_pln is not None
    ):
        rental = analysis.rental_estimate
        items.append(
            f"Rental estimate: {_money(rental.monthly_rent_low_pln)}-"
            f"{_money(rental.monthly_rent_high_pln)}/мес.; "
            f"mid {_money(rental.monthly_rent_mid_pln)}, "
            f"confidence {rental.confidence_score}/100."
        )
    location_risks = _location_risk_flags(analysis)
    if location_risks:
        items.append(f"Что проверить на месте: {'; '.join(location_risks)}.")
    return ReportSection(
        title="Жизнь, аренда и развитие района",
        items=_deduplicate(items),
    )


def _future_impact_report_items(analysis: ListingAnalysis) -> list[str]:
    if analysis.future_area_impact is None:
        return []

    impact = analysis.future_area_impact
    items = [
        f"Future impact score: {impact.impact_score}/100. {impact.summary}",
    ]
    if impact.impact_narrative:
        items.append(f"Impact narrative: {'; '.join(impact.impact_narrative[:2])}.")
    if impact.positive_catalysts:
        catalysts = "; ".join(
            f"{item.name}: {', '.join(item.positive_effects) or item.category}"
            for item in impact.positive_catalysts[:3]
        )
        items.append(f"Positive catalysts: {catalysts}.")
    if impact.negative_or_supply_projects:
        checks = "; ".join(
            (f"{item.name}: {'; '.join([*item.disruption_risks, *item.supply_pressure_risks])}")
            for item in impact.negative_or_supply_projects[:3]
        )
        items.append(f"Disruption/supply checks: {checks}.")
    if impact.nearest_investments:
        nearest = "; ".join(
            (
                f"{item.investment.name} ({item.investment.investment_type}, "
                f"{item.distance_m} m, confidence {item.investment.confidence_score}/100)"
            )
            for item in impact.nearest_investments[:3]
        )
        items.append(f"Ближайшие planned investments: {nearest}.")
    if impact.growth_signals:
        items.append(f"Growth signals: {'; '.join(impact.growth_signals[:3])}.")
    if impact.risk_signals:
        items.append(f"Future-area risks/checks: {'; '.join(impact.risk_signals[:3])}.")
    return items


def _price_market_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Цена и рынок", items=[])
    listing = analysis.listing
    scores = analysis.scores
    return ReportSection(
        title="Цена и рынок",
        items=[
            f"Текущая цена: {listing.price:,} {listing.currency}".replace(",", " "),
            f"Цена за m2: {listing.price_per_m2:,} {listing.currency}".replace(",", " "),
            (f"Fair price range: {scores.fair_price_low:,}-{scores.fair_price_high:,} PLN").replace(
                ",", " "
            ),
            f"Fair price confidence: {scores.fair_price_confidence_score}/100",
            f"Медиана района: {analysis.area_statistics.median_price_per_m2:,} PLN/m2".replace(
                ",", " "
            ),
        ],
    )


def _mortgage_budget_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Ипотека и бюджет покупки", items=[])

    listing = analysis.listing
    calculation = calculate_mortgage(
        MortgageCalculationRequest(
            property_price_pln=listing.price,
            down_payment_pln=round(listing.price * 0.2),
            loan_years=25,
            annual_interest_rate_pct=7.5,
            rate_type="variable",
            market_type=listing.market_type,
            renovation_budget_pln=0,
        )
    )
    costs = calculation.costs
    scenario = calculation.base_scenario
    return ReportSection(
        title="Ипотека и бюджет покупки",
        items=[
            "Пример расчета: 20% wkład własny, 25 lat, 7.5% rocznie.",
            f"Собственный взнос: {_money(costs.down_payment_pln)} ({costs.down_payment_pct:.0f}%).",
            f"Сумма кредита: {_money(costs.loan_amount_pln)}.",
            f"Ориентировочный платеж: {_money(scenario.monthly_total_payment_pln)} / miesiąc.",
            f"Cash upfront с налогами и сборами: {_money(costs.upfront_cash_needed_pln)}.",
            calculation.disclaimer,
        ],
    )


def _insights_section(analysis: ListingAnalysis | None) -> ReportSection:
    return ReportSection(
        title="Инсайты",
        items=[] if analysis is None else analysis.insights,
    )


def _negotiation_section(analysis: ListingAnalysis | None) -> ReportSection:
    return _negotiation_assistant_section(analysis).model_copy(
        update={"title": "Аргументы для торга"}
    )


def _seller_questions_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Вопросы продавцу", items=[])

    decision = analysis.buyer_decision
    if decision is None:
        return ReportSection(title="Вопросы продавцу", items=[])
    return ReportSection(
        title="Вопросы продавцу",
        items=_action_plan_report_items(
            decision,
            categories={"seller_question"},
            limit=10,
        ),
    )


def _purchase_checklist_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Чеклист проверки перед оффером", items=[])

    if analysis.buyer_decision is not None:
        return ReportSection(
            title="Чеклист проверки перед оффером",
            items=_action_plan_report_items(
                analysis.buyer_decision,
                phases={"before_offer"},
                limit=18,
            ),
        )

    listing = analysis.listing
    items = [
        "Проверить księga wieczysta: собственник, ипотека, roszczenia, służebności.",
        "Сверить площадь, этаж, адрес и помещения с документами и объявлением.",
        "Запросить справку об отсутствии задолженности по czynsz и media.",
        "Проверить протоколы wspólnoty/spółdzielni и планируемые ремонты здания.",
        "Оценить техническое состояние: окна, электрика, plumbing, отопление, вентиляция.",
        "Сравнить финальную цену с похожими объектами и fair price range из отчета.",
        "Проверить транспорт, шум, дорогу, промзоны и planned investments вокруг объекта.",
        "Зафиксировать в offer условия: цена, срок, что входит в сделку, задаток/zaliczka.",
    ]
    if listing.market_type == "primary":
        items.append(
            "Для первичного рынка проверить prospekt informacyjny, rachunek powierniczy "
            "и сроки передачи."
        )
    else:
        items.append("Для вторичного рынка заложить PCC 2% и нотариальные расходы в cash budget.")
    if analysis.scores.risk_score >= 60:
        items.append(
            "Из-за повышенного Risk Score отдельно проверить предупреждения из секции рисков."
        )
    return ReportSection(title="Чеклист проверки перед оффером", items=items)


def _risk_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Риски", items=[])
    if analysis.risk_profile is not None:
        profile = analysis.risk_profile
        items = [
            (
                f"Risk profile: {profile.overall_severity}; "
                f"Risk Score {profile.risk_score}/100 ({profile.risk_label})."
            )
        ]
        for factor in profile.factors[:6]:
            evidence = f" Evidence: {'; '.join(factor.evidence[:2])}" if factor.evidence else ""
            items.append(
                f"{factor.category}/{factor.code}: {factor.severity}. {factor.summary}{evidence}"
            )
        if profile.priority_checks:
            items.append(f"Priority checks: {'; '.join(profile.priority_checks[:5])}.")
        if profile.missing_risk_layers:
            items.append(
                "Missing public risk layers to verify separately: "
                f"{'; '.join(profile.missing_risk_layers)}."
            )
        return ReportSection(title="Риски", items=_deduplicate(items))
    return ReportSection(
        title="Риски",
        items=analysis.scores.warnings or ["Критичных рисков в MVP-данных нет."],
    )


def _data_quality_section(analysis: ListingAnalysis | None) -> ReportSection:
    return ReportSection(
        title="Качество данных",
        items=[] if analysis is None else analysis.data_quality_notes,
    )


def _investor_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Инвестиционная оценка", items=[])
    scores = analysis.scores
    return ReportSection(
        title="Инвестиционная оценка",
        items=[
            f"Liquidity Score: {_score_text(scores.liquidity_score)}",
            f"Rental Potential Score: {_score_text(scores.rental_potential_score)}",
            f"Investment Score: {scores.investment_score}/100",
            *scores.reasons,
        ],
    )


def _investor_rental_yield_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Арендная доходность", items=[])

    listing = analysis.listing
    if analysis.rental_estimate is None or analysis.rental_estimate.status == "insufficient_data":
        sample_size = analysis.rental_estimate.sample_size if analysis.rental_estimate else 0
        return ReportSection(
            title="Арендная доходность",
            items=[
                (
                    "Недостаточно подтверждённых арендных данных для оценки доходности: "
                    f"{sample_size}/3 релевантных наблюдений."
                ),
                f"Rental Potential Score: {_score_text(analysis.scores.rental_potential_score)}.",
                (
                    "Перед инвестиционным решением проверьте реальные арендные аналоги, "
                    "vacancy, расходы, налоги и ремонт."
                ),
            ],
        )

    rental = analysis.rental_estimate
    assert rental.monthly_rent_low_pln is not None
    assert rental.monthly_rent_mid_pln is not None
    assert rental.monthly_rent_high_pln is not None
    assert rental.rent_per_m2_mid_pln is not None
    assert rental.gross_yield_pct is not None
    assert rental.net_yield_pct is not None
    assert rental.operating_costs_monthly_pln is not None
    assert rental.net_operating_income_monthly_pln is not None
    scenario_items = [
        (
            f"{scenario.label}: cashflow {_money(scenario.net_cashflow_monthly_pln)}/мес., "
            f"net yield on cash {scenario.net_yield_on_cash_pct:.2f}%."
        )
        for scenario in rental.cashflow_scenarios
    ]
    return ReportSection(
        title="Арендная доходность",
        items=[
            (
                f"Rent estimate: {_money(rental.monthly_rent_low_pln)}-"
                f"{_money(rental.monthly_rent_high_pln)}/мес.; "
                f"mid {_money(rental.monthly_rent_mid_pln)} "
                f"({_money(rental.rent_per_m2_mid_pln)}/m2)."
            ),
            (
                f"Gross yield {rental.gross_yield_pct:.1f}%, vacancy "
                f"{rental.vacancy_rate_pct:.1f}%, operating costs "
                f"{_money(rental.operating_costs_monthly_pln)}/мес."
            ),
            f"Net yield before tax and financing: {rental.net_yield_pct:.1f}%.",
            (
                f"Rental evidence: {rental.sample_size} observations, "
                f"{rental.geographic_scope}, {rental.period or 'period unavailable'}, "
                f"sources: {', '.join(rental.source_names)}."
            ),
            f"NOI before financing: {_money(rental.net_operating_income_monthly_pln)}/мес.",
            *scenario_items,
            f"Rental estimate confidence: {rental.confidence_score}/100.",
            f"Rental Potential Score: {_score_text(analysis.scores.rental_potential_score)}.",
            _transport_context(listing.nearest_stop_m, listing.distance_to_center_km),
            *rental.risk_notes[:3],
            (
                "Это screening estimate; перед покупкой нужна проверка реальных "
                "арендных comparables, vacancy, fees, налогов и ремонта."
            ),
        ],
    )


def _investor_alternatives_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Сравнение с альтернативами", items=[])

    listing = analysis.listing
    if not analysis.comparables:
        return ReportSection(
            title="Сравнение с альтернативами",
            items=["Недостаточно похожих объектов для сравнения альтернатив."],
        )

    alternatives = sorted(
        analysis.comparables[:5],
        key=lambda item: (
            item.price_per_m2,
            item.days_on_market,
            -(item.planned_investments_within_2km or 0),
        ),
    )
    items = [
        "Сравните объект с этими альтернативами перед резервированием:",
    ]
    for comparable in alternatives[:3]:
        price_delta = comparable.price_per_m2 - listing.price_per_m2
        exposure_delta = comparable.days_on_market - listing.days_on_market
        items.append(
            (
                f"{comparable.title}: {_money(comparable.price_per_m2)}/m2 "
                f"({price_delta:+,} PLN/m2), "
                f"{comparable.days_on_market} дней на рынке "
                f"({exposure_delta:+} к объекту), "
                "planned investments: "
                f"{_optional_count(comparable.planned_investments_within_2km)}."
            ).replace(",", " ")
        )
    return ReportSection(title="Сравнение с альтернативами", items=items)


def _investor_liquidity_growth_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Ликвидность и тезис роста", items=[])

    listing = analysis.listing
    area = analysis.area_statistics
    scores = analysis.scores
    thesis = [f"Liquidity Score: {_score_text(scores.liquidity_score)}."]
    if area.listing_metrics_available:
        thesis.extend(
            [
                (
                    f"Average days on market в районе: {area.average_days_on_market}; "
                    f"объект: {listing.days_on_market}."
                ),
                f"Динамика цены района за 90 дней: {area.price_change_90d_pct:+.1f}%.",
                f"Динамика предложения за 90 дней: {area.supply_change_90d_pct:+.1f}%.",
            ]
        )
    if listing.planned_investments_within_2km is not None:
        thesis.append(
            f"Планируемые инвестиции в 2 km: {listing.planned_investments_within_2km}."
        )
    if (
        area.listing_metrics_available
        and area.price_change_90d_pct > 0
        and listing.planned_investments_within_2km is not None
        and listing.planned_investments_within_2km > 0
    ):
        thesis.append("Growth thesis: район растет и рядом есть future infrastructure catalysts.")
    elif area.listing_metrics_available and area.supply_change_90d_pct > 15:
        thesis.append("Risk thesis: предложение быстро растет; проверьте риск oversupply.")
    else:
        thesis.append("Growth thesis: нейтральный сценарий, решение зависит от цены входа.")
    thesis.extend(_future_impact_report_items(analysis))
    if analysis.growth_analysis is not None:
        growth = analysis.growth_analysis
        thesis.append(
            f"Growth analysis score: {_score_text(growth.growth_score)} "
            f"({growth.growth_label}). {growth.summary}"
        )
        thesis.extend(f"Growth positive: {item}" for item in growth.positive_signals[:3])
        thesis.extend(f"Growth drag/check: {item}" for item in growth.drag_signals[:3])
        if growth.missing_layers:
            thesis.append(f"Growth data gaps: {'; '.join(growth.missing_layers[:4])}.")
    if scores.risk_score >= 60:
        thesis.append("Повышенный Risk Score требует дисконта или дополнительных проверок.")
    return ReportSection(title="Ликвидность и тезис роста", items=thesis)


def _realtor_section(analysis: ListingAnalysis | None) -> ReportSection:
    return ReportSection(
        title="Для клиента риелтора",
        items=[
            "Используйте сравнение с аналогами как основу для обсуждения цены.",
            "Покажите историю снижения цены и дни на рынке как аргументы переговоров.",
            "Отдельно проговорите факторы риска, чтобы не создавать ложных ожиданий.",
        ],
    )


def _realtor_price_arguments_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Клиентская аргументация цены", items=[])

    listing = analysis.listing
    scores = analysis.scores
    delta = scores.price_delta_to_fair_mid_pct
    if delta > 7:
        position = "цена выше расчетного fair price"
    elif delta < -7:
        position = "цена ниже расчетного fair price"
    else:
        position = "цена близка к расчетному fair price"

    items = [
        f"Позиционирование для клиента: {position} ({delta:+.1f}% к fair price mid).",
        f"Fair price confidence: {scores.fair_price_confidence_score}/100.",
        (f"Цена объекта: {_money(listing.price)}, {_money(listing.price_per_m2)}/m2."),
        (
            f"Медиана района: {_money(analysis.area_statistics.median_price_per_m2)}/m2, "
            f"средняя экспозиция {analysis.area_statistics.average_days_on_market} дней."
        ),
    ]
    if listing.price_reductions > 0:
        items.append(
            f"Цена снижалась {listing.price_reductions} раз: это сильный аргумент к торгу."
        )
    if listing.days_on_market > analysis.area_statistics.average_days_on_market:
        items.append("Объект продается дольше среднего по району: используйте это в переговорах.")
    return ReportSection(title="Клиентская аргументация цены", items=items)


def _realtor_comparables_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Сравнение с аналогами", items=[])

    listing = analysis.listing
    if not analysis.comparables:
        return ReportSection(
            title="Сравнение с аналогами",
            items=["Недостаточно похожих объектов для клиентского сравнения."],
        )

    items = [
        "Используйте эти аналоги как основу для разговора о цене и ликвидности:",
    ]
    for comparable in analysis.comparables[:3]:
        delta = comparable.price_per_m2 - listing.price_per_m2
        items.append(
            (
                f"{comparable.title}: {comparable.rooms} pok., {comparable.area_m2:.1f} m2, "
                f"{_money(comparable.price_per_m2)}/m2 "
                f"({delta:+,} PLN/m2 к объекту)."
            ).replace(",", " ")
        )
    return ReportSection(title="Сравнение с аналогами", items=items)


def _realtor_location_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Карта и локация для клиента", items=[])

    listing = analysis.listing
    map_url = (
        "https://www.openstreetmap.org/"
        f"?mlat={listing.lat:.6f}&mlon={listing.lon:.6f}"
        f"#map=16/{listing.lat:.6f}/{listing.lon:.6f}"
    )
    return ReportSection(
        title="Карта и локация для клиента",
        items=[
            f"Адрес/район: {listing.address}, {listing.district}, {listing.city}.",
            f"Mapa: {map_url}",
            f"До центра: {_optional_distance_km(listing.distance_to_center_km)}.",
            f"Ближайшая остановка: {_optional_distance_m(listing.nearest_stop_m)}.",
            f"Ближайшая школа: {_optional_distance_m(listing.nearest_school_m)}.",
            "Планируемые инвестиции в 2 km: "
            f"{_optional_count(listing.planned_investments_within_2km)}.",
        ],
    )


def _money(value: int) -> str:
    return f"{value:,} PLN".replace(",", " ")


def _buyer_recommendation(analysis: ListingAnalysis) -> str:
    scores = analysis.scores
    if scores.risk_score >= 70 or scores.decision_label == "risky":
        return (
            "пауза; продолжать только после снятия юридических/технических рисков "
            "и с заметным дисконтом к fair mid"
        )
    if scores.decision_label == "overpriced" or scores.price_delta_to_fair_mid_pct >= 10:
        return "продолжать только с дисконтом; текущая цена выше расчетной ценности"
    if scores.decision_label == "weak_fit":
        return "не спешить; объект слабее альтернатив, нужен сильный аргумент по цене"
    if scores.decision_label == "strong_candidate":
        return "можно продолжать; сильный кандидат при чистых документах и осмотре"
    if scores.decision_label == "good_option":
        return "можно продолжать; хороший вариант, если проверки не выявят скрытых затрат"
    return "можно смотреть дальше; решение зависит от документов, состояния и финальной цены"


def _buyer_max_offer(analysis: ListingAnalysis) -> int:
    listing = analysis.listing
    scores = analysis.scores
    if scores.risk_score >= 70:
        return min(scores.fair_price_low, round(listing.price * 0.92))
    if scores.price_delta_to_fair_mid_pct >= 12:
        return min(scores.fair_price_mid, round(listing.price * 0.94))
    if scores.price_delta_to_fair_mid_pct >= 5:
        return min(scores.fair_price_high, round(listing.price * 0.97))
    if scores.price_delta_to_fair_mid_pct <= -6 and scores.risk_score <= 50:
        return min(listing.price, scores.fair_price_high)
    return min(listing.price, scores.fair_price_high)


def _buyer_opening_offer(analysis: ListingAnalysis, max_offer: int) -> int:
    listing = analysis.listing
    scores = analysis.scores
    discount_pct = 0.03
    if scores.price_delta_to_fair_mid_pct >= 12:
        discount_pct = 0.08
    elif scores.price_delta_to_fair_mid_pct >= 5:
        discount_pct = 0.06
    elif (
        listing.price_reductions
        or listing.days_on_market > analysis.area_statistics.average_days_on_market
    ):
        discount_pct = 0.05
    opening_offer = round(listing.price * (1 - discount_pct))
    return min(opening_offer, max_offer)


def _buyer_top_risks(analysis: ListingAnalysis) -> list[str]:
    if analysis.risk_profile is not None:
        return [
            f"{factor.category}: {factor.summary}"
            for factor in analysis.risk_profile.factors
            if factor.severity in {"high", "medium"}
        ][:4]

    listing = analysis.listing
    scores = analysis.scores
    risks = list(scores.warnings[:3])
    if scores.price_delta_to_fair_mid_pct >= 7:
        risks.append("цена выше fair mid, нужен дисконт или сильное подтверждение ценности")
    if listing.data_quality_score < 65:
        risks.append("качество данных ниже комфортного уровня, параметры нужно подтвердить")
    if listing.building_year and listing.building_year < 1990:
        risks.append("старый дом, проверить ремонты здания и состояние инсталляций")
    if listing.floor == 0:
        risks.append("parter/нулевой этаж, проверить приватность, шум и влажность")
    if analysis.developer_reputation is not None and analysis.developer_reputation.risk_signals:
        risks.append(f"developer risk: {analysis.developer_reputation.risk_signals[0]}")
    return _deduplicate(risks)[:4]


def _buyer_required_checks(analysis: ListingAnalysis) -> list[str]:
    listing = analysis.listing
    checks = [
        "księga wieczysta: владелец, ипотека, roszczenia, służebności",
        "czynsz/media/fundusz remontowy и отсутствие задолженностей",
        "фактическая площадь, этаж, состояние инсталляций и влажность",
    ]
    if listing.market_type == "primary":
        checks.append("prospekt informacyjny, rachunek powierniczy, DFG и сроки передачи")
    else:
        checks.append("PCC 2%, нотариальные расходы и протоколы wspólnoty/spółdzielni")
    if analysis.developer_reputation is not None:
        checks.append("KRS/NIP/REGON и project company застройщика")
    return checks[:5]


def _own_living_fit(analysis: ListingAnalysis) -> str:
    listing = analysis.listing
    strengths: list[str] = []
    tradeoffs: list[str] = []
    if listing.distance_to_center_km is not None and listing.distance_to_center_km <= 8:
        strengths.append(f"до центра {listing.distance_to_center_km:.1f} km")
    elif listing.distance_to_center_km is not None:
        tradeoffs.append(f"до центра {listing.distance_to_center_km:.1f} km")
    if listing.nearest_stop_m is not None and listing.nearest_stop_m <= 600:
        strengths.append(f"остановка {listing.nearest_stop_m} m")
    elif listing.nearest_stop_m is not None:
        tradeoffs.append(f"остановка {listing.nearest_stop_m} m")
    if listing.parks_within_1km:
        strengths.append(f"парки в 1 km: {listing.parks_within_1km}")
    if listing.floor == 0:
        tradeoffs.append("parter/нулевой этаж")
    if listing.nearest_major_road_m is not None and listing.nearest_major_road_m < 150:
        tradeoffs.append(f"близко к major road: {listing.nearest_major_road_m} m")

    if strengths and not tradeoffs:
        return f"хороший everyday-fit ({'; '.join(strengths)})."
    if strengths:
        return f"смешанный fit: плюсы {', '.join(strengths)}; проверить {', '.join(tradeoffs)}."
    return f"нужна очная проверка удобства: {', '.join(tradeoffs) or 'мало lifestyle signals'}."


def _family_fit(analysis: ListingAnalysis) -> str:
    listing = analysis.listing
    strengths: list[str] = []
    constraints: list[str] = []
    if listing.rooms >= 3:
        strengths.append(f"{listing.rooms} комнаты")
    else:
        constraints.append(f"{listing.rooms} комнаты")
    if (
        listing.nearest_school_m is not None
        and listing.nearest_school_m <= 1000
    ) or (listing.schools_within_1km is not None and listing.schools_within_1km > 0):
        strengths.append(
            f"школа {_optional_distance_m(listing.nearest_school_m)}"
        )
    elif listing.nearest_school_m is not None or listing.schools_within_1km is not None:
        constraints.append(f"школа {listing.nearest_school_m} m")
    if listing.parks_within_1km:
        strengths.append(f"парки в 1 km: {listing.parks_within_1km}")
    elif listing.parks_within_1km is not None:
        constraints.append("в доступных данных нет парка в 1 km")
    if listing.nearest_major_road_m is not None and listing.nearest_major_road_m < 150:
        constraints.append(f"major road {listing.nearest_major_road_m} m")

    if len(strengths) >= 3 and not constraints:
        return f"хороший семейный профиль ({'; '.join(strengths)})."
    if strengths:
        return f"частично подходит: {', '.join(strengths)}; проверить {', '.join(constraints)}."
    return f"семейный fit слабый по MVP-сигналам: {', '.join(constraints)}."


def _rental_fit(analysis: ListingAnalysis) -> str:
    listing = analysis.listing
    score = analysis.scores.rental_potential_score
    if score is None:
        return "недостаточно данных для оценки арендного сценария."
    if score >= 65 and listing.nearest_stop_m is not None and listing.nearest_stop_m <= 600:
        return "выглядит интересно для аренды благодаря rental score и транспорту."
    if score >= 50:
        return "средний арендный сценарий; проверить реальные ставки аренды и vacancy."
    return "арендный сценарий слабее среднего; не считать доходность главным аргументом."


def _liquidity_fit(analysis: ListingAnalysis) -> str:
    listing = analysis.listing
    area = analysis.area_statistics
    score = analysis.scores.liquidity_score
    if score is None or not area.listing_metrics_available:
        return "недостаточно listing-данных для оценки ликвидности."
    if score >= 65 and listing.days_on_market <= area.average_days_on_market:
        return "ликвидность выглядит сильной относительно района."
    if score >= 50:
        return "ликвидность средняя; важны цена входа и состояние объекта."
    return "ликвидность требует осторожности; выход из сделки может занять дольше."


def _future_area_outlook(analysis: ListingAnalysis) -> str:
    if analysis.future_area_impact is not None:
        return analysis.future_area_impact.summary
    listing = analysis.listing
    area = analysis.area_statistics
    if (
        listing.planned_investments_within_2km is not None
        and listing.planned_investments_within_2km >= 2
        and area.listing_metrics_available
        and area.price_change_90d_pct >= 0
    ):
        return "есть позитивный infrastructure/growth сигнал, но проверить сроки реализации."
    if area.listing_metrics_available and area.supply_change_90d_pct > 15:
        return "предложение растет быстро, проверить риск oversupply и давление на цену."
    if area.listing_metrics_available and area.price_change_90d_pct < -3:
        return "район просел по цене за 90 дней, нужен консервативный сценарий."
    if listing.planned_investments_within_2km:
        return "есть planned-investment сигнал, но влияние зависит от конкретного проекта."
    return "сильных future-growth сигналов в MVP-данных нет."


def _location_risk_flags(analysis: ListingAnalysis) -> list[str]:
    listing = analysis.listing
    risks: list[str] = []
    if analysis.future_area_impact is not None:
        risks.extend(analysis.future_area_impact.risk_signals[:2])
    if listing.nearest_major_road_m is not None and listing.nearest_major_road_m < 200:
        risks.append(f"шум/трафик от major road {listing.nearest_major_road_m} m")
    if (
        listing.nearest_industrial_zone_m is not None
        and listing.nearest_industrial_zone_m < 1000
    ):
        risks.append(f"промзона {listing.nearest_industrial_zone_m} m")
    if listing.nearest_stop_m is not None and listing.nearest_stop_m > 900:
        risks.append(f"остановка далеко: {listing.nearest_stop_m} m")
    if (
        listing.nearest_school_m is not None
        and listing.nearest_school_m > 1200
        and listing.rooms >= 3
    ):
        risks.append(f"для семьи школа далековато: {listing.nearest_school_m} m")
    if (
        analysis.area_statistics.listing_metrics_available
        and analysis.area_statistics.supply_change_90d_pct > 15
    ):
        risks.append("рост предложения может снижать переговорную позицию продавцов")
    return risks[:4]


def _negotiation_argument_report_text(code: str, params: dict) -> str:
    if code == "fair_value_range":
        return (
            f"fair-value range {_money(params['low_pln'])}-{_money(params['high_pln'])} "
            f"at confidence {params['confidence_score']}/100"
        )
    if code == "asking_above_fair_mid":
        return (
            f"asking price is {params['delta_pct']}% ({_money(params['delta_pln'])}) "
            "above the estimated midpoint"
        )
    if code == "comparable_sample":
        return f"the calculation uses {params['sample_size']} comparable listings"
    if code == "long_market_exposure":
        return (
            f"listing exposure is {params['days_on_market']} days versus "
            f"{params['area_average_days']} days in the area"
        )
    if code == "price_reductions":
        return f"the listing price was reduced {params['count']} time(s)"
    if code == "relisted":
        return "the listing was relisted; verify previous price and exposure"
    if code == "area_supply_growth":
        return f"area supply changed by {params['change_pct']}% over 90 days"
    return "structured negotiation evidence"


def _negotiation_action_report_text(code: str, params: dict) -> str:
    if code == "collect_market_evidence":
        return "collect recent comparable or transaction evidence before discussing a price"
    if code == "verify_listing_history":
        return "ask for the original publication date and previous asking prices"
    if code == "compare_alternatives":
        return "compare at least two current alternatives before making an offer"
    if code == "verify_documents_before_offer":
        return "verify ownership, encumbrances and building documents before an offer"
    if code == "confirm_condition_and_costs":
        return "confirm technical condition and renovation costs during viewing"
    if code == "submit_conditional_offer":
        return f"submit a conditional opening scenario of {_money(params['opening_offer_pln'])}"
    if code == "compare_before_raising_ceiling":
        return (
            f"compare alternatives before raising the scenario ceiling above "
            f"{_money(params['max_offer_pln'])}"
        )
    return "complete the evidence checks before changing the offer"


def _negotiation_limitation_report_text(code: str) -> str:
    return {
        "fair_price_confidence_low": "fair-price confidence is below 50/100",
        "subject_data_quality_low": "the apartment input is incomplete",
        "comparable_sample_below_minimum": "fewer than three comparable listings are available",
        "transaction_sample_below_minimum": "fewer than ten transaction observations are available",
        "market_evidence_insufficient": "neither market sample reaches the minimum threshold",
    }.get(code, "additional market evidence is required")


def _negotiation_guardrail_report_text(code: str) -> str:
    return {
        "scenario_not_valuation": "the scenario is not a certified valuation or accepted price",
        "verify_before_deposit": "complete document and technical checks before a deposit",
        "do_not_exceed_without_new_evidence": (
            "raise the ceiling only when new evidence supports it"
        ),
        "no_price_advice_insufficient_data": "do not infer an offer from incomplete data",
        "collect_evidence_before_offer": "collect market evidence before naming a price",
    }.get(code, "treat the output as decision support, not a guarantee")


def _action_plan_report_items(
    decision: BuyerDecisionPackage,
    *,
    phases: set[str] | None = None,
    categories: set[str] | None = None,
    limit: int,
) -> list[str]:
    if decision.action_plan is None:
        return ["Structured action plan unavailable; refresh the apartment analysis."]
    evidence_by_id = {item.id: item for item in decision.action_plan.evidence}
    rows: list[str] = []
    for item in decision.action_plan.items:
        if phases is not None and item.phase not in phases:
            continue
        if categories is not None and item.category not in categories:
            continue
        sources = _deduplicate(
            [
                evidence_by_id[reference].source_name
                for reference in item.evidence_refs
                if reference in evidence_by_id
            ]
        )
        evidence_statuses = _deduplicate(
            [
                evidence_by_id[reference].status
                for reference in item.evidence_refs
                if reference in evidence_by_id
            ]
        )
        evidence_note = ", ".join(sources) or "source unavailable"
        if "unknown" in evidence_statuses:
            evidence_note = f"verification gap; source context: {evidence_note}"
        rows.append(
            f"[{item.priority}] {ACTION_REPORT_LABELS.get(item.code, item.code)}. "
            f"Evidence: {evidence_note}."
        )
    return rows[:limit]


def _deduplicate(items: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result


def _score_text(score: int | None) -> str:
    return "нет данных" if score is None else f"{score}/100"


def _optional_distance_m(value: int | None) -> str:
    return "нет данных" if value is None else f"{value} m"


def _optional_distance_km(value: float | None) -> str:
    return "нет данных" if value is None else f"{value:.1f} km"


def _optional_count(value: int | None) -> str:
    return "нет данных" if value is None else str(value)


def _transport_context(stop_m: int | None, center_km: float | None) -> str:
    return (
        f"Транспортный фактор: остановка {_optional_distance_m(stop_m)}, "
        f"до центра {_optional_distance_km(center_km)}."
    )


REPORT_TEMPLATES: dict[ReportAudience, ReportTemplate] = {
    "buyer": ReportTemplate(
        code="buyer_object_report_v1",
        name="Buyer decision report v1",
        audience="buyer",
        description="Decision-focused report for a buyer comparing price, risk and negotiation.",
        section_builders=(
            _domarion_verdict_section,
            _buyer_decision_summary_section,
            _total_acquisition_cost_section,
            _buyer_better_alternatives_section,
            _negotiation_assistant_section,
            _property_due_diligence_section,
            _what_we_know_section,
            _pre_viewing_section,
            _personalization_section,
            _buyer_decision_section,
            _price_market_section,
            _buyer_lifestyle_rental_outlook_section,
            _mortgage_budget_section,
            _insights_section,
            _negotiation_section,
            _seller_questions_section,
            _purchase_checklist_section,
            _risk_section,
            _data_quality_section,
        ),
    ),
    "realtor": ReportTemplate(
        code="realtor_client_report_v1",
        name="Realtor client report v1",
        audience="realtor",
        description="Client-facing report for realtor conversations and negotiation framing.",
        section_builders=(
            _realtor_section,
            _realtor_price_arguments_section,
            _realtor_comparables_section,
            _realtor_location_section,
            _price_market_section,
            _insights_section,
            _negotiation_section,
            _risk_section,
            _data_quality_section,
        ),
    ),
    "investor": ReportTemplate(
        code="investor_object_report_v1",
        name="Investor object report v1",
        audience="investor",
        description="Investor-oriented report emphasizing liquidity, rent potential and upside.",
        section_builders=(
            _investor_section,
            _investor_rental_yield_section,
            _investor_alternatives_section,
            _investor_liquidity_growth_section,
            _price_market_section,
            _insights_section,
            _risk_section,
            _data_quality_section,
        ),
    ),
}
