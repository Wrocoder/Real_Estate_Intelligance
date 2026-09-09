import pytest
from pydantic import ValidationError

from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.schemas import (
    AIListingAnswerRequest,
    BuyerActionPlan,
    BuyerNegotiationAssistant,
    PostViewingChecklistAnswers,
    PurchaseIntent,
)
from domarion.services.buyer_decision import (
    build_buyer_decision,
    recalculate_post_viewing_verdict,
)
from domarion.services.listing_ai_assistant import build_listing_ai_answer
from domarion.services.risk_profile import build_listing_risk_profile
from domarion.services.scoring import build_listing_analysis, calculate_scores


@pytest.mark.parametrize(
    ("price_delta_pct", "risk_score", "negotiation_score", "expected_status"),
    [
        (0.0, 15, 35, "buy"),
        (8.0, 20, 70, "negotiate"),
        (2.0, 65, 35, "verify_first"),
        (0.0, 80, 35, "avoid"),
    ],
)
def test_buyer_decision_returns_actionable_verdicts(
    price_delta_pct: float,
    risk_score: int,
    negotiation_score: int,
    expected_status: str,
) -> None:
    decision = _build_decision(
        price_delta_pct=price_delta_pct,
        risk_score=risk_score,
        negotiation_score=negotiation_score,
    )

    assert decision.verdict.status == expected_status
    assert 0 <= decision.verdict.score <= 10
    assert decision.verdict.seller_price_pln > 0
    assert decision.negotiation.scenario_status == "available"
    assert decision.verdict.recommended_offer_pln is not None
    assert decision.verdict.max_reasonable_offer_pln is not None
    assert decision.verdict.recommended_offer_pln <= decision.verdict.max_reasonable_offer_pln
    assert decision.negotiation.opening_offer_pln is not None
    assert decision.negotiation.max_reasonable_offer_pln is not None
    assert decision.negotiation.opening_offer_pln <= decision.negotiation.max_reasonable_offer_pln
    evidence_ids = {item.id for item in decision.negotiation.argument_evidence}
    assert decision.negotiation.next_actions
    assert decision.negotiation.arguments
    assert all(argument.evidence_refs for argument in decision.negotiation.arguments)
    assert all(
        set(argument.evidence_refs) <= evidence_ids
        for argument in decision.negotiation.arguments
    )
    assert decision.verdict.critical_unknowns


def test_low_fair_price_confidence_requires_verification_before_buying() -> None:
    decision = _build_decision(
        price_delta_pct=0,
        risk_score=15,
        negotiation_score=35,
        fair_price_confidence_score=35,
    )

    assert decision.verdict.status == "verify_first"
    assert decision.negotiation.scenario_status == "insufficient_data"
    assert decision.negotiation.opening_offer_pln is None
    assert decision.negotiation.realistic_deal_low_pln is None
    assert decision.negotiation.realistic_deal_high_pln is None
    assert decision.negotiation.max_reasonable_offer_pln is None
    assert decision.negotiation.arguments == []
    assert decision.negotiation.argument_evidence == []
    assert "fair_price_confidence_low" in decision.negotiation.limitation_codes
    assert {item.code for item in decision.negotiation.next_actions} >= {
        "collect_market_evidence",
        "compare_alternatives",
    }


def test_negotiation_omits_price_advice_when_market_sample_is_insufficient() -> None:
    decision = _build_decision(
        price_delta_pct=9,
        risk_score=20,
        negotiation_score=75,
        market_evidence=False,
    )

    assert decision.verdict.status == "verify_first"
    assert decision.negotiation.scenario_status == "insufficient_data"
    assert decision.verdict.opening_offer_pln is None
    assert decision.verdict.recommended_offer_pln is None
    assert decision.verdict.max_reasonable_offer_pln is None
    assert "market_evidence_insufficient" in decision.negotiation.limitation_codes
    assert decision.negotiation.posture == "unavailable"


def test_negotiation_contract_rejects_prices_without_sufficient_evidence() -> None:
    negotiation = _build_decision(
        price_delta_pct=8,
        risk_score=20,
        negotiation_score=70,
    ).negotiation
    payload = negotiation.model_dump()
    payload.update(
        {
            "scenario_status": "insufficient_data",
            "arguments": [],
            "argument_evidence": [],
            "next_actions": [],
        }
    )

    with pytest.raises(ValidationError, match="cannot include prices"):
        BuyerNegotiationAssistant.model_validate(payload)


def test_negotiation_contract_rejects_unknown_evidence_reference() -> None:
    negotiation = _build_decision(
        price_delta_pct=8,
        risk_score=20,
        negotiation_score=70,
    ).negotiation
    payload = negotiation.model_dump()
    payload["arguments"][0]["evidence_refs"] = ["missing-evidence"]

    with pytest.raises(ValidationError, match="references unknown evidence"):
        BuyerNegotiationAssistant.model_validate(payload)


def test_negotiation_ai_answer_uses_structured_scenario_evidence() -> None:
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    listing = repository.get_listing("wr-001")
    assert listing is not None
    analysis = build_listing_analysis(repository, listing)
    area = analysis.area_statistics.model_copy(update={"transaction_observation_count": 20})
    scores = analysis.scores.model_copy(update={"fair_price_confidence_score": 80})
    decision = build_buyer_decision(
        listing=analysis.listing,
        area_statistics=area,
        scores=scores,
        comparables=analysis.comparables,
        data_quality_notes=analysis.data_quality_notes,
        developer_reputation=analysis.developer_reputation,
        future_area_impact=analysis.future_area_impact,
        risk_profile=analysis.risk_profile,
        rental_estimate=analysis.rental_estimate,
        comparables_scope=analysis.comparables_scope,
        comparables_freshness_days=analysis.comparables_freshness_days,
    )
    analysis = analysis.model_copy(
        update={"area_statistics": area, "scores": scores, "buyer_decision": decision}
    )

    answer = build_listing_ai_answer(
        analysis,
        AIListingAnswerRequest(question_code="negotiation", audience="buyer"),
    )

    assert "scenario opening" in answer.answer
    assert answer.key_points
    assert answer.citations
    assert all(citation.source_id.startswith("negotiation:") for citation in answer.citations)


@pytest.mark.parametrize("question_code", ["seller_questions", "documents"])
def test_buyer_action_ai_answers_use_structured_plan_evidence(
    question_code: str,
) -> None:
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    listing = repository.get_listing("wr-001")
    assert listing is not None
    analysis = build_listing_analysis(repository, listing)

    answer = build_listing_ai_answer(
        analysis,
        AIListingAnswerRequest(question_code=question_code, audience="buyer"),
    )

    assert answer.key_points
    assert answer.citations
    assert all(
        citation.source_id.startswith("buyer-action:")
        for citation in answer.citations
    )


def test_buyer_decision_exposes_due_diligence_total_cost_and_source_confidence() -> None:
    decision = _build_decision(
        price_delta_pct=8.0,
        risk_score=20,
        negotiation_score=70,
        renovation_state="needs_renovation",
    )

    assert any(item.code == "kw_owner" for item in decision.due_diligence.checklist)
    assert any(item.code == "community_debt" for item in decision.due_diligence.checklist)
    assert any("Księgi Wieczystej" in item for item in decision.due_diligence.documents_to_request)
    assert decision.total_acquisition.renovation_estimate_pln > 0
    assert decision.total_acquisition.furniture_estimate_pln > 0
    assert decision.total_acquisition.total_move_in_cost_pln > decision.verdict.seller_price_pln
    assert decision.knowledge.check_completeness_score > 0
    assert decision.knowledge.could_not_verify
    assert {source.topic for source in decision.knowledge.source_evidence} >= {
        "asking price and object parameters",
        "fair price",
        "market context",
    }
    assert all(
        source.calculation_type in {"observed", "calculated", "model_estimate", "unknown"}
        for source in decision.knowledge.source_evidence
    )
    source_by_topic = {source.topic: source for source in decision.knowledge.source_evidence}
    assert source_by_topic["asking price and object parameters"].sample_size == 1
    assert source_by_topic["asking price and object parameters"].geographic_scope
    assert source_by_topic["fair price"].sample_size is not None
    assert source_by_topic["fair price"].geographic_scope
    assert source_by_topic["market context"].time_range == "90 days"


def test_buyer_action_plan_has_stable_actions_and_valid_evidence_references() -> None:
    decision = _build_decision(
        price_delta_pct=8.0,
        risk_score=20,
        negotiation_score=70,
    )

    assert decision.action_plan.version == "buyer-action-plan-v1-evidence"
    assert decision.action_plan.subject_id == "wr-001"
    assert {item.code for item in decision.action_plan.items} >= {
        "verify_kw_owner",
        "verify_kw_encumbrances",
        "request_debt_certificate",
        "ask_sale_context",
        "inspect_apartment_condition",
        "record_viewing_findings",
    }
    evidence_ids = {item.id for item in decision.action_plan.evidence}
    assert evidence_ids
    assert all(
        item.evidence_refs and set(item.evidence_refs) <= evidence_ids
        for item in decision.action_plan.items
    )


def test_primary_market_action_plan_uses_developer_purchase_checks() -> None:
    decision = _build_decision(
        market_type="primary",
        price_delta_pct=1.0,
        risk_score=25,
        negotiation_score=45,
    )
    action_codes = {item.code for item in decision.action_plan.items}

    assert {
        "verify_developer_identity",
        "review_escrow_schedule",
        "verify_permits_and_title",
        "review_prospekt_and_contract",
    } <= action_codes
    assert "verify_kw_owner" not in action_codes


def test_unknown_risk_input_creates_verification_action_without_fake_value() -> None:
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    base_listing = repository.get_listing("wr-001")
    assert base_listing is not None
    listing = base_listing.model_copy(update={"nearest_stop_m": None})
    area = repository.get_area_statistics(listing.area_id)
    assert area is not None
    area = area.model_copy(update={"transaction_observation_count": 20})
    comparables = repository.find_comparables(listing)
    scores = calculate_scores(listing, area, comparables).model_copy(
        update={"fair_price_confidence_score": 80}
    )
    risk_profile = build_listing_risk_profile(
        listing=listing,
        area_statistics=area,
        scores=scores,
    )
    decision = build_buyer_decision(
        listing=listing,
        area_statistics=area,
        scores=scores,
        comparables=comparables,
        data_quality_notes=[],
        risk_profile=risk_profile,
    )

    action = next(
        item for item in decision.action_plan.items if item.code == "test_transport_route"
    )
    assert action.evidence_refs == ["risk:weak_transport"]
    evidence = next(
        item
        for item in decision.action_plan.evidence
        if item.id == "risk:weak_transport"
    )
    assert evidence.status == "unknown"
    assert evidence.calculation_type == "unknown"
    assert evidence.confidence_score == 0
    assert evidence.sample_size is None
    assert "distance_m" not in evidence.params


def test_buyer_action_plan_rejects_unknown_evidence_reference() -> None:
    action_plan = _build_decision(
        price_delta_pct=8.0,
        risk_score=20,
        negotiation_score=70,
    ).action_plan
    payload = action_plan.model_dump()
    payload["items"][0]["evidence_refs"] = ["missing-evidence"]

    with pytest.raises(ValidationError, match="references unknown evidence"):
        BuyerActionPlan.model_validate(payload)


def test_legacy_buyer_decision_without_action_plan_remains_readable() -> None:
    decision = _build_decision(
        price_delta_pct=8.0,
        risk_score=20,
        negotiation_score=70,
    )
    payload = decision.model_dump()
    payload.pop("action_plan")

    restored = type(decision).model_validate(payload)

    assert restored.action_plan is None


def test_buyer_decision_source_evidence_carries_comparable_window() -> None:
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    listing = repository.get_listing("wr-001")
    assert listing is not None

    analysis = build_listing_analysis(repository, listing)
    assert analysis.buyer_decision is not None
    source_by_topic = {
        source.topic: source for source in analysis.buyer_decision.knowledge.source_evidence
    }

    fair_price_source = source_by_topic["fair price"]
    assert fair_price_source.sample_size == len(analysis.comparables)
    assert fair_price_source.time_range == f"{analysis.comparables_freshness_days} days"
    assert fair_price_source.calculation_type == "model_estimate"


def test_buyer_decision_uses_custom_renovation_budget_before_condition_estimate() -> None:
    decision = _build_decision(
        price_delta_pct=4.0,
        risk_score=24,
        negotiation_score=52,
        renovation_state="move_in_ready",
        custom_renovation_budget_pln=120_000,
    )

    assert decision.total_acquisition.renovation_condition == "move_in_ready"
    assert decision.total_acquisition.renovation_budget_source == "custom_budget"
    assert decision.total_acquisition.renovation_estimate_pln == 120_000
    assert any("buyer-provided custom budget" in item for item in decision.total_acquisition.notes)


def test_buyer_decision_personalizes_verdict_for_selected_purchase_intent() -> None:
    decision = _build_decision(
        price_delta_pct=4.0,
        risk_score=24,
        negotiation_score=52,
        purchase_intent="family",
    )

    assert decision.selected_intent == "family"
    assert decision.selected_intent_fit is not None
    assert decision.selected_intent_fit.intent == "family"
    assert decision.decision_model_version == "buyer-decision-v2-intent"
    assert 0 <= decision.selected_intent_fit.score <= 100
    assert any("Selected buyer goal (family)" in item for item in decision.verdict.top_reasons)


def test_primary_market_due_diligence_covers_developer_contract_and_escrow_checks() -> None:
    decision = _build_decision(
        market_type="primary",
        price_delta_pct=1.0,
        risk_score=25,
        negotiation_score=45,
    )

    codes = {item.code for item in decision.due_diligence.checklist}
    assert {"developer_identity", "escrow", "permits", "prospekt", "warranties"} <= codes
    assert any(
        "rachunek powierniczy" in item for item in decision.due_diligence.documents_to_request
    )
    assert decision.total_acquisition.pcc_tax_pln == 0
    assert "developer reputation could not be matched" in decision.due_diligence.unknowns


def test_pre_viewing_and_watch_outputs_support_buyer_workflow() -> None:
    decision = _build_decision(
        price_delta_pct=7.0,
        risk_score=22,
        negotiation_score=72,
        relisted=True,
    )

    assert decision.verdict.status == "negotiate"
    assert decision.pre_viewing.recommendation == "view"
    assert decision.pre_viewing.seller_questions
    assert decision.pre_viewing.photos_to_take
    assert decision.pre_viewing.documents_to_request
    assert decision.post_viewing_checklist
    assert any("price drops" in trigger for trigger in decision.watch_triggers)
    assert any(argument.code == "relisted" for argument in decision.negotiation.arguments)


def test_post_viewing_answers_recalculate_verdict_and_offer_ceiling() -> None:
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    listing = repository.get_listing("wr-001")
    assert listing is not None
    analysis = build_listing_analysis(repository, listing)
    area = analysis.area_statistics.model_copy(update={"transaction_observation_count": 20})
    scores = analysis.scores.model_copy(update={"fair_price_confidence_score": 80})
    decision = build_buyer_decision(
        listing=analysis.listing,
        area_statistics=area,
        scores=scores,
        comparables=analysis.comparables,
        data_quality_notes=analysis.data_quality_notes,
        developer_reputation=analysis.developer_reputation,
        future_area_impact=analysis.future_area_impact,
        risk_profile=analysis.risk_profile,
        rental_estimate=analysis.rental_estimate,
        comparables_scope=analysis.comparables_scope,
        comparables_freshness_days=analysis.comparables_freshness_days,
    )
    analysis = analysis.model_copy(
        update={"area_statistics": area, "scores": scores, "buyer_decision": decision}
    )
    original_decision = analysis.buyer_decision
    assert original_decision is not None

    result = recalculate_post_viewing_verdict(
        analysis,
        PostViewingChecklistAnswers(
            humidity="major_issue",
            noise="major_issue",
            kitchen_bathroom="minor_issue",
            renovation_need="full",
            notes="Visible stains under the window and strong traffic noise.",
        ),
    )

    assert result.original_decision.verdict.status == original_decision.verdict.status
    assert result.updated_decision.verdict.score < result.original_decision.verdict.score
    assert (
        result.updated_decision.verdict.max_reasonable_offer_pln
        < result.original_decision.verdict.max_reasonable_offer_pln
    )
    assert result.updated_decision.verdict.status in {"verify_first", "avoid"}
    assert result.risk_adjustment_points > 0
    assert result.offer_adjustment_pln > 0
    assert any("humidity" in item for item in result.applied_findings)
    assert any("written renovation estimate" in item for item in result.recommended_actions)


def _build_decision(
    *,
    price_delta_pct: float,
    risk_score: int,
    negotiation_score: int,
    market_type: str = "secondary",
    renovation_state: str = "ready_to_move_in",
    custom_renovation_budget_pln: int | None = None,
    relisted: bool = False,
    purchase_intent: PurchaseIntent = "unsure",
    fair_price_confidence_score: int = 82,
    market_evidence: bool = True,
):
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    base_listing = repository.get_listing("wr-001")
    assert base_listing is not None
    base_area = repository.get_area_statistics(base_listing.area_id)
    assert base_area is not None
    area = base_area.model_copy(
        update={"transaction_observation_count": 20 if market_evidence else 0}
    )

    listing = base_listing.model_copy(
        update={
            "market_type": market_type,
            "price": 700_000,
            "price_per_m2": round(700_000 / base_listing.area_m2),
            "floor": 2,
            "building_floors": 6,
            "building_year": 2018,
            "nearest_major_road_m": 900,
            "nearest_industrial_zone_m": 2_500,
            "data_quality_score": 95,
            "renovation_state": renovation_state,
            "days_on_market": 45,
            "price_reductions": 0,
            "relisted": relisted,
            "custom_renovation_budget_pln": custom_renovation_budget_pln,
        }
    )
    base_scores = calculate_scores(listing, area, repository.find_comparables(listing))
    fair_mid = round(listing.price / (1 + price_delta_pct / 100))
    scores = base_scores.model_copy(
        update={
            "risk_score": risk_score,
            "negotiation_score": negotiation_score,
            "fair_price_low": round(fair_mid * 0.94),
            "fair_price_mid": fair_mid,
            "fair_price_high": round(fair_mid * 1.06),
            "fair_price_confidence_score": fair_price_confidence_score,
            "price_delta_to_fair_mid_pct": price_delta_pct,
            "reasons": ["Comparable base supports the fair-price range."],
            "warnings": [],
        }
    )
    return build_buyer_decision(
        listing=listing,
        area_statistics=area,
        scores=scores,
        comparables=repository.find_comparables(listing),
        data_quality_notes=["Data Quality Score: 95/100."],
        purchase_intent=purchase_intent,
    )
