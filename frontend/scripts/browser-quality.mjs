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
    throw new Error(`${observation.label}: browser errors=${JSON.stringify(observation.consoleErrors)}, pageErrors=${JSON.stringify(observation.pageErrors)}, failedRequests=${JSON.stringify(observation.requestFailures)}`);
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
    if (await page.locator("html").getAttribute("lang") !== locale) throw new Error(`${locale}/${viewport.name}: locale was not applied`);
    await assertHealthy(page, observation);
  } finally {
    await context.close();
  }
}

async function runFailureState(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "pl-PL" });
  await context.addCookies([{ name: "domarion_locale", value: "pl", url: baseUrl }]);
  const page = await context.newPage();
  const observation = await observe(page, "failure-state");
  try {
    await page.goto(`${baseUrl}/check`, { waitUntil: "domcontentloaded" });
    const urlInput = page.getByLabel("Link Otodom lub OLX");
    await urlInput.fill("https://example.com/not-a-supported-listing");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Sprawdź mieszkanie" }).click();
    await page.waitForTimeout(500);
    const status = await page.locator(".status-line").allTextContents();
    if (!status.some((text) => /nie|wymaga|danych|obsług/i.test(text))) throw new Error("failure state did not render a user-facing status");
    await assertHealthy(page, observation);
  } finally {
    await context.close();
  }
}

async function runCriticalFlow(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pl-PL" });
  await context.addCookies([{ name: "domarion_locale", value: "pl", url: baseUrl }]);
  const email = `browser-quality-${Date.now()}@domarion.local`;
  const registration = await context.request.post(`${apiBaseUrl}/api/v1/auth/register`, {
    data: { email, password: "BrowserQuality-123!", display_name: "Browser quality fixture" },
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
    const submitButtons = page.getByRole("button", { name: "Sprawdź mieszkanie" });
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
    if (!(await page.getByRole("heading", { name: /Porówn/i }).count())) throw new Error("compare result did not render");
    await assertHealthy(page, observation);
    await context.tracing.stop({ path: path.join(artifactDir, "critical-flow.trace.zip") });
  } catch (error) {
    await page.screenshot({ path: path.join(artifactDir, "critical-flow.failure.png"), fullPage: true });
    await context.tracing.stop({ path: path.join(artifactDir, "critical-flow.failure.trace.zip") });
    throw error;
  } finally {
    await context.close();
  }
}

async function runProvenanceSurfaces(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "pl-PL" });
  await context.addCookies([{ name: "domarion_locale", value: "pl", url: baseUrl }]);
  const page = await context.newPage();
  const observation = await observe(page, "provenance-surfaces");
  try {
    for (const route of ["/listings/wr-001", "/areas/wroclaw-fabryczna"]) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      if (route.startsWith("/listings/")) {
        await page.locator(".listing-evidence-disclosure > summary").click();
        const comparableSection = page.locator(".comparable-evidence-section");
        await comparableSection.waitFor({ state: "visible", timeout: 10000 });
        const comparableText = await comparableSection.innerText();
        if (
          !/Dlaczego taka cena\?|Dopasowanie techniczne|Zaobserwowano|Odległość/.test(
            comparableText,
          )
        ) {
          throw new Error(`${route}: comparable evidence details are missing`);
        }
        if (!/Jakość dowodów|etap wyboru|Pewność szacunku|Źródła/.test(comparableText)) {
          throw new Error(`${route}: comparable confidence explanation is missing`);
        }
        if (
          /same_district|same_market|similar_size|condition_unknown|sample_size|source_quality/.test(
            comparableText,
          )
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
      if (/listing_reference|market_snapshot|area_statistics|derived_model|deterministic_fixture|open_data_or_admin_verified/.test(detailText)) {
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
  const context = await browser.newContext({ viewport, locale: locale === "pl" ? "pl-PL" : locale });
  await context.addCookies([{ name: "domarion_locale", value: locale, url: baseUrl }]);
  const page = await context.newPage();
  const observation = await observe(page, `rental-${expectedStatus}-${locale}-${viewport.width}`);
  try {
    await page.goto(`${baseUrl}/listings/${listingId}`, { waitUntil: "domcontentloaded" });
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
    if (expectedStatus === "insufficient" && /Rentowność brutto|Gross yield|Валовая доходность|Валова дохідність/.test(content)) {
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
    pl: { why: "Dlaczego", coverage: "Pokrycie danych", confidence: "Pewność" },
    en: { why: "Why", coverage: "Data coverage", confidence: "Confidence" },
    ru: { why: "Почему", coverage: "Покрытие данных", confidence: "Уверенность" },
    uk: { why: "Чому", coverage: "Покриття даних", confidence: "Впевненість" },
  };
  const context = await browser.newContext({ viewport, locale: locale === "pl" ? "pl-PL" : locale });
  await context.addCookies([{ name: "domarion_locale", value: locale, url: baseUrl }]);
  const page = await context.newPage();
  const observation = await observe(page, `score-explainability-${locale}-${viewport.width}`);
  try {
    await page.goto(`${baseUrl}/listings/wr-001`, { waitUntil: "domcontentloaded" });
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
    await page.goto(`${baseUrl}/listings/wr-001`, { waitUntil: "domcontentloaded" });
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
    const positions = await Promise.all([decision, evidence, actions, secondary].map((locator) => locator.boundingBox()));
    if (positions.some((position) => position === null)) {
      throw new Error(`${observation.label}: a hierarchy section has no layout box`);
    }
    const topValues = positions.map((position) => position.y);
    if (!topValues.every((value, index) => index === 0 || value > topValues[index - 1])) {
      throw new Error(`${observation.label}: decision, evidence, actions and secondary analysis are out of order`);
    }
    for (const label of ["Ulubione", "Porównaj", "Przygotuj negocjację", "Śledź zmiany"]) {
      if (!(await page.getByRole(/Porównaj/.test(label) ? "link" : "button", { name: label }).count())) {
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
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    try {
      await runListingDecisionHierarchy(browser, viewport);
      console.log(`browser quality passed: listing-decision/${viewport.width}`);
    } catch (error) {
      failures.push(error.message);
    }
  }
  for (const locale of locales) {
    try {
      await runScoreExplainability(browser, locale, { width: 390, height: 844 });
      console.log(`browser quality passed: score-explainability/${locale}/mobile`);
    } catch (error) {
      failures.push(error.message);
    }
    for (const rentalCase of [
      { listingId: "wr-001", status: "estimated" },
      { listingId: "wys-001", status: "insufficient" },
    ]) {
      try {
        await runRentalEvidence(
          browser,
          rentalCase.listingId,
          rentalCase.status,
          locale,
          { width: 390, height: 844 },
        );
        console.log(`browser quality passed: rental-${rentalCase.status}/${locale}/mobile`);
      } catch (error) {
        failures.push(error.message);
      }
    }
  }
  try {
    await runScoreExplainability(browser, "pl", { width: 1440, height: 900 });
    console.log("browser quality passed: score-explainability/pl/desktop");
  } catch (error) {
    failures.push(error.message);
  }
  try {
    await runRentalEvidence(
      browser,
      "wr-001",
      "estimated",
      "pl",
      { width: 1440, height: 900 },
    );
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
