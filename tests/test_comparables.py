from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.services.comparables import select_comparables


def test_comparable_selection_reports_relevant_scope_and_freshness() -> None:
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    listing = repository.get_listing("wr-001")
    assert listing is not None

    selection = select_comparables(repository, listing)

    assert selection.items
    assert selection.level in {0, 1, 2, 3}
    assert selection.freshness_days == 180
    assert "city" in selection.scope or "district" in selection.scope


def test_comparable_selection_does_not_cross_market_in_strict_levels() -> None:
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    listing = repository.get_listing("wr-001")
    assert listing is not None

    selection = select_comparables(repository, listing)

    if selection.level < 3:
        assert all(item.market_type == listing.market_type for item in selection.items)
