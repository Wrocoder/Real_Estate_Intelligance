import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium, request } from "playwright";

const baseUrl = process.env.BROWSER_BASE_URL ?? "http://127.0.0.1:3000";
const apiBaseUrl = process.env.BROWSER_API_BASE_URL ?? "http://127.0.0.1:8000";
const scenario = process.argv[2] ?? process.env.CHECK_ENTRY_SCENARIO ?? "all";
const allowedScenarios = new Set([
  "all",
  "entry-confirmation",
  "anonymous-entry",
  "legacy-search-area-context",
  "outcome-prompt",
  "sign-in-recovery",
]);
assert.equal(
  allowedScenarios.has(scenario),
  true,
  `unknown check-entry scenario: ${scenario}; expected one of ${Array.from(allowedScenarios).join(", ")}`,
);
const artifacts = path.resolve("artifacts", "check-entry");
await fs.mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [];
const listingUrl = "https://www.otodom.pl/pl/oferta/phase-one-IDtest";
const fields = {
  address: "ul. Testowa 1", city: "Wrocław", district: "Fabryczna",
  market_type: "secondary", price: 650000, area_m2: 55, rooms: 3,
  floor: 2, building_floors: 5, building_year: 2010,
};
const testUser = {
  id: "browser-outcome-user",
  email: "browser-outcome@wartometr.local",
  display_name: "Browser outcome test",
  role: "buyer",
  created_at: "2026-09-28T00:00:00Z",
  updated_at: "2026-09-28T00:00:00Z",
};
const testAccount = {
  user: testUser,
  subscription: {
    id: "browser-outcome-subscription",
    user_id: testUser.id,
    plan: "free",
    status: "active",
    current_period_start: null,
    current_period_end: null,
    created_at: "2026-09-28T00:00:00Z",
    updated_at: "2026-09-28T00:00:00Z",
  },
  limits: {
    plan: "free",
    max_favorites: 3,
    max_alerts: 1,
    monthly_reports: 0,
    max_compare_items: 3,
    can_export: false,
    can_use_api: false,
    can_white_label: false,
  },
  usage: {
    favorites: 0,
    alerts: 0,
    reports_this_month: 0,
    report_credits_available: 0,
  },
  buyer_profile: null,
};

function imported(overrides = {}) {
  return {
    status: "extracted", fields, fields_extracted: Object.keys(fields),
    extraction_source: "json-ld", fetched_at: "2026-09-16T10:00:00Z",
    fetch_status_code: 200, warnings: [],
    reference_preview: {
      source_url_private: listingUrl, source_domain: "otodom.pl", provider: "otodom",
      provider_label: "Otodom", manual_fields_required: [], manual_fields_recommended: [],
      privacy_note: "", warnings: [],
    },
    ...overrides,
  };
}

function shouldRun(name) {
  return scenario === "all" || scenario === name;
}

async function baselineAnalysis() {
  const response = await fetch(`${apiBaseUrl}/api/v1/listings/wr-001/analysis`);
  assert.equal(response.status, 200, "local test API must expose wr-001 analysis");
  return response.json();
}

function privateAnalysisPayload(analysis) {
  return {
    analysis: {
      ...analysis,
      listing: {
        ...analysis.listing,
        id: "private-check-browser-fixture",
        address: fields.address,
        city: fields.city,
        district: fields.district,
        market_type: fields.market_type,
        price: fields.price,
        area_m2: fields.area_m2,
        rooms: fields.rooms,
      },
    },
    confidence_score: analysis.scores?.fair_price_confidence_score ?? 70,
    source_url_private: listingUrl,
    source_domain: "otodom.pl",
    warnings: [],
    comparables_basis: "Controlled browser fixture for the private check result.",
    retention_note: "Browser verification fixture; not a production retention statement.",
    draft_id: "draft-outcome-browser",
    draft_expires_at: "2026-10-28T00:00:00Z",
  };
}

async function contextFor(locale, width) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  await context.addCookies([{ name: "domarion_locale", value: locale, url: baseUrl }]);
  await context.addInitScript((value) => localStorage.setItem("domarion-locale", value), locale);
  return context;
}

async function healthy(page) {
  assert.equal(await page.locator("h1").count(), 1);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
}

async function fillStableCheckEntry(page, sourceUrl, consentLabel) {
  const urlInput = page.locator('input[type="url"]');
  const consent = page.getByLabel(consentLabel);
  await urlInput.waitFor();
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await urlInput.fill(sourceUrl);
    await consent.check();
    await page.waitForTimeout(750);
    if ((await urlInput.inputValue()) === sourceUrl && await consent.isChecked()) return;
  }
  assert.equal(await urlInput.inputValue(), sourceUrl, "listing URL stayed in the check form");
  assert.equal(await consent.isChecked(), true, "private-analysis consent stayed checked");
}

async function waitForCheckSubmitEnabled(page, label) {
  try {
    await page.locator(".check-submit:not(:disabled)").waitFor({ timeout: 15000 });
  } catch (error) {
    const state = await page.evaluate(() => ({
      sourceUrl: document.querySelector('input[type="url"]')?.value ?? null,
      consentChecked: document.querySelector('input[type="checkbox"]')?.checked ?? null,
      urlDisabled: document.querySelector('input[type="url"]')?.disabled ?? null,
      submitDisabled: document.querySelector(".check-submit")?.disabled ?? null,
      busy: document.querySelector(".check-hero")?.getAttribute("aria-busy"),
      status: document.querySelector(".status-line")?.textContent,
    }));
    throw new Error(`${label}: check submit stayed disabled; state=${JSON.stringify(state)}; ${error.message}`);
  }
}

async function run(name, test) {
  try { await test(); console.log(`check entry passed: ${name}`); }
  catch (error) { failures.push(`${name}: ${error.message}`); }
}

try {
  if (shouldRun("entry-confirmation")) {
    for (const [locale, heading, confirmation] of [
      ["pl", "Sprawdź mieszkanie przed zakupem", "Potwierdź dane i analizuj"],
      ["en", "Check an apartment before buying", "Confirm details and analyze"],
      ["ru", "Проверьте квартиру перед покупкой", "Подтвердить данные и анализировать"],
      ["uk", "Перевірте квартиру перед купівлею", "Підтвердити дані й аналізувати"],
    ]) {
      for (const width of [1440, 768, 390]) {
        await run(`${locale}/${width}: entry and confirmation`, async () => {
          const context = await contextFor(locale, width);
          const page = await context.newPage();
          const errors = [];
          let analysisCalls = 0;
          page.on("pageerror", (error) => errors.push(error.message));
          page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
          page.on("requestfailed", (request) => {
            if (request.failure()?.errorText !== "net::ERR_ABORTED") errors.push(request.url());
          });
          page.on("request", (request) => {
            if (/user-submitted-listings\/(analyze|report)$/.test(request.url())) analysisCalls += 1;
          });
          await page.route("**/user-submitted-listings/import-from-url", (route) => route.fulfill({ json: imported() }));
          try {
            await page.goto(baseUrl, { waitUntil: "networkidle" });
            await page.getByRole("heading", { name: heading, exact: true }).waitFor();
            await healthy(page);
            await page.screenshot({ path: path.join(artifacts, `${locale}-${width}-entry.png`), fullPage: true });
            await page.locator('input[type="url"]').fill(listingUrl);
            await page.getByRole("checkbox").check();
            await page.locator(".check-submit").click();
            await page.getByRole("button", { name: confirmation, exact: true }).waitFor();
            assert.equal(analysisCalls, 0, "import ran analysis before confirmation");
            assert.equal(await page.locator('.essential-fields input').nth(0).inputValue(), fields.address);
            await healthy(page);
            await page.screenshot({ path: path.join(artifacts, `${locale}-${width}-confirmation.png`), fullPage: true });
            await page.reload({ waitUntil: "networkidle" });
            await page.getByRole("button", { name: confirmation, exact: true }).waitFor();
            assert.equal(await page.locator('input[type="url"]').inputValue(), listingUrl);
            assert.equal(await page.getByRole("checkbox").isChecked(), true);
            assert.equal(analysisCalls, 0, "restoration ran analysis");
            await page.locator('input[type="url"]').fill(`${listingUrl}-other`);
            assert.equal(await page.locator('.essential-fields input').nth(0).inputValue(), "");
            assert.equal(await page.locator('.essential-fields select').inputValue(), "");
            assert.deepEqual(errors, []);
          } finally { await context.close(); }
        });
      }
    }
  }

  if (shouldRun("anonymous-entry")) await run("anonymous entry does not request a private profile", async () => {
    const context = await contextFor("pl", 390);
    const page = await context.newPage();
    let profileCalls = 0;
    await page.route("**/api/v1/auth/session", (route) => route.fulfill({
      status: 401, json: { error: { code: "auth_required" } },
    }));
    await page.route("**/api/v1/me", (route) => {
      profileCalls += 1;
      return route.fulfill({ status: 401, json: { error: { code: "auth_required" } } });
    });
    try {
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      assert.equal(profileCalls, 0);
      assert.equal(await page.locator(".auth-notice").count(), 0);
      await healthy(page);
    } finally { await context.close(); }
  });

  if (shouldRun("legacy-search-area-context")) await run("legacy search and area context", async () => {
    const context = await contextFor("pl", 390);
    const page = await context.newPage();
    try {
      await page.goto(`${baseUrl}/?district=Krzyki&rooms=3&maxPrice=800000`, { waitUntil: "domcontentloaded" });
      assert.equal(new URL(page.url()).pathname, "/search");
      assert.equal(new URL(page.url()).searchParams.get("rooms"), "3");
      await page.getByRole("heading", { name: "Znajdź mieszkania warte sprawdzenia" }).waitFor();
      await healthy(page);
      await page.goto(`${baseUrl}/check?district=Krzyki&city=Wroc%C5%82aw`, { waitUntil: "networkidle" });
      await page.waitForFunction(() => {
        const district = document.querySelector('[aria-label="Dzielnica"]');
        const city = document.querySelector('[aria-label="Miasto"]');
        return district?.value === "Krzyki" && city?.value === "Wrocław";
      });
      assert.equal(await page.getByLabel("Dzielnica", { exact: true }).inputValue(), "Krzyki");
      await page.route("**/user-submitted-listings/import-from-url", (route) => route.fulfill({
        json: imported({ status: "partial", fields: { price: 650000, area_m2: 55 }, fields_extracted: ["price", "area_m2"] }),
      }));
      await page.locator('input[type="url"]').fill(listingUrl);
      await page.getByRole("checkbox").check();
      await page.locator(".check-submit").click();
      await page.getByRole("button", { name: "Potwierdź dane i analizuj" }).waitFor();
      assert.equal(await page.getByLabel("Dzielnica", { exact: true }).inputValue(), "");
      assert.equal(await page.getByLabel("Miasto", { exact: true }).inputValue(), "");
      assert.equal(await page.getByLabel("Rynek", { exact: true }).inputValue(), "");
      await healthy(page);
    } finally { await context.close(); }
  });

  if (shouldRun("outcome-prompt")) await run("buyer outcome prompt after analysis", async () => {
    const analysis = await baselineAnalysis();
    const context = await contextFor("en", 390);
    const page = await context.newPage();
    const errors = [];
    const productEvents = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("requestfailed", (request) => {
      if (request.failure()?.errorText !== "net::ERR_ABORTED") errors.push(request.url());
    });
    await page.route("**/runtime-context", (route) => route.fulfill({
      json: { data_mode: "demo", demo_mode_enabled: true },
    }));
    await page.route("**/api/v1/auth/session", (route) => route.fulfill({
      json: { user: testUser, expires_at: "2026-09-29T00:00:00Z", demo_mode: true },
    }));
    await page.route("**/api/v1/me", (route) => route.fulfill({ json: testAccount }));
    await page.route("**/api/v1/coverage", (route) => route.fulfill({
      json: {
        supported_cities: ["Wrocław"],
        supported_districts: ["Fabryczna"],
        source_name: "Browser verification fixture",
        checked_at: "2026-09-28T00:00:00Z",
        freshness_note: "Controlled browser fixture.",
      },
    }));
    await page.route("**/api/v1/ai/questions", (route) => route.fulfill({ json: [] }));
    await page.route("**/api/v1/user-submitted-listings/drafts/*/documents", (route) => route.fulfill({ json: [] }));
    await page.route("**/user-submitted-listings/import-from-url", (route) => route.fulfill({ json: imported() }));
    await page.route("**/user-submitted-listings/analyze", (route) => route.fulfill({
      status: 201,
      json: privateAnalysisPayload(analysis),
    }));
    await page.route("**/api/v1/product-events", async (route) => {
      const payload = route.request().postDataJSON();
      productEvents.push(payload);
      await route.fulfill({
        status: 202,
        json: {
          accepted: true,
          event_name: payload.event_name,
          schema_version: payload.schema_version,
        },
      });
    });
    try {
      await page.goto(`${baseUrl}/check`, { waitUntil: "networkidle" });
      await page.getByRole("heading", { name: "Check an apartment before buying", exact: true }).waitFor();
      await page.locator('input[type="url"]').fill(listingUrl);
      await page.getByRole("checkbox").check();
      await page.locator(".check-submit").click();
      await page.getByRole("button", { name: "Confirm details and analyze", exact: true }).click();
      await page.locator(".buyer-outcome-panel").waitFor();
      await page.getByText("We do not store the listing link, address, account or notes with this answer.", { exact: true }).waitFor();
      await page.getByRole("button", { name: "I negotiated", exact: true }).click();
      await page.getByText("Choose whether the analysis influenced the decision to send the anonymous answer.", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Yes", exact: true }).click();
      await page.getByText("Thanks. We saved only this anonymous category.", { exact: false }).waitFor();
      assert.equal(await page.locator(".buyer-outcome-panel button:disabled").count(), 7, "submitted outcome controls are disabled");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, "horizontal overflow");
      const buyerOutcomeEvents = productEvents.filter((event) => event.event_name === "buyer_outcome");
      assert.equal(buyerOutcomeEvents.length, 1, "buyer_outcome should be recorded once");
      assert.deepEqual(buyerOutcomeEvents[0].properties, {
        surface: "check",
        outcome: "negotiated",
        decision_impact: "yes",
      });
      for (const forbidden of ["source_url", "address", "listing_id", "report_id", "email", "phone", "notes"]) {
        assert.equal(JSON.stringify(buyerOutcomeEvents[0]).includes(forbidden), false, `event leaks ${forbidden}`);
      }
      await page.screenshot({ path: path.join(artifacts, "outcome-prompt-en-390.png"), fullPage: true });
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });

  if (shouldRun("sign-in-recovery")) await run("sign-in recovery, confirmation and draft reopening", async () => {
    const context = await contextFor("pl", 390);
    await context.addInitScript(() => sessionStorage.removeItem("wartometr-check-entry-v1"));
    const email = `check-entry-${Date.now()}@domarion.local`;
    const page = await context.newPage();
    let requireSignIn = true;
    let analysisCalls = 0;
    page.on("request", (request) => {
      if (request.url().endsWith("/user-submitted-listings/analyze")) analysisCalls += 1;
    });
    try {
      await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: "Sprawdź mieszkanie przed zakupem", exact: true }).waitFor();
      await page.getByText("Auto-import nie był uruchomiony", { exact: true }).waitFor();
      await fillStableCheckEntry(page, listingUrl, /Rozumiem, że WartoMetr pobierze/);
      await waitForCheckSubmitEnabled(page, "before choosing purchase intent");
      await page.getByRole("button", { name: "Na inwestycję", exact: true }).click();
      await waitForCheckSubmitEnabled(page, "after choosing purchase intent");
      await page.route("**/user-submitted-listings/import-from-url", (route) => route.fulfill(requireSignIn
        ? { status: 401, json: { error: { code: "auth_required" } } }
        : { json: imported() }));
      await page.locator(".check-submit").click();
      const auth = page.locator(".check-auth-recovery");
      await auth.waitFor();
      const apiContext = await request.newContext({ baseURL: apiBaseUrl });
      try {
        const registration = await apiContext.post("/api/v1/auth/register", {
          data: { email, password: "CheckEntry-123!", display_name: "Entry test" },
        });
        assert.equal(registration.status(), 201);
      } finally {
        await apiContext.dispose();
      }
      await auth.getByLabel("Adres e-mail").fill(email);
      await auth.getByLabel("Hasło (minimum 10 znaków)", { exact: true }).fill("CheckEntry-123!");
      await auth.getByRole("button", { name: "Zaloguj się", exact: true }).click();
      await auth.waitFor({ state: "hidden" });
      assert.equal(await page.locator('input[type="url"]').inputValue(), listingUrl);
      assert.equal(await page.getByLabel(/Rozumiem, że WartoMetr pobierze/).isChecked(), true);
      assert.match(await page.getByRole("button", { name: "Na inwestycję", exact: true }).getAttribute("class"), /selected/);
      requireSignIn = false;
      await waitForCheckSubmitEnabled(page, "after auth recovery");
      await page.locator(".check-submit").click();
      const responsePromise = page.waitForResponse((response) => response.url().endsWith("/user-submitted-listings/analyze"));
      await page.getByRole("button", { name: "Potwierdź dane i analizuj" }).click();
      const result = await (await responsePromise).json();
      await page.locator(".buyer-decision").waitFor();
      assert.equal(analysisCalls, 1);
      await page.locator("summary").filter({ hasText: "Sprawdzenie dokumentu" }).click();
      await page.getByLabel("Typ dokumentu").selectOption("floor_plan");
      await page.getByLabel("Notatka lub krótki tekst z dokumentu").fill("Rzut lokalu. Powierzchnia 55 m2 zgodnie z dokumentem.");
      await page.getByLabel("Mam prawo użyć tego dokumentu do prywatnej analizy.").check();
      const documentResponsePromise = page.waitForResponse((response) => response.url().includes("/documents/analyze"));
      await page.getByRole("button", { name: "Sprawdź dokument", exact: true }).click();
      const documentResponse = await documentResponsePromise;
      assert.equal(documentResponse.status(), 201);
      const documentPayload = await documentResponse.json();
      assert.equal(documentPayload.document_type, "floor_plan");
      await page.getByText("area_match", { exact: true }).waitFor();
      await page.getByText("Oryginalny plik domyślnie nie jest przechowywany.", { exact: true }).waitFor();
      await healthy(page);
      await page.screenshot({ path: path.join(artifacts, "result-mobile.png"), fullPage: true });
      await page.goto(`${baseUrl}/check?draft=${encodeURIComponent(result.draft_id)}`, { waitUntil: "networkidle" });
      await page.locator(".buyer-decision").waitFor();
      assert.equal(analysisCalls, 1, "draft reopening repeated analysis");
      await page.getByRole("button", { name: "Sprawdź kolejne mieszkanie" }).click();
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(await page.locator('input[type="url"]').inputValue(), "");
    } finally { await context.close(); }
  });
} finally { await browser.close(); }

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}
