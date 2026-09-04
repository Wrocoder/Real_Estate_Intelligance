import pytest
from fastapi.testclient import TestClient

from domarion.core.config import Settings, get_settings
from domarion.ingestion_admin_store.memory import InMemoryIngestionAdminStore
from domarion.main import app, create_app
from domarion.news_store.memory import InMemoryNewsStore
from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.scripts.seed_demo import seed_demo_data
from domarion.services.production_readiness import build_production_readiness_report


def test_memory_repository_is_empty_without_demo_opt_in() -> None:
    repository = InMemoryRealEstateRepository()

    assert repository.list_listings() == []
    assert repository.list_area_statistics() == []


def test_demo_repository_marks_every_listing_and_area() -> None:
    repository = InMemoryRealEstateRepository(include_demo_data=True)

    listings = repository.list_listings()
    areas = repository.list_area_statistics()

    assert listings
    assert areas
    assert {item.data_provenance.mode for item in listings} == {"demo"}
    assert {item.data_provenance.mode for item in areas} == {"demo"}
    assert {item.data_provenance.notice_code for item in [*listings, *areas]} == {
        "demo_data_not_market_evidence"
    }


def test_ingestion_source_registry_seeds_demo_only_when_enabled() -> None:
    live_store = InMemoryIngestionAdminStore()
    demo_store = InMemoryIngestionAdminStore(include_demo_data=True)

    assert not any(source.is_demo for source in live_store.list_sources())
    assert any(source.is_demo for source in demo_store.list_sources())


def test_news_fixtures_are_opt_in_and_expose_provenance() -> None:
    live_store = InMemoryNewsStore()
    demo_store = InMemoryNewsStore(include_demo_data=True)

    assert live_store.list_articles() == []
    demo_articles = demo_store.list_articles()
    assert demo_articles
    assert {article.data_provenance.mode for article in demo_articles} == {"demo"}


def test_production_readiness_blocks_active_demo_source() -> None:
    sources = InMemoryIngestionAdminStore(include_demo_data=True).list_sources()

    report = build_production_readiness_report(
        Settings(environment="production", demo_mode_enabled=False),
        env={},
        sources=sources,
    )

    check = next(item for item in report.checks if item.name == "demo_data_safety")
    assert report.status == "blocked"
    assert check.status == "fail"
    assert "Demo Partner" in check.message


def test_production_startup_rejects_demo_mode() -> None:
    with pytest.raises(RuntimeError, match="DEMO_MODE_ENABLED"):
        create_app(
            Settings(
                environment="production",
                demo_mode_enabled=True,
                data_repository_backend="memory",
            )
        )


def test_demo_startup_rejects_persistent_repository() -> None:
    with pytest.raises(RuntimeError, match="DATA_REPOSITORY_BACKEND=memory"):
        create_app(
            Settings(
                environment="development",
                demo_mode_enabled=True,
                data_repository_backend="postgres",
            )
        )


def test_demo_seed_requires_explicit_flag(monkeypatch) -> None:
    monkeypatch.setenv("DEMO_MODE_ENABLED", "false")
    get_settings.cache_clear()
    try:
        with pytest.raises(RuntimeError, match="explicit DEMO_MODE_ENABLED=true"):
            seed_demo_data()
    finally:
        get_settings.cache_clear()


def test_demo_runtime_and_listing_api_expose_machine_provenance() -> None:
    client = TestClient(app)

    runtime_response = client.get("/runtime-context")
    listings_response = client.get("/api/v1/listings")

    assert runtime_response.status_code == 200
    assert runtime_response.json() == {
        "data_mode": "demo",
        "demo_mode_enabled": True,
    }
    assert listings_response.status_code == 200
    items = listings_response.json()["items"]
    assert items
    assert {item["listing"]["data_provenance"]["mode"] for item in items} == {"demo"}
