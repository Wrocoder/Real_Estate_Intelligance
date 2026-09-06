from datetime import UTC, datetime
from types import SimpleNamespace

from domarion.api.routes import get_coverage
from domarion.schemas import AreaStatistics, DataProvenance


def _area(area_id: str, name: str, *, updated_at: datetime) -> AreaStatistics:
    return AreaStatistics(
        area_id=area_id,
        name=name,
        city="Wrocław",
        data_provenance=DataProvenance(
            source_type="transaction_register",
            source_name="RCN GUGiK",
            calculation_type="calculated",
            sample_size=42,
            geographic_scope=name,
            time_range="2024-01-01–2026-08-31",
            updated_at=updated_at,
        ),
        median_price_per_m2=12_000,
        average_price_per_m2=12_300,
        active_listings=0,
        new_listings_30d=0,
        removed_listings_30d=0,
        average_days_on_market=0,
        price_change_90d_pct=0,
        supply_change_90d_pct=0,
        price_basis="transaction_observed",
        listing_metrics_available=False,
        transaction_observation_count=42,
        transaction_median_price_per_m2=12_000,
    )


def test_coverage_uses_persisted_source_refresh_and_excludes_city_aggregate() -> None:
    updated_at = datetime(2026, 9, 5, 12, 30, tzinfo=UTC)
    repository = SimpleNamespace(
        list_area_statistics=lambda: [
            _area("wroclaw-city", "Wrocław", updated_at=updated_at),
            _area("wroclaw-borek", "Borek", updated_at=updated_at),
        ]
    )

    coverage = get_coverage(repository)

    assert coverage.source_name == "RCN GUGiK"
    assert coverage.checked_at == updated_at
    assert coverage.supported_cities == ["Wrocław"]
    assert coverage.supported_districts == ["Wrocław: Borek"]
