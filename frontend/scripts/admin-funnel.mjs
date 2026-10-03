import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.BROWSER_BASE_URL ?? "http://127.0.0.1:3000";
const apiBaseUrl = process.env.BROWSER_API_BASE_URL ?? "http://127.0.0.1:8000";
const artifactDir = process.env.BROWSER_ARTIFACT_DIR
  ? path.resolve(process.env.BROWSER_ARTIFACT_DIR)
  : path.join(root, "artifacts", "admin-funnel");
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const failures = [];
const browser = await chromium.launch({ headless: true });

await mkdir(artifactDir, { recursive: true });

const productFunnel = {
  schema_version: "1.0",
  window_days: 30,
  generated_at: "2026-09-30T08:00:00Z",
  total_events: 40,
  unique_journeys: 12,
  stages: [
    { event_name: "check_started", event_count: 17, unique_journeys: 12 },
    { event_name: "analysis_completed", event_count: 9, unique_journeys: 9 },
    { event_name: "buyer_outcome", event_count: 5, unique_journeys: 5 },
    { event_name: "payment_completed", event_count: 3, unique_journeys: 3 },
  ],
};

const adminResponses = {
  "/runtime-context": { data_mode: "live", demo_mode_enabled: false },
  "/api/v1/auth/session": {
    user: {
      id: "admin-browser-user",
      email: "admin-browser@wartometr.local",
      display_name: "Admin Browser",
      role: "admin",
      created_at: "2026-09-30T08:00:00Z",
      updated_at: "2026-09-30T08:00:00Z",
    },
    expires_at: "2026-10-30T08:00:00Z",
    demo_mode: false,
  },
  "/api/v1/admin/ingestion/jobs": [],
  "/api/v1/admin/ingestion/source-health": [],
  "/api/v1/admin/ingestion/source-checks": [],
  "/api/v1/admin/ingestion/source-errors": [],
  "/api/v1/admin/ingestion/sources": [],
  "/api/v1/developers": { items: [], total: 0, limit: 100, offset: 0 },
  "/api/v1/admin/scoring/backtest": { evaluated_points: 0 },
  "/api/v1/admin/scoring/backtest-report": null,
  "/api/v1/admin/product-funnel": productFunnel,
  "/api/v1/admin/data-quality/logs": [],
  "/api/v1/admin/raw-listings": [],
  "/api/v1/admin/deduplication/matches": [],
  "/api/v1/admin/planned-investments": [],
  "/api/v1/admin/partner-referrals": [],
  "/api/v1/admin/audit-logs": [],
  "/api/v1/admin/data-deletion-requests": [],
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, X-Domarion-Email, X-Domarion-Plan, X-Domarion-Role, X-Domarion-User-Id",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Origin": baseUrl,
    "Content-Type": "application/json",
  };
}

async function mockAdminApi(page, seenRequests, unexpectedRequests) {
  await page.route(`${apiBaseUrl}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    seenRequests.add(pathname);

    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders(), body: "" });
      return;
    }

    if (Object.hasOwn(adminResponses, pathname)) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders(),
        body: JSON.stringify(adminResponses[pathname]),
      });
      return;
    }

    unexpectedRequests.push(`${request.method()} ${pathname}`);
    await route.fulfill({
      status: 404,
      headers: corsHeaders(),
      body: JSON.stringify({ detail: { code: "unexpected_admin_browser_request" } }),
    });
  });
}

async function observe(page) {
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    const text = message.text();
    if (
      message.type() === "error" &&
      text !== "Failed to load resource: the server responded with a status of 404 (Not Found)"
    ) {
      browserErrors.push(text);
    }
  });
  page.on("requestfailed", (request) => {
    if (request.failure()?.errorText !== "net::ERR_ABORTED") {
      browserErrors.push(`${request.url()}: ${request.failure()?.errorText ?? "unknown"}`);
    }
  });
  return browserErrors;
}

async function runCase(viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const browserErrors = await observe(page);
  const seenRequests = new Set();
  const unexpectedRequests = [];
  await mockAdminApi(page, seenRequests, unexpectedRequests);

  try {
    await page.goto(`${baseUrl}/admin`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Internal Admin", exact: true }).waitFor();
    const funnel = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Buyer decision funnel", exact: true }),
    });
    await funnel.waitFor({ state: "visible", timeout: 15000 });

    const text = await funnel.innerText();
    for (const expected of [
      "Aggregate only",
      "last 30 days",
      "Started checks",
      "12",
      "Completed checks",
      "9",
      "75.0%",
      "Helpful buyer decisions",
      "5",
      "55.6%",
      "Paid checks",
      "3",
      "25.0%",
      "Repeat check signal",
      "extra check_started events",
      "Privacy boundary",
      "raw journeys, users, listings, reports, orders or URLs",
      "check_started",
      "analysis_completed",
      "buyer_outcome",
      "payment_completed",
    ]) {
      assert.equal(text.includes(expected), true, `${viewport.name}: missing ${expected}`);
    }

    const layout = await page.evaluate(() => ({
      h1Count: document.querySelectorAll("h1").length,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    }));
    assert.equal(layout.h1Count, 1, `${viewport.name}: expected one h1`);
    assert.equal(layout.overflow, false, `${viewport.name}: page has horizontal overflow`);
    assert.equal(browserErrors.length, 0, `${viewport.name}: browser errors ${browserErrors.join(" | ")}`);
    assert.deepEqual(unexpectedRequests, [], `${viewport.name}: unexpected API requests`);
    assert.equal(
      seenRequests.has("/api/v1/admin/product-funnel"),
      true,
      `${viewport.name}: product funnel API was not requested`,
    );

    await page.screenshot({
      fullPage: true,
      path: path.join(artifactDir, `admin-funnel-${viewport.name}.png`),
    });
  } finally {
    await context.close();
  }
}

try {
  for (const viewport of viewports) {
    try {
      await runCase(viewport);
      console.log(`admin funnel passed: ${viewport.name}`);
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Admin buyer decision funnel passed for desktop and mobile.");
}
