from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import HTMLResponse, Response

from domarion.auth import CurrentAccount, CurrentAccountDep
from domarion.auth_store.base import AuthStore
from domarion.auth_store.factory import get_auth_store
from domarion.ingestion_admin_store.base import IngestionAdminStore
from domarion.ingestion_admin_store.factory import get_ingestion_admin_store
from domarion.report_order_store.base import ReportOrderStore
from domarion.report_order_store.factory import get_report_order_store
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
    CheckoutSession,
    CompareRequest,
    CompareResponse,
    DataQualityLog,
    DataQualityLogCreate,
    DataQualitySeverity,
    Favorite,
    FavoriteCreate,
    FavoriteUpdate,
    GeneratedReport,
    GeneratedReportListItem,
    GenerateReportRequest,
    IngestionJob,
    IngestionJobCreate,
    Listing,
    ListingAnalysis,
    ListingSearchResponse,
    ListingSort,
    MapFeatureCollection,
    MarketType,
    ObjectReport,
    PlanLimits,
    RawListingSummary,
    ReportAudience,
    ReportOrder,
    ReportOrderCreate,
    ReportProduct,
    ReportRequest,
    SubscriptionUpdate,
)
from domarion.services.alerts import build_alert_preview
from domarion.services.geo import MapQueryError, build_map_feature_collection, parse_bbox
from domarion.services.payments import MockPaymentProvider
from domarion.services.plans import get_plan_limits, list_plan_limits
from domarion.services.report_generation import (
    generate_and_store_object_report,
    generate_object_report_html,
)
from domarion.services.report_products import get_report_product, list_report_products
from domarion.services.reports import build_object_report
from domarion.services.scoring import build_listing_analysis
from domarion.services.search import ListingSearchError, search_listing_analyses
from domarion.user_store.base import UserStore
from domarion.user_store.factory import get_user_store

router = APIRouter(prefix="/api/v1")
RepositoryDep = Annotated[RealEstateRepository, Depends(get_repository)]
IngestionAdminStoreDep = Annotated[IngestionAdminStore, Depends(get_ingestion_admin_store)]
ReportOrderStoreDep = Annotated[ReportOrderStore, Depends(get_report_order_store)]
ReportStoreDep = Annotated[ReportStore, Depends(get_report_store)]
UserStoreDep = Annotated[UserStore, Depends(get_user_store)]
AuthStoreDep = Annotated[AuthStore, Depends(get_auth_store)]


@router.get("/listings", response_model=ListingSearchResponse)
def list_listings(
    repository: RepositoryDep,
    city: Annotated[str | None, Query(description="City name, for example Wrocław")] = None,
    district: Annotated[str | None, Query(description="District or estate name")] = None,
    rooms: Annotated[int | None, Query(ge=1, le=10)] = None,
    market_type: Annotated[MarketType | None, Query()] = None,
    min_price: Annotated[int | None, Query(gt=0)] = None,
    max_price: Annotated[int | None, Query(gt=0)] = None,
    min_price_per_m2: Annotated[int | None, Query(gt=0)] = None,
    max_price_per_m2: Annotated[int | None, Query(gt=0)] = None,
    min_area_m2: Annotated[float | None, Query(gt=0)] = None,
    max_area_m2: Annotated[float | None, Query(gt=0)] = None,
    max_days_on_market: Annotated[int | None, Query(ge=0)] = None,
    min_investment_score: Annotated[int | None, Query(ge=0, le=100)] = None,
    max_risk_score: Annotated[int | None, Query(ge=0, le=100)] = None,
    min_negotiation_score: Annotated[int | None, Query(ge=0, le=100)] = None,
    min_liquidity_score: Annotated[int | None, Query(ge=0, le=100)] = None,
    min_rental_potential_score: Annotated[int | None, Query(ge=0, le=100)] = None,
    min_data_quality_score: Annotated[int | None, Query(ge=0, le=100)] = None,
    lat: Annotated[float | None, Query(ge=-90, le=90)] = None,
    lon: Annotated[float | None, Query(ge=-180, le=180)] = None,
    radius_km: Annotated[float | None, Query(gt=0, le=100)] = None,
    sort: Annotated[ListingSort, Query()] = "investment_score_desc",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> ListingSearchResponse:
    try:
        return search_listing_analyses(
            repository,
            city=city,
            district=district,
            rooms=rooms,
            market_type=market_type,
            min_price=min_price,
            max_price=max_price,
            min_price_per_m2=min_price_per_m2,
            max_price_per_m2=max_price_per_m2,
            min_area_m2=min_area_m2,
            max_area_m2=max_area_m2,
            max_days_on_market=max_days_on_market,
            min_investment_score=min_investment_score,
            max_risk_score=max_risk_score,
            min_negotiation_score=min_negotiation_score,
            min_liquidity_score=min_liquidity_score,
            min_rental_potential_score=min_rental_potential_score,
            min_data_quality_score=min_data_quality_score,
            lat=lat,
            lon=lon,
            radius_km=radius_km,
            sort=sort,
            page=page,
            page_size=page_size,
        )
    except ListingSearchError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/areas", response_model=list[AreaStatistics])
def list_areas(repository: RepositoryDep) -> list[AreaStatistics]:
    return repository.list_area_statistics()


@router.get("/plans", response_model=list[PlanLimits])
def list_plans() -> list[PlanLimits]:
    return list_plan_limits()


@router.get("/admin/ingestion/jobs", response_model=list[IngestionJob])
def list_admin_ingestion_jobs(
    admin_store: IngestionAdminStoreDep,
    account: CurrentAccountDep,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> list[IngestionJob]:
    _ensure_admin(account)
    return admin_store.list_jobs(limit=limit)


@router.post(
    "/admin/ingestion/jobs",
    response_model=IngestionJob,
    status_code=status.HTTP_201_CREATED,
)
def create_admin_ingestion_job(
    payload: IngestionJobCreate,
    admin_store: IngestionAdminStoreDep,
    account: CurrentAccountDep,
) -> IngestionJob:
    _ensure_admin(account)
    audited_payload = payload.model_copy(update={"created_by": account.user.id})
    return admin_store.create_job(audited_payload)


@router.get("/admin/ingestion/jobs/{job_id}", response_model=IngestionJob)
def get_admin_ingestion_job(
    job_id: str,
    admin_store: IngestionAdminStoreDep,
    account: CurrentAccountDep,
) -> IngestionJob:
    _ensure_admin(account)
    job = admin_store.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Ingestion job not found")
    return job


@router.get("/admin/data-quality/logs", response_model=list[DataQualityLog])
def list_admin_data_quality_logs(
    admin_store: IngestionAdminStoreDep,
    account: CurrentAccountDep,
    job_id: Annotated[str | None, Query()] = None,
    severity: Annotated[DataQualitySeverity | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
) -> list[DataQualityLog]:
    _ensure_admin(account)
    return admin_store.list_quality_logs(job_id=job_id, severity=severity, limit=limit)


@router.post(
    "/admin/data-quality/logs",
    response_model=DataQualityLog,
    status_code=status.HTTP_201_CREATED,
)
def create_admin_data_quality_log(
    payload: DataQualityLogCreate,
    admin_store: IngestionAdminStoreDep,
    account: CurrentAccountDep,
) -> DataQualityLog:
    _ensure_admin(account)
    return admin_store.create_quality_log(payload)


@router.get("/admin/raw-listings", response_model=list[RawListingSummary])
def list_admin_raw_listings(
    admin_store: IngestionAdminStoreDep,
    account: CurrentAccountDep,
    source_name: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
) -> list[RawListingSummary]:
    _ensure_admin(account)
    return admin_store.list_raw_listings(source_name=source_name, limit=limit)


@router.get("/admin/raw-listings/{raw_listing_id}", response_model=RawListingSummary)
def get_admin_raw_listing(
    raw_listing_id: str,
    admin_store: IngestionAdminStoreDep,
    account: CurrentAccountDep,
) -> RawListingSummary:
    _ensure_admin(account)
    raw_listing = admin_store.get_raw_listing(raw_listing_id)
    if raw_listing is None:
        raise HTTPException(status_code=404, detail="Raw listing not found")
    return raw_listing


@router.get("/report-products", response_model=list[ReportProduct])
def list_one_time_report_products() -> list[ReportProduct]:
    return list_report_products()


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


@router.post(
    "/report-orders",
    response_model=CheckoutSession,
    status_code=status.HTTP_201_CREATED,
)
def create_report_order(
    payload: ReportOrderCreate,
    repository: RepositoryDep,
    order_store: ReportOrderStoreDep,
    account: CurrentAccountDep,
) -> CheckoutSession:
    listing = repository.get_listing(payload.listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")

    product = get_report_product(payload.product_code)
    order = order_store.create_order(account.user.id, payload, product)
    payment_session = MockPaymentProvider().create_checkout_session(order)
    order = order_store.set_checkout_url(account.user.id, order.id, payment_session.checkout_url)
    return CheckoutSession(
        provider=payment_session.provider,
        mode=payment_session.mode,
        checkout_url=payment_session.checkout_url,
        order=order,
    )


@router.get("/report-orders", response_model=list[ReportOrder])
def list_report_orders(
    order_store: ReportOrderStoreDep,
    account: CurrentAccountDep,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> list[ReportOrder]:
    return order_store.list_orders(account.user.id, limit=limit)


@router.get("/report-orders/{order_id}", response_model=ReportOrder)
def get_report_order(
    order_id: str,
    order_store: ReportOrderStoreDep,
    account: CurrentAccountDep,
) -> ReportOrder:
    order = order_store.get_order(account.user.id, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Report order not found")
    return order


@router.post("/report-orders/{order_id}/mock-pay", response_model=ReportOrder)
def mock_pay_report_order(
    order_id: str,
    order_store: ReportOrderStoreDep,
    account: CurrentAccountDep,
) -> ReportOrder:
    order = order_store.mark_paid(account.user.id, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Report order not found")
    return order


@router.post("/report-orders/{order_id}/fulfill", response_model=ReportOrder)
def fulfill_report_order(
    order_id: str,
    repository: RepositoryDep,
    order_store: ReportOrderStoreDep,
    report_store: ReportStoreDep,
    account: CurrentAccountDep,
) -> ReportOrder:
    order = order_store.get_order(account.user.id, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Report order not found")
    if order.status == "fulfilled":
        return order
    if order.status != "paid":
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Report order must be paid before fulfillment",
        )

    report = generate_and_store_object_report(
        repository=repository,
        report_store=report_store,
        listing_id=order.listing_id,
        audience=order.audience,
        report_format=order.report_format,
        owner_id=account.user.id,
    )
    fulfilled = order_store.mark_fulfilled(account.user.id, order.id, report.id)
    if fulfilled is None:
        raise HTTPException(status_code=404, detail="Report order not found")
    return fulfilled


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


def _ensure_admin(account: CurrentAccount) -> None:
    if account.user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")


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
