import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.BROWSER_BASE_URL ?? "http://127.0.0.1:3000";
const apiUrl = process.env.BROWSER_API_BASE_URL ?? "http://127.0.0.1:8010";
const response = await fetch(`${apiUrl}/api/v1/listings/wr-001/analysis`);
assert.equal(response.status, 200);
const baseline = await response.json();
assert.ok(baseline.scores.fair_price_evidence, "API must return actual calculation evidence");
await fs.mkdir("artifacts/fair-price-evidence", { recursive: true });
const titles = { pl: "Jak powstał szacowany zakres?", en: "How was the estimated range calculated?", ru: "Как рассчитан оценочный диапазон?", uk: "Як розраховано оціночний діапазон?" };
const browser = await chromium.launch();
let passed = 0;
const failures = [];

async function run(name, locale, width, mutate = () => {}, verify = async () => {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  await context.addCookies([{ name: "domarion_locale", value: locale, url: baseUrl }]);
  await context.addInitScript(value => localStorage.setItem("domarion-locale", value), locale);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("requestfailed", request => { if (request.failure()?.errorText !== "net::ERR_ABORTED") errors.push(request.failure()?.errorText); });
  const fixture = structuredClone(baseline);
  mutate(fixture);
  await page.route("**/api/v1/listings/wr-001/analysis", route => route.fulfill({ json: fixture }));
  try {
    await page.goto(`${baseUrl}/listings/wr-001`, { waitUntil: "networkidle" });
    const section = page.locator(".fair-price-evidence");
    assert.equal(await section.isVisible(), false, "evidence should start collapsed");
    const disclosure = page.locator("details").filter({ has: section }).last();
    await disclosure.locator(":scope > summary").click();
    await page.getByRole("heading", { name: titles[locale], exact: true }).waitFor();
    assert.doesNotMatch(await section.innerText(), /NaN|undefined|Invalid Date/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await verify(page, section);
    await section.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `artifacts/fair-price-evidence/${name}-${locale}-${width}.png`, fullPage: false });
    assert.deepEqual(errors, []);
    passed++;
    console.log(`fair price evidence passed: ${name}/${locale}/${width}`);
  } catch (error) { failures.push(`${name}/${locale}/${width}: ${error.message}`); }
  finally { await context.close(); }
}

try {
  for (const locale of Object.keys(titles)) {
    for (const width of [1440, 768, 390]) {
      await run("area-only", locale, width, () => {}, async (_page, section) => {
        assert.equal(await section.locator(".fair-price-adjustments").count(), 1);
        assert.match(await section.innerText(), /100%/);
      });
    }
  }
  await run("transactions", "pl", 390, data => {
    data.scores.fair_price_evidence.area_price_basis = "transaction_observed";
    Object.assign(data.area_statistics, { transaction_observation_count: 987, transaction_observed_from: "2026-01-01T00:00:00", transaction_observed_to: "2026-08-01T00:00:00" });
  }, async (_page, section) => {
    assert.match(await section.innerText(), /987/);
    assert.match(await section.locator(".fair-price-transaction-note").innerText(), /nie lista transakcji mieszkań/);
  });
  await run("blended", "en", 1440, data => {
    Object.assign(data.scores.fair_price_evidence, { method: "area_and_listing_medians", area_weight: 0.8, listing_weight: 0.2, listing_median_per_m2: 12000, listings_used_count: 3 });
  }, async (_page, section) => {
    assert.match(await section.innerText(), /80%/);
    assert.match(await section.innerText(), /20%/);
    assert.doesNotMatch(await section.innerText(), /Too few comparable listings/);
  });
  await run("legacy", "pl", 390, data => { delete data.scores.fair_price_evidence; }, async (_page, section) => {
    assert.match(await section.innerText(), /nie są dostępne/);
    assert.equal(await section.locator("dl").count(), 0);
  });
  await run("missing", "en", 390, data => {
    data.scores.fair_price_evidence.area_price_basis = "unknown";
    data.area_statistics.data_sources = [];
    data.area_statistics.data_provenance = { mode: "live", source_type: "unknown" };
    data.scores.fair_price_confidence.median_similarity_score = null;
    data.scores.fair_price_confidence.price_dispersion_pct = null;
  }, async (page, section) => {
    assert.match(await section.innerText(), /Not available/);
    assert.match(await section.innerText(), /sample count is unavailable or insufficient/);
    const consistency = page.locator(".comparable-confidence li").filter({ hasText: "Price consistency" });
    assert.doesNotMatch(await consistency.innerText(), /55\/100/);
  });
} finally { await browser.close(); }
console.log(`Fair price evidence: ${passed} passed, ${failures.length} failed`);
if (failures.length) throw new Error(failures.join("\n"));
