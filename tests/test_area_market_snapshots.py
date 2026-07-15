from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.services.area_snapshots import run_area_market_snapshot_job


def test_area_market_snapshot_job_builds_current_area_snapshots() -> None:
    repository = InMemoryRealEstateRepository()

    result = run_area_market_snapshot_job(repository, dry_run=True)

    assert result.dry_run is True
    assert result.snapshots_created == 0
    assert len(result.snapshots) == 8
    assert [snapshot.area_id for snapshot in result.snapshots] == [
        "bielany-wroclawskie-bielany-wroclawskie",
        "kobierzyce-kobierzyce",
        "medlow-medlow",
        "olawa-olawa",
        "wroclaw-fabryczna",
        "wroclaw-krzyki",
        "wroclaw-psie-pole",
        "wysoka-wysoka",
    ]
    assert result.snapshots[0].median_price_per_m2 > 0
