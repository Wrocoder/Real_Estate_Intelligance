from pathlib import Path

from domarion.repositories.in_memory import InMemoryRealEstateRepository


def test_repository_list_listings_supports_normalized_text_query() -> None:
    repository = InMemoryRealEstateRepository()

    listings = repository.list_listings(query="Nowy Dwor")

    assert [listing.id for listing in listings] == ["wr-001"]
    assert "Nowy" in listings[0].address


def test_postgres_full_text_migration_declares_search_indexes() -> None:
    migration = Path("alembic/versions/0025_listing_full_text_indexes.py").read_text()

    assert "ix_listing_snapshots_listing_id" in migration
    assert "ix_listing_snapshots_full_text_gin" in migration
    assert "ix_properties_full_text_gin" in migration
    assert "USING GIN" in migration
    assert "to_tsvector" in migration
