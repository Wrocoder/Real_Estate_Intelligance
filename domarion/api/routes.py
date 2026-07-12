import csv
import hashlib
import io
import json
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
from sqlalchemy import select

from domarion.ai_insight_store.base import AIInsightStore
from domarion.ai_insight_store.factory import get_ai_insight_store
from domarion.auth import CurrentAccount, CurrentAccountDep
from domarion.auth_store.base import AuthStore
from domarion.auth_store.factory import get_auth_store
from domarion.core import get_settings
from domarion.db.models import (
    PropertyDeduplicationMatch as PropertyDeduplicationMatchRow,
)
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
from domarion.ingestion_admin_store.system_sources import (
    USER_SUBMITTED_REFERENCE_SOURCE_NAME,
    USER_SUBMITTED_REFERENCE_SOURCE_TYPE,
)
from domarion.partner_referral_store.base import PartnerReferralStore
from domarion.partner_referral_store.factory import get_partner_referral_store
from domarion.report_order_store.base import ReportOrderStore
from domarion.report_order_store.factory import get_report_order_store
from domarion.report_store.base import ReportStore
from domarion.report_store.factory import get_report_store
from domarion.repositories.base import RealEstateRepository
from domarion.repositories.factory import get_repository
from domarion.schemas import (
    AccountSummary,
    AccountUsage,
    AIInsight,
    AIInsightListItem,
    AIInsightSubjectType,
    AIInsightType,
    Alert,
    AlertCreate,
    AlertDeliveryBatchRequest,
    AlertDeliveryBatchResult,
    AlertDeliveryJob,
    AlertDeliveryRequest,
    AlertPreview,
    AlertUpdate,
    AmenityReference,
    AreaComparison,
    AreaMarketSnapshotJobResult,
    AreaStatistics,
    CheckoutSession,
    CompareRequest,
    CompareResponse,
    DataQualityLog,
    DataQualityLogCreate,
    DataQualitySeverity,
    DistrictReference,
    Favorite,
    FavoriteCreate,
    FavoriteUpdate,
    GeneratedReport,
    GeneratedReportListItem,
    GenerateReportRequest,
    GenerateUserSubmittedDraftReportRequest,
    IndustrialZoneReference,
    InfrastructureEnrichmentJobResult,
    IngestionJob,
    IngestionJobCreate,
    IngestionSourceHealth,
    KindergartenReference,
    Listing,
    ListingAnalysis,
    ListingSearchResponse,
    ListingSort,
    LocationReference,
    LocationReferenceType,
    MapFeatureCollection,
    MarketDashboard,
    MarketType,
    MortgageCalculationRequest,
    MortgageCalculationResult,
    MunicipalityReference,
    ObjectReport,
    PartnerCsvImportResponse,
    PartnerReferral,
    PartnerReferralCreate,
    PartnerReferralStatus,
    PartnerReferralType,
    PartnerReferralUpdate,
    PaymentWebhookEventCreate,
    PaymentWebhookResult,
    PlanLimits,
    PlannedInvestment,
    PlannedInvestmentCreate,
    PlannedInvestmentImportResponse,
    PlannedInvestmentUpdate,
    PriceHistoryRebuildResult,
    PropertyDeduplicationDecision,
    PropertyDeduplicationMatch,
    PropertyDeduplicationReviewStatus,
    RawListingSummary,
    ReportAudience,
    ReportEmailRequest,
    ReportEmailResult,
    ReportOrder,
    ReportOrderCreate,
    ReportOrderEvent,
    ReportOrderEventCreate,
    ReportProduct,
    ReportProductCode,
    ReportRequest,
    ReportTemplateDescriptor,
    SchoolReference,
    ScoringBacktestResult,
    SourceCheckJob,
    SourceCheckJobCreate,
    SourceCheckJobStatus,
    SourceError,
    SourceErrorCreate,
    SourceErrorRetryResult,
    SourceErrorStatus,
    SourceErrorUpdate,
    SourceReferencePreview,
    SourceReferencePreviewRequest,
    SourceRegistryEntry,
    SourceRegistryEntryCreate,
    SourceRegistryEntryUpdate,
    SourceUrlImportRequest,
    SourceUrlImportResult,
    SubscriptionUpdate,
    TransportRouteReference,
    TransportStopReference,
    UserSubmittedListingAnalysis,
    UserSubmittedListingDraft,
    UserSubmittedListingDraftPruneResult,
    UserSubmittedListingReport,
    UserSubmittedListingReportRequest,
    UserSubmittedListingRequest,
)
from domarion.services.ai_insights import persist_generated_report_insights
from domarion.services.alert_delivery import build_alert_delivery_job
from domarion.services.alert_scheduler import run_daily_email_alert_delivery
from domarion.services.alerts import build_alert_preview
from domarion.services.area_comparison import build_area_comparison
from domarion.services.area_snapshots import run_area_market_snapshot_job
from domarion.services.backtesting import run_scoring_backtest
from domarion.services.geo import MapQueryError, build_map_feature_collection, parse_bbox
from domarion.services.infrastructure_enrichment import run_infrastructure_enrichment_job
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
    generate_and_store_area_report,
    generate_and_store_object_report,
    generate_and_store_report_bundle_receipt,
    generate_and_store_user_submitted_draft_report,
    generate_object_report_html,
)
from domarion.services.report_products import get_report_product, list_report_products
from domarion.services.report_templates import list_report_templates
from domarion.services.reports import build_object_report
from domarion.services.scoring import build_listing_analysis
from domarion.services.search import ListingSearchError, search_listing_analyses
from domarion.services.user_submitted_listings import (
    analyze_user_submitted_listing,
    build_source_reference_preview,
    import_listing_from_source_url,
)
from domarion.user_store.base import UserStore
from domarion.user_store.factory import get_user_store
from domarion.user_submitted_listing_store.base import UserSubmittedListingStore
from domarion.user_submitted_listing_store.factory import get_user_submitted_listing_store

router = APIRouter(prefix="/api/v1")
RepositoryDep = Annotated[RealEstateRepository, Depends(get_repository)]
AIInsightStoreDep = Annotated[AIInsightStore, Depends(get_ai_insight_store)]
IngestionAdminStoreDep = Annotated[IngestionAdminStore, Depends(get_ingestion_admin_store)]
ReportOrderStoreDep = Annotated[ReportOrderStore, Depends(get_report_order_store)]
ReportStoreDep = Annotated[ReportStore, Depends(get_report_store)]
UserStoreDep = Annotated[UserStore, Depends(get_user_store)]
AuthStoreDep = Annotated[AuthStore, Depends(get_auth_store)]
PartnerReferralStoreDep = Annotated[PartnerReferralStore, Depends(get_partner_referral_store)]
UserSubmittedListingStoreDep = Annotated[
    UserSubmittedListingStore,
    Depends(get_user_submitted_listing_store),
]

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


@router.get("/areas/compare", response_model=AreaComparison)
def compare_areas(
    repository: RepositoryDep,
    city: Annotated[str | None, Query()] = "Wrocław",
    sort: Annotated[str, Query()] = "value",
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> AreaComparison:
    try:
        return build_area_comparison(repository, city=city, sort=sort, limit=limit)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/locations/municipalities", response_model=list[MunicipalityReference])
def list_municipalities(repository: RepositoryDep) -> list[MunicipalityReference]:
    return repository.list_municipalities()


@router.get("/locations/districts", response_model=list[DistrictReference])
def list_district_references(
    repository: RepositoryDep,
    municipality_id: Annotated[str | None, Query()] = None,
    city: Annotated[str | None, Query()] = None,
) -> list[DistrictReference]:
    return repository.list_district_references(municipality_id=municipality_id, city=city)


@router.get("/locations", response_model=list[LocationReference])
def list_location_references(
    repository: RepositoryDep,
    municipality_id: Annotated[str | None, Query()] = None,
    district_id: Annotated[str | None, Query()] = None,
    location_type: Annotated[LocationReferenceType | None, Query()] = None,
    query: Annotated[str | None, Query(min_length=1, max_length=80)] = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
) -> list[LocationReference]:
    return repository.list_location_references(
        municipality_id=municipality_id,
        district_id=district_id,
        location_type=location_type,
        query=query,
        limit=limit,
    )


@router.get("/infrastructure/transport-stops", response_model=list[TransportStopReference])
def list_transport_stops(
    repository: RepositoryDep,
    municipality_id: Annotated[str | None, Query()] = None,
    district_id: Annotated[str | None, Query()] = None,
    city: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
) -> list[TransportStopReference]:
    return repository.list_transport_stops(
        municipality_id=municipality_id,
        district_id=district_id,
        city=city,
        limit=limit,
    )


@router.get("/infrastructure/transport-routes", response_model=list[TransportRouteReference])
def list_transport_routes(
    repository: RepositoryDep,
    municipality_id: Annotated[str | None, Query()] = None,
    district_id: Annotated[str | None, Query()] = None,
    city: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
) -> list[TransportRouteReference]:
    return repository.list_transport_routes(
        municipality_id=municipality_id,
        district_id=district_id,
        city=city,
        limit=limit,
    )


@router.get("/infrastructure/schools", response_model=list[SchoolReference])
def list_schools(
    repository: RepositoryDep,
    municipality_id: Annotated[str | None, Query()] = None,
    district_id: Annotated[str | None, Query()] = None,
    city: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
) -> list[SchoolReference]:
    return repository.list_schools(
        municipality_id=municipality_id,
        district_id=district_id,
        city=city,
        limit=limit,
    )


@router.get("/infrastructure/kindergartens", response_model=list[KindergartenReference])
def list_kindergartens(
    repository: RepositoryDep,
    municipality_id: Annotated[str | None, Query()] = None,
    district_id: Annotated[str | None, Query()] = None,
    city: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
) -> list[KindergartenReference]:
    return repository.list_kindergartens(
        municipality_id=municipality_id,
        district_id=district_id,
        city=city,
        limit=limit,
    )


@router.get("/infrastructure/amenities", response_model=list[AmenityReference])
def list_amenities(
    repository: RepositoryDep,
    municipality_id: Annotated[str | None, Query()] = None,
    district_id: Annotated[str | None, Query()] = None,
    city: Annotated[str | None, Query()] = None,
    amenity_type: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
) -> list[AmenityReference]:
    return repository.list_amenities(
        municipality_id=municipality_id,
        district_id=district_id,
        city=city,
        amenity_type=amenity_type,
        limit=limit,
    )


@router.get("/infrastructure/industrial-zones", response_model=list[IndustrialZoneReference])
def list_industrial_zones(
    repository: RepositoryDep,
    municipality_id: Annotated[str | None, Query()] = None,
    district_id: Annotated[str | None, Query()] = None,
    city: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
) -> list[IndustrialZoneReference]:
    return repository.list_industrial_zones(
        municipality_id=municipality_id,
        district_id=district_id,
        city=city,
        limit=limit,
    )


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
    "/partner-referrals",
    response_model=PartnerReferral,
    status_code=status.HTTP_201_CREATED,
)
def create_partner_referral(
    payload: PartnerReferralCreate,
    referral_store: PartnerReferralStoreDep,
    account: CurrentAccountDep,
) -> PartnerReferral:
    payload = _normalize_partner_referral_payload(payload, account)
    return referral_store.create_referral(account.user.id, payload)


@router.get("/partner-referrals", response_model=list[PartnerReferral])
def list_partner_referrals(
    referral_store: PartnerReferralStoreDep,
    account: CurrentAccountDep,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> list[PartnerReferral]:
    return referral_store.list_referrals(account.user.id, limit=limit)


@router.get("/partner-referrals/{referral_id}", response_model=PartnerReferral)
def get_partner_referral(
    referral_id: str,
    referral_store: PartnerReferralStoreDep,
    account: CurrentAccountDep,
) -> PartnerReferral:
    referral = referral_store.get_referral(account.user.id, referral_id)
    if referral is None:
        raise HTTPException(status_code=404, detail="Partner referral not found")
    return referral


@router.get("/admin/partner-referrals", response_model=list[PartnerReferral])
def list_admin_partner_referrals(
    referral_store: PartnerReferralStoreDep,
    account: CurrentAccountDep,
    referral_status: Annotated[PartnerReferralStatus | None, Query(alias="status")] = None,
    referral_type: Annotated[PartnerReferralType | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
) -> list[PartnerReferral]:
    _ensure_admin(account)
    return referral_store.list_all(
        limit=limit,
        status=referral_status,
        referral_type=referral_type,
    )


@router.patch("/admin/partner-referrals/{referral_id}", response_model=PartnerReferral)
def update_admin_partner_referral(
    referral_id: str,
    payload: PartnerReferralUpdate,
    referral_store: PartnerReferralStoreDep,
    account: CurrentAccountDep,
) -> PartnerReferral:
    _ensure_admin(account)
    referral = referral_store.update_referral(referral_id, payload)
    if referral is None:
        raise HTTPException(status_code=404, detail="Partner referral not found")
    return referral


@router.post(
    "/user-submitted-listings/reference-preview",
    response_model=SourceReferencePreview,
)
def preview_user_submitted_listing_reference(
    payload: SourceReferencePreviewRequest,
) -> SourceReferencePreview:
    try:
        return build_source_reference_preview(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/user-submitted-listings/import-from-url",
    response_model=SourceUrlImportResult,
)
def import_user_submitted_listing_from_url(
    payload: SourceUrlImportRequest,
    admin_store: IngestionAdminStoreDep,
    account: CurrentAccountDep,
) -> SourceUrlImportResult:
    try:
        result = import_listing_from_source_url(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    _record_user_submitted_reference_import(admin_store, account, result)
    return result


@router.post(
    "/user-submitted-listings/analyze",
    response_model=UserSubmittedListingAnalysis,
)
def analyze_user_submitted_listing_endpoint(
    payload: UserSubmittedListingRequest,
    repository: RepositoryDep,
    draft_store: UserSubmittedListingStoreDep,
    account: CurrentAccountDep,
) -> UserSubmittedListingAnalysis:
    try:
        return _analyze_and_optionally_save_user_submitted_draft(
            repository=repository,
            draft_store=draft_store,
            account=account,
            payload=payload,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/user-submitted-listings/report",
    response_model=UserSubmittedListingReport,
)
def create_user_submitted_listing_report(
    payload: UserSubmittedListingReportRequest,
    repository: RepositoryDep,
    draft_store: UserSubmittedListingStoreDep,
    account: CurrentAccountDep,
) -> UserSubmittedListingReport:
    try:
        analysis = _analyze_and_optionally_save_user_submitted_draft(
            repository=repository,
            draft_store=draft_store,
            account=account,
            payload=payload,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    report = build_object_report(
        analysis.analysis,
        payload.audience,
        branding=payload.branding,
    )
    return UserSubmittedListingReport(analysis=analysis, report=report)


@router.get(
    "/user-submitted-listings/drafts",
    response_model=list[UserSubmittedListingDraft],
)
def list_user_submitted_listing_drafts(
    draft_store: UserSubmittedListingStoreDep,
    account: CurrentAccountDep,
    include_expired: Annotated[bool, Query()] = False,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> list[UserSubmittedListingDraft]:
    return draft_store.list_drafts(
        account.user.id,
        include_expired=include_expired,
        limit=limit,
    )


@router.get(
    "/user-submitted-listings/drafts/{draft_id}",
    response_model=UserSubmittedListingDraft,
)
def get_user_submitted_listing_draft(
    draft_id: str,
    draft_store: UserSubmittedListingStoreDep,
    account: CurrentAccountDep,
) -> UserSubmittedListingDraft:
    draft = draft_store.get_draft(account.user.id, draft_id)
    if draft is None:
        raise HTTPException(status_code=404, detail="User-submitted listing draft not found")
    return draft


@router.delete("/user-submitted-listings/drafts/{draft_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_submitted_listing_draft(
    draft_id: str,
    draft_store: UserSubmittedListingStoreDep,
    account: CurrentAccountDep,
) -> Response:
    deleted = draft_store.delete_draft(account.user.id, draft_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User-submitted listing draft not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/user-submitted-listings/drafts/{draft_id}/reports/generate",
    response_model=GeneratedReport,
)
def generate_user_submitted_listing_draft_report(
    draft_id: str,
    payload: GenerateUserSubmittedDraftReportRequest,
    draft_store: UserSubmittedListingStoreDep,
    report_store: ReportStoreDep,
    order_store: ReportOrderStoreDep,
    ai_insight_store: AIInsightStoreDep,
    account: CurrentAccountDep,
) -> GeneratedReport:
    draft = draft_store.get_draft(account.user.id, draft_id)
    if draft is None:
        raise HTTPException(status_code=404, detail="User-submitted listing draft not found")

    credit_source_order_id = _ensure_report_limit(account, report_store, order_store)
    report = generate_and_store_user_submitted_draft_report(
        report_store=report_store,
        draft=draft,
        audience=payload.audience,
        report_format=payload.report_format,
        owner_id=account.user.id,
        branding=payload.branding,
        report_metadata_extra=_report_credit_metadata(credit_source_order_id),
    )
    _save_report_ai_insights(ai_insight_store, report)
    return report


@router.get(
    "/admin/user-submitted-listing-drafts",
    response_model=list[UserSubmittedListingDraft],
)
def list_admin_user_submitted_listing_drafts(
    draft_store: UserSubmittedListingStoreDep,
    account: CurrentAccountDep,
    include_expired: Annotated[bool, Query()] = False,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
) -> list[UserSubmittedListingDraft]:
    _ensure_admin(account)
    return draft_store.list_admin_drafts(include_expired=include_expired, limit=limit)


@router.post(
    "/admin/user-submitted-listing-drafts/prune-expired",
    response_model=UserSubmittedListingDraftPruneResult,
)
def prune_admin_user_submitted_listing_drafts(
    draft_store: UserSubmittedListingStoreDep,
    account: CurrentAccountDep,
) -> UserSubmittedListingDraftPruneResult:
    _ensure_admin(account)
    return UserSubmittedListingDraftPruneResult(deleted=draft_store.prune_expired())


def _analyze_and_optionally_save_user_submitted_draft(
    repository: RealEstateRepository,
    draft_store: UserSubmittedListingStore,
    account: CurrentAccount,
    payload: UserSubmittedListingRequest,
) -> UserSubmittedListingAnalysis:
    analysis = analyze_user_submitted_listing(repository, payload)
    if not payload.save_private_draft:
        return analysis

    draft = draft_store.save_draft(account.user.id, payload, analysis)
    retention_note = (
        f"{analysis.retention_note} Private draft expires at "
        f"{draft.expires_at.date().isoformat()}."
    )
    return analysis.model_copy(
        update={
            "draft_id": draft.id,
            "draft_expires_at": draft.expires_at,
            "retention_note": retention_note,
        }
    )


def _record_user_submitted_reference_import(
    admin_store: IngestionAdminStore,
    account: CurrentAccount,
    result: SourceUrlImportResult,
) -> None:
    metadata = _user_submitted_reference_import_metadata(result)
    job = admin_store.create_job(
        IngestionJobCreate(
            source_name=USER_SUBMITTED_REFERENCE_SOURCE_NAME,
            source_type=USER_SUBMITTED_REFERENCE_SOURCE_TYPE,
            status="running",
            created_by=account.user.id,
            notes="One-off user-submitted URL import; private source URL omitted.",
            metadata=metadata,
        )
    )
    source_check_job = admin_store.create_source_check_job(
        SourceCheckJobCreate(
            source_name=USER_SUBMITTED_REFERENCE_SOURCE_NAME,
            source_type=USER_SUBMITTED_REFERENCE_SOURCE_TYPE,
            check_type="one_off_user_url",
            status=_source_check_status_for_user_submitted_import(result),
            target_domain=result.reference_preview.source_domain,
            target_url_hash=_private_source_url_hash(
                result.reference_preview.source_url_private,
            ),
            created_by=account.user.id,
            notes="One-off user-submitted URL check; private source URL omitted.",
            metadata=metadata,
        )
    )
    if result.status in {"failed", "partial", "unsupported"}:
        admin_store.create_quality_log(
            DataQualityLogCreate(
                job_id=job.id,
                source_name=USER_SUBMITTED_REFERENCE_SOURCE_NAME,
                source_listing_id=None,
                severity="error" if result.status == "failed" else "warning",
                code=f"user_submitted_reference_{result.status}",
                message=_user_submitted_reference_import_message(result),
                payload=_user_submitted_reference_quality_payload(result),
            )
        )
        admin_store.create_source_error(
            SourceErrorCreate(
                source_name=USER_SUBMITTED_REFERENCE_SOURCE_NAME,
                source_type=USER_SUBMITTED_REFERENCE_SOURCE_TYPE,
                source_check_job_id=source_check_job.id,
                ingestion_job_id=job.id,
                severity="error" if result.status in {"failed", "unsupported"} else "warning",
                error_code=f"user_submitted_reference_{result.status}",
                message=_user_submitted_reference_import_message(result),
                retryable=result.status != "unsupported",
                metadata=_user_submitted_reference_source_error_payload(result),
            )
        )

    admin_store.finish_job(
        job.id,
        ImportResult(rows_seen=1),
        status="failed" if result.status in {"failed", "unsupported"} else "succeeded",
        errors_count=1 if result.status in {"failed", "unsupported"} else 0,
    )


def _user_submitted_reference_import_metadata(
    result: SourceUrlImportResult,
) -> dict[str, object]:
    preview = result.reference_preview
    return {
        "import_status": result.status,
        "provider": preview.provider,
        "source_domain": preview.source_domain,
        "fields_extracted": result.fields_extracted,
        "fetch_status_code": result.fetch_status_code,
        "extraction_source": result.extraction_source,
        "private_source_url_omitted": True,
    }


def _user_submitted_reference_quality_payload(
    result: SourceUrlImportResult,
) -> dict[str, object]:
    payload = _user_submitted_reference_import_metadata(result)
    payload["missing_required_fields"] = [
        field
        for field in result.reference_preview.manual_fields_required
        if field not in result.fields_extracted
    ]
    return payload


def _user_submitted_reference_source_error_payload(
    result: SourceUrlImportResult,
) -> dict[str, object]:
    payload = _user_submitted_reference_quality_payload(result)
    payload["source_url_hash"] = _private_source_url_hash(
        result.reference_preview.source_url_private,
    )
    return payload


def _user_submitted_reference_import_message(result: SourceUrlImportResult) -> str:
    if result.status == "failed":
        return "User-submitted URL import failed; private source URL omitted from logs."
    if result.status == "unsupported":
        return "User-submitted URL import is unsupported; private source URL omitted from logs."
    return "User-submitted URL import extracted only partial fields; manual confirmation required."


def _source_check_status_for_user_submitted_import(
    result: SourceUrlImportResult,
) -> SourceCheckJobStatus:
    if result.status == "failed":
        return "failed"
    if result.status == "unsupported":
        return "blocked"
    return "succeeded"


def _private_source_url_hash(source_url: str) -> str:
    return hashlib.sha256(source_url.encode("utf-8")).hexdigest()


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


@router.get("/admin/ingestion/source-checks", response_model=list[SourceCheckJob])
def list_admin_source_check_jobs(
    admin_store: IngestionAdminStoreDep,
    account: CurrentAccountDep,
    source_name: Annotated[str | None, Query()] = None,
    status_filter: Annotated[SourceCheckJobStatus | None, Query(alias="status")] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
) -> list[SourceCheckJob]:
    _ensure_admin(account)
    return admin_store.list_source_check_jobs(
        source_name=source_name,
        status=status_filter,
        limit=limit,
    )


@router.post(
    "/admin/ingestion/source-checks",
    response_model=SourceCheckJob,
    status_code=status.HTTP_201_CREATED,
)
def create_admin_source_check_job(
    payload: SourceCheckJobCreate,
    admin_store: IngestionAdminStoreDep,
    account: CurrentAccountDep,
) -> SourceCheckJob:
    _ensure_admin(account)
    payload = payload.model_copy(
        update={
            "source_name": payload.source_name.strip(),
            "created_by": account.user.id,
        }
    )
    if not payload.source_name:
        raise HTTPException(status_code=400, detail="Source name is required")
    return admin_store.create_source_check_job(payload)


@router.get("/admin/ingestion/source-errors", response_model=list[SourceError])
def list_admin_source_errors(
    admin_store: IngestionAdminStoreDep,
    account: CurrentAccountDep,
    source_name: Annotated[str | None, Query()] = None,
    status_filter: Annotated[SourceErrorStatus | None, Query(alias="status")] = None,
    severity: Annotated[DataQualitySeverity | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
) -> list[SourceError]:
    _ensure_admin(account)
    return admin_store.list_source_errors(
        source_name=source_name,
        status=status_filter,
        severity=severity,
        limit=limit,
    )


@router.post(
    "/admin/ingestion/source-errors",
    response_model=SourceError,
    status_code=status.HTTP_201_CREATED,
)
def create_admin_source_error(
    payload: SourceErrorCreate,
    admin_store: IngestionAdminStoreDep,
    account: CurrentAccountDep,
) -> SourceError:
    _ensure_admin(account)
    payload = payload.model_copy(update={"source_name": payload.source_name.strip()})
    if not payload.source_name:
        raise HTTPException(status_code=400, detail="Source name is required")
    return admin_store.create_source_error(payload)


@router.patch("/admin/ingestion/source-errors/{error_id}", response_model=SourceError)
def update_admin_source_error(
    error_id: str,
    payload: SourceErrorUpdate,
    admin_store: IngestionAdminStoreDep,
    account: CurrentAccountDep,
) -> SourceError:
    _ensure_admin(account)
    if payload.status in {"resolved", "ignored"} and payload.resolved_by is None:
        payload = payload.model_copy(update={"resolved_by": account.user.id})
    source_error = admin_store.update_source_error(error_id, payload)
    if source_error is None:
        raise HTTPException(status_code=404, detail="Source error not found")
    return source_error


@router.post(
    "/admin/ingestion/source-errors/{error_id}/retry",
    response_model=SourceErrorRetryResult,
)
def retry_admin_source_error(
    error_id: str,
    admin_store: IngestionAdminStoreDep,
    account: CurrentAccountDep,
) -> SourceErrorRetryResult:
    _ensure_admin(account)
    result = admin_store.retry_source_error(error_id, created_by=account.user.id)
    if result is None:
        raise HTTPException(status_code=404, detail="Retryable source error not found")
    return result


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
    "/admin/infrastructure/enrich",
    response_model=InfrastructureEnrichmentJobResult,
)
def enrich_admin_infrastructure(
    account: CurrentAccountDep,
    dry_run: Annotated[bool, Query()] = True,
    limit: Annotated[int, Query(ge=1, le=10_000)] = 1_000,
) -> InfrastructureEnrichmentJobResult:
    _ensure_admin(account)
    settings = get_settings()
    if settings.data_repository_backend != "postgres":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Infrastructure enrichment requires DATA_REPOSITORY_BACKEND=postgres",
        )

    with SessionLocal() as session:
        try:
            result = run_infrastructure_enrichment_job(
                session,
                dry_run=dry_run,
                limit=limit,
            )
            if dry_run:
                session.rollback()
            else:
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


@router.get("/admin/deduplication/matches", response_model=list[PropertyDeduplicationMatch])
def list_admin_property_deduplication_matches(
    account: CurrentAccountDep,
    job_id: Annotated[str | None, Query()] = None,
    source_listing_id: Annotated[str | None, Query()] = None,
    decision: Annotated[PropertyDeduplicationDecision | None, Query()] = None,
    review_status: Annotated[PropertyDeduplicationReviewStatus | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
) -> list[PropertyDeduplicationMatch]:
    _ensure_admin(account)
    settings = get_settings()
    if settings.data_repository_backend != "postgres":
        return []

    statement = select(PropertyDeduplicationMatchRow).order_by(
        PropertyDeduplicationMatchRow.created_at.desc(),
        PropertyDeduplicationMatchRow.id.desc(),
    )
    if job_id:
        statement = statement.where(PropertyDeduplicationMatchRow.job_id == job_id)
    if source_listing_id:
        statement = statement.where(
            PropertyDeduplicationMatchRow.source_listing_id == source_listing_id
        )
    if decision:
        statement = statement.where(PropertyDeduplicationMatchRow.decision == decision)
    if review_status:
        statement = statement.where(
            PropertyDeduplicationMatchRow.review_status == review_status
        )

    with SessionLocal() as session:
        rows = session.scalars(statement.limit(limit)).all()
        return [_deduplication_match_to_schema(row) for row in rows]


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
                result = import_partner_records_in_session(session, records, job_id=job.id)
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
    order_store: ReportOrderStoreDep,
) -> AccountSummary:
    return _build_account_summary(account, user_store, report_store, order_store)


@router.patch("/me/subscription", response_model=AccountSummary)
def update_my_subscription(
    payload: SubscriptionUpdate,
    account: CurrentAccountDep,
    auth_store: AuthStoreDep,
    user_store: UserStoreDep,
    report_store: ReportStoreDep,
    order_store: ReportOrderStoreDep,
) -> AccountSummary:
    subscription = auth_store.update_subscription(account.user.id, payload)
    updated_account = CurrentAccount(
        user=account.user,
        subscription=subscription,
        limits=get_plan_limits(subscription.plan),
    )
    return _build_account_summary(updated_account, user_store, report_store, order_store)


@router.post(
    "/report-orders",
    response_model=CheckoutSession,
    status_code=status.HTTP_201_CREATED,
)
def create_report_order(
    payload: ReportOrderCreate,
    repository: RepositoryDep,
    draft_store: UserSubmittedListingStoreDep,
    order_store: ReportOrderStoreDep,
    account: CurrentAccountDep,
) -> CheckoutSession:
    product = get_report_product(payload.product_code)
    order_metadata = _validate_report_order_listing_reference(
        payload.listing_id,
        product_code=payload.product_code,
        repository=repository,
        draft_store=draft_store,
        owner_id=account.user.id,
    )

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
                **order_metadata,
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
    draft_store: UserSubmittedListingStoreDep,
    order_store: ReportOrderStoreDep,
    report_store: ReportStoreDep,
    ai_insight_store: AIInsightStoreDep,
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

    report = _generate_paid_report_for_order(
        repository=repository,
        draft_store=draft_store,
        report_store=report_store,
        ai_insight_store=ai_insight_store,
        order=order,
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
    draft_store: UserSubmittedListingStoreDep,
    order_store: ReportOrderStoreDep,
    report_store: ReportStoreDep,
    ai_insight_store: AIInsightStoreDep,
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
        report = _generate_paid_report_for_order(
            repository=repository,
            draft_store=draft_store,
            report_store=report_store,
            ai_insight_store=ai_insight_store,
            order=paid_order,
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
    order_store: ReportOrderStoreDep,
    ai_insight_store: AIInsightStoreDep,
    account: CurrentAccountDep,
) -> GeneratedReport:
    listing = repository.get_listing(payload.listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")

    credit_source_order_id = _ensure_report_limit(account, report_store, order_store)
    report = generate_and_store_object_report(
        repository=repository,
        report_store=report_store,
        listing_id=payload.listing_id,
        audience=payload.audience,
        report_format=payload.report_format,
        owner_id=account.user.id,
        branding=payload.branding,
        report_metadata_extra=_report_credit_metadata(credit_source_order_id),
    )
    _save_report_ai_insights(ai_insight_store, report)
    return report


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


@router.get("/ai-insights", response_model=list[AIInsightListItem])
def list_ai_insights(
    ai_insight_store: AIInsightStoreDep,
    account: CurrentAccountDep,
    subject_type: Annotated[AIInsightSubjectType | None, Query()] = None,
    subject_id: Annotated[str | None, Query()] = None,
    insight_type: Annotated[AIInsightType | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> list[AIInsightListItem]:
    return ai_insight_store.list_insights(
        owner_id=account.user.id,
        subject_type=subject_type,
        subject_id=subject_id,
        insight_type=insight_type,
        limit=limit,
    )


@router.get("/ai-insights/{insight_id}", response_model=AIInsight)
def get_ai_insight(
    insight_id: str,
    ai_insight_store: AIInsightStoreDep,
    account: CurrentAccountDep,
) -> AIInsight:
    insight = ai_insight_store.get_insight(insight_id, owner_id=account.user.id)
    if insight is None:
        raise HTTPException(status_code=404, detail="AI insight not found")
    return insight


@router.get("/reports/export")
def export_generated_reports(
    report_store: ReportStoreDep,
    account: CurrentAccountDep,
    export_format: Annotated[str, Query(alias="format", pattern="^(csv|json)$")] = "csv",
    audience: Annotated[ReportAudience | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=10_000)] = 1_000,
) -> Response:
    _ensure_export_allowed(account)
    reports = report_store.list_reports_with_metadata(limit=limit, owner_id=account.user.id)
    if audience is not None:
        reports = [report for report in reports if report.audience == audience]

    rows = [_report_export_row(report) for report in reports]
    if export_format == "json":
        content = json.dumps(rows, ensure_ascii=False, indent=2)
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": 'attachment; filename="domarion-reports.json"'},
        )

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=REPORT_EXPORT_COLUMNS, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
    return Response(
        content=output.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="domarion-reports.csv"'},
    )


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


@router.post("/admin/alerts/deliver-daily-email", response_model=AlertDeliveryBatchResult)
def deliver_daily_email_alerts(
    repository: RepositoryDep,
    user_store: UserStoreDep,
    account: CurrentAccountDep,
    payload: AlertDeliveryBatchRequest | None = None,
) -> AlertDeliveryBatchResult:
    _ensure_admin(account)
    return run_daily_email_alert_delivery(
        repository=repository,
        user_store=user_store,
        request=payload or AlertDeliveryBatchRequest(),
    )


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


def _deduplication_match_to_schema(
    row: PropertyDeduplicationMatchRow,
) -> PropertyDeduplicationMatch:
    return PropertyDeduplicationMatch(
        id=row.id,
        job_id=row.job_id,
        source_name=row.source_name,
        source_listing_id=row.source_listing_id,
        candidate_property_id=row.candidate_property_id,
        matched_property_id=row.matched_property_id,
        decision=row.decision,
        review_status=row.review_status,
        match_score=row.match_score,
        reasons=row.reasons_json,
        incoming_payload=row.incoming_payload,
        candidate_payload=row.candidate_payload,
        created_at=row.created_at,
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


def _normalize_partner_referral_payload(
    payload: PartnerReferralCreate,
    account: CurrentAccount,
) -> PartnerReferralCreate:
    data = payload.model_dump()
    for key in (
        "source_context",
        "listing_id",
        "report_id",
        "city",
        "district",
        "contact_name",
        "contact_email",
        "contact_phone",
        "message",
    ):
        data[key] = _blank_to_none(data.get(key))

    data["source_context"] = data["source_context"] or "manual"
    data["city"] = data["city"] or "Wrocław"
    if data["contact_email"] is None and account.user.email:
        data["contact_email"] = account.user.email
    if data["contact_email"] is None and data["contact_phone"] is None:
        raise HTTPException(
            status_code=400,
            detail="Provide contact_email or contact_phone for partner referral",
        )

    return PartnerReferralCreate(**data)


def _blank_to_none(value: object) -> object | None:
    if isinstance(value, str):
        stripped = value.strip()
        return stripped or None
    return value


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
    order_store: ReportOrderStore,
) -> AccountSummary:
    credit_balance = _report_credit_balance(account.user.id, report_store, order_store)
    usage = AccountUsage(
        favorites=len(user_store.list_favorites(account.user.id)),
        alerts=len(user_store.list_alerts(account.user.id)),
        reports_this_month=_count_reports_against_subscription_limit(
            report_store,
            account.user.id,
        ),
        report_credits_available=credit_balance,
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


def _ensure_export_allowed(account: CurrentAccount) -> None:
    if account.limits.can_export:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "code": "plan_limit_reached",
            "resource": "exports",
            "plan": account.subscription.plan,
            "required_capability": "can_export",
        },
    )


REPORT_EXPORT_COLUMNS = [
    "id",
    "owner_id",
    "listing_id",
    "audience",
    "report_format",
    "content_type",
    "title",
    "summary",
    "created_at",
    "content_url",
    "report_product_code",
    "report_template_code",
    "report_template_name",
    "area_id",
    "city",
    "district",
    "investment_score",
    "risk_score",
    "negotiation_score",
    "decision_label",
    "price_label",
    "risk_label",
    "negotiation_label",
    "liquidity_index",
    "buyer_market_index",
    "seller_market_index",
    "overheated_index",
    "paid_order_id",
    "user_submitted_draft_id",
    "source_domain",
    "report_credit_source_order_id",
]


def _report_export_row(report: GeneratedReport) -> dict[str, object]:
    metadata = report.report_metadata
    row = {
        "id": report.id,
        "owner_id": report.owner_id,
        "listing_id": report.listing_id,
        "audience": report.audience,
        "report_format": report.report_format,
        "content_type": report.content_type,
        "title": report.title,
        "summary": report.summary,
        "created_at": report.created_at.isoformat(),
        "content_url": f"/api/v1/reports/{report.id}/content",
    }
    for key in REPORT_EXPORT_COLUMNS:
        if key not in row and key in metadata:
            row[key] = _report_export_value(metadata[key])
    return {column: row.get(column, "") for column in REPORT_EXPORT_COLUMNS}


def _report_export_value(value: object) -> object:
    if isinstance(value, str | int | float | bool) or value is None:
        return value if value is not None else ""
    return json.dumps(value, ensure_ascii=False, sort_keys=True)


def _ensure_report_limit(
    account: CurrentAccount,
    report_store: ReportStore,
    order_store: ReportOrderStore,
) -> str | None:
    reports_count = _count_reports_against_subscription_limit(report_store, account.user.id)
    if reports_count < account.limits.monthly_reports:
        return None

    credit_source_order_id = _available_report_credit_source_order_id(
        account.user.id,
        report_store,
        order_store,
    )
    if credit_source_order_id is not None:
        return credit_source_order_id

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "code": "plan_limit_reached",
            "resource": "reports",
            "plan": account.subscription.plan,
            "limit": account.limits.monthly_reports,
            "report_credits_available": 0,
        },
    )


REPORT_BUNDLE_5_REFERENCE = "bundle:reports-5"
REPORT_BUNDLE_5_CREDITS = 5
REPORT_CREDIT_CONSUMED_KEY = "report_credit_source_order_id"


def _report_credit_metadata(credit_source_order_id: str | None) -> dict:
    if credit_source_order_id is None:
        return {}
    return {
        "report_credit_consumed": 1,
        REPORT_CREDIT_CONSUMED_KEY: credit_source_order_id,
    }


def _count_reports_against_subscription_limit(report_store: ReportStore, owner_id: str) -> int:
    reports = report_store.list_reports_with_metadata(limit=10_000, owner_id=owner_id)
    return sum(1 for report in reports if _counts_against_subscription_limit(report))


def _counts_against_subscription_limit(report: GeneratedReport) -> bool:
    metadata = report.report_metadata
    return not (
        metadata.get("paid_order_id")
        or metadata.get("report_bundle_receipt")
        or metadata.get("report_credit_consumed")
    )


def _report_credit_balance(
    owner_id: str,
    report_store: ReportStore,
    order_store: ReportOrderStore,
) -> int:
    return sum(_available_credits_by_order(owner_id, report_store, order_store).values())


def _available_report_credit_source_order_id(
    owner_id: str,
    report_store: ReportStore,
    order_store: ReportOrderStore,
) -> str | None:
    for order_id, available in _available_credits_by_order(
        owner_id,
        report_store,
        order_store,
    ).items():
        if available > 0:
            return order_id
    return None


def _available_credits_by_order(
    owner_id: str,
    report_store: ReportStore,
    order_store: ReportOrderStore,
) -> dict[str, int]:
    bundle_orders = [
        order
        for order in order_store.list_orders(owner_id, limit=10_000)
        if order.product_code == "report_bundle_5" and order.status == "fulfilled"
    ]
    credits_by_order = {order.id: REPORT_BUNDLE_5_CREDITS for order in bundle_orders}
    if not credits_by_order:
        return {}

    reports = report_store.list_reports_with_metadata(limit=10_000, owner_id=owner_id)
    for report in reports:
        source_order_id = report.report_metadata.get(REPORT_CREDIT_CONSUMED_KEY)
        if source_order_id in credits_by_order:
            credits_by_order[source_order_id] -= 1
    return {order_id: max(available, 0) for order_id, available in credits_by_order.items()}


DRAFT_REPORT_LISTING_PREFIX = "draft:"
AREA_REPORT_LISTING_PREFIX = "area:"
BUNDLE_REPORT_LISTING_PREFIX = "bundle:"


def _validate_report_order_listing_reference(
    listing_id: str,
    product_code: ReportProductCode,
    repository: RealEstateRepository,
    draft_store: UserSubmittedListingStore,
    owner_id: str,
) -> dict[str, str | int | None]:
    if product_code == "report_bundle_5":
        _bundle_reference_from_report_listing_id(listing_id)
        return {
            "listing_reference_type": "report_bundle",
            "bundle_code": "reports-5",
            "report_credits": REPORT_BUNDLE_5_CREDITS,
        }

    if _is_bundle_report_listing_id(listing_id):
        raise HTTPException(
            status_code=400,
            detail="Bundle references require report_bundle_5 product",
        )

    if product_code == "area_report":
        area_id = _area_id_from_report_listing_id(listing_id)
        area = repository.get_area_statistics(area_id)
        if area is None:
            raise HTTPException(status_code=404, detail="Area not found")
        return {
            "listing_reference_type": "area",
            "area_id": area.area_id,
            "city": area.city,
            "district": area.name,
        }

    if _is_area_report_listing_id(listing_id):
        raise HTTPException(
            status_code=400,
            detail="Area references require area_report product",
        )

    if _is_draft_report_listing_id(listing_id):
        draft_id = _draft_id_from_report_listing_id(listing_id)
        draft = draft_store.get_draft(owner_id, draft_id)
        if draft is None:
            raise HTTPException(status_code=404, detail="User-submitted listing draft not found")
        return {
            "listing_reference_type": "user_submitted_draft",
            "user_submitted_draft_id": draft.id,
            "source_domain": draft.source_domain,
        }

    listing = repository.get_listing(listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    return {"listing_reference_type": "listing", "listing_id": listing.id}


def _generate_paid_report_for_order(
    repository: RealEstateRepository,
    draft_store: UserSubmittedListingStore,
    report_store: ReportStore,
    ai_insight_store: AIInsightStore,
    order: ReportOrder,
) -> GeneratedReport:
    if order.product_code == "report_bundle_5":
        _bundle_reference_from_report_listing_id(order.listing_id)
        report = generate_and_store_report_bundle_receipt(
            report_store=report_store,
            owner_id=order.owner_id,
            order_id=order.id,
            credits=REPORT_BUNDLE_5_CREDITS,
            report_format=order.report_format,
        )
        return _save_report_ai_insights(ai_insight_store, report)

    if _is_bundle_report_listing_id(order.listing_id):
        raise HTTPException(
            status_code=400,
            detail="Bundle references require report_bundle_5 product",
        )

    if order.product_code == "area_report":
        area_id = _area_id_from_report_listing_id(order.listing_id)
        area = repository.get_area_statistics(area_id)
        if area is None:
            raise HTTPException(status_code=404, detail="Area not found")
        report = generate_and_store_area_report(
            repository=repository,
            report_store=report_store,
            area_id=area_id,
            audience=order.audience,
            report_format=order.report_format,
            owner_id=order.owner_id,
            report_metadata_extra={"paid_order_id": order.id},
        )
        return _save_report_ai_insights(ai_insight_store, report)

    if _is_area_report_listing_id(order.listing_id):
        raise HTTPException(
            status_code=400,
            detail="Area references require area_report product",
        )

    if _is_draft_report_listing_id(order.listing_id):
        draft_id = _draft_id_from_report_listing_id(order.listing_id)
        draft = draft_store.get_draft(order.owner_id, draft_id)
        if draft is None:
            raise HTTPException(status_code=404, detail="User-submitted listing draft not found")
        report = generate_and_store_user_submitted_draft_report(
            report_store=report_store,
            draft=draft,
            audience=order.audience,
            report_format=order.report_format,
            owner_id=order.owner_id,
            product_code=order.product_code,
            report_metadata_extra={"paid_order_id": order.id},
        )
        return _save_report_ai_insights(ai_insight_store, report)

    report = generate_and_store_object_report(
        repository=repository,
        report_store=report_store,
        listing_id=order.listing_id,
        audience=order.audience,
        report_format=order.report_format,
        owner_id=order.owner_id,
        product_code=order.product_code,
        report_metadata_extra={"paid_order_id": order.id},
    )
    return _save_report_ai_insights(ai_insight_store, report)


def _save_report_ai_insights(
    ai_insight_store: AIInsightStore,
    report: GeneratedReport,
) -> GeneratedReport:
    persist_generated_report_insights(ai_insight_store, report)
    return report


def _is_draft_report_listing_id(listing_id: str) -> bool:
    return listing_id.startswith(DRAFT_REPORT_LISTING_PREFIX)


def _draft_id_from_report_listing_id(listing_id: str) -> str:
    draft_id = listing_id.removeprefix(DRAFT_REPORT_LISTING_PREFIX).strip()
    if not draft_id:
        raise HTTPException(status_code=400, detail="Draft listing reference is empty")
    return draft_id


def _is_area_report_listing_id(listing_id: str) -> bool:
    return listing_id.startswith(AREA_REPORT_LISTING_PREFIX)


def _area_id_from_report_listing_id(listing_id: str) -> str:
    if not _is_area_report_listing_id(listing_id):
        raise HTTPException(
            status_code=400,
            detail="Area report orders require listing_id in area:<area_id> format",
        )

    area_id = listing_id.removeprefix(AREA_REPORT_LISTING_PREFIX).strip()
    if not area_id:
        raise HTTPException(status_code=400, detail="Area listing reference is empty")
    return area_id


def _is_bundle_report_listing_id(listing_id: str) -> bool:
    return listing_id.startswith(BUNDLE_REPORT_LISTING_PREFIX)


def _bundle_reference_from_report_listing_id(listing_id: str) -> str:
    if listing_id != REPORT_BUNDLE_5_REFERENCE:
        raise HTTPException(
            status_code=400,
            detail="Report bundle orders require listing_id bundle:reports-5",
        )
    return "reports-5"


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
