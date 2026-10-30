import { test, expect } from "@playwright/test";

test.describe("Lab guest interaction", () => {
  test("gate category filters are keyboard-operable buttons", async ({ page }) => {
    await page.goto("/workspace?mode=circuit");
    const filters = page.getByRole("group", { name: "Gate categories" });
    const pauli = filters.getByRole("button", { name: "Pauli" });
    await pauli.focus();
    await page.keyboard.press("Enter");
    await expect(pauli).toHaveAttribute("aria-pressed", "true");
    await expect(filters.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator(".gate-list").getByRole("button", { name: "Select Hadamard gate" })).toHaveCount(0);
    await expect(page.locator(".gate-list").getByRole("button", { name: "Select Pauli X (NOT) gate" })).toBeVisible();
  });

  test("run waits for session and preset hydration", async ({ page }) => {
    await page.route("**/api/me", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ authenticated: false }) });
    });

    await page.goto("/workspace?mode=circuit&preset=bell");
    const runBtn = page.locator(".circuit-panel").getByRole("button", { name: /Execute/i });
    await expect(runBtn).toBeDisabled();
    await expect(runBtn).toBeEnabled({ timeout: 20_000 });
    await expect(page.locator(".circuit-panel .meta").filter({ hasText: /gates/i })).toHaveText(/2 gates/);
    await runBtn.click();
    await expect(page.getByLabel("Top measurement probabilities").locator("progress").first()).toBeVisible({ timeout: 30_000 });
  });

  test("mode=circuit without preset — gates and run", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await page.goto("/workspace?mode=circuit");
    await expect(page.getByRole("navigation", { name: /Primary navigation/i })).toBeVisible({ timeout: 20_000 });

    const runBtn = page.locator(".circuit-panel").getByRole("button", { name: /Execute/i });
    await expect(runBtn).toBeEnabled({ timeout: 20_000 });

    await expect(page.locator(".circuit-panel .meta").filter({ hasText: /gates/i })).toHaveText(/1 gates/);
    await page.getByRole("button", { name: /Select Hadamard gate/i }).click();
    await page.getByRole("button", { name: /Add Hadamard to qubit 0/i }).click();
    await expect(page.locator(".circuit-panel .meta").filter({ hasText: /gates/i })).toHaveText(/2 gates/);

    await runBtn.click();
    await expect(page.getByRole("heading", { name: /3D Bloch sphere/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(".circuit-panel")).toBeVisible();
    await expect(page.getByLabel("Top measurement probabilities").locator("progress").first()).toBeVisible();
    await expect(page.getByRole("tab", { name: "Simulate" })).toHaveCount(0);

    expect(consoleErrors.filter((e) => !e.includes("favicon"))).toEqual([]);
  });
});
