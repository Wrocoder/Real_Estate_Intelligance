from domarion.schemas import (
    DeveloperQualitySignal,
    DeveloperReputation,
    ListingAnalysis,
    ObjectReport,
    ReportAudience,
    ReportBranding,
    ReportSection,
    UserSubmittedListingAnalysis,
)
from domarion.services.report_templates import get_report_template


def build_object_report(
    analysis: ListingAnalysis,
    audience: ReportAudience,
    branding: ReportBranding | None = None,
) -> ObjectReport:
    listing = analysis.listing
    scores = analysis.scores
    template = get_report_template(audience)

    if scores.price_delta_to_fair_mid_pct > 7:
        price_text = "цена выглядит выше расчетного fair price"
    elif scores.price_delta_to_fair_mid_pct < -7:
        price_text = "цена выглядит ниже расчетного fair price"
    else:
        price_text = "цена близка к расчетному fair price"

    summary = (
        f"{listing.title}: {_label_text(scores.decision_label)}; {price_text}. "
        f"Investment Score {scores.investment_score}/100, "
        f"Risk Score {scores.risk_score}/100, Negotiation Score {scores.negotiation_score}/100."
    )
    sections = template.build_sections(analysis)
    if analysis.developer_reputation is not None:
        sections.append(_developer_reputation_section(analysis.developer_reputation))

    return ObjectReport(
        listing_id=listing.id,
        audience=audience,
        template_code=template.code,
        template_name=template.name,
        branding=branding if _has_branding(branding) else None,
        summary=summary,
        sections=sections,
        disclaimer=(
            "Отчет является аналитической оценкой на основе доступных данных платформы. "
            "Это не финансовая, юридическая или инвестиционная рекомендация."
        ),
    )


def build_user_submitted_object_report(
    user_analysis: UserSubmittedListingAnalysis,
    audience: ReportAudience,
    branding: ReportBranding | None = None,
) -> ObjectReport:
    report = build_object_report(user_analysis.analysis, audience, branding=branding)
    sections = [
        _private_source_section(user_analysis),
        _buyer_price_decision_section(user_analysis.analysis),
        _next_action_section(user_analysis.analysis),
        *report.sections,
    ]
    return report.model_copy(
        update={
            "summary": _private_listing_summary(report.summary, user_analysis),
            "sections": sections,
        }
    )


def _has_branding(branding: ReportBranding | None) -> bool:
    if branding is None:
        return False
    return any(value for value in branding.model_dump().values())


def _label_text(value: str) -> str:
    return {
        "strong_candidate": "сильный кандидат",
        "good_option": "хороший вариант",
        "fair_option": "нормальный вариант",
        "overpriced": "похоже дорого",
        "risky": "высокий риск",
        "weak_fit": "слабое совпадение",
    }.get(value, value)


def _developer_reputation_section(reputation: DeveloperReputation) -> ReportSection:
    developer = reputation.developer
    items = [
        (
            f"{developer.name}: рейтинг {reputation.reputation_score}/100 "
            f"({_developer_label_text(reputation.label)}), "
            f"уверенность данных {reputation.confidence_score}/100."
        ),
        (
            f"История: сдано {reputation.completed_projects_count}, "
            f"активных проектов {reputation.active_projects_count}; "
            f"локальный опыт {reputation.local_experience_score}/100."
        ),
        (
            f"Факторы: track record {reputation.track_record_score}/100, "
            f"delivery {reputation.delivery_score}/100, "
            f"technical quality {reputation.technical_quality_score}/100, "
            f"transparency {reputation.transparency_score}/100."
        ),
        _developer_due_diligence_posture(reputation),
    ]
    if reputation.positive_signals:
        items.append(f"Позитивные сигналы: {'; '.join(reputation.positive_signals[:3])}.")
    if reputation.risk_signals:
        items.append(f"Риски/проверки: {'; '.join(reputation.risk_signals[:3])}.")
    items.extend(_developer_project_items(reputation))
    items.extend(_developer_quality_signal_items(reputation))
    items.extend(_developer_due_diligence_items(reputation))
    items.extend(_developer_source_citation_items(reputation))
    return ReportSection(title="Застройщик и репутация", items=_deduplicate(items))


def _developer_due_diligence_posture(reputation: DeveloperReputation) -> str:
    if (
        reputation.risk_signals
        or reputation.label == "risk_review"
        or reputation.reputation_score < 55
    ):
        return (
            "Позиция по застройщику: высокий due-diligence режим; до zadatek/umowa "
            "rezerwacyjna запросить документы, проверить project company и получить "
            "независимую техническую/юридическую оценку."
        )
    if reputation.confidence_score < 65 or reputation.label == "limited_data":
        return (
            "Позиция по застройщику: данных недостаточно для уверенного вывода; "
            "подтвердить track record минимум двумя независимыми источниками."
        )
    if reputation.reputation_score >= 70 and reputation.confidence_score >= 65:
        return (
            "Позиция по застройщику: профиль выглядит приемлемо для продолжения сделки, "
            "но договор, escrow/rachunek powierniczy и сроки сдачи все равно проверять."
        )
    return (
        "Позиция по застройщику: нейтральный профиль; решение должно зависеть от "
        "документов конкретного проекта, графика платежей и качества договора."
    )


def _developer_project_items(reputation: DeveloperReputation) -> list[str]:
    completed = [
        project
        for project in reputation.projects
        if project.status == "completed"
    ]
    active = [
        project
        for project in reputation.projects
        if project.status in {"active", "planned"}
    ]
    items: list[str] = []
    if completed:
        items.append(
            "Сданные проекты для проверки отзывов жильцов: "
            f"{'; '.join(_developer_project_label(project) for project in completed[:3])}."
        )
    if active:
        items.append(
            "Активные проекты для проверки сроков и этапа строительства: "
            f"{'; '.join(_developer_project_label(project) for project in active[:3])}."
        )
    return items


def _developer_quality_signal_items(reputation: DeveloperReputation) -> list[str]:
    severity_priority = {"risk": 0, "warning": 1, "positive": 2, "info": 3}
    signals = sorted(
        reputation.quality_signals,
        key=lambda signal: (severity_priority.get(signal.severity, 9), signal.title),
    )
    items: list[str] = []
    for signal in signals[:5]:
        observed = f", observed {signal.observed_at}" if signal.observed_at else ""
        moderation = _developer_signal_moderation_text(signal)
        items.append(
            f"Source signal ({_developer_signal_severity_text(signal.severity)}): "
            f"{signal.title} - {signal.summary} "
            f"Source: {signal.source_name}; confidence {signal.confidence_score}/100"
            f"{observed}{moderation}."
        )
    return items


def _developer_due_diligence_items(reputation: DeveloperReputation) -> list[str]:
    items = [
        f"Developer due diligence: {question}"
        for question in reputation.due_diligence_questions[:5]
    ]
    if reputation.developer.krs:
        items.append(f"Registry check: KRS {reputation.developer.krs}.")
    if reputation.developer.nip:
        items.append(f"Registry check: NIP {reputation.developer.nip}.")
    if reputation.developer.regon:
        items.append(f"Registry check: REGON {reputation.developer.regon}.")
    return items


def _developer_source_citation_items(reputation: DeveloperReputation) -> list[str]:
    items: list[str] = []
    for citation in reputation.source_citations[:5]:
        note = f" Note: {citation.note}" if citation.note else ""
        source_url = f" URL: {citation.source_url}" if citation.source_url else ""
        items.append(
            f"Source citation: {citation.source_name}, checked {citation.checked_at}."
            f"{note}{source_url}"
        )
    if items:
        items.append(
            "Данные по застройщику являются decision-support; перед платным решением "
            "нужна финальная проверка документов и актуальных registry records."
        )
    return items


def _developer_project_label(project) -> str:
    parts = [project.name, project.city]
    if project.district:
        parts.append(project.district)
    if project.completed_year:
        parts.append(str(project.completed_year))
    return " / ".join(parts)


def _developer_signal_severity_text(value: str) -> str:
    return {
        "positive": "positive",
        "info": "info",
        "warning": "warning",
        "risk": "risk",
    }.get(value, value)


def _developer_signal_moderation_text(signal: DeveloperQualitySignal) -> str:
    notes: list[str] = []
    if signal.moderation_status != "active":
        notes.append(f"moderation {signal.moderation_status}")
    if signal.dispute_status != "none":
        notes.append(f"dispute {signal.dispute_status}")
    if not notes:
        return ""
    return f"; {'; '.join(notes)}"


def _developer_label_text(value: str) -> str:
    return {
        "strong": "сильный профиль",
        "good": "хороший профиль",
        "mixed": "смешанный профиль",
        "limited_data": "мало данных",
        "risk_review": "нужна углубленная проверка",
    }.get(value, value)


def _private_listing_summary(
    base_summary: str,
    user_analysis: UserSubmittedListingAnalysis,
) -> str:
    source = user_analysis.source_domain or "manual input"
    return (
        f"{base_summary} Confidence {user_analysis.confidence_score}/100. "
        f"Source context: {source}, private reference only."
    )


def _private_source_section(user_analysis: UserSubmittedListingAnalysis) -> ReportSection:
    source = user_analysis.source_domain or "manual input"
    reference_status = (
        "private source URL was provided and is hidden from report output"
        if user_analysis.source_url_private
        else "no source URL; analysis is based on manual fields"
    )
    items = [
        f"Source domain: {source}.",
        f"Reference handling: {reference_status}.",
        f"Report confidence: {user_analysis.confidence_score}/100.",
        f"Comparables basis: {user_analysis.comparables_basis}.",
        user_analysis.retention_note,
        *user_analysis.warnings[:4],
    ]
    return ReportSection(title="Источник и надежность отчета", items=_deduplicate(items))


def _buyer_price_decision_section(analysis: ListingAnalysis) -> ReportSection:
    listing = analysis.listing
    scores = analysis.scores
    delta = listing.price - scores.fair_price_mid
    if delta > 0:
        position = f"выше fair mid на {_money(delta)} ({scores.price_delta_to_fair_mid_pct:+.1f}%)"
    elif delta < 0:
        position = (
            f"ниже fair mid на {_money(abs(delta))} "
            f"({scores.price_delta_to_fair_mid_pct:+.1f}%)"
        )
    else:
        position = "совпадает с fair mid"

    target_price = _buyer_target_price(analysis)
    attribute_bits = [
        _attribute_label(listing.building_type),
        _attribute_label(listing.renovation_state),
        _lifestyle_label(listing),
        f"parking: {_attribute_label(listing.parking_type)}" if listing.parking_type else "",
        f"heating: {_attribute_label(listing.heating_type)}" if listing.heating_type else "",
    ]
    attribute_text = ", ".join(item for item in attribute_bits if item)
    items = [
        f"Адрес/район: {listing.address}, {listing.district}, {listing.city}.",
        f"Параметры: {listing.rooms} pok., {listing.area_m2:.1f} m2, этаж {_floor_label(listing)}.",
        f"Текущая цена: {_money(listing.price)}; {_money(listing.price_per_m2)}/m2.",
        f"Fair price range: {_money(scores.fair_price_low)}-{_money(scores.fair_price_high)}.",
        f"Позиция цены: {position}.",
        f"Практический target для оффера: {_money(target_price)}.",
    ]
    if attribute_text:
        items.insert(2, f"Здание/состояние: {attribute_text}.")
    if scores.price_delta_to_fair_mid_pct > 7:
        items.append(
            "Не спешить с полной ценой: сначала проверить документы "
            "и торговаться от fair range."
        )
    elif scores.price_delta_to_fair_mid_pct < -6:
        items.append("Цена выглядит интересной; важно проверить, почему рынок дает дисконт.")
    else:
        items.append(
            "Цена близка к fair range; решение больше зависит от состояния "
            "и юридической чистоты."
        )
    return ReportSection(title="Цена: fair value и решение", items=items)


def _next_action_section(analysis: ListingAnalysis) -> ReportSection:
    listing = analysis.listing
    scores = analysis.scores
    items = [
        (
            "Перед просмотром: запросить czynsz, fundusz remontowy, media "
            "и список того, что входит в цену."
        ),
        (
            "Перед оффером: проверить księga wieczysta, собственника, "
            "ипотеку/roszczenia и задолженности."
        ),
        (
            "На просмотре: сверить фактическую площадь, этаж, состояние "
            "окон/электрики/воды/вентиляции."
        ),
        (
            f"Локация: остановка {listing.nearest_stop_m} m, школа {listing.nearest_school_m} m, "
            f"major road {listing.nearest_major_road_m} m, industrial zone "
            f"{listing.nearest_industrial_zone_m} m."
        ),
        (
            f"Переговоры: Negotiation Score {scores.negotiation_score}/100; "
            f"основные аргументы: {'; '.join(analysis.negotiation_arguments[:3])}."
        ),
    ]
    if scores.risk_score >= 60:
        items.append("Risk Score повышен: без дополнительной проверки не вносить задаток.")
    if listing.building_year and listing.building_year < 1990:
        items.append("Дом старше 1990: отдельно проверить ремонты здания и состояние инсталляций.")
    if listing.floor == 0:
        items.append("Parter/нулевой этаж: проверить приватность, шум, влажность и безопасность.")
    return ReportSection(title="Что делать дальше", items=_deduplicate(items))


def _buyer_target_price(analysis: ListingAnalysis) -> int:
    listing = analysis.listing
    scores = analysis.scores
    if scores.price_delta_to_fair_mid_pct > 7:
        return min(scores.fair_price_mid, round(listing.price * 0.95))
    if scores.price_delta_to_fair_mid_pct > 0:
        return min(scores.fair_price_high, round(listing.price * 0.97))
    return min(listing.price, scores.fair_price_high)


def _floor_label(analysis_listing) -> str:
    floor = analysis_listing.floor
    floors = analysis_listing.building_floors
    if floor is None and floors is None:
        return "unknown"
    if floor is None:
        return f"?/{floors}"
    if floors is None:
        return str(floor)
    return f"{floor}/{floors}"


def _attribute_label(value: str | None) -> str:
    if not value:
        return ""
    return value.replace("_", " ")


def _lifestyle_label(listing) -> str:
    items = [
        "balcony" if listing.has_balcony else "",
        "terrace" if listing.has_terrace else "",
        "garden" if listing.has_garden else "",
        "elevator" if listing.has_elevator else "",
    ]
    return ", ".join(item for item in items if item)


def _money(value: int) -> str:
    return f"{value:,} PLN".replace(",", " ")


def _deduplicate(items: list[str]) -> list[str]:
    result = []
    seen = set()
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result
