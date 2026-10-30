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
  test("explorer overview has one experiment catalog and opens a demo", async ({ page }) => {
    await page.goto("/explorer");
    await expect(page.getByRole("navigation", { name: "Explorer demos" })).toHaveCount(0);
    await expect(page.getByText("Explorer preview")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Problem/i);
    await page.getByRole("link", { name: /Suggested first stop: Three-city routes/ }).click();
    await expect(page).toHaveURL(/\/explorer\/tsp/);
  });

  test("explorer catalog search filters demos", async ({ page }) => {
    await page.goto("/explorer");
    await page.getByLabel("Search experiments").fill("mapper");
    const catalog = page.getByLabel("Explorer demos");
    await expect(catalog.getByRole("heading", { level: 2, name: /Classical ↔ quantum mapper/i })).toBeVisible();
    await expect(catalog.getByRole("heading", { level: 2, name: /Three-city routes/i })).toHaveCount(0);
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

  test("tools catalog search filters list", async ({ page }) => {
    await page.goto("/hub");
    await page.getByLabel("Search tools").fill("ml studio");
    const catalog = page.locator(".qw-hub-catalog");
    await expect(catalog.getByRole("heading", { level: 3, name: /ML Studio/i })).toBeVisible();
    await expect(catalog.getByRole("heading", { level: 3, name: /Doc Editor/i })).toHaveCount(0);
  });

  test("doc editor shows tools sidebar", async ({ page }) => {
    await page.goto("/hub/doc-editor");
    await expect(page.getByRole("navigation", { name: "Tools directory" })).toBeVisible();
    await expect(page.getByLabel("Markdown source")).toBeVisible();
  });
});
