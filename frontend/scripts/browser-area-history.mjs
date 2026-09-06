import { mkdir } from "node:fs/promises";

import { chromium } from "playwright";

const baseUrl = process.env.BROWSER_BASE_URL ?? "http://127.0.0.1:3000";
const areaId = process.env.BROWSER_AREA_ID ?? "wroclaw-borek";
const artifactDir = process.env.BROWSER_ARTIFACT_DIR;
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const failures = [];
const browser = await chromium.launch({ headless: true });

if (artifactDir) await mkdir(artifactDir, { recursive: true });

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const pageErrors = [];
    const failedRequests = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => {
      if (request.failure()?.errorText !== "net::ERR_ABORTED") {
        failedRequests.push(`${request.url()}: ${request.failure()?.errorText ?? "unknown"}`);
      }
    });

    try {
      await page.goto(`${baseUrl}/areas`, { waitUntil: "networkidle" });
      const yearlyCardHistory = page.locator(".area-card-yearly-history");
      const yearlyCardCount = await yearlyCardHistory.count();
      if (yearlyCardCount === 0 || !(await yearlyCardHistory.first().isVisible())) {
        failures.push(`${viewport.name}: yearly medians are missing from area cards`);
      }
      if (artifactDir) {
        await page.screenshot({
          fullPage: true,
          path: `${artifactDir}/area-cards-${viewport.name}.png`,
        });
      }

      await page.goto(`${baseUrl}/areas/${areaId}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(300);
      if (!(await page.locator(".area-price-chart").isVisible())) {
        failures.push(`${viewport.name}: monthly price chart is not visible`);
      }
      if (!(await page.locator(".area-yearly-history").isVisible())) {
        failures.push(`${viewport.name}: yearly history summary is not visible`);
      }
      const chartScrollsInternally = await page.locator(".area-price-chart-scroll").evaluate(
        (element) => element.scrollWidth > element.clientWidth + 1,
      );
      if (viewport.name === "mobile" && chartScrollsInternally) {
        failures.push(`${viewport.name}: full price history does not fit the initial viewport`);
      }
      const chartLines = page.locator(".area-price-chart-line");
      const chartLineCount = await chartLines.count();
      if (chartLineCount === 0) {
        failures.push(`${viewport.name}: chart contains no observed price segments`);
      } else {
        const lineStroke = await chartLines.first().evaluate(
          (element) => getComputedStyle(element).stroke,
        );
        if (!lineStroke || lineStroke === "none" || lineStroke === "rgba(0, 0, 0, 0)") {
          failures.push(`${viewport.name}: chart line has no visible stroke`);
        }
      }
      const documentOverflows = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      if (documentOverflows) failures.push(`${viewport.name}: document has horizontal overflow`);
      if (pageErrors.length) failures.push(`${viewport.name}: ${pageErrors.join(" | ")}`);
      if (failedRequests.length) failures.push(`${viewport.name}: ${failedRequests.join(" | ")}`);
      if (artifactDir) {
        await page.screenshot({
          fullPage: true,
          path: `${artifactDir}/area-history-${viewport.name}.png`,
        });
      }
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
  console.log("Area price history passed for desktop and mobile.");
}
