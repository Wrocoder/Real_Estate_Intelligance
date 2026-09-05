import { chromium } from "playwright";

const baseUrl = process.env.BROWSER_BASE_URL ?? "http://127.0.0.1:3000";
const apiBaseUrl = process.env.BROWSER_API_BASE_URL ?? "http://127.0.0.1:8000";
const failures = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function register(context) {
  const email = `check-recovery-${Date.now()}@domarion.local`;
  const response = await context.request.post(`${apiBaseUrl}/api/v1/auth/register`, {
    data: { email, password: "CheckRecovery-123!", display_name: "Check recovery fixture" },
  });
  assert(response.status() === 201, `test authentication failed: ${response.status()}`);
}

async function observe(page, ignoredConsoleFragments = []) {
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().includes("Failed to load resource: net::ERR_FAILED") &&
      !ignoredConsoleFragments.some((fragment) => message.text().includes(fragment))
    ) {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  return { consoleErrors, pageErrors };
}

async function fillManualForm(page) {
  await page.getByText("Wpisz dane mieszkania ręcznie", { exact: true }).click();
  await page.getByLabel("Adres").fill("ul. Testowa 1");
  await page.getByLabel("Miasto").fill("Wrocław");
  await page.getByLabel("Cena").fill("650000");
  await page.getByLabel("Powierzchnia m2").fill("55");
  await page.getByLabel("Pokoje").fill("3");
  await page.getByRole("checkbox").check();
}

async function runCoreRecovery(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "pl-PL" });
  await context.addCookies([{ name: "domarion_locale", value: "pl", url: baseUrl }]);
  await register(context);
  const page = await context.newPage();
  const observation = await observe(page);
  let analyzeRequestCount = 0;
  let reportRequestCount = 0;
  let saveRequestCount = 0;

  await page.route("**/api/v1/user-submitted-listings/analyze", async (route) => {
    analyzeRequestCount += 1;
    if (analyzeRequestCount === 1) {
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
    await route.continue();
  });
  await page.route("**/api/v1/user-submitted-listings/report", async (route) => {
    reportRequestCount += 1;
    if (reportRequestCount === 1) {
      await route.abort("failed");
      return;
    }
    await route.continue();
  });
  await page.route("**/api/v1/user-submitted-listings/drafts/*/reports/generate", async (route) => {
    saveRequestCount += 1;
    if (saveRequestCount === 1) {
      await route.abort("failed");
      return;
    }
    await route.continue();
  });

  try {
    await page.goto(`${baseUrl}/check`, { waitUntil: "networkidle" });
    await fillManualForm(page);
    const submit = page.getByRole("button", { name: "Sprawdź mieszkanie" }).last();
    await submit.click();
    await page.locator('.state-block[role="status"]').waitFor({ state: "visible", timeout: 1000 });
    await page.locator(".buyer-decision").waitFor({ state: "visible", timeout: 15000 });

    await page.getByRole("button", { name: "Pełny raport mieszkania" }).click();
    await page.getByRole("alert").filter({ hasText: "Błąd" }).waitFor({ state: "visible", timeout: 5000 });
    const retry = page.getByRole("button", { name: "Spróbuj ponownie" });
    await retry.waitFor({ state: "visible" });
    await retry.click();
    await page.getByRole("heading", { name: "Raport kupującego" }).waitFor({ state: "visible", timeout: 15000 });

    await page.getByRole("button", { name: "Zapisz mieszkanie" }).click();
    await page.getByRole("alert").filter({ hasText: "Błąd" }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("button", { name: "Spróbuj ponownie" }).click();
    await page.getByText("Zapisano", { exact: true }).waitFor({ state: "visible", timeout: 15000 });

    assert(analyzeRequestCount === 1, `expected one analysis request, got ${analyzeRequestCount}`);
    assert(reportRequestCount === 2, `expected one failed and one retried report request, got ${reportRequestCount}`);
    assert(saveRequestCount === 2, `expected one failed and one retried save request, got ${saveRequestCount}`);
    assert(observation.consoleErrors.length === 0, `console errors: ${observation.consoleErrors.join(" | ")}`);
    assert(observation.pageErrors.length === 0, `page errors: ${observation.pageErrors.join(" | ")}`);
  } finally {
    await context.close();
  }
}

async function runImportOutcomes(browser) {
  const cases = [
    {
      locale: "en",
      browserLocale: "en-US",
      urlLabel: "Otodom or OLX link",
      check: "Check apartment",
      partialTitle: "Some listing details were found",
      unsupportedTitle: "This listing source is not supported",
    },
    {
      locale: "pl",
      browserLocale: "pl-PL",
      urlLabel: "Link Otodom lub OLX",
      check: "Sprawdź mieszkanie",
      partialTitle: "Znaleźliśmy część danych ogłoszenia",
      unsupportedTitle: "To źródło ogłoszenia nie jest obsługiwane",
    },
    {
      locale: "ru",
      browserLocale: "ru-RU",
      urlLabel: "Ссылка Otodom или OLX",
      check: "Проверить квартиру",
      partialTitle: "Найдена только часть данных объявления",
      unsupportedTitle: "Источник объявления не поддерживается",
    },
    {
      locale: "uk",
      browserLocale: "uk-UA",
      urlLabel: "Посилання Otodom або OLX",
      check: "Перевірити квартиру",
      partialTitle: "Знайдено лише частину даних оголошення",
      unsupportedTitle: "Джерело оголошення не підтримується",
    },
  ];

  for (const testCase of cases) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: testCase.browserLocale,
    });
    await context.addCookies([{ name: "domarion_locale", value: testCase.locale, url: baseUrl }]);
    const page = await context.newPage();
    const observation = await observe(page);
    let importRequestCount = 0;
    await page.route("**/api/v1/user-submitted-listings/import-from-url", async (route) => {
      importRequestCount += 1;
      if (importRequestCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            reference_preview: {
              source_url_private: "https://www.otodom.pl/pl/oferta/demo-IDpartial123",
              source_domain: "otodom.pl",
              provider: "otodom",
              provider_label: "Otodom",
              listing_reference_id: null,
              source_slug: null,
              suggested_title: null,
              manual_fields_required: ["address", "district", "rooms"],
              manual_fields_recommended: [],
              privacy_note: "Private source reference.",
              warnings: [],
            },
            status: "partial",
            fields: {
              title: null,
              developer_name: null,
              investment_name: null,
              address: null,
              city: null,
              district: null,
              market_type: null,
              price: 650000,
              area_m2: 55,
              rooms: null,
              floor: null,
              building_floors: null,
              building_year: null,
              lat: null,
              lon: null,
            },
            fields_extracted: ["price", "area_m2"],
            extraction_source: "json-ld",
            fetched_at: new Date().toISOString(),
            fetch_status_code: 200,
            warnings: [],
          }),
        });
        return;
      }
      await route.continue();
    });

    try {
      await page.goto(`${baseUrl}/check`, { waitUntil: "networkidle" });
      await page.getByLabel(testCase.urlLabel).fill("https://www.otodom.pl/pl/oferta/demo-IDpartial123");
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: testCase.check }).click();
      await page.locator(".import-outcome-notice.partial").waitFor({ state: "visible", timeout: 5000 });
      await page.getByText(testCase.partialTitle, { exact: true }).waitFor({ state: "visible" });

      await page.getByLabel(testCase.urlLabel).fill("https://example.com/unsupported");
      await page.getByRole("button", { name: testCase.check }).click();
      await page.locator(".import-outcome-notice.error").waitFor({ state: "visible", timeout: 5000 });
      await page.getByText(testCase.unsupportedTitle, { exact: true }).waitFor({ state: "visible" });
      assert(importRequestCount === 2, `${testCase.locale}: expected two import requests, got ${importRequestCount}`);
      assert(observation.consoleErrors.length === 0, `${testCase.locale}: console errors: ${observation.consoleErrors.join(" | ")}`);
      assert(observation.pageErrors.length === 0, `${testCase.locale}: page errors: ${observation.pageErrors.join(" | ")}`);
    } finally {
      await context.close();
    }
  }
}

async function runActionableReportError(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "pl-PL" });
  await context.addCookies([{ name: "domarion_locale", value: "pl", url: baseUrl }]);
  await register(context);
  const page = await context.newPage();
  const observation = await observe(page, ["status of 400 (Bad Request)"]);

  await page.route("**/api/v1/user-submitted-listings/import-from-url", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reference_preview: {
          source_url_private: "https://www.otodom.pl/pl/oferta/demo-IDunsupported-area",
          source_domain: "otodom.pl",
          provider: "otodom",
          provider_label: "Otodom",
          listing_reference_id: null,
          source_slug: null,
          suggested_title: "Mieszkanie testowe",
          manual_fields_required: [],
          manual_fields_recommended: [],
          privacy_note: "Private source reference.",
          warnings: [],
        },
        status: "extracted",
        fields: {
          title: "Mieszkanie testowe",
          developer_name: null,
          investment_name: null,
          address: "ul. Testowa 1",
          city: "Wrocław",
          district: "Fabryczna",
          market_type: "secondary",
          price: 650000,
          area_m2: 55,
          rooms: 3,
          floor: 2,
          building_floors: 5,
          building_year: 2010,
          lat: 51.1079,
          lon: 17.0385,
        },
        fields_extracted: ["title", "address", "city", "district", "market_type", "price", "area_m2", "rooms"],
        extraction_source: "json-ld",
        fetched_at: new Date().toISOString(),
        fetch_status_code: 200,
        warnings: [],
      }),
    });
  });
  await page.route("**/api/v1/user-submitted-listings/report", async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        detail: "Area statistics are not available for this city/district in the current MVP data",
        error: { code: "bad_request", params: {}, correlation_id: "recovery-test" },
      }),
    });
  });

  try {
    await page.goto(`${baseUrl}/check`, { waitUntil: "networkidle" });
    await page.getByLabel("Link Otodom lub OLX").fill("https://www.otodom.pl/pl/oferta/demo-IDunsupported-area");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Sprawdź mieszkanie" }).click();
    await page.getByText("Nie mamy jeszcze wystarczających danych dla tego miasta lub dzielnicy.", { exact: false }).waitFor({
      state: "visible",
      timeout: 10000,
    });
    assert(await page.locator("details.manual-entry-panel").getAttribute("open") !== null, "manual entry did not open after report 400");
    assert(observation.consoleErrors.length === 0, `console errors: ${observation.consoleErrors.join(" | ")}`);
    assert(observation.pageErrors.length === 0, `page errors: ${observation.pageErrors.join(" | ")}`);
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });
try {
  try {
    await runCoreRecovery(browser);
    console.log("check recovery passed: core loading and retry mutations");
  } catch (error) {
    failures.push(error.message);
  }
  try {
    await runImportOutcomes(browser);
    console.log("check recovery passed: partial and unsupported import outcomes");
  } catch (error) {
    failures.push(error.message);
  }
  try {
    await runActionableReportError(browser);
    console.log("check recovery passed: actionable unsupported-area report error");
  } catch (error) {
    failures.push(error.message);
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`Check recovery failed (${failures.length}):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
