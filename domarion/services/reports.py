from domarion.schemas import ListingAnalysis, ObjectReport, ReportAudience, ReportSection


def build_object_report(analysis: ListingAnalysis, audience: ReportAudience) -> ObjectReport:
    listing = analysis.listing
    scores = analysis.scores

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

    sections = [
        ReportSection(
            title="Цена и рынок",
            items=[
                f"Текущая цена: {listing.price:,} {listing.currency}".replace(",", " "),
                f"Цена за m2: {listing.price_per_m2:,} {listing.currency}".replace(",", " "),
                (
                    f"Fair price range: {scores.fair_price_low:,}-"
                    f"{scores.fair_price_high:,} PLN"
                ).replace(",", " "),
                f"Медиана района: {analysis.area_statistics.median_price_per_m2:,} PLN/m2".replace(
                    ",", " "
                ),
            ],
        ),
        ReportSection(title="Инсайты", items=analysis.insights),
        ReportSection(title="Аргументы для торга", items=analysis.negotiation_arguments),
        ReportSection(
            title="Риски",
            items=scores.warnings or ["Критичных рисков в MVP-данных нет."],
        ),
        ReportSection(title="Качество данных", items=analysis.data_quality_notes),
    ]

    if audience == "investor":
        sections.insert(
            2,
            ReportSection(
                title="Инвестиционная оценка",
                items=[
                    f"Liquidity Score: {scores.liquidity_score}/100",
                    f"Rental Potential Score: {scores.rental_potential_score}/100",
                    *scores.reasons,
                ],
            ),
        )
    elif audience == "realtor":
        sections.insert(
            2,
            ReportSection(
                title="Для клиента риелтора",
                items=[
                    "Используйте сравнение с аналогами как основу для обсуждения цены.",
                    "Покажите историю снижения цены и дни на рынке как аргументы переговоров.",
                    "Отдельно проговорите факторы риска, чтобы не создавать ложных ожиданий.",
                ],
            ),
        )

    return ObjectReport(
        listing_id=listing.id,
        audience=audience,
        summary=summary,
        sections=sections,
        disclaimer=(
            "Отчет является аналитической оценкой на основе доступных данных платформы. "
            "Это не финансовая, юридическая или инвестиционная рекомендация."
        ),
    )
