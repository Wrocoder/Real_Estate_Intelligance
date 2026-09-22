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
  pl: { unknown: "Niezweryfikowane", next: "Kolejny krok", prepare: "Przygotuj mnie do oglądania", why: "Dlaczego to ważne", evidence: "Sprawdź dane i źródła", missing: "Brak danych", low: "Niska", additional: "Dodatkowa analiza mieszkania", recalculate: "Przelicz werdykt", changed: "Co się zmieniło", updated: "NAJPIERW SPRAWDŹ", negotiate: "Przygotuj negocjacje", targetRange: "Zakres docelowy", sellerMessage: "Wiadomość do sprzedającego lub agenta", copyMessage: "Kopiuj wiadomość" },
  en: { unknown: "Not verified", next: "Next step", prepare: "Prepare for the viewing", why: "Why it matters", evidence: "Review evidence and sources", missing: "Not available", low: "Low", additional: "Additional apartment analysis", recalculate: "Recalculate verdict", changed: "What changed", updated: "VERIFY FIRST", negotiate: "Prepare negotiation", targetRange: "Target range", sellerMessage: "Message to seller/agent", copyMessage: "Copy message" },
  ru: { unknown: "Не проверено", next: "Следующий шаг", prepare: "Подготовиться к просмотру", why: "Почему это важно", evidence: "Проверить данные и источники", missing: "Нет данных", low: "Низкая", additional: "Дополнительный анализ квартиры", recalculate: "Пересчитать вердикт", changed: "Что изменилось", updated: "СНАЧАЛА ПРОВЕРИТЬ", negotiate: "Подготовить переговоры", targetRange: "Целевой диапазон", sellerMessage: "Сообщение продавцу или агенту", copyMessage: "Скопировать сообщение" },
  uk: { unknown: "Не перевірено", next: "Наступний крок", prepare: "Підготуватися до огляду", why: "Чому це важливо", evidence: "Перевірити дані та джерела", missing: "Немає даних", low: "Низька", additional: "Додатковий аналіз квартири", recalculate: "Перерахувати вердикт", changed: "Що змінилося", updated: "СПОЧАТКУ ПЕРЕВІРИТИ", negotiate: "Підготувати переговори", targetRange: "Цільовий діапазон", sellerMessage: "Повідомлення продавцю або агенту", copyMessage: "Скопіювати повідомлення" },
};

async function run(name, locale, width, mutate = () => {}, verify = async () => {}) {
  const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
    viewport: { width, height: width === 390 ? 844 : 900 },
  });
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
      assert.equal(await page.locator("#buyer-before-viewing").isVisible(), true);
      assert.match(await page.locator("#buyer-before-viewing").innerText(), new RegExp(locales[locale].why));
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
        await page.getByRole("button", { name: locales[locale].prepare, exact: true }).click();
        assert.equal(await page.locator("#buyer-before-viewing").isVisible(), true);
        await page.waitForFunction(() => document.activeElement?.id === "buyer-before-viewing");
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
      assert.equal(await page.locator("#buyer-before-viewing").isVisible(), true);
      await page.waitForFunction(() => document.activeElement?.id === "buyer-before-viewing");
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
  await run("negotiation-assistant", "pl", 390, (data) => {
    data.buyer_decision.verdict.status = "negotiate";
    data.buyer_decision.verdict.opening_offer_pln = 620000;
    data.buyer_decision.verdict.realistic_deal_low_pln = 635000;
    data.buyer_decision.verdict.realistic_deal_high_pln = 660000;
    data.buyer_decision.verdict.max_reasonable_offer_pln = 670000;
    data.buyer_decision.negotiation.scenario_status = "available";
    data.buyer_decision.negotiation.scenario_confidence_score = 78;
    data.buyer_decision.negotiation.posture = "moderate";
    data.buyer_decision.negotiation.opening_offer_pln = 620000;
    data.buyer_decision.negotiation.realistic_deal_low_pln = 635000;
    data.buyer_decision.negotiation.realistic_deal_high_pln = 660000;
    data.buyer_decision.negotiation.max_reasonable_offer_pln = 670000;
    data.buyer_decision.negotiation.argument_evidence = [{
      id: "fair-price",
      topic: "fair_price",
      source_name: "WartoMetr fair price",
      source_type: "model",
      updated_at: null,
      sample_size: 12,
      geographic_scope: "Wrocław: Fabryczna",
      time_range: "180 days",
      calculation_type: "model_estimate",
      confidence_score: 78,
      note: null,
    }];
    data.buyer_decision.negotiation.arguments = [{
      code: "fair_value_range",
      params: { low_pln: 635000, high_pln: 670000, confidence_score: 78 },
      strength: "primary",
      evidence_refs: ["fair-price"],
    }];
  }, async (page) => {
    await page.getByRole("button", { name: locales.pl.negotiate, exact: true }).click();
    const negotiation = page.locator("#buyer-negotiation");
    await negotiation.waitFor();
    const text = await negotiation.innerText();
    assert.match(text, new RegExp(locales.pl.targetRange));
    assert.match(text, new RegExp(locales.pl.sellerMessage));
    assert.match(text, /warunkow|warunkową/);
    assert.doesNotMatch(text, /Realna transakcja|zaakceptowana cena|sprzedający zaakceptuje/);
    await negotiation.getByRole("button", { name: locales.pl.copyMessage, exact: true }).click();
    assert.match(await negotiation.innerText(), /Wiadomość skopiowana/);
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
  await run("post-viewing", "pl", 390, () => {}, async (page, payload) => {
    const recalculated = structuredClone(payload.buyer_decision);
    recalculated.verdict.status = "verify_first";
    recalculated.verdict.score = Math.max(1, recalculated.verdict.score - 2.4);
    recalculated.verdict.top_risks = [
      "Wilgoć zauważona podczas oględzin.",
      ...recalculated.verdict.top_risks,
    ];
    recalculated.verdict.max_reasonable_offer_pln = Math.max(
      1,
      (recalculated.verdict.max_reasonable_offer_pln ?? recalculated.verdict.fair_price_mid_pln) - 190000,
    );
    await page.route("**/api/v1/listings/wr-001/post-viewing-verdict", async (route) => {
      const answers = route.request().postDataJSON();
      await route.fulfill({
        json: {
          original_decision: payload.buyer_decision,
          updated_decision: recalculated,
          checklist_answers: {
            condition: "unknown",
            windows: "unknown",
            noise: "unknown",
            smell: "unknown",
            humidity: answers.humidity,
            staircase: "unknown",
            orientation: "unknown",
            kitchen_bathroom: "unknown",
            layout: answers.layout,
            renovation_need: answers.renovation_need,
            notes: answers.notes,
          },
          risk_adjustment_points: 42,
          offer_adjustment_pln: 190000,
          applied_findings: [
            "humidity or moisture: major issue observed at viewing.",
            "layout and functional problems: minor issue observed at viewing.",
            "renovation need: Full renovation scope should be priced in.",
          ],
          recommended_actions: [
            "Pause before zadatek until humidity or moisture is inspected or fully priced in.",
            "Get a written renovation estimate before raising the offer.",
          ],
          disclaimer: "Post-viewing recalculation is a screening adjustment from buyer-entered observations.",
        },
      });
    });
    await page.getByText(locales.pl.additional, { exact: true }).click();
    const panel = page.locator(".post-viewing-recalculator");
    await panel.getByLabel("Wilgoć").selectOption("major_issue");
    await panel.getByLabel("Układ").selectOption("minor_issue");
    await panel.getByLabel("Remont").selectOption("full");
    await panel.getByRole("button", { name: locales.pl.recalculate }).click();
    await panel.getByText(locales.pl.changed, { exact: true }).waitFor();
    assert.match(await panel.innerText(), /layout and functional problems|Wilgoć|190/);
    assert.match(await page.locator(".decision-summary-primary").innerText(), new RegExp(locales.pl.updated));
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByText(locales.pl.additional, { exact: true }).click();
    await page.locator(".post-viewing-change-summary").waitFor();
    assert.match(await page.locator(".post-viewing-recalculator").innerText(), /layout and functional problems|190/);
  });
} finally { await browser.close(); }
console.log(`Buyer result: ${passed} passed, ${failures.length} failed`);
if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; }
