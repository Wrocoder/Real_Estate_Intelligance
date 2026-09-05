import pytest

from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.schemas import PostViewingChecklistAnswers, PurchaseIntent
from domarion.services.buyer_decision import (
    build_buyer_decision,
    recalculate_post_viewing_verdict,
)
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
    assert decision.verdict.recommended_offer_pln <= decision.verdict.max_reasonable_offer_pln
    assert decision.negotiation.opening_offer_pln <= decision.negotiation.max_reasonable_offer_pln
    assert decision.negotiation.seller_script
    assert len(decision.negotiation.argument_evidence) == len(decision.negotiation.arguments)
    assert all(item.source_name for item in decision.negotiation.argument_evidence)
    assert decision.verdict.critical_unknowns


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
    assert any("relisted" in argument for argument in decision.negotiation.arguments)


def test_post_viewing_answers_recalculate_verdict_and_offer_ceiling() -> None:
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    listing = repository.get_listing("wr-001")
    assert listing is not None
    analysis = build_listing_analysis(repository, listing)
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
):
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    base_listing = repository.get_listing("wr-001")
    assert base_listing is not None
    area = repository.get_area_statistics(base_listing.area_id)
    assert area is not None

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
            "fair_price_confidence_score": 82,
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
        negotiation_arguments=["Object has visible price negotiation room."],
        data_quality_notes=["Data Quality Score: 95/100."],
        purchase_intent=purchase_intent,
    )
