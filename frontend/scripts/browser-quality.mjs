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
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
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
    await page.goto(`${baseUrl}/check`, { waitUntil: "networkidle" });
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
    await page.goto(`${baseUrl}/check`, { waitUntil: "networkidle" });
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
    const save = page.getByRole("button", { name: "Zapisz mieszkanie" });
    await save.waitFor({ state: "visible", timeout: 5000 });
    await save.click();
    await page.getByText("Zapisano", { exact: true }).waitFor({ state: "visible", timeout: 15000 });
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
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`Browser quality failed (${failures.length}):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
