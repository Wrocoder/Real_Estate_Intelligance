from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse

from domarion.repositories.base import RealEstateRepository
from domarion.repositories.factory import get_repository
from domarion.schemas import (
    AreaStatistics,
    CompareRequest,
    CompareResponse,
    Listing,
    ListingAnalysis,
    ObjectReport,
    ReportAudience,
    ReportRequest,
)
from domarion.services.report_generation import generate_object_report_html
from domarion.services.reports import build_object_report
from domarion.services.scoring import build_listing_analysis

router = APIRouter(prefix="/api/v1")
RepositoryDep = Annotated[RealEstateRepository, Depends(get_repository)]


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
