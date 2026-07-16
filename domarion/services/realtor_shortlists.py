from datetime import UTC, datetime

from domarion.schemas import (
    CompareItemMetrics,
    CompareResponse,
    ListingAnalysis,
    RealtorClientShortlist,
    RealtorClientShortlistItem,
    RealtorClientShortlistRequest,
)
from domarion.services.listing_comparison import build_listing_comparison

DISCLAIMER = (
    "This shortlist is informational and based on current analytical data. It is not "
    "financial, legal or investment advice. Confirm availability, legal status, building "
    "condition, fees and financing terms before making an offer."
)


DECISION_LABELS = {
    "strong_candidate": "strong candidate",
    "good_option": "good option",
    "fair_option": "fair option",
    "overpriced": "overpriced option",
    "risky": "higher-risk option",
    "weak_fit": "weaker fit",
}


def build_realtor_client_shortlist(
    analyses: list[ListingAnalysis],
    request: RealtorClientShortlistRequest,
    *,
    agent_name: str | None = None,
    agent_email: str | None = None,
) -> RealtorClientShortlist:
    comparison = build_listing_comparison(analyses)
    analysis_by_id = {analysis.listing.id: analysis for analysis in comparison.items}
    ranked_items = [
        _shortlist_item(
            analysis_by_id[metric.listing_id],
            metric,
            include_source_links=request.include_source_links,
        )
        for metric in sorted(comparison.metrics, key=lambda item: item.rank)
    ]
    client_name = _clean_optional(request.client_name)
    intro = _clean_optional(request.intro)
    clean_agent_name = _clean_optional(agent_name)
    clean_agent_email = _clean_optional(agent_email)
    subject = _subject(client_name, ranked_items)
    summary = _summary(ranked_items, comparison)
    message = _client_message(
        client_name=client_name,
        intro=intro,
        agent_name=clean_agent_name,
        agent_email=clean_agent_email,
        items=ranked_items,
    )
    return RealtorClientShortlist(
        client_name=client_name,
        agent_name=clean_agent_name,
        agent_email=clean_agent_email,
        subject=subject,
        summary=summary,
        client_message=message,
        items=ranked_items,
        comparison_summary=comparison.summary,
        mortgage_assumptions=comparison.mortgage_assumptions,
        generated_at=datetime.now(UTC),
        disclaimer=DISCLAIMER,
    )


def _shortlist_item(
    analysis: ListingAnalysis,
    metric: CompareItemMetrics,
    *,
    include_source_links: bool,
) -> RealtorClientShortlistItem:
    listing = analysis.listing
    label = DECISION_LABELS.get(metric.decision_label, metric.decision_label)
    client_pitch = (
        f"Ranked #{metric.rank} in this shortlist with a {metric.decision_score}/100 "
        f"decision score. It is a {label}; {metric.recommendation}"
    )
    return RealtorClientShortlistItem(
        listing_id=listing.id,
        rank=metric.rank,
        title=listing.title,
        address=listing.address,
        district=listing.district,
        city=listing.city,
        price=listing.price,
        currency=listing.currency,
        area_m2=listing.area_m2,
        rooms=listing.rooms,
        decision_score=metric.decision_score,
        decision_label=metric.decision_label,
        fair_price_mid=metric.fair_price_mid_pln,
        price_delta_to_fair_mid_pct=metric.price_delta_to_fair_mid_pct,
        estimated_monthly_payment_pln=metric.estimated_monthly_payment_pln,
        upfront_cash_needed_pln=metric.upfront_cash_needed_pln,
        estimated_monthly_rent_pln=metric.estimated_monthly_rent_pln,
        estimated_gross_rental_yield_pct=metric.estimated_gross_rental_yield_pct,
        recommendation=metric.recommendation,
        client_pitch=client_pitch,
        talking_points=metric.reasons[:3],
        cautions=metric.warnings[:3],
        source_url=listing.source_url if include_source_links else None,
    )


def _subject(client_name: str | None, items: list[RealtorClientShortlistItem]) -> str:
    prefix = f"{client_name}: " if client_name else ""
    return f"{prefix}{len(items)} property shortlist"


def _summary(items: list[RealtorClientShortlistItem], comparison: CompareResponse) -> str:
    best = items[0]
    return (
        f"{len(items)} listings ranked for client review. Best fit: {best.title}, "
        f"{_money(best.price, best.currency)}, decision score {best.decision_score}/100. "
        f"Average monthly payment baseline: "
        f"{_money(comparison.summary.average_estimated_monthly_payment_pln, 'PLN')}."
    )


def _client_message(
    *,
    client_name: str | None,
    intro: str | None,
    agent_name: str | None,
    agent_email: str | None,
    items: list[RealtorClientShortlistItem],
) -> str:
    lines = [f"Hi {client_name}," if client_name else "Hi,", ""]
    lines.append(intro or "I prepared a ranked shortlist of the strongest current options.")
    lines.append("")
    for item in items:
        lines.extend(_client_item_lines(item))
        lines.append("")
    lines.append(
        "Recommended next step: pick the top 1-2 options for viewing, document checks "
        "and offer strategy."
    )
    lines.append("")
    lines.append(DISCLAIMER)
    if agent_name or agent_email:
        lines.append("")
        lines.append(f"Prepared by {agent_name or 'your advisor'}")
        if agent_email:
            lines.append(agent_email)
    return "\n".join(lines).strip()


def _client_item_lines(item: RealtorClientShortlistItem) -> list[str]:
    lines = [
        f"#{item.rank}. {item.title}",
        (
            f"   {item.city}, {item.district}, {item.address} | "
            f"{item.rooms} rooms | {item.area_m2:g} m2"
        ),
        (
            f"   Price: {_money(item.price, item.currency)} | fair estimate: "
            f"{_money(item.fair_price_mid, item.currency)} | "
            f"delta {item.price_delta_to_fair_mid_pct:+.1f}%"
        ),
        (
            f"   Monthly baseline: {_money(item.estimated_monthly_payment_pln, 'PLN')} | "
            f"cash needed: {_money(item.upfront_cash_needed_pln, 'PLN')}"
        ),
        (
            f"   Rental estimate: {_money(item.estimated_monthly_rent_pln, 'PLN')}/month | "
            f"{item.estimated_gross_rental_yield_pct:.2f}% gross yield"
        ),
        f"   Why it is on the list: {item.client_pitch}",
    ]
    if item.talking_points:
        lines.append(f"   Talking points: {'; '.join(item.talking_points)}")
    if item.cautions:
        lines.append(f"   Checks before offer: {'; '.join(item.cautions)}")
    if item.source_url:
        lines.append(f"   Listing source: {item.source_url}")
    return lines


def _money(value: int | float, currency: str) -> str:
    return f"{value:,.0f}".replace(",", " ") + f" {currency}"


def _clean_optional(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None
