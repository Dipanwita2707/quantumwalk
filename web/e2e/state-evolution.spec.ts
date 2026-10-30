import { expect, test } from "@playwright/test";
import { interpolateBloch } from "../lib/blochMotion";
import { phaseDegrees, phaseReference, relativePhases, type StateSnapshot } from "../lib/stateExplanation";

test("phase excludes zero amplitudes and ignores a shared global phase", () => {
  expect(phaseDegrees(0, 0)).toBeNull();
  const snapshot: StateSnapshot = { index: 0, bloch: [], probabilities: [], amplitudes: [{ basis: "0", real: 0, imag: Math.SQRT1_2 }, { basis: "1", real: 0, imag: -Math.SQRT1_2 }] };
  expect(relativePhases(snapshot).get("0")).toBeCloseTo(0);
  expect(relativePhases(snapshot).get("1")).toBeCloseTo(180);
});

test("visual Bloch transitions preserve pure-state radius including opposite vectors", () => {
  for (const target of [{ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }]) {
    for (const fraction of [0, .25, .5, .75, 1]) {
      const vector = interpolateBloch({ x: 0, y: 0, z: 1 }, target, fraction);
      expect(Math.hypot(vector.x, vector.y, vector.z)).toBeCloseTo(1, 6);
    }
    expect(interpolateBloch({ x: 0, y: 0, z: 1 }, target, 1)).toEqual(target);
  }
  expect(interpolateBloch({ x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: 0 }, .5).z).toBeCloseTo(.5);
});

test("relative phase uses a dominant amplitude rather than numerical residue", () => {
  const snapshot: StateSnapshot = { index: 0, bloch: [], probabilities: [], amplitudes: [{ basis: "00", real: 1e-7, imag: 0 }, { basis: "10", real: -.5, imag: 0 }, { basis: "11", real: -.5, imag: 0 }] };
  expect(phaseReference(snapshot)?.basis).toBe("10");
  expect(relativePhases(snapshot).get("10")).toBe(0);
  expect(relativePhases(snapshot).get("11")).toBe(0);
});

test.describe("learning state walkthrough", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ authenticated: false, google_enabled: true }) }));
  });

  test("teleportation Start simulation plays all gates and Initial state resets the result", async ({ page }) => {
    await page.goto("/learn/quantum-teleportation");
    const guide = page.getByRole("region", { name: "State evolution guide" });
    const initial = guide.getByRole("button", { name: "Initial state", exact: true });
    const slider = guide.getByRole("slider", { name: "Quantum evolution step" });
    await expect(initial).toBeDisabled();
    await expect(slider).toHaveValue("0");
    await guide.getByRole("combobox", { name: "Evolution playback speed" }).selectOption("700");
    await guide.getByRole("button", { name: "Start simulation", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(guide.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
    await expect(slider).toHaveValue("1");
    await expect(guide.getByRole("button", { name: "Replay steps", exact: true })).toBeVisible({ timeout: 9000 });
    await expect(slider).toHaveValue("7");
    await page.getByRole("button", { name: "Inspect qubit 2", exact: true }).click();
    await expect(page.locator(".cv-bloch-coords")).toContainText("X: 1.000");
    await initial.click();
    await expect(slider).toHaveValue("0");
    await expect(page.locator(".cv-bloch-coords")).toContainText("Z: 1.000");
    await expect(guide.getByRole("button", { name: "Start simulation", exact: true })).toBeEnabled();
    await expect(initial).toBeDisabled();
  });

  test("phase-only Z step and final interference are visible and playback stops", async ({ page }) => {
    await page.goto("/learn/math-amplitudes");
    const guide = page.getByRole("region", { name: "State evolution guide" });
    const slider = page.getByRole("slider", { name: "Quantum evolution step" });
    await expect(slider).toBeEnabled();
    await slider.fill("2");
    const one = page.locator('.qsv-row[data-basis="1"]');
    await expect(one).toContainText("50.0%");
    await expect(one.getByRole("img")).toHaveAccessibleName("Relative phase 180 degrees");
    await expect(guide).toContainText("Probabilities stay the same");
    await slider.fill("3");
    await expect(one).toContainText("100.0%");
    await expect(page.locator('.qsv-row[data-basis="0"]').getByRole("img")).toHaveAccessibleName("Phase undefined for zero amplitude");
    await page.getByRole("combobox", { name: "Evolution playback speed" }).selectOption("700");
    await guide.getByRole("button", { name: "Replay steps" }).click();
    await expect(slider).toHaveValue("0");
    await expect(guide.getByRole("button", { name: "Replay steps" })).toBeVisible({ timeout: 7000 });
    await expect(slider).toHaveValue("3");
    await page.waitForTimeout(900);
    await expect(slider).toHaveValue("3");
  });

  test("advanced lessons open their actual experiment", async ({ page }) => {
    await page.goto("/learn/qft-intro");
    await expect(page.getByRole("navigation", { name: "Lesson stages" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open experiment" })).toHaveAttribute("href", "/academy/labs/qft");
    await expect(page.locator(".cv-container")).toHaveCount(0);
    await page.getByRole("link", { name: "Open experiment" }).click();
    await expect(page).toHaveURL(/\/academy\/labs\/qft/);
  });

  test("a failed lesson simulation can be retried without leaving the lesson", async ({ page }) => {
    let allowSuccess = false;
    await page.route("**/api/explorer/demo/simulate", async (route) => {
      if (!allowSuccess) {
        await route.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ detail: "Too many requests. Please wait and try again." }) });
      } else await route.continue();
    });
    await page.goto("/learn/math-amplitudes");
    await expect(page.getByRole("alert").filter({ hasText: "Too many requests" })).toBeVisible();
    allowSuccess = true;
    await page.getByRole("button", { name: "Retry simulation" }).click();
    await expect(page.getByRole("slider", { name: "Quantum evolution step" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Retry simulation" })).toHaveCount(0);
  });

  test("guest teleportation demonstration transfers the prepared state to q2", async ({ page }) => {
    await page.goto("/learn/quantum-teleportation");
    const slider = page.getByRole("slider", { name: "Quantum evolution step" });
    await expect(slider).toBeEnabled();
    await slider.fill("7");
    await page.getByRole("button", { name: "Inspect qubit 2" }).click();
    await expect(page.locator(".cv-bloch-coords")).toContainText("X: 1.000");
    await expect(page.locator(".cv-bloch-coords")).toContainText("Purity: 100%");
  });

  test("mobile phase view fits and respects reduced motion", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/learn/math-amplitudes");
    await expect(page.locator(".qsv-row").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(parseFloat(await page.locator(".qsv-bar > span").first().evaluate((element) => getComputedStyle(element).transitionDuration))).toBeLessThan(.001);
    await page.getByRole("slider", { name: "Quantum evolution step" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("slider", { name: "Quantum evolution step" })).toHaveValue("1");
  });

  test("Lab summary follows the selected step and stale playback is disabled", async ({ page }) => {
    await page.goto("/workspace?mode=circuit&preset=bell");
    await page.locator(".circuit-panel").getByRole("button", { name: /Execute/i }).click();
    const slider = page.getByRole("slider", { name: "Quantum evolution step" });
    await expect(slider).toBeEnabled();
    await slider.fill("0");
    await expect(page.getByRole("list", { name: "Top measurement probabilities" })).toContainText("100.0%");
    await expect(page.locator('.qsv-row[data-basis="00"]')).toContainText("100.0%");
    await slider.fill("1");
    await expect(page.getByRole("list", { name: "Top measurement probabilities" })).toContainText("50.0%");
    await page.getByRole("button", { name: "Select Pauli Z gate" }).click();
    await page.getByRole("button", { name: "Add Pauli Z to qubit 0" }).click();
    await expect(slider).toBeDisabled();
    await expect(page.getByRole("region", { name: "State evolution guide" })).toContainText("Execute the updated circuit");
  });

  test("Execute automatically plays the circuit gates and synchronized state snapshots", async ({ page }) => {
    await page.goto("/workspace?preset=superposition&mode=circuit");
    await page.getByRole("button", { name: "Select Pauli Z gate", exact: true }).click();
    await page.getByRole("button", { name: "Add Pauli Z to qubit 0", exact: true }).click();
    await page.getByRole("button", { name: "Select Hadamard gate", exact: true }).click();
    await page.getByRole("button", { name: "Add Hadamard to qubit 0", exact: true }).click();
    await page.locator(".circuit-panel").getByRole("button", { name: /Execute/i }).click();
    const guide = page.getByRole("region", { name: "State evolution guide" });
    const slider = guide.getByRole("slider", { name: "Quantum evolution step" });
    await expect(slider).toHaveValue("0");
    await expect(guide.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
    await expect(slider).toHaveValue("1");
    await expect(page.locator(".wire-row").first().locator(".operation-slot").nth(0)).toHaveAttribute("aria-current", "step");
    await expect(page.locator('.qsv-row[data-basis="1"]')).toContainText("50.0%");
    await expect(slider).toHaveValue("2");
    await expect(page.locator(".wire-row").first().locator(".operation-slot").nth(1)).toHaveAttribute("aria-current", "step");
    await expect(page.locator('.qsv-row[data-basis="1"]').getByRole("img")).toHaveAccessibleName("Relative phase 180 degrees");
    await expect(slider).toHaveValue("3");
    await expect(page.locator('.qsv-row[data-basis="1"]')).toContainText("100.0%");
    await expect(guide.getByRole("button", { name: "Replay steps", exact: true })).toBeVisible();
    await expect(page.locator(".slot-completed")).toHaveCount(2);
  });
});

