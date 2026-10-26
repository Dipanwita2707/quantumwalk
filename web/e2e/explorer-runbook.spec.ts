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

test.describe("Explorer runbook (CRRE)", () => {
  test("Grover explorer exposes Configure Run Results Explanation tabs", async ({ page }) => {
    await page.goto("/explorer/grover");
    const tabs = page.getByRole("tablist", { name: "Explorer workflow" });
    await expect(tabs).toBeVisible({ timeout: 20_000 });
    for (const label of ["Configure", "Run", "Results", "Explanation"]) {
      await expect(tabs.getByRole("tab", { name: label })).toBeVisible();
    }
    await tabs.getByRole("tab", { name: "Results" }).click();
    await expect(page.getByRole("tabpanel", { name: "Results" })).toBeVisible();
    await expect(page.getByLabel("Probability comparison")).toBeVisible();
  });

  test("TSP explorer runbook switches to Results compare charts", async ({ page }) => {
    await page.goto("/explorer/tsp");
    await expect(page.getByRole("tablist", { name: "Explorer workflow" })).toBeVisible({ timeout: 20_000 });
    await page.getByRole("tablist", { name: "Explorer workflow" }).getByRole("tab", { name: "Results" }).click();
    await expect(page.getByTestId("explorer-tsp-results")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/WHY ONE MARKED ROUTE/i)).toHaveCount(0);
  });

  test("Mapper runbook hides lab on Explanation tab", async ({ page }) => {
    await page.goto("/explorer/mapper");
    await expect(page.getByTestId("mapper-example-tsp-route")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("tab", { name: "Explanation" }).click();
    await expect(page.getByTestId("mapper-example-tsp-route")).toHaveCount(0);
  });
});
