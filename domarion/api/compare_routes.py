from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from domarion.auth import CurrentAccount, CurrentAccountDep
from domarion.repositories.base import RealEstateRepository
from domarion.repositories.factory import get_repository
from domarion.schemas import (
    CompareRequest,
    CompareResponse,
    ListingAnalysis,
    PurchaseIntent,
    RealtorClientShortlist,
    RealtorClientShortlistRequest,
)
from domarion.services.listing_comparison import build_listing_comparison
from domarion.services.realtor_shortlists import build_realtor_client_shortlist
from domarion.services.scoring import build_listing_analysis
from domarion.user_store.base import UserStore
from domarion.user_store.factory import get_user_store

router = APIRouter()
RepositoryDep = Annotated[RealEstateRepository, Depends(get_repository)]
UserStoreDep = Annotated[UserStore, Depends(get_user_store)]


@router.post("/compare", response_model=CompareResponse)
def compare_listings(
    payload: CompareRequest,
    repository: RepositoryDep,
    user_store: UserStoreDep,
    account: CurrentAccountDep,
) -> CompareResponse:
    buyer_profile = user_store.get_buyer_profile(account.user.id)
    purchase_intent = (
        buyer_profile.intent
        if payload.purchase_intent == "unsure"
        and buyer_profile is not None
        and buyer_profile.intent != "unsure"
        else payload.purchase_intent
    )
    analyses, missing_ids = _resolve_compare_analyses(
        payload.listing_ids,
        repository,
        account,
        purchase_intent=purchase_intent,
    )
    if len(analyses) < 2:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "listing_not_found",
                "missing_listing_ids": missing_ids,
                "available_listing_ids": [analysis.listing.id for analysis in analyses],
            },
        )

    try:
        return build_listing_comparison(
            analyses,
            purchase_intent=purchase_intent,
            buyer_profile=buyer_profile,
            requested_listing_ids=payload.listing_ids,
            unavailable_listing_ids=missing_ids,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/realtor/client-shortlists/preview", response_model=RealtorClientShortlist)
def build_realtor_client_shortlist_preview(
    payload: RealtorClientShortlistRequest,
    repository: RepositoryDep,
    account: CurrentAccountDep,
) -> RealtorClientShortlist:
    analyses = build_compare_analyses(payload.listing_ids, repository, account)
    try:
        return build_realtor_client_shortlist(
            analyses=analyses,
            request=payload,
            agent_name=account.user.display_name,
            agent_email=account.user.email,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def build_compare_analyses(
    listing_ids: list[str],
    repository: RealEstateRepository,
    account: CurrentAccount,
    *,
    purchase_intent: PurchaseIntent = "unsure",
) -> list[ListingAnalysis]:
    analyses, missing_ids = _resolve_compare_analyses(
        listing_ids,
        repository,
        account,
        purchase_intent=purchase_intent,
    )
    if missing_ids:
        raise HTTPException(
            status_code=404,
            detail={"code": "listing_not_found", "missing_listing_ids": missing_ids},
        )
    return analyses


def _resolve_compare_analyses(
    listing_ids: list[str],
    repository: RealEstateRepository,
    account: CurrentAccount,
    *,
    purchase_intent: PurchaseIntent = "unsure",
) -> tuple[list[ListingAnalysis], list[str]]:
    if len(listing_ids) > account.limits.max_compare_items:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "plan_limit_reached",
                "resource": "compare_items",
                "plan": account.subscription.plan,
                "limit": account.limits.max_compare_items,
            },
        )

    analyses: list[ListingAnalysis] = []
    missing_ids: list[str] = []
    for listing_id in listing_ids:
        listing = repository.get_listing(listing_id)
        if listing is None:
            missing_ids.append(listing_id)
            continue
        analyses.append(
            build_listing_analysis(
                repository,
                listing,
                purchase_intent=purchase_intent,
            )
        )

    return analyses, missing_ids
