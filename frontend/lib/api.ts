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

export type PriceHistoryPoint = {
  observed_at: string;
  price: number;
  price_per_m2: number;
};

export type PropertyScores = {
  investment_score: number;
  risk_score: number;
  negotiation_score: number;
  liquidity_score: number;
  rental_potential_score: number;
  fair_price_low: number;
  fair_price_mid: number;
  fair_price_high: number;
  price_delta_to_fair_mid_pct: number;
  reasons: string[];
  warnings: string[];
};

export type ListingAnalysis = {
  listing: Listing;
  area_statistics: AreaStatistics;
  price_history: PriceHistoryPoint[];
  comparables: Listing[];
  scores: PropertyScores;
  insights: string[];
  negotiation_arguments: string[];
  data_quality_notes: string[];
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

export type UserRole = "buyer" | "realtor" | "agency_admin" | "admin";
export type SubscriptionPlan = "free" | "buyer_pro" | "realtor" | "agency" | "enterprise";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";
export type ReportProductCode = "object_report" | "full_object_analysis" | "investor_report";
export type ReportOrderStatus = "unpaid" | "paid" | "fulfilled" | "canceled";
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

export type AccountUsage = {
  favorites: number;
  alerts: number;
  reports_this_month: number;
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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  listListings: (params: ListingSearchQuery = {}) =>
    request<ListingSearchResponse>(`/api/v1/listings${toQueryString(params)}`),
  listAreas: () => request<AreaStatistics[]>("/api/v1/areas"),
  getMe: () => request<AccountSummary>("/api/v1/me"),
  listPlans: () => request<PlanLimits[]>("/api/v1/plans"),
  listReportProducts: () => request<ReportProduct[]>("/api/v1/report-products"),
  listReportOrders: () => request<ReportOrder[]>("/api/v1/report-orders"),
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
    fetch(`${API_BASE_URL}/api/v1/favorites/${favoriteId}?owner_id=${OWNER_ID}`, {
      method: "DELETE",
    }),
  generateReport: (listingId: string, audience: "buyer" | "realtor" | "investor" = "buyer") =>
    request<GeneratedReport>("/api/v1/reports/object/generate", {
      method: "POST",
      body: JSON.stringify({ listing_id: listingId, audience, report_format: "html" }),
    }),
  listReports: () => request<GeneratedReportListItem[]>("/api/v1/reports"),
  createAlert: (payload: { name: string; filters: AlertFilters }) =>
    request<Alert>(`/api/v1/alerts?owner_id=${OWNER_ID}`, {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        filters: payload.filters,
        channel: "email",
        frequency: "daily",
      }),
    }),
  listAlerts: () => request<Alert[]>(`/api/v1/alerts?owner_id=${OWNER_ID}`),
  previewAlert: (alertId: string) =>
    request<AlertPreview>(`/api/v1/alerts/${alertId}/preview?owner_id=${OWNER_ID}`),
};

export function reportContentUrl(reportId: string) {
  return `${API_BASE_URL}/api/v1/reports/${reportId}/content`;
}

export function objectReportUrl(listingId: string) {
  return `${API_BASE_URL}/api/v1/reports/object/${listingId}.html`;
}
