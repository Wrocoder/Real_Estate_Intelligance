import tempfile
from pathlib import Path
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
    status,
)
from fastapi.responses import HTMLResponse, Response

from domarion.auth import CurrentAccount, CurrentAccountDep
from domarion.auth_store.base import AuthStore
from domarion.auth_store.factory import get_auth_store
from domarion.core import get_settings
from domarion.db.session import SessionLocal
from domarion.ingestion.db_writer import (
    ImportResult,
    build_partner_quality_logs,
    import_partner_records_in_session,
    rebuild_price_history_metrics_in_session,
)
from domarion.ingestion.partner_csv import PartnerCsvError, read_partner_csv
from domarion.ingestion.planned_investments import (
    PlannedInvestmentImportError,
    PlannedInvestmentImportResult,
    import_planned_investments,
)
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
    AlertDeliveryJob,
    AlertDeliveryRequest,
    AlertPreview,
    AlertUpdate,
    AreaMarketSnapshotJobResult,
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
    IngestionSourceHealth,
    Listing,
    ListingAnalysis,
    ListingSearchResponse,
    ListingSort,
    MapFeatureCollection,
    MarketDashboard,
    MarketType,
    MortgageCalculationRequest,
    MortgageCalculationResult,
    ObjectReport,
    PartnerCsvImportResponse,
    PaymentWebhookEventCreate,
    PaymentWebhookResult,
    PlanLimits,
    PlannedInvestment,
    PlannedInvestmentCreate,
    PlannedInvestmentImportResponse,
    PlannedInvestmentUpdate,
    PriceHistoryRebuildResult,
    RawListingSummary,
    ReportAudience,
    ReportEmailRequest,
    ReportEmailResult,
    ReportOrder,
    ReportOrderCreate,
    ReportOrderEvent,
    ReportOrderEventCreate,
    ReportProduct,
    ReportRequest,
    ReportTemplateDescriptor,
    ScoringBacktestResult,
    SourceRegistryEntry,
    SourceRegistryEntryCreate,
    SourceRegistryEntryUpdate,
    SubscriptionUpdate,
    UserSubmittedListingAnalysis,
    UserSubmittedListingReport,
    UserSubmittedListingReportRequest,
    UserSubmittedListingRequest,
)
from domarion.services.alert_delivery import build_alert_delivery_job
from domarion.services.alerts import build_alert_preview
from domarion.services.area_snapshots import run_area_market_snapshot_job
from domarion.services.backtesting import run_scoring_backtest
from domarion.services.geo import MapQueryError, build_map_feature_collection, parse_bbox
from domarion.services.market_dashboard import build_market_dashboard
from domarion.services.mortgage import calculate_mortgage
from domarion.services.payments import (
    PaymentConfigurationError,
    PaymentWebhookVerificationError,
    get_payment_provider,
    payment_payload_hash,
    verify_payment_webhook,
)
from domarion.services.plans import get_plan_limits, list_plan_limits
from domarion.services.report_delivery import deliver_report_email
from domarion.services.report_generation import (
    generate_and_store_object_report,
    generate_object_report_html,
)
from domarion.services.report_products import get_report_product, list_report_products
from domarion.services.report_templates import list_report_templates
from domarion.services.reports import build_object_report
from domarion.services.scoring import build_listing_analysis
from domarion.services.search import ListingSearchError, search_listing_analyses
from domarion.services.user_submitted_listings import analyze_user_submitted_listing
from domarion.user_store.base import UserStore
from domarion.user_store.factory import get_user_store

router = APIRouter(prefix="/api/v1")
RepositoryDep = Annotated[RealEstateRepository, Depends(get_repository)]
IngestionAdminStoreDep = Annotated[IngestionAdminStore, Depends(get_ingestion_admin_store)]
ReportOrderStoreDep = Annotated[ReportOrderStore, Depends(get_report_order_store)]
ReportStoreDep = Annotated[ReportStore, Depends(get_report_store)]
UserStoreDep = Annotated[UserStore, Depends(get_user_store)]
AuthStoreDep = Annotated[AuthStore, Depends(get_auth_store)]

MAX_PARTNER_CSV_UPLOAD_BYTES = 5 * 1024 * 1024
PARTNER_CSV_UPLOAD_EXTENSIONS = {".csv"}
MAX_PLANNED_INVESTMENTS_UPLOAD_BYTES = 2 * 1024 * 1024
PLANNED_INVESTMENTS_UPLOAD_EXTENSIONS = {".csv", ".json"}
SOURCE_HEALTH_PRIORITY = {"failing": 0, "warning": 1, "healthy": 2}


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


@router.get("/market/dashboard", response_model=MarketDashboard)
def get_market_dashboard(
    repository: RepositoryDep,
    city: Annotated[str | None, Query()] = None,
    district: Annotated[str | None, Query()] = None,
) -> MarketDashboard:
    return build_market_dashboard(repository, city=city, district=district)


@router.post("/mortgage/calculate", response_model=MortgageCalculationResult)
def calculate_mortgage_budget(
    payload: MortgageCalculationRequest,
) -> MortgageCalculationResult:
    try:
        return calculate_mortgage(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/user-submitted-listings/analyze",
    response_model=UserSubmittedListingAnalysis,
)
def analyze_user_submitted_listing_endpoint(
    payload: UserSubmittedListingRequest,
    repository: RepositoryDep,
) -> UserSubmittedListingAnalysis:
    try:
        return analyze_user_submitted_listing(repository, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/user-submitted-listings/report",
    response_model=UserSubmittedListingReport,
)
def create_user_submitted_listing_report(
    payload: UserSubmittedListingReportRequest,
    repository: RepositoryDep,
) -> UserSubmittedListingReport:
    try:
        analysis = analyze_user_submitted_listing(repository, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    report = build_object_report(
        analysis.analysis,
        payload.audience,
        branding=payload.branding,
    )
    return UserSubmittedListingReport(analysis=analysis, report=report)


@router.get("/admin/ingestion/jobs", response_model=list[IngestionJob])
def list_admin_ingestion_jobs(
    admin_store: IngestionAdminStoreDep,
    account: CurrentAccountDep,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> list[IngestionJob]:
    _ensure_admin(account)
    return admin_store.list_jobs(limit=limit)


@router.get("/admin/ingestion/source-health", response_model=list[IngestionSourceHealth])
def list_admin_ingestion_source_health(
    admin_store: IngestionAdminStoreDep,
    account: CurrentAccountDep,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> list[IngestionSourceHealth]:
    _ensure_admin(account)
    jobs = admin_store.list_jobs(limit=limit)
    logs = admin_store.list_quality_logs(limit=500)
    return _build_source_health(jobs, logs)


@router.get("/admin/ingestion/sources", response_model=list[SourceRegistryEntry])
def list_admin_ingestion_sources(
    admin_store: IngestionAdminStoreDep,
    account: CurrentAccountDep,
) -> list[SourceRegistryEntry]:
    _ensure_admin(account)
    return admin_store.list_sources()


@router.post(
    "/admin/ingestion/sources",
    response_model=SourceRegistryEntry,
    status_code=status.HTTP_201_CREATED,
)
def create_admin_ingestion_source(
    payload: SourceRegistryEntryCreate,
    admin_store: IngestionAdminStoreDep,
    account: CurrentAccountDep,
) -> SourceRegistryEntry:
    _ensure_admin(account)
    payload = payload.model_copy(update={"name": payload.name.strip()})
    if not payload.name:
        raise HTTPException(status_code=400, detail="Source name is required")
    _ensure_source_name_available(admin_store, payload.name)
    return admin_store.create_source(payload)


@router.patch("/admin/ingestion/sources/{source_id}", response_model=SourceRegistryEntry)
def update_admin_ingestion_source(
    source_id: str,
    payload: SourceRegistryEntryUpdate,
    admin_store: IngestionAdminStoreDep,
    account: CurrentAccountDep,
) -> SourceRegistryEntry:
    _ensure_admin(account)
    if payload.name is not None:
        payload = payload.model_copy(update={"name": payload.name.strip()})
        if not payload.name:
            raise HTTPException(status_code=400, detail="Source name is required")
        _ensure_source_name_available(admin_store, payload.name, ignore_source_id=source_id)
    source = admin_store.update_source(source_id, payload)
    if source is None:
        raise HTTPException(status_code=404, detail="Ingestion source not found")
    return source


@router.get("/admin/scoring/backtest", response_model=ScoringBacktestResult)
def get_admin_scoring_backtest(
    repository: RepositoryDep,
    account: CurrentAccountDep,
    city: Annotated[str | None, Query()] = None,
    district: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> ScoringBacktestResult:
    _ensure_admin(account)
    return run_scoring_backtest(
        repository,
        city=city,
        district=district,
        item_limit=limit,
    )


@router.post("/admin/area-market-snapshots", response_model=AreaMarketSnapshotJobResult)
def create_admin_area_market_snapshots(
    repository: RepositoryDep,
    account: CurrentAccountDep,
    dry_run: Annotated[bool, Query()] = True,
) -> AreaMarketSnapshotJobResult:
    _ensure_admin(account)
    if dry_run:
        return run_area_market_snapshot_job(repository, dry_run=True)

    settings = get_settings()
    if settings.data_repository_backend != "postgres":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Area market snapshot writes require DATA_REPOSITORY_BACKEND=postgres",
        )

    with SessionLocal() as session:
        try:
            result = run_area_market_snapshot_job(
                repository,
                session=session,
                dry_run=False,
            )
            session.commit()
        except Exception:
            session.rollback()
            raise
    return result


@router.post("/admin/price-history/rebuild", response_model=PriceHistoryRebuildResult)
def rebuild_admin_price_history(
    account: CurrentAccountDep,
) -> PriceHistoryRebuildResult:
    _ensure_admin(account)
    settings = get_settings()
    if settings.data_repository_backend != "postgres":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Price history rebuild requires DATA_REPOSITORY_BACKEND=postgres",
        )

    with SessionLocal() as session:
        try:
            result = rebuild_price_history_metrics_in_session(session)
            session.commit()
        except Exception:
            session.rollback()
            raise
    return result


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


@router.post(
    "/admin/listings/import-csv",
    response_model=PartnerCsvImportResponse,
)
async def import_admin_partner_csv(
    admin_store: IngestionAdminStoreDep,
    account: CurrentAccountDep,
    file: Annotated[UploadFile, File(description="UTF-8 partner listings CSV file.")],
    source_name: Annotated[str | None, Form()] = None,
    source_type: Annotated[str, Form()] = "partner_csv",
    dry_run: Annotated[bool, Form()] = True,
) -> PartnerCsvImportResponse:
    _ensure_admin(account)
    filename = file.filename or "partner_listings.csv"
    suffix = Path(filename).suffix.lower()
    if suffix not in PARTNER_CSV_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supported partner listing upload format: .csv",
        )

    content = await file.read(MAX_PARTNER_CSV_UPLOAD_BYTES + 1)
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(content) > MAX_PARTNER_CSV_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Uploaded file is too large")

    source_label = (source_name or Path(filename).stem).strip() or Path(filename).stem
    source_type_label = source_type.strip() or "partner_csv"
    job = admin_store.create_job(
        IngestionJobCreate(
            source_name=source_label,
            source_type=source_type_label,
            status="running",
            created_by=account.user.id,
            notes="Partner listings CSV upload from internal admin endpoint.",
            metadata={
                "file_name": filename,
                "dry_run": dry_run,
                "bytes": len(content),
            },
        )
    )
    temp_path = _write_upload_to_temp_file(content, suffix)
    try:
        records = read_partner_csv(
            temp_path,
            default_source_name=source_label,
            default_source_type=source_type_label,
        )
    except PartnerCsvError as exc:
        failed_job = _fail_import_job(
            admin_store,
            job.id,
            source_label,
            code="partner_csv_import_failed",
            message=str(exc),
            payload={"file_name": filename, "dry_run": dry_run},
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Partner CSV import failed",
                "error": str(exc),
                "job_id": failed_job.id if failed_job else job.id,
            },
        ) from exc
    finally:
        temp_path.unlink(missing_ok=True)

    listing_ids = [record.source_listing_id for record in records]
    result = ImportResult(rows_seen=len(records))
    if not dry_run:
        settings = get_settings()
        if settings.ingestion_admin_store_backend != "postgres":
            failed_job = _fail_import_job(
                admin_store,
                job.id,
                source_label,
                code="partner_csv_import_requires_postgres",
                message=(
                    "Partner CSV writes require INGESTION_ADMIN_STORE_BACKEND=postgres "
                    "so imported raw listings and ingestion jobs share the same database."
                ),
                payload={"backend": settings.ingestion_admin_store_backend, "dry_run": dry_run},
                result=result,
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Partner CSV import requires Postgres ingestion admin store",
                    "job_id": failed_job.id if failed_job else job.id,
                },
            )

        with SessionLocal() as session:
            try:
                result = import_partner_records_in_session(session, records)
                session.commit()
            except Exception as exc:
                session.rollback()
                failed_job = _fail_import_job(
                    admin_store,
                    job.id,
                    source_label,
                    code="partner_csv_write_failed",
                    message=str(exc),
                    payload={"file_name": filename, "exception_type": type(exc).__name__},
                    result=result,
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={
                        "message": "Partner CSV import failed while writing to database",
                        "job_id": failed_job.id if failed_job else job.id,
                    },
                ) from exc

    quality_logs = build_partner_quality_logs(job.id, records)
    for quality_log in quality_logs:
        admin_store.create_quality_log(quality_log)
    finished_job = admin_store.finish_job(
        job.id,
        result,
        status="succeeded",
        errors_count=len(quality_logs),
    )
    if finished_job is None:
        raise HTTPException(status_code=500, detail="Failed to finish ingestion job")
    return PartnerCsvImportResponse(
        **result.as_dict(),
        dry_run=dry_run,
        listing_ids=listing_ids,
        errors=[],
        job=finished_job,
    )


@router.get("/admin/planned-investments", response_model=list[PlannedInvestment])
def list_admin_planned_investments(
    repository: RepositoryDep,
    account: CurrentAccountDep,
    city: Annotated[str | None, Query(description="City name, for example Wrocław")] = None,
    district: Annotated[str | None, Query(description="District or estate name")] = None,
) -> list[PlannedInvestment]:
    _ensure_admin(account)
    return repository.list_planned_investments(city=city, district=district)


@router.post(
    "/admin/planned-investments",
    response_model=PlannedInvestment,
    status_code=status.HTTP_201_CREATED,
)
def create_admin_planned_investment(
    payload: PlannedInvestmentCreate,
    repository: RepositoryDep,
    account: CurrentAccountDep,
) -> PlannedInvestment:
    _ensure_admin(account)
    return repository.create_planned_investment(payload)


@router.post(
    "/admin/planned-investments/import",
    response_model=PlannedInvestmentImportResponse,
)
async def import_admin_planned_investments(
    repository: RepositoryDep,
    admin_store: IngestionAdminStoreDep,
    account: CurrentAccountDep,
    file: Annotated[UploadFile, File(description="UTF-8 JSON or CSV file.")],
    source_name: Annotated[str | None, Form()] = None,
    dry_run: Annotated[bool, Form()] = False,
) -> PlannedInvestmentImportResponse:
    _ensure_admin(account)
    filename = file.filename or "planned_investments.json"
    suffix = Path(filename).suffix.lower()
    if suffix not in PLANNED_INVESTMENTS_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supported planned investments upload formats: .json, .csv",
        )

    content = await file.read(MAX_PLANNED_INVESTMENTS_UPLOAD_BYTES + 1)
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(content) > MAX_PLANNED_INVESTMENTS_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Uploaded file is too large")

    source_label = source_name or Path(filename).stem
    job = admin_store.create_job(
        IngestionJobCreate(
            source_name=source_label,
            source_type="planned_investments_import",
            status="running",
            created_by=account.user.id,
            notes="Planned investments upload from internal admin endpoint.",
            metadata={
                "file_name": filename,
                "dry_run": dry_run,
                "bytes": len(content),
            },
        )
    )
    temp_path = _write_upload_to_temp_file(content, suffix)
    try:
        result = import_planned_investments(
            temp_path,
            repository,
            default_source_name=source_label,
            dry_run=dry_run,
        )
    except PlannedInvestmentImportError as exc:
        admin_store.create_quality_log(
            DataQualityLogCreate(
                job_id=job.id,
                source_name=source_label,
                severity="error",
                code="planned_investments_import_failed",
                message=str(exc),
                payload={"file_name": filename, "dry_run": dry_run},
            )
        )
        failed_job = admin_store.finish_job(
            job.id,
            _planned_import_to_ingestion_result(PlannedInvestmentImportResult()),
            status="failed",
            errors_count=1,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Planned investments import failed",
                "error": str(exc),
                "job_id": failed_job.id if failed_job else job.id,
            },
        ) from exc
    finally:
        temp_path.unlink(missing_ok=True)

    errors_count = len(result.errors)
    finished_job = admin_store.finish_job(
        job.id,
        _planned_import_to_ingestion_result(result),
        status="failed" if errors_count else "succeeded",
        errors_count=errors_count,
    )
    if finished_job is None:
        raise HTTPException(status_code=500, detail="Failed to finish ingestion job")
    return PlannedInvestmentImportResponse(**result.as_dict(), job=finished_job)


@router.get("/admin/planned-investments/{investment_id}", response_model=PlannedInvestment)
def get_admin_planned_investment(
    investment_id: str,
    repository: RepositoryDep,
    account: CurrentAccountDep,
) -> PlannedInvestment:
    _ensure_admin(account)
    investment = repository.get_planned_investment(investment_id)
    if investment is None:
        raise HTTPException(status_code=404, detail="Planned investment not found")
    return investment


@router.patch("/admin/planned-investments/{investment_id}", response_model=PlannedInvestment)
def update_admin_planned_investment(
    investment_id: str,
    payload: PlannedInvestmentUpdate,
    repository: RepositoryDep,
    account: CurrentAccountDep,
) -> PlannedInvestment:
    _ensure_admin(account)
    investment = repository.update_planned_investment(investment_id, payload)
    if investment is None:
        raise HTTPException(status_code=404, detail="Planned investment not found")
    return investment


@router.delete("/admin/planned-investments/{investment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_planned_investment(
    investment_id: str,
    repository: RepositoryDep,
    account: CurrentAccountDep,
) -> Response:
    _ensure_admin(account)
    deleted = repository.delete_planned_investment(investment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Planned investment not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
    _record_order_event(
        order_store,
        account,
        order.id,
        ReportOrderEventCreate(
            event_type="order_created",
            actor_id=account.user.id,
            message="Report order created.",
            metadata={
                "product_code": order.product_code,
                "amount_grosz": order.amount_grosz,
                "currency": order.currency,
            },
        ),
    )

    try:
        payment_session = get_payment_provider().create_checkout_session(order)
    except PaymentConfigurationError as exc:
        _record_order_event(
            order_store,
            account,
            order.id,
            ReportOrderEventCreate(
                event_type="payment_provider_error",
                actor_id=account.user.id,
                message=str(exc),
            ),
        )
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    order = order_store.set_checkout_url(account.user.id, order.id, payment_session.checkout_url)
    _record_order_event(
        order_store,
        account,
        order.id,
        ReportOrderEventCreate(
            event_type="checkout_created",
            actor_id=account.user.id,
            message=f"{payment_session.provider} checkout session created.",
            metadata={
                "provider": payment_session.provider,
                "mode": payment_session.mode,
                "checkout_url": payment_session.checkout_url,
                "external_reference": payment_session.external_reference,
                **(payment_session.metadata or {}),
            },
        ),
    )
    return CheckoutSession(
        provider=payment_session.provider,
        mode=payment_session.mode,
        checkout_url=payment_session.checkout_url,
        order=order,
        external_reference=payment_session.external_reference,
        metadata=payment_session.metadata or {},
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


@router.get("/report-orders/{order_id}/events", response_model=list[ReportOrderEvent])
def list_report_order_events(
    order_id: str,
    order_store: ReportOrderStoreDep,
    account: CurrentAccountDep,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
) -> list[ReportOrderEvent]:
    order = order_store.get_order(account.user.id, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Report order not found")
    return order_store.list_events(account.user.id, order_id, limit=limit)


@router.post("/report-orders/{order_id}/mock-pay", response_model=ReportOrder)
def mock_pay_report_order(
    order_id: str,
    order_store: ReportOrderStoreDep,
    account: CurrentAccountDep,
) -> ReportOrder:
    order = order_store.mark_paid(account.user.id, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Report order not found")
    _record_order_event(
        order_store,
        account,
        order.id,
        ReportOrderEventCreate(
            event_type="payment_marked_paid",
            actor_id=account.user.id,
            message="Mock payment marked the order as paid.",
            metadata={
                "status": order.status,
                "paid_at": order.paid_at.isoformat() if order.paid_at else None,
            },
        ),
    )
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
        _record_order_event(
            order_store,
            account,
            order.id,
            ReportOrderEventCreate(
                event_type="fulfillment_skipped",
                actor_id=account.user.id,
                message="Order already fulfilled.",
                metadata={"generated_report_id": order.generated_report_id},
            ),
        )
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
    _record_order_event(
        order_store,
        account,
        fulfilled.id,
        ReportOrderEventCreate(
            event_type="report_fulfilled",
            actor_id=account.user.id,
            message="Paid report generated and attached to order.",
            metadata={"generated_report_id": report.id},
        ),
    )
    return fulfilled


@router.post("/payment-webhooks/{provider}", response_model=PaymentWebhookResult)
async def receive_payment_webhook(
    provider: str,
    request: Request,
    repository: RepositoryDep,
    order_store: ReportOrderStoreDep,
    report_store: ReportStoreDep,
) -> PaymentWebhookResult:
    body = await request.body()
    try:
        verified = verify_payment_webhook(provider, body, dict(request.headers))
    except PaymentConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except PaymentWebhookVerificationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    existing = order_store.get_payment_webhook_event(
        verified.provider,
        verified.provider_event_id,
    )
    if existing is not None:
        order = order_store.get_order_by_id(existing.order_id) if existing.order_id else None
        return PaymentWebhookResult(
            provider=verified.provider,
            provider_event_id=verified.provider_event_id,
            status="duplicate",
            message="Webhook event was already processed.",
            order=order,
            generated_report_id=order.generated_report_id if order else None,
            webhook_event=existing,
        )

    payload_hash = payment_payload_hash(body)
    order = order_store.get_order_by_id(verified.order_id) if verified.order_id else None
    if verified.order_id is None:
        webhook_event = order_store.record_payment_webhook_event(
            PaymentWebhookEventCreate(
                provider=verified.provider,
                provider_event_id=verified.provider_event_id,
                order_id=None,
                event_type=verified.event_type,
                status="ignored",
                payload_hash=payload_hash,
                metadata={**verified.metadata, "reason": "missing_order_id"},
            )
        )
        return PaymentWebhookResult(
            provider=verified.provider,
            provider_event_id=verified.provider_event_id,
            status="ignored",
            message="Webhook ignored because order_id is missing.",
            webhook_event=webhook_event,
        )
    if order is None:
        webhook_event = order_store.record_payment_webhook_event(
            PaymentWebhookEventCreate(
                provider=verified.provider,
                provider_event_id=verified.provider_event_id,
                order_id=verified.order_id,
                event_type=verified.event_type,
                status="ignored",
                payload_hash=payload_hash,
                metadata={**verified.metadata, "reason": "order_not_found"},
            )
        )
        return PaymentWebhookResult(
            provider=verified.provider,
            provider_event_id=verified.provider_event_id,
            status="ignored",
            message="Webhook ignored because order was not found.",
            webhook_event=webhook_event,
        )

    if not verified.should_mark_paid:
        _record_order_event_for_owner(
            order_store,
            order.owner_id,
            order.id,
            ReportOrderEventCreate(
                event_type="payment_webhook_ignored",
                actor_id=f"webhook:{verified.provider}",
                message="Payment webhook received but status is not paid.",
                metadata={
                    "provider_event_id": verified.provider_event_id,
                    "event_type": verified.event_type,
                    "payment_status": verified.payment_status,
                },
            ),
        )
        webhook_event = order_store.record_payment_webhook_event(
            PaymentWebhookEventCreate(
                provider=verified.provider,
                provider_event_id=verified.provider_event_id,
                order_id=order.id,
                event_type=verified.event_type,
                status="ignored",
                payload_hash=payload_hash,
                metadata=verified.metadata,
            )
        )
        return PaymentWebhookResult(
            provider=verified.provider,
            provider_event_id=verified.provider_event_id,
            status="ignored",
            message="Webhook status is not paid; order was not changed.",
            order=order,
            generated_report_id=order.generated_report_id,
            webhook_event=webhook_event,
        )

    paid_order = order_store.mark_paid(order.owner_id, order.id) or order
    _record_order_event_for_owner(
        order_store,
        order.owner_id,
        order.id,
        ReportOrderEventCreate(
            event_type="payment_webhook_processed",
            actor_id=f"webhook:{verified.provider}",
            message="Verified payment webhook marked order as paid.",
            metadata={
                "provider": verified.provider,
                "provider_event_id": verified.provider_event_id,
                "event_type": verified.event_type,
                "payment_status": verified.payment_status,
            },
        ),
    )

    generated_report_id = paid_order.generated_report_id
    final_order = paid_order
    if paid_order.status != "fulfilled":
        report = generate_and_store_object_report(
            repository=repository,
            report_store=report_store,
            listing_id=paid_order.listing_id,
            audience=paid_order.audience,
            report_format=paid_order.report_format,
            owner_id=paid_order.owner_id,
        )
        fulfilled = order_store.mark_fulfilled(paid_order.owner_id, paid_order.id, report.id)
        if fulfilled is not None:
            final_order = fulfilled
            generated_report_id = report.id
        _record_order_event_for_owner(
            order_store,
            order.owner_id,
            order.id,
            ReportOrderEventCreate(
                event_type="report_fulfilled",
                actor_id=f"webhook:{verified.provider}",
                message="Paid report generated from verified payment webhook.",
                metadata={"generated_report_id": report.id},
            ),
        )

    webhook_event = order_store.record_payment_webhook_event(
        PaymentWebhookEventCreate(
            provider=verified.provider,
            provider_event_id=verified.provider_event_id,
            order_id=final_order.id,
            event_type=verified.event_type,
            status="processed",
            payload_hash=payload_hash,
            metadata={
                **verified.metadata,
                "generated_report_id": generated_report_id,
                "order_status": final_order.status,
            },
        )
    )
    return PaymentWebhookResult(
        provider=verified.provider,
        provider_event_id=verified.provider_event_id,
        status="processed",
        message="Payment webhook processed.",
        order=final_order,
        generated_report_id=generated_report_id,
        webhook_event=webhook_event,
    )


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
    return build_object_report(analysis, payload.audience, branding=payload.branding)


@router.get("/reports/templates", response_model=list[ReportTemplateDescriptor])
def list_object_report_templates() -> list[ReportTemplateDescriptor]:
    return list_report_templates()


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
        branding=payload.branding,
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


@router.post("/reports/{report_id}/email", response_model=ReportEmailResult)
def email_generated_report(
    report_id: str,
    payload: ReportEmailRequest,
    report_store: ReportStoreDep,
    account: CurrentAccountDep,
) -> ReportEmailResult:
    report = report_store.get_report(report_id, owner_id=account.user.id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return deliver_report_email(report, account.user.email, payload)


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
    payload = _with_default_alert_delivery_target(payload, account)
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


@router.post("/alerts/{alert_id}/deliver", response_model=AlertDeliveryJob)
def deliver_alert(
    alert_id: str,
    repository: RepositoryDep,
    user_store: UserStoreDep,
    account: CurrentAccountDep,
    payload: AlertDeliveryRequest | None = None,
) -> AlertDeliveryJob:
    alert = user_store.get_alert(account.user.id, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")

    request_payload = payload or AlertDeliveryRequest()
    preview = build_alert_preview(repository, alert, limit=request_payload.max_matches)
    job = build_alert_delivery_job(
        owner_id=account.user.id,
        owner_email=account.user.email,
        alert=alert,
        preview=preview,
        request=request_payload,
    )
    return user_store.save_alert_delivery_job(job)


@router.get("/alert-delivery-jobs", response_model=list[AlertDeliveryJob])
def list_alert_delivery_jobs(
    user_store: UserStoreDep,
    account: CurrentAccountDep,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> list[AlertDeliveryJob]:
    return user_store.list_alert_delivery_jobs(account.user.id, limit=limit)


def _write_upload_to_temp_file(content: bytes, suffix: str) -> Path:
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file.write(content)
        return Path(temp_file.name)


def _build_source_health(
    jobs: list[IngestionJob],
    logs: list[DataQualityLog],
) -> list[IngestionSourceHealth]:
    latest_jobs: dict[tuple[str, str], IngestionJob] = {}
    for job in sorted(jobs, key=lambda item: item.updated_at, reverse=True):
        latest_jobs.setdefault((job.source_name, job.source_type), job)

    health = []
    for (source_name, source_type), job in latest_jobs.items():
        source_logs = [log for log in logs if log.source_name == source_name]
        warning_count = sum(1 for log in source_logs if log.severity == "warning")
        error_logs = [log for log in source_logs if log.severity == "error"]
        error_count = len(error_logs)
        if job.status == "failed" or error_count:
            health_status = "failing"
        elif warning_count or job.errors_count:
            health_status = "warning"
        else:
            health_status = "healthy"
        last_error = (
            max(error_logs, key=lambda item: item.created_at).message if error_logs else None
        )

        health.append(
            IngestionSourceHealth(
                source_name=source_name,
                source_type=source_type,
                health_status=health_status,
                latest_job_id=job.id,
                latest_job_status=job.status,
                rows_seen=job.rows_seen,
                errors_count=job.errors_count,
                warning_count=warning_count,
                error_count=error_count,
                last_error_message=last_error,
                updated_at=job.updated_at,
            )
        )

    return sorted(
        health,
        key=lambda item: (SOURCE_HEALTH_PRIORITY[item.health_status], -item.updated_at.timestamp()),
    )


def _fail_import_job(
    admin_store: IngestionAdminStore,
    job_id: str,
    source_name: str,
    code: str,
    message: str,
    payload: dict[str, object],
    result: ImportResult | None = None,
) -> IngestionJob | None:
    admin_store.create_quality_log(
        DataQualityLogCreate(
            job_id=job_id,
            source_name=source_name,
            severity="error",
            code=code,
            message=message,
            payload=payload,
        )
    )
    return admin_store.finish_job(
        job_id,
        result or ImportResult(),
        status="failed",
        errors_count=1,
    )


def _planned_import_to_ingestion_result(result: PlannedInvestmentImportResult) -> ImportResult:
    return ImportResult(
        rows_seen=result.rows_seen,
        properties_created=result.created,
        properties_updated=result.updated,
    )


def _attach_listing(repository: RealEstateRepository, favorite: Favorite) -> Favorite:
    listing = repository.get_listing(favorite.listing_id)
    return favorite.model_copy(update={"listing": listing})


def _ensure_admin(account: CurrentAccount) -> None:
    if account.user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")


def _ensure_source_name_available(
    admin_store: IngestionAdminStore,
    source_name: str,
    ignore_source_id: str | None = None,
) -> None:
    normalized_name = source_name.casefold()
    for source in admin_store.list_sources():
        if source.id == ignore_source_id:
            continue
        if source.name.casefold() == normalized_name:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ingestion source name already exists",
            )


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


def _record_order_event(
    order_store: ReportOrderStore,
    account: CurrentAccount,
    order_id: str,
    payload: ReportOrderEventCreate,
) -> ReportOrderEvent | None:
    return _record_order_event_for_owner(order_store, account.user.id, order_id, payload)


def _record_order_event_for_owner(
    order_store: ReportOrderStore,
    owner_id: str,
    order_id: str,
    payload: ReportOrderEventCreate,
) -> ReportOrderEvent | None:
    try:
        return order_store.record_event(owner_id, order_id, payload)
    except KeyError:
        return None


def _with_default_alert_delivery_target(
    payload: AlertCreate,
    account: CurrentAccount,
) -> AlertCreate:
    if payload.channel == "email" and not payload.delivery_target and account.user.email:
        return payload.model_copy(update={"delivery_target": account.user.email})
    return payload
