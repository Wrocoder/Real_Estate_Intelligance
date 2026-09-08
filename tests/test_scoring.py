from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.schemas import PropertyScores, ScoreBreakdown
from domarion.services.comparables import select_comparables
from domarion.services.growth_analysis import build_listing_growth_analysis
from domarion.services.risk_profile import build_listing_risk_profile
from domarion.services.scoring import (
    DEFAULT_SCORING_WEIGHTS_PROFILE,
    SCORE_EXPLANATION_VERSION,
    SCORING_FORMULA_VERSION,
    FairPriceWeights,
    InvestmentScoreWeights,
    ScoringConfigurationError,
    ScoringWeights,
    build_listing_analysis,
    calculate_scores,
)


def test_scores_stay_in_expected_range() -> None:
    repository = InMemoryRealEstateRepository(include_demo_data=True)
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
    assert scores.explainability.version == SCORE_EXPLANATION_VERSION
    assert 0 <= scores.explainability.coverage_score <= 100
    assert [item.score_code for item in scores.explainability.score_details] == [
        "investment",
        "risk",
        "negotiation",
        "liquidity",
        "rental",
    ]
    assert all(
        item.calculation_version == SCORING_FORMULA_VERSION
        for item in scores.explainability.score_details
    )


def test_each_score_has_its_own_ranked_explanation() -> None:
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    listing = repository.get_listing("wr-003")
    assert listing is not None
    area = repository.get_area_statistics(listing.area_id)
    assert area is not None

    analysis = build_listing_analysis(repository, listing)
    details = {
        item.score_code: item for item in analysis.scores.explainability.score_details
    }

    assert set(details) == {"investment", "risk", "negotiation", "liquidity", "rental"}
    assert all(0 <= item.coverage_score <= 100 for item in details.values())
    assert all(item.confidence_level in {"high", "medium", "low"} for item in details.values())
    assert "price_reduction_history" in {
        driver.code for driver in details["negotiation"].drivers
    }
    assert "price_reduction_history" not in {
        driver.code for driver in details["liquidity"].drivers
    }
    assert all(driver.code for item in details.values() for driver in item.drivers)


def test_fair_price_confidence_is_high_for_consistent_relevant_sample() -> None:
    repository = InMemoryRealEstateRepository()
    source = InMemoryRealEstateRepository(include_demo_data=True)
    listing = source.get_listing("wr-001")
    area = source.get_area_statistics("wroclaw-fabryczna")
    assert listing is not None
    assert area is not None
    repository._listings = {listing.id: listing}
    for index, price in enumerate((690_000, 700_000, 705_000, 710_000, 715_000), start=1):
        comparable = listing.model_copy(update={"id": f"strong-{index}", "price": price})
        repository._listings[comparable.id] = comparable
    selection = select_comparables(repository, listing)

    scores = calculate_scores(
        listing,
        area,
        selection.items,
        comparable_selection=selection,
    )

    assert scores.fair_price_confidence is not None
    assert scores.fair_price_confidence.level == "high"
    assert scores.fair_price_confidence.comparable_count == 5
    assert scores.fair_price_mid % 5_000 == 0
    assert scores.fair_price_low % 5_000 == 0
    assert scores.fair_price_high % 5_000 == 0


def test_fair_price_confidence_and_range_react_to_conflicting_sample() -> None:
    repository = InMemoryRealEstateRepository()
    source = InMemoryRealEstateRepository(include_demo_data=True)
    listing = source.get_listing("wr-001")
    area = source.get_area_statistics("wroclaw-fabryczna")
    assert listing is not None
    assert area is not None
    repository._listings = {listing.id: listing}
    for index, price in enumerate((350_000, 500_000, 900_000, 1_100_000), start=1):
        comparable = listing.model_copy(
            update={
                "id": f"conflict-{index}",
                "price": price,
                "price_per_m2": round(price / listing.area_m2),
            }
        )
        repository._listings[comparable.id] = comparable
    selection = select_comparables(repository, listing)

    scores = calculate_scores(
        listing,
        area,
        selection.items,
        comparable_selection=selection,
    )

    assert scores.fair_price_confidence is not None
    assert scores.fair_price_confidence.level == "low"
    assert "comparable_prices_inconsistent" in scores.fair_price_confidence.limitation_codes
    assert scores.fair_price_high - scores.fair_price_low >= scores.fair_price_mid * 0.35


def test_fair_price_confidence_is_low_without_market_evidence() -> None:
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    listing = repository.get_listing("wr-001")
    area = repository.get_area_statistics("wroclaw-fabryczna")
    assert listing is not None
    assert area is not None
    area = area.model_copy(
        update={
            "transaction_observation_count": 0,
            "active_listings": 0,
        }
    )

    scores = calculate_scores(listing, area, [])

    assert scores.fair_price_confidence is not None
    assert scores.fair_price_confidence.level == "low"
    assert scores.fair_price_confidence_score <= 35
    assert "market_evidence_insufficient" in scores.fair_price_confidence.limitation_codes
    assert all(driver.code for driver in scores.explainability.drivers)
    assert all(
        driver.direction in {"positive", "negative", "unknown"}
        for driver in scores.explainability.drivers
    )
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
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    listing = repository.get_listing("wr-003")
    assert listing is not None

    analysis = build_listing_analysis(repository, listing)

    assert analysis.scores.negotiation_score >= 70
    assert any("Цена снижалась" in argument for argument in analysis.negotiation_arguments)


def test_scoring_weights_can_override_default_aggregation() -> None:
    repository = InMemoryRealEstateRepository(include_demo_data=True)
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

    unrounded_fair_price = int(area.median_price_per_m2 * listing.area_m2)
    assert abs(scores.fair_price_mid - unrounded_fair_price) <= 2_500
    assert scores.fair_price_mid % 5_000 == 0
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
    assert scores.explainability.score_details == []


def test_scoring_weights_json_rejects_unknown_keys() -> None:
    raw_json = '{"investment":{"unknown_weight":1}}'

    try:
        ScoringWeights.from_json(raw_json)
    except ScoringConfigurationError as exc:
        assert "unknown_weight" in str(exc)
    else:
        raise AssertionError("Expected invalid scoring weights JSON to fail")


def test_missing_context_is_excluded_and_exposed_as_partial_data() -> None:
    demo_repository = InMemoryRealEstateRepository(include_demo_data=True)
    listing = demo_repository.get_listing("wr-001")
    area = demo_repository.get_area_statistics("wroclaw-krzyki")
    assert listing is not None
    assert area is not None
    listing = listing.model_copy(
        update={
            "floor": None,
            "building_floors": None,
            "building_year": None,
            "distance_to_center_km": None,
            "nearest_stop_m": None,
            "nearest_school_m": None,
            "nearest_major_road_m": None,
            "nearest_industrial_zone_m": None,
            "parks_within_1km": None,
            "schools_within_1km": None,
            "planned_investments_within_2km": None,
            "data_quality_score": 45,
        }
    )
    area = area.model_copy(
        update={
            "listing_metrics_available": False,
            "active_listings": 0,
            "average_days_on_market": 0,
            "new_listings_30d": 0,
            "removed_listings_30d": 0,
            "supply_change_90d_pct": 0,
            "transaction_observation_count": 20,
        }
    )

    scores = calculate_scores(listing, area, [])

    assert scores.breakdown.transport is None
    assert scores.breakdown.future_infrastructure is None
    assert scores.breakdown.liquidity is None
    assert scores.breakdown.lifestyle_infrastructure is None
    assert scores.breakdown.rental_potential is None
    assert scores.liquidity_score is None
    assert scores.rental_potential_score is None
    assert scores.liquidity_label == "unknown"
    assert scores.rental_potential_label == "unknown"
    assert scores.fair_price_confidence_score <= 55
    assert scores.explainability.coverage_score < listing.data_quality_score
    assert set(scores.explainability.missing_data_codes) == {
        "distance_to_center_km",
        "nearest_stop_m",
        "nearest_school_m",
        "nearest_major_road_m",
        "nearest_industrial_zone_m",
        "parks_within_1km",
        "schools_within_1km",
        "planned_investments_within_2km",
        "rental_observations",
    }
    assert not any(driver.code == "local_liquidity" for driver in scores.explainability.drivers)
    assert not any("дольше среднего" in warning for warning in scores.warnings)
    details = {item.score_code: item for item in scores.explainability.score_details}
    assert details["investment"].status == "partial"
    assert details["risk"].status == "partial"
    assert details["negotiation"].status == "partial"
    assert details["liquidity"].status == "insufficient_data"
    assert details["liquidity"].coverage_score == 0
    assert details["rental"].status == "insufficient_data"
    assert details["rental"].confidence_level == "low"
    assert "missing_listing_market_metrics" in {
        driver.code for driver in details["liquidity"].drivers
    }
    assert "missing_rental_observations" in {
        driver.code for driver in details["rental"].drivers
    }

    risk_profile = build_listing_risk_profile(
        listing=listing,
        area_statistics=area,
        scores=scores,
    )
    unknown_factors = {factor.code for factor in risk_profile.factors if factor.score is None}
    assert {
        "market_liquidity",
        "weak_transport",
        "major_road_noise",
        "industrial_zone",
        "building_age",
        "weak_rental_yield",
    } <= unknown_factors

    empty_repository = InMemoryRealEstateRepository(include_demo_data=False)
    growth = build_listing_growth_analysis(empty_repository, listing, area)
    assert growth.growth_score is None
    assert growth.growth_label == "insufficient_data"
    assert all(factor.score is None for factor in growth.factors)
