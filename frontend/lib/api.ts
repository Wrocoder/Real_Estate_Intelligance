export type Listing = {
  id: string;
  title: string;
  source_name: string;
  source_url: string;
  voivodeship: string | null;
  city: string;
  district: string;
  area_id: string;
  municipality: string;
  address: string;
  market_type: "primary" | "secondary";
  building_type: string | null;
  renovation_state: string | null;
  has_balcony: boolean | null;
  has_terrace: boolean | null;
  has_garden: boolean | null;
  has_elevator: boolean | null;
  parking_type: string | null;
  heating_type: string | null;
  developer_id: string | null;
  developer_name: string | null;
  investment_name: string | null;
  primary_market_project_id: string | null;
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

export type MarketIntelligenceAudience = "bank" | "developer" | "fund";
export type MarketIntelligenceSeverity = "positive" | "neutral" | "watch" | "risk";

export type MarketIntelligenceKpi = {
  code: string;
  label: string;
  value: number | string | null;
  unit: string | null;
  interpretation: string;
};

export type MarketIntelligenceFinding = {
  title: string;
  severity: MarketIntelligenceSeverity;
  detail: string;
  metric_code: string | null;
};

export type MarketIntelligenceReport = {
  audience: MarketIntelligenceAudience;
  city: string | null;
  district: string | null;
  generated_at: string;
  market_scope: string;
  executive_summary: string;
  data_confidence: string;
  kpis: MarketIntelligenceKpi[];
  findings: MarketIntelligenceFinding[];
  opportunities: string[];
  risks: string[];
  recommended_actions: string[];
  area_watchlist: AreaComparisonItem[];
  dashboard: MarketDashboard;
  area_comparison: AreaComparison;
  source_notes: string[];
  disclaimer: string;
};

export type CustomDashboardAudience =
  | "executive"
  | "acquisition"
  | "underwriting"
  | "sales"
  | "portfolio";

export type CustomDashboardWidgetCode =
  | "market_kpis"
  | "area_watchlist"
  | "listing_pipeline"
  | "risk_flags"
  | "developer_ranking"
  | "scoring_distribution"
  | "lead_funnel"
  | "api_usage"
  | "saved_reports"
  | "custom_notes";

export type CustomDashboardWidgetStatus = "ready" | "needs_data" | "planned";

export type CustomDashboardPayload = {
  name: string;
  description?: string | null;
  audience?: CustomDashboardAudience;
  city?: string | null;
  district?: string | null;
  widget_codes?: CustomDashboardWidgetCode[];
  filters?: Record<string, unknown>;
  refresh_interval_minutes?: number;
  is_default?: boolean;
  shared_with_agency_ids?: string[];
  notes?: string | null;
};

export type CustomDashboardUpdatePayload = Partial<CustomDashboardPayload>;

export type CustomDashboardConfig = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  audience: CustomDashboardAudience;
  city: string | null;
  district: string | null;
  widget_codes: CustomDashboardWidgetCode[];
  filters: Record<string, unknown>;
  refresh_interval_minutes: number;
  is_default: boolean;
  shared_with_agency_ids: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomDashboardWidgetSnapshot = {
  widget_code: CustomDashboardWidgetCode;
  title: string;
  status: CustomDashboardWidgetStatus;
  summary: string;
  metrics: Record<string, unknown>;
  actions: string[];
};

export type CustomDashboardPreview = {
  config: CustomDashboardConfig;
  generated_at: string;
  dashboard: MarketDashboard;
  area_comparison: AreaComparison;
  market_intelligence: MarketIntelligenceReport;
  widgets: CustomDashboardWidgetSnapshot[];
  source_notes: string[];
  disclaimer: string;
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

export type PlannedInvestmentImpactItem = {
  investment: PlannedInvestment;
  distance_m: number;
  radius_m: number;
  impact_weight: number;
};

export type FutureImpactRadiusBucket = {
  radius_m: number;
  count: number;
  high_confidence_count: number;
  investment_types: string[];
  statuses: string[];
  nearest_distance_m: number | null;
};

export type ListingFutureImpact = {
  listing_id: string;
  max_radius_m: number;
  radii_m: number[];
  buckets: FutureImpactRadiusBucket[];
  nearest_investments: PlannedInvestmentImpactItem[];
  impact_score: number;
  summary: string;
  growth_signals: string[];
  risk_signals: string[];
  methodology_note: string;
};

export type GrowthFactorCode =
  | "transport"
  | "education"
  | "parks_greenery"
  | "healthcare"
  | "retail_services"
  | "offices_jobs"
  | "universities"
  | "population_jobs_growth";

export type GrowthFactorPosture = "strong" | "moderate" | "weak" | "missing";

export type GrowthAnalysisLabel =
  | "strong_growth"
  | "moderate_growth"
  | "mixed_growth"
  | "weak_growth";

export type ListingGrowthFactor = {
  code: GrowthFactorCode;
  label: string;
  score: number;
  weight: number;
  posture: GrowthFactorPosture;
  evidence: string[];
  recommended_checks: string[];
  data_status: string;
};

export type ListingGrowthAnalysis = {
  listing_id: string;
  growth_score: number;
  growth_label: GrowthAnalysisLabel;
  factors: ListingGrowthFactor[];
  positive_signals: string[];
  drag_signals: string[];
  missing_layers: string[];
  summary: string;
  methodology_note: string;
};

export type ListingRiskFactor = {
  code: string;
  category: string;
  severity: string;
  score: number;
  summary: string;
  evidence: string[];
  recommended_checks: string[];
};

export type ListingRiskProfile = {
  listing_id: string;
  risk_score: number;
  risk_label: PropertyScores["risk_label"];
  overall_severity: string;
  factors: ListingRiskFactor[];
  priority_checks: string[];
  missing_risk_layers: string[];
  methodology_note: string;
};

export type RentalCashflowScenario = {
  code: string;
  label: string;
  monthly_rent_pln: number;
  vacancy_loss_pln: number;
  operating_costs_pln: number;
  mortgage_payment_pln: number;
  net_cashflow_monthly_pln: number;
  annual_net_cashflow_pln: number;
  cash_invested_pln: number;
  gross_yield_pct: number;
  net_yield_on_cash_pct: number;
};

export type ListingRentalEstimate = {
  listing_id: string;
  monthly_rent_low_pln: number;
  monthly_rent_mid_pln: number;
  monthly_rent_high_pln: number;
  rent_per_m2_mid_pln: number;
  gross_yield_pct: number;
  vacancy_rate_pct: number;
  operating_costs_monthly_pln: number;
  net_operating_income_monthly_pln: number;
  confidence_score: number;
  cashflow_scenarios: RentalCashflowScenario[];
  assumptions: string[];
  risk_notes: string[];
  methodology_note: string;
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

export type DeveloperProjectStatus = "completed" | "active" | "planned" | "unknown";

export type DeveloperSignalType =
  | "track_record"
  | "delivery"
  | "technical_quality"
  | "legal"
  | "financial"
  | "transparency"
  | "local_market";

export type DeveloperSignalSeverity = "positive" | "info" | "warning" | "risk";

export type DeveloperReputationLabel =
  | "strong"
  | "good"
  | "mixed"
  | "limited_data"
  | "risk_review";

export type DeveloperAliasType =
  | "brand"
  | "legal_entity"
  | "spv"
  | "project_company"
  | "parent_company"
  | "source_name"
  | "other";

export type DeveloperProfile = {
  id: string;
  name: string;
  legal_name: string | null;
  brand_names: string[];
  krs: string | null;
  nip: string | null;
  regon: string | null;
  website_url: string | null;
  headquarters_city: string | null;
  founded_year: number | null;
  source_names: string[];
  updated_at: string;
};

export type DeveloperProject = {
  id: string;
  developer_id: string;
  name: string;
  city: string;
  district: string | null;
  status: DeveloperProjectStatus;
  units_count: number | null;
  completed_year: number | null;
  source_url: string | null;
};

export type DeveloperQualitySignal = {
  id: string;
  developer_id: string;
  signal_type: DeveloperSignalType;
  severity: DeveloperSignalSeverity;
  title: string;
  summary: string;
  source_name: string;
  source_url: string | null;
  observed_at: string | null;
  confidence_score: number;
};

export type DeveloperAlias = {
  id: string;
  developer_id: string;
  alias: string;
  alias_type: DeveloperAliasType;
  source_name: string;
  source_url: string | null;
  confidence_score: number;
  active: boolean;
};

export type DeveloperSourceCitation = {
  source_name: string;
  source_url: string | null;
  checked_at: string;
  note: string | null;
};

export type DeveloperReputation = {
  developer: DeveloperProfile;
  reputation_score: number;
  confidence_score: number;
  label: DeveloperReputationLabel;
  track_record_score: number;
  delivery_score: number;
  technical_quality_score: number;
  legal_compliance_score: number;
  financial_stability_score: number;
  transparency_score: number;
  local_experience_score: number;
  completed_projects_count: number;
  active_projects_count: number;
  positive_signals: string[];
  risk_signals: string[];
  due_diligence_questions: string[];
  source_citations: DeveloperSourceCitation[];
  aliases: DeveloperAlias[];
  projects: DeveloperProject[];
  quality_signals: DeveloperQualitySignal[];
};

export type DeveloperRankingResponse = {
  items: DeveloperReputation[];
  total: number;
  filters: Record<string, unknown>;
};

export type ReportAudience = "buyer" | "realtor" | "investor";
export type NewsCategory =
  | "market"
  | "mortgage"
  | "tax"
  | "legal"
  | "developer"
  | "city_investment"
  | "transport"
  | "mpzp";
export type NewsImpactLevel = "positive" | "neutral" | "negative" | "mixed" | "unknown";

export type AIQuestionCode =
  | "summary"
  | "price"
  | "negotiation"
  | "risks"
  | "future_plans"
  | "family_fit"
  | "rental_fit"
  | "seller_questions"
  | "documents"
  | "financing";

export type AIQuestionDescriptor = {
  code: AIQuestionCode;
  label: string;
  description: string;
  supported_audiences: ReportAudience[];
};

export type AIAssistantDataContract = {
  prompt_version: string;
  allowed_subjects: Array<"listing" | "user_submitted_draft" | "compare">;
  allowed_inputs: string[];
  prohibited_inputs: string[];
  citation_policy: string;
  privacy_policy: string;
  refusal_policy: string;
  disclaimer: string;
};

export type AIAnswerCitation = {
  source_id: string;
  source_type: string;
  title: string;
  excerpt: string;
};

export type AIAnswerGuardrail = {
  code: string;
  message: string;
};

export type AIListingAnswerRequest = {
  question_code?: AIQuestionCode;
  question?: string | null;
  audience?: ReportAudience;
};

export type AIListingAnswer = {
  subject_type: "listing" | "user_submitted_draft" | "compare";
  subject_id: string;
  listing_id: string;
  audience: ReportAudience;
  question_code: AIQuestionCode;
  question: string | null;
  answer: string;
  key_points: string[];
  citations: AIAnswerCitation[];
  guardrails: AIAnswerGuardrail[];
  refused: boolean;
  refusal_reason: string | null;
  data_contract: AIAssistantDataContract;
  provider: string;
  model_name: string;
  prompt_version: string;
  usage_log_id: string | null;
  input_hash: string;
  disclaimer: string;
};

export type AICompareAnswerRequest = {
  listing_ids: string[];
  question?: string | null;
  audience?: ReportAudience;
};

export type AICompareAnswer = {
  subject_type: "compare";
  subject_id: string;
  listing_ids: string[];
  best_listing_id: string;
  audience: ReportAudience;
  question: string | null;
  answer: string;
  key_points: string[];
  tradeoffs: string[];
  citations: AIAnswerCitation[];
  guardrails: AIAnswerGuardrail[];
  refused: boolean;
  refusal_reason: string | null;
  data_contract: AIAssistantDataContract;
  provider: string;
  model_name: string;
  prompt_version: string;
  usage_log_id: string | null;
  input_hash: string;
  disclaimer: string;
};

export type AreaImpactSummary = {
  subject_type: "area";
  subject_id: string;
  area_id: string;
  name: string;
  city: string;
  posture: string;
  summary: string;
  value_index: number;
  growth_index: number;
  buyer_market_index: number;
  seller_market_index: number;
  liquidity_index: number;
  overheated_index: number;
  positive_signals: string[];
  risk_signals: string[];
  buyer_notes: string[];
  investor_notes: string[];
  citations: AIAnswerCitation[];
  guardrails: AIAnswerGuardrail[];
  provider: string;
  model_name: string;
  prompt_version: string;
  usage_log_id: string | null;
  input_hash: string;
  disclaimer: string;
};

export type NewsArticleListItem = {
  id: string;
  title: string;
  summary: string;
  category: NewsCategory;
  source_name: string;
  source_url: string | null;
  published_at: string;
  affected_area_ids: string[];
  affected_districts: string[];
  price_impact_hypothesis: string | null;
  audience_relevance: ReportAudience[];
  impact_level: NewsImpactLevel;
  tags: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type NewsArticle = NewsArticleListItem & {
  body: string;
};

export type NewsArticlePayload = {
  title: string;
  summary: string;
  body: string;
  category?: NewsCategory;
  source_name: string;
  source_url?: string | null;
  published_at: string;
  affected_area_ids?: string[];
  affected_districts?: string[];
  price_impact_hypothesis?: string | null;
  audience_relevance?: ReportAudience[];
  impact_level?: NewsImpactLevel;
  tags?: string[];
  is_published?: boolean;
};

export type NewsArticleAISummary = {
  subject_type: "news";
  subject_id: string;
  article_id: string;
  category: NewsCategory;
  headline: string;
  summary: string;
  key_points: string[];
  area_impact: string[];
  buyer_notes: string[];
  investor_notes: string[];
  citations: AIAnswerCitation[];
  guardrails: AIAnswerGuardrail[];
  provider: string;
  model_name: string;
  prompt_version: string;
  usage_log_id: string | null;
  input_hash: string;
  disclaimer: string;
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

export type ScoringBacktestSeverity = "healthy" | "watch" | "drift" | "critical";

export type ScoringBacktestErrorBucket = {
  code: string;
  label: string;
  min_error_pct: number;
  max_error_pct: number | null;
  evaluated_points: number;
  share_pct: number;
  mean_absolute_error_pct: number | null;
  overestimate_count: number;
  underestimate_count: number;
};

export type ScoringBacktestDriftSegment = {
  segment_type: "area" | "period";
  key: string;
  label: string;
  evaluated_points: number;
  mean_absolute_error_pct: number | null;
  median_absolute_error_pct: number | null;
  within_10_pct: number | null;
  severity: ScoringBacktestSeverity;
  trend_note: string;
};

export type ScoringBacktestReport = {
  generated_at: string;
  city: string | null;
  district: string | null;
  overall_severity: ScoringBacktestSeverity;
  quality_label: string;
  backtest: ScoringBacktestResult;
  error_buckets: ScoringBacktestErrorBucket[];
  area_drift: ScoringBacktestDriftSegment[];
  period_drift: ScoringBacktestDriftSegment[];
  high_error_examples: ScoringBacktestItem[];
  findings: string[];
  recommendations: string[];
  methodology_note: string;
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
  developer_reputation: DeveloperReputation | null;
  future_area_impact: ListingFutureImpact | null;
  growth_analysis: ListingGrowthAnalysis | null;
  risk_profile: ListingRiskProfile | null;
  rental_estimate: ListingRentalEstimate | null;
  scores: PropertyScores;
  insights: string[];
  negotiation_arguments: string[];
  data_quality_notes: string[];
  disclaimer: string;
};

export type UserSubmittedListingRequest = {
  title?: string | null;
  source_url?: string | null;
  developer_id?: string | null;
  developer_name?: string | null;
  investment_name?: string | null;
  primary_market_project_id?: string | null;
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

export type ScoringServiceAudience =
  | "buyer"
  | "realtor"
  | "investor"
  | "underwriting"
  | "developer";

export type ScoringServiceRequest = {
  external_reference?: string | null;
  title?: string | null;
  developer_id?: string | null;
  developer_name?: string | null;
  investment_name?: string | null;
  primary_market_project_id?: string | null;
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
  audience?: ScoringServiceAudience;
};

export type ScoringServiceValuation = {
  asking_price: number;
  price_per_m2: number;
  fair_price_low: number;
  fair_price_mid: number;
  fair_price_high: number;
  fair_price_confidence_score: number;
  price_delta_to_fair_mid_pct: number;
};

export type ScoringServiceComparable = {
  listing_id: string;
  title: string;
  address: string;
  city: string;
  district: string;
  market_type: "primary" | "secondary";
  price: number;
  area_m2: number;
  rooms: number;
  price_per_m2: number;
  floor: number | null;
  building_floors: number | null;
  building_year: number | null;
  price_delta_to_subject_pct: number;
  price_per_m2_delta_to_subject_pct: number;
};

export type ScoringServiceResult = {
  request_id: string;
  generated_at: string;
  audience: ScoringServiceAudience;
  persisted: boolean;
  input: ScoringServiceRequest;
  confidence_score: number;
  scores: PropertyScores;
  valuation: ScoringServiceValuation;
  area_statistics: AreaStatistics;
  developer_reputation: DeveloperReputation | null;
  comparables: ScoringServiceComparable[];
  decision_summary: string;
  key_findings: string[];
  risk_flags: string[];
  recommended_actions: string[];
  data_quality_notes: string[];
  methodology_notes: string[];
  disclaimer: string;
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
  developer_name: string | null;
  investment_name: string | null;
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
  developer_id: string | null;
  developer_name: string | null;
  investment_name: string | null;
  primary_market_project_id: string | null;
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
  logo_url?: string | null;
  primary_color?: string | null;
  accent_color?: string | null;
  footer_text?: string | null;
  agency_disclaimer?: string | null;
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
export type AIInsightSubjectType =
  | "listing"
  | "user_submitted_draft"
  | "area"
  | "report"
  | "compare"
  | "news";
export type AIInsightType =
  | "report_summary"
  | "object_explanation"
  | "area_summary"
  | "news_summary"
  | "assistant_answer";

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
export type AdminAuditLogStatus = "succeeded" | "failed" | "blocked";
export type DataDeletionRequestStatus = "open" | "processed" | "rejected";
export type DataDeletionTargetType =
  | "raw_listing"
  | "user_submitted_draft"
  | "generated_report"
  | "source_reference"
  | "other";
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
  | "developer_reputation_score_desc"
  | "developer_reputation_score_asc"
  | "developer_confidence_score_desc"
  | "developer_confidence_score_asc"
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

export type AgencyMemberRole = "owner" | "admin" | "agent";
export type AgencyMembershipStatus = "active" | "invited" | "disabled";

export type AgencyWorkspacePayload = {
  name: string;
  billing_email?: string | null;
  website_url?: string | null;
  city?: string | null;
};

export type AgencyMemberPayload = {
  user_id: string;
  email?: string | null;
  display_name?: string | null;
  role?: AgencyMemberRole;
  status?: AgencyMembershipStatus;
};

export type AgencyMemberUpdatePayload = {
  email?: string | null;
  display_name?: string | null;
  role?: AgencyMemberRole;
  status?: AgencyMembershipStatus;
};

export type AgencyMembership = {
  id: string;
  agency_id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  role: AgencyMemberRole;
  status: AgencyMembershipStatus;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AgencyWorkspaceSummary = {
  id: string;
  name: string;
  owner_id: string;
  billing_email: string | null;
  website_url: string | null;
  city: string | null;
  current_user_role: AgencyMemberRole;
  current_user_status: AgencyMembershipStatus;
  members_count: number;
  created_at: string;
  updated_at: string;
};

export type AgencyWorkspace = AgencyWorkspaceSummary & {
  members: AgencyMembership[];
};

export type CrmClientStatus = "active" | "paused" | "won" | "lost" | "archived";
export type CrmNoteVisibility = "internal" | "client_shareable";
export type CrmShortlistStatus = "draft" | "shared" | "accepted" | "rejected" | "archived";

export type CrmClientPayload = {
  display_name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  district?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  preferred_rooms?: number[];
  status?: CrmClientStatus;
  tags?: string[];
  consent_to_contact?: boolean;
  profile_notes?: string | null;
  metadata?: Record<string, unknown>;
};

export type CrmClientUpdatePayload = Partial<CrmClientPayload>;

export type CrmClient = {
  id: string;
  agency_id: string;
  owner_id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  district: string | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_rooms: number[];
  status: CrmClientStatus;
  tags: string[];
  consent_to_contact: boolean;
  profile_notes: string | null;
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CrmNotePayload = {
  body: string;
  visibility?: CrmNoteVisibility;
  pinned?: boolean;
  metadata?: Record<string, unknown>;
};

export type CrmNoteUpdatePayload = Partial<CrmNotePayload>;

export type CrmNote = {
  id: string;
  agency_id: string;
  client_id: string;
  author_id: string;
  body: string;
  visibility: CrmNoteVisibility;
  pinned: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CrmShortlistPayload = {
  title: string;
  listing_ids: string[];
  report_ids?: string[];
  client_message?: string | null;
  status?: CrmShortlistStatus;
  share_enabled?: boolean;
  expires_in_days?: number | null;
  metadata?: Record<string, unknown>;
};

export type CrmShortlistUpdatePayload = Partial<CrmShortlistPayload>;

export type CrmShortlistItem = {
  listing_id: string;
  rank: number;
  title: string;
  address: string;
  district: string;
  city: string;
  price: number;
  currency: string;
  area_m2: number;
  rooms: number;
  floor: number | null;
  building_floors: number | null;
  building_year: number | null;
  market_type: "primary" | "secondary";
  developer_id: string | null;
  developer_name: string | null;
  investment_name: string | null;
  developer_reputation_score: number | null;
  developer_reputation_label:
    | "strong"
    | "good"
    | "mixed"
    | "limited_data"
    | "risk_review"
    | null;
  decision_score: number;
  decision_label: PropertyScores["decision_label"];
  investment_score: number;
  risk_score: number;
  negotiation_score: number;
  liquidity_score: number;
  rental_potential_score: number;
  fair_price_mid_pln: number;
  price_delta_to_fair_mid_pct: number;
  recommendation: string;
  talking_points: string[];
  cautions: string[];
};

export type CrmShortlist = {
  id: string;
  agency_id: string;
  client_id: string;
  owner_id: string;
  title: string;
  listing_ids: string[];
  report_ids: string[];
  items: CrmShortlistItem[];
  client_message: string | null;
  status: CrmShortlistStatus;
  share_enabled: boolean;
  share_token: string | null;
  share_url: string | null;
  expires_at: string | null;
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CrmClientDetail = CrmClient & {
  notes: CrmNote[];
  shortlists: CrmShortlist[];
};

export type CrmSharePreview = {
  share_token: string | null;
  share_url: string | null;
  title: string;
  client_display_name: string | null;
  client_message: string | null;
  items: CrmShortlistItem[];
  client_shareable_notes: string[];
  generated_at: string;
  expires_at: string | null;
  disclaimer: string;
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

export type PartnerReferralType =
  | "mortgage"
  | "legal"
  | "renovation"
  | "buyer_beta"
  | "realtor_beta";
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

export type PartnerLeadPriority = "hot" | "warm" | "nurture" | "low_fit" | "disqualified";
export type PartnerLeadFit = "mortgage" | "legal" | "renovation" | "beta_sales" | "general";

export type PartnerLeadScoreComponent = {
  code: string;
  label: string;
  score: number;
  weight: number;
  weighted_score: number;
  reason: string;
};

export type PartnerLeadScore = {
  referral: PartnerReferral;
  generated_at: string;
  total_score: number;
  priority: PartnerLeadPriority;
  partner_fit: PartnerLeadFit;
  qualification_status: string;
  estimated_deal_value_pln: number | null;
  next_action_due_hours: number;
  routing_tags: string[];
  reasons: string[];
  risks: string[];
  recommended_actions: string[];
  components: PartnerLeadScoreComponent[];
  disclaimer: string;
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
  voivodeship?: string;
  city?: string;
  district?: string;
  municipality?: string;
  query?: string;
  rooms?: number;
  market_type?: "primary" | "secondary";
  min_price?: number;
  max_price?: number;
  min_price_per_m2?: number;
  max_price_per_m2?: number;
  min_area_m2?: number;
  max_area_m2?: number;
  building_type?: string;
  renovation_state?: string;
  has_balcony?: boolean;
  has_terrace?: boolean;
  has_garden?: boolean;
  has_elevator?: boolean;
  parking_type?: string;
  heating_type?: string;
  min_floor?: number;
  max_floor?: number;
  max_building_floors?: number;
  min_building_year?: number;
  max_building_year?: number;
  max_days_on_market?: number;
  max_distance_to_center_km?: number;
  max_nearest_stop_m?: number;
  max_nearest_school_m?: number;
  min_nearest_major_road_m?: number;
  min_nearest_industrial_zone_m?: number;
  min_investment_score?: number;
  max_risk_score?: number;
  min_negotiation_score?: number;
  min_liquidity_score?: number;
  min_rental_potential_score?: number;
  min_data_quality_score?: number;
  min_developer_reputation_score?: number;
  min_developer_confidence_score?: number;
  min_developer_completed_projects?: number;
  min_developer_active_projects?: number;
  require_developer_reputation?: boolean;
  exclude_developer_risk_signals?: boolean;
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

export type HiddenGemQuery = {
  voivodeship?: string;
  city?: string;
  district?: string;
  municipality?: string;
  query?: string;
  rooms?: number;
  market_type?: "primary" | "secondary";
  max_price?: number;
  min_area_m2?: number;
  building_type?: string;
  renovation_state?: string;
  has_balcony?: boolean;
  has_terrace?: boolean;
  has_garden?: boolean;
  has_elevator?: boolean;
  parking_type?: string;
  heating_type?: string;
  min_floor?: number;
  max_floor?: number;
  max_building_floors?: number;
  min_building_year?: number;
  max_building_year?: number;
  max_distance_to_center_km?: number;
  max_nearest_stop_m?: number;
  max_nearest_school_m?: number;
  min_nearest_major_road_m?: number;
  min_nearest_industrial_zone_m?: number;
  max_price_delta_to_fair_mid_pct?: number;
  min_investment_score?: number;
  max_risk_score?: number;
  min_liquidity_score?: number;
  min_rental_potential_score?: number;
  min_data_quality_score?: number;
  min_developer_reputation_score?: number;
  min_developer_confidence_score?: number;
  min_developer_completed_projects?: number;
  min_developer_active_projects?: number;
  require_developer_reputation?: boolean;
  exclude_developer_risk_signals?: boolean;
  page?: number;
  page_size?: number;
};

export type HiddenGemItem = {
  analysis: ListingAnalysis;
  gem_score: number;
  price_delta_to_fair_mid_pct: number;
  estimated_discount_to_fair_mid_pln: number;
  signals: string[];
};

export type HiddenGemsResponse = {
  items: HiddenGemItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  filters: Record<string, unknown>;
};

export type CompareMortgageAssumptions = {
  down_payment_pct: number;
  loan_years: number;
  annual_interest_rate_pct: number;
  rate_type: "fixed" | "variable";
};

export type CompareItemMetrics = {
  listing_id: string;
  rank: number;
  decision_score: number;
  decision_label: PropertyScores["decision_label"];
  price_label: PropertyScores["price_label"];
  risk_label: PropertyScores["risk_label"];
  liquidity_label: PropertyScores["liquidity_label"];
  rental_potential_label: PropertyScores["rental_potential_label"];
  investment_score: number;
  risk_score: number;
  negotiation_score: number;
  liquidity_score: number;
  rental_potential_score: number;
  price_per_m2_pln: number;
  fair_price_mid_pln: number;
  price_delta_to_fair_mid_pct: number;
  fair_price_gap_pln: number;
  estimated_discount_to_fair_mid_pln: number;
  down_payment_pln: number;
  loan_amount_pln: number;
  estimated_monthly_payment_pln: number;
  estimated_monthly_payment_per_m2_pln: number;
  upfront_cash_needed_pln: number;
  estimated_gross_rental_yield_pct: number;
  estimated_monthly_rent_pln: number;
  recommendation: string;
  reasons: string[];
  warnings: string[];
};

export type CompareSummary = {
  best_listing_id: string;
  best_value_listing_id: string;
  lowest_monthly_payment_listing_id: string;
  strongest_liquidity_listing_id: string;
  strongest_rental_listing_id: string;
  riskiest_listing_id: string;
  average_price_per_m2: number;
  average_estimated_monthly_payment_pln: number;
  average_liquidity_score: number;
  average_rental_potential_score: number;
  notes: string[];
};

export type RealtorClientShortlistRequest = {
  listing_ids: string[];
  client_name?: string | null;
  intro?: string | null;
  include_source_links?: boolean;
};

export type RealtorClientShortlistItem = {
  listing_id: string;
  rank: number;
  title: string;
  address: string;
  district: string;
  city: string;
  price: number;
  currency: string;
  area_m2: number;
  rooms: number;
  decision_score: number;
  decision_label: PropertyScores["decision_label"];
  fair_price_mid: number;
  price_delta_to_fair_mid_pct: number;
  estimated_monthly_payment_pln: number;
  upfront_cash_needed_pln: number;
  estimated_monthly_rent_pln: number;
  estimated_gross_rental_yield_pct: number;
  recommendation: string;
  client_pitch: string;
  talking_points: string[];
  cautions: string[];
  source_url: string | null;
};

export type RealtorClientShortlist = {
  client_name: string | null;
  agent_name: string | null;
  agent_email: string | null;
  subject: string;
  summary: string;
  client_message: string;
  items: RealtorClientShortlistItem[];
  comparison_summary: CompareSummary;
  mortgage_assumptions: CompareMortgageAssumptions;
  generated_at: string;
  disclaimer: string;
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
  raw_payload_retention_days: number | null;
  private_url_retention_days: number | null;
  retention_notes: string | null;
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
  raw_payload_retention_days?: number | null;
  private_url_retention_days?: number | null;
  retention_notes?: string | null;
  is_active?: boolean;
};

export type SourceRetentionPruneResult = {
  dry_run: boolean;
  source_name: string | null;
  sources_checked: number;
  raw_listings_seen: number;
  raw_payloads_pruned: number;
  item_ids: string[];
  cutoff_by_source: Record<string, string>;
};

export type AdminAuditLog = {
  id: string;
  action_type: string;
  actor_id: string;
  actor_role: string;
  resource_type: string;
  resource_id: string | null;
  status: AdminAuditLogStatus;
  message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type DataDeletionRequest = {
  id: string;
  target_type: DataDeletionTargetType;
  target_id: string;
  target_owner_id: string | null;
  source_name: string | null;
  source_url_hash: string | null;
  status: DataDeletionRequestStatus;
  requested_by: string;
  processed_by: string | null;
  reason: string | null;
  request_payload: Record<string, unknown>;
  result_payload: Record<string, unknown>;
  action_summary: string | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
};

export type DataDeletionRequestPayload = {
  target_type: DataDeletionTargetType;
  target_id: string;
  target_owner_id?: string | null;
  source_name?: string | null;
  source_url_hash?: string | null;
  requested_by?: string | null;
  reason?: string | null;
  request_payload?: Record<string, unknown>;
};

export type DataDeletionRequestProcessPayload = {
  status?: Exclude<DataDeletionRequestStatus, "open">;
  action_summary: string;
  result_payload?: Record<string, unknown>;
  execute_target_deletion?: boolean;
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

export type PropertyDeduplicationMatchUpdate = {
  review_status: PropertyDeduplicationReviewStatus;
};

export type CompareResponse = {
  items: ListingAnalysis[];
  metrics: CompareItemMetrics[];
  summary: CompareSummary;
  mortgage_assumptions: CompareMortgageAssumptions;
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

export type ReportOrderBillingDetails = {
  invoice_requested: boolean;
  customer_type: "individual" | "company";
  company_name?: string | null;
  vat_id?: string | null;
  country_code: string;
  street_address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  email?: string | null;
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
  billing_details: ReportOrderBillingDetails | null;
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
  voivodeship?: string | null;
  city?: string | null;
  district?: string | null;
  municipality?: string | null;
  building_type?: string | null;
  renovation_state?: string | null;
  has_balcony?: boolean | null;
  has_terrace?: boolean | null;
  has_garden?: boolean | null;
  has_elevator?: boolean | null;
  parking_type?: string | null;
  heating_type?: string | null;
  query?: string | null;
  rooms?: number | null;
  max_price?: number | null;
  min_area_m2?: number | null;
  min_floor?: number | null;
  max_floor?: number | null;
  max_building_floors?: number | null;
  min_building_year?: number | null;
  max_building_year?: number | null;
  min_investment_score?: number | null;
  max_risk_score?: number | null;
  max_price_delta_to_fair_mid_pct?: number | null;
  min_negotiation_score?: number | null;
  min_liquidity_score?: number | null;
  min_rental_potential_score?: number | null;
  min_price_reductions?: number | null;
  max_days_on_market?: number | null;
};

export type AlertChannel = "email" | "telegram";
export type AlertFrequency = "instant" | "daily" | "weekly";

export type Alert = {
  id: string;
  owner_id: string;
  name: string;
  filters: AlertFilters;
  channel: AlertChannel;
  frequency: AlertFrequency;
  delivery_target: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AlertUpdate = {
  name?: string;
  filters?: AlertFilters;
  channel?: AlertChannel;
  frequency?: AlertFrequency;
  delivery_target?: string | null;
  is_active?: boolean;
};

export type AlertPreview = {
  alert: Alert;
  matches: ListingAnalysis[];
  total_matches: number;
  applied_filters: Record<string, unknown>;
};

export type RealtorSavedSearchDigestRequest = {
  client_name?: string | null;
  intro?: string | null;
  max_matches?: number;
  include_source_links?: boolean;
};

export type RealtorSavedSearchDigestItem = {
  listing_id: string;
  title: string;
  address: string;
  district: string;
  city: string;
  price: number;
  currency: string;
  area_m2: number;
  rooms: number;
  floor: number | null;
  price_per_m2: number;
  fair_price_mid: number;
  price_delta_to_fair_mid_pct: number;
  decision_label: PropertyScores["decision_label"];
  negotiation_score: number;
  liquidity_score: number;
  rental_potential_score: number;
  client_pitch: string;
  talking_points: string[];
  cautions: string[];
  source_url: string | null;
};

export type RealtorSavedSearchDigest = {
  alert: Alert;
  client_name: string | null;
  agent_name: string | null;
  agent_email: string | null;
  subject: string;
  summary: string;
  client_message: string;
  total_matches: number;
  items: RealtorSavedSearchDigestItem[];
  applied_filters: Record<string, unknown>;
  generated_at: string;
  disclaimer: string;
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

export type MapFeatureType =
  | "listing"
  | "planned_investment"
  | "transport_route"
  | "transport_stop"
  | "school"
  | "kindergarten"
  | "amenity"
  | "industrial_zone"
  | "district_boundary"
  | "municipality_boundary"
  | "voivodeship_boundary"
  | "mpzp_plan_zone"
  | "studium_policy_zone"
  | "future_tram_line"
  | "future_bus_route"
  | "future_road_corridor"
  | "industrial_risk_zone"
  | "major_road_noise_zone"
  | "rail_noise_review_zone"
  | "airport_noise_review_zone"
  | "flood_risk_review_zone"
  | "pollution_review_zone";

export type MapFeatureProperties = {
  feature_type: MapFeatureType;
  [key: string]: string | number | boolean | null;
};

export type MapFeature = {
  type: "Feature";
  id: string;
  geometry:
    | {
        type: "Point";
        coordinates: [number, number];
      }
    | {
        type: "Polygon";
        coordinates: [number, number][][];
      }
    | {
        type: "LineString";
        coordinates: [number, number][];
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
    infrastructure_count?: number;
    infrastructure_counts?: Record<string, number>;
    administrative_layer_count?: number;
    administrative_counts?: Record<string, number>;
    planning_layer_count?: number;
    planning_counts?: Record<string, number>;
    future_transport_layer_count?: number;
    future_transport_counts?: Record<string, number>;
    risk_layer_count?: number;
    risk_counts?: Record<string, number>;
    skipped_listings?: number;
    filters?: Record<string, unknown>;
    [key: string]: unknown;
  };
};

export type MapQuery = {
  voivodeship?: string;
  city?: string;
  district?: string;
  municipality?: string;
  rooms?: number;
  max_price?: number;
  min_area_m2?: number;
  building_type?: string;
  renovation_state?: string;
  has_balcony?: boolean;
  has_terrace?: boolean;
  has_garden?: boolean;
  has_elevator?: boolean;
  parking_type?: string;
  heating_type?: string;
  min_floor?: number;
  max_floor?: number;
  max_building_floors?: number;
  min_building_year?: number;
  max_building_year?: number;
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
  listHiddenGems: (params: HiddenGemQuery = {}) =>
    request<HiddenGemsResponse>(`/api/v1/listings/hidden-gems${toQueryString(params)}`),
  listAreas: () => request<AreaStatistics[]>("/api/v1/areas"),
  compareAreas: (params: { city?: string; sort?: string; limit?: number } = {}) =>
    request<AreaComparison>(`/api/v1/areas/compare${toQueryString(params)}`),
  listNews: (params: { category?: NewsCategory; area_id?: string; limit?: number } = {}) =>
    request<NewsArticleListItem[]>(`/api/v1/news${toQueryString(params)}`),
  getNewsArticle: (articleId: string) =>
    request<NewsArticle>(`/api/v1/news/${encodeURIComponent(articleId)}`),
  createAdminNewsArticle: (payload: NewsArticlePayload) =>
    request<NewsArticle>("/api/v1/admin/news/articles", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listDevelopers: (params: {
    city?: string;
    min_reputation_score?: number;
    min_confidence_score?: number;
    limit?: number;
  } = {}) =>
    request<DeveloperRankingResponse>(`/api/v1/developers${toQueryString(params)}`),
  getDeveloper: (developerId: string) =>
    request<DeveloperReputation>(`/api/v1/developers/${encodeURIComponent(developerId)}`),
  getListingDeveloper: (listingId: string) =>
    request<DeveloperReputation>(
      `/api/v1/listings/${encodeURIComponent(listingId)}/developer`,
    ),
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
  getMarketIntelligenceReport: (params: {
    audience?: MarketIntelligenceAudience;
    city?: string;
    district?: string;
    area_limit?: number;
  } = {}) =>
    request<MarketIntelligenceReport>(
      `/api/v1/market/intelligence-report${toQueryString(params)}`,
    ),
  evaluateScoringServiceListing: (payload: ScoringServiceRequest) =>
    request<ScoringServiceResult>("/api/v1/scoring/evaluate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listCustomDashboards: (params: { limit?: number } = {}) =>
    request<CustomDashboardConfig[]>(
      `/api/v1/enterprise/custom-dashboards${toQueryString(params)}`,
    ),
  createCustomDashboard: (payload: CustomDashboardPayload) =>
    request<CustomDashboardConfig>("/api/v1/enterprise/custom-dashboards", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getCustomDashboard: (dashboardId: string) =>
    request<CustomDashboardConfig>(
      `/api/v1/enterprise/custom-dashboards/${encodeURIComponent(dashboardId)}`,
    ),
  updateCustomDashboard: (
    dashboardId: string,
    payload: CustomDashboardUpdatePayload,
  ) =>
    request<CustomDashboardConfig>(
      `/api/v1/enterprise/custom-dashboards/${encodeURIComponent(dashboardId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    ),
  deleteCustomDashboard: async (dashboardId: string) => {
    const response = await fetch(
      `${currentApiBaseUrl()}/api/v1/enterprise/custom-dashboards/${encodeURIComponent(
        dashboardId,
      )}`,
      {
        method: "DELETE",
        cache: "no-store",
      },
    );
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`API ${response.status}: ${body}`);
    }
  },
  previewCustomDashboard: (dashboardId: string) =>
    request<CustomDashboardPreview>(
      `/api/v1/enterprise/custom-dashboards/${encodeURIComponent(dashboardId)}/preview`,
      { method: "POST" },
    ),
  getMe: () => request<AccountSummary>("/api/v1/me"),
  listPlans: () => request<PlanLimits[]>("/api/v1/plans"),
  listAgencies: (params: { limit?: number } = {}) =>
    request<AgencyWorkspaceSummary[]>(`/api/v1/agencies${toQueryString(params)}`),
  createAgency: (payload: AgencyWorkspacePayload) =>
    request<AgencyWorkspace>("/api/v1/agencies", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getAgency: (agencyId: string) =>
    request<AgencyWorkspace>(`/api/v1/agencies/${encodeURIComponent(agencyId)}`),
  updateAgency: (agencyId: string, payload: Partial<AgencyWorkspacePayload>) =>
    request<AgencyWorkspace>(`/api/v1/agencies/${encodeURIComponent(agencyId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  addAgencyMember: (agencyId: string, payload: AgencyMemberPayload) =>
    request<AgencyMembership>(`/api/v1/agencies/${encodeURIComponent(agencyId)}/members`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAgencyMember: (
    agencyId: string,
    membershipId: string,
    payload: AgencyMemberUpdatePayload,
  ) =>
    request<AgencyMembership>(
      `/api/v1/agencies/${encodeURIComponent(agencyId)}/members/${encodeURIComponent(membershipId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    ),
  removeAgencyMember: async (agencyId: string, membershipId: string) => {
    const response = await fetch(
      `${currentApiBaseUrl()}/api/v1/agencies/${encodeURIComponent(
        agencyId,
      )}/members/${encodeURIComponent(membershipId)}`,
      {
        method: "DELETE",
        cache: "no-store",
      },
    );
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`API ${response.status}: ${body}`);
    }
  },
  listAgencyCrmClients: (
    agencyId: string,
    params: { status?: CrmClientStatus; query?: string; limit?: number } = {},
  ) =>
    request<CrmClient[]>(
      `/api/v1/agencies/${encodeURIComponent(agencyId)}/crm/clients${toQueryString(params)}`,
    ),
  createAgencyCrmClient: (agencyId: string, payload: CrmClientPayload) =>
    request<CrmClient>(`/api/v1/agencies/${encodeURIComponent(agencyId)}/crm/clients`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getAgencyCrmClient: (agencyId: string, clientId: string) =>
    request<CrmClientDetail>(
      `/api/v1/agencies/${encodeURIComponent(agencyId)}/crm/clients/${encodeURIComponent(
        clientId,
      )}`,
    ),
  updateAgencyCrmClient: (
    agencyId: string,
    clientId: string,
    payload: CrmClientUpdatePayload,
  ) =>
    request<CrmClient>(
      `/api/v1/agencies/${encodeURIComponent(agencyId)}/crm/clients/${encodeURIComponent(
        clientId,
      )}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    ),
  listAgencyCrmNotes: (
    agencyId: string,
    clientId: string,
    params: { limit?: number } = {},
  ) =>
    request<CrmNote[]>(
      `/api/v1/agencies/${encodeURIComponent(agencyId)}/crm/clients/${encodeURIComponent(
        clientId,
      )}/notes${toQueryString(params)}`,
    ),
  createAgencyCrmNote: (agencyId: string, clientId: string, payload: CrmNotePayload) =>
    request<CrmNote>(
      `/api/v1/agencies/${encodeURIComponent(agencyId)}/crm/clients/${encodeURIComponent(
        clientId,
      )}/notes`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
  updateAgencyCrmNote: (
    agencyId: string,
    clientId: string,
    noteId: string,
    payload: CrmNoteUpdatePayload,
  ) =>
    request<CrmNote>(
      `/api/v1/agencies/${encodeURIComponent(agencyId)}/crm/clients/${encodeURIComponent(
        clientId,
      )}/notes/${encodeURIComponent(noteId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    ),
  deleteAgencyCrmNote: async (agencyId: string, clientId: string, noteId: string) => {
    const response = await fetch(
      `${currentApiBaseUrl()}/api/v1/agencies/${encodeURIComponent(
        agencyId,
      )}/crm/clients/${encodeURIComponent(clientId)}/notes/${encodeURIComponent(noteId)}`,
      {
        method: "DELETE",
        cache: "no-store",
      },
    );
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`API ${response.status}: ${body}`);
    }
  },
  listAgencyCrmShortlists: (
    agencyId: string,
    clientId: string,
    params: { limit?: number } = {},
  ) =>
    request<CrmShortlist[]>(
      `/api/v1/agencies/${encodeURIComponent(agencyId)}/crm/clients/${encodeURIComponent(
        clientId,
      )}/shortlists${toQueryString(params)}`,
    ),
  createAgencyCrmShortlist: (
    agencyId: string,
    clientId: string,
    payload: CrmShortlistPayload,
  ) =>
    request<CrmShortlist>(
      `/api/v1/agencies/${encodeURIComponent(agencyId)}/crm/clients/${encodeURIComponent(
        clientId,
      )}/shortlists`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
  getAgencyCrmShortlist: (agencyId: string, clientId: string, shortlistId: string) =>
    request<CrmShortlist>(
      `/api/v1/agencies/${encodeURIComponent(agencyId)}/crm/clients/${encodeURIComponent(
        clientId,
      )}/shortlists/${encodeURIComponent(shortlistId)}`,
    ),
  updateAgencyCrmShortlist: (
    agencyId: string,
    clientId: string,
    shortlistId: string,
    payload: CrmShortlistUpdatePayload,
  ) =>
    request<CrmShortlist>(
      `/api/v1/agencies/${encodeURIComponent(agencyId)}/crm/clients/${encodeURIComponent(
        clientId,
      )}/shortlists/${encodeURIComponent(shortlistId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    ),
  deleteAgencyCrmShortlist: async (
    agencyId: string,
    clientId: string,
    shortlistId: string,
  ) => {
    const response = await fetch(
      `${currentApiBaseUrl()}/api/v1/agencies/${encodeURIComponent(
        agencyId,
      )}/crm/clients/${encodeURIComponent(clientId)}/shortlists/${encodeURIComponent(
        shortlistId,
      )}`,
      {
        method: "DELETE",
        cache: "no-store",
      },
    );
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`API ${response.status}: ${body}`);
    }
  },
  previewAgencyCrmShortlistShare: (
    agencyId: string,
    clientId: string,
    shortlistId: string,
  ) =>
    request<CrmSharePreview>(
      `/api/v1/agencies/${encodeURIComponent(agencyId)}/crm/clients/${encodeURIComponent(
        clientId,
      )}/shortlists/${encodeURIComponent(shortlistId)}/share-preview`,
      { method: "POST" },
    ),
  getPublicCrmSharedShortlist: (shareToken: string) =>
    request<CrmSharePreview>(
      `/api/v1/crm/shared-shortlists/${encodeURIComponent(shareToken)}`,
    ),
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
  listAdminPartnerLeadScores: (params: {
    status?: PartnerReferralStatus;
    referral_type?: PartnerReferralType;
    min_score?: number;
    limit?: number;
  } = {}) =>
    request<PartnerLeadScore[]>(
      `/api/v1/admin/partner-referrals/lead-scores${toQueryString(params)}`,
      { headers: ADMIN_HEADERS },
    ),
  getAdminPartnerLeadScore: (referralId: string) =>
    request<PartnerLeadScore>(
      `/api/v1/admin/partner-referrals/${encodeURIComponent(referralId)}/lead-score`,
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
  pruneAdminRetainedRawPayloads: (params: {
    dry_run?: boolean;
    source_name?: string;
    limit?: number;
  } = {}) =>
    request<SourceRetentionPruneResult>(
      `/api/v1/admin/ingestion/sources/prune-retained-raw-payloads${toQueryString(params)}`,
      { method: "POST", headers: ADMIN_HEADERS },
    ),
  listAdminAuditLogs: (params: {
    action_type?: string;
    actor_id?: string;
    resource_type?: string;
    status?: AdminAuditLogStatus;
    limit?: number;
  } = {}) =>
    request<AdminAuditLog[]>(`/api/v1/admin/audit-logs${toQueryString(params)}`, {
      headers: ADMIN_HEADERS,
    }),
  listAdminDataDeletionRequests: (params: {
    status?: DataDeletionRequestStatus;
    target_type?: DataDeletionTargetType;
    limit?: number;
  } = {}) =>
    request<DataDeletionRequest[]>(
      `/api/v1/admin/data-deletion-requests${toQueryString(params)}`,
      { headers: ADMIN_HEADERS },
    ),
  createAdminDataDeletionRequest: (payload: DataDeletionRequestPayload) =>
    request<DataDeletionRequest>("/api/v1/admin/data-deletion-requests", {
      method: "POST",
      headers: ADMIN_HEADERS,
      body: JSON.stringify(payload),
    }),
  processAdminDataDeletionRequest: (
    requestId: string,
    payload: DataDeletionRequestProcessPayload,
  ) =>
    request<DataDeletionRequest>(`/api/v1/admin/data-deletion-requests/${requestId}/process`, {
      method: "POST",
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
  getAdminScoringBacktestReport: (params: {
    city?: string;
    district?: string;
    limit?: number;
  } = {}) =>
    request<ScoringBacktestReport>(
      `/api/v1/admin/scoring/backtest-report${toQueryString(params)}`,
      { headers: ADMIN_HEADERS },
    ),
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
  updateAdminDeduplicationMatch: (
    matchId: number,
    payload: PropertyDeduplicationMatchUpdate,
  ) =>
    request<PropertyDeduplicationMatch>(`/api/v1/admin/deduplication/matches/${matchId}`, {
      method: "PATCH",
      headers: ADMIN_HEADERS,
      body: JSON.stringify(payload),
    }),
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
    billing_details?: ReportOrderBillingDetails | null;
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
  buildRealtorClientShortlist: (payload: RealtorClientShortlistRequest) =>
    request<RealtorClientShortlist>("/api/v1/realtor/client-shortlists/preview", {
      method: "POST",
      body: JSON.stringify({
        listing_ids: payload.listing_ids,
        client_name: payload.client_name || null,
        intro: payload.intro || null,
        include_source_links: payload.include_source_links ?? false,
      }),
    }),
  answerCompareAIQuestion: (payload: AICompareAnswerRequest) =>
    request<AICompareAnswer>("/api/v1/ai/compare/answer", {
      method: "POST",
      body: JSON.stringify(payload),
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
  getListingFutureImpact: (id: string) =>
    request<ListingFutureImpact>(`/api/v1/listings/${encodeURIComponent(id)}/future-impact`),
  getListingGrowthAnalysis: (id: string) =>
    request<ListingGrowthAnalysis>(
      `/api/v1/listings/${encodeURIComponent(id)}/growth-analysis`,
    ),
  getListingRiskProfile: (id: string) =>
    request<ListingRiskProfile>(`/api/v1/listings/${encodeURIComponent(id)}/risk-profile`),
  getListingRentalEstimate: (id: string) =>
    request<ListingRentalEstimate>(
      `/api/v1/listings/${encodeURIComponent(id)}/rental-estimate`,
    ),
  getAIDataContract: () => request<AIAssistantDataContract>("/api/v1/ai/data-contract"),
  listAIQuestions: () => request<AIQuestionDescriptor[]>("/api/v1/ai/questions"),
  summarizeAreaImpact: (areaId: string) =>
    request<AreaImpactSummary>(
      `/api/v1/ai/areas/${encodeURIComponent(areaId)}/summary`,
      {
        method: "POST",
      },
    ),
  summarizeNewsArticle: (articleId: string) =>
    request<NewsArticleAISummary>(
      `/api/v1/ai/news/${encodeURIComponent(articleId)}/summary`,
      {
        method: "POST",
      },
    ),
  answerListingAIQuestion: (listingId: string, payload: AIListingAnswerRequest) =>
    request<AIListingAnswer>(
      `/api/v1/ai/listings/${encodeURIComponent(listingId)}/answer`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
  answerUserSubmittedDraftAIQuestion: (
    draftId: string,
    payload: AIListingAnswerRequest,
  ) =>
    request<AIListingAnswer>(
      `/api/v1/ai/user-submitted-listing-drafts/${encodeURIComponent(draftId)}/answer`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
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
    channel?: AlertChannel;
    frequency?: AlertFrequency;
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
  updateAlert: (alertId: string, payload: AlertUpdate) =>
    request<Alert>(`/api/v1/alerts/${encodeURIComponent(alertId)}?owner_id=${OWNER_ID}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteAlert: async (alertId: string) => {
    const response = await fetch(
      `${currentApiBaseUrl()}/api/v1/alerts/${encodeURIComponent(alertId)}?owner_id=${OWNER_ID}`,
      {
        method: "DELETE",
        cache: "no-store",
      },
    );
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`API ${response.status}: ${body}`);
    }
  },
  previewAlert: (alertId: string) =>
    request<AlertPreview>(`/api/v1/alerts/${alertId}/preview?owner_id=${OWNER_ID}`),
  buildRealtorAlertDigest: (
    alertId: string,
    payload: RealtorSavedSearchDigestRequest = {},
  ) =>
    request<RealtorSavedSearchDigest>(
      `/api/v1/alerts/${encodeURIComponent(alertId)}/realtor-digest?owner_id=${OWNER_ID}`,
      {
        method: "POST",
        body: JSON.stringify({
          client_name: payload.client_name || null,
          intro: payload.intro || null,
          max_matches: payload.max_matches ?? 5,
          include_source_links: payload.include_source_links ?? false,
        }),
      },
    ),
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

export function reportPdfUrl(reportId: string) {
  return `${currentApiBaseUrl()}/api/v1/reports/${reportId}/pdf`;
}

export function crmSharedShortlistUrl(shareToken: string) {
  return `${currentApiBaseUrl()}/api/v1/crm/shared-shortlists/${encodeURIComponent(shareToken)}`;
}

export function reportExportUrl(format: "csv" | "json") {
  return `${currentApiBaseUrl()}/api/v1/reports/export${toQueryString({ format })}`;
}

export function listingDatasetExportUrl(
  format: "csv" | "json",
  params: Partial<ListingSearchQuery> & { limit?: number } = {},
) {
  return `${currentApiBaseUrl()}/api/v1/datasets/listings/export${toQueryString({
    ...params,
    format,
  })}`;
}

export function objectReportUrl(listingId: string) {
  return `${currentApiBaseUrl()}/api/v1/reports/object/${listingId}.html`;
}
