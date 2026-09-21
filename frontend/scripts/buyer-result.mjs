import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.BROWSER_BASE_URL ?? "http://127.0.0.1:3000";
const apiBaseUrl = process.env.BROWSER_API_BASE_URL ?? "http://127.0.0.1:8000";
const artifacts = path.resolve("artifacts", "buyer-result");
await fs.mkdir(artifacts, { recursive: true });
const response = await fetch(`${apiBaseUrl}/api/v1/listings/wr-001/analysis`);
assert.equal(response.status, 200, "local test API must be running");
const baseline = await response.json();
const browser = await chromium.launch();
const failures = [];
let passed = 0;
const locales = {
  pl: { unknown: "Niezweryfikowane", next: "Kolejny krok", plan: "Otwórz plan sprawdzenia", evidence: "Sprawdź dane i źródła", missing: "Brak danych", low: "Niska" },
  en: { unknown: "Not verified", next: "Next step", plan: "Open verification plan", evidence: "Review evidence and sources", missing: "Not available", low: "Low" },
  ru: { unknown: "Не проверено", next: "Следующий шаг", plan: "Открыть план проверки", evidence: "Проверить данные и источники", missing: "Нет данных", low: "Низкая" },
  uk: { unknown: "Не перевірено", next: "Наступний крок", plan: "Відкрити план перевірки", evidence: "Перевірити дані та джерела", missing: "Немає даних", low: "Низька" },
};

async function run(name, locale, width, mutate = () => {}, verify = async () => {}) {
  const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
  await context.addCookies([{ name: "domarion_locale", value: locale, url: baseUrl }]);
  await context.addInitScript((value) => localStorage.setItem("domarion-locale", value), locale);
  const page = await context.newPage();
  const payload = structuredClone(baseline);
  mutate(payload);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.route("**/api/v1/listings/wr-001/analysis", (route) => route.fulfill({ json: payload }));
  try {
    await page.goto(`${baseUrl}/listings/wr-001`, { waitUntil: "domcontentloaded" });
    const summary = page.locator(".decision-summary-primary");
    await summary.waitFor();
    if (payload.buyer_decision) await page.getByRole("button", { name: locales[locale].evidence, exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, "horizontal overflow");
    assert.equal(await summary.locator(".buyer-decision-score").count(), 0, "score dominates overview");
    assert.equal(await summary.locator(".metric").count(), 2, "overview should prioritize asking price and fair range");
    assert.doesNotMatch(await summary.innerText(), /NaN|undefined|\/100|\/10\b/);
    if (payload.buyer_decision) {
      assert.equal(await page.locator("#buyer-decision-details").getAttribute("open"), null);
      assert.equal(await summary.getByRole("heading", { name: locales[locale].unknown, exact: true }).isVisible(), true);
      assert.match(await summary.locator(".decision-summary-next-step").innerText(), new RegExp(locales[locale].next));
    }
    await verify(page, payload);
    await page.screenshot({ path: path.join(artifacts, `${name}-${locale}-${width}.png`), fullPage: true });
    assert.deepEqual(errors, [], "browser console or uncaught errors");
    passed += 1;
    console.log(`buyer result passed: ${name}/${locale}/${width}`);
  } catch (error) {
    failures.push(`${name}/${locale}/${width}: ${error.message}`);
    await page.screenshot({ path: path.join(artifacts, `failure-${name}-${locale}-${width}.png`), fullPage: true });
  } finally { await context.close(); }
}

try {
  for (const locale of Object.keys(locales)) {
    for (const width of [1440, 768, 390]) {
      await run("overview", locale, width, () => {}, async (page) => {
        await page.getByRole("button", { name: locales[locale].plan, exact: true }).click();
        assert.equal(await page.locator("#buyer-action-plan").isVisible(), true);
        assert.equal(await page.evaluate(() => document.activeElement?.id), "buyer-action-plan");
        await page.locator("#buyer-decision-details > summary").click();
        await page.getByRole("button", { name: locales[locale].evidence, exact: true }).click();
        assert.equal(await page.locator("#buyer-decision-sources").isVisible(), true);
        await page.locator("#buyer-decision-details > summary").click();
        await page.locator(".decision-summary-primary").scrollIntoViewIfNeeded();
      });
    }
  }
  for (const status of ["buy", "negotiate", "avoid", "verify_first"]) {
    await run(status, "pl", 390, (data) => {
      data.buyer_decision.verdict.status = status;
      data.buyer_decision.negotiation.scenario_status = status === "negotiate" ? "available" : "insufficient_data";
    }, async (page) => {
      await page.locator(".buyer-decision-cta").click();
      const target = status === "negotiate" ? "buyer-negotiation" : "buyer-action-plan";
      assert.equal(await page.locator(`#${target}`).isVisible(), true);
    });
  }
  await run("overpriced", "pl", 390, (data) => {
    data.buyer_decision.verdict.seller_price_pln = 950000;
    data.buyer_decision.verdict.price_delta_to_fair_mid_pct = 35;
    data.buyer_decision.verdict.overpricing_pln = 250000;
  }, async (page) => {
    assert.doesNotMatch(await page.locator(".decision-summary-primary").innerText(), /blisko szacowanego zakresu/);
    assert.match(await page.locator(".buyer-price-relation").innerText(), /powyżej środka/);
  });
  for (const score of [0, null]) {
    await run(`confidence-${score}`, "pl", 390, (data) => {
      data.scores.fair_price_confidence_score = score;
      data.scores.fair_price_confidence = null;
      data.comparables = [];
      data.comparable_evidence = [];
    }, async (page) => {
      assert.match(await page.locator(".decision-confidence").innerText(), score === 0 ? /Niska/ : /Brak danych/);
      assert.match(await page.locator(".buyer-evidence-summary").innerText(), /Brak podobnych ogłoszeń/);
    });
  }
  await run("transaction-context", "pl", 390, (data) => {
    data.scores.fair_price_confidence.transaction_observation_count = 987;
  }, async (page) => {
    assert.doesNotMatch(await page.locator(".buyer-evidence-summary").innerText(), /987/);
    await page.getByRole("button", { name: locales.pl.evidence, exact: true }).click();
    assert.match(await page.locator("#buyer-decision-sources").innerText(), /987.*Nie oznacza/);
  });
  await run("missing-range", "pl", 390, (data) => {
    for (const key of ["fair_price_low_pln", "fair_price_mid_pln", "fair_price_high_pln", "price_delta_to_fair_mid_pct"]) data.buyer_decision.verdict[key] = null;
  }, async (page) => {
    assert.match(await page.locator(".summary-metric-fair-price").innerText(), /Brak danych/);
    assert.equal(await page.locator(".buyer-price-relation").count(), 0);
  });
  await run("missing-verdict", "pl", 390, (data) => { data.buyer_decision = null; }, async (page) => {
    assert.match(await page.locator(".decision-summary-primary h2").innerText(), /Brak wystarczających danych/);
    assert.equal(await page.locator(".buyer-decision-cta").count(), 0);
  });
  await run("midpoint-without-range", "pl", 390, (data) => {
    data.buyer_decision.verdict.fair_price_low_pln = null;
    data.buyer_decision.verdict.fair_price_high_pln = null;
  }, async (page) => {
    assert.match(await page.locator(".summary-metric-fair-price").innerText(), /Brak danych/);
    assert.equal(await page.locator(".buyer-price-relation").count(), 0);
  });
} finally { await browser.close(); }
console.log(`Buyer result: ${passed} passed, ${failures.length} failed`);
if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; }
