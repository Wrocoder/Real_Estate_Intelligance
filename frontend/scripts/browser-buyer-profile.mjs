import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.BROWSER_BASE_URL ?? "http://127.0.0.1:3010";
const apiBaseUrl = process.env.BROWSER_API_BASE_URL ?? "http://127.0.0.1:8020";
const artifactDir = path.resolve("artifacts");
const failures = [];

await fs.mkdir(artifactDir, { recursive: true });
await fetch(`${apiBaseUrl}/api/v1/me/buyer-profile`, { method: "DELETE" });

const browser = await chromium.launch({ headless: true });
try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await desktop.newPage();
  const pageErrors = [];
  const failedResponses = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.url().includes("/api/") && response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(`${baseUrl}/account`, { waitUntil: "networkidle" });
  const profileHeading = page.getByRole("heading", { name: "Profil kupującego" });
  await profileHeading.waitFor();
  await page.getByLabel("Cel zakupu").selectOption("family");
  await page.getByLabel("Maksymalna cena mieszkania").fill("850000");
  await page.getByLabel("Cena i wartość").check();
  await page.getByLabel("Niższe ryzyko").check();
  await page.getByLabel("Dopasowanie dla rodziny").check();
  await page.getByRole("button", { name: "Zapisz profil" }).click();
  await page.getByText("Profil kupującego zapisany.", { exact: true }).waitFor();
  await page.reload({ waitUntil: "networkidle" });

  if ((await page.getByLabel("Cel zakupu").inputValue()) !== "family") {
    failures.push("desktop: saved buying purpose was not restored");
  }
  if ((await page.getByLabel("Maksymalna cena mieszkania").inputValue()) !== "850000") {
    failures.push("desktop: saved budget was not restored");
  }
  for (const [locale, heading] of [
    ["en", "Buyer profile"],
    ["ru", "Профиль покупателя"],
    ["uk", "Профіль покупця"],
    ["pl", "Profil kupującego"],
  ]) {
    await page.evaluate((nextLocale) => localStorage.setItem("domarion-locale", nextLocale), locale);
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("heading", { name: heading }).waitFor();
  }
  await page.screenshot({ path: path.join(artifactDir, "buyer-profile-desktop.png"), fullPage: true });

  await page.goto(`${baseUrl}/check`, { waitUntil: "networkidle" });
  await page.getByText("Używamy zapisanego celu zakupu.", { exact: false }).waitFor();

  await page.goto(`${baseUrl}/compare?ids=wr-001,wr-002`, { waitUntil: "networkidle" });
  await page.getByText("Rekomendacja dopasowana do Twojego profilu kupującego", { exact: true }).waitFor();

  await page.goto(`${baseUrl}/areas/compare`, { waitUntil: "networkidle" });
  await page.getByText("Ranking dzielnic zaczyna się od wskaźnika", { exact: false }).waitFor();
  if ((await page.getByLabel("Sortowanie").inputValue()) !== "value") {
    failures.push("desktop: profile priority did not select the value area ranking");
  }

  if (pageErrors.length) failures.push(`desktop: page errors: ${pageErrors.join(" | ")}`);
  if (failedResponses.length) failures.push(`desktop: API failures: ${failedResponses.join(" | ")}`);
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobile.newPage();
  const mobileErrors = [];
  mobilePage.on("pageerror", (error) => mobileErrors.push(error.message));
  await mobilePage.goto(`${baseUrl}/account`, { waitUntil: "networkidle" });
  await mobilePage.getByRole("heading", { name: "Profil kupującego" }).waitFor();
  const overflow = await mobilePage.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  if (overflow) failures.push("mobile: horizontal overflow detected on buyer profile");
  if (mobileErrors.length) failures.push(`mobile: page errors: ${mobileErrors.join(" | ")}`);
  await mobilePage.screenshot({ path: path.join(artifactDir, "buyer-profile-mobile.png"), fullPage: true });
  await mobile.close();
} finally {
  await browser.close();
  await fetch(`${apiBaseUrl}/api/v1/me/buyer-profile`, { method: "DELETE" });
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Buyer profile flow passed on desktop and mobile.");
}
