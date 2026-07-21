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
const explorerPage = read("app/page.tsx");
const listingCard = read("components/ListingCard.tsx");
const mapComponent = read("components/PropertyMap.tsx");
const reportsPage = read("app/reports/page.tsx");
const adminPage = read("app/admin/page.tsx");
const accountPage = read("app/account/page.tsx");
const areasPage = read("app/areas/page.tsx");
const areaDetailPage = read("app/areas/[areaId]/page.tsx");
const listingDetailPage = read("app/listings/[id]/page.tsx");
const pricingPage = read("app/pricing/page.tsx");
const buyerBetaPage = read("app/beta/page.tsx");
const realtorsPage = read("app/realtors/page.tsx");
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
]);

expectIncludes("account CRM workspace", accountPage, [
  "Agency CRM",
  "createAgencyCrmClient",
  "createAgencyCrmShortlist",
  "previewAgencyCrmShortlistShare",
  "CrmSharePreviewBlock",
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
  "useLocalePreference()",
  "copy.filters.title",
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
  "api.generateReport(",
  "api.emailReport(",
  "api.listAIInsights(",
  "reportContentUrl(report.id)",
  "reportPdfUrl(report.id)",
  "reportExportUrl(\"csv\")",
  "reportExportUrl(\"json\")",
]);
expectRegex("reports mobile table wrapper", reportsPage, /table-scroll[\s\S]*reports\.map/);

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
  "api.mockPayReportOrder(",
  "api.fulfillReportOrder(",
  "api.listReportOrderEvents(",
  "reportContentUrl(order.generated_report_id)",
  "billingPayload(billingForm)",
]);

expectIncludes("buyer beta landing", buyerBetaPage, [
  "Проверка квартиры перед покупкой",
  "href=\"/check?source=buyer-beta\"",
  "href=\"/pricing?source=buyer-beta\"",
  "BetaLeadForm",
  "segment=\"buyer_beta\"",
  "LandingMapScene",
  "Source URL хранится как приватный reference",
]);

expectIncludes("realtor beta landing", realtorsPage, [
  "Аналитика и отчеты для риелторов",
  "href=\"/pricing?source=realtor-beta\"",
  "href=\"/reports?source=realtor-beta\"",
  "BetaLeadForm",
  "segment=\"realtor_beta\"",
  "Realtor branded report",
  "LandingMapScene",
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
  "href=\"/pricing\"",
  "href=\"/check\"",
]);

expectIncludes("area guide internal links", areasPage, [
  "SEO_GUIDES.slice(0, 4)",
  "href=\"/guides\"",
  "href={`/guides/${guide.slug}`}",
]);

expectIncludes("area detail guide internal links", areaDetailPage, [
  "relatedGuides",
  "guide.relatedAreaSlugs.includes(area.slug)",
  "href={`/guides/${guide.slug}`}",
]);

expectIncludes("listing detail guide internal links", listingDetailPage, [
  "SEO_GUIDES.slice(0, 3)",
  "href={`/guides/${guide.slug}`}",
  "<BookOpen",
]);
expectRegex(
  "listing detail mobile table wrappers",
  listingDetailPage,
  /История цены[\s\S]*table-scroll[\s\S]*Похожие объекты[\s\S]*table-scroll/,
);

expectIncludes("primary navigation", layout, [
  "LOCALE_COOKIE_NAME",
  "normalizeLocale",
  "<LocalizedNavigation",
  "<LanguageSwitcher",
]);
expectIncludes("localized navigation", localizedNavigation, [
  "href: \"/beta\"",
  "href: \"/realtors\"",
  "href: \"/guides\"",
  "href: \"/reports\"",
  "href: \"/pricing\"",
  "href: \"/admin\"",
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
  "\"/beta\"",
  "\"/realtors\"",
  "\"/guides\"",
  "SEO_GUIDES.map",
  "\"/pricing\"",
  "\"/reports\"",
]);

if (failures.length > 0) {
  console.error(`Frontend smoke failed: ${failures.length} failure(s).`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Frontend smoke passed: ${assertions} assertions.`);
