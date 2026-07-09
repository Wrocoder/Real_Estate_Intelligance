from statistics import median

from domarion.schemas import (
    AreaStatistics,
    Listing,
    ListingAnalysis,
    PropertyScores,
    ScoreBreakdown,
)


def clamp(value: float, minimum: int = 0, maximum: int = 100) -> int:
    return int(max(minimum, min(maximum, round(value))))


def calculate_scores(
    listing: Listing,
    area_statistics: AreaStatistics,
    comparables: list[Listing],
) -> PropertyScores:
    median_price = area_statistics.median_price_per_m2
    price_delta_pct = ((listing.price_per_m2 / median_price) - 1) * 100

    comparable_prices = [item.price_per_m2 for item in comparables] or [median_price]
    comparable_median = int(median(comparable_prices))
    fair_price_mid = int(((median_price * 0.65) + (comparable_median * 0.35)) * listing.area_m2)
    fair_price_low = int(fair_price_mid * 0.94)
    fair_price_high = int(fair_price_mid * 1.06)
    price_delta_to_fair_mid_pct = ((listing.price / fair_price_mid) - 1) * 100

    price_position = clamp(70 - price_delta_pct * 2.2)
    area_trend = clamp(50 + area_statistics.price_change_90d_pct * 6)
    transport = clamp(100 - max(0, listing.nearest_stop_m - 200) / 8)
    future_infrastructure = clamp(45 + listing.planned_investments_within_2km * 13)
    liquidity = clamp(
        100
        - area_statistics.average_days_on_market * 0.45
        + max(0, area_statistics.removed_listings_30d - area_statistics.new_listings_30d) * 0.2
    )
    lifestyle_infrastructure = clamp(
        35
        + listing.schools_within_1km * 12
        + listing.parks_within_1km * 10
        - max(0, listing.nearest_school_m - 700) / 20
    )
    rental_potential = clamp(
        55
        + (100 - min(listing.nearest_stop_m, 1000) / 10) * 0.25
        + listing.schools_within_1km * 3
        - max(0, listing.distance_to_center_km - 6) * 2.5
    )

    pricing_risk = clamp(max(0, price_delta_pct) * 3.5)
    market_risk = clamp(
        listing.days_on_market * 0.28
        + listing.price_reductions * 8
        + max(0, area_statistics.supply_change_90d_pct) * 1.3
    )
    location_risk = clamp(
        max(0, 700 - listing.nearest_major_road_m) / 12
        + max(0, 1500 - listing.nearest_industrial_zone_m) / 25
        + max(0, listing.nearest_stop_m - 700) / 8
    )
    building_risk = clamp(
        (15 if listing.floor == 0 else 0)
        + (12 if listing.building_floors and listing.floor == listing.building_floors else 0)
        + (10 if listing.building_year and listing.building_year < 1980 else 0)
    )
    data_risk = clamp(100 - listing.data_quality_score)
    risk_score = clamp(
        pricing_risk * 0.27
        + market_risk * 0.26
        + location_risk * 0.24
        + building_risk * 0.10
        + data_risk * 0.13
    )

    risk_penalty = clamp(risk_score * 0.65)
    investment_score = clamp(
        price_position * 0.20
        + area_trend * 0.15
        + transport * 0.15
        + future_infrastructure * 0.15
        + liquidity * 0.10
        + lifestyle_infrastructure * 0.10
        + rental_potential * 0.10
        + listing.data_quality_score * 0.05
        - risk_penalty * 0.25
    )

    negotiation_score = clamp(
        20
        + listing.days_on_market * 0.35
        + listing.price_reductions * 12
        + max(0, price_delta_pct) * 2
        + (12 if listing.relisted else 0)
        + max(0, area_statistics.supply_change_90d_pct) * 1.2
    )

    reasons = []
    warnings = []

    if price_delta_pct < -5:
        reasons.append("Цена за m2 ниже медианы района.")
    if listing.planned_investments_within_2km >= 2:
        reasons.append("Рядом есть несколько planned investments в радиусе 2 км.")
    if listing.nearest_stop_m <= 400:
        reasons.append("Хорошая транспортная доступность по расстоянию до остановки.")
    if listing.price_reductions > 0:
        reasons.append("Цена уже снижалась, это усиливает переговорную позицию.")

    if price_delta_pct > 10:
        warnings.append("Цена за m2 заметно выше медианы района.")
    if listing.days_on_market > area_statistics.average_days_on_market * 1.5:
        warnings.append("Объект находится на рынке существенно дольше среднего по району.")
    if listing.nearest_industrial_zone_m < 1500:
        warnings.append("Промышленная зона находится относительно близко.")
    if listing.data_quality_score < 70:
        warnings.append("Качество данных ниже желательного уровня, выводы нужно перепроверить.")

    return PropertyScores(
        investment_score=investment_score,
        risk_score=risk_score,
        negotiation_score=negotiation_score,
        liquidity_score=liquidity,
        rental_potential_score=rental_potential,
        fair_price_low=fair_price_low,
        fair_price_mid=fair_price_mid,
        fair_price_high=fair_price_high,
        price_delta_to_fair_mid_pct=round(price_delta_to_fair_mid_pct, 1),
        breakdown=ScoreBreakdown(
            price_position=price_position,
            area_trend=area_trend,
            transport=transport,
            future_infrastructure=future_infrastructure,
            liquidity=liquidity,
            lifestyle_infrastructure=lifestyle_infrastructure,
            rental_potential=rental_potential,
            data_quality=listing.data_quality_score,
            risk_penalty=risk_penalty,
        ),
        reasons=reasons,
        warnings=warnings,
    )


def build_listing_analysis(repository, listing: Listing) -> ListingAnalysis:
    area_statistics = repository.get_area_statistics(listing.area_id)
    if area_statistics is None:
        raise ValueError(f"Missing area statistics for {listing.area_id}")

    price_history = repository.get_price_history(listing.id)
    comparables = repository.find_comparables(listing)
    scores = calculate_scores(listing, area_statistics, comparables)

    insights = [
        (
            f"Объект стоит {listing.price_per_m2} PLN/m2 при медиане района "
            f"{area_statistics.median_price_per_m2} PLN/m2."
        ),
        (
            f"Среднее время экспозиции в районе: {area_statistics.average_days_on_market} дней; "
            f"этот объект на рынке {listing.days_on_market} дней."
        ),
        (
            f"За 90 дней цена района изменилась на {area_statistics.price_change_90d_pct}%, "
            f"а предложение на {area_statistics.supply_change_90d_pct}%."
        ),
    ]

    if comparables:
        insights.append(f"Для первичного сравнения найдено {len(comparables)} похожих объекта.")
    else:
        insights.append("Похожих объектов в MVP-выборке недостаточно для сильного сравнения.")

    negotiation_arguments = []
    if listing.days_on_market > area_statistics.average_days_on_market:
        negotiation_arguments.append("Объект продается дольше среднего по району.")
    if listing.price_reductions:
        negotiation_arguments.append(f"Цена снижалась {listing.price_reductions} раз(а).")
    if scores.price_delta_to_fair_mid_pct > 5:
        negotiation_arguments.append("Текущая цена выше середины расчетного fair price диапазона.")
    if area_statistics.supply_change_90d_pct > 5:
        negotiation_arguments.append(
            "Предложение в районе растет, что может усиливать позицию покупателя."
        )
    if not negotiation_arguments:
        negotiation_arguments.append(
            "Сильных автоматических аргументов для торга в MVP-данных нет."
        )

    data_quality_notes = [
        f"Data Quality Score: {listing.data_quality_score}/100.",
        "Расчеты основаны на MVP-данных и требуют проверки источников перед реальной сделкой.",
    ]

    return ListingAnalysis(
        listing=listing,
        area_statistics=area_statistics,
        price_history=price_history,
        comparables=comparables,
        scores=scores,
        insights=insights,
        negotiation_arguments=negotiation_arguments,
        data_quality_notes=data_quality_notes,
    )
