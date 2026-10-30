import { test } from "@playwright/test";
import path from "path";

const guestSession = { authenticated: false, google_enabled: true };

const routes = [
  { name: "dashboard", path: "/dashboard" },
  { name: "learn", path: "/learn" },
  { name: "explorer", path: "/explorer" },
  { name: "hub", path: "/hub" },
  { name: "lab-build", path: "/workspace?mode=circuit&preset=bell" },
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
          objective: "See superposition.",
          steps: ["Step"],
          algorithm_slug: "superposition",
          question: "Q?",
          choices: ["A", "B"],
        },
      ]),
    });
  });
  await page.route("**/api/challenges", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
});

for (const phase of ["after"] as const) {
  for (const route of routes) {
    for (const viewport of [
      { label: "desktop", width: 1280, height: 900 },
      { label: "mobile", width: 390, height: 844 },
    ]) {
      test(`${phase} ${route.name} ${viewport.label}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(route.path);
        await page.waitForTimeout(800);
        const out = path.join(
          process.cwd(),
          "..",
          "docs",
          "ux-refinement",
          "screenshots",
          phase,
          `${route.name}-${viewport.label}.png`,
        );
        await page.screenshot({ path: out, fullPage: true });
      });
    }
  }
}
