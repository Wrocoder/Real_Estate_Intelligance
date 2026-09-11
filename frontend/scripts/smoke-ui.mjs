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

function expectOrder(label, content, tokens) {
  let previous = -1;
  for (const token of tokens) {
    assertions += 1;
    const position = content.indexOf(token);
    if (position < 0 || position <= previous) {
      failures.push(`${label}: expected ${JSON.stringify(token)} after the previous hierarchy token`);
      return;
    }
    previous = position;
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
const decisionSummary = read("components/DecisionSummary.tsx");
const buyerDecisionPanel = read("components/BuyerDecisionPanel.tsx");
const buyerDecisionMessages = read("lib/buyerDecisionMessages.ts");
const buyerActionPlanPanel = read("components/BuyerActionPlanPanel.tsx");
const buyerActionMessages = read("lib/buyerActionMessages.ts");
const propertyMap = read("components/PropertyMap.tsx");
const propertyMapMessages = read("lib/propertyMapMessages.ts");
const provenanceDetails = read("components/ProvenanceDetails.tsx");
const comparableEvidence = read("components/ComparableEvidencePanel.tsx");
const rentalEvidence = read("components/RentalEvidencePanel.tsx");
const stateBlocks = read("components/StateBlocks.tsx");
const explorerPage = read("app/page.tsx");
const checkPage = read("app/check/page.tsx");
const savedPage = read("app/saved/page.tsx");
const savedApartmentsPage = read("components/SavedApartmentsPage.tsx");
const legacySavedPage = read("app/check/drafts/page.tsx");
const comparePage = read("app/compare/page.tsx");
const comparePresentation = read("components/compare/ComparePresentation.tsx");
const comparisonApi = read("lib/api/comparison.ts");
const openApiContract = read("lib/openApiContract.ts");
const listingCard = read("components/ListingCard.tsx");
const demoModeBanner = read("components/DemoModeBanner.tsx");
const authForm = read("components/AuthForm.tsx");
const authSessionNotice = read("components/AuthSessionNotice.tsx");
const mapComponent = read("components/PropertyMap.tsx");
const reportsPage = read("app/reports/page.tsx");
const alertsPage = read("app/alerts/page.tsx");
const adminPage = read("app/admin/page.tsx");
const accountPage = read("app/account/page.tsx");
const areasPage = read("app/areas/page.tsx");
const areasDirectory = read("components/AreasDirectory.tsx");
const areaComparePage = read("app/areas/compare/page.tsx");
const areaDetailPage = read("app/areas/[areaId]/page.tsx");
const areaDetailContent = read("components/AreaDetailPage.tsx");
const areaDynamicEvidence = read("components/AreaDynamicEvidence.tsx");
const areaDecisionGuide = read("components/AreaDecisionGuide.tsx");
const areaPriceHistoryChart = read("components/AreaPriceHistoryChart.tsx");
const listingDetailPage = read("app/listings/[id]/page.tsx");
const pricingPage = read("app/pricing/page.tsx");
const mortgagePage = read("app/mortgage/page.tsx");
const productAnalytics = read("lib/productAnalytics.ts");
const productAnalyticsSurfaces = [
  productAnalytics,
  checkPage,
  listingDetailPage,
  comparePage,
  reportsPage,
  pricingPage,
].join("\n");
const buyerBetaPage = read("app/beta/page.tsx");
const buyerBetaContent = read("components/BuyerBetaContent.tsx");
const realtorsPage = read("app/realtors/page.tsx");
const realtorsContent = read("components/RealtorsContent.tsx");
const newsPage = read("app/news/page.tsx");
const developersPage = read("app/developers/page.tsx");
const developerDetailPage = read("app/developers/[developerId]/page.tsx");
const guidesPage = read("app/guides/page.tsx");
const guideDetailPage = read("app/guides/[guideId]/page.tsx");
const guidesIndexContent = read("components/GuidesIndexContent.tsx");
const guideArticleContent = read("components/GuideArticleContent.tsx");
const guideEditorialMeta = read("components/GuideEditorialMeta.tsx");
const guideRelatedAreas = read("components/GuideRelatedAreas.tsx");
const guideUiCopy = read("lib/guideUiCopy.ts");
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
const browserQuality = read("scripts/browser-quality.mjs");

const consumerSource = fs
  .readdirSync(path.join(root, "app"), { recursive: true })
  .filter((file) => typeof file === "string" && file.endsWith(".tsx"))
  .filter((file) => !file.startsWith("admin"))
  .map((file) => read(path.join("app", file)))
  .join("\n");
const consumerComponentSource = fs
  .readdirSync(path.join(root, "components"), { recursive: true })
  .filter((file) => typeof file === "string" && file.endsWith(".tsx"))
  .map((file) => read(path.join("components", file)))
  .join("\n");

expectIncludes("package scripts", JSON.stringify(packageJson.scripts), ['"build"', '"lint"', '"smoke"', '"typecheck"']);

expectIncludes("responsive guardrails", globalStyles, [
  "overflow-x: hidden;",
  "overflow-wrap: anywhere;",
  ".panel-body > .table",
  ".table-scroll .table",
  ".map-layer-controls",
  "max-height: 178px;",
]);
expectIncludes("mobile composition", globalStyles, [
  ".mobile-nav-disclosure",
  ".mobile-nav-summary",
  ".mobile-nav-disclosure:not([open]) > .mobile-nav-content",
  ".mobile-nav-disclosure[open] > .mobile-nav-content",
  ".report-summary-grid",
  "grid-template-columns: repeat(2, minmax(0, 1fr));",
]);
expectIncludes("mobile composition browser gate", browserQuality, [
  "runMobileComposition",
  'BROWSER_QUALITY_SCENARIO === "mobile-composition"',
  "{ width: 390, height: 844 }",
  "{ width: 768, height: 1024 }",
  ".listing-section-disclosure[open]",
  ".compare-details",
  ".report-summary-grid",
]);
expectIncludes("reduced visual density", globalStyles, [
  ".summary-strip",
  ".decision-summary-compact .metric",
  ".listing-secondary-disclosure > summary",
  ".compare-highlight-strip",
  ".compare-ranking-list",
  ".compare-ranking-item",
]);
expectIncludes("visual density browser gate", browserQuality, [
  "runVisualDensity",
  'BROWSER_QUALITY_SCENARIO === "visual-density"',
  ".compare-highlight-strip > .metric",
  ".compare-recommendation .decision-summary .status-pill",
  ".report-summary-grid > .metric",
  ".listing-decision-actions .button.primary",
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
  "!options.suppressAuthRequired",
  'errorCode === "auth_required"',
  'new CustomEvent("domarion:auth-required"',
]);
expectIncludes("passive session check", apiClient, [
  'request<AuthSession>("/api/v1/auth/session", undefined, { suppressAuthRequired: true })',
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
  "await api.getSession()",
  "caught instanceof ApiError && caught.status === 401",
  "createAgencyCrmClient",
  "createAgencyCrmShortlist",
  "previewAgencyCrmShortlistShare",
  "CrmSharePreviewBlock",
]);
expectIncludes("durable buyer profile", accountPage + apiClient + generatedApi, [
  "BUYER_PROFILE_COPY",
  "api.saveBuyerProfile",
  "api.deleteBuyerProfile",
  "buyer_profile",
  '"/api/v1/me/buyer-profile"',
  "BuyerProfileUpdate",
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
expectIncludes("transparent buyer search", explorerPage, [
  "purposeChanged",
  'next.buyingPurpose === "investment"',
  'parsed.buyingPurpose === "investment" && !params.has("sort")',
  "activeFilterLabels(filters, product, copy, locale)",
  "advancedLabels",
  "copy.optionLabels.sort[filters.sort]",
]);
expectNotIncludes("search has no hidden intent thresholds", explorerPage, [
  "applyIntentDefaults",
  "isImplicitIntentFilter",
]);
expectMinSize("search explorer page", explorerPage, 20_000);

expectIncludes("listing card i18n", listingCard, [
  "LISTING_CARD_COPY[locale]",
  "scoreLabel(scores.decision_label, locale)",
  "money(listing.price, locale)",
  "copy.compareTitle",
  "copy.reportTitle",
  'listing.data_provenance.mode === "demo"',
  "copy.demoData",
  "copy.fairPrice",
  "copy.purposeFit[buyingPurpose]",
  "scores.fair_price_low",
  "scores.fair_price_high",
]);
expectNotIncludes("listing card hides unexplained score abbreviations", listingCard, [
  "copy.scorePrefixes.investment",
  "copy.scorePrefixes.risk",
  "copy.scorePrefixes.negotiation",
]);

expectIncludes("demo mode banner", demoModeBanner, [
  'data-testid="demo-mode-banner"',
  "api.getRuntimeContext({ signal: controller.signal })",
  'context.data_mode === "demo"',
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
expectIncludes("check recovery states", checkPage + stateBlocks, [
  "activeOperation",
  "LoadingBlock",
  "retryFailedOperation",
  "ImportOutcomeNotice",
  "onRetry",
  "state-block-actions",
  "importPartialTitle",
  "importFailedTitle",
  "importUnsupportedTitle",
]);
expectIncludes("shared decision summary", decisionSummary, [
  "decision-summary",
  "decisionSummaryFromDecision",
  "decisionSummaryFromScores",
  "confidenceScore",
  "decision-summary-next-step",
  "NEXT_STEPS",
  "status ? copy.eyebrow",
]);
expectNotIncludes("decision summary avoids duplicate verdict badges", decisionSummary, [
  '{status ? <span className="status-pill info">{copy.eyebrow}</span> : null}',
]);
expectIncludes("listing disclaimers use localized consumer copy", listingDetailPage, [
  "copy.analysisDisclaimer",
  "copy.assistantDisclaimer",
]);
expectNotIncludes("listing excludes backend disclaimer prose", listingDetailPage, [
  "analysis.disclaimer",
  "aiAnswer.disclaimer",
]);
expectIncludes("listing disclaimer translations", i18n, [
  "This analysis supports initial screening and decision-making.",
  "Analiza wspiera wstępną ocenę i podjęcie decyzji.",
  "Анализ помогает предварительно оценить объект и принять решение.",
  "Аналіз допомагає попередньо оцінити об'єкт і прийняти рішення.",
]);
expectIncludes("check decision summary", checkPage, [
  "<BuyerDecisionPanel",
  "confidenceScore={result?.confidence_score",
  "<DecisionSummary",
  "reportResult.report.buyer_decision",
  "decisionSummaryFromScores(",
]);
expectIncludes("check buyer profile", checkPage, [
  "api.getMe()",
  "account.buyer_profile",
  "PROFILE_NOTICE_COPY",
]);
expectIncludes("provenance contract", provenanceDetails + apiClient + generatedApi, [
  "ProvenanceRecord",
  "sampleSize",
  "calculationType",
  "Source and method",
  "Źródło i sposób obliczenia",
  "geographic_scope",
  "calculation_type",
]);
expectIncludes(
  "provenance decision surfaces",
  read("components/BuyerDecisionPanel.tsx") +
    read("components/ListingProvenance.tsx") +
    read("components/AreaDynamicEvidence.tsx"),
  ["ProvenanceDetails", "sourceType:", "sampleSize:", "calculationType:"],
);

expectIncludes("saved apartments page", savedApartmentsPage, [
  "CHECK_DRAFTS_COPY[locale]",
  "api.listFavorites()",
  "api.listUserSubmittedListingDrafts",
  "createListingObjectWatch",
  "createUserSubmittedDraftObjectWatch",
  'filter === "all"',
  "No saved apartments yet",
  "Nie ma jeszcze zapisanych mieszkań",
  "Пока нет сохраненных квартир",
  "Поки немає збережених квартир",
]);
expectIncludes("saved apartments route", savedPage, ["SavedApartmentsPage"]);
expectIncludes("legacy saved route migration", legacySavedPage, ['redirect("/saved")']);
expectIncludes("saved apartments page i18n", savedApartmentsPage, [
  "CHECK_DRAFTS_COPY[locale]",
  "useLocalePreference()",
  "TITLE[locale]",
  "copy.values.rooms(listing.rooms)",
  "dateValue(updated, locale)",
]);
expectIncludes("saved decision summary", savedApartmentsPage, [
  "<DecisionSummary",
  "decisionSummaryFromScores",
  "draftDecision",
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
expectIncludes("compare decision summary", comparePage + comparePresentation, [
  "<DecisionSummary",
  "decisionSummaryFromScores",
  "fallbackSummary={copy.fallbackSummary}",
  "recommendationSignalText",
  "recommendation.reasons.map",
  "recommendation.tradeoffs.map",
  "compare-primary",
  "compare-highlight-strip summary-strip",
  "compare-ranking-list",
  "compare-ranking-item",
]);
expectNotIncludes("compare avoids duplicate best-choice highlight", comparePage, [
  "label={copy.metrics.bestChoice}",
]);
expectIncludes("personalized comparison", comparePage + comparePresentation, [
  "recommendation.listing_id",
  "comparison.recommendation.personalized",
  "comparison?.recommendation.all_over_budget",
  "response.unavailable_listing_ids",
  "badgeLabel",
]);
expectNotIncludes("compare excludes unlocalized backend prose", comparePage, [
  "metric.recommendation",
  "metric.reasons",
  "metric.warnings",
  "item.negotiation_arguments[0]",
  "item.scores.warnings[0]",
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
  "report-summary-grid",
  "summary-strip",
  'className="status-line" aria-live="polite"',
  "report-library-panel",
]);
expectIncludes("reports decision summary", reportsPage, ["<DecisionSummary", "report.decision_summary"]);
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
  'href="/check?source=buyer-beta"',
  'href="/pricing?source=buyer-beta"',
  "BetaLeadForm",
  'segment="buyer_beta"',
  "LandingMapScene",
  "LANDING_COPY",
  "useLocalePreference",
]);

expectIncludes("realtor beta landing", realtorsPage + realtorsContent, [
  "RealtorsContent",
  'href="/pricing?source=realtor-beta"',
  'href="/reports?source=realtor-beta"',
  "BetaLeadForm",
  'segment="realtor_beta"',
  "LandingMapScene",
  "REALTOR_COPY",
  "useLocalePreference",
]);

expectIncludes("landing map scene", landingScene, ["buyerBadges", "realtorBadges", "landing-map-scene", "scene-badge"]);

expectIncludes("beta lead form", betaLeadForm, [
  '"use client"',
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
  "editorial: editorial(",
  "reviewScope",
  "disclaimerKind",
  "NBP - kwartalne informacje o rynku nieruchomości",
  "Ministerstwo Sprawiedliwości - Księgi Wieczyste",
  "KNF - ryzyko stopy procentowej",
]);
expectMinSize("seo guides content", seoGuides, 20_000);

expectIncludes("seo guides index", guidesPage + guidesIndexContent, [
  "<GuidesIndexContent",
  "SEO_GUIDES.map",
  'href="/areas"',
  'href="/check?source=guides"',
  "href={`/guides/${guide.slug}`}",
  "guideCategory(guide.category, locale)",
  'lang="pl"',
]);

expectIncludes("seo guide detail", guideDetailPage + guideArticleContent, [
  "generateStaticParams",
  "getSeoGuide",
  "application/ld+json",
  "dateModified",
  "citation: guide.editorial.sources.map",
  "<GuideArticleContent",
  "guide.internalLinks.map",
  "<GuideRelatedAreas",
  "source=guide&guide=",
  'lang="pl"',
]);

expectIncludes("guide editorial trust", guideEditorialMeta + guideUiCopy, [
  "editorial.author",
  "editorial.reviewer",
  "editorial.updatedAt",
  "editorial.reviewScope",
  "editorial.sources.map",
  "copy.disclaimer[editorial.disclaimerKind]",
  "Article language: Polish",
  "Язык материала: польский",
  "Мова матеріалу: польська",
]);

expectIncludes("source-backed guide areas", guideRelatedAreas, [
  "Promise.allSettled",
  "api.getAreaStatistics(areaId)",
  "area.median_price_per_m2 > 0",
  'area.price_basis === "transaction_observed"',
  'area.data_provenance.mode === "demo"',
  "area.data_provenance.source_name",
  "area.data_provenance.updated_at",
  "copy.areasPartial",
  "copy.areasError",
  "void load()",
]);

expectIncludes("live area directory", areasPage + areasDirectory, [
  "api.listAreas()",
  'area.area_id !== "wroclaw-city"',
  "area.transaction_observation_count",
  "area.transaction_yearly_history.map",
  "Mediana - ostatnie 12 miesięcy",
  "area.data_provenance.time_range",
  "useLocalePreference()",
  "href={`/areas/${encodeURIComponent(area.area_id)}`}",
]);

expectIncludes("area compare localization", areaComparePage, [
  "AREA_COMPARE_PAGE_COPY[locale]",
  "useLocalePreference()",
  "money(area.median_price_per_m2, locale)",
  "formatNullablePercent(area.price_per_m2_vs_city_pct, locale, copy)",
  "area-compare-mobile-cards",
  "area-compare-table-desktop",
  "profileSortApplied",
  'priorities.includes("liquidity")',
]);

expectIncludes("live area detail", areaDetailPage + areaDetailContent, [
  "api.getAreaStatistics(areaId)",
  "initialArea={area}",
  "<AreaDynamicEvidence",
  "useLocalePreference()",
  "href={`/check?district=${encodeURIComponent(area.name)}`}",
]);
expectIncludes("area transaction price history", areaDynamicEvidence + areaPriceHistoryChart, [
  "api.getAreaPriceHistory(areaId)",
  "<AreaPriceHistoryChart",
  "history.monthly",
  "history.yearly.map",
  "point.serial - segment[segment.length - 1].serial > 1",
  "Monthly median price per m² across all available years",
]);
expectIncludes("decision-first area guidance", areaDynamicEvidence + areaDecisionGuide, [
  "<AreaDecisionGuide",
  "Czy to osiedle pasuje do Twojego zakupu?",
  "transaction_observation_count",
  "area.active_listings",
  'area.data_provenance.mode === "demo"',
  "completeProvenance",
  "hasPriceEvidence",
  "priceUnavailableSummary",
  "allInfrastructureUnavailable",
  "allInfrastructureEmpty",
  "partialInfrastructure",
  "avoidInvestmentUnknown",
  "checkRental",
  "comparableAreas.map",
  "priceDifference(percent(difference, locale))",
]);
expectIncludes("area infrastructure unknown handling", areaDynamicEvidence, [
  "infrastructureResults",
  "value === null",
  "value === 0",
  "copy.unavailable",
  "copy.noRecords",
  "source_updated_at",
  "infrastructure.sourceUrls",
]);
expectIncludes("planned area impact separation", areaDynamicEvidence, [
  "plannedImpactCategory",
  'type PlannedImpactCategory = "improvement" | "mixed" | "supply" | "unclear"',
  "copy.investmentImpact[category]",
  "item.confidence_score",
  "copy.investmentScope",
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
  "<ComparableEvidencePanel analysis={analysis} locale={locale} />",
  "<RentalEvidencePanel estimate={analysis.rental_estimate} locale={locale} />",
  "copy.actions.openReport",
  "copy.actions.compare",
  "copy.actions.track",
  "copy.actions.negotiate",
  "api.createListingObjectWatch(listingId)",
  "<BuyerDecisionPanel",
  "decision={displayedDecision}",
  "scoreLabel(scores.decision_label, locale)",
  "dateValue(point.observed_at, locale)",
  "<ScoreBars locale={locale}",
  "SEO_GUIDES.slice(0, 3)",
  "href={`/guides/${guide.slug}`}",
  "<BookOpen",
  'listing.data_provenance.mode === "demo"',
]);
expectIncludes("comparable evidence component", comparableEvidence, [
  "Why this price?",
  "Technical match",
  "similarity_score",
  "similarity_factors",
  "fair_price_confidence",
  "selectionStage",
  "comparables_exclusions",
  "Estimate confidence",
  "Pewność szacunku",
  "<ProvenanceDetails",
  "No sufficiently similar properties found",
]);
expectIncludes("check comparable evidence", checkPage, [
  "<ComparableEvidencePanel",
  "<RentalEvidencePanel",
  "estimate={analysis.rental_estimate}",
]);
expectIncludes("rental evidence component", rentalEvidence, [
  "Not enough rental data",
  "Za mało danych o najmie",
  "Недостаточно данных об аренде",
  "Недостатньо даних про оренду",
  'estimate.status === "estimated"',
  "estimate.sample_size",
  "estimate.source_names",
  "estimate.assumptions",
  "estimate.comparables",
  "estimate.net_yield_pct",
]);
expectIncludes("listing detail decision hierarchy", read("components/BuyerDecisionPanel.tsx"), [
  "buyer-decision-key-factors",
  "revealDecisionSection",
  "buyer-decision-details",
  "<summary>{copy.sections.decisionDetails}</summary>",
  "buyer-decision-details-body",
]);
expectIncludes("listing detail progressive disclosure", listingDetailPage, [
  "listing-evidence-disclosure",
  "copy.sections.marketEvidence",
  "copy.sections.nextActions",
  "listing-secondary-disclosure",
  "copy.sections.additionalAnalysis",
  "revealNegotiation",
]);
expectNotIncludes("listing detail duplicate decision metrics", listingDetailPage, [
  '<section className="metric-grid">',
]);
expectOrder("listing detail content hierarchy", listingDetailPage, [
  "<BuyerDecisionPanel",
  "listing-evidence-disclosure",
  "listing-decision-actions",
  "listing-secondary-disclosure",
]);
expectIncludes("score explainability", read("components/ScoreBars.tsx"), [
  "scores.explainability",
  "data-score-explanation-version",
  "scoreDimension(scores, row.code)",
  "score-explanation-details",
  "confidence_level",
  "calculation_version",
]);
expectIncludes("score explainability API contract", read("lib/api.ts"), [
  "explainability:",
  "coverage_score",
  "missing_data_codes",
  "score_details",
  "ScoreDimensionExplainability",
]);
expectIncludes("localized score drivers", scoreLabels, [
  "DRIVER_LABELS",
  "price_premium_leverage",
  "premia cenowa wspiera negocjacje",
  "ценовая премия усиливает переговорную позицию",
  "цінова премія посилює переговорну позицію",
]);
expectIncludes("check uses structured score reasons", checkPage, [
  'scoreExplanationReasons(analysis.scores, "investment", locale)',
  'scoreExplanationReasons(analysis.scores, "risk", locale)',
]);
expectNotIncludes("check excludes backend score prose", checkPage, [
  "analysis.scores.reasons",
  "analysis.scores.warnings",
]);
expectNotIncludes("check excludes backend report prose", checkPage, [
  "reportResult.report.summary",
  "reportResult.report.sections",
  "reportResult.report.disclaimer",
]);
expectNotIncludes("report library excludes backend prose", reportsPage, [
  "fallbackSummary={report.summary}",
  "<h3>{report.title}</h3>",
  "<p>{insight.summary}</p>",
]);
expectIncludes("safe localized API errors", read("lib/errorMessages.ts"), [
  "network_error",
  "auth_required",
  "validation_error",
  "bad_request",
  "unsupported_area",
  "location_unavailable",
  "localizedError",
  "pl:",
  "en:",
  "ru:",
  "uk:",
]);
expectIncludes("typed localized buyer decision catalog", buyerDecisionMessages, [
  "Record<Locale, MessageCatalog>",
  "localizeBuyerDecision",
  "localizedSourceEvidence",
  "checklistPl()",
  "checklistEn()",
  "checklistRu()",
  "checklistUk()",
]);
expectIncludes("typed localized property map catalog", propertyMap + propertyMapMessages, [
  "Record<Locale, PropertyMapCopy>",
  "PROPERTY_MAP_COPY[locale]",
  "copy.layers[control]",
  "copy.popup.impactRadius",
  "pl:",
  "en:",
  "ru:",
  "uk:",
]);
expectNotIncludes("property map does not hardcode mixed-language UI", propertyMap, [
  'aria-label="Карта объектов"',
  "planned investments</span>",
  "<span>Риски</span>",
  "Загрузка GIS-слоев",
]);
expectIncludes("buyer decision uses structured localized content", buyerDecisionPanel, [
  "localizeBuyerDecision(decision, locale, confidenceScore)",
  "localized.reasons",
  "localized.risks",
  "localized.negotiationArguments",
  "localizedSourceEvidence(source, locale)",
]);
expectIncludes("evidence-backed negotiation scenario contract", apiClient + generatedApi, [
  'scenario_status: "available" | "insufficient_data"',
  "scenario_confidence_score",
  "limitation_codes",
  "evidence_refs",
  "guardrail_codes",
]);
expectIncludes("negotiation scenario handles evidence and unavailable data", buyerDecisionPanel, [
  "localized.negotiationAvailable",
  "negotiation.opening_offer_pln !== null",
  "localized.negotiationLimitations",
  "item.evidence.map",
  "copyToClipboard(localized.negotiationBrief)",
  'aria-live="polite"',
]);
expectIncludes("localized negotiation brief is structured", buyerDecisionMessages, [
  "negotiationArgument(c, item, locale)",
  "evidenceById.get(reference)",
  "negotiationBrief",
  "exportStatusUnavailable",
]);
expectIncludes("buyer action plan contract is structured", apiClient + generatedApi, [
  "action_plan",
  "BuyerActionEvidence",
  "BuyerActionItem",
  'phase: "before_offer" | "on_viewing" | "after_viewing"',
  "evidence_refs",
]);
expectIncludes("buyer action plan is interactive and persistent", buyerActionPlanPanel, [
  "plan.items.filter",
  'type="checkbox"',
  "window.localStorage.setItem",
  "actionEvidenceLabel",
  "ProvenanceDetails",
  "actionPlanBrief",
]);
expectIncludes("buyer action plan is localized and exportable", buyerActionMessages, [
  "Przed złożeniem oferty",
  "Before making an offer",
  "До предложения",
  "До пропозиції",
  "verify_kw_owner",
  "risk_major_road_noise",
  "exportTitle",
]);
expectIncludes("buyer decision uses one structured action plan", buyerDecisionPanel, [
  "<BuyerActionPlanPanel",
  "plan={decision.action_plan}",
]);
expectNotIncludes("buyer decision excludes backend prose", buyerDecisionPanel, [
  "decision.verdict.top_reasons",
  "decision.verdict.top_risks",
  "decision.verdict.critical_unknowns",
  "negotiation.posture",
  "negotiation.arguments",
  "negotiation.seller_script",
  "dueDiligence.label",
  "dueDiligence.documents_to_request",
  "dueDiligence.questions_for_seller",
  "total.notes",
  "knowledge.known",
  "knowledge.estimated",
  "knowledge.could_not_verify",
  "decision.disclaimer",
]);
expectNotIncludes("consumer analysis excludes legacy negotiation prose", checkPage + listingDetailPage, [
  "analysis.negotiation_arguments.map",
]);
expectNotIncludes("API transport does not inspect raw backend prose", apiTransport, [
  "area statistics are not available",
  "Sign in is required",
  "Keep the plain response body",
]);
expectNotIncludes("consumer errors do not expose raw exception messages", consumerSource, [
  "caught instanceof Error ? caught.message",
]);
expectNotIncludes("consumer components do not expose raw exception messages", consumerComponentSource, [
  "caught instanceof Error ? caught.message",
]);
expectIncludes("API error metadata", apiTransport, ["errorCode", "correlationId", "public readonly code"]);
expectIncludes("actionable check error recovery", read("app/check/page.tsx"), [
  "shouldOpenManualEntry",
  "manualEntryRequested",
  "open={manualEntryOpen}",
]);
expectIncludes("analytics request contract", comparisonApi, [
  "const payload: CompareRequestContract",
  "purchase_intent: purchaseIntent",
]);
expectIncludes("generated operation request types", openApiContract, [
  'operations["compare_listings_api_v1_compare_post"]',
  'operations["save_my_buyer_profile_api_v1_me_buyer_profile_put"]',
]);
expectIncludes("typed API boundary", apiClient, ["import {", 'from "./apiClient"']);
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
expectNotIncludes(
  "stable collection keys",
  [
    read("components/FutureImpactNarrativePanel.tsx"),
    read("components/Charts.tsx"),
    read("app/compare/page.tsx"),
    read("components/compare/ComparePresentation.tsx"),
    read("app/check/page.tsx"),
    read("app/listings/[id]/page.tsx"),
    read("app/news/page.tsx"),
    read("app/areas/compare/page.tsx"),
  ].join("\n"),
  ["key={`${index}-", "key={`${citation.source_id}-${index}`}", "key={`${guardrail.code}-${index}`}"],
);

expectIncludes("primary navigation", layout, [
  "LOCALE_COOKIE_NAME",
  "normalizeLocale",
  "<LocalizedNavigation",
  "<LanguageSwitcher",
  "<DemoModeBanner",
  "<AuthSessionNotice",
  "MOBILE_MENU_LABEL",
  '<details className="mobile-nav-disclosure">',
  '<summary className="mobile-nav-summary">',
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
  "total_purchase_cost_pln",
  "monthly_principal_interest_pln",
  "monthly_non_loan_costs_pln",
  "first_home_pcc_exemption",
  "result.note_codes.map",
  "result.legal_context.sources.map",
  "mortgage-assumptions",
]);
expectNotIncludes("mortgage does not render backend prose", mortgagePage, [
  "{result.disclaimer}",
  "result.notes.map",
  "{scenario.label}",
]);
expectIncludes("mortgage OpenAPI contract", openApiContract, [
  "MortgageCalculationRequestContract",
  "calculate_mortgage_budget_api_v1_mortgage_calculate_post",
]);
expectIncludes("versioned decision funnel events", productAnalyticsSurfaces, [
  'schema_version: "1.0"',
  '"check_started"',
  '"check_completed"',
  '"report_opened"',
  '"verdict_viewed"',
  '"comparables_opened"',
  '"risk_opened"',
  '"negotiation_opened"',
  '"negotiation_message_generated"',
  '"property_saved"',
  '"comparison_started"',
  '"comparison_completed"',
  '"pricing_viewed"',
  '"checkout_started"',
  '"purchase_completed"',
]);
expectNotIncludes("product events do not collect direct identifiers", productAnalytics, [
  "source_url",
  "address",
  "listing_id",
  "report_id",
  "email",
  "phone",
]);
expectIncludes("financial values use tabular numerals", globalStyles, ["font-variant-numeric: tabular-nums"]);
expectIncludes("homepage single heading", explorerPage, ["<h2>{onboarding.title}</h2>"]);
expectNotIncludes("homepage does not duplicate h1", explorerPage, ["<h1>{onboarding.title}</h1>"]);
expectIncludes("localized navigation", localizedNavigation, [
  'href: "/check"',
  'href: "/"',
  'href: "/saved"',
  'href: "/areas"',
  'href="/account?mode=login"',
  'href="/account?mode=register"',
  'className="nav-create-account"',
  "await api.getSession()",
  "caught instanceof ApiError && caught.status === 401",
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
  '"en"',
  '"pl"',
  '"ru"',
  '"uk"',
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
  '"/check"',
  '"/guides"',
  '"/areas"',
  "api.listAreas()",
  'area.area_id !== "wroclaw-city"',
  "SEO_GUIDES.map",
]);
expectNotIncludes("public sitemap excludes contextual and pro routes", sitemap, [
  '"/beta"',
  '"/realtors"',
  '"/compare"',
  '"/developers"',
  '"/market"',
  '"/mortgage"',
  '"/pricing"',
  '"/reports"',
  '"/alerts"',
]);

if (failures.length > 0) {
  console.error(`Frontend smoke failed: ${failures.length} failure(s).`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Frontend smoke passed: ${assertions} assertions.`);
