import { test } from "@playwright/test";
import path from "path";

/** Set DASHBOARD_CAPTURE_DIR to e.g. dashboard-refinement-20261026 */
const captureDir =
  process.env.DASHBOARD_CAPTURE_DIR ?? "dashboard-refinement-20261026";
/** before | after */
const phase = process.env.DASHBOARD_CAPTURE_PHASE ?? "before";

const guestSession = { authenticated: false, google_enabled: true };

const viewports = [
  { label: "desktop", width: 1280, height: 900 },
  { label: "tablet", width: 768, height: 1024 },
  { label: "mobile", width: 390, height: 844 },
] as const;

test.beforeEach(async ({ page }) => {
  await page.route("**/api/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(guestSession),
    });
  });
  await page.route("**/api/lessons", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          slug: "first-qubit",
          title: "Your First Qubit",
          level: "Beginner",
          minutes: 5,
          objective: "See superposition on the Bloch sphere.",
          algorithm_slug: "superposition",
        },
      ]),
    });
  });
  await page.route("**/api/challenges", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
});

for (const viewport of viewports) {
  test(`${phase} dashboard ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/dashboard");
    await page.waitForTimeout(800);
    const out = path.join(
      process.cwd(),
      "..",
      "docs",
      "ux-refinement",
      "screenshots",
      captureDir,
      phase,
      `dashboard-${viewport.label}.png`,
    );
    await page.screenshot({ path: out, fullPage: true });
  });
}
