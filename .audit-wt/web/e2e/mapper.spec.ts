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

test("Mapper workspace opens and encodes TSP route index", async ({ page }) => {
  await page.goto("/explorer/mapper");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Classical ↔ quantum encoding/i);
  await page.getByTestId("mapper-route-index").fill("5");
  await expect(page.getByTestId("mapper-bitstring")).toHaveText("101");
});

test("Mapper rejects invalid route index", async ({ page }) => {
  await page.goto("/explorer/mapper");
  await page.getByTestId("mapper-route-index").fill("99");
  await expect(page.getByTestId("mapper-validation")).toBeVisible();
});

test("Mapper decode rejects invalid padding bitstring", async ({ page }) => {
  await page.goto("/explorer/mapper");
  await page.getByTestId("mapper-decode-bitstring").fill("111");
  await expect(page.getByTestId("mapper-decode-error")).toContainText(/padding/i);
});

test("Mapper binary example encodes value", async ({ page }) => {
  await page.goto("/explorer/mapper");
  await expect(page.getByTestId("mapper-example-binary-int")).toBeVisible();
  await page.getByTestId("mapper-example-binary-int").click();
  await expect(page.getByTestId("mapper-binary-value")).toBeVisible();
  await page.getByTestId("mapper-binary-value").fill("5");
  await expect(page.getByTestId("mapper-binary-result")).toBeVisible();
  await expect(page.getByTestId("mapper-binary-result").getByTestId("mapper-bitstring")).toHaveText("101");
});
