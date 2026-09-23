import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.BROWSER_BASE_URL ?? "http://127.0.0.1:3000";
const apiBaseUrl = process.env.BROWSER_API_BASE_URL ?? "http://127.0.0.1:8000";
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

async function run(name, test) {
  try { await test(); console.log(`check entry passed: ${name}`); }
  catch (error) { failures.push(`${name}: ${error.message}`); }
}

try {
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

  await run("anonymous entry does not request a private profile", async () => {
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

  await run("legacy search and area context", async () => {
    const context = await contextFor("pl", 390);
    const page = await context.newPage();
    try {
      await page.goto(`${baseUrl}/?district=Krzyki&rooms=3&maxPrice=800000`, { waitUntil: "domcontentloaded" });
      assert.equal(new URL(page.url()).pathname, "/search");
      assert.equal(new URL(page.url()).searchParams.get("rooms"), "3");
      await page.getByRole("heading", { name: "Znajdź mieszkania warte sprawdzenia" }).waitFor();
      await healthy(page);
      await page.goto(`${baseUrl}/check?district=Krzyki&city=Wroc%C5%82aw`, { waitUntil: "networkidle" });
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

  await run("sign-in recovery, confirmation and draft reopening", async () => {
    const context = await contextFor("pl", 390);
    const email = `check-entry-${Date.now()}@domarion.local`;
    const registration = await context.request.post(`${apiBaseUrl}/api/v1/auth/register`, {
      data: { email, password: "CheckEntry-123!", display_name: "Entry test" },
    });
    assert.equal(registration.status(), 201);
    await context.clearCookies({ name: "domarion_session" });
    const page = await context.newPage();
    let requireSignIn = true;
    let analysisCalls = 0;
    page.on("request", (request) => {
      if (request.url().endsWith("/user-submitted-listings/analyze")) analysisCalls += 1;
    });
    await page.route("**/user-submitted-listings/import-from-url", (route) => route.fulfill(requireSignIn
      ? { status: 401, json: { error: { code: "auth_required" } } }
      : { json: imported() }));
    try {
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await page.locator('input[type="url"]').fill(listingUrl);
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: "Na inwestycję", exact: true }).click();
      await page.locator(".check-submit").click();
      const auth = page.locator(".check-auth-recovery");
      await auth.getByLabel("Adres e-mail").fill(email);
      await auth.getByLabel("Hasło (minimum 10 znaków)", { exact: true }).fill("CheckEntry-123!");
      await auth.getByRole("button", { name: "Zaloguj się", exact: true }).click();
      await auth.waitFor({ state: "hidden" });
      assert.equal(await page.locator('input[type="url"]').inputValue(), listingUrl);
      assert.equal(await page.getByRole("checkbox").isChecked(), true);
      assert.match(await page.getByRole("button", { name: "Na inwestycję", exact: true }).getAttribute("class"), /selected/);
      requireSignIn = false;
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
