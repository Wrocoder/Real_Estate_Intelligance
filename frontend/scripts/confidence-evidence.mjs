import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.BROWSER_BASE_URL ?? "http://127.0.0.1:3000";
const apiUrl = process.env.BROWSER_API_BASE_URL ?? "http://127.0.0.1:8010";
const response = await fetch(`${apiUrl}/api/v1/listings/wr-001/analysis`);
assert.equal(response.status, 200);
const baseline = await response.json();
assert.equal(baseline.scores.fair_price_confidence.model_version, "fair-price-confidence-v2");
const labels = {
  pl: ["Wysoka", "Średnia", "Niska", "Niewystarczające dane"],
  en: ["High", "Medium", "Low", "Insufficient data"],
  ru: ["Высокая", "Средняя", "Низкая", "Недостаточно данных"],
  uk: ["Висока", "Середня", "Низька", "Недостатньо даних"],
};
await fs.mkdir("artifacts/confidence", { recursive: true });
const browser = await chromium.launch();
let passed = 0;
try {
  for (const [locale, levels] of Object.entries(labels)) {
    for (const width of [1440, 390]) {
      for (const [index, level] of ["high", "medium", "low", "insufficient"].entries()) {
        const context = await browser.newContext({ viewport: { width, height: 900 } });
        await context.addCookies([{ name: "domarion_locale", value: locale, url: baseUrl }]);
        await context.addInitScript(value => localStorage.setItem("domarion-locale", value), locale);
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", error => errors.push(error.message));
        page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
        page.on("requestfailed", request => { if (request.failure()?.errorText !== "net::ERR_ABORTED") errors.push(request.failure()?.errorText); });
        const fixture = structuredClone(baseline);
        Object.assign(fixture.scores.fair_price_confidence, {
          level: level === "insufficient" ? "low" : level,
          score: [90, 65, 30, 0][index],
          evidence_status: level === "insufficient" ? "insufficient" : "sufficient",
          limitation_codes: level === "insufficient" ? ["market_evidence_insufficient"] : [],
          median_distance_m: 0, median_age_days: 0, oldest_age_days: 0,
        });
        await page.route("**/api/v1/listings/wr-001/analysis", route => route.fulfill({ json: fixture }));
        try {
          await page.goto(`${baseUrl}/listings/wr-001`, { waitUntil: "networkidle" });
          assert.ok((await page.locator(".decision-confidence").innerText()).includes(levels[index]));
          const section = page.locator(".confidence-explanation");
          await page.locator("details").filter({ has: section }).last().locator(":scope > summary").click();
          assert.ok((await section.locator("h3").innerText()).includes(levels[index]));
          assert.doesNotMatch(await section.innerText(), /\/100|NaN|undefined|Invalid Date/);
          assert.ok(await section.locator("dd").filter({ hasText: /^0$/ }).count() >= 3);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
          await section.scrollIntoViewIfNeeded();
          if (level === "insufficient") await page.screenshot({ path: `artifacts/confidence/${locale}-${width}.png` });
          assert.deepEqual(errors, []);
          passed++;
          console.log(`confidence passed: ${locale}/${width}/${level}`);
        } finally { await context.close(); }
      }
    }
  }
} finally { await browser.close(); }
console.log(`Confidence evidence: ${passed} passed`);
