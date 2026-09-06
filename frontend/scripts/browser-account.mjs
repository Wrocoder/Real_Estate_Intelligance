import { chromium } from "playwright";

const baseUrl = process.env.BROWSER_BASE_URL ?? "http://127.0.0.1:3000";
const apiBaseUrl = process.env.BROWSER_API_BASE_URL ?? "http://127.0.0.1:8010";
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const browser = await chromium.launch({ headless: true });
const failures = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();
    const apiRequests = [];
    const pageErrors = [];

    page.on("request", (request) => {
      if (request.url().includes("/api/")) apiRequests.push(request.url());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    try {
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await page.waitForTimeout(300);
      if (await page.locator(".auth-notice").isVisible()) {
        failures.push(`${viewport.name}: passive session check opened an auth notice`);
      }

      await page.goto(`${baseUrl}/account`, { waitUntil: "networkidle" });
      await page.waitForTimeout(300);

      const mainText = await page.locator("main").innerText();
      const authFormVisible = await page.locator(".auth-form").isVisible();
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      const requestedSessionDirectly = apiRequests.some(
        (url) => url === `${apiBaseUrl}/api/v1/auth/session`,
      );
      const usedRemovedProxy = apiRequests.some((url) =>
        url.includes("/api/auth/session-status"),
      );

      if (!authFormVisible) failures.push(`${viewport.name}: sign-in form is not visible`);
      if (/Something went wrong|Coś poszło nie tak|Что-то пошло не так|Щось пішло не так/i.test(mainText)) {
        failures.push(`${viewport.name}: generic account error is visible`);
      }
      if (!requestedSessionDirectly) failures.push(`${viewport.name}: direct API session check is missing`);
      if (usedRemovedProxy) failures.push(`${viewport.name}: removed session proxy was requested`);
      if (hasOverflow) failures.push(`${viewport.name}: horizontal overflow detected`);
      if (pageErrors.length) failures.push(`${viewport.name}: page errors: ${pageErrors.join(" | ")}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Account browser regression passed for desktop and mobile.");
}
