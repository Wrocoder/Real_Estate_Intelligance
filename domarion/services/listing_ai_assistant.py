from __future__ import annotations

import hashlib
import json

from domarion.ai_insight_store.base import AIInsightStore
from domarion.schemas import (
    AIAnswerCitation,
    AIAnswerGuardrail,
    AIAnswerSubjectType,
    AIAssistantDataContract,
    AIInsight,
    AIInsightCreate,
    AIListingAnswer,
    AIListingAnswerRequest,
    AIQuestionDescriptor,
    ListingAnalysis,
    MortgageCalculationRequest,
)
from domarion.services.mortgage import calculate_mortgage

LISTING_ASSISTANT_PROMPT_VERSION = "listing-assistant-grounded-v1"
LISTING_ASSISTANT_PROVIDER = "domarion_rule_based"
LISTING_ASSISTANT_MODEL = "domarion-deterministic-v1"
LISTING_ASSISTANT_DISCLAIMER = (
    "This answer is source-grounded screening guidance, not legal, tax, financial "
    "or investment advice. Verify documents and professionals before a transaction."
)

DATA_CONTRACT = AIAssistantDataContract(
    prompt_version=LISTING_ASSISTANT_PROMPT_VERSION,
    allowed_subjects=["listing", "user_submitted_draft"],
    allowed_inputs=[
        "listing basics: price, area, rooms, floor, building year, address area",
        "area statistics and market trend metrics",
        "price history and listing event timeline",
        "comparable listing summaries without contacts/photos",
        "scoring outputs, risk profile, growth analysis and future-impact analysis",
        "rental estimate, mortgage estimate and buyer checklist outputs",
        "developer reputation summary with source citations when matched",
    ],
    prohibited_inputs=[
        "private source URL disclosure",
        "portal photos, contact details, full copied descriptions or raw HTML",
        "personal data about sellers, tenants, owners or agents",
        "legal guarantees, tax advice, credit approval promises or price guarantees",
    ],
    citation_policy=(
        "Every answer must include at least one citation to a structured Domarion "
        "source object used to produce the response."
    ),
    privacy_policy=(
        "For user-submitted drafts, source URL is treated as private evidence and must "
        "not be shown in answers or citations."
    ),
    refusal_policy=(
        "Refuse requests for legal certainty, guaranteed profit, guaranteed future prices, "
        "credit approval, tax optimization or advice based on unavailable private data."
    ),
    disclaimer=LISTING_ASSISTANT_DISCLAIMER,
)

QUESTION_SET = [
    AIQuestionDescriptor(
        code="summary",
        label="Object summary",
        description="Short grounded decision summary for the selected audience.",
        supported_audiences=["buyer", "realtor", "investor"],
    ),
    AIQuestionDescriptor(
        code="price",
        label="Price fairness",
        description="Explains asking price, fair range and confidence.",
        supported_audiences=["buyer", "realtor", "investor"],
    ),
    AIQuestionDescriptor(
        code="negotiation",
        label="Negotiation",
        description="Explains negotiation leverage and opening arguments.",
        supported_audiences=["buyer", "realtor", "investor"],
    ),
    AIQuestionDescriptor(
        code="risks",
        label="Risks",
        description="Summarizes major risk factors and required checks.",
        supported_audiences=["buyer", "realtor", "investor"],
    ),
    AIQuestionDescriptor(
        code="future_plans",
        label="Future plans",
        description="Explains planned investments and growth/drift checks nearby.",
        supported_audiences=["buyer", "realtor", "investor"],
    ),
    AIQuestionDescriptor(
        code="family_fit",
        label="Family fit",
        description="Checks schools, parks, transport and comfort signals.",
        supported_audiences=["buyer", "realtor"],
    ),
    AIQuestionDescriptor(
        code="rental_fit",
        label="Rental fit",
        description="Explains rental potential, rent range and yield caveats.",
        supported_audiences=["buyer", "investor"],
    ),
    AIQuestionDescriptor(
        code="seller_questions",
        label="Seller questions",
        description="Produces questions to ask seller/agent before reservation.",
        supported_audiences=["buyer", "realtor"],
    ),
    AIQuestionDescriptor(
        code="documents",
        label="Documents",
        description="Lists transaction documents and checks to request.",
        supported_audiences=["buyer", "realtor"],
    ),
    AIQuestionDescriptor(
        code="financing",
        label="Financing",
        description="Explains indicative mortgage affordability inputs and cash needed.",
        supported_audiences=["buyer", "investor"],
    ),
]

REFUSAL_TOKENS = (
    "guarantee",
    "guaranteed",
    "legal opinion",
    "tax advice",
    "credit approval",
    "will definitely",
    "profit guaranteed",
    "гарант",
    "юридическое заключение",
    "налоговая консультация",
    "точно вырастет",
    "точно одобрят",
)


def list_ai_question_descriptors() -> list[AIQuestionDescriptor]:
    return QUESTION_SET


def get_ai_data_contract() -> AIAssistantDataContract:
    return DATA_CONTRACT


def build_listing_ai_answer(
    analysis: ListingAnalysis,
    payload: AIListingAnswerRequest,
    *,
    subject_type: AIAnswerSubjectType = "listing",
    subject_id: str | None = None,
) -> AIListingAnswer:
    subject_id = subject_id or analysis.listing.id
    normalized_question = _clean_question(payload.question)
    base_guardrails = [
        AIAnswerGuardrail(
            code="source_grounded_only",
            message="Answer uses only structured Domarion analysis fields and citations.",
        ),
        AIAnswerGuardrail(
            code="no_professional_advice",
            message="No legal, tax, financial or investment guarantee is provided.",
        ),
    ]

    if _should_refuse(normalized_question):
        citations = [
            AIAnswerCitation(
                source_id="ai:data-contract",
                source_type="ai_data_contract",
                title="AI assistant data contract",
                excerpt=DATA_CONTRACT.refusal_policy,
            )
        ]
        return _answer(
            analysis=analysis,
            payload=payload,
            subject_type=subject_type,
            subject_id=subject_id,
            question=normalized_question,
            answer=(
                "I cannot answer this as a guarantee or professional opinion. I can "
                "summarize source-grounded risks, checks and price signals instead."
            ),
            key_points=[
                "Use the report as screening, not as legal or financial certainty.",
                "Ask a lawyer, mortgage broker or tax adviser for regulated advice.",
            ],
            citations=citations,
            guardrails=[
                *base_guardrails,
                AIAnswerGuardrail(
                    code="refused_guarantee_or_regulated_advice",
                    message="The question asks for certainty or regulated advice.",
                ),
            ],
            refused=True,
            refusal_reason="Request asks for a guarantee or regulated professional advice.",
        )

    answer_text, key_points, citations = _answer_payload(analysis, payload)
    return _answer(
        analysis=analysis,
        payload=payload,
        subject_type=subject_type,
        subject_id=subject_id,
        question=normalized_question,
        answer=answer_text,
        key_points=key_points,
        citations=citations,
        guardrails=base_guardrails,
    )


def save_listing_ai_answer(
    store: AIInsightStore,
    answer: AIListingAnswer,
    *,
    owner_id: str,
) -> AIInsight:
    content = "\n".join(
        [
            answer.answer,
            "",
            "Key points:",
            *[f"- {item}" for item in answer.key_points],
            "",
            "Citations:",
            *[f"- {citation.title}: {citation.excerpt}" for citation in answer.citations],
            "",
            answer.disclaimer,
        ]
    )
    return store.save_insight(
        AIInsightCreate(
            owner_id=owner_id,
            subject_type=answer.subject_type,
            subject_id=answer.subject_id,
            insight_type="assistant_answer",
            provider=answer.provider,
            model_name=answer.model_name,
            prompt_version=answer.prompt_version,
            title=f"Assistant answer: {answer.question_code}",
            summary=answer.answer,
            content=content,
            input_hash=answer.input_hash,
            metadata={
                "listing_id": answer.listing_id,
                "audience": answer.audience,
                "question_code": answer.question_code,
                "refused": answer.refused,
                "citation_source_ids": [
                    citation.source_id for citation in answer.citations
                ],
            },
        )
    )


def _answer_payload(
    analysis: ListingAnalysis,
    payload: AIListingAnswerRequest,
) -> tuple[str, list[str], list[AIAnswerCitation]]:
    match payload.question_code:
        case "price":
            return _price_answer(analysis)
        case "negotiation":
            return _negotiation_answer(analysis)
        case "risks":
            return _risks_answer(analysis)
        case "future_plans":
            return _future_plans_answer(analysis)
        case "family_fit":
            return _family_fit_answer(analysis)
        case "rental_fit":
            return _rental_fit_answer(analysis)
        case "seller_questions":
            return _seller_questions_answer(analysis)
        case "documents":
            return _documents_answer(analysis)
        case "financing":
            return _financing_answer(analysis)
        case _:
            return _summary_answer(analysis, payload)


def _summary_answer(
    analysis: ListingAnalysis,
    payload: AIListingAnswerRequest,
) -> tuple[str, list[str], list[AIAnswerCitation]]:
    scores = analysis.scores
    listing = analysis.listing
    answer = (
        f"For {payload.audience}, this looks like {scores.decision_label}: "
        f"Investment Score {scores.investment_score}/100, Risk Score "
        f"{scores.risk_score}/100 and fair-price confidence "
        f"{scores.fair_price_confidence_score}/100."
    )
    key_points = [
        f"Asking price is {_money(listing.price)} or {_money(listing.price_per_m2)}/m2.",
        f"Fair price range is {_money(scores.fair_price_low)}-"
        f"{_money(scores.fair_price_high)}.",
        f"Main price label: {scores.price_label}; risk label: {scores.risk_label}.",
    ]
    if analysis.risk_profile is not None and analysis.risk_profile.priority_checks:
        key_points.append(f"Top check: {analysis.risk_profile.priority_checks[0]}")
    return answer, key_points, [
        _listing_citation(analysis),
        _score_citation(analysis),
        _risk_citation(analysis),
    ]


def _price_answer(analysis: ListingAnalysis) -> tuple[str, list[str], list[AIAnswerCitation]]:
    scores = analysis.scores
    listing = analysis.listing
    area = analysis.area_statistics
    delta = scores.price_delta_to_fair_mid_pct
    answer = (
        f"Model fair mid is {_money(scores.fair_price_mid)} versus asking price "
        f"{_money(listing.price)}. Delta to fair mid is {delta:+.1f}% with "
        f"{scores.fair_price_confidence_score}/100 confidence."
    )
    key_points = [
        f"Fair range: {_money(scores.fair_price_low)}-{_money(scores.fair_price_high)}.",
        f"Area median: {_money(area.median_price_per_m2)}/m2; object: "
        f"{_money(listing.price_per_m2)}/m2.",
        f"Price label: {scores.price_label}.",
    ]
    if analysis.comparables:
        key_points.append(f"Comparable objects used for context: {len(analysis.comparables)}.")
    return answer, key_points, [_listing_citation(analysis), _score_citation(analysis)]


def _negotiation_answer(
    analysis: ListingAnalysis,
) -> tuple[str, list[str], list[AIAnswerCitation]]:
    scores = analysis.scores
    listing = analysis.listing
    answer = (
        f"Negotiation Score is {scores.negotiation_score}/100 "
        f"({scores.negotiation_label}). Use this as leverage sizing, not as a guaranteed "
        "discount."
    )
    key_points = [
        f"Object has been on market {listing.days_on_market} days.",
        f"Price reductions recorded: {listing.price_reductions}.",
        *analysis.negotiation_arguments[:4],
    ]
    return answer, _dedupe(key_points), [
        _listing_citation(analysis),
        _score_citation(analysis),
        AIAnswerCitation(
            source_id="analysis:negotiation_arguments",
            source_type="listing_analysis",
            title="Negotiation arguments",
            excerpt="; ".join(analysis.negotiation_arguments[:3]),
        ),
    ]


def _risks_answer(analysis: ListingAnalysis) -> tuple[str, list[str], list[AIAnswerCitation]]:
    if analysis.risk_profile is None:
        return (
            "Risk profile is not available for this object.",
            analysis.scores.warnings or ["Verify source data before making an offer."],
            [_score_citation(analysis)],
        )
    profile = analysis.risk_profile
    factors = profile.factors[:4]
    answer = (
        f"Risk profile is {profile.overall_severity}; Risk Score "
        f"{profile.risk_score}/100 ({profile.risk_label})."
    )
    key_points = [
        f"{factor.category}/{factor.code}: {factor.summary}" for factor in factors
    ]
    key_points.extend(profile.priority_checks[:4])
    return answer, _dedupe(key_points), [_risk_citation(analysis), _score_citation(analysis)]


def _future_plans_answer(
    analysis: ListingAnalysis,
) -> tuple[str, list[str], list[AIAnswerCitation]]:
    impact = analysis.future_area_impact
    growth = analysis.growth_analysis
    if impact is None and growth is None:
        return (
            "Future-area analysis is not available for this object.",
            ["Check municipal plans and official map layers manually."],
            [_listing_citation(analysis)],
        )
    answer = (
        f"Future impact: {impact.summary if impact else 'not available'} "
        f"Growth analysis: {growth.summary if growth else 'not available'}"
    )
    key_points: list[str] = []
    if impact is not None:
        key_points.extend(impact.growth_signals[:3])
        key_points.extend(impact.risk_signals[:2])
    if growth is not None:
        key_points.extend(growth.positive_signals[:3])
        key_points.extend(growth.drag_signals[:2])
    return answer, _dedupe(key_points), [
        _future_citation(analysis),
        _growth_citation(analysis),
    ]


def _family_fit_answer(
    analysis: ListingAnalysis,
) -> tuple[str, list[str], list[AIAnswerCitation]]:
    listing = analysis.listing
    score = analysis.scores.liquidity_score
    answer = (
        f"Family fit is a screening fit, not a personal recommendation. The object has "
        f"{listing.rooms} rooms, nearest school {listing.nearest_school_m} m, "
        f"{listing.schools_within_1km} schools and {listing.parks_within_1km} parks within 1 km."
    )
    key_points = [
        f"Liquidity Score: {score}/100.",
        f"Nearest major road: {listing.nearest_major_road_m} m.",
        f"Nearest industrial zone: {listing.nearest_industrial_zone_m} m.",
        "Verify school catchment, commute route, noise and building condition on site.",
    ]
    return answer, key_points, [_listing_citation(analysis), _growth_citation(analysis)]


def _rental_fit_answer(
    analysis: ListingAnalysis,
) -> tuple[str, list[str], list[AIAnswerCitation]]:
    rental = analysis.rental_estimate
    if rental is None:
        return (
            "Rental estimate is not available for this object.",
            [f"Rental Potential Score: {analysis.scores.rental_potential_score}/100."],
            [_score_citation(analysis)],
        )
    answer = (
        f"Estimated rent range is {_money(rental.monthly_rent_low_pln)}-"
        f"{_money(rental.monthly_rent_high_pln)} per month, with midpoint "
        f"{_money(rental.monthly_rent_mid_pln)} and gross yield "
        f"{rental.gross_yield_pct:.1f}%."
    )
    key_points = [
        f"Rental Potential Score: {analysis.scores.rental_potential_score}/100.",
        f"NOI before financing: {_money(rental.net_operating_income_monthly_pln)}/month.",
        f"Rental estimate confidence: {rental.confidence_score}/100.",
        *rental.risk_notes[:3],
    ]
    return answer, _dedupe(key_points), [_rental_citation(analysis), _score_citation(analysis)]


def _seller_questions_answer(
    analysis: ListingAnalysis,
) -> tuple[str, list[str], list[AIAnswerCitation]]:
    listing = analysis.listing
    questions = [
        "Why is the object being sold and what transaction timing does the seller expect?",
        "Are all owners ready to sign, and are there mortgage or title restrictions?",
        "What monthly fees apply: czynsz, renovation fund, media and heating?",
        "What is included in the price: furniture, appliances, parking or storage?",
    ]
    if listing.days_on_market >= analysis.area_statistics.average_days_on_market:
        questions.append("Why has the object stayed on market longer than the area average?")
    if listing.price_reductions:
        questions.append("What caused the previous price reduction and what price is negotiable?")
    if analysis.risk_profile is not None:
        questions.extend(analysis.risk_profile.priority_checks[:3])
    return (
        "Ask seller/agent questions that verify title, costs, condition and negotiation room.",
        _dedupe(questions),
        [_listing_citation(analysis), _risk_citation(analysis)],
    )


def _documents_answer(
    analysis: ListingAnalysis,
) -> tuple[str, list[str], list[AIAnswerCitation]]:
    listing = analysis.listing
    checks = [
        "Księga wieczysta: owner, mortgage, claims, easements and restrictions.",
        "Administrative documents confirming area, floor, address and room layout.",
        "Certificate of no arrears for czynsz/media and community/cooperative fees.",
        "Community/cooperative minutes, renovation fund and planned building repairs.",
        "Technical checks: electricity, plumbing, heating, ventilation, windows and moisture.",
    ]
    if listing.market_type == "primary":
        checks.append("Primary market: prospekt informacyjny, escrow account and handover dates.")
    else:
        checks.append("Secondary market: budget PCC 2%, notary and land-register costs.")
    return (
        "Document checks should confirm ownership, costs, technical state and transaction risk.",
        checks,
        [_listing_citation(analysis), _risk_citation(analysis)],
    )


def _financing_answer(
    analysis: ListingAnalysis,
) -> tuple[str, list[str], list[AIAnswerCitation]]:
    listing = analysis.listing
    calculation = calculate_mortgage(
        MortgageCalculationRequest(
            property_price_pln=listing.price,
            down_payment_pln=round(listing.price * 0.2),
            loan_years=25,
            annual_interest_rate_pct=7.5,
            rate_type="variable",
            market_type=listing.market_type,
        )
    )
    answer = (
        "Indicative financing scenario: 20% down, 25 years, 7.5% variable rate. "
        f"Estimated monthly payment is "
        f"{_money(calculation.base_scenario.monthly_total_payment_pln)}."
    )
    key_points = [
        f"Down payment: {_money(calculation.costs.down_payment_pln)}.",
        f"Loan amount: {_money(calculation.costs.loan_amount_pln)}.",
        f"Upfront cash needed: {_money(calculation.costs.upfront_cash_needed_pln)}.",
        "This is not a credit decision; verify affordability with a mortgage broker/bank.",
    ]
    return answer, key_points, [
        _listing_citation(analysis),
        AIAnswerCitation(
            source_id="mortgage:baseline",
            source_type="mortgage_calculation",
            title="Mortgage baseline",
            excerpt=(
                "20% down, 25 years, 7.5% variable rate, "
                f"monthly payment {_money(calculation.base_scenario.monthly_total_payment_pln)}."
            ),
        ),
    ]


def _answer(
    *,
    analysis: ListingAnalysis,
    payload: AIListingAnswerRequest,
    subject_type: AIAnswerSubjectType,
    subject_id: str,
    question: str | None,
    answer: str,
    key_points: list[str],
    citations: list[AIAnswerCitation],
    guardrails: list[AIAnswerGuardrail],
    refused: bool = False,
    refusal_reason: str | None = None,
) -> AIListingAnswer:
    citations = [citation for citation in citations if citation.excerpt]
    if not citations:
        citations = [_listing_citation(analysis)]
    input_payload = {
        "subject_type": subject_type,
        "subject_id": subject_id,
        "listing_id": analysis.listing.id,
        "audience": payload.audience,
        "question_code": payload.question_code,
        "question": question,
        "prompt_version": LISTING_ASSISTANT_PROMPT_VERSION,
        "scoring_formula_version": analysis.scores.formula_version,
    }
    return AIListingAnswer(
        subject_type=subject_type,
        subject_id=subject_id,
        listing_id=analysis.listing.id,
        audience=payload.audience,
        question_code=payload.question_code,
        question=question,
        answer=answer,
        key_points=_dedupe(key_points),
        citations=citations,
        guardrails=guardrails,
        refused=refused,
        refusal_reason=refusal_reason,
        data_contract=DATA_CONTRACT,
        provider=LISTING_ASSISTANT_PROVIDER,
        model_name=LISTING_ASSISTANT_MODEL,
        prompt_version=LISTING_ASSISTANT_PROMPT_VERSION,
        input_hash=_input_hash(input_payload),
        disclaimer=LISTING_ASSISTANT_DISCLAIMER,
    )


def _listing_citation(analysis: ListingAnalysis) -> AIAnswerCitation:
    listing = analysis.listing
    return AIAnswerCitation(
        source_id=f"listing:{listing.id}",
        source_type="listing",
        title="Listing basics",
        excerpt=(
            f"{listing.address}, {listing.district}, {listing.city}; price "
            f"{_money(listing.price)}, area {listing.area_m2:.1f} m2, "
            f"{listing.rooms} rooms, {listing.price_per_m2} PLN/m2."
        ),
    )


def _score_citation(analysis: ListingAnalysis) -> AIAnswerCitation:
    scores = analysis.scores
    return AIAnswerCitation(
        source_id=f"scores:{analysis.listing.id}",
        source_type="scores",
        title="Scoring output",
        excerpt=(
            f"Investment {scores.investment_score}/100, risk {scores.risk_score}/100, "
            f"fair range {_money(scores.fair_price_low)}-{_money(scores.fair_price_high)}, "
            f"confidence {scores.fair_price_confidence_score}/100."
        ),
    )


def _risk_citation(analysis: ListingAnalysis) -> AIAnswerCitation:
    if analysis.risk_profile is None:
        return AIAnswerCitation(
            source_id=f"risk:{analysis.listing.id}",
            source_type="risk_profile",
            title="Risk profile",
            excerpt="Risk profile is not available; use scoring warnings only.",
        )
    profile = analysis.risk_profile
    first_factor = profile.factors[0].summary if profile.factors else "No factor summary."
    return AIAnswerCitation(
        source_id=f"risk:{analysis.listing.id}",
        source_type="risk_profile",
        title="Risk profile",
        excerpt=(
            f"{profile.overall_severity}; Risk Score {profile.risk_score}/100. "
            f"First factor: {first_factor}"
        ),
    )


def _future_citation(analysis: ListingAnalysis) -> AIAnswerCitation:
    impact = analysis.future_area_impact
    return AIAnswerCitation(
        source_id=f"future-impact:{analysis.listing.id}",
        source_type="future_area_impact",
        title="Future area impact",
        excerpt=impact.summary if impact is not None else "Future impact is not available.",
    )


def _growth_citation(analysis: ListingAnalysis) -> AIAnswerCitation:
    growth = analysis.growth_analysis
    return AIAnswerCitation(
        source_id=f"growth:{analysis.listing.id}",
        source_type="growth_analysis",
        title="Growth analysis",
        excerpt=growth.summary if growth is not None else "Growth analysis is not available.",
    )


def _rental_citation(analysis: ListingAnalysis) -> AIAnswerCitation:
    rental = analysis.rental_estimate
    if rental is None:
        excerpt = "Rental estimate is not available."
    else:
        excerpt = (
            f"Rent midpoint {_money(rental.monthly_rent_mid_pln)}, gross yield "
            f"{rental.gross_yield_pct:.1f}%, confidence {rental.confidence_score}/100."
        )
    return AIAnswerCitation(
        source_id=f"rental:{analysis.listing.id}",
        source_type="rental_estimate",
        title="Rental estimate",
        excerpt=excerpt,
    )


def _should_refuse(question: str | None) -> bool:
    if not question:
        return False
    normalized = question.casefold()
    return any(token in normalized for token in REFUSAL_TOKENS)


def _clean_question(question: str | None) -> str | None:
    if question is None:
        return None
    cleaned = " ".join(question.strip().split())
    return cleaned or None


def _money(value: int | float) -> str:
    return f"{round(value):,} PLN".replace(",", " ")


def _dedupe(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        cleaned = item.strip()
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            result.append(cleaned)
    return result


def _input_hash(payload: dict[str, object]) -> str:
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True, default=str)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()
