import pytest

from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.schemas import PurchaseIntent
from domarion.services.buyer_decision import build_buyer_decision
from domarion.services.scoring import calculate_scores


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
    repository = InMemoryRealEstateRepository()
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
