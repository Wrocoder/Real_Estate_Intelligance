from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.services.comparables import build_comparable_evidence, select_comparables


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


def test_comparable_evidence_exposes_traceable_match_inputs() -> None:
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    listing = repository.get_listing("wr-001")
    assert listing is not None

    selection = select_comparables(repository, listing)
    evidence = build_comparable_evidence(listing, selection.items)

    assert evidence
    first = evidence[0]
    assert first.listing_id == selection.items[0].id
    assert first.observed_at == selection.items[0].last_seen_at
    assert first.distance_m is not None
    assert 0 <= first.similarity_score <= 100
    assert "same_market" in first.similarity_factors
    assert first.data_provenance.source_type


def test_comparable_evidence_does_not_award_unknown_attributes_as_matches() -> None:
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    listing = repository.get_listing("wr-001")
    comparable = repository.get_listing("wr-002")
    assert listing is not None
    assert comparable is not None

    subject = listing.model_copy(update={"building_type": None, "renovation_state": None})
    item = comparable.model_copy(update={"building_type": None, "renovation_state": None})
    evidence = build_comparable_evidence(subject, [item])[0]

    assert "building_type_unknown" in evidence.similarity_factors
    assert "condition_unknown" in evidence.similarity_factors
    assert evidence.similarity_score < 100
