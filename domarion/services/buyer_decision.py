from domarion.schemas import (
    AreaStatistics,
    BuyerDecisionPackage,
    BuyerDecisionVerdict,
    BuyerIntentFit,
    BuyerKnowledgeMatrix,
    BuyerNegotiationAssistant,
    BuyerNegotiationEvidence,
    BuyerSourceEvidence,
    DeveloperReputation,
    DueDiligenceChecklistItem,
    Listing,
    ListingAnalysis,
    ListingFutureImpact,
    ListingRentalEstimate,
    ListingRiskProfile,
    MortgageCalculationRequest,
    PostViewingChecklistAnswers,
    PostViewingIssueLevel,
    PostViewingVerdictRecalculation,
    PropertyDueDiligence,
    PropertyScores,
    PurchaseIntent,
    TotalAcquisitionCost,
    ViewingAssistant,
)
from domarion.services.mortgage import calculate_mortgage

BUYER_DECISION_DISCLAIMER = (
    "Buyer decision outputs are structured screening support. They are not legal, "
    "financial, tax, valuation or investment advice and do not confirm that a property "
    "is legally or technically clean."
)
BUYER_DECISION_MODEL_VERSION = "buyer-decision-v2-intent"

POST_VIEWING_FIELD_LABELS = {
    "condition": "overall condition",
    "windows": "windows and acoustic/thermal seal",
    "noise": "noise inside the apartment",
    "smell": "smell and ventilation",
    "humidity": "humidity or moisture",
    "staircase": "staircase and common areas",
    "orientation": "orientation and daylight",
    "kitchen_bathroom": "kitchen and bathroom condition",
}
POST_VIEWING_MAJOR_ADJUSTMENTS = {
    "condition": (14, 50_000),
    "windows": (8, 25_000),
    "noise": (14, 40_000),
    "smell": (10, 25_000),
    "humidity": (18, 70_000),
    "staircase": (9, 25_000),
    "orientation": (5, 15_000),
    "kitchen_bathroom": (10, 35_000),
}
POST_VIEWING_RENOVATION_ADJUSTMENTS = {
    "none": (-2, 0, "ready_to_move_in", "No material renovation need confirmed."),
    "refresh": (3, 20_000, "needs_refresh", "Refresh budget should be priced in."),
    "light": (7, 60_000, "light_renovation", "Light renovation scope should be priced in."),
    "full": (16, 160_000, "full_renovation", "Full renovation scope should be priced in."),
}


def build_buyer_decision(
    *,
    listing: Listing,
    area_statistics: AreaStatistics,
    scores: PropertyScores,
    comparables: list[Listing],
    negotiation_arguments: list[str],
    data_quality_notes: list[str],
    developer_reputation: DeveloperReputation | None = None,
    future_area_impact: ListingFutureImpact | None = None,
    risk_profile: ListingRiskProfile | None = None,
    rental_estimate: ListingRentalEstimate | None = None,
    purchase_intent: PurchaseIntent = "unsure",
) -> BuyerDecisionPackage:
    total_acquisition = _total_acquisition_cost(listing)
    due_diligence = _due_diligence(
        listing=listing,
        scores=scores,
        developer_reputation=developer_reputation,
        risk_profile=risk_profile,
    )
    intent_fit = _intent_fit(
        listing=listing,
        scores=scores,
        rental_estimate=rental_estimate,
        total_acquisition=total_acquisition,
    )
    selected_intent_fit = _selected_intent_fit(intent_fit, purchase_intent)
    verdict = _verdict(
        listing=listing,
        area_statistics=area_statistics,
        scores=scores,
        comparables=comparables,
        risk_profile=risk_profile,
        due_diligence=due_diligence,
        future_area_impact=future_area_impact,
        total_acquisition=total_acquisition,
        selected_intent_fit=selected_intent_fit,
    )
    negotiation = _negotiation_assistant(
        listing=listing,
        scores=scores,
        verdict=verdict,
        area_statistics=area_statistics,
        comparables=comparables,
        negotiation_arguments=negotiation_arguments,
    )
    knowledge = _knowledge_matrix(
        listing=listing,
        area_statistics=area_statistics,
        scores=scores,
        comparables=comparables,
        due_diligence=due_diligence,
        future_area_impact=future_area_impact,
        rental_estimate=rental_estimate,
        data_quality_notes=data_quality_notes,
    )
    pre_viewing = _pre_viewing_assistant(
        verdict=verdict,
        due_diligence=due_diligence,
        listing=listing,
    )
    return BuyerDecisionPackage(
        verdict=verdict,
        negotiation=negotiation,
        due_diligence=due_diligence,
        knowledge=knowledge,
        total_acquisition=total_acquisition,
        selected_intent=purchase_intent,
        decision_model_version=BUYER_DECISION_MODEL_VERSION,
        selected_intent_fit=selected_intent_fit,
        intent_fit=intent_fit,
        pre_viewing=pre_viewing,
        post_viewing_checklist=_post_viewing_checklist(listing),
        watch_triggers=_watch_triggers(
            listing=listing,
            scores=scores,
            comparables=comparables,
            verdict=verdict,
            future_area_impact=future_area_impact,
            developer_reputation=developer_reputation,
        ),
        disclaimer=BUYER_DECISION_DISCLAIMER,
    )


def recalculate_post_viewing_verdict(
    analysis: ListingAnalysis,
    answers: PostViewingChecklistAnswers,
) -> PostViewingVerdictRecalculation:
    original_decision = analysis.buyer_decision or build_buyer_decision(
        listing=analysis.listing,
        area_statistics=analysis.area_statistics,
        scores=analysis.scores,
        comparables=analysis.comparables,
        negotiation_arguments=analysis.negotiation_arguments,
        data_quality_notes=analysis.data_quality_notes,
        developer_reputation=analysis.developer_reputation,
        future_area_impact=analysis.future_area_impact,
        risk_profile=analysis.risk_profile,
        rental_estimate=analysis.rental_estimate,
    )
    risk_adjustment, offer_adjustment, findings, issue_findings, actions = (
        _post_viewing_adjustments(analysis.listing, answers)
    )
    adjusted_listing = analysis.listing.model_copy(update=_post_viewing_listing_updates(answers))
    adjusted_scores = _post_viewing_scores(
        analysis.scores,
        adjusted_listing,
        risk_adjustment=risk_adjustment,
        offer_adjustment_pln=offer_adjustment,
        issue_findings=issue_findings,
    )
    due_diligence = _due_diligence(
        listing=adjusted_listing,
        scores=adjusted_scores,
        developer_reputation=analysis.developer_reputation,
        risk_profile=analysis.risk_profile,
    )
    due_diligence = _post_viewing_due_diligence(
        due_diligence,
        answers,
        risk_adjustment=risk_adjustment,
        issue_findings=issue_findings,
    )
    total_acquisition = _total_acquisition_cost(adjusted_listing)
    intent_fit = _intent_fit(
        listing=adjusted_listing,
        scores=adjusted_scores,
        rental_estimate=analysis.rental_estimate,
        total_acquisition=total_acquisition,
    )
    selected_intent = original_decision.selected_intent
    selected_intent_fit = _selected_intent_fit(intent_fit, selected_intent)
    verdict = _verdict(
        listing=adjusted_listing,
        area_statistics=analysis.area_statistics,
        scores=adjusted_scores,
        comparables=analysis.comparables,
        risk_profile=analysis.risk_profile,
        due_diligence=due_diligence,
        future_area_impact=analysis.future_area_impact,
        total_acquisition=total_acquisition,
        selected_intent_fit=selected_intent_fit,
    )
    negotiation = _negotiation_assistant(
        listing=adjusted_listing,
        scores=adjusted_scores,
        verdict=verdict,
        area_statistics=analysis.area_statistics,
        comparables=analysis.comparables,
        negotiation_arguments=[
            *analysis.negotiation_arguments,
            *(
                [f"Post-viewing discount reserve: {_money(offer_adjustment)}."]
                if offer_adjustment
                else []
            ),
        ],
    )
    knowledge = _knowledge_matrix(
        listing=adjusted_listing,
        area_statistics=analysis.area_statistics,
        scores=adjusted_scores,
        comparables=analysis.comparables,
        due_diligence=due_diligence,
        future_area_impact=analysis.future_area_impact,
        rental_estimate=analysis.rental_estimate,
        data_quality_notes=[
            *analysis.data_quality_notes,
            "Post-viewing checklist answers were applied to the buyer verdict.",
        ],
    )
    pre_viewing = _pre_viewing_assistant(
        verdict=verdict,
        due_diligence=due_diligence,
        listing=adjusted_listing,
    )
    updated_decision = BuyerDecisionPackage(
        verdict=verdict,
        negotiation=negotiation,
        due_diligence=due_diligence,
        knowledge=knowledge,
        total_acquisition=total_acquisition,
        selected_intent=selected_intent,
        decision_model_version=BUYER_DECISION_MODEL_VERSION,
        selected_intent_fit=selected_intent_fit,
        intent_fit=intent_fit,
        pre_viewing=pre_viewing,
        post_viewing_checklist=_post_viewing_checklist(adjusted_listing),
        watch_triggers=_watch_triggers(
            listing=adjusted_listing,
            scores=adjusted_scores,
            comparables=analysis.comparables,
            verdict=verdict,
            future_area_impact=analysis.future_area_impact,
            developer_reputation=analysis.developer_reputation,
        ),
        disclaimer=BUYER_DECISION_DISCLAIMER,
    )
    return PostViewingVerdictRecalculation(
        original_decision=original_decision,
        updated_decision=updated_decision,
        checklist_answers=answers,
        risk_adjustment_points=risk_adjustment,
        offer_adjustment_pln=offer_adjustment,
        applied_findings=findings,
        recommended_actions=actions,
        disclaimer=(
            "Post-viewing recalculation is a screening adjustment from buyer-entered "
            "observations. It is not a technical inspection, valuation or legal opinion."
        ),
    )


def _verdict(
    *,
    listing: Listing,
    area_statistics: AreaStatistics,
    scores: PropertyScores,
    comparables: list[Listing],
    risk_profile: ListingRiskProfile | None,
    due_diligence: PropertyDueDiligence,
    future_area_impact: ListingFutureImpact | None,
    total_acquisition: TotalAcquisitionCost,
    selected_intent_fit: BuyerIntentFit,
) -> BuyerDecisionVerdict:
    max_offer = _max_reasonable_offer(listing, scores)
    opening_offer = _opening_offer(listing, scores, max_offer)
    realistic_low = min(max(opening_offer + 5_000, scores.fair_price_low), max_offer)
    realistic_high = max(realistic_low, max_offer)
    status = _verdict_status(scores, due_diligence, selected_intent_fit)
    top_reasons = _top_reasons(
        listing=listing,
        area_statistics=area_statistics,
        scores=scores,
        comparables=comparables,
        future_area_impact=future_area_impact,
        total_acquisition=total_acquisition,
        selected_intent_fit=selected_intent_fit,
    )
    top_risks = _top_risks(
        listing=listing,
        scores=scores,
        risk_profile=risk_profile,
        due_diligence=due_diligence,
        selected_intent_fit=selected_intent_fit,
    )
    score = _buyer_score(scores, due_diligence, total_acquisition, selected_intent_fit)
    overpricing = max(listing.price - scores.fair_price_mid, 0)
    return BuyerDecisionVerdict(
        status=status,
        score=score,
        headline=_headline(status, scores),
        summary=_summary(status, listing, scores, max_offer, due_diligence),
        seller_price_pln=listing.price,
        fair_price_low_pln=scores.fair_price_low,
        fair_price_mid_pln=scores.fair_price_mid,
        fair_price_high_pln=scores.fair_price_high,
        opening_offer_pln=opening_offer,
        recommended_offer_pln=realistic_low,
        realistic_deal_low_pln=realistic_low,
        realistic_deal_high_pln=realistic_high,
        max_reasonable_offer_pln=max_offer,
        price_delta_to_fair_mid_pct=scores.price_delta_to_fair_mid_pct,
        overpricing_pln=overpricing,
        top_reasons=top_reasons[:6],
        top_risks=top_risks[:6],
        critical_unknowns=due_diligence.unknowns[:6],
    )


def _verdict_status(
    scores: PropertyScores,
    due_diligence: PropertyDueDiligence,
    selected_intent_fit: BuyerIntentFit,
) -> str:
    if scores.risk_score >= 75 or (
        scores.price_delta_to_fair_mid_pct >= 15 and due_diligence.score < 50
    ):
        return "avoid"
    if scores.risk_score >= 62 or due_diligence.score < 55:
        return "verify_first"
    if selected_intent_fit.intent != "unsure" and selected_intent_fit.score < 40:
        return "verify_first"
    if scores.price_delta_to_fair_mid_pct >= 5 or scores.negotiation_score >= 60:
        return "negotiate"
    return "buy"


def _buyer_score(
    scores: PropertyScores,
    due_diligence: PropertyDueDiligence,
    total_acquisition: TotalAcquisitionCost,
    selected_intent_fit: BuyerIntentFit,
) -> float:
    total_cost_penalty = 0
    if total_acquisition.post_renovation_value_gap_pln:
        total_cost_penalty = min(total_acquisition.post_renovation_value_gap_pln / 10_000, 8)
    value = (
        scores.investment_score * 0.32
        + (100 - scores.risk_score) * 0.24
        + scores.liquidity_score * 0.13
        + scores.negotiation_score * 0.09
        + scores.fair_price_confidence_score * 0.08
        + due_diligence.score * 0.14
        - max(scores.price_delta_to_fair_mid_pct, 0) * 0.45
        - total_cost_penalty
    )
    base_score = max(0, min(value, 100)) / 10
    for_you_score = selected_intent_fit.score / 10
    return round(base_score * 0.75 + for_you_score * 0.25, 1)


def _headline(status: str, scores: PropertyScores) -> str:
    if status == "avoid":
        return "Avoid unless the facts change materially"
    if status == "verify_first":
        return "Verify first before making an offer"
    if status == "negotiate":
        if scores.price_delta_to_fair_mid_pct > 5:
            return "Good option, but not at the current price"
        return "Worth considering with a negotiated price"
    return "Worth considering at the current price"


def _summary(
    status: str,
    listing: Listing,
    scores: PropertyScores,
    max_offer: int,
    due_diligence: PropertyDueDiligence,
) -> str:
    if status == "avoid":
        return (
            f"Asking price is {_money(listing.price)} and risk/due-diligence signals are too "
            f"weak for a normal offer. Reconsider only with a large discount and clean evidence."
        )
    if status == "verify_first":
        return (
            f"Do not pay zadatek yet. Asking price is {_money(listing.price)}; first close "
            f"{len(due_diligence.unknowns)} key unknowns and keep the ceiling near "
            f"{_money(max_offer)}."
        )
    if status == "negotiate":
        return (
            f"Asking price is {_money(listing.price)}, fair range is "
            f"{_money(scores.fair_price_low)}-{_money(scores.fair_price_high)}. "
            f"Negotiate before exceeding {_money(max_offer)}."
        )
    return (
        "Asking price sits close to the current fair range. Still confirm documents, "
        "building condition and total move-in cost before committing."
    )


def _max_reasonable_offer(listing: Listing, scores: PropertyScores) -> int:
    if scores.risk_score >= 70:
        return _round_price(min(scores.fair_price_low, listing.price * 0.92))
    if scores.price_delta_to_fair_mid_pct >= 12:
        return _round_price(min(scores.fair_price_mid, listing.price * 0.94))
    if scores.price_delta_to_fair_mid_pct >= 5:
        return _round_price(min(scores.fair_price_high, listing.price * 0.97))
    if scores.price_delta_to_fair_mid_pct <= -6 and scores.risk_score <= 50:
        return _round_price(min(listing.price, scores.fair_price_high))
    return _round_price(min(listing.price, scores.fair_price_high))


def _opening_offer(listing: Listing, scores: PropertyScores, max_offer: int) -> int:
    discount_pct = 0.03
    if scores.price_delta_to_fair_mid_pct >= 12:
        discount_pct = 0.09
    elif scores.price_delta_to_fair_mid_pct >= 5:
        discount_pct = 0.07
    elif listing.price_reductions > 0 or scores.negotiation_score >= 60:
        discount_pct = 0.05
    return _round_price(min(listing.price * (1 - discount_pct), max_offer * 0.98))


def _negotiation_assistant(
    *,
    listing: Listing,
    scores: PropertyScores,
    verdict: BuyerDecisionVerdict,
    area_statistics: AreaStatistics,
    comparables: list[Listing],
    negotiation_arguments: list[str],
) -> BuyerNegotiationAssistant:
    arguments = list(negotiation_arguments)
    if comparables:
        comparable_mid = round(
            sum(item.price for item in comparables[:5]) / min(len(comparables), 5)
        )
        arguments.append(f"Closest comparable sample averages around {_money(comparable_mid)}.")
    arguments.append(
        f"Area supply changed {area_statistics.supply_change_90d_pct:+.1f}% over 90 days."
    )
    if scores.price_delta_to_fair_mid_pct > 0:
        arguments.append(
            f"Asking price is {scores.price_delta_to_fair_mid_pct:+.1f}% above fair mid."
        )
    if listing.relisted:
        arguments.append(
            "Listing was relisted; verify original exposure and earlier price anchors."
        )
    return BuyerNegotiationAssistant(
        asking_price_pln=listing.price,
        opening_offer_pln=verdict.opening_offer_pln,
        realistic_deal_low_pln=verdict.realistic_deal_low_pln,
        realistic_deal_high_pln=verdict.realistic_deal_high_pln,
        max_reasonable_offer_pln=verdict.max_reasonable_offer_pln,
        negotiation_score=scores.negotiation_score,
        posture=_negotiation_posture(scores),
        arguments=_deduplicate(arguments)[:8],
        argument_evidence=[
            _negotiation_argument_evidence(argument, listing, scores, area_statistics, comparables)
            for argument in _deduplicate(arguments)[:8]
        ],
        seller_script=_seller_script(listing, scores, verdict),
        guardrails=[
            "Scenario only: do not exceed the ceiling before document and building checks are complete.",
            "Scenario only: use the fair range as negotiation support, not as a guaranteed valuation.",
            "Next step: if the seller rejects the range, compare with alternatives before raising the offer.",
        ],
    )


def _negotiation_argument_evidence(
    argument: str,
    listing: Listing,
    scores: PropertyScores,
    area_statistics: AreaStatistics,
    comparables: list[Listing],
) -> BuyerNegotiationEvidence:
    lowered = argument.lower()
    if "comparable" in lowered:
        return BuyerNegotiationEvidence(
            argument=argument,
            topic="comparables",
            source_name=f"Comparable listing sample ({min(len(comparables), 5)} listings)",
            source_type="derived_comparable_sample",
            confidence_score=scores.fair_price_confidence_score,
            note="Use as a range signal, not as a guaranteed transaction price.",
        )
    if "supply" in lowered:
        return BuyerNegotiationEvidence(
            argument=argument,
            topic="area_supply",
            source_name="Area market snapshot",
            source_type="area_market_snapshot",
            confidence_score=70,
            note="Area-level context; it does not prove this seller will accept a discount.",
        )
    if "relisted" in lowered:
        return BuyerNegotiationEvidence(
            argument=argument,
            topic="listing_history",
            source_name="Listing history",
            source_type="listing_snapshot",
            confidence_score=100,
            note="Verify the original exposure and price anchors before using it.",
        )
    if "fair" in lowered:
        return BuyerNegotiationEvidence(
            argument=argument,
            topic="fair_price",
            source_name="WartoMetr fair-price estimate",
            source_type="derived_estimate",
            confidence_score=scores.fair_price_confidence_score,
            note="Model estimate based on available market evidence.",
        )
    return BuyerNegotiationEvidence(
        argument=argument,
        topic="listing_facts",
        source_name="Listing and scoring record",
        source_type="listing_snapshot",
        confidence_score=listing.data_quality_score,
        note="Confirm the underlying fact during viewing or due diligence.",
    )


def _negotiation_posture(scores: PropertyScores) -> str:
    if scores.negotiation_score >= 75:
        return "strong buyer leverage"
    if scores.negotiation_score >= 55:
        return "reasonable room to negotiate"
    if scores.price_delta_to_fair_mid_pct >= 8:
        return "price-based negotiation despite weaker leverage"
    return "limited leverage; negotiate mostly through evidence and checks"


def _seller_script(
    listing: Listing,
    scores: PropertyScores,
    verdict: BuyerDecisionVerdict,
) -> list[str]:
    return [
        (
            f"Open at {_money(verdict.opening_offer_pln)} and explain that the offer is based "
            f"on the fair range, days on market and required due diligence."
        ),
        (
            f"Anchor the discussion around {_money(verdict.realistic_deal_low_pln)}-"
            f"{_money(verdict.realistic_deal_high_pln)}, not around the listing price alone."
        ),
        (
            f"Ask what changed after {listing.days_on_market} days on market and "
            f"{listing.price_reductions} price reduction(s)."
        ),
        (
            f"Keep {_money(verdict.max_reasonable_offer_pln)} as the walk-away price unless "
            "new evidence improves the legal, technical or comparable picture."
        ),
        (
            f"Use confidence {scores.fair_price_confidence_score}/100 to keep the tone factual "
            "and leave room for updated documents."
        ),
    ]


def _due_diligence(
    *,
    listing: Listing,
    scores: PropertyScores,
    developer_reputation: DeveloperReputation | None,
    risk_profile: ListingRiskProfile | None,
) -> PropertyDueDiligence:
    checklist = (
        _primary_market_checklist(developer_reputation)
        if listing.market_type == "primary"
        else _secondary_market_checklist(listing)
    )
    red_flags = _due_diligence_red_flags(
        listing=listing,
        scores=scores,
        developer_reputation=developer_reputation,
        risk_profile=risk_profile,
    )
    unknowns = _due_diligence_unknowns(listing, developer_reputation)
    score = _due_diligence_score(
        listing=listing,
        scores=scores,
        developer_reputation=developer_reputation,
        unknown_count=len(unknowns),
        red_flag_count=len(red_flags),
    )
    return PropertyDueDiligence(
        market_type=listing.market_type,
        score=score,
        label=_due_diligence_label(score),
        red_flags=red_flags[:8],
        unknowns=unknowns[:10],
        documents_to_request=_documents_to_request(listing),
        questions_for_seller=_questions_for_seller(listing),
        checklist=checklist,
        disclaimer=(
            "This is a structured due-diligence checklist and red-flag screen, not a legal "
            "opinion and not confirmation of clean title or technical condition."
        ),
    )


def _secondary_market_checklist(listing: Listing) -> list[DueDiligenceChecklistItem]:
    return [
        _dd("kw_owner", "legal", "Księga Wieczysta: owner and seller authority", "critical"),
        _dd("kw_mortgage", "legal", "Mortgage, claims, roszczenia and służebność", "critical"),
        _dd("land_status", "legal", "Land status and użytkowanie wieczyste", "high"),
        _dd("community_debt", "financial", "Wspólnota/spółdzielnia debt certificate", "critical"),
        _dd("fees", "financial", "Czynsz, media and fundusz remontowy", "high"),
        _dd(
            "planned_repairs",
            "building",
            "Planned roof, facade, lift or installation repairs",
            "high",
        ),
        _dd("installations", "technical", "Pipes, electricity, heating and ventilation", "high"),
        _dd(
            "energy_certificate",
            "technical",
            "Energy certificate and recurring utility risk",
            "medium",
        ),
        _dd("area_match", "documents", "Actual area matches documents and listing", "high"),
        _dd(
            "unauthorized_works",
            "documents",
            "Possible samowole budowlane or layout changes",
            "high",
        ),
        _dd(
            "floor_context",
            "technical",
            f"Floor/building context: {_floor_label(listing)}",
            "medium",
            status="estimated",
        ),
    ]


def _primary_market_checklist(
    developer_reputation: DeveloperReputation | None,
) -> list[DueDiligenceChecklistItem]:
    developer_status = "known" if developer_reputation is not None else "unknown"
    return [
        _dd(
            "developer_identity",
            "developer",
            "Developer, SPV/project company and registry identity",
            "critical",
            status=developer_status,
        ),
        _dd("track_record", "developer", "Project history, delays and handover quality", "high"),
        _dd("regulatory_signals", "developer", "Court, regulatory and dispute signals", "high"),
        _dd("escrow", "legal", "Rachunek powierniczy and payment schedule", "critical"),
        _dd("permits", "legal", "Building permit, land title and project status", "critical"),
        _dd("construction_status", "delivery", "Construction stage and handover deadline", "high"),
        _dd("finish_standard", "technical", "Finish standard and exact included scope", "high"),
        _dd("prospekt", "documents", "Prospekt informacyjny and annexes", "critical"),
        _dd("delay_penalties", "contract", "Delay penalties and buyer withdrawal rights", "high"),
        _dd("warranties", "contract", "Warranty obligations and defect procedure", "high"),
    ]


def _dd(
    code: str,
    category: str,
    label: str,
    priority: str,
    *,
    status: str = "verify_required",
    rationale: str | None = None,
) -> DueDiligenceChecklistItem:
    return DueDiligenceChecklistItem(
        code=code,
        category=category,
        label=label,
        priority=priority,
        status=status,
        rationale=rationale or "Must be confirmed from documents or direct inspection.",
    )


def _due_diligence_red_flags(
    *,
    listing: Listing,
    scores: PropertyScores,
    developer_reputation: DeveloperReputation | None,
    risk_profile: ListingRiskProfile | None,
) -> list[str]:
    flags: list[str] = []
    if risk_profile is not None:
        flags.extend(
            factor.summary
            for factor in risk_profile.factors
            if factor.severity in {"high", "medium"}
        )
    flags.extend(scores.warnings)
    if listing.building_year and listing.building_year < 1990:
        flags.append("Older building: verify roof, facade, pipes, electricity and heating.")
    if listing.floor == 0:
        flags.append("Ground floor: verify privacy, moisture, noise and security.")
    if listing.nearest_major_road_m is not None and listing.nearest_major_road_m < 250:
        flags.append("Major road is close enough to require a real noise check inside the flat.")
    if developer_reputation is not None:
        flags.extend(developer_reputation.risk_signals[:3])
    return _deduplicate(flags)


def _due_diligence_unknowns(
    listing: Listing,
    developer_reputation: DeveloperReputation | None,
) -> list[str]:
    if listing.market_type == "primary":
        unknowns = [
            "exact developer SPV and land title",
            "rachunek powierniczy details",
            "building permit and construction schedule",
            "prospekt informacyjny and finish standard",
            "delay penalties and warranty process",
            "handover date realism",
        ]
        if developer_reputation is None:
            unknowns.insert(0, "developer reputation could not be matched")
        return unknowns

    return [
        "Księga Wieczysta owner, mortgage, claims and easements",
        "wspólnota/spółdzielnia debt and fundusz remontowy",
        "planned building repairs and reserve fund pressure",
        "condition of pipes, electricity, heating and ventilation",
        "noise inside the apartment at viewing time",
        "actual usable area versus documents",
        "unauthorized layout or construction changes",
        "energy certificate and real utility costs",
    ]


def _due_diligence_score(
    *,
    listing: Listing,
    scores: PropertyScores,
    developer_reputation: DeveloperReputation | None,
    unknown_count: int,
    red_flag_count: int,
) -> int:
    value = 66 + listing.data_quality_score * 0.16 - scores.risk_score * 0.35
    value -= min(unknown_count, 10) * 2.0
    value -= min(red_flag_count, 8) * 2.5
    if listing.market_type == "primary":
        if developer_reputation is None:
            value -= 12
        else:
            value += (developer_reputation.confidence_score - 60) * 0.12
            value += (developer_reputation.reputation_score - 60) * 0.10
    if listing.building_year and listing.building_year < 1990:
        value -= 6
    if listing.renovation_state in {"needs_renovation", "for_renovation"}:
        value -= 6
    return round(max(0, min(value, 100)))


def _due_diligence_label(score: int) -> str:
    if score >= 75:
        return "standard diligence"
    if score >= 60:
        return "verify important unknowns"
    if score >= 45:
        return "deep diligence before offer"
    return "high scrutiny before any deposit"


def _documents_to_request(listing: Listing) -> list[str]:
    if listing.market_type == "primary":
        return [
            "prospekt informacyjny with annexes",
            "KRS/NIP/REGON for developer and project company",
            "building permit and land/title documents",
            "rachunek powierniczy agreement details",
            "draft umowa deweloperska/rezerwacyjna",
            "finish standard and handover protocol template",
        ]
    return [
        "aktualny odpis Księgi Wieczystej",
        "owner/seller authorization documents",
        "certificate of no debt to wspólnota/spółdzielnia",
        "current czynsz and media breakdown",
        "fundusz remontowy and planned repairs/resolutions",
        "energy certificate",
        "floor plan and usable-area documents",
    ]


def _questions_for_seller(listing: Listing) -> list[str]:
    questions = [
        "Why is the property being sold and what transaction timeline is expected?",
        "What exactly stays in the price: furniture, appliances, parking, storage?",
        "What monthly costs should be expected after purchase?",
        "Were there any defects, leaks, moisture, noise complaints or disputes?",
    ]
    if listing.market_type == "primary":
        questions.extend(
            [
                "Which legal entity signs the contract and holds the land title?",
                "What happens if handover is delayed?",
                "Which finish items are included and which are paid extras?",
            ]
        )
    else:
        questions.extend(
            [
                "Are there mortgages, claims, easements or pending legal issues?",
                "Are there wspólnota/spółdzielnia debts or planned major repairs?",
                "Were any walls moved or installations changed without formal approval?",
            ]
        )
    if listing.days_on_market >= 90:
        questions.append("The listing has been on market for a long time: why did buyers pass?")
    if listing.price_reductions:
        questions.append("The price has already been reduced: what final price is realistic?")
    return questions


def _knowledge_matrix(
    *,
    listing: Listing,
    area_statistics: AreaStatistics,
    scores: PropertyScores,
    comparables: list[Listing],
    due_diligence: PropertyDueDiligence,
    future_area_impact: ListingFutureImpact | None,
    rental_estimate: ListingRentalEstimate | None,
    data_quality_notes: list[str],
) -> BuyerKnowledgeMatrix:
    known = [
        f"Asking price {_money(listing.price)} and {_money(listing.price_per_m2)}/m2.",
        (
            f"Declared area {listing.area_m2:.1f} m2, rooms {listing.rooms}, "
            f"floor {_floor_label(listing)}."
        ),
        (
            f"Area baseline: {area_statistics.name}, median "
            f"{_money(area_statistics.median_price_per_m2)}/m2."
        ),
        f"Days on market {listing.days_on_market}, price reductions {listing.price_reductions}.",
    ]
    if listing.building_year:
        known.append(f"Declared building year {listing.building_year}.")
    if comparables:
        known.append(f"{len(comparables)} comparable properties in current WartoMetr sample.")

    estimated = [
        f"Fair price range {_money(scores.fair_price_low)}-{_money(scores.fair_price_high)}.",
        f"Liquidity score {scores.liquidity_score}/100 and risk score {scores.risk_score}/100.",
    ]
    if future_area_impact is not None:
        estimated.append(f"Future infrastructure impact {future_area_impact.impact_score}/100.")
    if rental_estimate is not None:
        estimated.append(
            f"Rent range {_money(rental_estimate.monthly_rent_low_pln)}-"
            f"{_money(rental_estimate.monthly_rent_high_pln)}/month."
        )

    completeness = round(
        max(
            0,
            min(
                listing.data_quality_score * 0.36
                + scores.fair_price_confidence_score * 0.34
                + min(len(comparables), 6) * 4
                + (8 if future_area_impact is not None else 0)
                + (5 if rental_estimate is not None else 0),
                100,
            ),
        )
    )
    source_evidence = [
        BuyerSourceEvidence(
            topic="asking price and object parameters",
            basis="listing/user-submitted fields normalized into WartoMetr listing model",
            source_name=listing.source_name,
            source_type="listing_reference",
            updated_at=listing.last_seen_at,
            confidence_score=listing.data_quality_score,
            note="Private source URLs are not exposed in reports.",
        ),
        BuyerSourceEvidence(
            topic="fair price",
            basis=f"{len(comparables)} comparables plus area median for {area_statistics.name}",
            source_name="WartoMetr comparables and area statistics",
            source_type="market_snapshot",
            confidence_score=scores.fair_price_confidence_score,
        ),
        BuyerSourceEvidence(
            topic="market context",
            basis=(
                f"{area_statistics.active_listings} active listings, "
                f"{area_statistics.average_days_on_market} average DOM"
            ),
            source_name="WartoMetr area statistics",
            source_type="area_statistics",
            confidence_score=min(90, 55 + area_statistics.active_listings // 20),
        ),
    ]
    if future_area_impact is not None:
        source_evidence.append(
            BuyerSourceEvidence(
                topic="future infrastructure",
                basis=f"{len(future_area_impact.nearest_investments)} nearest planned investments",
                source_name="WartoMetr planned investments registry",
                source_type="open_data_or_admin_verified",
                confidence_score=_future_confidence(future_area_impact),
                note=future_area_impact.methodology_note,
            )
        )
    if rental_estimate is not None:
        source_evidence.append(
            BuyerSourceEvidence(
                topic="rental estimate",
                basis="rental heuristic from object, location and comparable-density signals",
                source_name="WartoMetr rental estimate",
                source_type="derived_model",
                confidence_score=rental_estimate.confidence_score,
            )
        )
    return BuyerKnowledgeMatrix(
        known=_deduplicate(known),
        estimated=_deduplicate(estimated),
        could_not_verify=_deduplicate(
            [
                *due_diligence.unknowns,
                *(
                    [
                        "Data-quality caveat: " + note
                        for note in data_quality_notes
                        if "requires" in note
                    ]
                ),
            ]
        )[:12],
        check_completeness_score=completeness,
        source_evidence=source_evidence,
    )


def _total_acquisition_cost(listing: Listing) -> TotalAcquisitionCost:
    down_payment = round(listing.price * 0.20)
    renovation, renovation_source = _renovation_estimate(listing)
    furniture = _furniture_estimate(listing)
    mortgage = calculate_mortgage(
        MortgageCalculationRequest(
            property_price_pln=listing.price,
            down_payment_pln=down_payment,
            loan_years=25,
            annual_interest_rate_pct=7.5,
            rate_type="fixed",
            market_type=listing.market_type,
            renovation_budget_pln=renovation,
            bank_commission_pct=0.5,
        )
    )
    costs = mortgage.costs
    notary_and_court = costs.notary_fee_pln + costs.court_fees_pln
    transaction_costs = (
        costs.pcc_tax_pln
        + notary_and_court
        + costs.bank_commission_pln
        + costs.agent_commission_pln
    )
    total_move_in = listing.price + transaction_costs + renovation + furniture
    upfront_cash = costs.down_payment_pln + transaction_costs + renovation + furniture
    ready_to_move = _ready_to_move_alternative(listing, renovation)
    gap = total_move_in - ready_to_move if ready_to_move is not None else None
    return TotalAcquisitionCost(
        purchase_price_pln=listing.price,
        renovation_condition=listing.renovation_state,
        renovation_budget_source=renovation_source,
        pcc_tax_pln=costs.pcc_tax_pln,
        notary_and_court_pln=notary_and_court,
        bank_costs_pln=costs.bank_commission_pln,
        agent_commission_pln=costs.agent_commission_pln,
        renovation_estimate_pln=renovation,
        furniture_estimate_pln=furniture,
        transaction_costs_pln=transaction_costs,
        total_move_in_cost_pln=total_move_in,
        upfront_cash_needed_pln=upfront_cash,
        ready_to_move_alternative_price_pln=ready_to_move,
        post_renovation_value_gap_pln=gap,
        monthly_payment_baseline_pln=mortgage.base_scenario.monthly_total_payment_pln,
        notes=_total_cost_notes(listing, renovation, furniture, gap, renovation_source),
    )


def _renovation_estimate(listing: Listing) -> tuple[int, str]:
    if listing.custom_renovation_budget_pln is not None:
        return _round_price(listing.custom_renovation_budget_pln), "custom_budget"

    state = (listing.renovation_state or "").lower()
    if state in {"move_in_ready", "ready_to_move_in"}:
        per_m2 = 350
        source = "condition_move_in_ready"
    elif state in {"refresh", "needs_refresh"}:
        per_m2 = 1_300
        source = "condition_refresh"
    elif state == "light_renovation":
        per_m2 = 1_900
        source = "condition_light_renovation"
    elif state in {"full_renovation", "needs_renovation", "for_renovation", "general"}:
        per_m2 = 2_900
        source = "condition_full_renovation"
    elif state in {"shell_developer_standard", "developer_standard"}:
        per_m2 = 2_100
        source = "condition_shell_developer_standard"
    elif listing.market_type == "primary":
        per_m2 = 1_800
        source = "market_type_primary_default"
    elif "ready" in state or "high_standard" in state:
        per_m2 = 350
        source = "listing_state_ready"
    else:
        per_m2 = 1_100
        source = "market_state_default"
    return _round_price(listing.area_m2 * per_m2), source


def _furniture_estimate(listing: Listing) -> int:
    state = (listing.renovation_state or "").lower()
    per_m2 = 650
    if "ready" in state:
        per_m2 = 250
    if listing.market_type == "primary":
        per_m2 = 800
    return _round_price(max(12_000, listing.area_m2 * per_m2))


def _ready_to_move_alternative(listing: Listing, renovation: int) -> int | None:
    if renovation <= 25_000:
        return None
    return _round_price(listing.price + renovation * 0.72)


def _total_cost_notes(
    listing: Listing,
    renovation: int,
    furniture: int,
    gap: int | None,
    renovation_source: str,
) -> list[str]:
    if renovation_source == "custom_budget":
        renovation_note = (
            f"Renovation budget uses the buyer-provided custom budget: {_money(renovation)}."
        )
    elif listing.renovation_state:
        renovation_note = (
            "Renovation estimate is based on declared condition "
            f"{listing.renovation_state}: {_money(renovation)}."
        )
    else:
        renovation_note = (
            "Renovation estimate is heuristic from market type and listing state: "
            f"{_money(renovation)}."
        )
    notes = [
        "Baseline assumes 20% down payment, 25 years and 7.5% fixed-rate mortgage.",
        renovation_note,
        f"Furniture/equipment estimate: {_money(furniture)}.",
    ]
    if listing.market_type == "secondary":
        notes.append("Secondary-market baseline includes PCC 2%.")
    else:
        notes.append("Primary-market baseline does not include PCC; verify VAT and developer fees.")
    if gap is not None:
        if gap > 0:
            notes.append(
                f"After renovation this object may cost {_money(gap)} more than "
                "a ready-to-move proxy."
            )
        else:
            notes.append(
                f"After renovation it still keeps about {_money(abs(gap))} versus "
                "a ready-to-move proxy."
            )
    return notes


def _intent_fit(
    *,
    listing: Listing,
    scores: PropertyScores,
    rental_estimate: ListingRentalEstimate | None,
    total_acquisition: TotalAcquisitionCost,
) -> list[BuyerIntentFit]:
    family_score = _clamp(
        45
        + (18 if listing.rooms >= 3 else -8)
        + (12 if listing.nearest_school_m is not None and listing.nearest_school_m <= 900 else -8)
        + (listing.parks_within_1km or 0) * 5
        - (
            10
            if listing.nearest_major_road_m is not None and listing.nearest_major_road_m < 250
            else 0
        )
    )
    self_score = _clamp(
        48
        + (16 if listing.nearest_stop_m is not None and listing.nearest_stop_m <= 600 else -8)
        + (
            10
            if listing.distance_to_center_km is not None and listing.distance_to_center_km <= 8
            else -6
        )
        + (listing.parks_within_1km or 0) * 4
        - (8 if listing.floor == 0 else 0)
    )
    rental_score = _clamp(
        scores.rental_potential_score * 0.72
        + scores.liquidity_score * 0.18
        + (rental_estimate.confidence_score if rental_estimate is not None else 50) * 0.10
        - max(scores.price_delta_to_fair_mid_pct, 0) * 0.5
    )
    investment_score = _clamp(
        scores.investment_score * 0.48
        + scores.liquidity_score * 0.22
        + scores.negotiation_score * 0.14
        + (100 - scores.risk_score) * 0.16
        - max(total_acquisition.post_renovation_value_gap_pln or 0, 0) / 8_000
    )
    return [
        _fit("self", self_score, ["transport", "daily convenience"], ["inside condition"]),
        _fit(
            "family",
            family_score,
            ["rooms", "school", "greenery"],
            ["noise and building checks"],
        ),
        _fit("rental", rental_score, ["rent potential", "liquidity"], ["vacancy and fees"]),
        _fit(
            "investment",
            investment_score,
            ["fair price", "liquidity", "negotiation"],
            ["renovation capex"],
        ),
        _fit(
            "unsure",
            round((self_score + family_score + rental_score + investment_score) / 4),
            [],
            [],
        ),
    ]


def _fit(
    intent: PurchaseIntent,
    score: int,
    reasons: list[str],
    tradeoffs: list[str],
) -> BuyerIntentFit:
    if score >= 75:
        label = "strong fit"
    elif score >= 60:
        label = "good fit"
    elif score >= 45:
        label = "mixed fit"
    else:
        label = "weak fit"
    return BuyerIntentFit(
        intent=intent,
        score=score,
        label=label,
        reasons=reasons,
        tradeoffs=tradeoffs,
    )


def _selected_intent_fit(
    intent_fit: list[BuyerIntentFit],
    selected_intent: PurchaseIntent,
) -> BuyerIntentFit:
    for fit in intent_fit:
        if fit.intent == selected_intent:
            return fit
    for fit in intent_fit:
        if fit.intent == "unsure":
            return fit
    return _fit("unsure", 50, [], [])


def _pre_viewing_assistant(
    *,
    verdict: BuyerDecisionVerdict,
    due_diligence: PropertyDueDiligence,
    listing: Listing,
) -> ViewingAssistant:
    if verdict.status == "avoid":
        recommendation = "skip"
    elif verdict.status == "verify_first":
        recommendation = "verify_first"
    else:
        recommendation = "view"
    return ViewingAssistant(
        recommendation=recommendation,
        positives=verdict.top_reasons[:5],
        risks=verdict.top_risks[:5],
        seller_questions=due_diligence.questions_for_seller[:10],
        photos_to_take=[
            "windows and view from each room",
            "bathroom, kitchen and visible installation points",
            "ceilings, corners and places with possible moisture",
            "staircase, lift, basement/parking and building facade",
            "street exposure, parking situation and nearest noisy edge",
        ],
        documents_to_request=due_diligence.documents_to_request[:8],
        building_checks=_building_checks(listing),
        surroundings_checks=_surroundings_checks(listing),
    )


def _post_viewing_checklist(listing: Listing) -> list[str]:
    checks = [
        "real renovation scope and hidden defects",
        "noise inside with closed and open windows",
        "smell, moisture, ventilation and heating behavior",
        "staircase, roof/facade/lift impression and building maintenance",
        "orientation of windows and daylight",
        "kitchen/bathroom condition versus advertised standard",
        "what is included in price and what must be bought after handover",
    ]
    if listing.floor == 0:
        checks.append("ground-floor privacy, security and moisture")
    if listing.market_type == "primary":
        checks.append("handover standard and developer defect-removal process")
    return checks


def _post_viewing_adjustments(
    listing: Listing,
    answers: PostViewingChecklistAnswers,
) -> tuple[int, int, list[str], list[str], list[str]]:
    risk_adjustment = 0
    offer_adjustment = 0
    findings: list[str] = []
    issue_findings: list[str] = []
    actions: list[str] = []

    for field, label in POST_VIEWING_FIELD_LABELS.items():
        level: PostViewingIssueLevel = getattr(answers, field)
        if level == "unknown":
            continue

        risk_delta, offer_delta = _post_viewing_issue_delta(field, level)
        risk_adjustment += risk_delta
        offer_adjustment += offer_delta
        if level == "good":
            findings.append(f"{label}: checked as good at viewing.")
            continue

        issue_label = "major issue" if level == "major_issue" else "minor issue"
        finding = f"{label}: {issue_label} observed at viewing."
        findings.append(finding)
        issue_findings.append(finding)
        if level == "major_issue":
            actions.append(f"Pause before zadatek until {label} is inspected or fully priced in.")
        else:
            actions.append(f"Keep a negotiation reserve for {label}.")

    if answers.renovation_need != "unknown":
        risk_delta, offer_delta, _, finding = POST_VIEWING_RENOVATION_ADJUSTMENTS[
            answers.renovation_need
        ]
        risk_adjustment += risk_delta
        offer_adjustment += offer_delta
        findings.append(f"renovation need: {finding}")
        if answers.renovation_need in {"light", "full"}:
            issue_findings.append(f"renovation need: {finding}")
            actions.append("Get a written renovation estimate before raising the offer.")

    if answers.notes:
        findings.append(f"viewing note: {answers.notes[:220]}")

    if not findings:
        findings.append("No post-viewing answers supplied; verdict unchanged.")
    if not actions:
        actions.append(
            "Use the checked viewing answers as support, but still verify documents before deposit."
        )
    if issue_findings:
        actions.append(
            "Compare the updated ceiling with seller expectations before making "
            "or increasing an offer."
        )

    capped_offer_adjustment = min(
        _round_price(listing.price * 0.25),
        _round_price(offer_adjustment),
    )
    return (
        max(-20, min(100, risk_adjustment)),
        capped_offer_adjustment,
        _deduplicate(findings),
        _deduplicate(issue_findings),
        _deduplicate(actions),
    )


def _post_viewing_issue_delta(field: str, level: PostViewingIssueLevel) -> tuple[int, int]:
    if level == "good":
        return (-1, 0)

    major_risk, major_offer = POST_VIEWING_MAJOR_ADJUSTMENTS[field]
    if level == "minor_issue":
        return (max(2, round(major_risk * 0.35)), _round_price(major_offer * 0.25))
    return (major_risk, major_offer)


def _post_viewing_listing_updates(answers: PostViewingChecklistAnswers) -> dict[str, object]:
    if answers.renovation_need == "unknown":
        return {}
    _, _, renovation_state, _ = POST_VIEWING_RENOVATION_ADJUSTMENTS[answers.renovation_need]
    return {"renovation_state": renovation_state}


def _post_viewing_scores(
    scores: PropertyScores,
    listing: Listing,
    *,
    risk_adjustment: int,
    offer_adjustment_pln: int,
    issue_findings: list[str],
) -> PropertyScores:
    fair_price_low = max(1_000, _round_price(scores.fair_price_low - offer_adjustment_pln))
    fair_price_mid = max(fair_price_low, _round_price(scores.fair_price_mid - offer_adjustment_pln))
    fair_price_high = max(
        fair_price_mid,
        _round_price(scores.fair_price_high - offer_adjustment_pln),
    )
    score_payload = scores.model_dump()
    score_payload.update(
        {
            "risk_score": _clamp(scores.risk_score + risk_adjustment),
            "negotiation_score": _clamp(
                scores.negotiation_score + min(max(risk_adjustment, 0) * 0.35, 18)
            ),
            "fair_price_low": fair_price_low,
            "fair_price_mid": fair_price_mid,
            "fair_price_high": fair_price_high,
            "price_delta_to_fair_mid_pct": round(
                ((listing.price - fair_price_mid) / fair_price_mid) * 100,
                1,
            ),
            "warnings": _deduplicate([*scores.warnings, *issue_findings]),
            "breakdown": scores.breakdown.model_copy(
                update={
                    "risk_penalty": _clamp(scores.breakdown.risk_penalty + max(risk_adjustment, 0))
                }
            ),
        }
    )
    for label_field in (
        "decision_label",
        "price_label",
        "risk_label",
        "negotiation_label",
        "liquidity_label",
        "rental_potential_label",
    ):
        score_payload.pop(label_field, None)
    return PropertyScores.model_validate(score_payload)


def _post_viewing_due_diligence(
    due_diligence: PropertyDueDiligence,
    answers: PostViewingChecklistAnswers,
    *,
    risk_adjustment: int,
    issue_findings: list[str],
) -> PropertyDueDiligence:
    answered_count = _post_viewing_answered_count(answers)
    unknowns = _remove_answered_post_viewing_unknowns(due_diligence.unknowns, answers)
    if risk_adjustment >= 0:
        score_delta = min(answered_count * 2, 12) - min(risk_adjustment * 0.5, 45)
    else:
        score_delta = min(answered_count * 2 + abs(risk_adjustment), 14)
    score = _clamp(due_diligence.score + score_delta)
    checklist = _post_viewing_checklist_statuses(due_diligence.checklist, answers)
    return due_diligence.model_copy(
        update={
            "score": score,
            "label": _due_diligence_label(score),
            "red_flags": _deduplicate([*due_diligence.red_flags, *issue_findings])[:10],
            "unknowns": unknowns,
            "checklist": checklist,
        }
    )


def _post_viewing_answered_count(answers: PostViewingChecklistAnswers) -> int:
    values = [
        *(getattr(answers, field) for field in POST_VIEWING_FIELD_LABELS),
        answers.renovation_need,
    ]
    return sum(1 for value in values if value != "unknown")


def _remove_answered_post_viewing_unknowns(
    unknowns: list[str],
    answers: PostViewingChecklistAnswers,
) -> list[str]:
    remove_tokens: set[str] = set()
    if answers.noise != "unknown":
        remove_tokens.add("noise inside")
    if any(
        getattr(answers, field) != "unknown"
        for field in ("condition", "windows", "smell", "humidity", "kitchen_bathroom")
    ):
        remove_tokens.add("condition of pipes")
    if answers.renovation_need != "unknown":
        remove_tokens.add("planned building repairs")
    if not remove_tokens:
        return unknowns

    return [
        unknown
        for unknown in unknowns
        if not any(token in unknown.lower() for token in remove_tokens)
    ]


def _post_viewing_checklist_statuses(
    checklist: list[DueDiligenceChecklistItem],
    answers: PostViewingChecklistAnswers,
) -> list[DueDiligenceChecklistItem]:
    technical_answered = any(
        getattr(answers, field) != "unknown"
        for field in ("condition", "windows", "smell", "humidity", "kitchen_bathroom")
    )
    updated: list[DueDiligenceChecklistItem] = []
    for item in checklist:
        if item.code == "installations" and technical_answered:
            status = (
                "verify_required"
                if any(
                    getattr(answers, field) in {"minor_issue", "major_issue"}
                    for field in (
                        "condition",
                        "windows",
                        "smell",
                        "humidity",
                        "kitchen_bathroom",
                    )
                )
                else "known"
            )
            updated.append(
                item.model_copy(
                    update={
                        "status": status,
                        "rationale": "Updated from buyer-entered post-viewing observations.",
                    }
                )
            )
            continue
        updated.append(item)
    return updated


def _building_checks(listing: Listing) -> list[str]:
    checks = [
        "entrance, staircase, basement/garage and mailbox condition",
        "roof/facade/lift repair signs or notices from wspólnota",
        "pipes, electrical board, heating and ventilation inside the flat",
    ]
    if listing.building_year and listing.building_year < 1990:
        checks.append("whether old installations were replaced in the whole building")
    if not listing.has_elevator and listing.floor and listing.floor >= 3:
        checks.append("daily practicality of no elevator")
    return checks


def _surroundings_checks(listing: Listing) -> list[str]:
    checks = [
        f"walk to nearest stop: declared {listing.nearest_stop_m} m",
        (
            f"school/greenery context: {listing.schools_within_1km} schools and "
            f"{listing.parks_within_1km} parks in 1 km"
        ),
        "parking pressure in the evening",
    ]
    if listing.nearest_major_road_m is not None and listing.nearest_major_road_m < 700:
        checks.append(f"traffic noise from major road at {listing.nearest_major_road_m} m")
    if listing.nearest_industrial_zone_m is not None and listing.nearest_industrial_zone_m < 1500:
        checks.append(f"industrial-zone impact at {listing.nearest_industrial_zone_m} m")
    if listing.planned_investments_within_2km:
        checks.append("construction disruption and future infrastructure around the building")
    return checks


def _watch_triggers(
    *,
    listing: Listing,
    scores: PropertyScores,
    comparables: list[Listing],
    verdict: BuyerDecisionVerdict,
    future_area_impact: ListingFutureImpact | None,
    developer_reputation: DeveloperReputation | None,
) -> list[str]:
    triggers = [
        f"price drops below max reasonable offer {_money(verdict.max_reasonable_offer_pln)}",
        "new comparable appears below the recommended deal range",
        "listing crosses 120/150 days on market",
    ]
    cheaper = [item for item in comparables if item.price < verdict.max_reasonable_offer_pln]
    if cheaper:
        triggers.append(f"{len(cheaper)} comparable(s) already sit below the ceiling.")
    if scores.price_delta_to_fair_mid_pct > 5:
        triggers.append("asking price moves into fair range")
    if future_area_impact is not None and future_area_impact.nearest_investments:
        triggers.append("nearby planned-investment status or expected year changes")
    if developer_reputation is not None:
        triggers.append("new developer quality or dispute signal appears")
    return _deduplicate(triggers)


def _top_reasons(
    *,
    listing: Listing,
    area_statistics: AreaStatistics,
    scores: PropertyScores,
    comparables: list[Listing],
    future_area_impact: ListingFutureImpact | None,
    total_acquisition: TotalAcquisitionCost,
    selected_intent_fit: BuyerIntentFit,
) -> list[str]:
    reasons: list[str] = []
    if selected_intent_fit.score >= 55:
        reasons.append(_intent_reason(selected_intent_fit))
    if scores.price_delta_to_fair_mid_pct <= 3:
        reasons.append("Asking price is close to or below the fair-price midpoint.")
    if listing.price_reductions:
        reasons.append(f"Price has already been reduced {listing.price_reductions} time(s).")
    if listing.nearest_stop_m is not None and listing.nearest_stop_m <= 500:
        reasons.append(
            f"Good public-transport proximity: nearest stop about {listing.nearest_stop_m} m."
        )
    if listing.parks_within_1km or listing.schools_within_1km:
        reasons.append(
            f"Everyday infrastructure nearby: {listing.schools_within_1km} schools and "
            f"{listing.parks_within_1km} parks within 1 km."
        )
    if future_area_impact is not None and future_area_impact.impact_score >= 25:
        reasons.append(f"Future-area signal: {future_area_impact.summary}")
    if comparables:
        reasons.append(f"Comparable base is available: {len(comparables)} similar objects.")
    if area_statistics.supply_change_90d_pct > 5:
        reasons.append(
            f"Area supply rose {area_statistics.supply_change_90d_pct:+.1f}% in 90 days, "
            "supporting negotiation."
        )
    if (
        total_acquisition.post_renovation_value_gap_pln is not None
        and total_acquisition.post_renovation_value_gap_pln <= 0
    ):
        reasons.append("Renovation-adjusted total cost still looks below a ready-to-move proxy.")
    reasons.extend(scores.reasons)
    return _deduplicate(reasons)


def _top_risks(
    *,
    listing: Listing,
    scores: PropertyScores,
    risk_profile: ListingRiskProfile | None,
    due_diligence: PropertyDueDiligence,
    selected_intent_fit: BuyerIntentFit,
) -> list[str]:
    risks: list[str] = []
    if selected_intent_fit.score < 55:
        risks.append(_intent_risk(selected_intent_fit))
    if scores.price_delta_to_fair_mid_pct >= 5:
        risks.append(
            f"Asking price is {scores.price_delta_to_fair_mid_pct:+.1f}% above fair-price midpoint."
        )
    if listing.days_on_market > 120:
        risks.append(f"Long exposure: {listing.days_on_market} days on market.")
    if risk_profile is not None:
        risks.extend(
            factor.summary
            for factor in risk_profile.factors
            if factor.severity in {"high", "medium"}
        )
    risks.extend(scores.warnings)
    risks.extend(due_diligence.red_flags)
    return _deduplicate(risks)


def _intent_reason(fit: BuyerIntentFit) -> str:
    reasons = ", ".join(fit.reasons) if fit.reasons else "balanced profile"
    return (
        f"Selected buyer goal ({_intent_label(fit.intent)}) is a {fit.label} "
        f"at {round(fit.score / 10)}/10 because of {reasons}."
    )


def _intent_risk(fit: BuyerIntentFit) -> str:
    tradeoffs = ", ".join(fit.tradeoffs) if fit.tradeoffs else "mixed buyer goals"
    return (
        f"Selected buyer goal ({_intent_label(fit.intent)}) is only a {fit.label} "
        f"at {round(fit.score / 10)}/10; verify {tradeoffs} before relying on the verdict."
    )


def _intent_label(intent: PurchaseIntent) -> str:
    return {
        "self": "own living",
        "family": "family",
        "rental": "rental",
        "investment": "investment",
        "unsure": "unsure",
    }[intent]


def _future_confidence(future_area_impact: ListingFutureImpact) -> int:
    if not future_area_impact.nearest_investments:
        return 35
    return round(
        sum(item.investment.confidence_score for item in future_area_impact.nearest_investments)
        / len(future_area_impact.nearest_investments)
    )


def _round_price(value: int | float) -> int:
    return int(round(float(value) / 1000) * 1000)


def _clamp(value: int | float) -> int:
    return round(max(0, min(float(value), 100)))


def _floor_label(listing: Listing) -> str:
    if listing.floor is None and listing.building_floors is None:
        return "unknown"
    if listing.floor is None:
        return f"?/{listing.building_floors}"
    if listing.building_floors is None:
        return str(listing.floor)
    return f"{listing.floor}/{listing.building_floors}"


def _money(value: int | float) -> str:
    return f"{value:,.0f} PLN".replace(",", " ")


def _deduplicate(items: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result
