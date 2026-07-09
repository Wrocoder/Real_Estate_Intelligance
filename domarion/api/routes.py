from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import HTMLResponse, Response

from domarion.report_store.base import ReportStore
from domarion.report_store.factory import get_report_store
from domarion.repositories.base import RealEstateRepository
from domarion.repositories.factory import get_repository
from domarion.schemas import (
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
    ObjectReport,
    ReportAudience,
    ReportRequest,
)
from domarion.services.alerts import build_alert_preview
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
OwnerId = Annotated[str, Query(description="Temporary owner id until auth is implemented.")]


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
def compare_listings(payload: CompareRequest, repository: RepositoryDep) -> CompareResponse:
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
) -> GeneratedReport:
    listing = repository.get_listing(payload.listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")

    return generate_and_store_object_report(
        repository=repository,
        report_store=report_store,
        listing_id=payload.listing_id,
        audience=payload.audience,
        report_format=payload.report_format,
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
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> list[GeneratedReportListItem]:
    return report_store.list_reports(limit=limit)


@router.get("/reports/{report_id}", response_model=GeneratedReport)
def get_generated_report(report_id: str, report_store: ReportStoreDep) -> GeneratedReport:
    report = report_store.get_report(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/reports/{report_id}/content")
def get_generated_report_content(report_id: str, report_store: ReportStoreDep) -> Response:
    report = report_store.get_report(report_id)
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
    owner_id: OwnerId = "demo-user",
) -> Favorite:
    listing = repository.get_listing(payload.listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")

    favorite = user_store.add_favorite(owner_id, payload)
    return favorite.model_copy(update={"listing": listing})


@router.get("/favorites", response_model=list[Favorite])
def list_favorites(
    repository: RepositoryDep,
    user_store: UserStoreDep,
    owner_id: OwnerId = "demo-user",
) -> list[Favorite]:
    favorites = user_store.list_favorites(owner_id)
    return [_attach_listing(repository, favorite) for favorite in favorites]


@router.get("/favorites/{favorite_id}", response_model=Favorite)
def get_favorite(
    favorite_id: str,
    repository: RepositoryDep,
    user_store: UserStoreDep,
    owner_id: OwnerId = "demo-user",
) -> Favorite:
    favorite = user_store.get_favorite(owner_id, favorite_id)
    if favorite is None:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return _attach_listing(repository, favorite)


@router.patch("/favorites/{favorite_id}", response_model=Favorite)
def update_favorite(
    favorite_id: str,
    payload: FavoriteUpdate,
    repository: RepositoryDep,
    user_store: UserStoreDep,
    owner_id: OwnerId = "demo-user",
) -> Favorite:
    favorite = user_store.update_favorite(owner_id, favorite_id, payload)
    if favorite is None:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return _attach_listing(repository, favorite)


@router.delete("/favorites/{favorite_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_favorite(
    favorite_id: str,
    user_store: UserStoreDep,
    owner_id: OwnerId = "demo-user",
) -> Response:
    deleted = user_store.remove_favorite(owner_id, favorite_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/alerts", response_model=Alert, status_code=status.HTTP_201_CREATED)
def create_alert(
    payload: AlertCreate,
    user_store: UserStoreDep,
    owner_id: OwnerId = "demo-user",
) -> Alert:
    return user_store.create_alert(owner_id, payload)


@router.get("/alerts", response_model=list[Alert])
def list_alerts(
    user_store: UserStoreDep,
    owner_id: OwnerId = "demo-user",
) -> list[Alert]:
    return user_store.list_alerts(owner_id)


@router.get("/alerts/{alert_id}", response_model=Alert)
def get_alert(
    alert_id: str,
    user_store: UserStoreDep,
    owner_id: OwnerId = "demo-user",
) -> Alert:
    alert = user_store.get_alert(owner_id, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.patch("/alerts/{alert_id}", response_model=Alert)
def update_alert(
    alert_id: str,
    payload: AlertUpdate,
    user_store: UserStoreDep,
    owner_id: OwnerId = "demo-user",
) -> Alert:
    alert = user_store.update_alert(owner_id, alert_id, payload)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.delete("/alerts/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(
    alert_id: str,
    user_store: UserStoreDep,
    owner_id: OwnerId = "demo-user",
) -> Response:
    deleted = user_store.delete_alert(owner_id, alert_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Alert not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/alerts/{alert_id}/preview", response_model=AlertPreview)
def preview_alert(
    alert_id: str,
    repository: RepositoryDep,
    user_store: UserStoreDep,
    owner_id: OwnerId = "demo-user",
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
) -> AlertPreview:
    alert = user_store.get_alert(owner_id, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return build_alert_preview(repository, alert, limit=limit)


def _attach_listing(repository: RealEstateRepository, favorite: Favorite) -> Favorite:
    listing = repository.get_listing(favorite.listing_id)
    return favorite.model_copy(update={"listing": listing})
