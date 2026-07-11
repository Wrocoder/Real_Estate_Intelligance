from domarion.schemas import ListingAnalysis, ObjectReport, ReportAudience, ReportBranding
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
        f"{listing.title}: {price_text}. Investment Score {scores.investment_score}/100, "
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


def _has_branding(branding: ReportBranding | None) -> bool:
    if branding is None:
        return False
    return any(value for value in branding.model_dump().values())
