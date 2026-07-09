from domarion.repositories.base import RealEstateRepository
from domarion.schemas import Alert, AlertFilters, AlertPreview, ListingAnalysis
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
        city=filters.city,
        district=filters.district,
        rooms=filters.rooms,
        max_price=filters.max_price,
        min_area_m2=filters.min_area_m2,
    )

    analyses = [build_listing_analysis(repository, listing) for listing in listings]

    if filters.min_investment_score is not None:
        analyses = [
            item
            for item in analyses
            if item.scores.investment_score >= filters.min_investment_score
        ]
    if filters.max_risk_score is not None:
        analyses = [item for item in analyses if item.scores.risk_score <= filters.max_risk_score]

    return sorted(
        analyses,
        key=lambda item: (
            -item.scores.investment_score,
            item.scores.risk_score,
            item.listing.price,
        ),
    )

