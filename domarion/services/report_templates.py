from collections.abc import Callable
from dataclasses import dataclass

from domarion.schemas import (
    ListingAnalysis,
    MortgageCalculationRequest,
    ReportAudience,
    ReportSection,
    ReportTemplateDescriptor,
)
from domarion.services.mortgage import calculate_mortgage

SectionBuilder = Callable[[ListingAnalysis | None], ReportSection]


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
        max_offer = verdict.max_reasonable_offer_pln
        opening_offer = verdict.opening_offer_pln
        decision_text = f"{verdict.score:.1f}/10 - {verdict.headline}"
    else:
        max_offer = _buyer_max_offer(analysis)
        opening_offer = _buyer_opening_offer(analysis, max_offer)
        decision_text = _buyer_recommendation(analysis)
    items = [
        f"Decision: {decision_text}",
        (
            f"Верхняя цена до дополнительных проверок: {_money(max_offer)}; "
            f"стартовый offer anchor: {_money(opening_offer)}."
        ),
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
        return ReportSection(title="Domarion Verdict", items=[])
    decision = analysis.buyer_decision
    if decision is None:
        return _buyer_decision_summary_section(analysis).model_copy(
            update={"title": "Domarion Verdict"}
        )

    verdict = decision.verdict
    total = decision.total_acquisition
    return ReportSection(
        title="Domarion Verdict",
        items=[
            f"{verdict.score:.1f}/10 - {verdict.headline}.",
            verdict.summary,
            (
                f"Цена продавца: {_money(verdict.seller_price_pln)}; fair range "
                f"{_money(verdict.fair_price_low_pln)}-{_money(verdict.fair_price_high_pln)}."
            ),
            (
                f"Рекомендуемый offer: {_money(verdict.recommended_offer_pln)}; "
                f"стартовый offer: {_money(verdict.opening_offer_pln)}; "
                f"не превышать без новых данных: {_money(verdict.max_reasonable_offer_pln)}."
            ),
            (
                f"Реальная стоимость въезда: {_money(total.total_move_in_cost_pln)} "
                f"(ремонт {_money(total.renovation_estimate_pln)}, "
                f"мебель/оборудование {_money(total.furniture_estimate_pln)})."
            ),
            f"Полнота проверки: {decision.knowledge.check_completeness_score}/100.",
        ],
    )


def _negotiation_assistant_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Negotiation Assistant", items=[])
    decision = analysis.buyer_decision
    if decision is None:
        return _negotiation_section(analysis).model_copy(update={"title": "Negotiation Assistant"})

    negotiation = decision.negotiation
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
                *[f"Аргумент: {item}" for item in negotiation.arguments[:6]],
                *[f"Сценарий: {item}" for item in negotiation.seller_script[:5]],
                *[f"Guardrail: {item}" for item in negotiation.guardrails],
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
    checklist = [
        (
            f"{item.priority}/{item.category}: {item.label} "
            f"({item.status}) - {item.rationale}"
        )
        for item in diligence.checklist[:10]
    ]
    return ReportSection(
        title="Property Due Diligence",
        items=_deduplicate(
            [
                f"Due-diligence score: {diligence.score}/100 ({diligence.label}).",
                *[f"Red flag/check: {item}" for item in diligence.red_flags[:6]],
                *[f"Unknown: {item}" for item in diligence.unknowns[:8]],
                *[f"Document: {item}" for item in diligence.documents_to_request[:8]],
                *checklist,
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
            f"confidence {item.confidence_score}/100."
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
        else _buyer_max_offer(analysis)
    )
    alternatives = sorted(
        analysis.comparables,
        key=lambda item: (
            item.price > max_offer,
            item.price_per_m2,
            item.nearest_stop_m,
            item.id,
        ),
    )[:3]
    items = []
    for comparable in alternatives:
        reasons = []
        if comparable.price <= max_offer:
            reasons.append("цена не выше разумного потолка по текущему объекту")
        if comparable.price_per_m2 < listing.price_per_m2:
            reasons.append("ниже цена за m2")
        if comparable.nearest_stop_m < listing.nearest_stop_m:
            reasons.append("лучше транспортная близость")
        if comparable.days_on_market < listing.days_on_market:
            reasons.append("меньше экспозиция на рынке")
        if not reasons:
            reasons.append("использовать как price anchor в торге")
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

    viewing = decision.pre_viewing
    return ReportSection(
        title="До просмотра",
        items=_deduplicate(
            [
                f"Рекомендация: {viewing.recommendation}.",
                *[f"Плюс: {item}" for item in viewing.positives[:5]],
                *[f"Риск: {item}" for item in viewing.risks[:5]],
                *[f"Вопрос продавцу: {item}" for item in viewing.seller_questions[:10]],
                *[f"Сфотографировать: {item}" for item in viewing.photos_to_take[:5]],
                *[f"Проверить дом: {item}" for item in viewing.building_checks[:5]],
                *[f"Проверить вокруг: {item}" for item in viewing.surroundings_checks[:5]],
                *[
                    f"После просмотра отметить: {item}"
                    for item in decision.post_viewing_checklist[:8]
                ],
            ]
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
            (
                "На просмотре: сверить состояние окон/электрики/воды/вентиляции "
                "и проверить шум."
            ),
        ],
    )


def _buyer_lifestyle_rental_outlook_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Жизнь, аренда и развитие района", items=[])

    listing = analysis.listing
    area = analysis.area_statistics
    scores = analysis.scores
    gross_yield = (
        analysis.rental_estimate.gross_yield_pct
        if analysis.rental_estimate is not None
        else _estimate_gross_yield_pct(analysis)
    )
    items = [
        f"Для жизни: {_own_living_fit(analysis)}",
        f"Для семьи: {_family_fit(analysis)}",
        (
            f"Для аренды: {_rental_fit(analysis)} Rental Potential "
            f"{scores.rental_potential_score}/100; ориентировочная gross yield "
            f"{gross_yield:.1f}%."
        ),
        (
            f"Ликвидность: {_liquidity_fit(analysis)} Liquidity Score "
            f"{scores.liquidity_score}/100; средняя экспозиция района "
            f"{area.average_days_on_market} дней, объект {listing.days_on_market} дней."
        ),
        (
            f"Развитие района: {_future_area_outlook(analysis)} "
            f"Планируемые инвестиции в 2 km: {listing.planned_investments_within_2km}; "
            f"цены 90d {area.price_change_90d_pct:+.1f}%, "
            f"предложение 90d {area.supply_change_90d_pct:+.1f}%."
        ),
    ]
    items.extend(_future_impact_report_items(analysis))
    if analysis.growth_analysis is not None:
        growth = analysis.growth_analysis
        items.append(
            f"Growth analysis: {growth.growth_score}/100 "
            f"({growth.growth_label}). {growth.summary}"
        )
        if growth.positive_signals:
            items.append(f"Growth positives: {'; '.join(growth.positive_signals[:3])}.")
        if growth.drag_signals:
            items.append(f"Growth drags/checks: {'; '.join(growth.drag_signals[:3])}.")
        if growth.missing_layers:
            items.append(
                f"Growth data gaps to verify: {'; '.join(growth.missing_layers[:3])}."
            )
    if analysis.rental_estimate is not None:
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
            (
                f"{item.name}: "
                f"{'; '.join([*item.disruption_risks, *item.supply_pressure_risks])}"
            )
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
            (
                f"Fair price range: {scores.fair_price_low:,}-"
                f"{scores.fair_price_high:,} PLN"
            ).replace(",", " "),
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
    return ReportSection(
        title="Аргументы для торга",
        items=[] if analysis is None else analysis.negotiation_arguments,
    )


def _seller_questions_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Вопросы продавцу", items=[])

    listing = analysis.listing
    questions = [
        "Почему объект продается и какой ожидаемый срок сделки?",
        "Кто является собственником и есть ли согласие всех владельцев на продажу?",
        "Есть ли ипотека, судебные ограничения, сервитуты или другие обременения?",
        "Какие ежемесячные платежи: czynsz, fundusz remontowy, media, ogrzewanie?",
        "Какие ремонты уже сделаны и какие крупные расходы ожидаются в ближайшие 2-3 года?",
        "Что входит в цену: мебель, техника, parking, komórka lokatorska?",
    ]
    if listing.days_on_market >= 90:
        questions.append(
            "Объект давно на рынке: какие были причины отказов предыдущих покупателей?"
        )
    if listing.price_reductions > 0:
        questions.append("Цена уже снижалась: какой минимальный уровень продавец готов обсуждать?")
    if listing.relisted:
        questions.append("Объект публиковался повторно: менялись ли условия, цена или состояние?")
    return ReportSection(title="Вопросы продавцу", items=questions)


def _purchase_checklist_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Чеклист проверки перед оффером", items=[])

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
                f"{factor.category}/{factor.code}: {factor.severity}. "
                f"{factor.summary}{evidence}"
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
            f"Liquidity Score: {scores.liquidity_score}/100",
            f"Rental Potential Score: {scores.rental_potential_score}/100",
            f"Investment Score: {scores.investment_score}/100",
            *scores.reasons,
        ],
    )


def _investor_rental_yield_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Арендная доходность", items=[])

    listing = analysis.listing
    if analysis.rental_estimate is None:
        yield_pct = _estimate_gross_yield_pct(analysis)
        monthly_rent = round(listing.price * yield_pct / 100 / 12)
        annual_rent = monthly_rent * 12
        return ReportSection(
            title="Арендная доходность",
            items=[
                (
                    "MVP estimate: gross yield "
                    f"{yield_pct:.1f}% при ориентировочной аренде {_money(monthly_rent)}/мес."
                ),
                f"Ориентировочная годовая аренда brutto: {_money(annual_rent)}.",
                f"Rental Potential Score: {analysis.scores.rental_potential_score}/100.",
                (
                    "Это грубая эвристика для первичного отбора; перед покупкой нужна проверка "
                    "реальных арендных comparables, vacancy и налогов."
                ),
            ],
        )

    rental = analysis.rental_estimate
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
            f"NOI before financing: {_money(rental.net_operating_income_monthly_pln)}/мес.",
            *scenario_items,
            f"Rental estimate confidence: {rental.confidence_score}/100.",
            f"Rental Potential Score: {analysis.scores.rental_potential_score}/100.",
            (
                f"Транспортный фактор: остановка {listing.nearest_stop_m} m, "
                f"до центра {listing.distance_to_center_km:.1f} km."
            ),
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
            -item.planned_investments_within_2km,
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
                f"planned investments: {comparable.planned_investments_within_2km}."
            ).replace(",", " ")
        )
    return ReportSection(title="Сравнение с альтернативами", items=items)


def _investor_liquidity_growth_section(analysis: ListingAnalysis | None) -> ReportSection:
    if analysis is None:
        return ReportSection(title="Ликвидность и тезис роста", items=[])

    listing = analysis.listing
    area = analysis.area_statistics
    scores = analysis.scores
    thesis = [
        f"Liquidity Score: {scores.liquidity_score}/100.",
        (
            f"Average days on market в районе: {area.average_days_on_market}; "
            f"объект: {listing.days_on_market}."
        ),
        f"Динамика цены района за 90 дней: {area.price_change_90d_pct:+.1f}%.",
        f"Динамика предложения за 90 дней: {area.supply_change_90d_pct:+.1f}%.",
        f"Планируемые инвестиции в 2 km: {listing.planned_investments_within_2km}.",
    ]
    if area.price_change_90d_pct > 0 and listing.planned_investments_within_2km > 0:
        thesis.append("Growth thesis: район растет и рядом есть future infrastructure catalysts.")
    elif area.supply_change_90d_pct > 15:
        thesis.append("Risk thesis: предложение быстро растет; проверьте риск oversupply.")
    else:
        thesis.append("Growth thesis: нейтральный сценарий, решение зависит от цены входа.")
    thesis.extend(_future_impact_report_items(analysis))
    if analysis.growth_analysis is not None:
        growth = analysis.growth_analysis
        thesis.append(
            f"Growth analysis score: {growth.growth_score}/100 "
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
        (
            f"Цена объекта: {_money(listing.price)}, "
            f"{_money(listing.price_per_m2)}/m2."
        ),
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
            f"До центра: {listing.distance_to_center_km:.1f} km.",
            f"Ближайшая остановка: {listing.nearest_stop_m} m.",
            f"Ближайшая школа: {listing.nearest_school_m} m.",
            f"Планируемые инвестиции в 2 km: {listing.planned_investments_within_2km}.",
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
    if listing.distance_to_center_km <= 8:
        strengths.append(f"до центра {listing.distance_to_center_km:.1f} km")
    else:
        tradeoffs.append(f"до центра {listing.distance_to_center_km:.1f} km")
    if listing.nearest_stop_m <= 600:
        strengths.append(f"остановка {listing.nearest_stop_m} m")
    else:
        tradeoffs.append(f"остановка {listing.nearest_stop_m} m")
    if listing.parks_within_1km:
        strengths.append(f"парки в 1 km: {listing.parks_within_1km}")
    if listing.floor == 0:
        tradeoffs.append("parter/нулевой этаж")
    if listing.nearest_major_road_m < 150:
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
    if listing.nearest_school_m <= 1000 or listing.schools_within_1km > 0:
        strengths.append(f"школа {listing.nearest_school_m} m")
    else:
        constraints.append(f"школа {listing.nearest_school_m} m")
    if listing.parks_within_1km:
        strengths.append(f"парки в 1 km: {listing.parks_within_1km}")
    else:
        constraints.append("нет парка в 1 km в MVP-данных")
    if listing.nearest_major_road_m < 150:
        constraints.append(f"major road {listing.nearest_major_road_m} m")

    if len(strengths) >= 3 and not constraints:
        return f"хороший семейный профиль ({'; '.join(strengths)})."
    if strengths:
        return f"частично подходит: {', '.join(strengths)}; проверить {', '.join(constraints)}."
    return f"семейный fit слабый по MVP-сигналам: {', '.join(constraints)}."


def _rental_fit(analysis: ListingAnalysis) -> str:
    listing = analysis.listing
    score = analysis.scores.rental_potential_score
    if score >= 65 and listing.nearest_stop_m <= 600:
        return "выглядит интересно для аренды благодаря rental score и транспорту."
    if score >= 50:
        return "средний арендный сценарий; проверить реальные ставки аренды и vacancy."
    return "арендный сценарий слабее среднего; не считать доходность главным аргументом."


def _liquidity_fit(analysis: ListingAnalysis) -> str:
    listing = analysis.listing
    area = analysis.area_statistics
    score = analysis.scores.liquidity_score
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
    if listing.planned_investments_within_2km >= 2 and area.price_change_90d_pct >= 0:
        return "есть позитивный infrastructure/growth сигнал, но проверить сроки реализации."
    if area.supply_change_90d_pct > 15:
        return "предложение растет быстро, проверить риск oversupply и давление на цену."
    if area.price_change_90d_pct < -3:
        return "район просел по цене за 90 дней, нужен консервативный сценарий."
    if listing.planned_investments_within_2km:
        return "есть planned-investment сигнал, но влияние зависит от конкретного проекта."
    return "сильных future-growth сигналов в MVP-данных нет."


def _location_risk_flags(analysis: ListingAnalysis) -> list[str]:
    listing = analysis.listing
    risks: list[str] = []
    if analysis.future_area_impact is not None:
        risks.extend(analysis.future_area_impact.risk_signals[:2])
    if listing.nearest_major_road_m < 200:
        risks.append(f"шум/трафик от major road {listing.nearest_major_road_m} m")
    if listing.nearest_industrial_zone_m < 1000:
        risks.append(f"промзона {listing.nearest_industrial_zone_m} m")
    if listing.nearest_stop_m > 900:
        risks.append(f"остановка далеко: {listing.nearest_stop_m} m")
    if listing.nearest_school_m > 1200 and listing.rooms >= 3:
        risks.append(f"для семьи школа далековато: {listing.nearest_school_m} m")
    if analysis.area_statistics.supply_change_90d_pct > 15:
        risks.append("рост предложения может снижать переговорную позицию продавцов")
    return risks[:4]


def _deduplicate(items: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result


def _estimate_gross_yield_pct(analysis: ListingAnalysis) -> float:
    scores = analysis.scores
    listing = analysis.listing
    estimate = 4.0 + (scores.rental_potential_score - 50) * 0.035
    estimate -= max(scores.price_delta_to_fair_mid_pct, 0) * 0.015
    if listing.nearest_stop_m <= 300:
        estimate += 0.25
    if listing.distance_to_center_km <= 4:
        estimate += 0.2
    if listing.planned_investments_within_2km > 0:
        estimate += 0.15
    return round(min(max(estimate, 2.5), 6.5), 1)


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
