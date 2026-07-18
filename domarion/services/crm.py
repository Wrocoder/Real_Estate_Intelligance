from datetime import UTC, datetime

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    CrmClient,
    CrmNote,
    CrmSharePreview,
    CrmShortlist,
    CrmShortlistItem,
    ListingAnalysis,
)
from domarion.services.scoring import build_listing_analysis

CRM_SHARE_DISCLAIMER = (
    "This shared shortlist is informational and based on Domarion analytical data. "
    "It is not financial, legal or investment advice. Confirm availability, legal "
    "status, building condition, fees and financing terms before making an offer."
)


def attach_crm_shortlist_items(
    shortlist: CrmShortlist,
    repository: RealEstateRepository,
) -> CrmShortlist:
    items = build_crm_shortlist_items(shortlist.listing_ids, repository)
    return shortlist.model_copy(update={"items": items})


def build_crm_shortlist_items(
    listing_ids: list[str],
    repository: RealEstateRepository,
) -> list[CrmShortlistItem]:
    analyses = _listing_analyses(listing_ids, repository)
    ranked = sorted(
        analyses,
        key=lambda analysis: (
            -_decision_score(analysis),
            analysis.scores.risk_score,
            analysis.scores.price_delta_to_fair_mid_pct,
            analysis.listing.id,
        ),
    )
    return [
        _shortlist_item(analysis, rank=rank)
        for rank, analysis in enumerate(ranked, start=1)
    ]


def build_crm_share_preview(
    *,
    client: CrmClient,
    shortlist: CrmShortlist,
    notes: list[CrmNote],
    repository: RealEstateRepository,
) -> CrmSharePreview:
    enriched = attach_crm_shortlist_items(shortlist, repository)
    return CrmSharePreview(
        share_token=enriched.share_token,
        share_url=enriched.share_url,
        title=enriched.title,
        client_display_name=client.display_name,
        client_message=enriched.client_message,
        items=enriched.items,
        client_shareable_notes=[
            note.body for note in notes if note.visibility == "client_shareable"
        ],
        generated_at=datetime.now(UTC),
        expires_at=enriched.expires_at,
        disclaimer=CRM_SHARE_DISCLAIMER,
    )


def crm_share_is_active(shortlist: CrmShortlist) -> bool:
    if not shortlist.share_enabled or shortlist.share_token is None:
        return False
    if shortlist.expires_at is not None and shortlist.expires_at <= datetime.now(UTC):
        return False
    return shortlist.status not in {"archived", "rejected"}


def missing_listing_ids(
    listing_ids: list[str],
    repository: RealEstateRepository,
) -> list[str]:
    return [listing_id for listing_id in listing_ids if repository.get_listing(listing_id) is None]


def _listing_analyses(
    listing_ids: list[str],
    repository: RealEstateRepository,
) -> list[ListingAnalysis]:
    analyses: list[ListingAnalysis] = []
    for listing_id in listing_ids:
        listing = repository.get_listing(listing_id)
        if listing is None:
            continue
        analyses.append(build_listing_analysis(repository, listing))
    return analyses


def _shortlist_item(analysis: ListingAnalysis, *, rank: int) -> CrmShortlistItem:
    listing = analysis.listing
    scores = analysis.scores
    reputation = analysis.developer_reputation
    return CrmShortlistItem(
        listing_id=listing.id,
        rank=rank,
        title=listing.title,
        address=listing.address,
        district=listing.district,
        city=listing.city,
        price=listing.price,
        currency=listing.currency,
        area_m2=listing.area_m2,
        rooms=listing.rooms,
        floor=listing.floor,
        building_floors=listing.building_floors,
        building_year=listing.building_year,
        market_type=listing.market_type,
        developer_id=listing.developer_id,
        developer_name=listing.developer_name,
        investment_name=listing.investment_name,
        developer_reputation_score=(
            reputation.reputation_score if reputation is not None else None
        ),
        developer_reputation_label=reputation.label if reputation is not None else None,
        decision_score=_decision_score(analysis),
        decision_label=scores.decision_label,
        investment_score=scores.investment_score,
        risk_score=scores.risk_score,
        negotiation_score=scores.negotiation_score,
        liquidity_score=scores.liquidity_score,
        rental_potential_score=scores.rental_potential_score,
        fair_price_mid_pln=scores.fair_price_mid,
        price_delta_to_fair_mid_pct=scores.price_delta_to_fair_mid_pct,
        recommendation=_recommendation(analysis),
        talking_points=scores.reasons[:3],
        cautions=(scores.warnings + analysis.data_quality_notes)[:4],
    )


def _decision_score(analysis: ListingAnalysis) -> int:
    scores = analysis.scores
    overpricing_penalty = max(scores.price_delta_to_fair_mid_pct, 0) * 0.55
    value = (
        scores.investment_score * 0.42
        + (100 - scores.risk_score) * 0.18
        + scores.liquidity_score * 0.18
        + scores.rental_potential_score * 0.12
        + scores.negotiation_score * 0.10
        - overpricing_penalty
    )
    return round(max(0, min(value, 100)))


def _recommendation(analysis: ListingAnalysis) -> str:
    scores = analysis.scores
    if scores.risk_score >= 70:
        return "High-risk candidate: verify legal, building and area constraints before viewing."
    if scores.price_delta_to_fair_mid_pct >= 12:
        return "Likely overpriced versus fair range; use for negotiation or wait for repricing."
    if scores.investment_score >= 75 and scores.liquidity_score >= 60:
        return "Strong shortlist candidate with balanced value, liquidity and risk signals."
    if scores.rental_potential_score >= 70:
        return "Good investor-fit candidate; confirm achievable rent and recurring costs."
    if scores.liquidity_score < 40:
        return "Possible fit, but resale liquidity may be weaker than average."
    return "Worth client review after confirming documents, monthly costs and real condition."
