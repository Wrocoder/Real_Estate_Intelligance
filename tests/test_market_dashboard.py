import pytest
from fastapi.testclient import TestClient

from domarion.main import app
from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.services.area_comparison import build_area_comparison
from domarion.services.market_dashboard import build_market_dashboard

client = TestClient(app)


def test_market_dashboard_builds_city_summary_and_distributions() -> None:
    dashboard = build_market_dashboard(InMemoryRealEstateRepository(), city="Wrocław")

    assert dashboard.city == "Wrocław"
    assert dashboard.listings_count >= 3
    assert dashboard.active_listings >= dashboard.listings_count
    assert dashboard.median_price is not None
    assert dashboard.median_price_per_m2 is not None
    assert dashboard.price_change_90d_pct is not None
    assert sum(bucket.count for bucket in dashboard.price_distribution) == dashboard.listings_count
    assert sum(bucket.count for bucket in dashboard.price_per_m2_distribution) == (
        dashboard.listings_count
    )
    assert sum(bucket.count for bucket in dashboard.rooms_distribution) == dashboard.listings_count
    assert sum(bucket.count for bucket in dashboard.area_distribution) == dashboard.listings_count
    assert dashboard.areas
    assert all(0 <= area.liquidity_index <= 100 for area in dashboard.areas)
    assert all(0 <= area.overheated_index <= 100 for area in dashboard.areas)
    assert all(0 <= area.buyer_market_index <= 100 for area in dashboard.areas)
    assert all(0 <= area.seller_market_index <= 100 for area in dashboard.areas)


def test_market_dashboard_filters_by_district() -> None:
    dashboard = build_market_dashboard(
        InMemoryRealEstateRepository(),
        city="Wrocław",
        district="Fabryczna",
    )

    assert dashboard.district == "Fabryczna"
    assert dashboard.listings_count >= 1
    assert [area.name for area in dashboard.areas] == ["Fabryczna"]


def test_market_dashboard_api_returns_public_dashboard() -> None:
    response = client.get(
        "/api/v1/market/dashboard",
        params={"city": "Wrocław", "district": "Fabryczna"},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["city"] == "Wrocław"
    assert payload["district"] == "Fabryczna"
    assert payload["listings_count"] >= 1
    assert payload["price_distribution"]
    assert payload["areas"][0]["name"] == "Fabryczna"
    assert 0 <= payload["areas"][0]["seller_market_index"] <= 100


def test_market_dashboard_api_handles_empty_market() -> None:
    response = client.get("/api/v1/market/dashboard", params={"city": "Missing"})
    payload = response.json()

    assert response.status_code == 200
    assert payload["listings_count"] == 0
    assert payload["active_listings"] == 0
    assert payload["median_price"] is None
    assert sum(bucket["count"] for bucket in payload["price_distribution"]) == 0
    assert payload["rooms_distribution"] == []
    assert payload["areas"] == []


def test_area_comparison_builds_ranked_city_baseline() -> None:
    comparison = build_area_comparison(
        InMemoryRealEstateRepository(),
        city="Wrocław",
        sort="value",
    )

    assert comparison.city == "Wrocław"
    assert comparison.area_count >= 3
    assert comparison.city_median_price_per_m2 is not None
    assert comparison.city_average_days_on_market is not None
    assert comparison.city_active_listings > 0
    assert comparison.top_value_area_id
    assert comparison.top_growth_area_id
    assert comparison.top_buyer_market_area_id
    assert comparison.top_liquidity_area_id
    assert [area.value_index for area in comparison.areas] == sorted(
        [area.value_index for area in comparison.areas],
        reverse=True,
    )
    assert all(0 <= area.value_index <= 100 for area in comparison.areas)
    assert all(0 <= area.growth_index <= 100 for area in comparison.areas)
    assert all(area.summary for area in comparison.areas)


def test_area_comparison_supports_price_sort_and_limit() -> None:
    comparison = build_area_comparison(
        InMemoryRealEstateRepository(),
        city="Wrocław",
        sort="price_asc",
        limit=2,
    )

    assert len(comparison.areas) == 2
    assert [area.median_price_per_m2 for area in comparison.areas] == sorted(
        [area.median_price_per_m2 for area in comparison.areas]
    )


def test_area_comparison_rejects_unknown_sort() -> None:
    with pytest.raises(ValueError, match="Unsupported area comparison sort"):
        build_area_comparison(InMemoryRealEstateRepository(), sort="unknown")


def test_area_comparison_api_returns_public_comparison() -> None:
    response = client.get(
        "/api/v1/areas/compare",
        params={"city": "Wrocław", "sort": "buyer_market", "limit": 2},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["city"] == "Wrocław"
    assert payload["sort"] == "buyer_market"
    assert payload["area_count"] >= 3
    assert len(payload["areas"]) == 2
    assert payload["areas"][0]["buyer_market_index"] >= payload["areas"][1][
        "buyer_market_index"
    ]


def test_area_comparison_api_rejects_unknown_sort() -> None:
    response = client.get("/api/v1/areas/compare", params={"sort": "unknown"})

    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported area comparison sort: unknown"
