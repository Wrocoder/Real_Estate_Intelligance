import re
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
AgencyMemberRole = Literal["owner", "admin", "agent"]
AgencyMembershipStatus = Literal["active", "invited", "disabled"]
CrmClientStatus = Literal["active", "paused", "won", "lost", "archived"]
CrmNoteVisibility = Literal["internal", "client_shareable"]
CrmShortlistStatus = Literal["draft", "shared", "accepted", "rejected", "archived"]
ReportProductCode = Literal[
    "object_report",
    "full_object_analysis",
    "investor_report",
    "area_report",
    "report_bundle_5",
]
ReportOrderStatus = Literal["unpaid", "paid", "fulfilled", "canceled"]
BillingCustomerType = Literal["individual", "company"]
ReportEmailStatus = Literal["dry_run", "sent", "skipped", "failed"]
PaymentProviderName = Literal["mock", "stripe", "payu"]
PartnerReferralType = Literal[
    "mortgage",
    "legal",
    "renovation",
    "buyer_beta",
    "realtor_beta",
]
PartnerReferralStatus = Literal["new", "contacted", "qualified", "closed", "rejected"]
PartnerLeadPriority = Literal["hot", "warm", "nurture", "low_fit", "disqualified"]
PartnerLeadFit = Literal["mortgage", "legal", "renovation", "beta_sales", "general"]
AIInsightSubjectType = Literal[
    "listing",
    "user_submitted_draft",
    "area",
    "report",
    "compare",
    "news",
]
AIInsightType = Literal[
    "report_summary",
    "object_explanation",
    "area_summary",
    "news_summary",
    "assistant_answer",
]
NewsCategory = Literal[
    "market",
    "mortgage",
    "tax",
    "legal",
    "developer",
    "city_investment",
    "transport",
    "mpzp",
]
NewsImpactLevel = Literal["positive", "neutral", "negative", "mixed", "unknown"]
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
SourceCheckType = Literal[
    "robots_txt",
    "terms_review",
    "connectivity",
    "partner_feed",
    "one_off_user_url",
    "manual_review",
]
SourceCheckJobStatus = Literal["queued", "running", "succeeded", "failed", "blocked"]
SourceErrorStatus = Literal["open", "retry_scheduled", "resolved", "ignored"]
AdminAuditLogStatus = Literal["succeeded", "failed", "blocked"]
DataDeletionRequestStatus = Literal["open", "processed", "rejected"]
DataDeletionRequestResolutionStatus = Literal["processed", "rejected"]
DataDeletionTargetType = Literal[
    "raw_listing",
    "user_submitted_draft",
    "generated_report",
    "source_reference",
    "other",
]
AlertDeliveryStatus = Literal["dry_run", "sent", "skipped", "failed"]
OpenDataRoadmapStatus = Literal[
    "candidate",
    "ready_for_import",
    "active",
    "blocked",
    "needs_legal_review",
]
SourceReferenceProvider = Literal["otodom", "olx", "other"]
SourceUrlImportStatus = Literal["extracted", "partial", "failed", "unsupported"]
PropertyDeduplicationDecision = Literal["matched", "review_required", "rejected"]
PropertyDeduplicationReviewStatus = Literal["open", "auto_resolved"]
LocationReferenceType = Literal[
    "district",
    "neighborhood",
    "locality",
    "landmark",
    "transport_node",
]
AIQuestionCode = Literal[
    "summary",
    "price",
    "negotiation",
    "risks",
    "future_plans",
    "family_fit",
    "rental_fit",
    "seller_questions",
    "documents",
    "financing",
]
AIAnswerSubjectType = Literal["listing", "user_submitted_draft", "compare"]
ListingEventType = Literal[
    "first_seen",
    "price_reduced",
    "price_increased",
    "parameter_changed",
    "description_changed",
    "relisted",
    "removed",
    "republished",
]
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
ScoringBacktestSeverity = Literal["healthy", "watch", "drift", "critical"]
ScoringBacktestSegmentType = Literal["area", "period"]
GrowthFactorCode = Literal[
    "transport",
    "education",
    "parks_greenery",
    "healthcare",
    "retail_services",
    "offices_jobs",
    "universities",
    "population_jobs_growth",
]
GrowthFactorPosture = Literal["strong", "moderate", "weak", "missing"]
GrowthAnalysisLabel = Literal[
    "strong_growth",
    "moderate_growth",
    "mixed_growth",
    "weak_growth",
]
DeveloperProjectStatus = Literal["completed", "active", "planned", "unknown"]
DeveloperSignalType = Literal[
    "track_record",
    "delivery",
    "technical_quality",
    "legal",
    "financial",
    "transparency",
    "local_market",
]
DeveloperSignalSeverity = Literal["positive", "info", "warning", "risk"]
DeveloperSignalModerationStatus = Literal["active", "under_review", "suppressed"]
DeveloperSignalDisputeStatus = Literal["none", "open", "resolved", "rejected"]
DeveloperReputationLabel = Literal["strong", "good", "mixed", "limited_data", "risk_review"]
DeveloperAliasType = Literal[
    "brand",
    "legal_entity",
    "spv",
    "project_company",
    "parent_company",
    "source_name",
    "other",
]
MortgageRateType = Literal["fixed", "variable"]
MortgageAffordabilityStatus = Literal["unknown", "comfortable", "stretched", "high_risk"]
MarketIntelligenceAudience = Literal["bank", "developer", "fund"]
MarketIntelligenceSeverity = Literal["positive", "neutral", "watch", "risk"]
ScoringServiceAudience = Literal["buyer", "realtor", "investor", "underwriting", "developer"]
CustomDashboardAudience = Literal[
    "executive",
    "acquisition",
    "underwriting",
    "sales",
    "portfolio",
]
CustomDashboardWidgetCode = Literal[
    "market_kpis",
    "area_watchlist",
    "listing_pipeline",
    "risk_flags",
    "developer_ranking",
    "scoring_distribution",
    "lead_funnel",
    "api_usage",
    "saved_reports",
    "custom_notes",
]
CustomDashboardWidgetStatus = Literal["ready", "needs_data", "planned"]
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
    "developer_reputation_score_desc",
    "developer_reputation_score_asc",
    "developer_confidence_score_desc",
    "developer_confidence_score_asc",
    "days_on_market_asc",
    "days_on_market_desc",
    "newest",
    "oldest",
]


class PriceHistoryPoint(BaseModel):
    observed_at: date
    price: int
    price_per_m2: int


class ListingEvent(BaseModel):
    listing_id: str
    event_type: ListingEventType
    observed_at: date
    summary: str
    payload: dict[str, Any] = Field(default_factory=dict)


class Listing(BaseModel):
    id: str
    title: str
    source_name: str
    source_url: str
    voivodeship: str | None = None
    city: str
    district: str
    area_id: str
    municipality: str
    address: str
    market_type: MarketType
    building_type: str | None = None
    renovation_state: str | None = None
    has_balcony: bool | None = None
    has_terrace: bool | None = None
    has_garden: bool | None = None
    has_elevator: bool | None = None
    parking_type: str | None = None
    heating_type: str | None = None
    developer_id: str | None = None
    developer_name: str | None = None
    investment_name: str | None = None
    primary_market_project_id: str | None = None
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


class ListingCorrectionRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    voivodeship: str | None = Field(default=None, min_length=1, max_length=80)
    city: str | None = Field(default=None, min_length=1, max_length=80)
    district: str | None = Field(default=None, min_length=1, max_length=80)
    area_id: str | None = Field(default=None, min_length=1, max_length=120)
    municipality: str | None = Field(default=None, min_length=1, max_length=80)
    address: str | None = Field(default=None, min_length=1, max_length=255)
    market_type: MarketType | None = None
    building_type: str | None = Field(default=None, min_length=1, max_length=80)
    renovation_state: str | None = Field(default=None, min_length=1, max_length=80)
    has_balcony: bool | None = None
    has_terrace: bool | None = None
    has_garden: bool | None = None
    has_elevator: bool | None = None
    parking_type: str | None = Field(default=None, min_length=1, max_length=80)
    heating_type: str | None = Field(default=None, min_length=1, max_length=80)
    developer_id: str | None = Field(default=None, min_length=1, max_length=120)
    developer_name: str | None = Field(default=None, min_length=1, max_length=160)
    investment_name: str | None = Field(default=None, min_length=1, max_length=200)
    primary_market_project_id: str | None = Field(default=None, min_length=1, max_length=160)
    price: int | None = Field(default=None, gt=0)
    area_m2: float | None = Field(default=None, gt=0)
    rooms: int | None = Field(default=None, ge=1, le=20)
    floor: int | None = Field(default=None, ge=0, le=100)
    building_floors: int | None = Field(default=None, ge=1, le=150)
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
    data_quality_score: int | None = Field(default=None, ge=0, le=100)
    correction_reason: str = Field(min_length=3, max_length=500)
    corrected_by: str | None = Field(default=None, min_length=1, max_length=120)

    @model_validator(mode="after")
    def require_listing_field(self) -> "ListingCorrectionRequest":
        if not self.correction_values():
            raise ValueError("At least one listing correction field must be provided")
        return self

    def correction_values(self) -> dict[str, Any]:
        return self.model_dump(
            exclude_unset=True,
            exclude_none=True,
            exclude={"correction_reason", "corrected_by"},
        )


class ListingCorrectionResult(BaseModel):
    listing: Listing
    changed_fields: list[str]
    correction_reason: str
    corrected_by: str | None = None


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


class AreaComparisonItem(AreaStatistics):
    liquidity_index: int = Field(ge=0, le=100)
    buyer_market_index: int = Field(ge=0, le=100)
    seller_market_index: int = Field(ge=0, le=100)
    overheated_index: int = Field(ge=0, le=100)
    value_index: int = Field(ge=0, le=100)
    growth_index: int = Field(ge=0, le=100)
    price_per_m2_vs_city_pct: float | None = None
    days_on_market_vs_city_pct: float | None = None
    active_share_pct: float = Field(ge=0)
    market_label: str
    summary: str


class AreaComparison(BaseModel):
    city: str | None = None
    sort: str
    area_count: int = Field(ge=0)
    city_median_price_per_m2: int | None = None
    city_average_days_on_market: int | None = None
    city_active_listings: int = Field(ge=0)
    top_value_area_id: str | None = None
    top_growth_area_id: str | None = None
    top_buyer_market_area_id: str | None = None
    top_liquidity_area_id: str | None = None
    areas: list[AreaComparisonItem] = Field(default_factory=list)


class DeveloperProfile(BaseModel):
    id: str
    name: str
    legal_name: str | None = None
    brand_names: list[str] = Field(default_factory=list)
    krs: str | None = None
    nip: str | None = None
    regon: str | None = None
    website_url: str | None = None
    headquarters_city: str | None = None
    founded_year: int | None = Field(default=None, ge=1800, le=2100)
    source_names: list[str] = Field(default_factory=list)
    updated_at: date


class DeveloperProject(BaseModel):
    id: str
    developer_id: str
    name: str
    city: str
    district: str | None = None
    status: DeveloperProjectStatus = "unknown"
    units_count: int | None = Field(default=None, ge=0)
    completed_year: int | None = Field(default=None, ge=1800, le=2100)
    source_url: str | None = None


class DeveloperQualitySignal(BaseModel):
    id: str
    developer_id: str
    signal_type: DeveloperSignalType
    severity: DeveloperSignalSeverity
    title: str
    summary: str
    source_name: str
    source_url: str | None = None
    observed_at: date | None = None
    confidence_score: int = Field(ge=0, le=100)
    moderation_status: DeveloperSignalModerationStatus = "active"
    dispute_status: DeveloperSignalDisputeStatus = "none"
    moderation_note: str | None = Field(default=None, max_length=1000)
    disputed_by: str | None = Field(default=None, max_length=120)
    disputed_at: date | None = None
    resolved_at: date | None = None
    reviewed_by: str | None = Field(default=None, max_length=120)


class DeveloperQualitySignalModerationUpdate(BaseModel):
    moderation_status: DeveloperSignalModerationStatus | None = None
    dispute_status: DeveloperSignalDisputeStatus | None = None
    moderation_note: str | None = Field(default=None, max_length=1000)
    disputed_by: str | None = Field(default=None, max_length=120)
    reviewed_by: str | None = Field(default=None, max_length=120)

    @model_validator(mode="after")
    def require_moderation_change(self) -> "DeveloperQualitySignalModerationUpdate":
        if (
            self.moderation_status is None
            and self.dispute_status is None
            and self.moderation_note is None
            and self.disputed_by is None
            and self.reviewed_by is None
        ):
            raise ValueError("At least one moderation field must be provided.")
        return self


class DeveloperAlias(BaseModel):
    id: str
    developer_id: str
    alias: str
    alias_type: DeveloperAliasType
    source_name: str
    source_url: str | None = None
    confidence_score: int = Field(ge=0, le=100)
    active: bool = True


class DeveloperSourceCitation(BaseModel):
    source_name: str
    source_url: str | None = None
    checked_at: date
    note: str | None = None


class DeveloperReputation(BaseModel):
    developer: DeveloperProfile
    reputation_score: int = Field(ge=0, le=100)
    confidence_score: int = Field(ge=0, le=100)
    label: DeveloperReputationLabel
    track_record_score: int = Field(ge=0, le=100)
    delivery_score: int = Field(ge=0, le=100)
    technical_quality_score: int = Field(ge=0, le=100)
    legal_compliance_score: int = Field(ge=0, le=100)
    financial_stability_score: int = Field(ge=0, le=100)
    transparency_score: int = Field(ge=0, le=100)
    local_experience_score: int = Field(ge=0, le=100)
    completed_projects_count: int = Field(ge=0)
    active_projects_count: int = Field(ge=0)
    positive_signals: list[str] = Field(default_factory=list)
    risk_signals: list[str] = Field(default_factory=list)
    due_diligence_questions: list[str] = Field(default_factory=list)
    source_citations: list[DeveloperSourceCitation] = Field(default_factory=list)
    aliases: list[DeveloperAlias] = Field(default_factory=list)
    projects: list[DeveloperProject] = Field(default_factory=list)
    quality_signals: list[DeveloperQualitySignal] = Field(default_factory=list)


class DeveloperRankingResponse(BaseModel):
    items: list[DeveloperReputation]
    total: int = Field(ge=0)
    filters: dict[str, Any] = Field(default_factory=dict)


class DeveloperFeedImportResponse(BaseModel):
    rows_seen: int = Field(ge=0)
    profiles_created: int = Field(ge=0)
    profiles_updated: int = Field(ge=0)
    aliases_created: int = Field(ge=0)
    aliases_updated: int = Field(ge=0)
    projects_created: int = Field(ge=0)
    projects_updated: int = Field(ge=0)
    signals_created: int = Field(ge=0)
    signals_updated: int = Field(ge=0)
    dry_run: bool
    developer_ids: list[str] = Field(default_factory=list)
    job: "IngestionJob"


class MunicipalityReference(BaseModel):
    id: str
    name: str
    country_code: str
    region: str | None = None
    lat: float | None = None
    lon: float | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class DistrictReference(BaseModel):
    id: str
    municipality_id: str
    municipality_name: str
    name: str
    slug: str
    area_id: str | None = None
    lat: float | None = None
    lon: float | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class LocationReference(BaseModel):
    id: str
    municipality_id: str
    municipality_name: str
    district_id: str | None = None
    district_name: str | None = None
    name: str
    slug: str
    location_type: LocationReferenceType
    lat: float | None = None
    lon: float | None = None
    aliases: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class TransportStopReference(BaseModel):
    id: str
    municipality_id: str
    municipality_name: str
    district_id: str | None = None
    district_name: str | None = None
    name: str
    stop_type: str
    lat: float | None = None
    lon: float | None = None
    lines: list[str] = Field(default_factory=list)
    source_url: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class TransportRouteReference(BaseModel):
    id: str
    municipality_id: str
    municipality_name: str
    district_id: str | None = None
    district_name: str | None = None
    route_number: str
    route_name: str
    route_type: str
    operator: str | None = None
    status: str = "active"
    stop_ids: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class SchoolReference(BaseModel):
    id: str
    municipality_id: str
    municipality_name: str
    district_id: str | None = None
    district_name: str | None = None
    name: str
    school_type: str
    operator_type: str | None = None
    lat: float | None = None
    lon: float | None = None
    source_url: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class KindergartenReference(BaseModel):
    id: str
    municipality_id: str
    municipality_name: str
    district_id: str | None = None
    district_name: str | None = None
    name: str
    kindergarten_type: str
    operator_type: str | None = None
    lat: float | None = None
    lon: float | None = None
    source_url: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class AmenityReference(BaseModel):
    id: str
    municipality_id: str
    municipality_name: str
    district_id: str | None = None
    district_name: str | None = None
    name: str
    amenity_type: str
    lat: float | None = None
    lon: float | None = None
    source_url: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class IndustrialZoneReference(BaseModel):
    id: str
    municipality_id: str
    municipality_name: str
    district_id: str | None = None
    district_name: str | None = None
    name: str
    zone_type: str
    risk_level: str = "unknown"
    impact_radius_m: int | None = Field(default=None, ge=0)
    lat: float | None = None
    lon: float | None = None
    source_url: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class AreaMarketSnapshot(AreaStatistics):
    id: int | None = None
    calculated_at: datetime


class AreaMarketSnapshotJobResult(BaseModel):
    calculated_at: datetime
    dry_run: bool
    snapshots_created: int = Field(ge=0)
    snapshots: list[AreaMarketSnapshot] = Field(default_factory=list)


class InfrastructureEnrichmentItem(BaseModel):
    property_id: int
    listing_id: str | None = None
    city: str
    district: str | None = None
    distance_to_center_km: float | None = Field(default=None, ge=0)
    nearest_stop_m: int | None = Field(default=None, ge=0)
    nearest_school_m: int | None = Field(default=None, ge=0)
    nearest_industrial_zone_m: int | None = Field(default=None, ge=0)
    parks_within_1km: int = Field(default=0, ge=0)
    schools_within_1km: int = Field(default=0, ge=0)
    planned_investments_within_2km: int = Field(default=0, ge=0)
    changed_fields: list[str] = Field(default_factory=list)


class InfrastructureEnrichmentJobResult(BaseModel):
    calculated_at: datetime
    dry_run: bool
    properties_seen: int = Field(ge=0)
    properties_with_changes: int = Field(ge=0)
    properties_updated: int = Field(ge=0)
    snapshots_updated: int = Field(ge=0)
    items: list[InfrastructureEnrichmentItem] = Field(default_factory=list)


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


class PlannedInvestmentImpactItem(BaseModel):
    investment: PlannedInvestment
    distance_m: int = Field(ge=0)
    radius_m: int = Field(ge=0)
    impact_weight: float = Field(ge=0)


class FutureImpactRadiusBucket(BaseModel):
    radius_m: int = Field(ge=0)
    count: int = Field(ge=0)
    high_confidence_count: int = Field(ge=0)
    investment_types: list[str] = Field(default_factory=list)
    statuses: list[str] = Field(default_factory=list)
    nearest_distance_m: int | None = Field(default=None, ge=0)


class ListingFutureImpact(BaseModel):
    listing_id: str
    max_radius_m: int = Field(ge=0)
    radii_m: list[int] = Field(default_factory=list)
    buckets: list[FutureImpactRadiusBucket] = Field(default_factory=list)
    nearest_investments: list[PlannedInvestmentImpactItem] = Field(default_factory=list)
    impact_score: int = Field(ge=0, le=100)
    summary: str
    growth_signals: list[str] = Field(default_factory=list)
    risk_signals: list[str] = Field(default_factory=list)
    methodology_note: str


class ListingGrowthFactor(BaseModel):
    code: GrowthFactorCode
    label: str
    score: int = Field(ge=0, le=100)
    weight: float = Field(ge=0, le=1)
    posture: GrowthFactorPosture
    evidence: list[str] = Field(default_factory=list)
    recommended_checks: list[str] = Field(default_factory=list)
    data_status: str


class ListingGrowthAnalysis(BaseModel):
    listing_id: str
    growth_score: int = Field(ge=0, le=100)
    growth_label: GrowthAnalysisLabel
    factors: list[ListingGrowthFactor] = Field(default_factory=list)
    positive_signals: list[str] = Field(default_factory=list)
    drag_signals: list[str] = Field(default_factory=list)
    missing_layers: list[str] = Field(default_factory=list)
    summary: str
    methodology_note: str


class ListingRiskFactor(BaseModel):
    code: str
    category: str
    severity: str
    score: int = Field(ge=0, le=100)
    summary: str
    evidence: list[str] = Field(default_factory=list)
    recommended_checks: list[str] = Field(default_factory=list)


class ListingRiskProfile(BaseModel):
    listing_id: str
    risk_score: int = Field(ge=0, le=100)
    risk_label: ScoreRiskLabel
    overall_severity: str
    factors: list[ListingRiskFactor] = Field(default_factory=list)
    priority_checks: list[str] = Field(default_factory=list)
    missing_risk_layers: list[str] = Field(default_factory=list)
    methodology_note: str


class RentalCashflowScenario(BaseModel):
    code: str
    label: str
    monthly_rent_pln: int = Field(ge=0)
    vacancy_loss_pln: int = Field(ge=0)
    operating_costs_pln: int = Field(ge=0)
    mortgage_payment_pln: int = Field(ge=0)
    net_cashflow_monthly_pln: int
    annual_net_cashflow_pln: int
    cash_invested_pln: int = Field(ge=0)
    gross_yield_pct: float
    net_yield_on_cash_pct: float


class ListingRentalEstimate(BaseModel):
    listing_id: str
    monthly_rent_low_pln: int = Field(ge=0)
    monthly_rent_mid_pln: int = Field(ge=0)
    monthly_rent_high_pln: int = Field(ge=0)
    rent_per_m2_mid_pln: int = Field(ge=0)
    gross_yield_pct: float = Field(ge=0)
    vacancy_rate_pct: float = Field(ge=0, le=100)
    operating_costs_monthly_pln: int = Field(ge=0)
    net_operating_income_monthly_pln: int
    confidence_score: int = Field(ge=0, le=100)
    cashflow_scenarios: list[RentalCashflowScenario] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    risk_notes: list[str] = Field(default_factory=list)
    methodology_note: str


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


class SourceCheckJobCreate(BaseModel):
    source_id: str | None = None
    source_name: str
    source_type: str = "portal"
    check_type: SourceCheckType = "manual_review"
    status: SourceCheckJobStatus = "queued"
    target_domain: str | None = None
    target_url_hash: str | None = None
    created_by: str = "system"
    scheduled_for: datetime | None = None
    notes: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class SourceCheckJob(BaseModel):
    id: str
    source_id: str | None = None
    source_name: str
    source_type: str
    check_type: SourceCheckType
    status: SourceCheckJobStatus
    target_domain: str | None = None
    target_url_hash: str | None = None
    created_by: str
    scheduled_for: datetime | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    notes: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    result: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class SourceErrorCreate(BaseModel):
    source_id: str | None = None
    source_name: str
    source_type: str = "portal"
    source_check_job_id: str | None = None
    ingestion_job_id: str | None = None
    severity: DataQualitySeverity = "error"
    status: SourceErrorStatus = "open"
    error_code: str
    message: str
    retryable: bool = True
    next_retry_at: datetime | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class SourceErrorUpdate(BaseModel):
    status: SourceErrorStatus | None = None
    retryable: bool | None = None
    next_retry_at: datetime | None = None
    resolved_by: str | None = None
    resolution_note: str | None = None
    metadata: dict[str, Any] | None = None


class SourceError(BaseModel):
    id: str
    source_id: str | None = None
    source_name: str
    source_type: str
    source_check_job_id: str | None = None
    ingestion_job_id: str | None = None
    severity: DataQualitySeverity
    status: SourceErrorStatus
    error_code: str
    message: str
    retryable: bool
    retry_count: int = Field(ge=0)
    next_retry_at: datetime | None = None
    last_retry_job_id: str | None = None
    resolved_at: datetime | None = None
    resolved_by: str | None = None
    resolution_note: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class SourceErrorRetryResult(BaseModel):
    error: SourceError
    retry_job: SourceCheckJob


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
    raw_payload_retention_days: int | None = Field(default=None, ge=1, le=3650)
    private_url_retention_days: int | None = Field(default=None, ge=1, le=3650)
    retention_notes: str | None = None
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
    raw_payload_retention_days: int | None = Field(default=None, ge=1, le=3650)
    private_url_retention_days: int | None = Field(default=None, ge=1, le=3650)
    retention_notes: str | None = None
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
    raw_payload_retention_days: int | None = Field(default=None, ge=1, le=3650)
    private_url_retention_days: int | None = Field(default=None, ge=1, le=3650)
    retention_notes: str | None = None
    is_active: bool | None = None


class SourceRetentionPruneResult(BaseModel):
    dry_run: bool
    source_name: str | None = None
    sources_checked: int = Field(ge=0)
    raw_listings_seen: int = Field(ge=0)
    raw_payloads_pruned: int = Field(ge=0)
    item_ids: list[str] = Field(default_factory=list)
    cutoff_by_source: dict[str, datetime] = Field(default_factory=dict)


class AdminAuditLogCreate(BaseModel):
    action_type: str = Field(min_length=1, max_length=120)
    actor_id: str = Field(min_length=1, max_length=120)
    actor_role: UserRole | str = Field(default="admin", max_length=40)
    resource_type: str = Field(min_length=1, max_length=80)
    resource_id: str | None = Field(default=None, max_length=200)
    status: AdminAuditLogStatus = "succeeded"
    message: str | None = Field(default=None, max_length=1000)
    metadata: dict[str, Any] = Field(default_factory=dict)


class AdminAuditLog(BaseModel):
    id: str
    action_type: str
    actor_id: str
    actor_role: str
    resource_type: str
    resource_id: str | None = None
    status: AdminAuditLogStatus
    message: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class DataDeletionRequestCreate(BaseModel):
    target_type: DataDeletionTargetType
    target_id: str = Field(min_length=1, max_length=200)
    target_owner_id: str | None = Field(default=None, max_length=120)
    source_name: str | None = Field(default=None, max_length=120)
    source_url_hash: str | None = Field(default=None, max_length=128)
    requested_by: str | None = Field(default=None, max_length=120)
    reason: str | None = Field(default=None, max_length=1000)
    request_payload: dict[str, Any] = Field(default_factory=dict)


class DataDeletionRequestProcess(BaseModel):
    status: DataDeletionRequestResolutionStatus = "processed"
    action_summary: str = Field(min_length=1, max_length=2000)
    result_payload: dict[str, Any] = Field(default_factory=dict)
    execute_target_deletion: bool = True


class DataDeletionRequest(BaseModel):
    id: str
    target_type: DataDeletionTargetType
    target_id: str
    target_owner_id: str | None = None
    source_name: str | None = None
    source_url_hash: str | None = None
    status: DataDeletionRequestStatus
    requested_by: str
    processed_by: str | None = None
    reason: str | None = None
    request_payload: dict[str, Any] = Field(default_factory=dict)
    result_payload: dict[str, Any] = Field(default_factory=dict)
    action_summary: str | None = None
    created_at: datetime
    updated_at: datetime
    processed_at: datetime | None = None


class OpenDataRoadmapItem(BaseModel):
    id: str
    name: str
    provider: str
    country_code: str = "PL"
    region: str | None = None
    domains: list[str] = Field(default_factory=list)
    source_type: str = "official_open_data"
    access_method: str
    ingestion_method: str
    documentation_url: str
    data_url: str | None = None
    license: str | None = None
    legal_status: SourceLegalStatus = "review_required"
    legal_notes: str | None = None
    refresh_cadence: str
    priority: int = Field(ge=1, le=100)
    status: OpenDataRoadmapStatus
    target_tables: list[str] = Field(default_factory=list)
    next_step: str
    risks: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class PartnerCsvImportResponse(BaseModel):
    rows_seen: int = Field(ge=0)
    raw_created: int = Field(ge=0)
    raw_updated: int = Field(ge=0)
    properties_created: int = Field(ge=0)
    properties_updated: int = Field(ge=0)
    snapshots_created: int = Field(ge=0)
    snapshots_updated: int = Field(ge=0)
    removed_marked: int = Field(default=0, ge=0)
    dry_run: bool
    listing_ids: list[str] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
    job: IngestionJob


class PriceHistoryRebuildResult(BaseModel):
    property_sources_seen: int = Field(ge=0)
    snapshots_seen: int = Field(ge=0)
    snapshots_updated: int = Field(ge=0)
    listing_events_created: int = Field(default=0, ge=0)


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


class InfrastructureReferenceImportResponse(BaseModel):
    rows_seen: int = Field(ge=0)
    created: int = Field(ge=0)
    updated: int = Field(ge=0)
    skipped: int = Field(ge=0)
    dry_run: bool
    layer_counts: dict[str, int] = Field(default_factory=dict)
    item_ids: list[str] = Field(default_factory=list)
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


class PropertyDeduplicationMatch(BaseModel):
    id: int
    job_id: str | None = None
    source_name: str
    source_listing_id: str
    candidate_property_id: int | None = None
    matched_property_id: int | None = None
    decision: PropertyDeduplicationDecision
    review_status: PropertyDeduplicationReviewStatus
    match_score: int = Field(ge=0, le=100)
    reasons: list[str] = Field(default_factory=list)
    incoming_payload: dict[str, Any] = Field(default_factory=dict)
    candidate_payload: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class PropertyDeduplicationMatchUpdate(BaseModel):
    review_status: PropertyDeduplicationReviewStatus


class MapPointGeometry(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: tuple[float, float]


class MapPolygonGeometry(BaseModel):
    type: Literal["Polygon"] = "Polygon"
    coordinates: tuple[tuple[tuple[float, float], ...], ...]


class MapLineStringGeometry(BaseModel):
    type: Literal["LineString"] = "LineString"
    coordinates: tuple[tuple[float, float], ...]


class MapFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    id: str
    geometry: MapPointGeometry | MapPolygonGeometry | MapLineStringGeometry
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


class ScoringBacktestErrorBucket(BaseModel):
    code: str
    label: str
    min_error_pct: float = Field(ge=0)
    max_error_pct: float | None = Field(default=None, ge=0)
    evaluated_points: int = Field(ge=0)
    share_pct: float = Field(ge=0, le=100)
    mean_absolute_error_pct: float | None = Field(default=None, ge=0)
    overestimate_count: int = Field(ge=0)
    underestimate_count: int = Field(ge=0)


class ScoringBacktestDriftSegment(BaseModel):
    segment_type: ScoringBacktestSegmentType
    key: str
    label: str
    evaluated_points: int = Field(ge=0)
    mean_absolute_error_pct: float | None = Field(default=None, ge=0)
    median_absolute_error_pct: float | None = Field(default=None, ge=0)
    within_10_pct: float | None = Field(default=None, ge=0, le=100)
    severity: ScoringBacktestSeverity
    trend_note: str


class ScoringBacktestReport(BaseModel):
    generated_at: datetime
    city: str | None = None
    district: str | None = None
    overall_severity: ScoringBacktestSeverity
    quality_label: str
    backtest: ScoringBacktestResult
    error_buckets: list[ScoringBacktestErrorBucket] = Field(default_factory=list)
    area_drift: list[ScoringBacktestDriftSegment] = Field(default_factory=list)
    period_drift: list[ScoringBacktestDriftSegment] = Field(default_factory=list)
    high_error_examples: list[ScoringBacktestItem] = Field(default_factory=list)
    findings: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    methodology_note: str


class ListingAnalysis(BaseModel):
    listing: Listing
    area_statistics: AreaStatistics
    price_history: list[PriceHistoryPoint]
    listing_events: list[ListingEvent] = Field(default_factory=list)
    comparables: list[Listing]
    developer_reputation: DeveloperReputation | None = None
    future_area_impact: ListingFutureImpact | None = None
    growth_analysis: ListingGrowthAnalysis | None = None
    risk_profile: ListingRiskProfile | None = None
    rental_estimate: ListingRentalEstimate | None = None
    scores: PropertyScores
    insights: list[str]
    negotiation_arguments: list[str]
    data_quality_notes: list[str]
    disclaimer: str = (
        "Scoring outputs are decision-support screening signals, not financial, legal or "
        "investment advice, not a valuation certificate and not a guarantee of price, financing, "
        "legal status or future performance."
    )


class ApiLiteListingScore(BaseModel):
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
    reasons: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class ApiLiteListingEvent(BaseModel):
    listing_id: str
    event_type: ListingEventType
    observed_at: date
    summary: str


class ApiLiteListing(BaseModel):
    id: str
    title: str
    source_name: str
    city: str
    district: str
    area_id: str
    municipality: str
    address: str
    market_type: MarketType
    building_type: str | None = None
    renovation_state: str | None = None
    has_balcony: bool | None = None
    has_terrace: bool | None = None
    has_garden: bool | None = None
    has_elevator: bool | None = None
    parking_type: str | None = None
    heating_type: str | None = None
    developer_id: str | None = None
    developer_name: str | None = None
    investment_name: str | None = None
    primary_market_project_id: str | None = None
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
    scores: ApiLiteListingScore
    insights: list[str] = Field(default_factory=list)
    data_quality_notes: list[str] = Field(default_factory=list)
    disclaimer: str


class ApiLiteListingDetail(ApiLiteListing):
    area_statistics: AreaStatistics
    price_history: list[PriceHistoryPoint] = Field(default_factory=list)
    listing_events: list[ApiLiteListingEvent] = Field(default_factory=list)
    comparable_listing_ids: list[str] = Field(default_factory=list)
    comparables_count: int = Field(ge=0)
    developer_reputation_score: int | None = Field(default=None, ge=0, le=100)
    developer_confidence_score: int | None = Field(default=None, ge=0, le=100)
    developer_risk_signals_count: int = Field(ge=0)


class ApiLiteListingSearchResponse(BaseModel):
    items: list[ApiLiteListing]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1)
    total_pages: int = Field(ge=0)
    sort: ListingSort
    filters: dict[str, Any] = Field(default_factory=dict)
    data_policy: str = (
        "API-lite returns normalized analytical fields only. Source URLs, contacts, photos, "
        "raw HTML and private user-submitted references are not included."
    )


class ApiLiteUsageLog(BaseModel):
    id: str
    key_id: str
    owner_id: str
    plan: SubscriptionPlan
    endpoint: str
    method: str
    status_code: int
    request_units: int = Field(ge=1)
    created_at: datetime
    metadata: dict[str, Any] = Field(default_factory=dict)


class ApiLiteUsageSummary(BaseModel):
    key_id: str
    label: str
    owner_id: str
    plan: SubscriptionPlan
    scopes: list[str] = Field(default_factory=list)
    usage_period: str
    monthly_quota: int = Field(ge=1)
    rate_limit_per_minute: int = Field(ge=1)
    used_units: int = Field(ge=0)
    remaining_units: int = Field(ge=0)
    logs: list[ApiLiteUsageLog] = Field(default_factory=list)


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
    developer_name: str | None = None
    investment_name: str | None = None
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
    lat: float | None = Field(default=None, ge=-90, le=90)
    lon: float | None = Field(default=None, ge=-180, le=180)


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
    developer_id: str | None = None
    developer_name: str | None = None
    investment_name: str | None = None
    primary_market_project_id: str | None = None
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


class ScoringServiceRequest(BaseModel):
    external_reference: str | None = Field(default=None, max_length=160)
    title: str | None = Field(default=None, max_length=220)
    developer_id: str | None = Field(default=None, max_length=120)
    developer_name: str | None = Field(default=None, max_length=180)
    investment_name: str | None = Field(default=None, max_length=180)
    primary_market_project_id: str | None = Field(default=None, max_length=120)
    address: str = Field(min_length=3, max_length=240)
    city: str = Field(default="Wrocław", min_length=2, max_length=120)
    district: str = Field(min_length=2, max_length=120)
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
    audience: ScoringServiceAudience = "investor"

    @model_validator(mode="after")
    def validate_coordinate_pair(self) -> "ScoringServiceRequest":
        if (self.lat is None) != (self.lon is None):
            raise ValueError("lat and lon must be provided together")
        return self


class ScoringServiceValuation(BaseModel):
    asking_price: int
    price_per_m2: int
    fair_price_low: int
    fair_price_mid: int
    fair_price_high: int
    fair_price_confidence_score: int = Field(ge=0, le=100)
    price_delta_to_fair_mid_pct: float


class ScoringServiceComparable(BaseModel):
    listing_id: str
    title: str
    address: str
    city: str
    district: str
    market_type: MarketType
    price: int
    area_m2: float
    rooms: int
    price_per_m2: int
    floor: int | None = None
    building_floors: int | None = None
    building_year: int | None = None
    price_delta_to_subject_pct: float
    price_per_m2_delta_to_subject_pct: float


class ScoringServiceResult(BaseModel):
    request_id: str
    generated_at: datetime
    audience: ScoringServiceAudience
    persisted: bool = False
    input: ScoringServiceRequest
    confidence_score: int = Field(ge=0, le=100)
    scores: PropertyScores
    valuation: ScoringServiceValuation
    area_statistics: AreaStatistics
    developer_reputation: DeveloperReputation | None = None
    comparables: list[ScoringServiceComparable] = Field(default_factory=list)
    decision_summary: str
    key_findings: list[str] = Field(default_factory=list)
    risk_flags: list[str] = Field(default_factory=list)
    recommended_actions: list[str] = Field(default_factory=list)
    data_quality_notes: list[str] = Field(default_factory=list)
    methodology_notes: list[str] = Field(default_factory=list)
    disclaimer: str


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
    developer_id: str | None = None
    developer_name: str | None = None
    investment_name: str | None = None
    primary_market_project_id: str | None = None
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


class HiddenGemItem(BaseModel):
    analysis: ListingAnalysis
    gem_score: int = Field(ge=0, le=100)
    price_delta_to_fair_mid_pct: float
    estimated_discount_to_fair_mid_pln: int = Field(ge=0)
    signals: list[str] = Field(default_factory=list)


class HiddenGemsResponse(BaseModel):
    items: list[HiddenGemItem]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1)
    total_pages: int = Field(ge=0)
    filters: dict[str, Any] = Field(default_factory=dict)


class CompareRequest(BaseModel):
    listing_ids: list[str] = Field(min_length=2, max_length=5)


class CompareMortgageAssumptions(BaseModel):
    down_payment_pct: float = Field(ge=0, le=100)
    loan_years: int = Field(ge=1, le=35)
    annual_interest_rate_pct: float = Field(ge=0, le=30)
    rate_type: MortgageRateType


class CompareItemMetrics(BaseModel):
    listing_id: str
    rank: int = Field(ge=1)
    decision_score: int = Field(ge=0, le=100)
    decision_label: ScoreDecisionLabel
    price_label: ScorePriceLabel
    risk_label: ScoreRiskLabel
    liquidity_label: ScorePotentialLabel
    rental_potential_label: ScorePotentialLabel
    investment_score: int = Field(ge=0, le=100)
    risk_score: int = Field(ge=0, le=100)
    negotiation_score: int = Field(ge=0, le=100)
    liquidity_score: int = Field(ge=0, le=100)
    rental_potential_score: int = Field(ge=0, le=100)
    price_per_m2_pln: int = Field(ge=0)
    fair_price_mid_pln: int
    price_delta_to_fair_mid_pct: float
    fair_price_gap_pln: int
    estimated_discount_to_fair_mid_pln: int = Field(ge=0)
    down_payment_pln: int = Field(ge=0)
    loan_amount_pln: int = Field(ge=0)
    estimated_monthly_payment_pln: int = Field(ge=0)
    estimated_monthly_payment_per_m2_pln: int = Field(ge=0)
    upfront_cash_needed_pln: int = Field(ge=0)
    estimated_gross_rental_yield_pct: float = Field(ge=0)
    estimated_monthly_rent_pln: int = Field(ge=0)
    recommendation: str
    reasons: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class CompareSummary(BaseModel):
    best_listing_id: str
    best_value_listing_id: str
    lowest_monthly_payment_listing_id: str
    strongest_liquidity_listing_id: str
    strongest_rental_listing_id: str
    riskiest_listing_id: str
    average_price_per_m2: int = Field(ge=0)
    average_estimated_monthly_payment_pln: int = Field(ge=0)
    average_liquidity_score: int = Field(ge=0, le=100)
    average_rental_potential_score: int = Field(ge=0, le=100)
    notes: list[str] = Field(default_factory=list)


class CompareResponse(BaseModel):
    items: list[ListingAnalysis]
    metrics: list[CompareItemMetrics]
    summary: CompareSummary
    mortgage_assumptions: CompareMortgageAssumptions


class RealtorClientShortlistRequest(BaseModel):
    listing_ids: list[str] = Field(min_length=2, max_length=5)
    client_name: str | None = Field(default=None, max_length=160)
    intro: str | None = Field(default=None, max_length=500)
    include_source_links: bool = False


class RealtorClientShortlistItem(BaseModel):
    listing_id: str
    rank: int = Field(ge=1)
    title: str
    address: str
    district: str
    city: str
    price: int
    currency: str
    area_m2: float
    rooms: int
    decision_score: int = Field(ge=0, le=100)
    decision_label: ScoreDecisionLabel
    fair_price_mid: int
    price_delta_to_fair_mid_pct: float
    estimated_monthly_payment_pln: int = Field(ge=0)
    upfront_cash_needed_pln: int = Field(ge=0)
    estimated_monthly_rent_pln: int = Field(ge=0)
    estimated_gross_rental_yield_pct: float = Field(ge=0)
    recommendation: str
    client_pitch: str
    talking_points: list[str] = Field(default_factory=list)
    cautions: list[str] = Field(default_factory=list)
    source_url: str | None = None


class RealtorClientShortlist(BaseModel):
    client_name: str | None = None
    agent_name: str | None = None
    agent_email: str | None = None
    subject: str
    summary: str
    client_message: str
    items: list[RealtorClientShortlistItem] = Field(default_factory=list)
    comparison_summary: CompareSummary
    mortgage_assumptions: CompareMortgageAssumptions
    generated_at: datetime
    disclaimer: str


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


class MarketIntelligenceKpi(BaseModel):
    code: str
    label: str
    value: int | float | str | None = None
    unit: str | None = None
    interpretation: str


class MarketIntelligenceFinding(BaseModel):
    title: str
    severity: MarketIntelligenceSeverity
    detail: str
    metric_code: str | None = None


class MarketIntelligenceReport(BaseModel):
    audience: MarketIntelligenceAudience
    city: str | None = None
    district: str | None = None
    generated_at: datetime
    market_scope: str
    executive_summary: str
    data_confidence: str
    kpis: list[MarketIntelligenceKpi] = Field(default_factory=list)
    findings: list[MarketIntelligenceFinding] = Field(default_factory=list)
    opportunities: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    recommended_actions: list[str] = Field(default_factory=list)
    area_watchlist: list[AreaComparisonItem] = Field(default_factory=list)
    dashboard: MarketDashboard
    area_comparison: AreaComparison
    source_notes: list[str] = Field(default_factory=list)
    disclaimer: str


class CustomDashboardCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    description: str | None = Field(default=None, max_length=500)
    audience: CustomDashboardAudience = "executive"
    city: str | None = Field(default="Wrocław", max_length=120)
    district: str | None = Field(default=None, max_length=120)
    widget_codes: list[CustomDashboardWidgetCode] = Field(
        default_factory=lambda: [
            "market_kpis",
            "area_watchlist",
            "risk_flags",
            "developer_ranking",
        ],
        min_length=1,
        max_length=12,
    )
    filters: dict[str, Any] = Field(default_factory=dict)
    refresh_interval_minutes: int = Field(default=60, ge=15, le=1440)
    is_default: bool = False
    shared_with_agency_ids: list[str] = Field(default_factory=list, max_length=20)
    notes: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def normalize_dashboard_create(self) -> "CustomDashboardCreate":
        self.widget_codes = _deduplicate_strings(self.widget_codes)
        self.shared_with_agency_ids = _deduplicate_strings(self.shared_with_agency_ids)
        return self


class CustomDashboardUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    description: str | None = Field(default=None, max_length=500)
    audience: CustomDashboardAudience | None = None
    city: str | None = Field(default=None, max_length=120)
    district: str | None = Field(default=None, max_length=120)
    widget_codes: list[CustomDashboardWidgetCode] | None = Field(
        default=None,
        min_length=1,
        max_length=12,
    )
    filters: dict[str, Any] | None = None
    refresh_interval_minutes: int | None = Field(default=None, ge=15, le=1440)
    is_default: bool | None = None
    shared_with_agency_ids: list[str] | None = Field(default=None, max_length=20)
    notes: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def normalize_dashboard_update(self) -> "CustomDashboardUpdate":
        if self.widget_codes is not None:
            self.widget_codes = _deduplicate_strings(self.widget_codes)
        if self.shared_with_agency_ids is not None:
            self.shared_with_agency_ids = _deduplicate_strings(self.shared_with_agency_ids)
        return self


class CustomDashboardConfig(BaseModel):
    id: str
    owner_id: str
    name: str
    description: str | None = None
    audience: CustomDashboardAudience
    city: str | None = None
    district: str | None = None
    widget_codes: list[CustomDashboardWidgetCode]
    filters: dict[str, Any] = Field(default_factory=dict)
    refresh_interval_minutes: int = Field(ge=15, le=1440)
    is_default: bool
    shared_with_agency_ids: list[str] = Field(default_factory=list)
    notes: str | None = None
    created_at: datetime
    updated_at: datetime


class CustomDashboardWidgetSnapshot(BaseModel):
    widget_code: CustomDashboardWidgetCode
    title: str
    status: CustomDashboardWidgetStatus
    summary: str
    metrics: dict[str, Any] = Field(default_factory=dict)
    actions: list[str] = Field(default_factory=list)


class CustomDashboardPreview(BaseModel):
    config: CustomDashboardConfig
    generated_at: datetime
    dashboard: MarketDashboard
    area_comparison: AreaComparison
    market_intelligence: MarketIntelligenceReport
    widgets: list[CustomDashboardWidgetSnapshot] = Field(default_factory=list)
    source_notes: list[str] = Field(default_factory=list)
    disclaimer: str


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


class PartnerLeadScoreComponent(BaseModel):
    code: str
    label: str
    score: int = Field(ge=0, le=100)
    weight: float = Field(ge=0, le=1)
    weighted_score: float = Field(ge=0, le=100)
    reason: str


class PartnerLeadScore(BaseModel):
    referral: PartnerReferral
    generated_at: datetime
    total_score: int = Field(ge=0, le=100)
    priority: PartnerLeadPriority
    partner_fit: PartnerLeadFit
    qualification_status: str
    estimated_deal_value_pln: int | None = None
    next_action_due_hours: int = Field(ge=0)
    routing_tags: list[str] = Field(default_factory=list)
    reasons: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    recommended_actions: list[str] = Field(default_factory=list)
    components: list[PartnerLeadScoreComponent] = Field(default_factory=list)
    disclaimer: str


class ReportBranding(BaseModel):
    agency_name: str | None = None
    agent_name: str | None = None
    agent_email: str | None = None
    agent_phone: str | None = None
    website_url: str | None = None
    note: str | None = None
    logo_url: str | None = None
    primary_color: str | None = None
    accent_color: str | None = None
    footer_text: str | None = None
    agency_disclaimer: str | None = None

    @model_validator(mode="before")
    @classmethod
    def normalize_branding(cls, value: Any) -> Any:
        if not isinstance(value, dict):
            return value
        normalized = {}
        for key, item in value.items():
            if isinstance(item, str):
                item = item.strip()
                normalized[key] = item or None
            else:
                normalized[key] = item
        for key in ("primary_color", "accent_color"):
            color = normalized.get(key)
            if isinstance(color, str):
                normalized[key] = color.upper()
        return normalized

    @model_validator(mode="after")
    def validate_white_label_fields(self) -> "ReportBranding":
        for field in ("primary_color", "accent_color"):
            color = getattr(self, field)
            if color and not re.fullmatch(r"#[0-9A-F]{6}", color):
                raise ValueError(f"{field} must be a #RRGGBB color")
        for field in ("logo_url", "website_url"):
            url = getattr(self, field)
            if url and not url.startswith(("https://", "http://")):
                raise ValueError(f"{field} must be an http(s) URL")
        return self


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


class ReportOrderBillingDetails(BaseModel):
    invoice_requested: bool = False
    customer_type: BillingCustomerType = "company"
    company_name: str | None = Field(default=None, max_length=160)
    vat_id: str | None = Field(default=None, max_length=32)
    country_code: str = Field(default="PL", min_length=2, max_length=2)
    street_address: str | None = Field(default=None, max_length=240)
    postal_code: str | None = Field(default=None, max_length=24)
    city: str | None = Field(default=None, max_length=120)
    email: str | None = Field(default=None, max_length=160)

    @model_validator(mode="before")
    @classmethod
    def normalize_billing_details(cls, value: Any) -> Any:
        if not isinstance(value, dict):
            return value
        normalized = {}
        for key, item in value.items():
            if isinstance(item, str):
                item = item.strip()
                normalized[key] = item or None
            else:
                normalized[key] = item
        country_code = normalized.get("country_code")
        if isinstance(country_code, str):
            normalized["country_code"] = country_code.upper()
        vat_id = normalized.get("vat_id")
        if isinstance(vat_id, str):
            normalized["vat_id"] = vat_id.replace(" ", "").replace("-", "").upper()
        email = normalized.get("email")
        if isinstance(email, str):
            normalized["email"] = email.lower()
        return normalized

    @model_validator(mode="after")
    def validate_invoice_request(self) -> "ReportOrderBillingDetails":
        if not self.invoice_requested:
            return self

        required_fields = {
            "company_name": self.company_name,
            "vat_id": self.vat_id,
            "street_address": self.street_address,
            "postal_code": self.postal_code,
            "city": self.city,
            "email": self.email,
        }
        missing = [field for field, value in required_fields.items() if not value]
        if missing:
            raise ValueError(
                "Invoice billing details require: " + ", ".join(sorted(missing))
            )
        if self.customer_type == "individual":
            raise ValueError("Invoice billing details require customer_type='company'")
        if self.email and ("@" not in self.email or "." not in self.email.rsplit("@", 1)[-1]):
            raise ValueError("Invoice billing email is invalid")
        return self

    def compact_dict(self) -> dict[str, Any]:
        return self.model_dump(exclude_none=True)


class ReportOrderCreate(BaseModel):
    listing_id: str
    product_code: ReportProductCode = "object_report"
    audience: ReportAudience | None = None
    report_format: ReportFormat = "html"
    billing_details: ReportOrderBillingDetails | None = None


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
    billing_details: ReportOrderBillingDetails | None = None
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
    id: str | None = None
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


class AIQuestionDescriptor(BaseModel):
    code: AIQuestionCode
    label: str
    description: str
    supported_audiences: list[ReportAudience] = Field(default_factory=list)


class AIAssistantDataContract(BaseModel):
    prompt_version: str
    allowed_subjects: list[AIAnswerSubjectType] = Field(default_factory=list)
    allowed_inputs: list[str] = Field(default_factory=list)
    prohibited_inputs: list[str] = Field(default_factory=list)
    citation_policy: str
    privacy_policy: str
    refusal_policy: str
    disclaimer: str


class AIAnswerCitation(BaseModel):
    source_id: str
    source_type: str
    title: str
    excerpt: str


class AIAnswerGuardrail(BaseModel):
    code: str
    message: str


class AIListingAnswerRequest(BaseModel):
    question_code: AIQuestionCode = "summary"
    question: str | None = Field(default=None, max_length=500)
    audience: ReportAudience = "buyer"


class AIListingAnswer(BaseModel):
    subject_type: AIAnswerSubjectType
    subject_id: str
    listing_id: str
    audience: ReportAudience
    question_code: AIQuestionCode
    question: str | None = None
    answer: str
    key_points: list[str] = Field(default_factory=list)
    citations: list[AIAnswerCitation] = Field(default_factory=list)
    guardrails: list[AIAnswerGuardrail] = Field(default_factory=list)
    refused: bool = False
    refusal_reason: str | None = None
    data_contract: AIAssistantDataContract
    provider: str
    model_name: str
    prompt_version: str
    usage_log_id: str | None = None
    input_hash: str
    disclaimer: str


class AICompareAnswerRequest(BaseModel):
    listing_ids: list[str] = Field(min_length=2, max_length=5)
    question: str | None = Field(default=None, max_length=500)
    audience: ReportAudience = "buyer"


class AICompareAnswer(BaseModel):
    subject_type: AIAnswerSubjectType = "compare"
    subject_id: str
    listing_ids: list[str]
    best_listing_id: str
    audience: ReportAudience
    question: str | None = None
    answer: str
    key_points: list[str] = Field(default_factory=list)
    tradeoffs: list[str] = Field(default_factory=list)
    citations: list[AIAnswerCitation] = Field(default_factory=list)
    guardrails: list[AIAnswerGuardrail] = Field(default_factory=list)
    refused: bool = False
    refusal_reason: str | None = None
    data_contract: AIAssistantDataContract
    provider: str
    model_name: str
    prompt_version: str
    usage_log_id: str | None = None
    input_hash: str
    disclaimer: str


class AreaImpactSummary(BaseModel):
    subject_type: AIInsightSubjectType = "area"
    subject_id: str
    area_id: str
    name: str
    city: str
    posture: str
    summary: str
    value_index: int = Field(ge=0, le=100)
    growth_index: int = Field(ge=0, le=100)
    buyer_market_index: int = Field(ge=0, le=100)
    seller_market_index: int = Field(ge=0, le=100)
    liquidity_index: int = Field(ge=0, le=100)
    overheated_index: int = Field(ge=0, le=100)
    positive_signals: list[str] = Field(default_factory=list)
    risk_signals: list[str] = Field(default_factory=list)
    buyer_notes: list[str] = Field(default_factory=list)
    investor_notes: list[str] = Field(default_factory=list)
    citations: list[AIAnswerCitation] = Field(default_factory=list)
    guardrails: list[AIAnswerGuardrail] = Field(default_factory=list)
    provider: str
    model_name: str
    prompt_version: str
    usage_log_id: str | None = None
    input_hash: str
    disclaimer: str


class NewsArticleCreate(BaseModel):
    title: str = Field(min_length=3, max_length=220)
    summary: str = Field(min_length=3, max_length=600)
    body: str = Field(min_length=3)
    category: NewsCategory = "market"
    source_name: str = Field(min_length=2, max_length=120)
    source_url: str | None = Field(default=None, max_length=500)
    published_at: datetime
    affected_area_ids: list[str] = Field(default_factory=list, max_length=20)
    affected_districts: list[str] = Field(default_factory=list, max_length=20)
    price_impact_hypothesis: str | None = Field(default=None, max_length=700)
    audience_relevance: list[ReportAudience] = Field(default_factory=lambda: ["buyer"])
    impact_level: NewsImpactLevel = "unknown"
    tags: list[str] = Field(default_factory=list, max_length=20)
    is_published: bool = True


class NewsArticleUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=220)
    summary: str | None = Field(default=None, min_length=3, max_length=600)
    body: str | None = Field(default=None, min_length=3)
    category: NewsCategory | None = None
    source_name: str | None = Field(default=None, min_length=2, max_length=120)
    source_url: str | None = Field(default=None, max_length=500)
    published_at: datetime | None = None
    affected_area_ids: list[str] | None = Field(default=None, max_length=20)
    affected_districts: list[str] | None = Field(default=None, max_length=20)
    price_impact_hypothesis: str | None = Field(default=None, max_length=700)
    audience_relevance: list[ReportAudience] | None = None
    impact_level: NewsImpactLevel | None = None
    tags: list[str] | None = Field(default=None, max_length=20)
    is_published: bool | None = None


class NewsArticleListItem(BaseModel):
    id: str
    title: str
    summary: str
    category: NewsCategory
    source_name: str
    source_url: str | None = None
    published_at: datetime
    affected_area_ids: list[str] = Field(default_factory=list)
    affected_districts: list[str] = Field(default_factory=list)
    price_impact_hypothesis: str | None = None
    audience_relevance: list[ReportAudience] = Field(default_factory=list)
    impact_level: NewsImpactLevel
    tags: list[str] = Field(default_factory=list)
    is_published: bool
    created_at: datetime
    updated_at: datetime


class NewsArticle(NewsArticleListItem):
    body: str


class NewsArticleAISummary(BaseModel):
    subject_type: AIInsightSubjectType = "news"
    subject_id: str
    article_id: str
    category: NewsCategory
    headline: str
    summary: str
    key_points: list[str] = Field(default_factory=list)
    area_impact: list[str] = Field(default_factory=list)
    buyer_notes: list[str] = Field(default_factory=list)
    investor_notes: list[str] = Field(default_factory=list)
    citations: list[AIAnswerCitation] = Field(default_factory=list)
    guardrails: list[AIAnswerGuardrail] = Field(default_factory=list)
    provider: str
    model_name: str
    prompt_version: str
    usage_log_id: str | None = None
    input_hash: str
    disclaimer: str


class AIInsightCreate(BaseModel):
    owner_id: str = "demo-user"
    subject_type: AIInsightSubjectType
    subject_id: str
    insight_type: AIInsightType
    provider: str = "domarion_rule_based"
    model_name: str = "domarion-deterministic-v1"
    prompt_version: str = "report-insight-v1"
    source_report_id: str | None = None
    title: str
    summary: str
    content: str
    input_hash: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class AIInsightListItem(BaseModel):
    id: str
    owner_id: str
    subject_type: AIInsightSubjectType
    subject_id: str
    insight_type: AIInsightType
    provider: str
    model_name: str
    prompt_version: str
    source_report_id: str | None = None
    title: str
    summary: str
    created_at: datetime


class AIInsight(AIInsightListItem):
    content: str
    input_hash: str
    metadata: dict[str, Any] = Field(default_factory=dict)


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


class AgencyWorkspaceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    billing_email: str | None = Field(default=None, max_length=160)
    website_url: str | None = Field(default=None, max_length=240)
    city: str | None = Field(default=None, max_length=120)

    @model_validator(mode="before")
    @classmethod
    def normalize_create_payload(cls, value: Any) -> Any:
        return _normalize_agency_payload(value)

    @model_validator(mode="after")
    def validate_create_payload(self) -> "AgencyWorkspaceCreate":
        _validate_optional_email(self.billing_email)
        _validate_optional_http_url("website_url", self.website_url)
        return self


class AgencyWorkspaceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    billing_email: str | None = Field(default=None, max_length=160)
    website_url: str | None = Field(default=None, max_length=240)
    city: str | None = Field(default=None, max_length=120)

    @model_validator(mode="before")
    @classmethod
    def normalize_update_payload(cls, value: Any) -> Any:
        return _normalize_agency_payload(value)

    @model_validator(mode="after")
    def validate_update_payload(self) -> "AgencyWorkspaceUpdate":
        _validate_optional_email(self.billing_email)
        _validate_optional_http_url("website_url", self.website_url)
        return self


class AgencyMemberCreate(BaseModel):
    user_id: str = Field(min_length=2, max_length=120)
    email: str | None = Field(default=None, max_length=160)
    display_name: str | None = Field(default=None, max_length=160)
    role: AgencyMemberRole = "agent"
    status: AgencyMembershipStatus = "active"

    @model_validator(mode="before")
    @classmethod
    def normalize_member_create_payload(cls, value: Any) -> Any:
        return _normalize_agency_payload(value)

    @model_validator(mode="after")
    def validate_member_create_payload(self) -> "AgencyMemberCreate":
        _validate_optional_email(self.email)
        return self


class AgencyMemberUpdate(BaseModel):
    role: AgencyMemberRole | None = None
    status: AgencyMembershipStatus | None = None
    email: str | None = Field(default=None, max_length=160)
    display_name: str | None = Field(default=None, max_length=160)

    @model_validator(mode="before")
    @classmethod
    def normalize_member_update_payload(cls, value: Any) -> Any:
        return _normalize_agency_payload(value)

    @model_validator(mode="after")
    def validate_member_update_payload(self) -> "AgencyMemberUpdate":
        _validate_optional_email(self.email)
        return self


class AgencyMembership(BaseModel):
    id: str
    agency_id: str
    user_id: str
    email: str | None = None
    display_name: str | None = None
    role: AgencyMemberRole
    status: AgencyMembershipStatus
    invited_by: str | None = None
    created_at: datetime
    updated_at: datetime


class AgencyWorkspaceSummary(BaseModel):
    id: str
    name: str
    owner_id: str
    billing_email: str | None = None
    website_url: str | None = None
    city: str | None = None
    current_user_role: AgencyMemberRole
    current_user_status: AgencyMembershipStatus
    members_count: int
    created_at: datetime
    updated_at: datetime


class AgencyWorkspace(AgencyWorkspaceSummary):
    members: list[AgencyMembership] = Field(default_factory=list)


class CrmClientCreate(BaseModel):
    display_name: str = Field(min_length=2, max_length=160)
    email: str | None = Field(default=None, max_length=160)
    phone: str | None = Field(default=None, max_length=80)
    city: str | None = Field(default=None, max_length=120)
    district: str | None = Field(default=None, max_length=120)
    budget_min: int | None = Field(default=None, ge=0)
    budget_max: int | None = Field(default=None, ge=0)
    preferred_rooms: list[int] = Field(default_factory=list, max_length=10)
    status: CrmClientStatus = "active"
    tags: list[str] = Field(default_factory=list, max_length=20)
    consent_to_contact: bool = False
    profile_notes: str | None = Field(default=None, max_length=2000)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="before")
    @classmethod
    def normalize_create_payload(cls, value: Any) -> Any:
        return _normalize_crm_payload(value)

    @model_validator(mode="after")
    def validate_create_payload(self) -> "CrmClientCreate":
        _validate_optional_email(self.email)
        _validate_budget_range(self.budget_min, self.budget_max)
        object.__setattr__(self, "preferred_rooms", _deduplicate_room_counts(self.preferred_rooms))
        object.__setattr__(self, "tags", _deduplicate_strings(self.tags))
        return self


class CrmClientUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=2, max_length=160)
    email: str | None = Field(default=None, max_length=160)
    phone: str | None = Field(default=None, max_length=80)
    city: str | None = Field(default=None, max_length=120)
    district: str | None = Field(default=None, max_length=120)
    budget_min: int | None = Field(default=None, ge=0)
    budget_max: int | None = Field(default=None, ge=0)
    preferred_rooms: list[int] | None = Field(default=None, max_length=10)
    status: CrmClientStatus | None = None
    tags: list[str] | None = Field(default=None, max_length=20)
    consent_to_contact: bool | None = None
    profile_notes: str | None = Field(default=None, max_length=2000)
    metadata: dict[str, Any] | None = None

    @model_validator(mode="before")
    @classmethod
    def normalize_update_payload(cls, value: Any) -> Any:
        return _normalize_crm_payload(value)

    @model_validator(mode="after")
    def validate_update_payload(self) -> "CrmClientUpdate":
        _validate_optional_email(self.email)
        _validate_budget_range(self.budget_min, self.budget_max)
        if self.preferred_rooms is not None:
            object.__setattr__(
                self,
                "preferred_rooms",
                _deduplicate_room_counts(self.preferred_rooms),
            )
        if self.tags is not None:
            object.__setattr__(self, "tags", _deduplicate_strings(self.tags))
        return self


class CrmClient(BaseModel):
    id: str
    agency_id: str
    owner_id: str
    display_name: str
    email: str | None = None
    phone: str | None = None
    city: str | None = None
    district: str | None = None
    budget_min: int | None = None
    budget_max: int | None = None
    preferred_rooms: list[int] = Field(default_factory=list)
    status: CrmClientStatus
    tags: list[str] = Field(default_factory=list)
    consent_to_contact: bool = False
    profile_notes: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_by: str
    created_at: datetime
    updated_at: datetime


class CrmNoteCreate(BaseModel):
    body: str = Field(min_length=1, max_length=4000)
    visibility: CrmNoteVisibility = "internal"
    pinned: bool = False
    metadata: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="before")
    @classmethod
    def normalize_create_payload(cls, value: Any) -> Any:
        return _normalize_crm_payload(value)


class CrmNoteUpdate(BaseModel):
    body: str | None = Field(default=None, min_length=1, max_length=4000)
    visibility: CrmNoteVisibility | None = None
    pinned: bool | None = None
    metadata: dict[str, Any] | None = None

    @model_validator(mode="before")
    @classmethod
    def normalize_update_payload(cls, value: Any) -> Any:
        return _normalize_crm_payload(value)


class CrmNote(BaseModel):
    id: str
    agency_id: str
    client_id: str
    author_id: str
    body: str
    visibility: CrmNoteVisibility
    pinned: bool = False
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class CrmShortlistCreate(BaseModel):
    title: str = Field(min_length=2, max_length=180)
    listing_ids: list[str] = Field(min_length=1, max_length=10)
    report_ids: list[str] = Field(default_factory=list, max_length=10)
    client_message: str | None = Field(default=None, max_length=2000)
    status: CrmShortlistStatus = "draft"
    share_enabled: bool = False
    expires_in_days: int | None = Field(default=14, ge=1, le=90)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="before")
    @classmethod
    def normalize_create_payload(cls, value: Any) -> Any:
        return _normalize_crm_payload(value)

    @model_validator(mode="after")
    def validate_create_payload(self) -> "CrmShortlistCreate":
        object.__setattr__(self, "listing_ids", _deduplicate_strings(self.listing_ids))
        object.__setattr__(self, "report_ids", _deduplicate_strings(self.report_ids))
        if not self.listing_ids:
            raise ValueError("listing_ids must contain at least one listing id")
        return self


class CrmShortlistUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=180)
    listing_ids: list[str] | None = Field(default=None, min_length=1, max_length=10)
    report_ids: list[str] | None = Field(default=None, max_length=10)
    client_message: str | None = Field(default=None, max_length=2000)
    status: CrmShortlistStatus | None = None
    share_enabled: bool | None = None
    expires_in_days: int | None = Field(default=None, ge=1, le=90)
    metadata: dict[str, Any] | None = None

    @model_validator(mode="before")
    @classmethod
    def normalize_update_payload(cls, value: Any) -> Any:
        return _normalize_crm_payload(value)

    @model_validator(mode="after")
    def validate_update_payload(self) -> "CrmShortlistUpdate":
        if self.listing_ids is not None:
            listing_ids = _deduplicate_strings(self.listing_ids)
            if not listing_ids:
                raise ValueError("listing_ids must contain at least one listing id")
            object.__setattr__(self, "listing_ids", listing_ids)
        if self.report_ids is not None:
            object.__setattr__(self, "report_ids", _deduplicate_strings(self.report_ids))
        return self


class CrmShortlistItem(BaseModel):
    listing_id: str
    rank: int = Field(ge=1)
    title: str
    address: str
    district: str
    city: str
    price: int
    currency: str
    area_m2: float
    rooms: int
    floor: int | None = None
    building_floors: int | None = None
    building_year: int | None = None
    market_type: MarketType
    developer_id: str | None = None
    developer_name: str | None = None
    investment_name: str | None = None
    developer_reputation_score: int | None = Field(default=None, ge=0, le=100)
    developer_reputation_label: DeveloperReputationLabel | None = None
    decision_score: int = Field(ge=0, le=100)
    decision_label: ScoreDecisionLabel
    investment_score: int = Field(ge=0, le=100)
    risk_score: int = Field(ge=0, le=100)
    negotiation_score: int = Field(ge=0, le=100)
    liquidity_score: int = Field(ge=0, le=100)
    rental_potential_score: int = Field(ge=0, le=100)
    fair_price_mid_pln: int
    price_delta_to_fair_mid_pct: float
    recommendation: str
    talking_points: list[str] = Field(default_factory=list)
    cautions: list[str] = Field(default_factory=list)


class CrmShortlist(BaseModel):
    id: str
    agency_id: str
    client_id: str
    owner_id: str
    title: str
    listing_ids: list[str] = Field(default_factory=list)
    report_ids: list[str] = Field(default_factory=list)
    items: list[CrmShortlistItem] = Field(default_factory=list)
    client_message: str | None = None
    status: CrmShortlistStatus
    share_enabled: bool = False
    share_token: str | None = None
    share_url: str | None = None
    expires_at: datetime | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_by: str
    created_at: datetime
    updated_at: datetime


class CrmClientDetail(CrmClient):
    notes: list[CrmNote] = Field(default_factory=list)
    shortlists: list[CrmShortlist] = Field(default_factory=list)


class CrmSharePreview(BaseModel):
    share_token: str | None = None
    share_url: str | None = None
    title: str
    client_display_name: str | None = None
    client_message: str | None = None
    items: list[CrmShortlistItem] = Field(default_factory=list)
    client_shareable_notes: list[str] = Field(default_factory=list)
    generated_at: datetime
    expires_at: datetime | None = None
    disclaimer: str


def _normalize_agency_payload(value: Any) -> Any:
    if not isinstance(value, dict):
        return value
    normalized = {}
    for key, item in value.items():
        if isinstance(item, str):
            item = item.strip()
            normalized[key] = item or None
        else:
            normalized[key] = item
    email = normalized.get("email")
    if isinstance(email, str):
        normalized["email"] = email.lower()
    billing_email = normalized.get("billing_email")
    if isinstance(billing_email, str):
        normalized["billing_email"] = billing_email.lower()
    return normalized


def _validate_optional_email(value: str | None) -> None:
    if value is None:
        return
    if "@" not in value or "." not in value.rsplit("@", 1)[-1]:
        raise ValueError("email is invalid")


def _validate_optional_http_url(field_name: str, value: str | None) -> None:
    if value is None:
        return
    if not value.startswith(("https://", "http://")):
        raise ValueError(f"{field_name} must be an http(s) URL")


def _normalize_crm_payload(value: Any) -> Any:
    if not isinstance(value, dict):
        return value
    normalized: dict[str, Any] = {}
    for key, item in value.items():
        if isinstance(item, str):
            item = item.strip()
            normalized[key] = item or None
        elif isinstance(item, list):
            normalized[key] = [_strip_optional_string(entry) for entry in item]
        else:
            normalized[key] = item
    email = normalized.get("email")
    if isinstance(email, str):
        normalized["email"] = email.lower()
    return normalized


def _strip_optional_string(value: Any) -> Any:
    if isinstance(value, str):
        stripped = value.strip()
        return stripped or None
    return value


def _validate_budget_range(budget_min: int | None, budget_max: int | None) -> None:
    if budget_min is not None and budget_max is not None and budget_min > budget_max:
        raise ValueError("budget_min cannot be greater than budget_max")


def _deduplicate_room_counts(values: list[int]) -> list[int]:
    result: list[int] = []
    seen: set[int] = set()
    for value in values:
        room_count = int(value)
        if room_count <= 0 or room_count in seen:
            continue
        seen.add(room_count)
        result.append(room_count)
    return result


def _deduplicate_strings(values: list[str | None]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for value in values:
        if value is None:
            continue
        normalized = value.strip()
        if not normalized:
            continue
        key = normalized.lower()
        if key in seen:
            continue
        seen.add(key)
        result.append(normalized)
    return result


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
    voivodeship: str | None = None
    city: str | None = None
    district: str | None = None
    municipality: str | None = None
    building_type: str | None = None
    renovation_state: str | None = None
    has_balcony: bool | None = None
    has_terrace: bool | None = None
    has_garden: bool | None = None
    has_elevator: bool | None = None
    parking_type: str | None = None
    heating_type: str | None = None
    query: str | None = Field(default=None, min_length=1, max_length=160)
    rooms: int | None = Field(default=None, ge=1, le=10)
    max_price: int | None = Field(default=None, gt=0)
    min_area_m2: float | None = Field(default=None, gt=0)
    min_floor: int | None = Field(default=None, ge=0, le=80)
    max_floor: int | None = Field(default=None, ge=0, le=80)
    max_building_floors: int | None = Field(default=None, ge=1, le=120)
    min_building_year: int | None = Field(default=None, ge=1800, le=2100)
    max_building_year: int | None = Field(default=None, ge=1800, le=2100)
    min_investment_score: int | None = Field(default=None, ge=0, le=100)
    max_risk_score: int | None = Field(default=None, ge=0, le=100)
    max_price_delta_to_fair_mid_pct: float | None = Field(default=None, ge=-50, le=50)
    min_negotiation_score: int | None = Field(default=None, ge=0, le=100)
    min_liquidity_score: int | None = Field(default=None, ge=0, le=100)
    min_rental_potential_score: int | None = Field(default=None, ge=0, le=100)
    min_price_reductions: int | None = Field(default=None, ge=0)
    max_days_on_market: int | None = Field(default=None, ge=0)


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


class RealtorSavedSearchDigestRequest(BaseModel):
    client_name: str | None = Field(default=None, max_length=160)
    intro: str | None = Field(default=None, max_length=500)
    max_matches: int = Field(default=5, ge=1, le=20)
    include_source_links: bool = False


class RealtorSavedSearchDigestItem(BaseModel):
    listing_id: str
    title: str
    address: str
    district: str
    city: str
    price: int
    currency: str
    area_m2: float
    rooms: int
    floor: int | None = None
    price_per_m2: int
    fair_price_mid: int
    price_delta_to_fair_mid_pct: float
    decision_label: ScoreDecisionLabel
    negotiation_score: int
    liquidity_score: int
    rental_potential_score: int
    client_pitch: str
    talking_points: list[str] = Field(default_factory=list)
    cautions: list[str] = Field(default_factory=list)
    source_url: str | None = None


class RealtorSavedSearchDigest(BaseModel):
    alert: Alert
    client_name: str | None = None
    agent_name: str | None = None
    agent_email: str | None = None
    subject: str
    summary: str
    client_message: str
    total_matches: int = Field(ge=0)
    items: list[RealtorSavedSearchDigestItem] = Field(default_factory=list)
    applied_filters: dict[str, Any]
    generated_at: datetime
    disclaimer: str


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
