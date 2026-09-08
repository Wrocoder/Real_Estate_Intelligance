from datetime import date, timedelta

from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.schemas import RentalObservation
from domarion.services.rental_estimate import (
    RENTAL_FRESHNESS_DAYS,
    RentalComparableSelection,
    build_listing_rental_estimate,
    select_rental_comparables,
)
from domarion.services.scoring import calculate_scores


def _observation(index: int, rent_per_m2: float) -> RentalObservation:
    area_m2 = 60.0
    observed_at = date.today() - timedelta(days=10 + index)
    return RentalObservation(
        id=f"rental-{index}",
        source_name="Approved Rental Feed",
        source_type="authorized_feed",
        observed_at=observed_at,
        last_confirmed_at=date.today() - timedelta(days=index),
        city="Wrocław",
        district="Fabryczna",
        area_id="wroclaw-fabryczna",
        property_type="apartment",
        building_type="apartment_block",
        monthly_rent_pln=round(rent_per_m2 * area_m2),
        area_m2=area_m2,
        rent_per_m2_pln=rent_per_m2,
        rooms=3,
        data_quality_score=90,
    )


def _selection(rates: tuple[float, ...]) -> RentalComparableSelection:
    return RentalComparableSelection(
        items=[_observation(index, rate) for index, rate in enumerate(rates)],
        level=0,
        geographic_scope="Fabryczna, close property match",
        stage_counts={"same_district_close_match": len(rates)},
        excluded_counts={},
    )


def _listing_and_area():
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    listing = repository.get_listing("wr-001")
    area = repository.get_area_statistics("wroclaw-fabryczna")
    assert listing is not None
    assert area is not None
    return listing, area


def test_rent_range_is_independent_from_asking_price() -> None:
    listing, area = _listing_and_area()
    selection = _selection((49.0, 50.0, 51.0, 52.0, 53.0))
    scores = calculate_scores(listing, area, [], rental_selection=selection)
    estimate = build_listing_rental_estimate(listing, scores, selection=selection)

    expensive_listing = listing.model_copy(
        update={
            "price": listing.price * 2,
            "price_per_m2": listing.price_per_m2 * 2,
        }
    )
    expensive_scores = calculate_scores(
        expensive_listing,
        area,
        [],
        rental_selection=selection,
    )
    expensive_estimate = build_listing_rental_estimate(
        expensive_listing,
        expensive_scores,
        selection=selection,
    )

    assert estimate.status == "estimated"
    assert estimate.monthly_rent_mid_pln == expensive_estimate.monthly_rent_mid_pln
    assert estimate.gross_yield_pct is not None
    assert expensive_estimate.gross_yield_pct is not None
    assert estimate.gross_yield_pct > expensive_estimate.gross_yield_pct
    assert estimate.net_yield_pct is not None
    assert estimate.net_yield_pct < estimate.gross_yield_pct


def test_insufficient_rental_sample_does_not_publish_numeric_estimate() -> None:
    listing, area = _listing_and_area()
    selection = _selection((50.0, 52.0))
    scores = calculate_scores(listing, area, [], rental_selection=selection)
    estimate = build_listing_rental_estimate(listing, scores, selection=selection)

    assert estimate.status == "insufficient_data"
    assert estimate.monthly_rent_low_pln is None
    assert estimate.monthly_rent_mid_pln is None
    assert estimate.monthly_rent_high_pln is None
    assert estimate.gross_yield_pct is None
    assert estimate.net_yield_pct is None
    assert scores.rental_potential_score is None
    assert "rental_observations" in scores.explainability.missing_data_codes


def test_minimum_sample_cannot_claim_high_confidence() -> None:
    listing, area = _listing_and_area()
    selection = _selection((50.0, 51.0, 52.0))
    scores = calculate_scores(listing, area, [], rental_selection=selection)
    estimate = build_listing_rental_estimate(listing, scores, selection=selection)

    assert estimate.status == "estimated"
    assert estimate.confidence.level == "medium"
    assert estimate.confidence_score <= 74
    assert "rental_sample_limited" in estimate.confidence.limitation_codes


def test_stale_rental_observations_are_excluded() -> None:
    listing, _ = _listing_and_area()
    stale = _observation(1, 50.0).model_copy(
        update={
            "observed_at": date.today() - timedelta(days=RENTAL_FRESHNESS_DAYS + 10),
            "last_confirmed_at": date.today() - timedelta(days=RENTAL_FRESHNESS_DAYS + 1),
        }
    )

    class Repository:
        def find_rental_observations(self, subject, limit=200):  # noqa: ANN001, ARG002
            return [stale]

    selection = select_rental_comparables(Repository(), listing)

    assert selection.status == "insufficient"
    assert selection.items == []
    assert selection.excluded_counts == {"stale": 1}


def test_conflicting_rents_cap_confidence_without_fake_precision() -> None:
    listing, area = _listing_and_area()
    selection = _selection((25.0, 38.0, 52.0, 80.0, 110.0))
    scores = calculate_scores(listing, area, [], rental_selection=selection)
    estimate = build_listing_rental_estimate(listing, scores, selection=selection)

    assert estimate.status == "estimated"
    assert estimate.confidence.level == "low"
    assert estimate.confidence_score <= 49
    assert "rental_rates_inconsistent" in estimate.confidence.limitation_codes
    assert estimate.monthly_rent_low_pln % 50 == 0
    assert estimate.monthly_rent_mid_pln % 50 == 0
    assert estimate.monthly_rent_high_pln % 50 == 0
