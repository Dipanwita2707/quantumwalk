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

test.describe("Lab workflow views", () => {
  test("defaults to Build with gate library and run bar", async ({ page }) => {
    await page.goto("/workspace?preset=bell");
    await expect(page.getByRole("tablist", { name: /Lab workflow/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("tab", { name: "Build", selected: true })).toBeVisible();
    await expect(page.getByRole("group", { name: /Choose a gate/i })).toBeVisible();
    await expect(page.getByRole("region", { name: /Run simulation/i }).getByRole("button", { name: /Run simulation/i })).toBeVisible();
    await expect(page.getByText("Demo lab mode", { exact: true })).toBeVisible();
  });

  test("Simulate tab shows step evolution panel", async ({ page }) => {
    await page.goto("/workspace?mode=circuit");
    await page.getByRole("tab", { name: "Simulate" }).click();
    await expect(page.getByRole("heading", { name: /Step-by-step state evolution/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("group", { name: /Choose a gate/i })).toHaveCount(0);
  });

  test("Analyze tab shows Bloch sphere panel", async ({ page }) => {
    await page.goto("/workspace?mode=circuit");
    await page.getByRole("tab", { name: "Analyze" }).click();
    await expect(page.getByRole("heading", { name: /3D Bloch sphere/i })).toBeVisible({ timeout: 15_000 });
  });

  test("keyboard selects workflow tabs", async ({ page }) => {
    await page.goto("/workspace?mode=circuit");
    const simulate = page.getByRole("tab", { name: "Simulate" });
    await simulate.focus();
    await page.keyboard.press("Enter");
    await expect(simulate).toHaveAttribute("aria-selected", "true");
  });
});
