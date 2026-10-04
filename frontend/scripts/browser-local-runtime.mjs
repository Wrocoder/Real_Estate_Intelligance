import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = new URL(process.env.BROWSER_BASE_URL ?? "http://127.0.0.1:3000");
const apiBaseUrl = new URL(process.env.BROWSER_API_BASE_URL ?? "http://127.0.0.1:8000");
const localHosts = ["127.0.0.1", "localhost", "[::1]"];
assert(localHosts.includes(baseUrl.hostname) && localHosts.includes(apiBaseUrl.hostname),
  "This regression creates a test account and must run against local services.");

const email = `local-runtime-${Date.now()}@example.test`;
const password = "LocalRuntime-2026!";
const registration = await fetch(new URL("/api/v1/auth/register", apiBaseUrl), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
assert.equal(registration.status, 201, "Local database must support account registration");
console.log(`Test account: ${email}`);

await fs.mkdir("artifacts/local-runtime", { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const host of ["127.0.0.1", "localhost"]) {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const origin = new URL(baseUrl);
      origin.hostname = host;
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const errors = [];
      const failedRequests = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("requestfailed", request => failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
      try {
        await page.goto(new URL("/account", origin).href, { waitUntil: "networkidle" });
        await page.locator(".auth-form").waitFor();
        await page.locator('input[autocomplete="email"]').fill(email);
        await page.locator('input[autocomplete="current-password"]').fill("IncorrectPassword!");
        const invalidLogin = page.waitForResponse(response => response.url().endsWith("/auth/login"));
        await page.locator(".auth-submit").click();
        assert.equal((await invalidLogin).status(), 401);
        await page.locator(".auth-error").waitFor();
        assert.equal(await page.locator('input[autocomplete="email"]').inputValue(), email);

        await page.locator('input[autocomplete="current-password"]').fill(password);
        await page.locator(".auth-submit").click();
        await page.getByRole("button", { name: "Wyloguj", exact: true }).waitFor();
        await page.reload({ waitUntil: "networkidle" });
        await page.getByRole("button", { name: "Wyloguj", exact: true }).waitFor();
        assert.equal(await page.locator(".auth-form").count(), 0, "Session survives reload");

        await page.goto(new URL("/areas", origin).href, { waitUntil: "networkidle" });
        const locations = page.locator("#areas-location-options option");
        assert(await locations.count() > 0, "Supported locations must load from the live database");
        const location = page.getByLabel("Miejscowość", { exact: true });
        assert(await location.isEnabled());
        await page.waitForFunction(() => document.querySelector('input[list="areas-location-options"]')?.value);
        assert((await location.inputValue()).length > 0);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
        await page.screenshot({ path: `artifacts/local-runtime/areas-${host}-${viewport.width}.png` });

        await page.goto(new URL("/account", origin).href, { waitUntil: "networkidle" });
        const logout = page.waitForResponse(response => response.url().endsWith("/auth/logout"));
        await page.getByRole("button", { name: "Wyloguj", exact: true }).click();
        assert.equal((await logout).status(), 204);
        await page.locator(".auth-form").waitFor();
        await page.waitForLoadState("networkidle");
        await page.reload({ waitUntil: "networkidle" });
        await page.locator(".auth-form").waitFor();
        assert.deepEqual(errors, [], "No browser exceptions");
        // Chromium can mark a successfully received bodyless 204 response as aborted.
        const networkErrors = failedRequests.filter(request => !(
          request.url.endsWith("/auth/logout") && request.error === "net::ERR_ABORTED"
        ));
        assert.deepEqual(networkErrors, [], "No failed network requests");
        console.log(`${host}:${origin.port} ${viewport.width}px: login, persistence, locations and logout passed`);
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}
