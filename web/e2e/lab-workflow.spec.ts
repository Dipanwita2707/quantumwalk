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

test.describe("Lab circuit layout", () => {
  test("shows the circuit and Bloch sphere together", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/workspace?preset=bell");
    await expect(page.getByRole("heading", { name: /3D Bloch sphere/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(".circuit-panel")).toBeVisible();
    await expect(page.getByRole("group", { name: /Choose a gate/i })).toBeVisible();
    await expect(page.locator(".circuit-panel").getByRole("button", { name: /Execute/i })).toBeVisible();
    await expect(page.getByRole("tablist", { name: /Lab workflow/i })).toHaveCount(0);
    await expect(page.getByText("Demo lab mode", { exact: true })).toBeVisible();

    const circuit = await page.locator(".circuit-panel").boundingBox();
    const bloch = await page.locator(".bloch-panel").boundingBox();
    expect(circuit).not.toBeNull();
    expect(bloch).not.toBeNull();
    expect(bloch!.x).toBeGreaterThan(circuit!.x + circuit!.width * 0.45);
  });

  test("stacks results under the circuit when the side has no room", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    await page.goto("/workspace?mode=circuit&preset=bell");
    await expect(page.getByRole("heading", { name: /3D Bloch sphere/i })).toBeVisible({ timeout: 20_000 });
    const circuit = await page.locator(".circuit-panel").boundingBox();
    const bloch = await page.locator(".bloch-panel").boundingBox();
    expect(circuit).not.toBeNull();
    expect(bloch).not.toBeNull();
    expect(bloch!.y).toBeGreaterThan(circuit!.y + 80);
    expect(Math.abs(bloch!.x - circuit!.x)).toBeLessThan(40);
  });

  test("steps stay collapsed until opened", async ({ page }) => {
    await page.goto("/workspace?mode=circuit");
    const steps = page.getByRole("heading", { name: /Step-by-step state evolution/i });
    await expect(steps).toBeHidden();
    await page.locator("summary").filter({ hasText: "Step-by-step state evolution" }).click();
    await expect(steps).toBeVisible();
  });
});
