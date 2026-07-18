from datetime import UTC, datetime
from typing import Any

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    Listing,
    PartnerLeadFit,
    PartnerLeadPriority,
    PartnerLeadScore,
    PartnerLeadScoreComponent,
    PartnerReferral,
)

LEAD_SCORING_DISCLAIMER = (
    "Partner lead score is an operational prioritization signal for sales and partner handoff. "
    "It is not credit advice, mortgage advice, legal advice, a financing approval, a guarantee "
    "of conversion or a substitute for partner compliance checks."
)

MORTGAGE_VALUE_KEYS = (
    "property_price_pln",
    "property_price",
    "listing_price",
    "purchase_price",
    "budget_pln",
    "budget",
)
LOAN_VALUE_KEYS = ("loan_amount_pln", "loan_amount", "mortgage_amount_pln")
TIMELINE_KEYS = ("timeline", "purchase_timeline", "timeframe", "buying_timeline")
HIGH_INTENT_WORDS = (
    "this week",
    "urgent",
    "ready",
    "offer",
    "zadatek",
    "umowa",
    "credit",
    "loan",
    "mortgage",
    "financing",
    "kredyt",
    "hipoteka",
    "oferta",
)


def build_partner_lead_scores(
    repository: RealEstateRepository,
    referrals: list[PartnerReferral],
    *,
    min_score: int | None = None,
) -> list[PartnerLeadScore]:
    scores = [build_partner_lead_score(repository, referral) for referral in referrals]
    if min_score is not None:
        scores = [score for score in scores if score.total_score >= min_score]
    return sorted(scores, key=lambda item: (-item.total_score, item.referral.created_at))


def build_partner_lead_score(
    repository: RealEstateRepository,
    referral: PartnerReferral,
) -> PartnerLeadScore:
    listing = _listing_context(repository, referral)
    components = [
        _contactability_component(referral),
        _intent_component(referral),
        _commercial_fit_component(referral, listing),
        _data_completeness_component(referral, listing),
        _partner_fit_component(referral),
    ]
    total_score = _total_score(components)
    priority = _priority(referral, total_score)
    partner_fit = _partner_fit(referral)

    return PartnerLeadScore(
        referral=referral,
        generated_at=datetime.now(UTC),
        total_score=total_score,
        priority=priority,
        partner_fit=partner_fit,
        qualification_status=_qualification_status(referral, priority),
        estimated_deal_value_pln=_estimated_deal_value(referral, listing),
        next_action_due_hours=_next_action_due_hours(priority),
        routing_tags=_routing_tags(referral, priority, partner_fit, listing),
        reasons=_reasons(referral, components, listing),
        risks=_risks(referral, listing),
        recommended_actions=_recommended_actions(referral, priority, partner_fit),
        components=components,
        disclaimer=LEAD_SCORING_DISCLAIMER,
    )


def _contactability_component(referral: PartnerReferral) -> PartnerLeadScoreComponent:
    contact_channels = sum(
        1 for value in (referral.contact_email, referral.contact_phone) if value
    )
    if not referral.consent_to_contact:
        score = 0
        reason = "Consent to contact is missing."
    elif contact_channels == 2:
        score = 100
        reason = "Lead has consent plus email and phone."
    elif contact_channels == 1:
        score = 76
        reason = "Lead has consent and one direct contact channel."
    else:
        score = 35
        reason = "Lead relies on account fallback contact only."
    return _component("contactability", "Contactability", score, 0.24, reason)


def _intent_component(referral: PartnerReferral) -> PartnerLeadScoreComponent:
    score = 45
    reasons = []
    text = " ".join(
        item
        for item in (referral.source_context, referral.message, _metadata_text(referral.metadata))
        if item
    ).casefold()
    if referral.status == "qualified":
        score += 22
        reasons.append("already marked qualified")
    elif referral.status == "contacted":
        score += 12
        reasons.append("already contacted")
    elif referral.status in {"closed", "rejected"}:
        score -= 45
        reasons.append(f"status is {referral.status}")

    if any(word in text for word in HIGH_INTENT_WORDS):
        score += 20
        reasons.append("high-intent wording")
    if _timeline_is_soon(referral.metadata):
        score += 18
        reasons.append("near-term timeline")
    if referral.listing_id or referral.report_id:
        score += 12
        reasons.append("object/report reference")
    if referral.message and len(referral.message) >= 24:
        score += 8
        reasons.append("specific message")

    return _component(
        "intent",
        "Intent",
        _clamp(score),
        0.22,
        f"Intent signals: {', '.join(reasons) if reasons else 'basic inquiry'}.",
    )


def _commercial_fit_component(
    referral: PartnerReferral,
    listing: Listing | None,
) -> PartnerLeadScoreComponent:
    value = _estimated_deal_value(referral, listing)
    if referral.referral_type == "mortgage":
        if value is None:
            score = 50
            reason = "Mortgage lead has no property or loan value yet."
        elif value >= 900_000:
            score = 96
            reason = "High-value mortgage opportunity."
        elif value >= 600_000:
            score = 84
            reason = "Strong mortgage opportunity value."
        elif value >= 350_000:
            score = 68
            reason = "Usable mortgage opportunity value."
        else:
            score = 48
            reason = "Smaller mortgage opportunity."
    elif referral.referral_type in {"buyer_beta", "realtor_beta"}:
        score = 76 if value is None else min(92, 60 + round(value / 50_000))
        reason = "Beta lead can convert into paid reports or agency workflow."
    elif referral.referral_type == "legal":
        score = 72 if referral.report_id or referral.listing_id else 58
        reason = "Legal lead fit improves with a concrete object/report reference."
    else:
        score = 65 if referral.listing_id else 54
        reason = "Renovation lead fit improves with a concrete object reference."
    return _component("commercial_fit", "Commercial fit", _clamp(score), 0.22, reason)


def _data_completeness_component(
    referral: PartnerReferral,
    listing: Listing | None,
) -> PartnerLeadScoreComponent:
    fields = [
        referral.city,
        referral.district,
        referral.contact_name,
        referral.contact_email,
        referral.contact_phone,
        referral.message,
        referral.listing_id,
        referral.report_id,
    ]
    metadata_keys = sum(1 for value in referral.metadata.values() if value not in (None, "", []))
    filled = sum(1 for value in fields if value) + min(metadata_keys, 4)
    if listing is not None:
        filled += 2
    score = round(min(filled / 12, 1) * 100)
    return _component(
        "data_completeness",
        "Data completeness",
        score,
        0.16,
        f"{filled} useful lead fields are available for routing.",
    )


def _partner_fit_component(referral: PartnerReferral) -> PartnerLeadScoreComponent:
    if referral.referral_type == "mortgage":
        score = 94
        reason = "Direct mortgage/broker referral type."
    elif referral.referral_type == "legal":
        score = 82
        reason = "Direct legal partner referral type."
    elif referral.referral_type == "renovation":
        score = 76
        reason = "Direct renovation partner referral type."
    elif referral.referral_type == "realtor_beta":
        score = 72
        reason = "Agency beta can be routed to sales before partner handoff."
    else:
        score = 66
        reason = "Buyer beta can be nurtured into mortgage/legal referrals."
    return _component("partner_fit", "Partner fit", score, 0.16, reason)


def _component(
    code: str,
    label: str,
    score: int,
    weight: float,
    reason: str,
) -> PartnerLeadScoreComponent:
    return PartnerLeadScoreComponent(
        code=code,
        label=label,
        score=score,
        weight=weight,
        weighted_score=round(score * weight, 2),
        reason=reason,
    )


def _listing_context(
    repository: RealEstateRepository,
    referral: PartnerReferral,
) -> Listing | None:
    if not referral.listing_id:
        return None
    return repository.get_listing(referral.listing_id)


def _total_score(components: list[PartnerLeadScoreComponent]) -> int:
    return _clamp(sum(component.weighted_score for component in components))


def _priority(referral: PartnerReferral, score: int) -> PartnerLeadPriority:
    if not referral.consent_to_contact or referral.status == "rejected":
        return "disqualified"
    if referral.status == "closed":
        return "low_fit"
    if score >= 78:
        return "hot"
    if score >= 62:
        return "warm"
    if score >= 42:
        return "nurture"
    return "low_fit"


def _partner_fit(referral: PartnerReferral) -> PartnerLeadFit:
    if referral.referral_type in {"mortgage", "legal", "renovation"}:
        return referral.referral_type
    if referral.referral_type in {"buyer_beta", "realtor_beta"}:
        return "beta_sales"
    return "general"


def _qualification_status(referral: PartnerReferral, priority: PartnerLeadPriority) -> str:
    if priority == "disqualified":
        return "do_not_handoff"
    if referral.status == "qualified" or priority == "hot":
        return "ready_for_partner_handoff"
    if priority == "warm":
        return "sales_review"
    if priority == "nurture":
        return "needs_more_context"
    return "low_priority"


def _estimated_deal_value(referral: PartnerReferral, listing: Listing | None) -> int | None:
    direct = _first_metadata_number(referral.metadata, MORTGAGE_VALUE_KEYS)
    loan = _first_metadata_number(referral.metadata, LOAN_VALUE_KEYS)
    if loan is not None:
        return loan
    if direct is not None:
        return direct
    if listing is not None:
        if referral.referral_type == "mortgage":
            return round(listing.price * 0.8)
        return listing.price
    return None


def _next_action_due_hours(priority: PartnerLeadPriority) -> int:
    return {
        "hot": 4,
        "warm": 24,
        "nurture": 72,
        "low_fit": 168,
        "disqualified": 0,
    }[priority]


def _routing_tags(
    referral: PartnerReferral,
    priority: PartnerLeadPriority,
    partner_fit: PartnerLeadFit,
    listing: Listing | None,
) -> list[str]:
    tags = [priority, partner_fit, referral.referral_type, referral.status]
    if referral.city:
        tags.append(f"city:{referral.city.casefold()}")
    if referral.district:
        tags.append(f"district:{referral.district.casefold()}")
    if listing is not None:
        tags.extend(
            [
                f"market:{listing.market_type}",
                f"rooms:{listing.rooms}",
                f"price_band:{_price_band(listing.price)}",
            ]
        )
    return _deduplicate(tags)


def _reasons(
    referral: PartnerReferral,
    components: list[PartnerLeadScoreComponent],
    listing: Listing | None,
) -> list[str]:
    top_components = sorted(components, key=lambda item: item.weighted_score, reverse=True)[:3]
    reasons = [
        f"{component.label}: {component.reason}" for component in top_components
    ]
    if listing is not None:
        reasons.append(
            f"Listing context: {listing.address}, {listing.price} PLN, "
            f"{listing.rooms} rooms and {listing.price_per_m2} PLN/m2."
        )
    if referral.referral_type == "mortgage":
        reasons.append("Mortgage lead is directly monetizable via broker handoff.")
    return reasons


def _risks(referral: PartnerReferral, listing: Listing | None) -> list[str]:
    risks = []
    if not referral.contact_phone:
        risks.append("No phone number; conversion may be slower.")
    if not referral.district:
        risks.append("District is missing; routing may require manual enrichment.")
    if not referral.message:
        risks.append("No message; buyer intent is weakly explained.")
    if referral.referral_type == "mortgage" and _estimated_deal_value(referral, listing) is None:
        risks.append("Mortgage value is unknown; broker cannot size the opportunity yet.")
    if referral.status in {"closed", "rejected"}:
        risks.append(f"Lead status is {referral.status}; avoid new handoff unless reopened.")
    return risks[:6]


def _recommended_actions(
    referral: PartnerReferral,
    priority: PartnerLeadPriority,
    partner_fit: PartnerLeadFit,
) -> list[str]:
    if priority == "disqualified":
        return ["Do not hand off until consent/status is corrected."]

    actions = []
    if priority == "hot":
        actions.append("Call or message the lead within 4 business hours.")
    elif priority == "warm":
        actions.append("Review lead context and contact within 1 business day.")
    else:
        actions.append("Request missing context before partner handoff.")

    if partner_fit == "mortgage":
        actions.extend(
            [
                "Confirm purchase price, down payment, income range and decision timeline.",
                "Route to mortgage broker only after consent and affordability context are clear.",
            ]
        )
    elif partner_fit == "legal":
        actions.append("Confirm transaction stage and documents before legal partner handoff.")
    elif partner_fit == "renovation":
        actions.append("Confirm object condition, budget and desired renovation timeline.")
    else:
        actions.append("Qualify as sales/beta lead before converting into partner referral.")
    return actions[:5]


def _first_metadata_number(metadata: dict[str, Any], keys: tuple[str, ...]) -> int | None:
    lowered = {str(key).casefold(): value for key, value in metadata.items()}
    for key in keys:
        value = lowered.get(key.casefold())
        number = _coerce_number(value)
        if number is not None:
            return int(round(number))
    return None


def _coerce_number(value: object) -> float | None:
    if isinstance(value, int | float) and not isinstance(value, bool):
        return float(value)
    if isinstance(value, str):
        digits = "".join(char for char in value if char.isdigit() or char in {".", ","})
        if not digits:
            return None
        try:
            return float(digits.replace(",", "."))
        except ValueError:
            return None
    return None


def _metadata_text(metadata: dict[str, Any]) -> str:
    values = []
    for value in metadata.values():
        if isinstance(value, str):
            values.append(value)
    return " ".join(values)


def _timeline_is_soon(metadata: dict[str, Any]) -> bool:
    text = " ".join(
        str(metadata.get(key, "")) for key in TIMELINE_KEYS if metadata.get(key)
    ).casefold()
    return any(
        marker in text
        for marker in ("now", "this week", "this month", "asap", "urgent", "30")
    )


def _price_band(price: int) -> str:
    if price >= 1_000_000:
        return "1m_plus"
    if price >= 700_000:
        return "700k_1m"
    if price >= 500_000:
        return "500k_700k"
    return "under_500k"


def _clamp(value: float) -> int:
    return int(max(0, min(100, round(value))))


def _deduplicate(items: list[str]) -> list[str]:
    result = []
    seen = set()
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result
