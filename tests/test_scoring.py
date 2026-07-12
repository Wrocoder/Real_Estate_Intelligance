from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.schemas import PropertyScores, ScoreBreakdown
from domarion.services.scoring import (
    DEFAULT_SCORING_WEIGHTS_PROFILE,
    SCORING_FORMULA_VERSION,
    FairPriceWeights,
    InvestmentScoreWeights,
    ScoringConfigurationError,
    ScoringWeights,
    build_listing_analysis,
    calculate_scores,
)


def test_scores_stay_in_expected_range() -> None:
    repository = InMemoryRealEstateRepository()
    listing = repository.get_listing("wr-001")
    assert listing is not None

    area = repository.get_area_statistics(listing.area_id)
    assert area is not None

    scores = calculate_scores(listing, area, repository.find_comparables(listing))

    assert 0 <= scores.investment_score <= 100
    assert 0 <= scores.risk_score <= 100
    assert 0 <= scores.negotiation_score <= 100
    assert 0 <= scores.fair_price_confidence_score <= 100
    assert scores.fair_price_low < scores.fair_price_mid < scores.fair_price_high
    assert scores.formula_version == SCORING_FORMULA_VERSION
    assert scores.weights_profile == DEFAULT_SCORING_WEIGHTS_PROFILE
    assert scores.decision_label in {
        "strong_candidate",
        "good_option",
        "fair_option",
        "overpriced",
        "risky",
        "weak_fit",
    }
    assert scores.price_label in {"below_fair", "fair", "above_fair", "overpriced"}
    assert scores.risk_label in {
        "low_risk",
        "moderate_risk",
        "elevated_risk",
        "high_risk",
    }
    assert scores.negotiation_label in {
        "weak_negotiation",
        "some_negotiation",
        "negotiable",
        "strong_negotiation",
    }


def test_long_listing_with_reductions_gets_negotiation_arguments() -> None:
    repository = InMemoryRealEstateRepository()
    listing = repository.get_listing("wr-003")
    assert listing is not None

    analysis = build_listing_analysis(repository, listing)

    assert analysis.scores.negotiation_score >= 70
    assert any("Цена снижалась" in argument for argument in analysis.negotiation_arguments)


def test_scoring_weights_can_override_default_aggregation() -> None:
    repository = InMemoryRealEstateRepository()
    listing = repository.get_listing("wr-001")
    assert listing is not None
    area = repository.get_area_statistics(listing.area_id)
    assert area is not None

    weights = ScoringWeights(
        fair_price=FairPriceWeights(area_median=1.0, comparable_median=0.0),
        investment=InvestmentScoreWeights(
            price_position=1.0,
            area_trend=0.0,
            transport=0.0,
            future_infrastructure=0.0,
            liquidity=0.0,
            lifestyle_infrastructure=0.0,
            rental_potential=0.0,
            data_quality=0.0,
            risk_penalty=0.0,
        ),
    )
    scores = calculate_scores(
        listing,
        area,
        repository.find_comparables(listing),
        weights=weights,
    )

    assert scores.fair_price_mid == int(area.median_price_per_m2 * listing.area_m2)
    assert scores.investment_score == scores.breakdown.price_position
    assert scores.weights_profile.startswith("custom-")


def test_property_scores_backfills_labels_for_legacy_payloads() -> None:
    scores = PropertyScores(
        formula_version="legacy",
        weights_profile="legacy",
        investment_score=42,
        risk_score=72,
        negotiation_score=30,
        liquidity_score=55,
        rental_potential_score=80,
        fair_price_low=500000,
        fair_price_mid=550000,
        fair_price_high=600000,
        fair_price_confidence_score=64,
        price_delta_to_fair_mid_pct=14.2,
        breakdown=ScoreBreakdown(
            price_position=30,
            area_trend=50,
            transport=60,
            future_infrastructure=40,
            liquidity=55,
            lifestyle_infrastructure=50,
            rental_potential=80,
            data_quality=90,
            risk_penalty=45,
        ),
        reasons=[],
        warnings=[],
    )

    assert scores.decision_label == "risky"
    assert scores.price_label == "overpriced"
    assert scores.risk_label == "high_risk"
    assert scores.negotiation_label == "weak_negotiation"
    assert scores.liquidity_label == "moderate"
    assert scores.rental_potential_label == "strong"


def test_scoring_weights_json_rejects_unknown_keys() -> None:
    raw_json = '{"investment":{"unknown_weight":1}}'

    try:
        ScoringWeights.from_json(raw_json)
    except ScoringConfigurationError as exc:
        assert "unknown_weight" in str(exc)
    else:
        raise AssertionError("Expected invalid scoring weights JSON to fail")
