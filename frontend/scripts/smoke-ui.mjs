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
const pricingPage = read("app/pricing/page.tsx");
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
  "createReportOrder",
  "/api/v1/report-orders",
  "mockPayReportOrder",
  "/mock-pay",
  "fulfillReportOrder",
  "/fulfill",
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
  "api.listAdminIngestionJobs()",
  "api.listAdminDataQualityLogs(",
  "api.listAdminRawListings(",
  "api.listAdminPlannedInvestments(",
  "api.listAdminPartnerReferrals(",
  "api.listAdminAuditLogs(",
  "api.listAdminDeduplicationMatches(",
  "api.deliverAdminDailyEmailAlerts(",
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

expectIncludes("primary navigation", layout, [
  "href=\"/reports\"",
  "href=\"/pricing\"",
  "href=\"/admin\"",
]);
expectIncludes("public sitemap", sitemap, [
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
