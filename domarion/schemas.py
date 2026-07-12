from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator

MarketType = Literal["primary", "secondary"]
ReportAudience = Literal["buyer", "realtor", "investor"]
ReportFormat = Literal["json", "html"]
AlertChannel = Literal["email", "telegram"]
AlertFrequency = Literal["instant", "daily", "weekly"]
UserRole = Literal["buyer", "realtor", "agency_admin", "admin"]
SubscriptionPlan = Literal["free", "buyer_pro", "investor", "realtor", "agency", "enterprise"]
SubscriptionStatus = Literal["trialing", "active", "past_due", "canceled"]
ReportProductCode = Literal[
    "object_report",
    "full_object_analysis",
    "investor_report",
    "area_report",
    "report_bundle_5",
]
ReportOrderStatus = Literal["unpaid", "paid", "fulfilled", "canceled"]
ReportEmailStatus = Literal["dry_run", "sent", "skipped", "failed"]
PaymentProviderName = Literal["mock", "stripe", "payu"]
PartnerReferralType = Literal["mortgage", "legal", "renovation"]
PartnerReferralStatus = Literal["new", "contacted", "qualified", "closed", "rejected"]
ReportOrderEventType = Literal[
    "order_created",
    "checkout_created",
    "payment_marked_paid",
    "payment_webhook_processed",
    "payment_webhook_ignored",
    "report_fulfilled",
    "fulfillment_skipped",
    "payment_provider_error",
]
PaymentWebhookStatus = Literal["processed", "duplicate", "ignored", "rejected"]
IngestionJobStatus = Literal["queued", "running", "succeeded", "failed"]
DataQualitySeverity = Literal["info", "warning", "error"]
IngestionSourceHealthStatus = Literal["healthy", "warning", "failing"]
SourceLegalStatus = Literal["unknown", "approved", "review_required", "blocked"]
AlertDeliveryStatus = Literal["dry_run", "sent", "skipped", "failed"]
SourceReferenceProvider = Literal["otodom", "olx", "other"]
SourceUrlImportStatus = Literal["extracted", "partial", "failed", "unsupported"]
ScoreDecisionLabel = Literal[
    "strong_candidate",
    "good_option",
    "fair_option",
    "overpriced",
    "risky",
    "weak_fit",
]
ScorePriceLabel = Literal["below_fair", "fair", "above_fair", "overpriced"]
ScoreRiskLabel = Literal["low_risk", "moderate_risk", "elevated_risk", "high_risk"]
ScoreNegotiationLabel = Literal[
    "weak_negotiation",
    "some_negotiation",
    "negotiable",
    "strong_negotiation",
]
ScorePotentialLabel = Literal["weak", "moderate", "good", "strong"]
MortgageRateType = Literal["fixed", "variable"]
MortgageAffordabilityStatus = Literal["unknown", "comfortable", "stretched", "high_risk"]
ListingSort = Literal[
    "price_asc",
    "price_desc",
    "price_per_m2_asc",
    "price_per_m2_desc",
    "investment_score_desc",
    "investment_score_asc",
    "risk_score_asc",
    "risk_score_desc",
    "negotiation_score_desc",
    "negotiation_score_asc",
    "days_on_market_asc",
    "days_on_market_desc",
    "newest",
    "oldest",
]


class PriceHistoryPoint(BaseModel):
    observed_at: date
    price: int
    price_per_m2: int


class Listing(BaseModel):
    id: str
    title: str
    source_name: str
    source_url: str
    city: str
    district: str
    area_id: str
    municipality: str
    address: str
    market_type: MarketType
    price: int
    currency: str = "PLN"
    area_m2: float
    price_per_m2: int
    rooms: int
    floor: int | None = None
    building_floors: int | None = None
    building_year: int | None = None
    first_seen_at: date
    last_seen_at: date
    days_on_market: int
    price_reductions: int
    price_increases: int
    relisted: bool
    lat: float
    lon: float
    distance_to_center_km: float
    nearest_stop_m: int
    nearest_school_m: int
    nearest_major_road_m: int
    nearest_industrial_zone_m: int
    parks_within_1km: int
    schools_within_1km: int
    planned_investments_within_2km: int
    data_quality_score: int = Field(ge=0, le=100)


class AreaStatistics(BaseModel):
    area_id: str
    name: str
    city: str
    median_price_per_m2: int
    average_price_per_m2: int
    active_listings: int
    new_listings_30d: int
    removed_listings_30d: int
    average_days_on_market: int
    price_change_90d_pct: float
    supply_change_90d_pct: float


class AreaMarketSnapshot(AreaStatistics):
    id: int | None = None
    calculated_at: datetime


class AreaMarketSnapshotJobResult(BaseModel):
    calculated_at: datetime
    dry_run: bool
    snapshots_created: int = Field(ge=0)
    snapshots: list[AreaMarketSnapshot] = Field(default_factory=list)


class PlannedInvestment(BaseModel):
    id: str
    name: str
    investment_type: str
    status: str
    city: str
    district: str | None = None
    expected_year: int | None = None
    lat: float
    lon: float
    source_url: str | None = None
    confidence_score: int = Field(ge=0, le=100)
    notes: str | None = None


class PlannedInvestmentCreate(BaseModel):
    name: str
    investment_type: str
    status: str = "planned"
    city: str
    district: str | None = None
    expected_year: int | None = Field(default=None, ge=2020, le=2100)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    source_url: str | None = None
    confidence_score: int = Field(default=50, ge=0, le=100)
    notes: str | None = None


class PlannedInvestmentUpdate(BaseModel):
    name: str | None = None
    investment_type: str | None = None
    status: str | None = None
    city: str | None = None
    district: str | None = None
    expected_year: int | None = Field(default=None, ge=2020, le=2100)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lon: float | None = Field(default=None, ge=-180, le=180)
    source_url: str | None = None
    confidence_score: int | None = Field(default=None, ge=0, le=100)
    notes: str | None = None


class IngestionJobCreate(BaseModel):
    source_name: str
    source_type: str = "partner_csv"
    status: IngestionJobStatus = "queued"
    created_by: str = "system"
    notes: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class IngestionJob(BaseModel):
    id: str
    source_name: str
    source_type: str
    status: IngestionJobStatus
    rows_seen: int = Field(ge=0)
    raw_created: int = Field(ge=0)
    raw_updated: int = Field(ge=0)
    properties_created: int = Field(ge=0)
    properties_updated: int = Field(ge=0)
    snapshots_created: int = Field(ge=0)
    snapshots_updated: int = Field(ge=0)
    errors_count: int = Field(ge=0)
    created_by: str
    notes: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    started_at: datetime | None = None
    finished_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class IngestionSourceHealth(BaseModel):
    source_name: str
    source_type: str
    health_status: IngestionSourceHealthStatus
    latest_job_id: str
    latest_job_status: IngestionJobStatus
    rows_seen: int = Field(ge=0)
    errors_count: int = Field(ge=0)
    warning_count: int = Field(ge=0)
    error_count: int = Field(ge=0)
    last_error_message: str | None = None
    updated_at: datetime


class SourceRegistryEntry(BaseModel):
    id: str
    name: str
    source_type: str
    base_url: str | None = None
    legal_status: SourceLegalStatus = "unknown"
    refresh_cadence: str = "manual"
    owner: str = "internal"
    ingestion_method: str = "manual"
    allowed_use: list[str] = Field(default_factory=list)
    robots_txt_url: str | None = None
    terms_url: str | None = None
    notes: str | None = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class SourceRegistryEntryCreate(BaseModel):
    name: str
    source_type: str = "partner_csv"
    base_url: str | None = None
    legal_status: SourceLegalStatus = "review_required"
    refresh_cadence: str = "manual"
    owner: str = "internal"
    ingestion_method: str = "partner_csv"
    allowed_use: list[str] = Field(default_factory=list)
    robots_txt_url: str | None = None
    terms_url: str | None = None
    notes: str | None = None
    is_active: bool = True


class SourceRegistryEntryUpdate(BaseModel):
    name: str | None = None
    source_type: str | None = None
    base_url: str | None = None
    legal_status: SourceLegalStatus | None = None
    refresh_cadence: str | None = None
    owner: str | None = None
    ingestion_method: str | None = None
    allowed_use: list[str] | None = None
    robots_txt_url: str | None = None
    terms_url: str | None = None
    notes: str | None = None
    is_active: bool | None = None


class PartnerCsvImportResponse(BaseModel):
    rows_seen: int = Field(ge=0)
    raw_created: int = Field(ge=0)
    raw_updated: int = Field(ge=0)
    properties_created: int = Field(ge=0)
    properties_updated: int = Field(ge=0)
    snapshots_created: int = Field(ge=0)
    snapshots_updated: int = Field(ge=0)
    dry_run: bool
    listing_ids: list[str] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
    job: IngestionJob


class PriceHistoryRebuildResult(BaseModel):
    property_sources_seen: int = Field(ge=0)
    snapshots_seen: int = Field(ge=0)
    snapshots_updated: int = Field(ge=0)


class PlannedInvestmentImportResponse(BaseModel):
    rows_seen: int = Field(ge=0)
    created: int = Field(ge=0)
    updated: int = Field(ge=0)
    skipped: int = Field(ge=0)
    dry_run: bool
    investment_ids: list[str] = Field(default_factory=list)
    source_ids: list[str] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
    job: IngestionJob


class DataQualityLogCreate(BaseModel):
    job_id: str | None = None
    source_name: str
    source_listing_id: str | None = None
    severity: DataQualitySeverity = "info"
    code: str
    message: str
    payload: dict[str, Any] = Field(default_factory=dict)


class DataQualityLog(BaseModel):
    id: str
    job_id: str | None = None
    source_name: str
    source_listing_id: str | None = None
    severity: DataQualitySeverity
    code: str
    message: str
    payload: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class RawListingSummary(BaseModel):
    id: int | str
    source_name: str
    source_listing_id: str
    source_url: str
    fetched_at: datetime
    payload_hash: str
    raw_payload: dict[str, Any] = Field(default_factory=dict)


class MapPointGeometry(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: tuple[float, float]


class MapFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    id: str
    geometry: MapPointGeometry
    properties: dict[str, Any]


class MapFeatureCollection(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[MapFeature]
    bbox: tuple[float, float, float, float] | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ScoreBreakdown(BaseModel):
    price_position: int
    area_trend: int
    transport: int
    future_infrastructure: int
    liquidity: int
    lifestyle_infrastructure: int
    rental_potential: int
    data_quality: int
    risk_penalty: int


class PropertyScores(BaseModel):
    formula_version: str
    weights_profile: str
    decision_label: ScoreDecisionLabel
    price_label: ScorePriceLabel
    risk_label: ScoreRiskLabel
    negotiation_label: ScoreNegotiationLabel
    liquidity_label: ScorePotentialLabel
    rental_potential_label: ScorePotentialLabel
    investment_score: int = Field(ge=0, le=100)
    risk_score: int = Field(ge=0, le=100)
    negotiation_score: int = Field(ge=0, le=100)
    liquidity_score: int = Field(ge=0, le=100)
    rental_potential_score: int = Field(ge=0, le=100)
    fair_price_low: int
    fair_price_mid: int
    fair_price_high: int
    fair_price_confidence_score: int = Field(ge=0, le=100)
    price_delta_to_fair_mid_pct: float
    breakdown: ScoreBreakdown
    reasons: list[str]
    warnings: list[str]

    @model_validator(mode="before")
    @classmethod
    def fill_missing_score_labels(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        next_data = dict(data)
        investment_score = _int_label_input(next_data.get("investment_score"))
        risk_score = _int_label_input(next_data.get("risk_score"))
        negotiation_score = _int_label_input(next_data.get("negotiation_score"))
        liquidity_score = _int_label_input(next_data.get("liquidity_score"))
        rental_potential_score = _int_label_input(next_data.get("rental_potential_score"))
        price_delta = _float_label_input(next_data.get("price_delta_to_fair_mid_pct"))

        next_data.setdefault(
            "decision_label",
            _score_decision_label(
                investment_score,
                risk_score,
                price_delta,
                negotiation_score,
            ),
        )
        next_data.setdefault("price_label", _score_price_label(price_delta))
        next_data.setdefault("risk_label", _score_risk_label(risk_score))
        next_data.setdefault("negotiation_label", _score_negotiation_label(negotiation_score))
        next_data.setdefault("liquidity_label", _score_potential_label(liquidity_score))
        next_data.setdefault(
            "rental_potential_label",
            _score_potential_label(rental_potential_score),
        )
        return next_data


def _int_label_input(value: object) -> int:
    if isinstance(value, bool):
        return 0
    try:
        return int(value) if value is not None else 0
    except (TypeError, ValueError):
        return 0


def _float_label_input(value: object) -> float:
    if isinstance(value, bool):
        return 0
    try:
        return float(value) if value is not None else 0
    except (TypeError, ValueError):
        return 0


def _score_decision_label(
    investment_score: int,
    risk_score: int,
    price_delta_to_fair_mid_pct: float,
    negotiation_score: int,
) -> ScoreDecisionLabel:
    if risk_score >= 70:
        return "risky"
    if price_delta_to_fair_mid_pct >= 12 and investment_score < 65:
        return "overpriced"
    if investment_score >= 75 and risk_score <= 35 and price_delta_to_fair_mid_pct <= 5:
        return "strong_candidate"
    if investment_score >= 62 and risk_score <= 50:
        return "good_option"
    if negotiation_score >= 70 and price_delta_to_fair_mid_pct > 5:
        return "overpriced"
    if investment_score < 45 or risk_score >= 60:
        return "weak_fit"
    return "fair_option"


def _score_price_label(price_delta_to_fair_mid_pct: float) -> ScorePriceLabel:
    if price_delta_to_fair_mid_pct <= -6:
        return "below_fair"
    if price_delta_to_fair_mid_pct >= 12:
        return "overpriced"
    if price_delta_to_fair_mid_pct >= 5:
        return "above_fair"
    return "fair"


def _score_risk_label(risk_score: int) -> ScoreRiskLabel:
    if risk_score >= 70:
        return "high_risk"
    if risk_score >= 50:
        return "elevated_risk"
    if risk_score >= 30:
        return "moderate_risk"
    return "low_risk"


def _score_negotiation_label(negotiation_score: int) -> ScoreNegotiationLabel:
    if negotiation_score >= 75:
        return "strong_negotiation"
    if negotiation_score >= 55:
        return "negotiable"
    if negotiation_score >= 35:
        return "some_negotiation"
    return "weak_negotiation"


def _score_potential_label(score: int) -> ScorePotentialLabel:
    if score >= 75:
        return "strong"
    if score >= 60:
        return "good"
    if score >= 40:
        return "moderate"
    return "weak"


class ScoringBacktestItem(BaseModel):
    listing_id: str
    title: str
    area_id: str
    observed_at: date
    target_observed_at: date
    predicted_fair_price_mid: int
    actual_price: int
    absolute_error_pct: float = Field(ge=0)
    formula_version: str
    weights_profile: str


class ScoringBacktestResult(BaseModel):
    formula_version: str
    weights_profile: str
    listings_seen: int = Field(ge=0)
    listings_evaluated: int = Field(ge=0)
    evaluated_points: int = Field(ge=0)
    mean_absolute_error_pct: float | None = Field(default=None, ge=0)
    median_absolute_error_pct: float | None = Field(default=None, ge=0)
    within_5_pct: float | None = Field(default=None, ge=0, le=100)
    within_10_pct: float | None = Field(default=None, ge=0, le=100)
    items: list[ScoringBacktestItem] = Field(default_factory=list)


class ListingAnalysis(BaseModel):
    listing: Listing
    area_statistics: AreaStatistics
    price_history: list[PriceHistoryPoint]
    comparables: list[Listing]
    scores: PropertyScores
    insights: list[str]
    negotiation_arguments: list[str]
    data_quality_notes: list[str]


class SourceReferencePreviewRequest(BaseModel):
    source_url: str = Field(min_length=3, max_length=1000)


class SourceReferencePreview(BaseModel):
    source_url_private: str
    source_domain: str | None = None
    provider: SourceReferenceProvider
    provider_label: str
    listing_reference_id: str | None = None
    source_slug: str | None = None
    suggested_title: str | None = None
    manual_fields_required: list[str]
    manual_fields_recommended: list[str]
    privacy_note: str
    warnings: list[str] = Field(default_factory=list)


class SourceUrlImportRequest(BaseModel):
    source_url: str = Field(min_length=3, max_length=1000)
    timeout_seconds: float = Field(default=8, ge=1, le=20)


class SourceUrlImportFields(BaseModel):
    title: str | None = None
    address: str | None = None
    city: str | None = None
    district: str | None = None
    market_type: MarketType | None = None
    price: int | None = Field(default=None, gt=0)
    area_m2: float | None = Field(default=None, gt=0)
    rooms: int | None = Field(default=None, ge=1, le=10)
    floor: int | None = Field(default=None, ge=0, le=80)
    building_floors: int | None = Field(default=None, ge=1, le=120)
    building_year: int | None = Field(default=None, ge=1800, le=2100)


class SourceUrlImportResult(BaseModel):
    reference_preview: SourceReferencePreview
    status: SourceUrlImportStatus
    fields: SourceUrlImportFields
    fields_extracted: list[str] = Field(default_factory=list)
    extraction_source: str | None = None
    fetched_at: datetime | None = None
    fetch_status_code: int | None = None
    warnings: list[str] = Field(default_factory=list)


class UserSubmittedListingRequest(BaseModel):
    title: str | None = None
    source_url: str | None = None
    address: str
    city: str = "Wrocław"
    district: str
    market_type: MarketType = "secondary"
    price: int = Field(gt=0)
    area_m2: float = Field(gt=0)
    rooms: int = Field(ge=1, le=10)
    floor: int | None = Field(default=None, ge=0, le=80)
    building_floors: int | None = Field(default=None, ge=1, le=120)
    building_year: int | None = Field(default=None, ge=1800, le=2100)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lon: float | None = Field(default=None, ge=-180, le=180)
    distance_to_center_km: float | None = Field(default=None, ge=0)
    nearest_stop_m: int | None = Field(default=None, ge=0)
    nearest_school_m: int | None = Field(default=None, ge=0)
    nearest_major_road_m: int | None = Field(default=None, ge=0)
    nearest_industrial_zone_m: int | None = Field(default=None, ge=0)
    parks_within_1km: int | None = Field(default=None, ge=0)
    schools_within_1km: int | None = Field(default=None, ge=0)
    planned_investments_within_2km: int | None = Field(default=None, ge=0)
    confirm_private_analysis: bool
    save_private_draft: bool = True
    retention_days: int = Field(default=30, ge=1, le=180)


class UserSubmittedListingAnalysis(BaseModel):
    analysis: ListingAnalysis
    confidence_score: int = Field(ge=0, le=100)
    source_url_private: str | None = None
    source_domain: str | None = None
    warnings: list[str] = Field(default_factory=list)
    comparables_basis: str
    retention_note: str
    draft_id: str | None = None
    draft_expires_at: datetime | None = None


class UserSubmittedListingDraft(BaseModel):
    id: str
    owner_id: str
    listing_id: str
    source_url_private: str | None = None
    source_domain: str | None = None
    address: str
    city: str
    district: str
    market_type: MarketType
    price: int
    area_m2: float
    rooms: int
    data_quality_score: int = Field(ge=0, le=100)
    confidence_score: int = Field(ge=0, le=100)
    request_payload: dict[str, Any] = Field(default_factory=dict)
    analysis_payload: dict[str, Any] = Field(default_factory=dict)
    expires_at: datetime
    created_at: datetime
    updated_at: datetime


class UserSubmittedListingDraftPruneResult(BaseModel):
    deleted: int = Field(ge=0)


class ListingSearchResponse(BaseModel):
    items: list[ListingAnalysis]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1)
    total_pages: int = Field(ge=0)
    sort: ListingSort
    filters: dict[str, Any] = Field(default_factory=dict)


class CompareRequest(BaseModel):
    listing_ids: list[str] = Field(min_length=2, max_length=5)


class CompareResponse(BaseModel):
    items: list[ListingAnalysis]


class MarketDistributionBucket(BaseModel):
    label: str
    count: int = Field(ge=0)
    min_value: float | None = None
    max_value: float | None = None


class MarketDashboardArea(BaseModel):
    area_id: str
    name: str
    city: str
    median_price_per_m2: int
    average_price_per_m2: int
    active_listings: int = Field(ge=0)
    new_listings_30d: int = Field(ge=0)
    removed_listings_30d: int = Field(ge=0)
    average_days_on_market: int = Field(ge=0)
    price_change_90d_pct: float
    supply_change_90d_pct: float
    liquidity_index: int = Field(ge=0, le=100)
    overheated_index: int = Field(ge=0, le=100)
    buyer_market_index: int = Field(ge=0, le=100)
    seller_market_index: int = Field(ge=0, le=100)


class MarketDashboard(BaseModel):
    city: str | None = None
    district: str | None = None
    listings_count: int = Field(ge=0)
    active_listings: int = Field(ge=0)
    new_listings_30d: int = Field(ge=0)
    removed_listings_30d: int = Field(ge=0)
    average_days_on_market: int = Field(ge=0)
    median_price: int | None = None
    median_price_per_m2: int | None = None
    average_price_per_m2: int | None = None
    price_change_90d_pct: float | None = None
    supply_change_90d_pct: float | None = None
    price_distribution: list[MarketDistributionBucket]
    price_per_m2_distribution: list[MarketDistributionBucket]
    rooms_distribution: list[MarketDistributionBucket]
    area_distribution: list[MarketDistributionBucket]
    areas: list[MarketDashboardArea]


class MortgageCalculationRequest(BaseModel):
    property_price_pln: int = Field(gt=0)
    down_payment_pln: int = Field(ge=0)
    loan_years: int = Field(default=25, ge=1, le=35)
    annual_interest_rate_pct: float = Field(default=7.5, ge=0, le=30)
    rate_type: MortgageRateType = "fixed"
    market_type: MarketType = "secondary"
    monthly_income_pln: int | None = Field(default=None, gt=0)
    monthly_existing_debt_pln: int = Field(default=0, ge=0)
    monthly_housing_costs_pln: int = Field(default=0, ge=0)
    insurance_monthly_pln: int = Field(default=0, ge=0)
    notary_fee_pln: int = Field(default=5_000, ge=0)
    court_fees_pln: int = Field(default=400, ge=0)
    bank_commission_pct: float = Field(default=0, ge=0, le=10)
    agent_commission_pct: float = Field(default=0, ge=0, le=5)
    renovation_budget_pln: int = Field(default=0, ge=0)
    include_pcc: bool = True


class MortgageCostBreakdown(BaseModel):
    property_price_pln: int
    down_payment_pln: int
    down_payment_pct: float
    loan_amount_pln: int
    loan_to_value_pct: float
    pcc_tax_pln: int
    notary_fee_pln: int
    court_fees_pln: int
    bank_commission_pln: int
    agent_commission_pln: int
    renovation_budget_pln: int
    upfront_cash_needed_pln: int


class MortgageScenario(BaseModel):
    scenario_code: str
    label: str
    annual_interest_rate_pct: float
    loan_years: int
    monthly_principal_interest_pln: int
    monthly_total_payment_pln: int
    total_interest_pln: int
    total_repaid_pln: int
    debt_to_income_pct: float | None = None


class MortgageAffordability(BaseModel):
    status: MortgageAffordabilityStatus
    monthly_income_pln: int | None = None
    available_for_mortgage_comfortable_pln: int | None = None
    available_for_mortgage_stretched_pln: int | None = None
    base_debt_to_income_pct: float | None = None
    payment_to_income_pct: float | None = None
    monthly_buffer_after_payment_pln: int | None = None


class MortgageCalculationResult(BaseModel):
    costs: MortgageCostBreakdown
    base_scenario: MortgageScenario
    scenarios: list[MortgageScenario]
    affordability: MortgageAffordability
    notes: list[str]
    disclaimer: str


class PartnerReferralCreate(BaseModel):
    referral_type: PartnerReferralType
    source_context: str = Field(default="mortgage_calculator", max_length=120)
    listing_id: str | None = Field(default=None, max_length=120)
    report_id: str | None = Field(default=None, max_length=120)
    city: str = Field(default="Wrocław", max_length=80)
    district: str | None = Field(default=None, max_length=80)
    contact_name: str | None = Field(default=None, max_length=160)
    contact_email: str | None = Field(default=None, max_length=255)
    contact_phone: str | None = Field(default=None, max_length=80)
    message: str | None = Field(default=None, max_length=2000)
    consent_to_contact: bool = False
    metadata: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def ensure_contact_consent(self) -> "PartnerReferralCreate":
        if not self.consent_to_contact:
            raise ValueError("consent_to_contact must be true")
        return self


class PartnerReferralUpdate(BaseModel):
    status: PartnerReferralStatus | None = None
    assigned_to: str | None = Field(default=None, max_length=120)
    partner_name: str | None = Field(default=None, max_length=160)
    notes: str | None = Field(default=None, max_length=2000)
    metadata: dict[str, Any] | None = None


class PartnerReferral(BaseModel):
    id: str
    owner_id: str
    referral_type: PartnerReferralType
    status: PartnerReferralStatus
    source_context: str
    listing_id: str | None = None
    report_id: str | None = None
    city: str
    district: str | None = None
    contact_name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    message: str | None = None
    consent_to_contact: bool
    metadata: dict[str, Any] = Field(default_factory=dict)
    assigned_to: str | None = None
    partner_name: str | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime


class ReportBranding(BaseModel):
    agency_name: str | None = None
    agent_name: str | None = None
    agent_email: str | None = None
    agent_phone: str | None = None
    website_url: str | None = None
    note: str | None = None


class ReportRequest(BaseModel):
    listing_id: str
    audience: ReportAudience = "buyer"
    branding: ReportBranding | None = None


class GenerateReportRequest(ReportRequest):
    report_format: ReportFormat = "html"


class GenerateUserSubmittedDraftReportRequest(BaseModel):
    audience: ReportAudience = "buyer"
    report_format: ReportFormat = "html"
    branding: ReportBranding | None = None


class ReportEmailRequest(BaseModel):
    target_email: str | None = None
    dry_run: bool = True


class ReportEmailResult(BaseModel):
    report_id: str
    provider: str
    status: ReportEmailStatus
    target_email: str | None = None
    subject: str
    message: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class ReportProduct(BaseModel):
    code: ReportProductCode
    title: str
    audience: ReportAudience
    amount_grosz: int
    currency: str = "PLN"
    description: str
    features: list[str]


class ReportOrderCreate(BaseModel):
    listing_id: str
    product_code: ReportProductCode = "object_report"
    audience: ReportAudience | None = None
    report_format: ReportFormat = "html"


class ReportOrder(BaseModel):
    id: str
    owner_id: str
    listing_id: str
    product_code: ReportProductCode
    audience: ReportAudience
    report_format: ReportFormat
    status: ReportOrderStatus
    amount_grosz: int
    currency: str = "PLN"
    checkout_url: str | None = None
    generated_report_id: str | None = None
    created_at: datetime
    updated_at: datetime
    paid_at: datetime | None = None
    fulfilled_at: datetime | None = None


class CheckoutSession(BaseModel):
    provider: str
    mode: Literal["mock", "live"]
    checkout_url: str
    order: ReportOrder
    external_reference: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ReportOrderEventCreate(BaseModel):
    event_type: ReportOrderEventType
    actor_id: str | None = None
    message: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ReportOrderEvent(BaseModel):
    id: str
    order_id: str
    owner_id: str
    event_type: ReportOrderEventType
    actor_id: str | None = None
    message: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class PaymentWebhookEventCreate(BaseModel):
    provider: PaymentProviderName
    provider_event_id: str
    order_id: str | None = None
    event_type: str
    status: PaymentWebhookStatus
    payload_hash: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class PaymentWebhookEvent(BaseModel):
    id: str
    provider: PaymentProviderName
    provider_event_id: str
    order_id: str | None = None
    event_type: str
    status: PaymentWebhookStatus
    payload_hash: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class PaymentWebhookResult(BaseModel):
    provider: PaymentProviderName
    provider_event_id: str
    status: PaymentWebhookStatus
    message: str
    order: ReportOrder | None = None
    generated_report_id: str | None = None
    webhook_event: PaymentWebhookEvent


class ReportSection(BaseModel):
    title: str
    items: list[str]


class ReportTemplateDescriptor(BaseModel):
    code: str
    name: str
    audience: ReportAudience
    description: str
    default_sections: list[str]


class ObjectReport(BaseModel):
    listing_id: str
    audience: ReportAudience
    template_code: str
    template_name: str
    branding: ReportBranding | None = None
    summary: str
    sections: list[ReportSection]
    disclaimer: str


class UserSubmittedListingReportRequest(UserSubmittedListingRequest):
    audience: ReportAudience = "buyer"
    branding: ReportBranding | None = None


class UserSubmittedListingReport(BaseModel):
    analysis: UserSubmittedListingAnalysis
    report: ObjectReport


class GeneratedReportCreate(BaseModel):
    owner_id: str = "demo-user"
    listing_id: str
    audience: ReportAudience
    report_format: ReportFormat
    content_type: str
    title: str
    summary: str
    content: str
    report_metadata: dict = Field(default_factory=dict)


class GeneratedReportListItem(BaseModel):
    id: str
    owner_id: str
    listing_id: str
    audience: ReportAudience
    report_format: ReportFormat
    content_type: str
    title: str
    summary: str
    created_at: datetime


class GeneratedReport(GeneratedReportListItem):
    content: str
    report_metadata: dict


class UserAccount(BaseModel):
    id: str
    email: str | None = None
    display_name: str | None = None
    role: UserRole
    created_at: datetime
    updated_at: datetime


class AuthIdentity(BaseModel):
    user_id: str
    email: str | None = None
    display_name: str | None = None
    role: UserRole = "buyer"
    plan: SubscriptionPlan = "free"


class Subscription(BaseModel):
    id: str
    user_id: str
    plan: SubscriptionPlan
    status: SubscriptionStatus
    current_period_start: datetime | None = None
    current_period_end: datetime | None = None
    created_at: datetime
    updated_at: datetime


class SubscriptionUpdate(BaseModel):
    plan: SubscriptionPlan | None = None
    status: SubscriptionStatus | None = None


class PlanLimits(BaseModel):
    plan: SubscriptionPlan
    max_favorites: int
    max_alerts: int
    monthly_reports: int
    max_compare_items: int
    can_export: bool
    can_use_api: bool
    can_white_label: bool


class AccountUsage(BaseModel):
    favorites: int
    alerts: int
    reports_this_month: int
    report_credits_available: int = 0


class AccountSummary(BaseModel):
    user: UserAccount
    subscription: Subscription
    limits: PlanLimits
    usage: AccountUsage


class FavoriteCreate(BaseModel):
    listing_id: str
    note: str | None = None


class FavoriteUpdate(BaseModel):
    note: str | None = None


class Favorite(BaseModel):
    id: str
    owner_id: str
    listing_id: str
    note: str | None = None
    created_at: datetime
    listing: Listing | None = None


class AlertFilters(BaseModel):
    city: str | None = None
    district: str | None = None
    rooms: int | None = Field(default=None, ge=1, le=10)
    max_price: int | None = Field(default=None, gt=0)
    min_area_m2: float | None = Field(default=None, gt=0)
    min_investment_score: int | None = Field(default=None, ge=0, le=100)
    max_risk_score: int | None = Field(default=None, ge=0, le=100)


class AlertCreate(BaseModel):
    name: str
    filters: AlertFilters = Field(default_factory=AlertFilters)
    channel: AlertChannel = "email"
    frequency: AlertFrequency = "daily"
    delivery_target: str | None = None


class AlertUpdate(BaseModel):
    name: str | None = None
    filters: AlertFilters | None = None
    channel: AlertChannel | None = None
    frequency: AlertFrequency | None = None
    delivery_target: str | None = None
    is_active: bool | None = None


class Alert(BaseModel):
    id: str
    owner_id: str
    name: str
    filters: AlertFilters
    channel: AlertChannel
    frequency: AlertFrequency
    delivery_target: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AlertPreview(BaseModel):
    alert: Alert
    matches: list[ListingAnalysis]
    total_matches: int
    applied_filters: dict[str, Any]


class AlertDeliveryRequest(BaseModel):
    dry_run: bool = True
    max_matches: int = Field(default=10, ge=1, le=50)


class AlertDeliveryBatchRequest(BaseModel):
    dry_run: bool = True
    max_matches: int = Field(default=10, ge=1, le=50)
    limit: int = Field(default=500, ge=1, le=1000)
    force: bool = False


class AlertDeliveryJob(BaseModel):
    id: str
    owner_id: str
    alert_id: str
    channel: AlertChannel
    provider: str
    status: AlertDeliveryStatus
    total_matches: int = Field(ge=0)
    delivered_count: int = Field(ge=0)
    message: str
    listing_ids: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class AlertDeliveryBatchSkip(BaseModel):
    owner_id: str
    alert_id: str
    reason: str
    last_delivery_job_id: str | None = None
    last_delivery_at: datetime | None = None


class AlertDeliveryBatchResult(BaseModel):
    frequency: AlertFrequency
    channel: AlertChannel
    dry_run: bool
    force: bool
    alerts_seen: int = Field(ge=0)
    jobs_prepared: int = Field(ge=0)
    jobs_persisted: int = Field(ge=0)
    delivered_count: int = Field(ge=0)
    sent_count: int = Field(ge=0)
    skipped_count: int = Field(ge=0)
    failed_count: int = Field(ge=0)
    jobs: list[AlertDeliveryJob] = Field(default_factory=list)
    skipped: list[AlertDeliveryBatchSkip] = Field(default_factory=list)
