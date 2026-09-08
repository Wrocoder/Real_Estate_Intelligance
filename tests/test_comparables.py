from datetime import timedelta

from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.services.comparables import build_comparable_evidence, select_comparables


def test_comparable_selection_reports_relevant_scope_and_freshness() -> None:
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    listing = repository.get_listing("wr-001")
    assert listing is not None

    selection = select_comparables(repository, listing)

    assert selection.items
    assert selection.level in {0, 1, 2, 3, 4}
    assert selection.freshness_days == 180
    assert "city" in selection.scope or "district" in selection.scope


def test_comparable_selection_never_crosses_market() -> None:
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    listing = repository.get_listing("wr-001")
    assert listing is not None

    selection = select_comparables(repository, listing)

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


def test_comparable_selection_widens_until_minimum_sample_is_reached() -> None:
    repository = InMemoryRealEstateRepository()
    source = InMemoryRealEstateRepository(include_demo_data=True)
    listing = source.get_listing("wr-001")
    assert listing is not None
    strict_one = listing.model_copy(update={"id": "strict-1", "price": 700_000})
    strict_two = listing.model_copy(update={"id": "strict-2", "price": 710_000})
    wider = listing.model_copy(
        update={
            "id": "wider-1",
            "rooms": listing.rooms + 1,
            "building_type": "different_type",
            "price": 720_000,
        }
    )
    repository._listings = {
        listing.id: listing,
        strict_one.id: strict_one,
        strict_two.id: strict_two,
        wider.id: wider,
    }

    selection = select_comparables(repository, listing)

    assert selection.level == 1
    assert selection.status in {"strong", "limited"}
    assert selection.stage_counts == {"level_0": 2, "level_1": 3}
    assert len(selection.items) == 3


def test_comparable_selection_reports_insufficient_and_exclusions() -> None:
    repository = InMemoryRealEstateRepository()
    source = InMemoryRealEstateRepository(include_demo_data=True)
    listing = source.get_listing("wr-001")
    assert listing is not None
    stale = listing.model_copy(
        update={
            "id": "stale",
            "last_seen_at": listing.last_seen_at - timedelta(days=181),
        }
    )
    other_market = listing.model_copy(update={"id": "primary", "market_type": "primary"})
    repository._listings = {
        listing.id: listing,
        stale.id: stale,
        other_market.id: other_market,
    }

    selection = select_comparables(repository, listing)

    assert selection.status == "insufficient"
    assert selection.items == []
    assert {(item.code, item.count) for item in selection.exclusions} == {
        ("stale", 1),
        ("different_market", 1),
    }


def test_comparable_order_does_not_depend_on_subject_asking_price() -> None:
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    listing = repository.get_listing("wr-001")
    assert listing is not None

    low_price_order = [
        item.id
        for item in select_comparables(
            repository,
            listing.model_copy(update={"price": 300_000}),
        ).items
    ]
    high_price_order = [
        item.id
        for item in select_comparables(
            repository,
            listing.model_copy(update={"price": 1_500_000}),
        ).items
    ]

    assert low_price_order == high_price_order
