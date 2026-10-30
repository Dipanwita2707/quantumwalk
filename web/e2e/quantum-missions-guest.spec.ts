import { test, expect } from "@playwright/test";

test.describe("Quantum missions on whiteboard", () => {
  test("circuit URL with quantum-missions hash opens whiteboard missions", async ({ page }) => {
    await page.goto("/workspace?mode=circuit#quantum-missions");
    await expect(page.locator("#quantum-missions")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Whiteboard", exact: true })).toHaveAttribute("aria-pressed", "true");
  });

  test("guest can run mission and see step timeline", async ({ page }) => {
    await page.goto("/workspace?mode=whiteboard#quantum-missions");
    await expect(page.locator("#quantum-missions")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /^A Only 0$/ }).click();
    await page.getByRole("button", { name: /Enter the experiment/i }).click();
    await expect(page.getByText(/The starting state|Possibility paths/i).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByLabel("Experiment steps").getByRole("button", { name: /STEP 1/i })).toBeEnabled();
  });
});
