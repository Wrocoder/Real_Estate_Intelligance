from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.services.scoring import build_listing_analysis, calculate_scores


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
    assert scores.fair_price_low < scores.fair_price_mid < scores.fair_price_high


def test_long_listing_with_reductions_gets_negotiation_arguments() -> None:
    repository = InMemoryRealEstateRepository()
    listing = repository.get_listing("wr-003")
    assert listing is not None

    analysis = build_listing_analysis(repository, listing)

    assert analysis.scores.negotiation_score >= 70
    assert any("Цена снижалась" in argument for argument in analysis.negotiation_arguments)

