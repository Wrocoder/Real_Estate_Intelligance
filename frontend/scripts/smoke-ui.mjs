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
const apiClient = read("lib/api.ts");
const explorerPage = read("app/page.tsx");
const mapComponent = read("components/PropertyMap.tsx");
const reportsPage = read("app/reports/page.tsx");
const adminPage = read("app/admin/page.tsx");
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
const sitemap = read("app/sitemap.ts");

expectIncludes("package scripts", JSON.stringify(packageJson.scripts), [
  "\"build\"",
  "\"lint\"",
  "\"smoke\"",
  "\"typecheck\"",
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
  "createReportOrder",
  "/api/v1/report-orders",
  "mockPayReportOrder",
  "/mock-pay",
  "fulfillReportOrder",
  "/fulfill",
  "listingDatasetExportUrl",
  "/api/v1/datasets/listings/export",
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
]);
expectRegex("search explorer filters", explorerPage, /type Filters = \{[\s\S]*maxBuildingFloors/);
expectMinSize("search explorer page", explorerPage, 20_000);

expectIncludes("map component", mapComponent, [
  "DEFAULT_VISIBLE_LAYERS",
  "normalizeVisibleLayers",
  "LISTING_HEATMAP_SOURCE_ID",
  "INFRASTRUCTURE_LAYER_CONTROLS",
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

expectIncludes("admin page", adminPage, [
  "Leads & Partner Referrals",
  "api.listAdminIngestionJobs()",
  "api.listAdminDataQualityLogs(",
  "api.listAdminRawListings(",
  "api.listAdminPlannedInvestments(",
  "api.listAdminPartnerReferrals(",
  "api.listAdminAuditLogs(",
  "api.listAdminDeduplicationMatches(",
  "api.deliverAdminDailyEmailAlerts(",
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

expectIncludes("primary navigation", layout, [
  "href=\"/beta\"",
  "href=\"/realtors\"",
  "href=\"/guides\"",
  "href=\"/reports\"",
  "href=\"/pricing\"",
  "href=\"/admin\"",
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
