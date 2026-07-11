from statistics import mean, median

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    AreaStatistics,
    Listing,
    MarketDashboard,
    MarketDashboardArea,
    MarketDistributionBucket,
)

PRICE_BUCKETS = (
    (None, 400_000, "<= 400k"),
    (400_000, 600_000, "400-600k"),
    (600_000, 800_000, "600-800k"),
    (800_000, 1_000_000, "800k-1M"),
    (1_000_000, 1_200_000, "1M-1.2M"),
    (1_200_000, None, "> 1.2M"),
)
PRICE_PER_M2_BUCKETS = (
    (None, 8_000, "<= 8k/m2"),
    (8_000, 10_000, "8-10k/m2"),
    (10_000, 12_000, "10-12k/m2"),
    (12_000, 14_000, "12-14k/m2"),
    (14_000, 16_000, "14-16k/m2"),
    (16_000, None, "> 16k/m2"),
)
AREA_BUCKETS = (
    (None, 35, "<= 35 m2"),
    (35, 50, "35-50 m2"),
    (50, 65, "50-65 m2"),
    (65, 80, "65-80 m2"),
    (80, 100, "80-100 m2"),
    (100, None, "> 100 m2"),
)


def build_market_dashboard(
    repository: RealEstateRepository,
    *,
    city: str | None = None,
    district: str | None = None,
) -> MarketDashboard:
    listings = repository.list_listings(city=city, district=district)
    area_statistics = _filter_area_statistics(repository.list_area_statistics(), city, district)

    return MarketDashboard(
        city=city,
        district=district,
        listings_count=len(listings),
        active_listings=_sum_area_stat(area_statistics, "active_listings", fallback=len(listings)),
        new_listings_30d=_sum_area_stat(area_statistics, "new_listings_30d"),
        removed_listings_30d=_sum_area_stat(area_statistics, "removed_listings_30d"),
        average_days_on_market=_average_days_on_market(listings, area_statistics),
        median_price=_median_int([item.price for item in listings]),
        median_price_per_m2=_median_int([item.price_per_m2 for item in listings]),
        average_price_per_m2=_mean_int([item.price_per_m2 for item in listings]),
        price_change_90d_pct=_mean_float([area.price_change_90d_pct for area in area_statistics]),
        supply_change_90d_pct=_mean_float([area.supply_change_90d_pct for area in area_statistics]),
        price_distribution=_bucket_values(listings, "price", PRICE_BUCKETS),
        price_per_m2_distribution=_bucket_values(
            listings,
            "price_per_m2",
            PRICE_PER_M2_BUCKETS,
        ),
        rooms_distribution=_rooms_distribution(listings),
        area_distribution=_bucket_values(listings, "area_m2", AREA_BUCKETS),
        areas=[_area_dashboard_item(area) for area in area_statistics],
    )


def _filter_area_statistics(
    area_statistics: list[AreaStatistics],
    city: str | None,
    district: str | None,
) -> list[AreaStatistics]:
    items = area_statistics
    if city:
        items = [area for area in items if area.city.lower() == city.lower()]
    if district:
        items = [area for area in items if area.name.lower() == district.lower()]
    return items


def _area_dashboard_item(area: AreaStatistics) -> MarketDashboardArea:
    return MarketDashboardArea(
        **area.model_dump(),
        liquidity_index=_liquidity_index(area),
        overheated_index=_overheated_index(area),
        buyer_market_index=_buyer_market_index(area),
        seller_market_index=_seller_market_index(area),
    )


def _liquidity_index(area: AreaStatistics) -> int:
    exposure_score = 100 - min(area.average_days_on_market, 180) / 180 * 70
    supply_score = min(area.active_listings, 100) / 100 * 30
    return _clamp_score(exposure_score + supply_score)


def _overheated_index(area: AreaStatistics) -> int:
    price_growth = max(area.price_change_90d_pct, 0) * 6
    supply_pressure = max(-area.supply_change_90d_pct, 0) * 2
    low_exposure = max(90 - area.average_days_on_market, 0) / 90 * 25
    return _clamp_score(price_growth + supply_pressure + low_exposure)


def _buyer_market_index(area: AreaStatistics) -> int:
    supply_growth = max(area.supply_change_90d_pct, 0) * 3
    price_softness = max(-area.price_change_90d_pct, 0) * 8
    long_exposure = min(area.average_days_on_market, 180) / 180 * 35
    removed_pressure = min(area.removed_listings_30d, 50) / 50 * 15
    return _clamp_score(supply_growth + price_softness + long_exposure + removed_pressure)


def _seller_market_index(area: AreaStatistics) -> int:
    price_growth = max(area.price_change_90d_pct, 0) * 8
    supply_tightness = max(-area.supply_change_90d_pct, 0) * 3
    short_exposure = max(120 - area.average_days_on_market, 0) / 120 * 35
    absorption = min(area.removed_listings_30d, 80) / 80 * 20
    return _clamp_score(price_growth + supply_tightness + short_exposure + absorption)


def _bucket_values(
    listings: list[Listing],
    attr: str,
    buckets: tuple[tuple[float | None, float | None, str], ...],
) -> list[MarketDistributionBucket]:
    values = [float(getattr(item, attr)) for item in listings]
    result = []
    for min_value, max_value, label in buckets:
        count = sum(1 for value in values if _in_bucket(value, min_value, max_value))
        result.append(
            MarketDistributionBucket(
                label=label,
                count=count,
                min_value=min_value,
                max_value=max_value,
            )
        )
    return result


def _rooms_distribution(listings: list[Listing]) -> list[MarketDistributionBucket]:
    if not listings:
        return []

    room_values = sorted({item.rooms for item in listings})
    return [
        MarketDistributionBucket(
            label=f"{rooms} pok.",
            count=sum(1 for item in listings if item.rooms == rooms),
            min_value=rooms,
            max_value=rooms,
        )
        for rooms in room_values
    ]


def _in_bucket(value: float, min_value: float | None, max_value: float | None) -> bool:
    if min_value is not None and value <= min_value:
        return False
    if max_value is not None and value > max_value:
        return False
    return True


def _sum_area_stat(
    area_statistics: list[AreaStatistics],
    attr: str,
    fallback: int = 0,
) -> int:
    if not area_statistics:
        return fallback
    return sum(int(getattr(area, attr)) for area in area_statistics)


def _average_days_on_market(
    listings: list[Listing],
    area_statistics: list[AreaStatistics],
) -> int:
    if area_statistics:
        return round(mean(area.average_days_on_market for area in area_statistics))
    return _mean_int([listing.days_on_market for listing in listings]) or 0


def _median_int(values: list[int | float]) -> int | None:
    if not values:
        return None
    return round(median(values))


def _mean_int(values: list[int | float]) -> int | None:
    if not values:
        return None
    return round(mean(values))


def _mean_float(values: list[float]) -> float | None:
    if not values:
        return None
    return round(mean(values), 2)


def _clamp_score(value: float) -> int:
    return round(min(max(value, 0), 100))
