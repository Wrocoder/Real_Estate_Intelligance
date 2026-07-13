from domarion.schemas import (
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

    return ObjectReport(
        listing_id=listing.id,
        audience=audience,
        template_code=template.code,
        template_name=template.name,
        branding=branding if _has_branding(branding) else None,
        summary=summary,
        sections=template.build_sections(analysis),
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
    items = [
        f"Адрес/район: {listing.address}, {listing.district}, {listing.city}.",
        f"Параметры: {listing.rooms} pok., {listing.area_m2:.1f} m2, этаж {_floor_label(listing)}.",
        f"Текущая цена: {_money(listing.price)}; {_money(listing.price_per_m2)}/m2.",
        f"Fair price range: {_money(scores.fair_price_low)}-{_money(scores.fair_price_high)}.",
        f"Позиция цены: {position}.",
        f"Практический target для оффера: {_money(target_price)}.",
    ]
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
