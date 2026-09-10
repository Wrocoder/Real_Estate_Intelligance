import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.BROWSER_BASE_URL ?? "http://127.0.0.1:3000";
const apiBaseUrl = process.env.BROWSER_API_BASE_URL ?? "http://127.0.0.1:8000";
const artifactDir = path.join(root, "artifacts", "browser-quality");
const locales = ["pl", "en", "ru", "uk"];
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];
const failures = [];

await fs.rm(artifactDir, { recursive: true, force: true });
await fs.mkdir(artifactDir, { recursive: true });

async function observe(page, label) {
  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];
  page.on("console", (message) => {
    if (message.type() === "error" || /unique "key" prop|duplicate key|hydration/i.test(message.text())) {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    if (request.failure()?.errorText !== "net::ERR_ABORTED") {
      requestFailures.push(`${request.url()} (${request.failure()?.errorText ?? "unknown"})`);
    }
  });
  return { label, consoleErrors, pageErrors, requestFailures };
}

async function assertHealthy(page, observation) {
  const hydrationErrors = [...observation.consoleErrors, ...observation.pageErrors].filter((message) =>
    /hydration|did not match|server rendered/i.test(message),
  );
  const layout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    lang: document.documentElement.lang,
    h1Count: document.querySelectorAll("h1").length,
    skipLink: document.querySelector('a[href="#main-content"]') !== null,
  }));
  if (observation.consoleErrors.length || observation.pageErrors.length || observation.requestFailures.length) {
    throw new Error(
      `${observation.label}: browser errors=${JSON.stringify(observation.consoleErrors)}, pageErrors=${JSON.stringify(observation.pageErrors)}, failedRequests=${JSON.stringify(observation.requestFailures)}`,
    );
  }
  if (hydrationErrors.length) throw new Error(`${observation.label}: hydration errors=${hydrationErrors.join(" | ")}`);
  if (layout.overflow) throw new Error(`${observation.label}: horizontal overflow at ${layout.lang}`);
  if (layout.h1Count !== 1) throw new Error(`${observation.label}: expected one h1, found ${layout.h1Count}`);
  if (!layout.skipLink) throw new Error(`${observation.label}: skip link is missing`);
}

async function runCase(browser, viewport, locale) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    locale: locale === "pl" ? "pl-PL" : locale,
  });
  await context.addCookies([{ name: "domarion_locale", value: locale, url: baseUrl }]);
  const page = await context.newPage();
  const observation = await observe(page, `${locale}/${viewport.name}`);
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(250);
    if ((await page.locator("html").getAttribute("lang")) !== locale)
      throw new Error(`${locale}/${viewport.name}: locale was not applied`);
    if (viewport.name === "mobile") {
      const mapLabels = {
        pl: { aria: "Mapa nieruchomości", layer: "Oferty", forbidden: "Объекты" },
        en: { aria: "Property map", layer: "Listings", forbidden: "Объекты" },
        ru: { aria: "Карта объектов", layer: "Объекты", forbidden: "planned investments" },
        uk: { aria: "Карта об'єктів", layer: "Об'єкти", forbidden: "Объекты" },
      }[locale];
      const map = page.locator(`.maplibre-container[aria-label="${mapLabels.aria}"]`);
      await map.waitFor({ state: "visible", timeout: 15000 });
      const canvas = map.locator("canvas.maplibregl-canvas");
      await canvas.waitFor({ state: "visible", timeout: 15000 });
      const dimensions = await canvas.evaluate((element) => ({
        width: element.width,
        height: element.height,
      }));
      if (dimensions.width < 1 || dimensions.height < 1) {
        throw new Error(`${locale}/${viewport.name}: MapLibre canvas is blank-sized`);
      }
      const mapText = await page.locator(".map-shell").innerText();
      if (!mapText.includes(mapLabels.layer)) {
        throw new Error(`${locale}/${viewport.name}: localized map controls are missing`);
      }
      if (mapText.includes(mapLabels.forbidden)) {
        throw new Error(`${locale}/${viewport.name}: mixed-language map copy is visible`);
      }
    }
    await assertHealthy(page, observation);
  } finally {
    await context.close();
  }
}

async function runBuyerDecisionLocalization(browser, locale) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale,
  });
  await context.addCookies([{ name: "domarion_locale", value: locale, url: baseUrl }]);
  const page = await context.newPage();
  const observation = await observe(page, `buyer-decision-localization/${locale}`);
  const expected = {
    pl: "Cena ofertowa",
    en: "The asking price",
    ru: "Цена предложения",
    uk: "Ціна пропозиції",
  }[locale];
  const negotiationState = {
    pl: {
      unavailable: "Brak wystarczających danych rynkowych",
      opening: "Oferta startowa",
    },
    en: {
      unavailable: "There is not enough market evidence",
      opening: "Opening offer",
    },
    ru: {
      unavailable: "Рыночных данных недостаточно",
      opening: "Стартовое предложение",
    },
    uk: {
      unavailable: "Ринкових даних недостатньо",
      opening: "Стартова пропозиція",
    },
  }[locale];
  const actionState = {
    pl: { title: "Plan działania przed zakupem", phase: "Przed złożeniem oferty" },
    en: { title: "Action plan before purchase", phase: "Before making an offer" },
    ru: { title: "План действий перед покупкой", phase: "До предложения" },
    uk: { title: "План дій перед купівлею", phase: "До пропозиції" },
  }[locale];
  try {
    await page.goto(`${baseUrl}/listings/wr-001`, {
      waitUntil: "domcontentloaded",
    });
    await page.locator(".buyer-decision").waitFor({ state: "visible", timeout: 15000 });
    await page.locator("#buyer-decision-details > summary").click();
    const text = await page.locator(".buyer-decision").innerText();
    if (!text.includes(expected)) throw new Error(`${locale}: localized buyer-decision text is missing`);
    const negotiationText = await page.locator("#buyer-negotiation").innerText();
    if (!negotiationText.includes(negotiationState.unavailable)) {
      throw new Error(`${locale}: insufficient negotiation evidence is not explained`);
    }
    if (negotiationText.includes(negotiationState.opening)) {
      throw new Error(`${locale}: opening offer leaked into insufficient-data state`);
    }
    const actionPlanText = await page.locator("#buyer-action-plan").innerText();
    if (!actionPlanText.includes(actionState.title) || !actionPlanText.includes(actionState.phase)) {
      throw new Error(`${locale}: localized buyer action plan is missing`);
    }
    if (/verify_kw_owner|risk_major_road_noise|before_offer/.test(actionPlanText)) {
      throw new Error(`${locale}: internal buyer action code leaked into the UI`);
    }
    for (const legacy of [
      "Buyer decision outputs are structured screening support",
      "Ksiega Wieczysta: owner and seller authority",
      "Scenario only: do not exceed the ceiling",
    ]) {
      if (text.includes(legacy)) throw new Error(`${locale}: backend prose leaked into buyer decision: ${legacy}`);
    }
    await assertHealthy(page, observation);
  } finally {
    await context.close();
  }
}

async function runBuyerActionPlan(browser, viewport) {
  const context = await browser.newContext({
    viewport,
    locale: "pl-PL",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  await context.addCookies([{ name: "domarion_locale", value: "pl", url: baseUrl }]);
  const page = await context.newPage();
  const observation = await observe(page, `buyer-action-plan-${viewport.width}`);
  try {
    await page.goto(`${baseUrl}/listings/wr-001`, { waitUntil: "domcontentloaded" });
    await page.locator("#buyer-decision-details > summary").click();
    const plan = page.locator("#buyer-action-plan");
    await plan.waitFor({ state: "visible", timeout: 10000 });
    const checkboxes = plan.locator('input[type="checkbox"]');
    const total = await checkboxes.count();
    if (total < 8) throw new Error(`${observation.label}: action plan is unexpectedly short`);
    await checkboxes.first().check();
    await plan.getByText(`Wykonano 1 z ${total}`, { exact: true }).waitFor({ state: "visible" });

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator("#buyer-decision-details > summary").click();
    const restoredPlan = page.locator("#buyer-action-plan");
    await restoredPlan.waitFor({ state: "visible" });
    await restoredPlan.locator('input[type="checkbox"]').first().waitFor({ state: "visible" });
    if (!(await restoredPlan.locator('input[type="checkbox"]').first().isChecked())) {
      throw new Error(`${observation.label}: completed action was not restored`);
    }

    const evidence = restoredPlan.locator("details.buyer-action-evidence").first();
    await evidence.locator(":scope > summary").click();
    const evidenceText = await evidence.innerText();
    if (!/Dlaczego ten krok|Źródło|Sposób przygotowania/.test(evidenceText)) {
      throw new Error(`${observation.label}: action evidence provenance is missing`);
    }

    await restoredPlan.getByRole("button", { name: "Kopiuj plan" }).click();
    await restoredPlan.getByText("Plan skopiowany", { exact: true }).waitFor({ state: "visible" });
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    if (!clipboard.includes("WartoMetr - plan działania przed zakupem") || !clipboard.includes("Podstawa:")) {
      throw new Error(`${observation.label}: copied action plan is incomplete`);
    }
    await page.screenshot({
      path: path.join(artifactDir, `buyer-action-plan-${viewport.width}.png`),
      fullPage: true,
    });
    await assertHealthy(page, observation);
  } finally {
    await context.close();
  }
}

async function runAvailableNegotiationScenario(browser, viewport) {
  const context = await browser.newContext({
    viewport,
    locale: "pl-PL",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  await context.addCookies([{ name: "domarion_locale", value: "pl", url: baseUrl }]);
  const page = await context.newPage();
  const observation = await observe(page, `negotiation-available-${viewport.width}`);
  await page.route("**/api/v1/listings/wr-001/analysis", async (route) => {
    const response = await route.fetch();
    const payload = await response.json();
    payload.buyer_decision.verdict.opening_offer_pln = 600000;
    payload.buyer_decision.verdict.recommended_offer_pln = 625000;
    payload.buyer_decision.verdict.realistic_deal_low_pln = 620000;
    payload.buyer_decision.verdict.realistic_deal_high_pln = 635000;
    payload.buyer_decision.verdict.max_reasonable_offer_pln = 640000;
    payload.buyer_decision.negotiation = {
      scenario_status: "available",
      scenario_version: "negotiation-v2-evidence-scenarios",
      scenario_confidence_score: 78,
      asking_price_pln: payload.listing.price,
      opening_offer_pln: 600000,
      realistic_deal_low_pln: 620000,
      realistic_deal_high_pln: 635000,
      max_reasonable_offer_pln: 640000,
      negotiation_score: 72,
      posture: "strong",
      limitation_codes: [],
      arguments: [
        {
          code: "fair_value_range",
          params: { low_pln: 620000, high_pln: 640000, confidence_score: 78 },
          strength: "primary",
          evidence_refs: ["fair-price"],
        },
      ],
      argument_evidence: [
        {
          id: "fair-price",
          topic: "fair_price",
          source_name: "RCN Wrocław transactions",
          source_type: "transaction_register",
          updated_at: "2026-09-08",
          sample_size: 24,
          geographic_scope: "Wrocław, Fabryczna",
          time_range: "last 12 months",
          calculation_type: "model_estimate",
          confidence_score: 78,
          note: null,
        },
      ],
      next_actions: [
        {
          code: "submit_conditional_offer",
          params: { opening_offer_pln: 600000 },
          evidence_refs: ["fair-price"],
        },
      ],
      guardrail_codes: ["scenario_not_valuation", "verify_before_deposit"],
    };
    await route.fulfill({ response, json: payload });
  });
  try {
    await page.goto(`${baseUrl}/listings/wr-001`, { waitUntil: "domcontentloaded" });
    await page.locator(".buyer-decision").waitFor({ state: "visible", timeout: 15000 });
    await page.locator("#buyer-decision-details > summary").click();
    const negotiation = page.locator("#buyer-negotiation");
    const content = await negotiation.innerText();
    const normalizedContent = content.replace(/\s+/g, " ");
    for (const expected of [
      "Oferta startowa",
      "600 000 PLN",
      "RCN Wrocław transactions",
      "Pewność scenariusza: 78/100",
    ]) {
      if (!normalizedContent.includes(expected)) {
        throw new Error(`${observation.label}: missing ${expected}`);
      }
    }
    await negotiation.getByRole("button", { name: "Kopiuj krótkie uzasadnienie" }).click();
    await negotiation.getByText("Uzasadnienie skopiowane", { exact: true }).waitFor({
      state: "visible",
      timeout: 5000,
    });
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    const normalizedClipboard = clipboard.replace(/\s+/g, " ");
    if (
      !normalizedClipboard.includes("RCN Wrocław transactions") ||
      !normalizedClipboard.includes("600 000 PLN")
    ) {
      throw new Error(`${observation.label}: copied negotiation brief is incomplete`);
    }
    await page.screenshot({
      path: path.join(artifactDir, `negotiation-available-${viewport.width}.png`),
      fullPage: true,
    });
    await assertHealthy(page, observation);
  } finally {
    await context.close();
  }
}

async function runFailureState(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "pl-PL",
  });
  await context.addCookies([{ name: "domarion_locale", value: "pl", url: baseUrl }]);
  const page = await context.newPage();
  const observation = await observe(page, "failure-state");
  try {
    await page.goto(`${baseUrl}/check`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    const urlInput = page.getByLabel("Link Otodom lub OLX");
    await urlInput.fill("https://www.otodom.pl/pl/oferta/not-a-real-listing-ID404");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Sprawdź mieszkanie" }).click();
    await page.waitForTimeout(500);
    const status = await page.locator(".status-line").allTextContents();
    if (!status.some((text) => /nie|wymaga|danych|obsług/i.test(text)))
      throw new Error("failure state did not render a user-facing status");
    await assertHealthy(page, observation);
  } finally {
    await context.close();
  }
}

async function runCriticalFlow(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "pl-PL",
  });
  await context.addCookies([{ name: "domarion_locale", value: "pl", url: baseUrl }]);
  const email = `browser-quality-${Date.now()}@domarion.local`;
  const registration = await context.request.post(`${apiBaseUrl}/api/v1/auth/register`, {
    data: {
      email,
      password: "BrowserQuality-123!",
      display_name: "Browser quality fixture",
    },
  });
  if (registration.status() !== 201) throw new Error(`test authentication failed: ${registration.status()}`);
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  const observation = await observe(page, "critical-flow");
  try {
    await page.goto(`${baseUrl}/check`, { waitUntil: "domcontentloaded" });
    await page.getByText("Wpisz dane mieszkania ręcznie", { exact: true }).click();
    await page.getByLabel("Adres").fill("ul. Testowa 1");
    await page.getByLabel("Miasto").fill("Wrocław");
    await page.getByLabel("Cena").fill("650000");
    await page.getByLabel("Powierzchnia m2").fill("55");
    await page.getByLabel("Pokoje").fill("3");
    await page.getByRole("checkbox").check();
    const submitButtons = page.getByRole("button", {
      name: "Sprawdź mieszkanie",
    });
    const submitButtonCount = await submitButtons.count();
    if (submitButtonCount < 2) throw new Error("manual check submit button is missing");
    await submitButtons.nth(submitButtonCount - 1).click();
    await page.locator(".buyer-decision").waitFor({ state: "visible", timeout: 15000 });
    const dataGap = page.locator(".score-data-gap");
    await dataGap.waitFor({ state: "visible", timeout: 5000 });
    const dataGapText = await dataGap.innerText();
    if (!/Brakujące dane|odległość od transportu publicznego|sprawdź podczas oględzin/i.test(dataGapText)) {
      throw new Error("partial-data guidance is missing from the apartment check result");
    }
    const save = page.getByRole("button", { name: "Zapisz mieszkanie" });
    await save.waitFor({ state: "visible", timeout: 5000 });
    await save.click();
    await page.locator(".status-line").filter({ hasText: "Zapisano" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("link", { name: "Porównaj" }).click();
    await page.waitForURL(/\/compare\?/);
    if (!(await page.getByRole("heading", { name: /Porówn/i }).count()))
      throw new Error("compare result did not render");
    await assertHealthy(page, observation);
    await context.tracing.stop({
      path: path.join(artifactDir, "critical-flow.trace.zip"),
    });
  } catch (error) {
    await page.screenshot({
      path: path.join(artifactDir, "critical-flow.failure.png"),
      fullPage: true,
    });
    await context.tracing.stop({
      path: path.join(artifactDir, "critical-flow.failure.trace.zip"),
    });
    throw error;
  } finally {
    await context.close();
  }
}

async function runProvenanceSurfaces(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "pl-PL",
  });
  await context.addCookies([{ name: "domarion_locale", value: "pl", url: baseUrl }]);
  const page = await context.newPage();
  const observation = await observe(page, "provenance-surfaces");
  try {
    for (const route of ["/listings/wr-001", "/areas/wroclaw-fabryczna"]) {
      await page.goto(`${baseUrl}${route}`, {
        waitUntil: "domcontentloaded",
      });
      if (route.startsWith("/listings/")) {
        await page.locator(".listing-evidence-disclosure > summary").click();
        const comparableSection = page.locator(".comparable-evidence-section");
        await comparableSection.waitFor({
          state: "visible",
          timeout: 10000,
        });
        const comparableText = await comparableSection.innerText();
        if (!/Dlaczego taka cena\?|Dopasowanie techniczne|Zaobserwowano|Odległość/.test(comparableText)) {
          throw new Error(`${route}: comparable evidence details are missing`);
        }
        if (!/Jakość dowodów|etap wyboru|Pewność szacunku|Źródła/.test(comparableText)) {
          throw new Error(`${route}: comparable confidence explanation is missing`);
        }
        if (
          /same_district|same_market|similar_size|condition_unknown|sample_size|source_quality/.test(comparableText)
        ) {
          throw new Error(`${route}: comparable factor code leaked into the UI`);
        }
      }
      await page.locator("details.provenance-details").first().waitFor({ state: "visible", timeout: 10000 });
      const details = page.locator("details.provenance-details").first();
      await details.locator("summary").click();
      await details.locator(".provenance-details-body").waitFor({ state: "visible" });
      const detailText = await details.innerText();
      if (!/Źródło|Typ źródła|Sposób przygotowania/.test(detailText)) {
        throw new Error(`${route}: localized provenance fields are missing`);
      }
      if (
        /listing_reference|market_snapshot|area_statistics|derived_model|deterministic_fixture|open_data_or_admin_verified/.test(
          detailText,
        )
      ) {
        throw new Error(`${route}: internal provenance code leaked into the UI`);
      }
      await assertHealthy(page, observation);
    }
  } finally {
    await context.close();
  }
}

async function runRentalEvidence(browser, listingId, expectedStatus, locale, viewport) {
  const labels = {
    pl: {
      estimated: "Szacunek oparty na ofertach najmu",
      insufficient: "Za mało danych o najmie",
      method: "Mediana czynszu za m² z trafnych obserwacji",
    },
    en: {
      estimated: "Estimate based on rental observations",
      insufficient: "Not enough rental data",
      method: "Median rent per m² from relevant observations",
    },
    ru: {
      estimated: "Оценка по арендным объявлениям",
      insufficient: "Недостаточно данных об аренде",
      method: "Медиана аренды за м² по релевантным наблюдениям",
    },
    uk: {
      estimated: "Оцінка за орендними оголошеннями",
      insufficient: "Недостатньо даних про оренду",
      method: "Медіана оренди за м² за релевантними спостереженнями",
    },
  };
  const context = await browser.newContext({
    viewport,
    locale: locale === "pl" ? "pl-PL" : locale,
  });
  await context.addCookies([{ name: "domarion_locale", value: locale, url: baseUrl }]);
  const page = await context.newPage();
  const observation = await observe(page, `rental-${expectedStatus}-${locale}-${viewport.width}`);
  try {
    await page.goto(`${baseUrl}/listings/${listingId}`, {
      waitUntil: "domcontentloaded",
    });
    await page.locator(".listing-evidence-disclosure > summary").click();
    const panel = page.locator(".rental-evidence");
    await panel.waitFor({ state: "visible", timeout: 10000 });
    const content = await panel.innerText();
    const expectedLabel = expectedStatus === "estimated" ? labels[locale].estimated : labels[locale].insufficient;
    if (!content.includes(expectedLabel)) {
      throw new Error(`${observation.label}: expected rental status was not rendered`);
    }
    if (!content.includes(labels[locale].method)) {
      throw new Error(`${observation.label}: localized rental method was not rendered`);
    }
    if (expectedStatus === "estimated" && !/%/.test(content)) {
      throw new Error(`${observation.label}: rental yields were not rendered`);
    }
    if (
      expectedStatus === "insufficient" &&
      /Rentowność brutto|Gross yield|Валовая доходность|Валова дохідність/.test(content)
    ) {
      throw new Error(`${observation.label}: numeric yield leaked into insufficient-data state`);
    }
    if (/same_district|same_city|rental_sample_insufficient|median rent per m2/.test(content)) {
      throw new Error(`${observation.label}: internal rental code leaked into the UI`);
    }
    await page.screenshot({
      path: path.join(artifactDir, `rental-${expectedStatus}-${locale}-${viewport.width}.png`),
      fullPage: true,
    });
    await assertHealthy(page, observation);
  } finally {
    await context.close();
  }
}

async function runScoreExplainability(browser, locale, viewport) {
  const labels = {
    pl: {
      why: "Dlaczego",
      coverage: "Pokrycie danych",
      confidence: "Pewność",
    },
    en: { why: "Why", coverage: "Data coverage", confidence: "Confidence" },
    ru: {
      why: "Почему",
      coverage: "Покрытие данных",
      confidence: "Уверенность",
    },
    uk: {
      why: "Чому",
      coverage: "Покриття даних",
      confidence: "Впевненість",
    },
  };
  const context = await browser.newContext({
    viewport,
    locale: locale === "pl" ? "pl-PL" : locale,
  });
  await context.addCookies([{ name: "domarion_locale", value: locale, url: baseUrl }]);
  const page = await context.newPage();
  const observation = await observe(page, `score-explainability-${locale}-${viewport.width}`);
  try {
    await page.goto(`${baseUrl}/listings/wr-001`, {
      waitUntil: "domcontentloaded",
    });
    await page.locator(".listing-secondary-disclosure > summary").click();
    const scoreBars = page.locator("[data-score-code]");
    await scoreBars.first().waitFor({ state: "visible", timeout: 10000 });
    if ((await scoreBars.count()) !== 5) {
      throw new Error(`${observation.label}: expected five independently explained scores`);
    }
    const explanation = scoreBars.first().locator(".score-explanation-details");
    if (!(await explanation.locator("summary").getByText(labels[locale].why, { exact: true }).count())) {
      throw new Error(`${observation.label}: localized explanation control is missing`);
    }
    await explanation.locator("summary").click();
    const content = await explanation.innerText();
    if (!content.includes(labels[locale].coverage) || !content.includes(labels[locale].confidence)) {
      throw new Error(`${observation.label}: coverage or confidence is missing`);
    }
    if (/price_position_supportive|missing_listing_market_metrics|score-explanation-v2/.test(content)) {
      throw new Error(`${observation.label}: internal score code leaked into the UI`);
    }
    await page.screenshot({
      path: path.join(artifactDir, `score-explainability-${locale}-${viewport.width}.png`),
      fullPage: true,
    });
    await assertHealthy(page, observation);
  } finally {
    await context.close();
  }
}

async function runListingDecisionHierarchy(browser, viewport) {
  const context = await browser.newContext({ viewport, locale: "pl-PL" });
  await context.addCookies([{ name: "domarion_locale", value: "pl", url: baseUrl }]);
  const page = await context.newPage();
  const observation = await observe(page, `listing-decision-${viewport.width}`);
  try {
    await page.goto(`${baseUrl}/listings/wr-001`, {
      waitUntil: "domcontentloaded",
    });
    const decision = page.locator(".buyer-decision");
    const evidence = page.locator(".listing-evidence-disclosure");
    const actions = page.locator(".listing-decision-actions");
    const secondary = page.locator(".listing-secondary-disclosure");
    await decision.waitFor({ state: "visible", timeout: 10000 });
    await page.locator(".buyer-decision-key-factors").waitFor({ state: "visible" });
    await actions.waitFor({ state: "visible" });
    if (await page.locator("section.metric-grid").count()) {
      throw new Error(`${observation.label}: duplicate decision metric grid is still rendered`);
    }
    if ((await evidence.getAttribute("open")) !== null || (await secondary.getAttribute("open")) !== null) {
      throw new Error(`${observation.label}: secondary content should start collapsed`);
    }
    const positions = await Promise.all(
      [decision, evidence, actions, secondary].map((locator) => locator.boundingBox()),
    );
    if (positions.some((position) => position === null)) {
      throw new Error(`${observation.label}: a hierarchy section has no layout box`);
    }
    const topValues = positions.map((position) => position.y);
    if (!topValues.every((value, index) => index === 0 || value > topValues[index - 1])) {
      throw new Error(`${observation.label}: decision, evidence, actions and secondary analysis are out of order`);
    }
    for (const label of ["Ulubione", "Porównaj", "Przygotuj negocjację", "Śledź zmiany"]) {
      if (
        !(await page
          .getByRole(/Porównaj/.test(label) ? "link" : "button", {
            name: label,
          })
          .count())
      ) {
        throw new Error(`${observation.label}: contextual action ${label} is missing`);
      }
    }
    await page.screenshot({
      path: path.join(artifactDir, `listing-decision-initial-${viewport.width}.png`),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Przygotuj negocjację", exact: true }).last().click();
    if (!(await page.locator("#buyer-decision-details").evaluate((node) => node.open))) {
      throw new Error(`${observation.label}: negotiation action did not reveal its evidence`);
    }
    await page.locator("#buyer-negotiation").waitFor({ state: "visible" });
    await page.screenshot({
      path: path.join(artifactDir, `listing-decision-expanded-${viewport.width}.png`),
      fullPage: true,
    });
    await assertHealthy(page, observation);
  } finally {
    await context.close();
  }
}

async function runCompareDecision(browser, locale, viewport) {
  const context = await browser.newContext({ viewport, locale });
  await context.addCookies([{ name: "domarion_locale", value: locale, url: baseUrl }]);
  const page = await context.newPage();
  const observation = await observe(page, `compare-decision/${locale}/${viewport.width}`);
  const expected = {
    pl: { why: "Dlaczego", tradeoffs: "Kompromisy" },
    en: { why: "Why", tradeoffs: "Trade-offs" },
    ru: { why: "Почему", tradeoffs: "Компромиссы" },
    uk: { why: "Чому", tradeoffs: "Компроміси" },
  }[locale];
  try {
    await page.goto(`${baseUrl}/compare?ids=wr-001,wr-002&intent=family`, {
      waitUntil: "domcontentloaded",
    });
    const recommendation = page.locator(".compare-recommendation");
    const details = page.locator(".compare-details");
    await recommendation.waitFor({ state: "visible", timeout: 15000 });
    if ((await page.locator(".compare-option input:checked").count()) !== 2) {
      throw new Error(`${observation.label}: explicit URL selection was not preserved`);
    }
    const recommendationText = await recommendation.innerText();
    if (!recommendationText.includes(expected.why) || !recommendationText.includes(expected.tradeoffs)) {
      throw new Error(`${observation.label}: localized reasons or trade-offs are missing`);
    }
    if ((await details.getAttribute("open")) !== null) {
      throw new Error(`${observation.label}: detailed matrix should start collapsed`);
    }
    const recommendationBox = await recommendation.boundingBox();
    const detailsBox = await details.boundingBox();
    if (!recommendationBox || !detailsBox || detailsBox.y <= recommendationBox.y) {
      throw new Error(`${observation.label}: recommendation does not precede detailed evidence`);
    }
    await page.locator(".compare-details > summary").click();
    if ((await details.getAttribute("open")) === null) {
      throw new Error(`${observation.label}: detailed matrix did not open`);
    }
    if (viewport.width <= 480) {
      if (await page.locator(".compare-table-desktop").isVisible()) {
        throw new Error(`${observation.label}: desktop comparison table is visible on mobile`);
      }
      await page.locator(".compare-mobile-cards").waitFor({ state: "visible" });
    }
    await page.screenshot({
      path: path.join(artifactDir, `compare-${locale}-${viewport.width}.png`),
      fullPage: true,
    });
    await assertHealthy(page, observation);
  } finally {
    await context.close();
  }
}

async function runPartialCompareDecision(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "pl-PL",
  });
  await context.addCookies([{ name: "domarion_locale", value: "pl", url: baseUrl }]);
  const partialResponse = await context.request.post(`${apiBaseUrl}/api/v1/compare`, {
    headers: {
      "X-Domarion-User-Id": "browser-partial-compare",
      "X-Domarion-Plan": "buyer_pro",
    },
    data: {
      listing_ids: ["wr-001", "missing-browser-listing", "wr-002"],
      purchase_intent: "family",
    },
  });
  if (partialResponse.status() !== 200) {
    throw new Error(`partial compare fixture failed: ${partialResponse.status()}`);
  }
  const partialPayload = await partialResponse.json();
  const page = await context.newPage();
  const observation = await observe(page, "compare-decision/partial");
  let compareRequestCount = 0;
  await page.route(`${apiBaseUrl}/api/v1/compare`, async (route) => {
    compareRequestCount += 1;
    if (compareRequestCount === 1) {
      await route.fulfill({ json: partialPayload });
      return;
    }
    await route.continue();
  });
  try {
    await page.goto(
      `${baseUrl}/compare?ids=wr-001,missing-browser-listing,wr-002&intent=family`,
      { waitUntil: "domcontentloaded" },
    );
    await page.locator(".compare-unavailable-notice").waitFor({
      state: "visible",
      timeout: 15000,
    });
    await page.locator(".compare-recommendation").waitFor({ state: "visible" });
    if ((await page.locator(".compare-option input:checked").count()) !== 2) {
      throw new Error("compare-decision/partial: remaining selection was not preserved");
    }
    const currentUrl = new URL(page.url());
    if (currentUrl.searchParams.get("ids") !== "wr-001,wr-002") {
      throw new Error("compare-decision/partial: unavailable ID was not removed from the page link");
    }
    await assertHealthy(page, observation);
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of viewports) {
    for (const locale of locales) {
      try {
        await runCase(browser, viewport, locale);
        console.log(`browser quality passed: ${locale}/${viewport.name}`);
      } catch (error) {
        failures.push(error.message);
      }
    }
  }
  try {
    await runFailureState(browser);
    console.log("browser quality passed: failure-state");
  } catch (error) {
    failures.push(error.message);
  }
  try {
    await runCriticalFlow(browser);
    console.log("browser quality passed: critical-flow");
  } catch (error) {
    failures.push(error.message);
  }
  try {
    await runProvenanceSurfaces(browser);
    console.log("browser quality passed: provenance-surfaces");
  } catch (error) {
    failures.push(error.message);
  }
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    try {
      await runListingDecisionHierarchy(browser, viewport);
      console.log(`browser quality passed: listing-decision/${viewport.width}`);
    } catch (error) {
      failures.push(error.message);
    }
    try {
      await runAvailableNegotiationScenario(browser, viewport);
      console.log(`browser quality passed: negotiation-available/${viewport.width}`);
    } catch (error) {
      failures.push(error.message);
    }
    try {
      await runBuyerActionPlan(browser, viewport);
      console.log(`browser quality passed: buyer-action-plan/${viewport.width}`);
    } catch (error) {
      failures.push(error.message);
    }
  }
  for (const locale of locales) {
    try {
      await runCompareDecision(browser, locale, { width: 390, height: 844 });
      console.log(`browser quality passed: compare-decision/${locale}/mobile`);
    } catch (error) {
      failures.push(error.message);
    }
  }
  try {
    await runCompareDecision(browser, "pl", { width: 1440, height: 900 });
    console.log("browser quality passed: compare-decision/pl/desktop");
  } catch (error) {
    failures.push(error.message);
  }
  try {
    await runPartialCompareDecision(browser);
    console.log("browser quality passed: compare-decision/partial");
  } catch (error) {
    failures.push(error.message);
  }
  for (const locale of locales) {
    try {
      await runBuyerDecisionLocalization(browser, locale);
      console.log(`browser quality passed: buyer-decision-localization/${locale}/mobile`);
    } catch (error) {
      failures.push(error.message);
    }
    try {
      await runScoreExplainability(browser, locale, {
        width: 390,
        height: 844,
      });
      console.log(`browser quality passed: score-explainability/${locale}/mobile`);
    } catch (error) {
      failures.push(error.message);
    }
    for (const rentalCase of [
      { listingId: "wr-001", status: "estimated" },
      { listingId: "wys-001", status: "insufficient" },
    ]) {
      try {
        await runRentalEvidence(browser, rentalCase.listingId, rentalCase.status, locale, {
          width: 390,
          height: 844,
        });
        console.log(`browser quality passed: rental-${rentalCase.status}/${locale}/mobile`);
      } catch (error) {
        failures.push(error.message);
      }
    }
  }
  try {
    await runScoreExplainability(browser, "pl", {
      width: 1440,
      height: 900,
    });
    console.log("browser quality passed: score-explainability/pl/desktop");
  } catch (error) {
    failures.push(error.message);
  }
  try {
    await runRentalEvidence(browser, "wr-001", "estimated", "pl", {
      width: 1440,
      height: 900,
    });
    console.log("browser quality passed: rental-estimated/pl/desktop");
  } catch (error) {
    failures.push(error.message);
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`Browser quality failed (${failures.length}):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
