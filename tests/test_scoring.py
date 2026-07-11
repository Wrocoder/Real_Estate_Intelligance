from domarion.repositories.in_memory import InMemoryRealEstateRepository
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


def test_scoring_weights_json_rejects_unknown_keys() -> None:
    raw_json = '{"investment":{"unknown_weight":1}}'

    try:
        ScoringWeights.from_json(raw_json)
    except ScoringConfigurationError as exc:
        assert "unknown_weight" in str(exc)
    else:
        raise AssertionError("Expected invalid scoring weights JSON to fail")
