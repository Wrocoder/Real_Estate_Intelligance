from datetime import UTC, datetime

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    Alert,
    ListingAnalysis,
    RealtorSavedSearchDigest,
    RealtorSavedSearchDigestItem,
    RealtorSavedSearchDigestRequest,
)
from domarion.services.alerts import build_alert_preview

DISCLAIMER = (
    "This client digest is an analytical shortlist prepared from saved-search criteria. "
    "It is not financial, legal or investment advice. Verify legal status, technical "
    "condition, financing and current availability before making an offer."
)


DECISION_LABELS = {
    "strong_candidate": "strong candidate",
    "good_option": "good option",
    "fair_option": "fair option",
    "overpriced": "overpriced",
    "risky": "higher-risk option",
    "weak_fit": "weak fit",
}


def build_realtor_saved_search_digest(
    repository: RealEstateRepository,
    alert: Alert,
    request: RealtorSavedSearchDigestRequest,
    *,
    agent_name: str | None = None,
    agent_email: str | None = None,
) -> RealtorSavedSearchDigest:
    preview = build_alert_preview(repository, alert, limit=request.max_matches)
    client_name = _clean_optional(request.client_name)
    intro = _clean_optional(request.intro)
    clean_agent_name = _clean_optional(agent_name)
    clean_agent_email = _clean_optional(agent_email)
    items = [
        _digest_item(analysis, include_source_links=request.include_source_links)
        for analysis in preview.matches
    ]
    subject = _subject(alert, client_name, len(items), preview.total_matches)
    summary = _summary(alert, items, preview.total_matches)
    client_message = _client_message(
        alert=alert,
        client_name=client_name,
        intro=intro,
        agent_name=clean_agent_name,
        agent_email=clean_agent_email,
        items=items,
        total_matches=preview.total_matches,
    )
    return RealtorSavedSearchDigest(
        alert=alert,
        client_name=client_name,
        agent_name=clean_agent_name,
        agent_email=clean_agent_email,
        subject=subject,
        summary=summary,
        client_message=client_message,
        total_matches=preview.total_matches,
        items=items,
        applied_filters=preview.applied_filters,
        generated_at=datetime.now(UTC),
        disclaimer=DISCLAIMER,
    )


def _digest_item(
    analysis: ListingAnalysis,
    *,
    include_source_links: bool,
) -> RealtorSavedSearchDigestItem:
    listing = analysis.listing
    scores = analysis.scores
    decision = DECISION_LABELS.get(scores.decision_label, scores.decision_label)
    price_signal = _price_signal(scores.price_delta_to_fair_mid_pct)
    client_pitch = (
        f"{listing.rooms}-room flat in {listing.district}, {listing.area_m2:g} m2, "
        f"{_money(listing.price, listing.currency)}. It looks like a {decision}; "
        f"{price_signal}."
    )
    return RealtorSavedSearchDigestItem(
        listing_id=listing.id,
        title=listing.title,
        address=listing.address,
        district=listing.district,
        city=listing.city,
        price=listing.price,
        currency=listing.currency,
        area_m2=listing.area_m2,
        rooms=listing.rooms,
        floor=listing.floor,
        price_per_m2=listing.price_per_m2,
        fair_price_mid=scores.fair_price_mid,
        price_delta_to_fair_mid_pct=scores.price_delta_to_fair_mid_pct,
        decision_label=scores.decision_label,
        negotiation_score=scores.negotiation_score,
        liquidity_score=scores.liquidity_score,
        rental_potential_score=scores.rental_potential_score,
        client_pitch=client_pitch,
        talking_points=scores.reasons[:3],
        cautions=scores.warnings[:3],
        source_url=listing.source_url if include_source_links else None,
    )


def _subject(
    alert: Alert,
    client_name: str | None,
    items_count: int,
    total_matches: int,
) -> str:
    prefix = f"{client_name}: " if client_name else ""
    suffix = f"{items_count} of {total_matches} matches" if total_matches else "no matches"
    return f"{prefix}{alert.name} shortlist ({suffix})"


def _summary(
    alert: Alert,
    items: list[RealtorSavedSearchDigestItem],
    total_matches: int,
) -> str:
    if not items:
        return f"No current listings match saved search '{alert.name}'."
    best = items[0]
    return (
        f"{len(items)} client-ready listings selected from {total_matches} matches. "
        f"Top option: {best.title} at {_money(best.price, best.currency)} with "
        f"negotiation/liquidity/rental scores {best.negotiation_score}/"
        f"{best.liquidity_score}/{best.rental_potential_score}."
    )


def _client_message(
    *,
    alert: Alert,
    client_name: str | None,
    intro: str | None,
    agent_name: str | None,
    agent_email: str | None,
    items: list[RealtorSavedSearchDigestItem],
    total_matches: int,
) -> str:
    lines = [f"Hi {client_name}," if client_name else "Hi,"]
    lines.append("")
    lines.append(
        intro
        or f"I checked your saved search '{alert.name}' and prepared the most relevant matches."
    )
    lines.append("")

    if not items:
        lines.extend(
            [
                "There are no current listings that pass the saved-search criteria.",
                "I will keep watching this segment and send a new shortlist "
                "when better options appear.",
            ]
        )
    else:
        lines.append(f"Shortlist: {len(items)} listings selected from {total_matches} matches.")
        lines.append("")
        for index, item in enumerate(items, start=1):
            lines.extend(_client_item_lines(index, item))
            lines.append("")
        lines.append(
            "Recommended next step: choose 1-2 listings for deeper due diligence, viewing "
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


def _client_item_lines(index: int, item: RealtorSavedSearchDigestItem) -> list[str]:
    lines = [
        f"{index}. {item.title}",
        (
            f"   {item.city}, {item.district}, {item.address} | {item.rooms} rooms | "
            f"{item.area_m2:g} m2 | floor {_floor_label(item.floor)}"
        ),
        (
            f"   Price: {_money(item.price, item.currency)} | "
            f"{_money(item.price_per_m2, item.currency)}/m2 | "
            f"fair estimate: {_money(item.fair_price_mid, item.currency)}"
        ),
        f"   Why it fits: {item.client_pitch}",
        (
            "   Scores: "
            f"negotiation {item.negotiation_score}, "
            f"liquidity {item.liquidity_score}, "
            f"rental {item.rental_potential_score}"
        ),
    ]
    if item.talking_points:
        lines.append(f"   Talking points: {'; '.join(item.talking_points)}")
    if item.cautions:
        lines.append(f"   Checks before offer: {'; '.join(item.cautions)}")
    if item.source_url:
        lines.append(f"   Listing source: {item.source_url}")
    return lines


def _price_signal(price_delta_to_fair_mid_pct: float) -> str:
    absolute = abs(price_delta_to_fair_mid_pct)
    if price_delta_to_fair_mid_pct <= -5:
        return f"priced about {absolute:.1f}% below the fair estimate"
    if price_delta_to_fair_mid_pct >= 8:
        return f"priced about {price_delta_to_fair_mid_pct:.1f}% above the fair estimate"
    return f"priced close to the fair estimate ({price_delta_to_fair_mid_pct:+.1f}%)"


def _floor_label(floor: int | None) -> str:
    return str(floor) if floor is not None else "n/a"


def _money(value: int | float, currency: str) -> str:
    return f"{value:,.0f}".replace(",", " ") + f" {currency}"


def _clean_optional(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None
