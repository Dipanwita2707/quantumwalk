/**
 * Phase 1 navigation shell — primary IA, single active state, breadcrumbs, mobile menu.
 */
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

async function primaryNav(page: import("@playwright/test").Page) {
  return page.getByRole("navigation", { name: /Primary navigation/i });
}

test.describe("Navigation shell", () => {
  test("primary nav exposes five destinations", async ({ page }) => {
    await page.goto("/dashboard");
    const nav = await primaryNav(page);
    for (const label of ["Home", "Learn", "Lab", "Explore", "Tools"]) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
  });

  test("learn reference activates Learn only", async ({ page }) => {
    await page.goto("/learn/reference");
    const nav = await primaryNav(page);
    await expect(nav.getByRole("link", { name: "Learn", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Explore", exact: true })).not.toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Glossary");
  });

  test("explorer hub activates Explore", async ({ page }) => {
    await page.goto("/explorer");
    const nav = await primaryNav(page);
    await expect(nav.getByRole("link", { name: "Explore", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
  });

  test("academy route activates Learn not Tools", async ({ page }) => {
    await page.goto("/academy");
    const nav = await primaryNav(page);
    await expect(nav.getByRole("link", { name: "Learn", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Tools", exact: true })).not.toHaveAttribute("aria-current", "page");
  });

  test("direct URL /hub/tools activates Tools", async ({ page }) => {
    await page.goto("/hub");
    const nav = await primaryNav(page);
    await expect(nav.getByRole("link", { name: "Tools", exact: true })).toHaveAttribute("aria-current", "page");
  });

  test("mobile menu includes Explore and opens with keyboard", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    const summary = page.getByRole("group").getByText("Menu");
    await summary.focus();
    await page.keyboard.press("Enter");
    const mobileNav = page.getByRole("navigation", { name: /Mobile navigation/i });
    await expect(mobileNav).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Explore" })).toBeVisible();
  });

  test("lab link uses client navigation target", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("navigation", { name: /Primary navigation/i }).getByRole("link", { name: "Lab" }).click();
    await expect(page).toHaveURL(/\/workspace/);
  });
});
