from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import HTMLResponse, Response

from domarion.auth import CurrentAccount, CurrentAccountDep
from domarion.auth_store.base import AuthStore
from domarion.auth_store.factory import get_auth_store
from domarion.report_store.base import ReportStore
from domarion.report_store.factory import get_report_store
from domarion.repositories.base import RealEstateRepository
from domarion.repositories.factory import get_repository
from domarion.schemas import (
    AccountSummary,
    AccountUsage,
    Alert,
    AlertCreate,
    AlertPreview,
    AlertUpdate,
    AreaStatistics,
    CompareRequest,
    CompareResponse,
    Favorite,
    FavoriteCreate,
    FavoriteUpdate,
    GeneratedReport,
    GeneratedReportListItem,
    GenerateReportRequest,
    Listing,
    ListingAnalysis,
    MapFeatureCollection,
    ObjectReport,
    PlanLimits,
    ReportAudience,
    ReportRequest,
    SubscriptionUpdate,
)
from domarion.services.alerts import build_alert_preview
from domarion.services.geo import MapQueryError, build_map_feature_collection, parse_bbox
from domarion.services.plans import get_plan_limits, list_plan_limits
from domarion.services.report_generation import (
    generate_and_store_object_report,
    generate_object_report_html,
)
from domarion.services.reports import build_object_report
from domarion.services.scoring import build_listing_analysis
from domarion.user_store.base import UserStore
from domarion.user_store.factory import get_user_store

router = APIRouter(prefix="/api/v1")
RepositoryDep = Annotated[RealEstateRepository, Depends(get_repository)]
ReportStoreDep = Annotated[ReportStore, Depends(get_report_store)]
UserStoreDep = Annotated[UserStore, Depends(get_user_store)]
AuthStoreDep = Annotated[AuthStore, Depends(get_auth_store)]


@router.get("/listings", response_model=list[Listing])
def list_listings(
    repository: RepositoryDep,
    city: Annotated[str | None, Query(description="City name, for example Wrocław")] = None,
    district: Annotated[str | None, Query(description="District or estate name")] = None,
    rooms: Annotated[int | None, Query(ge=1, le=10)] = None,
    max_price: Annotated[int | None, Query(gt=0)] = None,
    min_area_m2: Annotated[float | None, Query(gt=0)] = None,
) -> list[Listing]:
    return repository.list_listings(
        city=city,
        district=district,
        rooms=rooms,
        max_price=max_price,
        min_area_m2=min_area_m2,
    )


@router.get("/areas", response_model=list[AreaStatistics])
def list_areas(repository: RepositoryDep) -> list[AreaStatistics]:
    return repository.list_area_statistics()


@router.get("/plans", response_model=list[PlanLimits])
def list_plans() -> list[PlanLimits]:
    return list_plan_limits()


@router.get("/me", response_model=AccountSummary)
def get_me(
    account: CurrentAccountDep,
    user_store: UserStoreDep,
    report_store: ReportStoreDep,
) -> AccountSummary:
    return _build_account_summary(account, user_store, report_store)


@router.patch("/me/subscription", response_model=AccountSummary)
def update_my_subscription(
    payload: SubscriptionUpdate,
    account: CurrentAccountDep,
    auth_store: AuthStoreDep,
    user_store: UserStoreDep,
    report_store: ReportStoreDep,
) -> AccountSummary:
    subscription = auth_store.update_subscription(account.user.id, payload)
    updated_account = CurrentAccount(
        user=account.user,
        subscription=subscription,
        limits=get_plan_limits(subscription.plan),
    )
    return _build_account_summary(updated_account, user_store, report_store)


@router.get("/map/features", response_model=MapFeatureCollection)
def get_map_features(
    repository: RepositoryDep,
    city: Annotated[str | None, Query(description="City name, for example Wrocław")] = None,
    district: Annotated[str | None, Query(description="District or estate name")] = None,
    rooms: Annotated[int | None, Query(ge=1, le=10)] = None,
    max_price: Annotated[int | None, Query(gt=0)] = None,
    min_area_m2: Annotated[float | None, Query(gt=0)] = None,
    bbox: Annotated[
        str | None,
        Query(description="Optional map viewport: min_lon,min_lat,max_lon,max_lat"),
    ] = None,
    lat: Annotated[float | None, Query(ge=-90, le=90)] = None,
    lon: Annotated[float | None, Query(ge=-180, le=180)] = None,
    radius_km: Annotated[float | None, Query(gt=0, le=100)] = None,
    min_investment_score: Annotated[int | None, Query(ge=0, le=100)] = None,
    max_risk_score: Annotated[int | None, Query(ge=0, le=100)] = None,
) -> MapFeatureCollection:
    try:
        parsed_bbox = parse_bbox(bbox)
        return build_map_feature_collection(
            repository,
            city=city,
            district=district,
            rooms=rooms,
            max_price=max_price,
            min_area_m2=min_area_m2,
            bbox=parsed_bbox,
            lat=lat,
            lon=lon,
            radius_km=radius_km,
            min_investment_score=min_investment_score,
            max_risk_score=max_risk_score,
        )
    except MapQueryError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/listings/{listing_id}", response_model=Listing)
def get_listing(listing_id: str, repository: RepositoryDep) -> Listing:
    listing = repository.get_listing(listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


@router.get("/listings/{listing_id}/analysis", response_model=ListingAnalysis)
def analyze_listing(listing_id: str, repository: RepositoryDep) -> ListingAnalysis:
    listing = repository.get_listing(listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    return build_listing_analysis(repository, listing)


@router.get("/areas/{area_id}/statistics", response_model=AreaStatistics)
def get_area_statistics(area_id: str, repository: RepositoryDep) -> AreaStatistics:
    stats = repository.get_area_statistics(area_id)
    if stats is None:
        raise HTTPException(status_code=404, detail="Area statistics not found")
    return stats


@router.post("/compare", response_model=CompareResponse)
def compare_listings(
    payload: CompareRequest,
    repository: RepositoryDep,
    account: CurrentAccountDep,
) -> CompareResponse:
    if len(payload.listing_ids) > account.limits.max_compare_items:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "plan_limit_reached",
                "resource": "compare_items",
                "plan": account.subscription.plan,
                "limit": account.limits.max_compare_items,
            },
        )

    analyses = []
    missing_ids = []

    for listing_id in payload.listing_ids:
        listing = repository.get_listing(listing_id)
        if listing is None:
            missing_ids.append(listing_id)
            continue
        analyses.append(build_listing_analysis(repository, listing))

    if missing_ids:
        raise HTTPException(status_code=404, detail={"missing_listing_ids": missing_ids})

    return CompareResponse(items=analyses)


@router.post("/reports/object", response_model=ObjectReport)
def create_object_report(payload: ReportRequest, repository: RepositoryDep) -> ObjectReport:
    listing = repository.get_listing(payload.listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")

    analysis = build_listing_analysis(repository, listing)
    return build_object_report(analysis, payload.audience)


@router.post("/reports/object/generate", response_model=GeneratedReport)
def generate_object_report(
    payload: GenerateReportRequest,
    repository: RepositoryDep,
    report_store: ReportStoreDep,
    account: CurrentAccountDep,
) -> GeneratedReport:
    listing = repository.get_listing(payload.listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")

    _ensure_report_limit(account, report_store)
    return generate_and_store_object_report(
        repository=repository,
        report_store=report_store,
        listing_id=payload.listing_id,
        audience=payload.audience,
        report_format=payload.report_format,
        owner_id=account.user.id,
    )


@router.get("/reports/object/{listing_id}.html", response_class=HTMLResponse)
def get_object_report_html(
    listing_id: str,
    repository: RepositoryDep,
    audience: Annotated[ReportAudience, Query()] = "buyer",
) -> HTMLResponse:
    listing = repository.get_listing(listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")

    html = generate_object_report_html(repository, listing_id, audience)
    filename = f"domarion-report-{listing_id}.html"
    return HTMLResponse(
        content=html,
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


@router.get("/reports", response_model=list[GeneratedReportListItem])
def list_generated_reports(
    report_store: ReportStoreDep,
    account: CurrentAccountDep,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> list[GeneratedReportListItem]:
    return report_store.list_reports(limit=limit, owner_id=account.user.id)


@router.get("/reports/{report_id}", response_model=GeneratedReport)
def get_generated_report(
    report_id: str,
    report_store: ReportStoreDep,
    account: CurrentAccountDep,
) -> GeneratedReport:
    report = report_store.get_report(report_id, owner_id=account.user.id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/reports/{report_id}/content")
def get_generated_report_content(
    report_id: str,
    report_store: ReportStoreDep,
    account: CurrentAccountDep,
) -> Response:
    report = report_store.get_report(report_id, owner_id=account.user.id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    return Response(
        content=report.content,
        media_type=report.content_type,
        headers={"Content-Disposition": f'inline; filename="domarion-report-{report_id}"'},
    )


@router.post("/favorites", response_model=Favorite, status_code=status.HTTP_201_CREATED)
def add_favorite(
    payload: FavoriteCreate,
    repository: RepositoryDep,
    user_store: UserStoreDep,
    account: CurrentAccountDep,
) -> Favorite:
    listing = repository.get_listing(payload.listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")

    _ensure_favorite_limit(account, user_store, payload.listing_id)
    favorite = user_store.add_favorite(account.user.id, payload)
    return favorite.model_copy(update={"listing": listing})


@router.get("/favorites", response_model=list[Favorite])
def list_favorites(
    repository: RepositoryDep,
    user_store: UserStoreDep,
    account: CurrentAccountDep,
) -> list[Favorite]:
    favorites = user_store.list_favorites(account.user.id)
    return [_attach_listing(repository, favorite) for favorite in favorites]


@router.get("/favorites/{favorite_id}", response_model=Favorite)
def get_favorite(
    favorite_id: str,
    repository: RepositoryDep,
    user_store: UserStoreDep,
    account: CurrentAccountDep,
) -> Favorite:
    favorite = user_store.get_favorite(account.user.id, favorite_id)
    if favorite is None:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return _attach_listing(repository, favorite)


@router.patch("/favorites/{favorite_id}", response_model=Favorite)
def update_favorite(
    favorite_id: str,
    payload: FavoriteUpdate,
    repository: RepositoryDep,
    user_store: UserStoreDep,
    account: CurrentAccountDep,
) -> Favorite:
    favorite = user_store.update_favorite(account.user.id, favorite_id, payload)
    if favorite is None:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return _attach_listing(repository, favorite)


@router.delete("/favorites/{favorite_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_favorite(
    favorite_id: str,
    user_store: UserStoreDep,
    account: CurrentAccountDep,
) -> Response:
    deleted = user_store.remove_favorite(account.user.id, favorite_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/alerts", response_model=Alert, status_code=status.HTTP_201_CREATED)
def create_alert(
    payload: AlertCreate,
    user_store: UserStoreDep,
    account: CurrentAccountDep,
) -> Alert:
    _ensure_alert_limit(account, user_store)
    return user_store.create_alert(account.user.id, payload)


@router.get("/alerts", response_model=list[Alert])
def list_alerts(
    user_store: UserStoreDep,
    account: CurrentAccountDep,
) -> list[Alert]:
    return user_store.list_alerts(account.user.id)


@router.get("/alerts/{alert_id}", response_model=Alert)
def get_alert(
    alert_id: str,
    user_store: UserStoreDep,
    account: CurrentAccountDep,
) -> Alert:
    alert = user_store.get_alert(account.user.id, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.patch("/alerts/{alert_id}", response_model=Alert)
def update_alert(
    alert_id: str,
    payload: AlertUpdate,
    user_store: UserStoreDep,
    account: CurrentAccountDep,
) -> Alert:
    alert = user_store.update_alert(account.user.id, alert_id, payload)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.delete("/alerts/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(
    alert_id: str,
    user_store: UserStoreDep,
    account: CurrentAccountDep,
) -> Response:
    deleted = user_store.delete_alert(account.user.id, alert_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Alert not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/alerts/{alert_id}/preview", response_model=AlertPreview)
def preview_alert(
    alert_id: str,
    repository: RepositoryDep,
    user_store: UserStoreDep,
    account: CurrentAccountDep,
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
) -> AlertPreview:
    alert = user_store.get_alert(account.user.id, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return build_alert_preview(repository, alert, limit=limit)


def _attach_listing(repository: RealEstateRepository, favorite: Favorite) -> Favorite:
    listing = repository.get_listing(favorite.listing_id)
    return favorite.model_copy(update={"listing": listing})


def _build_account_summary(
    account: CurrentAccount,
    user_store: UserStore,
    report_store: ReportStore,
) -> AccountSummary:
    usage = AccountUsage(
        favorites=len(user_store.list_favorites(account.user.id)),
        alerts=len(user_store.list_alerts(account.user.id)),
        reports_this_month=len(report_store.list_reports(limit=10_000, owner_id=account.user.id)),
    )
    return AccountSummary(
        user=account.user,
        subscription=account.subscription,
        limits=account.limits,
        usage=usage,
    )


def _ensure_favorite_limit(
    account: CurrentAccount,
    user_store: UserStore,
    listing_id: str,
) -> None:
    favorites = user_store.list_favorites(account.user.id)
    if any(favorite.listing_id == listing_id for favorite in favorites):
        return
    if len(favorites) >= account.limits.max_favorites:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "plan_limit_reached",
                "resource": "favorites",
                "plan": account.subscription.plan,
                "limit": account.limits.max_favorites,
            },
        )


def _ensure_alert_limit(account: CurrentAccount, user_store: UserStore) -> None:
    alerts = user_store.list_alerts(account.user.id)
    if len(alerts) >= account.limits.max_alerts:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "plan_limit_reached",
                "resource": "alerts",
                "plan": account.subscription.plan,
                "limit": account.limits.max_alerts,
            },
        )


def _ensure_report_limit(account: CurrentAccount, report_store: ReportStore) -> None:
    reports = report_store.list_reports(limit=10_000, owner_id=account.user.id)
    if len(reports) >= account.limits.monthly_reports:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "plan_limit_reached",
                "resource": "reports",
                "plan": account.subscription.plan,
                "limit": account.limits.monthly_reports,
            },
        )
