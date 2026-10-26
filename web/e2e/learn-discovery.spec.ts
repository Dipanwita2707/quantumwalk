import { test, expect } from "@playwright/test";

test.describe("Learn discovery (Phase 4)", () => {
  test("/academy redirects to unified /learn hub", async ({ page }) => {
    await page.goto("/academy");
    await expect(page).toHaveURL(/\/learn\/?$/);
    await expect(page.getByRole("heading", { level: 1, name: /Quantum Academy/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByLabel("Academy units")).toBeVisible();
    await expect(page.getByLabel("More learning resources")).toBeVisible();
  });

  test("module index is collapsible", async ({ page }) => {
    await page.goto("/learn");
    const details = page.locator("details.learn-module-index");
    await expect(details).toBeVisible({ timeout: 20_000 });
    await expect(page.getByLabel("Sirraya-aligned modules")).toBeHidden();
    await details.locator("summary").click();
    await expect(page.getByLabel("Sirraya-aligned modules")).toBeVisible();
  });

  test("Learn nav item active on /academy redirect target", async ({ page }) => {
    await page.goto("/learn");
    await expect(page.getByRole("link", { name: "Learn", exact: true })).toHaveClass(/active/);
  });
});
