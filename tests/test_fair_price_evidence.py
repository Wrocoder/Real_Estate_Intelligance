import pytest

from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.schemas import PropertyScores
from domarion.services.scoring import FairPriceWeights, ScoringWeights, calculate_scores


@pytest.mark.parametrize("count", [0, 1, 2, 3, 5])
@pytest.mark.parametrize("basis", ["listing_observed", "transaction_observed", "unknown"])
def test_evidence_matches_actual_calculation(count: int, basis: str) -> None:
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    listing = repository.get_listing("wr-001")
    area = repository.get_area_statistics(listing.area_id)
    area = area.model_copy(update={"price_basis": basis, "median_price_per_m2": 10_000})
    comparables = [
        listing.model_copy(update={"id": f"comparison-{index}", "price_per_m2": 12_000})
        for index in range(count)
    ]
    scores = calculate_scores(listing, area, comparables)
    evidence = scores.fair_price_evidence
    assert evidence is not None
    assert evidence.area_price_basis == basis
    assert evidence.listings_used_count == (count if count >= 3 else 0)
    assert evidence.listing_median_per_m2 == (12_000 if count >= 3 else None)
    assert evidence.area_weight == (0.65 if count >= 3 else 1)
    assert evidence.listing_weight == (0.35 if count >= 3 else 0)
    assert evidence.property_adjustments_applied is False
    assert evidence.selection_reference_date == listing.last_seen_at
    per_m2 = evidence.area_median_per_m2 * evidence.area_weight
    per_m2 += (evidence.listing_median_per_m2 or 0) * evidence.listing_weight
    assert scores.fair_price_mid == round(per_m2 * evidence.subject_area_m2 / 5_000) * 5_000
    half_width = evidence.range_half_width_pct / 100
    assert scores.fair_price_low <= scores.fair_price_mid * (1 - half_width)
    assert scores.fair_price_high >= scores.fair_price_mid * (1 + half_width)
    legacy = scores.model_dump(exclude={"fair_price_evidence"})
    assert PropertyScores.model_validate(legacy).fair_price_evidence is None


def test_evidence_uses_configured_weights_not_frontend_assumptions() -> None:
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    listing = repository.get_listing("wr-001")
    area = repository.get_area_statistics(listing.area_id)
    scores = calculate_scores(
        listing,
        area,
        [listing] * 3,
        weights=ScoringWeights(fair_price=FairPriceWeights(area_median=0.8, comparable_median=0.2)),
    )
    assert scores.fair_price_evidence.area_weight == 0.8
    assert scores.fair_price_evidence.listing_weight == 0.2
