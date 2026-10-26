import { test, expect } from "@playwright/test";

const guestSession = { authenticated: false, google_enabled: true };

test.beforeEach(async ({ page }) => {
  await page.route("**/api/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(guestSession),
    });
  });
});

test.describe("Explorer & Tools hubs (Phase 5)", () => {
  test("explorer overview has demo sidebar", async ({ page }) => {
    await page.goto("/explorer");
    await expect(page.getByRole("navigation", { name: "Explorer demos" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Explorer preview")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Problem/i);
  });

  test("TSP explorer keeps sidebar nav", async ({ page }) => {
    await page.goto("/explorer/tsp");
    const nav = page.getByRole("navigation", { name: "Explorer demos" });
    await expect(nav).toBeVisible({ timeout: 20_000 });
    await expect(nav.getByRole("link", { name: /Three-city routes/i })).toHaveAttribute("aria-current", "page");
  });

  test("tools hub has directory nav and primary tools", async ({ page }) => {
    await page.goto("/hub");
    await expect(page.getByRole("navigation", { name: "Tools directory" })).toBeVisible();
    await expect(page.getByLabel("Primary tools")).toBeVisible();
    await expect(page.getByRole("link", { name: /Document Pro/i }).first()).toBeVisible();
  });

  test("doc editor shows tools sidebar", async ({ page }) => {
    await page.goto("/hub/doc-editor");
    await expect(page.getByRole("navigation", { name: "Tools directory" })).toBeVisible();
    await expect(page.getByLabel("Markdown source")).toBeVisible();
  });
});
