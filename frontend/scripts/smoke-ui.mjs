#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const failures = [];
let assertions = 0;

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`${relativePath}: file is missing`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function expectIncludes(label, content, tokens) {
  for (const token of tokens) {
    assertions += 1;
    if (!content.includes(token)) {
      failures.push(`${label}: expected token ${JSON.stringify(token)}`);
    }
  }
}

function expectNotIncludes(label, content, tokens) {
  for (const token of tokens) {
    assertions += 1;
    if (content.includes(token)) {
      failures.push(`${label}: unexpected token ${JSON.stringify(token)}`);
    }
  }
}

function expectRegex(label, content, pattern) {
  assertions += 1;
  if (!pattern.test(content)) {
    failures.push(`${label}: expected pattern ${pattern}`);
  }
}

function expectMinSize(label, content, minBytes) {
  assertions += 1;
  if (content.length < minBytes) {
    failures.push(`${label}: expected at least ${minBytes} bytes, got ${content.length}`);
  }
}

const packageJson = JSON.parse(read("package.json"));
const globalStyles = read("app/globals.css");
const apiClient = read("lib/api.ts");
const apiTransport = read("lib/apiClient.ts");
const generatedApi = read("lib/generated-api.ts");
const explorerPage = read("app/page.tsx");
const checkPage = read("app/check/page.tsx");
const savedPage = read("app/saved/page.tsx");
const savedApartmentsPage = read("components/SavedApartmentsPage.tsx");
const legacySavedPage = read("app/check/drafts/page.tsx");
const comparePage = read("app/compare/page.tsx");
const listingCard = read("components/ListingCard.tsx");
const demoModeBanner = read("components/DemoModeBanner.tsx");
const authForm = read("components/AuthForm.tsx");
const authSessionNotice = read("components/AuthSessionNotice.tsx");
const authSessionStatus = read("app/api/auth/session-status/route.ts");
const mapComponent = read("components/PropertyMap.tsx");
const reportsPage = read("app/reports/page.tsx");
const alertsPage = read("app/alerts/page.tsx");
const adminPage = read("app/admin/page.tsx");
const accountPage = read("app/account/page.tsx");
const areasPage = read("app/areas/page.tsx");
const areaComparePage = read("app/areas/compare/page.tsx");
const areaDetailPage = read("app/areas/[areaId]/page.tsx");
const listingDetailPage = read("app/listings/[id]/page.tsx");
const pricingPage = read("app/pricing/page.tsx");
const mortgagePage = read("app/mortgage/page.tsx");
const buyerBetaPage = read("app/beta/page.tsx");
const buyerBetaContent = read("components/BuyerBetaContent.tsx");
const realtorsPage = read("app/realtors/page.tsx");
const realtorsContent = read("components/RealtorsContent.tsx");
const newsPage = read("app/news/page.tsx");
const developersPage = read("app/developers/page.tsx");
const developerDetailPage = read("app/developers/[developerId]/page.tsx");
const guidesPage = read("app/guides/page.tsx");
const guideDetailPage = read("app/guides/[guideId]/page.tsx");
const landingScene = read("components/LandingMapScene.tsx");
const betaLeadForm = read("components/BetaLeadForm.tsx");
const seoGuides = read("lib/seoGuides.ts");
const layout = read("app/layout.tsx");
const localizedNavigation = read("components/LocalizedNavigation.tsx");
const languageSwitcher = read("components/LanguageSwitcher.tsx");
const i18n = read("lib/i18n.ts");
const scoreLabels = read("lib/scoreLabels.ts");
const formatters = read("lib/format.ts");
const useLocalePreference = read("lib/useLocalePreference.ts");
const sitemap = read("app/sitemap.ts");

const consumerSource = fs
  .readdirSync(path.join(root, "app"), { recursive: true })
  .filter((file) => typeof file === "string" && file.endsWith((".tsx")))
  .filter((file) => !file.startsWith("admin"))
  .map((file) => read(path.join("app", file)))
  .join("\n");
const consumerComponentSource = fs
  .readdirSync(path.join(root, "components"), { recursive: true })
  .filter((file) => typeof file === "string" && file.endsWith(".tsx"))
  .map((file) => read(path.join("components", file)))
  .join("\n");

expectIncludes("package scripts", JSON.stringify(packageJson.scripts), [
  "\"build\"",
  "\"lint\"",
  "\"smoke\"",
  "\"typecheck\"",
]);

expectIncludes("responsive guardrails", globalStyles, [
  "overflow-x: hidden;",
  "overflow-wrap: anywhere;",
  ".panel-body > .table",
  ".table-scroll .table",
  ".map-layer-controls",
  "max-height: 178px;",
]);

expectIncludes("api client contracts", apiClient, [
  "DataProvenance",
  "getRuntimeContext",
  "/runtime-context",
  "listListings",
  "/api/v1/listings",
  "getMapFeatures",
  "/api/v1/map/features",
  "listReports",
  "/api/v1/reports",
  "generateReport",
  "/api/v1/reports/object/generate",
  "listAdminIngestionJobs",
  "/api/v1/admin/ingestion/jobs",
  "listAdminAuditLogs",
  "/api/v1/admin/audit-logs",
  "listReportProducts",
  "/api/v1/report-products",
  "getMarketIntelligenceReport",
  "/api/v1/market/intelligence-report",
  "evaluateScoringServiceListing",
  "/api/v1/scoring/evaluate",
  "listCustomDashboards",
  "createCustomDashboard",
  "previewCustomDashboard",
  "/api/v1/enterprise/custom-dashboards",
  "listAgencyCrmClients",
  "createAgencyCrmShortlist",
  "previewAgencyCrmShortlistShare",
  "/api/v1/agencies/${encodeURIComponent(agencyId)}/crm/clients",
  "/api/v1/crm/shared-shortlists",
  "listAdminPartnerLeadScores",
  "/api/v1/admin/partner-referrals/lead-scores",
  "createReportOrder",
  "/api/v1/report-orders",
  "mockPayReportOrder",
  "/mock-pay",
  "fulfillReportOrder",
  "/fulfill",
  "listingDatasetExportUrl",
  "/api/v1/datasets/listings/export",
  "/api/v1/auth/register",
  "/api/v1/auth/login",
  "/api/v1/auth/logout",
]);
expectNotIncludes("api client has no shared owner fallback", apiClient, ["NEXT_PUBLIC_OWNER_ID"]);

expectIncludes("authentication flow", authForm, [
  "api.register",
  "api.login",
  "domarion:auth-changed",
  'showPassword ? "text" : "password"',
  '"current-password"',
  'requestedMode === "register"',
  'mode === "register" ? copy.registerTitle : copy.title',
  "Utwórz konto w WartoMetr",
  "Создание аккаунта WartoMetr",
]);
expectIncludes("expired session handling", authSessionNotice, [
  "domarion:auth-required",
  'reason === "required"',
  "notice.status === 403",
  "/account?returnTo=",
]);
expectIncludes("navigation session status", authSessionStatus, [
  "await cookies()",
  "/api/v1/auth/session",
  "response.status === 401",
  "authenticated: false",
]);
expectIncludes("consumer navigation hierarchy", localizedNavigation, [
  "PRIMARY_NAVIGATION_ITEMS",
  "DISCOVERY_NAVIGATION_ITEMS",
  "nav-group-label",
  "aria-current",
  "isNavigationItemActive",
]);
expectIncludes("anonymous session handling", apiTransport, [
  "authenticatedFetch",
  'credentials: "include"',
  'path === "/api/v1/auth/login"',
  'detail === "Sign in is required"',
  "detail: { status: response.status, reason }",
]);
for (const [label, page] of [
  ["my apartments auth boundary", savedApartmentsPage],
  ["alerts auth boundary", alertsPage],
  ["reports auth boundary", reportsPage],
  ["pricing auth boundary", pricingPage],
]) {
  expectIncludes(label, page, ["ApiError", "authRequired", "<AuthForm"]);
}

expectIncludes("account CRM workspace", accountPage, [
  "ACCOUNT_PAGE_COPY[locale]",
  "useLocalePreference()",
  'fetch("/api/auth/session-status"',
  "if (!sessionStatus.authenticated)",
  "createAgencyCrmClient",
  "createAgencyCrmShortlist",
  "previewAgencyCrmShortlistShare",
  "CrmSharePreviewBlock",
]);
expectIncludes("alerts delivery history", alertsPage, [
  "api.listAlertDeliveryJobs()",
  "Promise.allSettled",
  "deliverySummary",
  "deliveryStatusLabel",
  "deliveryStatusTone",
  "Delivery history",
  "Historia dostarczenia",
  "История доставки",
  "Історія доставки",
  "dateValue(job.created_at, locale)",
]);

expectIncludes("search explorer page", explorerPage, [
  "api.listListings(",
  "api.listHiddenGems(",
  "api.getMapFeatures(",
  "<PropertyMap",
  "buildSearchQuery",
  "createAlert",
  "generateReport",
  "toggleCompare",
  "EXPLORER_COPY[locale]",
  "SEARCH_COPY[locale]",
  "useLocalePreference()",
  "product.track",
  "copy.status.found",
  "locale={locale}",
]);
expectRegex("search explorer filters", explorerPage, /type Filters = \{[\s\S]*maxBuildingFloors/);
expectMinSize("search explorer page", explorerPage, 20_000);

expectIncludes("listing card i18n", listingCard, [
  "LISTING_CARD_COPY[locale]",
  "scoreLabel(scores.decision_label, locale)",
  "money(listing.price, locale)",
  "copy.compareTitle",
  "copy.reportTitle",
  "listing.data_provenance.mode === \"demo\"",
  "copy.demoData",
]);

expectIncludes("demo mode banner", demoModeBanner, [
  "data-testid=\"demo-mode-banner\"",
  "api.getRuntimeContext()",
  "context.data_mode === \"demo\"",
  "Tryb demonstracyjny",
  "Демонстрационный режим",
  "Демонстраційний режим",
  "checking",
  "error",
  "setAttempt",
]);

expectIncludes("check page i18n", checkPage, [
  "CHECK_PAGE_COPY[locale]",
  "PRODUCT_COPY[locale]",
  "useLocalePreference()",
  "product.heroTitle",
  "product.manualSummary",
  "copy.statuses.importExtracted",
  "missingFieldLabels(missingFields, copy)",
  "scoreLabel(analysis.scores.decision_label, locale)",
  "money(analysis.listing.price, locale)",
  "confidenceLabel(result.confidence_score, locale)",
]);

expectIncludes("saved apartments page", savedApartmentsPage, [
  "CHECK_DRAFTS_COPY[locale]",
  "api.listFavorites()",
  "api.listUserSubmittedListingDrafts",
  "createListingObjectWatch",
  "createUserSubmittedDraftObjectWatch",
  "filter === \"all\"",
  "No saved apartments yet",
  "Nie ma jeszcze zapisanych mieszkań",
  "Пока нет сохраненных квартир",
  "Поки немає збережених квартир",
]);
expectIncludes("saved apartments route", savedPage, ["SavedApartmentsPage"]);
expectIncludes("legacy saved route migration", legacySavedPage, [
  "redirect(\"/saved\")",
]);
expectIncludes("saved apartments page i18n", savedApartmentsPage, [
  "CHECK_DRAFTS_COPY[locale]",
  "useLocalePreference()",
  "TITLE[locale]",
  "copy.values.rooms(listing.rooms)",
  "dateValue(updated, locale)",
]);

expectIncludes("compare page i18n", comparePage, [
  "COMPARE_PAGE_COPY[locale]",
  "COMPARE_PRODUCT_COPY[locale]",
  "useLocalePreference()",
  "compareStatusText(copy, status)",
  "copy.sections.selector",
  "copy.actions.getVerdict",
  "copy.actions.buildShortlist",
  "comparisonRows(items, metricById, copy, locale)",
  "api.compareListings(selectedIds, intent)",
  "syncCompareUrl",
  "compare-mobile-cards",
  "key={row.id}",
  "scoreLabel(metric.decision_label, locale)",
  "money(metric.estimated_monthly_payment_pln, locale)",
  "setSelectedIds(initialIds)",
  ".slice(0, 5)",
  "current.length >= 5",
  "compare-table-desktop",
  "compare-mobile-cards",
]);

expectIncludes("map component", mapComponent, [
  "DEFAULT_VISIBLE_LAYERS",
  "normalizeVisibleLayers",
  "LISTING_HEATMAP_SOURCE_ID",
  "ADMINISTRATIVE_SOURCE_ID",
  "ADMINISTRATIVE_LAYER_CONTROLS",
  "PLANNING_SOURCE_ID",
  "PLANNING_LAYER_CONTROLS",
  "FUTURE_TRANSPORT_SOURCE_ID",
  "FUTURE_TRANSPORT_LAYER_CONTROLS",
  "RISK_SOURCE_ID",
  "RISK_LAYER_CONTROLS",
  "TRANSPORT_ROUTES_SOURCE_ID",
  "INFRASTRUCTURE_LAYER_CONTROLS",
  "isAdministrativeFeatureVisible",
  "isPlanningFeatureVisible",
  "isFutureTransportFeatureVisible",
  "isRiskFeatureVisible",
  "visibleLayers.priceHeatmap",
  "updateVisibleLayer",
  "buildRadiusBuckets",
  "syncMapData",
]);
expectRegex("map layer checkbox controls", mapComponent, /checked=\{visibleLayers(?:\.[a-zA-Z]+|\[control\.key\])\}/);
expectMinSize("map component", mapComponent, 20_000);

expectIncludes("reports page", reportsPage, [
  "api.listReports()",
  "api.listAIInsights(",
  "REPORTS_BUYER_COPY[locale]",
  "buyerReports.map",
  "report-library-grid",
  "reportContentUrl(report.id)",
  "reportPdfUrl(report.id)",
  "REPORTS_LOADING_STEPS[locale]",
]);
expectRegex("reports card library", reportsPage, /report-library-grid[\s\S]*buyerReports\.map/);

expectIncludes("admin page", adminPage, [
  "Leads & Partner Referrals",
  "api.listAdminIngestionJobs()",
  "api.listAdminDataQualityLogs(",
  "api.listAdminRawListings(",
  "api.listAdminPlannedInvestments(",
  "api.listAdminPartnerReferrals(",
  "api.listAdminAuditLogs(",
  "api.listAdminDeduplicationMatches(",
  "api.correctAdminNormalizedListing(",
  "api.importAdminDeveloperFeed(",
  "api.upsertAdminDeveloperProfile(",
  "api.upsertAdminDeveloperProject(",
  "api.upsertAdminDeveloperAlias(",
  "api.upsertAdminDeveloperQualitySignal(",
  "api.updateAdminDeveloperQualitySignalModeration(",
  "api.deliverAdminDailyEmailAlerts(",
  "Normalized Listing Correction",
  "Developer Record Editor",
  "Developer Feed Import",
  "Open review",
  "Reject dispute",
  "referralTypeLabel",
  "referralLeadContext",
]);
expectRegex("admin audit table", adminPage, /filteredAuditLogs[\s\S]*auditLog\.action_type/);
expectMinSize("admin page", adminPage, 50_000);

expectIncludes("payments page", pricingPage, [
  "api.listReportProducts()",
  "api.listReportOrders()",
  "api.createReportOrder(",
  "PRICING_PRODUCT_COPY",
  "PRICING_BUYER_COPY",
  "buyerProducts.map",
  "checkout.checkout_url",
  "reportContentUrl(order.generated_report_id)",
  "billingPayload(billingForm)",
]);
expectNotIncludes("payments page hides mock payment controls", pricingPage, [
  "api.mockPayReportOrder(",
  "api.fulfillReportOrder(",
  "api.listReportOrderEvents(",
]);

expectIncludes("buyer beta landing", buyerBetaPage + buyerBetaContent, [
  "BuyerBetaContent",
  "href=\"/check?source=buyer-beta\"",
  "href=\"/pricing?source=buyer-beta\"",
  "BetaLeadForm",
  "segment=\"buyer_beta\"",
  "LandingMapScene",
  "LANDING_COPY",
  "useLocalePreference",
]);

expectIncludes("realtor beta landing", realtorsPage + realtorsContent, [
  "RealtorsContent",
  "href=\"/pricing?source=realtor-beta\"",
  "href=\"/reports?source=realtor-beta\"",
  "BetaLeadForm",
  "segment=\"realtor_beta\"",
  "LandingMapScene",
  "REALTOR_COPY",
  "useLocalePreference",
]);

expectIncludes("landing map scene", landingScene, [
  "buyerBadges",
  "realtorBadges",
  "landing-map-scene",
  "scene-badge",
]);

expectIncludes("beta lead form", betaLeadForm, [
  "\"use client\"",
  "api.createPartnerReferral",
  "buyer_beta",
  "realtor_beta",
  "object_reference_private",
  "agency_name",
  "consent_to_contact",
]);

expectIncludes("seo guides content", seoGuides, [
  "wroclaw-price-per-m2",
  "best-districts-wroclaw",
  "where-to-buy-near-wroclaw",
  "district-comparison-wroclaw",
  "flats-with-growth-potential",
  "dolnoslaskie-market-analysis",
  "mortgage-calculator-poland",
  "purchase-checklist-poland",
  "ksiega-wieczysta-checklist",
  "total-purchase-cost-poland",
  "internalLinks",
  "relatedAreaSlugs",
]);
expectMinSize("seo guides content", seoGuides, 20_000);

expectIncludes("seo guides index", guidesPage, [
  "SEO_GUIDES.map",
  "href=\"/areas\"",
  "href=\"/check\"",
  "href={`/guides/${guide.slug}`}",
]);

expectIncludes("seo guide detail", guideDetailPage, [
  "generateStaticParams",
  "getSeoGuide",
  "application/ld+json",
  "guide.internalLinks.map",
  "relatedAreas.map",
  "Pełny raport",
  "href=\"/check\"",
]);

expectIncludes("area guide internal links", areasPage, [
  "SEO_GUIDES.slice(0, 4)",
  "href=\"/guides\"",
  "href={`/guides/${guide.slug}`}",
]);

expectIncludes("area compare localization", areaComparePage, [
  "AREA_COMPARE_PAGE_COPY[locale]",
  "useLocalePreference()",
  "money(area.median_price_per_m2, locale)",
  "formatNullablePercent(area.price_per_m2_vs_city_pct, locale, copy)",
  "area-compare-mobile-cards",
  "area-compare-table-desktop",
]);

expectIncludes("area detail guide internal links", areaDetailPage, [
  "relatedGuides",
  "guide.relatedAreaSlugs.includes(area.slug)",
  "href={`/guides/${guide.slug}`}",
]);

expectIncludes("news page localization", newsPage, [
  "NEWS_PAGE_COPY[locale]",
  "useLocalePreference()",
  "dateValue(article.published_at, locale)",
  "copy.labels.category[article.category]",
]);

expectIncludes("developers page localization", developersPage, [
  "DEVELOPERS_PAGE_COPY[locale]",
  "useLocalePreference()",
  "api.listDevelopers",
  "copy.labels.reputation[selected.label]",
]);

expectIncludes("developer detail localization", developerDetailPage, [
  "DEVELOPERS_PAGE_COPY[locale]",
  "useLocalePreference()",
  "api.getDeveloper",
  "dateValue(data.developer.updated_at, locale)",
]);

expectIncludes("listing detail guide internal links", listingDetailPage, [
  "LISTING_DETAIL_COPY[locale]",
  "LISTING_LOADING_STEPS[locale]",
  "useLocalePreference()",
  "copy.sections.priceHistory",
  "copy.sections.comparables",
  "copy.actions.openReport",
  "copy.actions.compare",
  "copy.actions.track",
  "copy.actions.negotiate",
  "api.createListingObjectWatch(listingId)",
  "<BuyerDecisionPanel decision={displayedDecision}",
  "scoreLabel(scores.decision_label, locale)",
  "money(listing.price, locale)",
  "dateValue(point.observed_at, locale)",
  "<ScoreBars locale={locale}",
  "SEO_GUIDES.slice(0, 3)",
  "href={`/guides/${guide.slug}`}",
  "<BookOpen",
  "listing.data_provenance.mode === \"demo\"",
]);
expectRegex(
  "listing detail mobile table wrappers",
  listingDetailPage,
  /copy\.sections\.priceHistory[\s\S]*table-scroll[\s\S]*copy\.sections\.comparables[\s\S]*table-scroll/,
);
expectIncludes("listing detail decision hierarchy", read("components/BuyerDecisionPanel.tsx"), [
  "<details className=\"buyer-decision-details\">",
  "<summary>{copy.sections.decisionDetails}</summary>",
  "buyer-decision-details-body",
]);
expectIncludes("score explainability", read("components/ScoreBars.tsx"), [
  "scores.explainability",
  "data-score-explanation-version",
  "DRIVER_LABELS",
  "coverage",
]);
expectIncludes("score explainability API contract", read("lib/api.ts"), [
  "explainability:",
  "coverage_score",
  "missing_data_codes",
]);
expectIncludes("safe localized API errors", read("lib/errorMessages.ts"), [
  "network_error",
  "auth_required",
  "validation_error",
  "localizedError",
  "pl:",
  "en:",
  "ru:",
  "uk:",
]);
expectNotIncludes("consumer errors do not expose raw exception messages", consumerSource, [
  "caught instanceof Error ? caught.message",
]);
expectNotIncludes("consumer components do not expose raw exception messages", consumerComponentSource, [
  "caught instanceof Error ? caught.message",
]);
expectIncludes("API error metadata", apiTransport, [
  "errorCode",
  "correlationId",
  "public readonly code",
]);
expectIncludes("analytics request contract", apiClient, ["purchase_intent: purchaseIntent"]);
expectIncludes("typed API boundary", apiClient, [
  "import {",
  'from "./apiClient"',
]);
expectIncludes("API request transport", apiTransport, ['credentials: "include"']);
expectIncludes("API transport boundary", apiTransport, [
  "export async function request<T>",
  "export class ApiError",
  "export async function authenticatedFetch",
]);
expectIncludes("generated OpenAPI contract", generatedApi, [
  '"/api/v1/listings"',
  '"/api/v1/areas"',
  '"/api/v1/compare"',
  '"/api/v1/mortgage/calculate"',
]);
expectNotIncludes("stable collection keys", [
  read("components/FutureImpactNarrativePanel.tsx"),
  read("components/Charts.tsx"),
  read("app/compare/page.tsx"),
  read("app/check/page.tsx"),
  read("app/listings/[id]/page.tsx"),
  read("app/news/page.tsx"),
  read("app/areas/compare/page.tsx"),
].join("\n"), [
  "key={`${index}-",
  "key={`${citation.source_id}-${index}`}",
  "key={`${guardrail.code}-${index}`}"
]);

expectIncludes("primary navigation", layout, [
  "LOCALE_COOKIE_NAME",
  "normalizeLocale",
  "<LocalizedNavigation",
  "<LanguageSwitcher",
  "<DemoModeBanner",
  "<AuthSessionNotice",
]);
expectIncludes("document outline and keyboard entry", layout, [
  'id="main-content"',
  'href="#main-content"',
  "SKIP_TO_CONTENT",
]);
expectIncludes("mortgage financial hierarchy", mortgagePage, [
  "mortgage-summary-grid",
  "financial-summary",
  "mortgage-cash-grid",
  "financial-metric total",
]);
expectIncludes("financial values use tabular numerals", globalStyles, [
  "font-variant-numeric: tabular-nums",
]);
expectIncludes("homepage single heading", explorerPage, ["<h2>{onboarding.title}</h2>"]);
expectNotIncludes("homepage does not duplicate h1", explorerPage, ["<h1>{onboarding.title}</h1>"]);
expectIncludes("localized navigation", localizedNavigation, [
  "href: \"/check\"",
  "href: \"/\"",
  "href: \"/saved\"",
  "href: \"/areas\"",
  'href="/account?mode=login"',
  'href="/account?mode=register"',
  'className="nav-create-account"',
  'fetch("/api/auth/session-status"',
  'window.addEventListener("domarion:auth-changed"',
  "NAVIGATION_LABELS[locale]",
]);
expectIncludes("language switcher", languageSwitcher, [
  "LOCALE_OPTIONS.map",
  "aria-pressed={option.code === locale}",
  "setLocale(option.code)",
]);
expectIncludes("i18n dictionaries", i18n, [
  "SUPPORTED_LOCALES",
  "\"en\"",
  "\"pl\"",
  "\"ru\"",
  "\"uk\"",
  "NAVIGATION_LABELS",
  "LANGUAGE_SWITCHER_LABELS",
  "EXPLORER_COPY",
  "LISTING_CARD_COPY",
  "CHECK_PAGE_COPY",
  "CHECK_DRAFTS_COPY",
  "LISTING_DETAIL_COPY",
  "COMPARE_PAGE_COPY",
  "normalizeLocale",
]);
expectIncludes("localized score labels", scoreLabels, [
  "Record<Locale, Record<string, string>>",
  "Strong candidate",
  "Mocny kandydat",
  "Сильний кандидат",
]);
expectIncludes("locale-aware formatters", formatters, [
  "INTL_LOCALES",
  "export function money(value: number, locale?: Locale)",
  "export function dateValue(value: string | Date, locale?: Locale)",
  "new Intl.NumberFormat(intlLocale(locale))",
]);
expectIncludes("locale preference persistence", useLocalePreference, [
  "LOCALE_STORAGE_KEY",
  "LOCALE_COOKIE_NAME",
  "document.documentElement.lang = locale",
  "window.localStorage.setItem",
  "document.cookie",
]);
expectIncludes("public sitemap", sitemap, [
  "\"/check\"",
  "\"/guides\"",
  "\"/areas\"",
  "SEO_AREAS.map",
  "SEO_GUIDES.map",
]);
expectNotIncludes("public sitemap excludes contextual and pro routes", sitemap, [
  "\"/beta\"",
  "\"/realtors\"",
  "\"/compare\"",
  "\"/developers\"",
  "\"/market\"",
  "\"/mortgage\"",
  "\"/pricing\"",
  "\"/reports\"",
  "\"/alerts\"",
]);

if (failures.length > 0) {
  console.error(`Frontend smoke failed: ${failures.length} failure(s).`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Frontend smoke passed: ${assertions} assertions.`);
