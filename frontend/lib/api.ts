export type Listing = {
  id: string;
  title: string;
  source_name: string;
  source_url: string;
  city: string;
  district: string;
  area_id: string;
  municipality: string;
  address: string;
  market_type: "primary" | "secondary";
  price: number;
  currency: string;
  area_m2: number;
  price_per_m2: number;
  rooms: number;
  floor: number | null;
  building_floors: number | null;
  building_year: number | null;
  first_seen_at: string;
  last_seen_at: string;
  days_on_market: number;
  price_reductions: number;
  price_increases: number;
  relisted: boolean;
  lat: number;
  lon: number;
  distance_to_center_km: number;
  nearest_stop_m: number;
  nearest_school_m: number;
  nearest_major_road_m: number;
  nearest_industrial_zone_m: number;
  parks_within_1km: number;
  schools_within_1km: number;
  planned_investments_within_2km: number;
  data_quality_score: number;
};

export type AreaStatistics = {
  area_id: string;
  name: string;
  city: string;
  median_price_per_m2: number;
  average_price_per_m2: number;
  active_listings: number;
  new_listings_30d: number;
  removed_listings_30d: number;
  average_days_on_market: number;
  price_change_90d_pct: number;
  supply_change_90d_pct: number;
};

export type LocationReferenceType =
  | "district"
  | "neighborhood"
  | "locality"
  | "landmark"
  | "transport_node";

export type MunicipalityReference = {
  id: string;
  name: string;
  country_code: string;
  region: string | null;
  lat: number | null;
  lon: number | null;
  metadata: Record<string, unknown>;
};

export type DistrictReference = {
  id: string;
  municipality_id: string;
  municipality_name: string;
  name: string;
  slug: string;
  area_id: string | null;
  lat: number | null;
  lon: number | null;
  metadata: Record<string, unknown>;
};

export type LocationReference = {
  id: string;
  municipality_id: string;
  municipality_name: string;
  district_id: string | null;
  district_name: string | null;
  name: string;
  slug: string;
  location_type: LocationReferenceType;
  lat: number | null;
  lon: number | null;
  aliases: string[];
  metadata: Record<string, unknown>;
};

export type TransportStopReference = {
  id: string;
  municipality_id: string;
  municipality_name: string;
  district_id: string | null;
  district_name: string | null;
  name: string;
  stop_type: string;
  lat: number | null;
  lon: number | null;
  lines: string[];
  source_url: string | null;
  metadata: Record<string, unknown>;
};

export type TransportRouteReference = {
  id: string;
  municipality_id: string;
  municipality_name: string;
  district_id: string | null;
  district_name: string | null;
  route_number: string;
  route_name: string;
  route_type: string;
  operator: string | null;
  status: string;
  stop_ids: string[];
  metadata: Record<string, unknown>;
};

export type SchoolReference = {
  id: string;
  municipality_id: string;
  municipality_name: string;
  district_id: string | null;
  district_name: string | null;
  name: string;
  school_type: string;
  operator_type: string | null;
  lat: number | null;
  lon: number | null;
  source_url: string | null;
  metadata: Record<string, unknown>;
};

export type KindergartenReference = {
  id: string;
  municipality_id: string;
  municipality_name: string;
  district_id: string | null;
  district_name: string | null;
  name: string;
  kindergarten_type: string;
  operator_type: string | null;
  lat: number | null;
  lon: number | null;
  source_url: string | null;
  metadata: Record<string, unknown>;
};

export type AmenityReference = {
  id: string;
  municipality_id: string;
  municipality_name: string;
  district_id: string | null;
  district_name: string | null;
  name: string;
  amenity_type: string;
  lat: number | null;
  lon: number | null;
  source_url: string | null;
  metadata: Record<string, unknown>;
};

export type IndustrialZoneReference = {
  id: string;
  municipality_id: string;
  municipality_name: string;
  district_id: string | null;
  district_name: string | null;
  name: string;
  zone_type: string;
  risk_level: string;
  impact_radius_m: number | null;
  lat: number | null;
  lon: number | null;
  source_url: string | null;
  metadata: Record<string, unknown>;
};

export type MarketDistributionBucket = {
  label: string;
  count: number;
  min_value: number | null;
  max_value: number | null;
};

export type MarketDashboardArea = AreaStatistics & {
  liquidity_index: number;
  overheated_index: number;
  buyer_market_index: number;
  seller_market_index: number;
};

export type AreaComparisonItem = MarketDashboardArea & {
  value_index: number;
  growth_index: number;
  price_per_m2_vs_city_pct: number | null;
  days_on_market_vs_city_pct: number | null;
  active_share_pct: number;
  market_label: string;
  summary: string;
};

export type AreaComparison = {
  city: string | null;
  sort: string;
  area_count: number;
  city_median_price_per_m2: number | null;
  city_average_days_on_market: number | null;
  city_active_listings: number;
  top_value_area_id: string | null;
  top_growth_area_id: string | null;
  top_buyer_market_area_id: string | null;
  top_liquidity_area_id: string | null;
  areas: AreaComparisonItem[];
};

export type MarketDashboard = {
  city: string | null;
  district: string | null;
  listings_count: number;
  active_listings: number;
  new_listings_30d: number;
  removed_listings_30d: number;
  average_days_on_market: number;
  median_price: number | null;
  median_price_per_m2: number | null;
  average_price_per_m2: number | null;
  price_change_90d_pct: number | null;
  supply_change_90d_pct: number | null;
  price_distribution: MarketDistributionBucket[];
  price_per_m2_distribution: MarketDistributionBucket[];
  rooms_distribution: MarketDistributionBucket[];
  area_distribution: MarketDistributionBucket[];
  areas: MarketDashboardArea[];
};

export type PlannedInvestment = {
  id: string;
  name: string;
  investment_type: string;
  status: string;
  city: string;
  district: string | null;
  expected_year: number | null;
  lat: number;
  lon: number;
  source_url: string | null;
  confidence_score: number;
  notes: string | null;
};

export type PlannedInvestmentPayload = {
  name: string;
  investment_type: string;
  status?: string;
  city: string;
  district?: string | null;
  expected_year?: number | null;
  lat: number;
  lon: number;
  source_url?: string | null;
  confidence_score?: number;
  notes?: string | null;
};

export type PlannedInvestmentImportResponse = {
  rows_seen: number;
  created: number;
  updated: number;
  skipped: number;
  dry_run: boolean;
  investment_ids: string[];
  source_ids: string[];
  errors: string[];
  job: IngestionJob;
};

export type PartnerCsvImportResponse = {
  rows_seen: number;
  raw_created: number;
  raw_updated: number;
  properties_created: number;
  properties_updated: number;
  snapshots_created: number;
  snapshots_updated: number;
  dry_run: boolean;
  listing_ids: string[];
  errors: string[];
  job: IngestionJob;
};

export type ScoringBacktestItem = {
  listing_id: string;
  title: string;
  area_id: string;
  observed_at: string;
  target_observed_at: string;
  predicted_fair_price_mid: number;
  actual_price: number;
  absolute_error_pct: number;
  formula_version: string;
  weights_profile: string;
};

export type ScoringBacktestResult = {
  formula_version: string;
  weights_profile: string;
  listings_seen: number;
  listings_evaluated: number;
  evaluated_points: number;
  mean_absolute_error_pct: number | null;
  median_absolute_error_pct: number | null;
  within_5_pct: number | null;
  within_10_pct: number | null;
  items: ScoringBacktestItem[];
};

export type PriceHistoryPoint = {
  observed_at: string;
  price: number;
  price_per_m2: number;
};

export type ListingEvent = {
  listing_id: string;
  event_type:
    | "first_seen"
    | "price_reduced"
    | "price_increased"
    | "parameter_changed"
    | "relisted"
    | "removed"
    | "republished";
  observed_at: string;
  summary: string;
  payload: Record<string, unknown>;
};

export type PropertyScores = {
  formula_version: string;
  weights_profile: string;
  decision_label:
    | "strong_candidate"
    | "good_option"
    | "fair_option"
    | "overpriced"
    | "risky"
    | "weak_fit";
  price_label: "below_fair" | "fair" | "above_fair" | "overpriced";
  risk_label: "low_risk" | "moderate_risk" | "elevated_risk" | "high_risk";
  negotiation_label:
    | "weak_negotiation"
    | "some_negotiation"
    | "negotiable"
    | "strong_negotiation";
  liquidity_label: "weak" | "moderate" | "good" | "strong";
  rental_potential_label: "weak" | "moderate" | "good" | "strong";
  investment_score: number;
  risk_score: number;
  negotiation_score: number;
  liquidity_score: number;
  rental_potential_score: number;
  fair_price_low: number;
  fair_price_mid: number;
  fair_price_high: number;
  fair_price_confidence_score: number;
  price_delta_to_fair_mid_pct: number;
  reasons: string[];
  warnings: string[];
};

export type ListingAnalysis = {
  listing: Listing;
  area_statistics: AreaStatistics;
  price_history: PriceHistoryPoint[];
  listing_events: ListingEvent[];
  comparables: Listing[];
  scores: PropertyScores;
  insights: string[];
  negotiation_arguments: string[];
  data_quality_notes: string[];
};

export type UserSubmittedListingRequest = {
  title?: string | null;
  source_url?: string | null;
  address: string;
  city?: string;
  district: string;
  market_type?: "primary" | "secondary";
  price: number;
  area_m2: number;
  rooms: number;
  floor?: number | null;
  building_floors?: number | null;
  building_year?: number | null;
  lat?: number | null;
  lon?: number | null;
  distance_to_center_km?: number | null;
  nearest_stop_m?: number | null;
  nearest_school_m?: number | null;
  nearest_major_road_m?: number | null;
  nearest_industrial_zone_m?: number | null;
  parks_within_1km?: number | null;
  schools_within_1km?: number | null;
  planned_investments_within_2km?: number | null;
  confirm_private_analysis: boolean;
  save_private_draft?: boolean;
  retention_days?: number;
};

export type SourceReferencePreview = {
  source_url_private: string;
  source_domain: string | null;
  provider: "otodom" | "olx" | "other";
  provider_label: string;
  listing_reference_id: string | null;
  source_slug: string | null;
  suggested_title: string | null;
  manual_fields_required: string[];
  manual_fields_recommended: string[];
  privacy_note: string;
  warnings: string[];
};

export type SourceUrlImportFields = {
  title: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  market_type: "primary" | "secondary" | null;
  price: number | null;
  area_m2: number | null;
  rooms: number | null;
  floor: number | null;
  building_floors: number | null;
  building_year: number | null;
  lat: number | null;
  lon: number | null;
};

export type SourceUrlImportResult = {
  reference_preview: SourceReferencePreview;
  status: "extracted" | "partial" | "failed" | "unsupported";
  fields: SourceUrlImportFields;
  fields_extracted: string[];
  extraction_source: string | null;
  fetched_at: string | null;
  fetch_status_code: number | null;
  warnings: string[];
};

export type UserSubmittedListingAnalysis = {
  analysis: ListingAnalysis;
  confidence_score: number;
  source_url_private: string | null;
  source_domain: string | null;
  warnings: string[];
  comparables_basis: string;
  retention_note: string;
  draft_id: string | null;
  draft_expires_at: string | null;
};

export type UserSubmittedListingDraft = {
  id: string;
  owner_id: string;
  listing_id: string;
  source_url_private: string | null;
  source_domain: string | null;
  address: string;
  city: string;
  district: string;
  market_type: "primary" | "secondary";
  price: number;
  area_m2: number;
  rooms: number;
  data_quality_score: number;
  confidence_score: number;
  request_payload: Record<string, unknown>;
  analysis_payload: Record<string, unknown>;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export type UserSubmittedListingDraftPruneResult = {
  deleted: number;
};

export type ReportBranding = {
  agency_name?: string | null;
  agent_name?: string | null;
  agent_email?: string | null;
  agent_phone?: string | null;
  website_url?: string | null;
  note?: string | null;
};

export type ReportSection = {
  title: string;
  items: string[];
};

export type ObjectReport = {
  listing_id: string;
  audience: "buyer" | "realtor" | "investor";
  template_code: string;
  template_name: string;
  branding: ReportBranding | null;
  summary: string;
  sections: ReportSection[];
  disclaimer: string;
};

export type UserSubmittedListingReportRequest = UserSubmittedListingRequest & {
  audience?: "buyer" | "realtor" | "investor";
  branding?: ReportBranding | null;
};

export type UserSubmittedListingReport = {
  analysis: UserSubmittedListingAnalysis;
  report: ObjectReport;
};

export type GenerateUserSubmittedDraftReportRequest = {
  audience?: "buyer" | "realtor" | "investor";
  report_format?: "json" | "html";
  branding?: ReportBranding | null;
};

export type ReportEmailResult = {
  report_id: string;
  provider: string;
  status: "dry_run" | "sent" | "skipped" | "failed";
  target_email: string | null;
  subject: string;
  message: string;
  metadata: Record<string, unknown>;
};

export type GeneratedReport = {
  id: string;
  owner_id: string;
  listing_id: string;
  audience: "buyer" | "realtor" | "investor";
  report_format: "json" | "html";
  content_type: string;
  title: string;
  summary: string;
  content: string;
  report_metadata: Record<string, unknown>;
  created_at: string;
};

export type GeneratedReportListItem = Omit<GeneratedReport, "content" | "report_metadata">;
export type AIInsightSubjectType = "listing" | "user_submitted_draft" | "area" | "report";
export type AIInsightType = "report_summary" | "object_explanation" | "area_summary";

export type AIInsightListItem = {
  id: string;
  owner_id: string;
  subject_type: AIInsightSubjectType;
  subject_id: string;
  insight_type: AIInsightType;
  provider: string;
  model_name: string;
  prompt_version: string;
  source_report_id: string | null;
  title: string;
  summary: string;
  created_at: string;
};

export type AIInsight = AIInsightListItem & {
  content: string;
  input_hash: string;
  metadata: Record<string, unknown>;
};

export type UserRole = "buyer" | "realtor" | "agency_admin" | "admin";
export type SubscriptionPlan =
  | "free"
  | "buyer_pro"
  | "investor"
  | "realtor"
  | "agency"
  | "enterprise";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";
export type ReportProductCode =
  | "object_report"
  | "full_object_analysis"
  | "investor_report"
  | "area_report"
  | "report_bundle_5";
export type ReportOrderStatus = "unpaid" | "paid" | "fulfilled" | "canceled";
export type IngestionJobStatus = "queued" | "running" | "succeeded" | "failed";
export type DataQualitySeverity = "info" | "warning" | "error";
export type IngestionSourceHealthStatus = "healthy" | "warning" | "failing";
export type SourceLegalStatus = "unknown" | "approved" | "review_required" | "blocked";
export type SourceCheckType =
  | "robots_txt"
  | "terms_review"
  | "connectivity"
  | "partner_feed"
  | "one_off_user_url"
  | "manual_review";
export type SourceCheckJobStatus = "queued" | "running" | "succeeded" | "failed" | "blocked";
export type SourceErrorStatus = "open" | "retry_scheduled" | "resolved" | "ignored";
export type ListingSort =
  | "price_asc"
  | "price_desc"
  | "price_per_m2_asc"
  | "price_per_m2_desc"
  | "investment_score_desc"
  | "investment_score_asc"
  | "risk_score_asc"
  | "risk_score_desc"
  | "negotiation_score_desc"
  | "negotiation_score_asc"
  | "days_on_market_asc"
  | "days_on_market_desc"
  | "newest"
  | "oldest";

export type UserAccount = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export type PlanLimits = {
  plan: SubscriptionPlan;
  max_favorites: number;
  max_alerts: number;
  monthly_reports: number;
  max_compare_items: number;
  can_export: boolean;
  can_use_api: boolean;
  can_white_label: boolean;
};

export type MortgageCalculationRequest = {
  property_price_pln: number;
  down_payment_pln: number;
  loan_years?: number;
  annual_interest_rate_pct?: number;
  rate_type?: "fixed" | "variable";
  market_type?: "primary" | "secondary";
  monthly_income_pln?: number | null;
  monthly_existing_debt_pln?: number;
  monthly_housing_costs_pln?: number;
  insurance_monthly_pln?: number;
  notary_fee_pln?: number;
  court_fees_pln?: number;
  bank_commission_pct?: number;
  agent_commission_pct?: number;
  renovation_budget_pln?: number;
  include_pcc?: boolean;
};

export type MortgageCostBreakdown = {
  property_price_pln: number;
  down_payment_pln: number;
  down_payment_pct: number;
  loan_amount_pln: number;
  loan_to_value_pct: number;
  pcc_tax_pln: number;
  notary_fee_pln: number;
  court_fees_pln: number;
  bank_commission_pln: number;
  agent_commission_pln: number;
  renovation_budget_pln: number;
  upfront_cash_needed_pln: number;
};

export type MortgageScenario = {
  scenario_code: string;
  label: string;
  annual_interest_rate_pct: number;
  loan_years: number;
  monthly_principal_interest_pln: number;
  monthly_total_payment_pln: number;
  total_interest_pln: number;
  total_repaid_pln: number;
  debt_to_income_pct: number | null;
};

export type MortgageAffordability = {
  status: "unknown" | "comfortable" | "stretched" | "high_risk";
  monthly_income_pln: number | null;
  available_for_mortgage_comfortable_pln: number | null;
  available_for_mortgage_stretched_pln: number | null;
  base_debt_to_income_pct: number | null;
  payment_to_income_pct: number | null;
  monthly_buffer_after_payment_pln: number | null;
};

export type MortgageCalculationResult = {
  costs: MortgageCostBreakdown;
  base_scenario: MortgageScenario;
  scenarios: MortgageScenario[];
  affordability: MortgageAffordability;
  notes: string[];
  disclaimer: string;
};

export type PartnerReferralType = "mortgage" | "legal" | "renovation";
export type PartnerReferralStatus = "new" | "contacted" | "qualified" | "closed" | "rejected";

export type PartnerReferralPayload = {
  referral_type: PartnerReferralType;
  source_context?: string;
  listing_id?: string | null;
  report_id?: string | null;
  city?: string;
  district?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  message?: string | null;
  consent_to_contact: boolean;
  metadata?: Record<string, unknown>;
};

export type PartnerReferral = {
  id: string;
  owner_id: string;
  referral_type: PartnerReferralType;
  status: PartnerReferralStatus;
  source_context: string;
  listing_id: string | null;
  report_id: string | null;
  city: string;
  district: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  message: string | null;
  consent_to_contact: boolean;
  metadata: Record<string, unknown>;
  assigned_to: string | null;
  partner_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AccountUsage = {
  favorites: number;
  alerts: number;
  reports_this_month: number;
  report_credits_available: number;
};

export type AccountSummary = {
  user: UserAccount;
  subscription: Subscription;
  limits: PlanLimits;
  usage: AccountUsage;
};

export type ListingSearchQuery = {
  city?: string;
  district?: string;
  rooms?: number;
  market_type?: "primary" | "secondary";
  min_price?: number;
  max_price?: number;
  min_price_per_m2?: number;
  max_price_per_m2?: number;
  min_area_m2?: number;
  max_area_m2?: number;
  max_days_on_market?: number;
  min_investment_score?: number;
  max_risk_score?: number;
  min_negotiation_score?: number;
  min_liquidity_score?: number;
  min_rental_potential_score?: number;
  min_data_quality_score?: number;
  lat?: number;
  lon?: number;
  radius_km?: number;
  sort?: ListingSort;
  page?: number;
  page_size?: number;
};

export type ListingSearchResponse = {
  items: ListingAnalysis[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  sort: ListingSort;
  filters: Record<string, unknown>;
};

export type IngestionJob = {
  id: string;
  source_name: string;
  source_type: string;
  status: IngestionJobStatus;
  rows_seen: number;
  raw_created: number;
  raw_updated: number;
  properties_created: number;
  properties_updated: number;
  snapshots_created: number;
  snapshots_updated: number;
  errors_count: number;
  created_by: string;
  notes: string | null;
  metadata: Record<string, unknown>;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

export type IngestionSourceHealth = {
  source_name: string;
  source_type: string;
  health_status: IngestionSourceHealthStatus;
  latest_job_id: string;
  latest_job_status: IngestionJobStatus;
  rows_seen: number;
  errors_count: number;
  warning_count: number;
  error_count: number;
  last_error_message: string | null;
  updated_at: string;
};

export type SourceCheckJob = {
  id: string;
  source_id: string | null;
  source_name: string;
  source_type: string;
  check_type: SourceCheckType;
  status: SourceCheckJobStatus;
  target_domain: string | null;
  target_url_hash: string | null;
  created_by: string;
  scheduled_for: string | null;
  started_at: string | null;
  finished_at: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  result: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SourceCheckJobPayload = {
  source_id?: string | null;
  source_name: string;
  source_type?: string;
  check_type?: SourceCheckType;
  status?: SourceCheckJobStatus;
  target_domain?: string | null;
  target_url_hash?: string | null;
  scheduled_for?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
};

export type SourceError = {
  id: string;
  source_id: string | null;
  source_name: string;
  source_type: string;
  source_check_job_id: string | null;
  ingestion_job_id: string | null;
  severity: DataQualitySeverity;
  status: SourceErrorStatus;
  error_code: string;
  message: string;
  retryable: boolean;
  retry_count: number;
  next_retry_at: string | null;
  last_retry_job_id: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SourceErrorPayload = {
  source_id?: string | null;
  source_name: string;
  source_type?: string;
  source_check_job_id?: string | null;
  ingestion_job_id?: string | null;
  severity?: DataQualitySeverity;
  status?: SourceErrorStatus;
  error_code: string;
  message: string;
  retryable?: boolean;
  next_retry_at?: string | null;
  metadata?: Record<string, unknown>;
};

export type SourceErrorUpdatePayload = {
  status?: SourceErrorStatus;
  retryable?: boolean;
  next_retry_at?: string | null;
  resolution_note?: string | null;
  metadata?: Record<string, unknown>;
};

export type SourceErrorRetryResult = {
  error: SourceError;
  retry_job: SourceCheckJob;
};

export type InfrastructureEnrichmentItem = {
  property_id: number;
  listing_id: string | null;
  city: string;
  district: string | null;
  distance_to_center_km: number | null;
  nearest_stop_m: number | null;
  nearest_school_m: number | null;
  nearest_industrial_zone_m: number | null;
  parks_within_1km: number;
  schools_within_1km: number;
  planned_investments_within_2km: number;
  changed_fields: string[];
};

export type InfrastructureEnrichmentJobResult = {
  calculated_at: string;
  dry_run: boolean;
  properties_seen: number;
  properties_with_changes: number;
  properties_updated: number;
  snapshots_updated: number;
  items: InfrastructureEnrichmentItem[];
};

export type SourceRegistryEntry = {
  id: string;
  name: string;
  source_type: string;
  base_url: string | null;
  legal_status: SourceLegalStatus;
  refresh_cadence: string;
  owner: string;
  ingestion_method: string;
  allowed_use: string[];
  robots_txt_url: string | null;
  terms_url: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SourceRegistryEntryPayload = {
  name?: string;
  source_type?: string;
  base_url?: string | null;
  legal_status?: SourceLegalStatus;
  refresh_cadence?: string;
  owner?: string;
  ingestion_method?: string;
  allowed_use?: string[];
  robots_txt_url?: string | null;
  terms_url?: string | null;
  notes?: string | null;
  is_active?: boolean;
};

export type DataQualityLog = {
  id: string;
  job_id: string | null;
  source_name: string;
  source_listing_id: string | null;
  severity: DataQualitySeverity;
  code: string;
  message: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type RawListingSummary = {
  id: number | string;
  source_name: string;
  source_listing_id: string;
  source_url: string;
  fetched_at: string;
  payload_hash: string;
  raw_payload: Record<string, unknown>;
};

export type PropertyDeduplicationDecision = "matched" | "review_required" | "rejected";
export type PropertyDeduplicationReviewStatus = "open" | "auto_resolved";

export type PropertyDeduplicationMatch = {
  id: number;
  job_id: string | null;
  source_name: string;
  source_listing_id: string;
  candidate_property_id: number | null;
  matched_property_id: number | null;
  decision: PropertyDeduplicationDecision;
  review_status: PropertyDeduplicationReviewStatus;
  match_score: number;
  reasons: string[];
  incoming_payload: Record<string, unknown>;
  candidate_payload: Record<string, unknown>;
  created_at: string;
};

export type CompareResponse = {
  items: ListingAnalysis[];
};

export type ReportProduct = {
  code: ReportProductCode;
  title: string;
  audience: "buyer" | "realtor" | "investor";
  amount_grosz: number;
  currency: string;
  description: string;
  features: string[];
};

export type ReportOrder = {
  id: string;
  owner_id: string;
  listing_id: string;
  product_code: ReportProductCode;
  audience: "buyer" | "realtor" | "investor";
  report_format: "json" | "html";
  status: ReportOrderStatus;
  amount_grosz: number;
  currency: string;
  checkout_url: string | null;
  generated_report_id: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  fulfilled_at: string | null;
};

export type CheckoutSession = {
  provider: string;
  mode: "mock" | "live";
  checkout_url: string;
  order: ReportOrder;
  external_reference: string | null;
  metadata: Record<string, unknown>;
};

export type ReportOrderEvent = {
  id: string;
  order_id: string;
  owner_id: string;
  event_type:
    | "order_created"
    | "checkout_created"
    | "payment_marked_paid"
    | "payment_webhook_processed"
    | "payment_webhook_ignored"
    | "report_fulfilled"
    | "fulfillment_skipped"
    | "payment_provider_error";
  actor_id: string | null;
  message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type Favorite = {
  id: string;
  owner_id: string;
  listing_id: string;
  note: string | null;
  created_at: string;
  listing: Listing | null;
};

export type AlertFilters = {
  city?: string | null;
  district?: string | null;
  rooms?: number | null;
  max_price?: number | null;
  min_area_m2?: number | null;
  min_investment_score?: number | null;
  max_risk_score?: number | null;
};

export type Alert = {
  id: string;
  owner_id: string;
  name: string;
  filters: AlertFilters;
  channel: "email" | "telegram";
  frequency: "instant" | "daily" | "weekly";
  delivery_target: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AlertPreview = {
  alert: Alert;
  matches: ListingAnalysis[];
  total_matches: number;
  applied_filters: Record<string, unknown>;
};

export type AlertDeliveryJob = {
  id: string;
  owner_id: string;
  alert_id: string;
  channel: "email" | "telegram";
  provider: string;
  status: "dry_run" | "sent" | "skipped" | "failed";
  total_matches: number;
  delivered_count: number;
  message: string;
  listing_ids: string[];
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AlertDeliveryBatchRequest = {
  dry_run?: boolean;
  max_matches?: number;
  limit?: number;
  force?: boolean;
};

export type AlertDeliveryBatchSkip = {
  owner_id: string;
  alert_id: string;
  reason: string;
  last_delivery_job_id: string | null;
  last_delivery_at: string | null;
};

export type AlertDeliveryBatchResult = {
  frequency: "instant" | "daily" | "weekly";
  channel: "email" | "telegram";
  dry_run: boolean;
  force: boolean;
  alerts_seen: number;
  jobs_prepared: number;
  jobs_persisted: number;
  delivered_count: number;
  sent_count: number;
  skipped_count: number;
  failed_count: number;
  jobs: AlertDeliveryJob[];
  skipped: AlertDeliveryBatchSkip[];
};

export type MapFeatureType = "listing" | "planned_investment";

export type MapFeatureProperties = {
  feature_type: MapFeatureType;
  [key: string]: string | number | boolean | null;
};

export type MapFeature = {
  type: "Feature";
  id: string;
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: MapFeatureProperties;
};

export type MapFeatureCollection = {
  type: "FeatureCollection";
  features: MapFeature[];
  bbox: [number, number, number, number] | null;
  metadata: {
    listing_count?: number;
    planned_investment_count?: number;
    skipped_listings?: number;
    filters?: Record<string, unknown>;
    [key: string]: unknown;
  };
};

export type MapQuery = {
  city?: string;
  district?: string;
  rooms?: number;
  max_price?: number;
  min_area_m2?: number;
  bbox?: string;
  lat?: number;
  lon?: number;
  radius_km?: number;
  min_investment_score?: number;
  max_risk_score?: number;
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
export const OWNER_ID = process.env.NEXT_PUBLIC_OWNER_ID ?? "demo-user";
const ADMIN_HEADERS = {
  "X-Domarion-User-Id": "demo-admin",
  "X-Domarion-Email": "admin@domarion.local",
  "X-Domarion-Role": "admin",
  "X-Domarion-Plan": "enterprise",
};

function toQueryString<T extends object>(params: T) {
  const searchParams = new URLSearchParams();
  Object.entries(params as Record<string, string | number | boolean | undefined | null>).forEach(
    ([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    },
  );
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const apiBaseUrl = currentApiBaseUrl();
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch (caught) {
    const detail = caught instanceof Error ? caught.message : "network error";
    throw new Error(
      `Backend API недоступен: ${apiBaseUrl}. Проверь, что backend запущен и ` +
        `NEXT_PUBLIC_API_BASE_URL указывает на правильный порт. Детали: ${detail}`,
    );
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

function currentApiBaseUrl() {
  if (typeof window === "undefined") {
    return API_BASE_URL;
  }
  if (isLocalFrontendHost(window.location.hostname) && isLocalApiBaseUrl(API_BASE_URL)) {
    return "http://127.0.0.1:8000";
  }
  return API_BASE_URL;
}

function isLocalFrontendHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function isLocalApiBaseUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1" ||
      url.hostname === "[::1]"
    );
  } catch {
    return false;
  }
}

export const api = {
  listListings: (params: ListingSearchQuery = {}) =>
    request<ListingSearchResponse>(`/api/v1/listings${toQueryString(params)}`),
  listAreas: () => request<AreaStatistics[]>("/api/v1/areas"),
  compareAreas: (params: { city?: string; sort?: string; limit?: number } = {}) =>
    request<AreaComparison>(`/api/v1/areas/compare${toQueryString(params)}`),
  listMunicipalities: () =>
    request<MunicipalityReference[]>("/api/v1/locations/municipalities"),
  listDistrictReferences: (params: { municipality_id?: string; city?: string } = {}) =>
    request<DistrictReference[]>(
      `/api/v1/locations/districts${toQueryString(params)}`,
    ),
  listLocationReferences: (params: {
    municipality_id?: string;
    district_id?: string;
    location_type?: LocationReferenceType;
    query?: string;
    limit?: number;
  } = {}) =>
    request<LocationReference[]>(`/api/v1/locations${toQueryString(params)}`),
  listTransportStops: (params: {
    municipality_id?: string;
    district_id?: string;
    city?: string;
    limit?: number;
  } = {}) =>
    request<TransportStopReference[]>(
      `/api/v1/infrastructure/transport-stops${toQueryString(params)}`,
    ),
  listTransportRoutes: (params: {
    municipality_id?: string;
    district_id?: string;
    city?: string;
    limit?: number;
  } = {}) =>
    request<TransportRouteReference[]>(
      `/api/v1/infrastructure/transport-routes${toQueryString(params)}`,
    ),
  listSchools: (params: {
    municipality_id?: string;
    district_id?: string;
    city?: string;
    limit?: number;
  } = {}) =>
    request<SchoolReference[]>(`/api/v1/infrastructure/schools${toQueryString(params)}`),
  listKindergartens: (params: {
    municipality_id?: string;
    district_id?: string;
    city?: string;
    limit?: number;
  } = {}) =>
    request<KindergartenReference[]>(
      `/api/v1/infrastructure/kindergartens${toQueryString(params)}`,
    ),
  listAmenities: (params: {
    municipality_id?: string;
    district_id?: string;
    city?: string;
    amenity_type?: string;
    limit?: number;
  } = {}) =>
    request<AmenityReference[]>(`/api/v1/infrastructure/amenities${toQueryString(params)}`),
  listIndustrialZones: (params: {
    municipality_id?: string;
    district_id?: string;
    city?: string;
    limit?: number;
  } = {}) =>
    request<IndustrialZoneReference[]>(
      `/api/v1/infrastructure/industrial-zones${toQueryString(params)}`,
    ),
  getMarketDashboard: (params: { city?: string; district?: string } = {}) =>
    request<MarketDashboard>(`/api/v1/market/dashboard${toQueryString(params)}`),
  getMe: () => request<AccountSummary>("/api/v1/me"),
  listPlans: () => request<PlanLimits[]>("/api/v1/plans"),
  calculateMortgage: (payload: MortgageCalculationRequest) =>
    request<MortgageCalculationResult>("/api/v1/mortgage/calculate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  previewUserSubmittedListingReference: (sourceUrl: string) =>
    request<SourceReferencePreview>("/api/v1/user-submitted-listings/reference-preview", {
      method: "POST",
      body: JSON.stringify({ source_url: sourceUrl }),
    }),
  importUserSubmittedListingFromUrl: (sourceUrl: string) =>
    request<SourceUrlImportResult>("/api/v1/user-submitted-listings/import-from-url", {
      method: "POST",
      body: JSON.stringify({ source_url: sourceUrl }),
    }),
  createPartnerReferral: (payload: PartnerReferralPayload) =>
    request<PartnerReferral>("/api/v1/partner-referrals", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listPartnerReferrals: (params: { limit?: number } = {}) =>
    request<PartnerReferral[]>(`/api/v1/partner-referrals${toQueryString(params)}`),
  listAdminPartnerReferrals: (params: {
    status?: PartnerReferralStatus;
    referral_type?: PartnerReferralType;
    limit?: number;
  } = {}) =>
    request<PartnerReferral[]>(
      `/api/v1/admin/partner-referrals${toQueryString(params)}`,
      { headers: ADMIN_HEADERS },
    ),
  updateAdminPartnerReferral: (
    referralId: string,
    payload: {
      status?: PartnerReferralStatus;
      assigned_to?: string | null;
      partner_name?: string | null;
      notes?: string | null;
      metadata?: Record<string, unknown>;
    },
  ) =>
    request<PartnerReferral>(`/api/v1/admin/partner-referrals/${referralId}`, {
      method: "PATCH",
      headers: ADMIN_HEADERS,
      body: JSON.stringify(payload),
    }),
  analyzeUserSubmittedListing: (payload: UserSubmittedListingRequest) =>
    request<UserSubmittedListingAnalysis>("/api/v1/user-submitted-listings/analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createUserSubmittedListingReport: (payload: UserSubmittedListingReportRequest) =>
    request<UserSubmittedListingReport>("/api/v1/user-submitted-listings/report", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listUserSubmittedListingDrafts: (params: {
    include_expired?: boolean;
    limit?: number;
  } = {}) =>
    request<UserSubmittedListingDraft[]>(
      `/api/v1/user-submitted-listings/drafts${toQueryString(params)}`,
    ),
  getUserSubmittedListingDraft: (draftId: string) =>
    request<UserSubmittedListingDraft>(`/api/v1/user-submitted-listings/drafts/${draftId}`),
  deleteUserSubmittedListingDraft: (draftId: string) =>
    fetch(`${currentApiBaseUrl()}/api/v1/user-submitted-listings/drafts/${draftId}`, {
      method: "DELETE",
    }),
  generateUserSubmittedDraftReport: (
    draftId: string,
    payload: GenerateUserSubmittedDraftReportRequest = {},
  ) =>
    request<GeneratedReport>(
      `/api/v1/user-submitted-listings/drafts/${draftId}/reports/generate`,
      {
        method: "POST",
        body: JSON.stringify({
          audience: payload.audience ?? "buyer",
          report_format: payload.report_format ?? "html",
          ...(payload.branding ? { branding: payload.branding } : {}),
        }),
      },
    ),
  listAdminIngestionJobs: () =>
    request<IngestionJob[]>("/api/v1/admin/ingestion/jobs", {
      headers: ADMIN_HEADERS,
    }),
  listAdminIngestionSourceHealth: () =>
    request<IngestionSourceHealth[]>("/api/v1/admin/ingestion/source-health", {
      headers: ADMIN_HEADERS,
    }),
  listAdminSourceCheckJobs: (params: {
    source_name?: string;
    status?: SourceCheckJobStatus;
    limit?: number;
  } = {}) =>
    request<SourceCheckJob[]>(
      `/api/v1/admin/ingestion/source-checks${toQueryString(params)}`,
      { headers: ADMIN_HEADERS },
    ),
  createAdminSourceCheckJob: (payload: SourceCheckJobPayload) =>
    request<SourceCheckJob>("/api/v1/admin/ingestion/source-checks", {
      method: "POST",
      headers: ADMIN_HEADERS,
      body: JSON.stringify(payload),
    }),
  listAdminSourceErrors: (params: {
    source_name?: string;
    status?: SourceErrorStatus;
    severity?: DataQualitySeverity;
    limit?: number;
  } = {}) =>
    request<SourceError[]>(
      `/api/v1/admin/ingestion/source-errors${toQueryString(params)}`,
      { headers: ADMIN_HEADERS },
    ),
  createAdminSourceError: (payload: SourceErrorPayload) =>
    request<SourceError>("/api/v1/admin/ingestion/source-errors", {
      method: "POST",
      headers: ADMIN_HEADERS,
      body: JSON.stringify(payload),
    }),
  updateAdminSourceError: (errorId: string, payload: SourceErrorUpdatePayload) =>
    request<SourceError>(`/api/v1/admin/ingestion/source-errors/${errorId}`, {
      method: "PATCH",
      headers: ADMIN_HEADERS,
      body: JSON.stringify(payload),
    }),
  retryAdminSourceError: (errorId: string) =>
    request<SourceErrorRetryResult>(
      `/api/v1/admin/ingestion/source-errors/${errorId}/retry`,
      { method: "POST", headers: ADMIN_HEADERS },
    ),
  listAdminIngestionSources: () =>
    request<SourceRegistryEntry[]>("/api/v1/admin/ingestion/sources", {
      headers: ADMIN_HEADERS,
    }),
  createAdminIngestionSource: (payload: Required<SourceRegistryEntryPayload>) =>
    request<SourceRegistryEntry>("/api/v1/admin/ingestion/sources", {
      method: "POST",
      headers: ADMIN_HEADERS,
      body: JSON.stringify(payload),
    }),
  updateAdminIngestionSource: (sourceId: string, payload: SourceRegistryEntryPayload) =>
    request<SourceRegistryEntry>(`/api/v1/admin/ingestion/sources/${sourceId}`, {
      method: "PATCH",
      headers: ADMIN_HEADERS,
      body: JSON.stringify(payload),
    }),
  getAdminScoringBacktest: (params: {
    city?: string;
    district?: string;
    limit?: number;
  } = {}) =>
    request<ScoringBacktestResult>(`/api/v1/admin/scoring/backtest${toQueryString(params)}`, {
      headers: ADMIN_HEADERS,
    }),
  enrichAdminInfrastructure: (params: { dry_run?: boolean; limit?: number } = {}) =>
    request<InfrastructureEnrichmentJobResult>(
      `/api/v1/admin/infrastructure/enrich${toQueryString(params)}`,
      { method: "POST", headers: ADMIN_HEADERS },
    ),
  createAdminIngestionJob: (payload: {
    source_name: string;
    source_type?: string;
    status?: IngestionJobStatus;
    notes?: string;
    metadata?: Record<string, unknown>;
  }) =>
    request<IngestionJob>("/api/v1/admin/ingestion/jobs", {
      method: "POST",
      headers: ADMIN_HEADERS,
      body: JSON.stringify(payload),
    }),
  listAdminDataQualityLogs: (params: {
    job_id?: string;
    severity?: DataQualitySeverity;
    limit?: number;
  } = {}) =>
    request<DataQualityLog[]>(
      `/api/v1/admin/data-quality/logs${toQueryString(params)}`,
      { headers: ADMIN_HEADERS },
    ),
  listAdminRawListings: (params: { source_name?: string; limit?: number } = {}) =>
    request<RawListingSummary[]>(
      `/api/v1/admin/raw-listings${toQueryString(params)}`,
      { headers: ADMIN_HEADERS },
    ),
  listAdminDeduplicationMatches: (params: {
    job_id?: string;
    source_listing_id?: string;
    decision?: PropertyDeduplicationDecision;
    review_status?: PropertyDeduplicationReviewStatus;
    limit?: number;
  } = {}) =>
    request<PropertyDeduplicationMatch[]>(
      `/api/v1/admin/deduplication/matches${toQueryString(params)}`,
      { headers: ADMIN_HEADERS },
    ),
  deliverAdminDailyEmailAlerts: (payload: AlertDeliveryBatchRequest = {}) =>
    request<AlertDeliveryBatchResult>("/api/v1/admin/alerts/deliver-daily-email", {
      method: "POST",
      headers: ADMIN_HEADERS,
      body: JSON.stringify({
        dry_run: payload.dry_run ?? true,
        max_matches: payload.max_matches ?? 10,
        limit: payload.limit ?? 500,
        force: payload.force ?? false,
      }),
    }),
  importAdminPartnerCsv: async (payload: {
    file: File;
    sourceName?: string;
    sourceType?: string;
    dryRun?: boolean;
  }) => {
    const form = new FormData();
    form.set("file", payload.file);
    if (payload.sourceName) form.set("source_name", payload.sourceName);
    if (payload.sourceType) form.set("source_type", payload.sourceType);
    form.set("dry_run", String(payload.dryRun ?? true));

    const response = await fetch(`${currentApiBaseUrl()}/api/v1/admin/listings/import-csv`, {
      method: "POST",
      headers: ADMIN_HEADERS,
      body: form,
      cache: "no-store",
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`API ${response.status}: ${body}`);
    }
    return response.json() as Promise<PartnerCsvImportResponse>;
  },
  listAdminPlannedInvestments: (params: { city?: string; district?: string } = {}) =>
    request<PlannedInvestment[]>(
      `/api/v1/admin/planned-investments${toQueryString(params)}`,
      { headers: ADMIN_HEADERS },
    ),
  createAdminPlannedInvestment: (payload: PlannedInvestmentPayload) =>
    request<PlannedInvestment>("/api/v1/admin/planned-investments", {
      method: "POST",
      headers: ADMIN_HEADERS,
      body: JSON.stringify(payload),
    }),
  updateAdminPlannedInvestment: (
    investmentId: string,
    payload: Partial<PlannedInvestmentPayload>,
  ) =>
    request<PlannedInvestment>(`/api/v1/admin/planned-investments/${investmentId}`, {
      method: "PATCH",
      headers: ADMIN_HEADERS,
      body: JSON.stringify(payload),
    }),
  deleteAdminPlannedInvestment: (investmentId: string) =>
    fetch(`${currentApiBaseUrl()}/api/v1/admin/planned-investments/${investmentId}`, {
      method: "DELETE",
      headers: ADMIN_HEADERS,
    }),
  importAdminPlannedInvestments: async (payload: {
    file: File;
    sourceName?: string;
    dryRun?: boolean;
  }) => {
    const form = new FormData();
    form.set("file", payload.file);
    if (payload.sourceName) form.set("source_name", payload.sourceName);
    form.set("dry_run", String(payload.dryRun ?? false));

    const response = await fetch(`${currentApiBaseUrl()}/api/v1/admin/planned-investments/import`, {
      method: "POST",
      headers: ADMIN_HEADERS,
      body: form,
      cache: "no-store",
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`API ${response.status}: ${body}`);
    }
    return response.json() as Promise<PlannedInvestmentImportResponse>;
  },
  listReportProducts: () => request<ReportProduct[]>("/api/v1/report-products"),
  listReportOrders: () => request<ReportOrder[]>("/api/v1/report-orders"),
  listReportOrderEvents: (orderId: string) =>
    request<ReportOrderEvent[]>(`/api/v1/report-orders/${orderId}/events`),
  createReportOrder: (payload: {
    listing_id: string;
    product_code: ReportProductCode;
    audience?: "buyer" | "realtor" | "investor";
  }) =>
    request<CheckoutSession>("/api/v1/report-orders", {
      method: "POST",
      body: JSON.stringify({ ...payload, report_format: "html" }),
    }),
  mockPayReportOrder: (orderId: string) =>
    request<ReportOrder>(`/api/v1/report-orders/${orderId}/mock-pay`, {
      method: "POST",
    }),
  fulfillReportOrder: (orderId: string) =>
    request<ReportOrder>(`/api/v1/report-orders/${orderId}/fulfill`, {
      method: "POST",
    }),
  compareListings: (listingIds: string[]) =>
    request<CompareResponse>("/api/v1/compare", {
      method: "POST",
      body: JSON.stringify({ listing_ids: listingIds }),
    }),
  updateSubscription: (plan: SubscriptionPlan) =>
    request<AccountSummary>("/api/v1/me/subscription", {
      method: "PATCH",
      body: JSON.stringify({ plan, status: "active" }),
    }),
  getMapFeatures: (params: MapQuery = {}) =>
    request<MapFeatureCollection>(`/api/v1/map/features${toQueryString(params)}`),
  getListing: (id: string) => request<Listing>(`/api/v1/listings/${id}`),
  getAnalysis: (id: string) => request<ListingAnalysis>(`/api/v1/listings/${id}/analysis`),
  addFavorite: (listingId: string, note?: string) =>
    request<Favorite>(`/api/v1/favorites?owner_id=${OWNER_ID}`, {
      method: "POST",
      body: JSON.stringify({ listing_id: listingId, note }),
    }),
  listFavorites: () => request<Favorite[]>(`/api/v1/favorites?owner_id=${OWNER_ID}`),
  deleteFavorite: (favoriteId: string) =>
    fetch(`${currentApiBaseUrl()}/api/v1/favorites/${favoriteId}?owner_id=${OWNER_ID}`, {
      method: "DELETE",
    }),
  generateReport: (
    listingId: string,
    audience: "buyer" | "realtor" | "investor" = "buyer",
    branding?: ReportBranding,
  ) =>
    request<GeneratedReport>("/api/v1/reports/object/generate", {
      method: "POST",
      body: JSON.stringify({
        listing_id: listingId,
        audience,
        report_format: "html",
        ...(branding ? { branding } : {}),
      }),
    }),
  emailReport: (reportId: string, payload: { target_email?: string; dry_run?: boolean } = {}) =>
    request<ReportEmailResult>(`/api/v1/reports/${reportId}/email`, {
      method: "POST",
      body: JSON.stringify({
        dry_run: payload.dry_run ?? true,
        ...(payload.target_email ? { target_email: payload.target_email } : {}),
      }),
    }),
  listReports: () => request<GeneratedReportListItem[]>("/api/v1/reports"),
  getGeneratedReport: (reportId: string) => request<GeneratedReport>(`/api/v1/reports/${reportId}`),
  listAIInsights: (params: {
    subject_type?: AIInsightSubjectType;
    subject_id?: string;
    insight_type?: AIInsightType;
    limit?: number;
  } = {}) => request<AIInsightListItem[]>(`/api/v1/ai-insights${toQueryString(params)}`),
  getAIInsight: (insightId: string) => request<AIInsight>(`/api/v1/ai-insights/${insightId}`),
  createAlert: (payload: {
    name: string;
    filters: AlertFilters;
    channel?: "email" | "telegram";
    frequency?: "instant" | "daily" | "weekly";
    delivery_target?: string | null;
  }) =>
    request<Alert>(`/api/v1/alerts?owner_id=${OWNER_ID}`, {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        filters: payload.filters,
        channel: payload.channel ?? "email",
        frequency: payload.frequency ?? "daily",
        delivery_target: payload.delivery_target ?? null,
      }),
    }),
  listAlerts: () => request<Alert[]>(`/api/v1/alerts?owner_id=${OWNER_ID}`),
  previewAlert: (alertId: string) =>
    request<AlertPreview>(`/api/v1/alerts/${alertId}/preview?owner_id=${OWNER_ID}`),
  deliverAlert: (alertId: string, dryRun = true, maxMatches = 10) =>
    request<AlertDeliveryJob>(`/api/v1/alerts/${alertId}/deliver?owner_id=${OWNER_ID}`, {
      method: "POST",
      body: JSON.stringify({ dry_run: dryRun, max_matches: maxMatches }),
    }),
  listAlertDeliveryJobs: () =>
    request<AlertDeliveryJob[]>(`/api/v1/alert-delivery-jobs?owner_id=${OWNER_ID}`),
};

export function reportContentUrl(reportId: string) {
  return `${currentApiBaseUrl()}/api/v1/reports/${reportId}/content`;
}

export function reportExportUrl(format: "csv" | "json") {
  return `${currentApiBaseUrl()}/api/v1/reports/export${toQueryString({ format })}`;
}

export function objectReportUrl(listingId: string) {
  return `${currentApiBaseUrl()}/api/v1/reports/object/${listingId}.html`;
}
