from domarion.repositories.base import RealEstateRepository
from domarion.schemas import Alert, AlertFilters, AlertPreview, ListingAnalysis
from domarion.services.building_filters import matches_building_filters
from domarion.services.listing_text_search import listing_matches_query
from domarion.services.scoring import build_listing_analysis


def build_alert_preview(
    repository: RealEstateRepository,
    alert: Alert,
    limit: int = 10,
) -> AlertPreview:
    analyses = find_alert_matches(repository, alert.filters)
    return AlertPreview(
        alert=alert,
        matches=analyses[:limit],
        total_matches=len(analyses),
        applied_filters=alert.filters.model_dump(exclude_none=True),
    )


def find_alert_matches(
    repository: RealEstateRepository,
    filters: AlertFilters,
) -> list[ListingAnalysis]:
    listings = repository.list_listings(
        voivodeship=filters.voivodeship,
        city=filters.city,
        district=filters.district,
        municipality=filters.municipality,
        rooms=filters.rooms,
        max_price=filters.max_price,
        min_area_m2=filters.min_area_m2,
    )
    listings = [listing for listing in listings if listing_matches_query(listing, filters.query)]
    listings = [
        listing
        for listing in listings
        if matches_building_filters(
            listing,
            building_type=filters.building_type,
            renovation_state=filters.renovation_state,
            min_floor=filters.min_floor,
            max_floor=filters.max_floor,
            max_building_floors=filters.max_building_floors,
            min_building_year=filters.min_building_year,
            max_building_year=filters.max_building_year,
        )
    ]

    analyses = [build_listing_analysis(repository, listing) for listing in listings]

    if filters.min_investment_score is not None:
        analyses = [
            item
            for item in analyses
            if item.scores.investment_score >= filters.min_investment_score
        ]
    if filters.max_risk_score is not None:
        analyses = [item for item in analyses if item.scores.risk_score <= filters.max_risk_score]
    if filters.max_price_delta_to_fair_mid_pct is not None:
        analyses = [
            item
            for item in analyses
            if item.scores.price_delta_to_fair_mid_pct <= filters.max_price_delta_to_fair_mid_pct
        ]
    if filters.min_negotiation_score is not None:
        analyses = [
            item
            for item in analyses
            if item.scores.negotiation_score >= filters.min_negotiation_score
        ]
    if filters.min_liquidity_score is not None:
        analyses = [
            item for item in analyses if item.scores.liquidity_score >= filters.min_liquidity_score
        ]
    if filters.min_rental_potential_score is not None:
        analyses = [
            item
            for item in analyses
            if item.scores.rental_potential_score >= filters.min_rental_potential_score
        ]
    if filters.min_price_reductions is not None:
        analyses = [
            item
            for item in analyses
            if item.listing.price_reductions >= filters.min_price_reductions
        ]
    if filters.max_days_on_market is not None:
        analyses = [
            item for item in analyses if item.listing.days_on_market <= filters.max_days_on_market
        ]

    return sorted(
        analyses,
        key=lambda item: _alert_sort_key(item, filters),
    )


def _alert_sort_key(analysis: ListingAnalysis, filters: AlertFilters) -> tuple:
    scores = analysis.scores
    listing = analysis.listing
    if _has_advanced_investor_filters(filters):
        return (
            scores.price_delta_to_fair_mid_pct,
            -listing.price_reductions,
            -scores.rental_potential_score,
            -scores.liquidity_score,
            -scores.negotiation_score,
            -scores.investment_score,
            scores.risk_score,
            listing.price,
        )
    return (
        -scores.investment_score,
        scores.risk_score,
        listing.price,
    )


def _has_advanced_investor_filters(filters: AlertFilters) -> bool:
    return any(
        value is not None
        for value in (
            filters.max_price_delta_to_fair_mid_pct,
            filters.min_negotiation_score,
            filters.min_liquidity_score,
            filters.min_rental_potential_score,
            filters.min_price_reductions,
            filters.max_days_on_market,
        )
    )
