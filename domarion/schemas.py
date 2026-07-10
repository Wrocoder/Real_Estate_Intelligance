from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

MarketType = Literal["primary", "secondary"]
ReportAudience = Literal["buyer", "realtor", "investor"]
ReportFormat = Literal["json", "html"]
AlertChannel = Literal["email", "telegram"]
AlertFrequency = Literal["instant", "daily", "weekly"]
UserRole = Literal["buyer", "realtor", "agency_admin", "admin"]
SubscriptionPlan = Literal["free", "buyer_pro", "realtor", "agency", "enterprise"]
SubscriptionStatus = Literal["trialing", "active", "past_due", "canceled"]
ReportProductCode = Literal["object_report", "full_object_analysis", "investor_report"]
ReportOrderStatus = Literal["unpaid", "paid", "fulfilled", "canceled"]
PaymentProviderName = Literal["mock", "stripe", "payu"]
ReportOrderEventType = Literal[
    "order_created",
    "checkout_created",
    "payment_marked_paid",
    "report_fulfilled",
    "fulfillment_skipped",
    "payment_provider_error",
]
IngestionJobStatus = Literal["queued", "running", "succeeded", "failed"]
DataQualitySeverity = Literal["info", "warning", "error"]
AlertDeliveryStatus = Literal["dry_run", "sent", "skipped", "failed"]
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
    investment_score: int = Field(ge=0, le=100)
    risk_score: int = Field(ge=0, le=100)
    negotiation_score: int = Field(ge=0, le=100)
    liquidity_score: int = Field(ge=0, le=100)
    rental_potential_score: int = Field(ge=0, le=100)
    fair_price_low: int
    fair_price_mid: int
    fair_price_high: int
    price_delta_to_fair_mid_pct: float
    breakdown: ScoreBreakdown
    reasons: list[str]
    warnings: list[str]


class ListingAnalysis(BaseModel):
    listing: Listing
    area_statistics: AreaStatistics
    price_history: list[PriceHistoryPoint]
    comparables: list[Listing]
    scores: PropertyScores
    insights: list[str]
    negotiation_arguments: list[str]
    data_quality_notes: list[str]


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


class ReportRequest(BaseModel):
    listing_id: str
    audience: ReportAudience = "buyer"


class GenerateReportRequest(ReportRequest):
    report_format: ReportFormat = "html"


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


class ReportSection(BaseModel):
    title: str
    items: list[str]


class ObjectReport(BaseModel):
    listing_id: str
    audience: ReportAudience
    summary: str
    sections: list[ReportSection]
    disclaimer: str


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
