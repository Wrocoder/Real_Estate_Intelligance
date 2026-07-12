from statistics import mean, median

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import AreaComparison, AreaComparisonItem, MarketDashboardArea
from domarion.services.market_dashboard import build_market_dashboard

AREA_COMPARISON_SORTS = {
    "value",
    "growth",
    "buyer_market",
    "seller_market",
    "liquidity",
    "price_asc",
    "price_desc",
}


def build_area_comparison(
    repository: RealEstateRepository,
    *,
    city: str | None = None,
    sort: str = "value",
    limit: int = 20,
) -> AreaComparison:
    if sort not in AREA_COMPARISON_SORTS:
        raise ValueError(f"Unsupported area comparison sort: {sort}")

    dashboard = build_market_dashboard(repository, city=city)
    areas = dashboard.areas
    city_median_price_per_m2 = _median_int([area.median_price_per_m2 for area in areas])
    city_average_days_on_market = _mean_int([area.average_days_on_market for area in areas])
    city_active_listings = sum(area.active_listings for area in areas)
    items = [
        _comparison_item(
            area,
            city_median_price_per_m2=city_median_price_per_m2,
            city_average_days_on_market=city_average_days_on_market,
            city_active_listings=city_active_listings,
        )
        for area in areas
    ]
    sorted_items = sorted(items, key=lambda item: _sort_key(item, sort), reverse=_sort_desc(sort))
    limited_items = sorted_items[:limit]

    return AreaComparison(
        city=city,
        sort=sort,
        area_count=len(items),
        city_median_price_per_m2=city_median_price_per_m2,
        city_average_days_on_market=city_average_days_on_market,
        city_active_listings=city_active_listings,
        top_value_area_id=_top_area_id(items, "value_index"),
        top_growth_area_id=_top_area_id(items, "growth_index"),
        top_buyer_market_area_id=_top_area_id(items, "buyer_market_index"),
        top_liquidity_area_id=_top_area_id(items, "liquidity_index"),
        areas=limited_items,
    )


def _comparison_item(
    area: MarketDashboardArea,
    *,
    city_median_price_per_m2: int | None,
    city_average_days_on_market: int | None,
    city_active_listings: int,
) -> AreaComparisonItem:
    price_gap = _pct_delta(area.median_price_per_m2, city_median_price_per_m2)
    days_gap = _pct_delta(area.average_days_on_market, city_average_days_on_market)
    active_share = (
        round(area.active_listings / city_active_listings * 100, 1)
        if city_active_listings
        else 0.0
    )
    value_index = _value_index(area, price_gap)
    growth_index = _growth_index(area)
    market_label = _market_label(area)

    return AreaComparisonItem(
        **area.model_dump(),
        value_index=value_index,
        growth_index=growth_index,
        price_per_m2_vs_city_pct=price_gap,
        days_on_market_vs_city_pct=days_gap,
        active_share_pct=active_share,
        market_label=market_label,
        summary=_summary(area, price_gap, days_gap, value_index, growth_index, market_label),
    )


def _value_index(area: MarketDashboardArea, price_gap: float | None) -> int:
    affordability = -(price_gap or 0) * 1.15
    score = (
        50
        + affordability
        + area.buyer_market_index * 0.22
        + area.liquidity_index * 0.16
        - area.overheated_index * 0.18
    )
    return _clamp_score(score)


def _growth_index(area: MarketDashboardArea) -> int:
    score = (
        45
        + max(area.price_change_90d_pct, 0) * 5.5
        + area.seller_market_index * 0.18
        + area.liquidity_index * 0.18
        - max(area.supply_change_90d_pct, 0) * 1.2
        - area.overheated_index * 0.08
    )
    return _clamp_score(score)


def _market_label(area: MarketDashboardArea) -> str:
    if area.overheated_index >= 70:
        return "overheated"
    if area.buyer_market_index >= area.seller_market_index + 12:
        return "buyer_market"
    if area.seller_market_index >= area.buyer_market_index + 12:
        return "seller_market"
    return "balanced"


def _summary(
    area: MarketDashboardArea,
    price_gap: float | None,
    days_gap: float | None,
    value_index: int,
    growth_index: int,
    market_label: str,
) -> str:
    price_text = _gap_text(price_gap, "city median")
    days_text = _gap_text(days_gap, "city average DOM")
    if market_label == "buyer_market":
        market_text = "buyer leverage is stronger than seller pressure"
    elif market_label == "seller_market":
        market_text = "seller pressure is stronger than buyer leverage"
    elif market_label == "overheated":
        market_text = "overheating risk is elevated"
    else:
        market_text = "buyer and seller pressure is balanced"
    return (
        f"{area.name}: {price_text}, {days_text}; {market_text}. "
        f"Value {value_index}/100, growth {growth_index}/100."
    )


def _gap_text(value: float | None, baseline: str) -> str:
    if value is None:
        return f"no {baseline} baseline"
    if abs(value) < 0.1:
        return f"near {baseline}"
    direction = "above" if value > 0 else "below"
    return f"{abs(value):.1f}% {direction} {baseline}"


def _sort_key(item: AreaComparisonItem, sort: str) -> tuple[float | int, str]:
    if sort == "growth":
        return (item.growth_index, item.name)
    if sort == "buyer_market":
        return (item.buyer_market_index, item.name)
    if sort == "seller_market":
        return (item.seller_market_index, item.name)
    if sort == "liquidity":
        return (item.liquidity_index, item.name)
    if sort in {"price_asc", "price_desc"}:
        return (item.median_price_per_m2, item.name)
    return (item.value_index, item.name)


def _sort_desc(sort: str) -> bool:
    return sort != "price_asc"


def _top_area_id(items: list[AreaComparisonItem], attr: str) -> str | None:
    if not items:
        return None
    return max(items, key=lambda item: getattr(item, attr)).area_id


def _pct_delta(value: int | float, baseline: int | float | None) -> float | None:
    if baseline is None or baseline == 0:
        return None
    return round((value - baseline) / baseline * 100, 1)


def _median_int(values: list[int | float]) -> int | None:
    if not values:
        return None
    return round(median(values))


def _mean_int(values: list[int | float]) -> int | None:
    if not values:
        return None
    return round(mean(values))


def _clamp_score(value: float) -> int:
    return round(min(max(value, 0), 100))
