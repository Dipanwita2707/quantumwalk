import { expect, test } from "@playwright/test";

test("Run plays the circuit and synchronizes each gate with the Bloch sphere", async ({ page }) => {
  await page.goto("/workspace?mode=whiteboard");
  const board = page.locator(".qwb-container");
  await board.getByRole("button", { name: "Hadamard Superposition", exact: true }).click();
  await board.getByRole("button", { name: "+ Z (Phase Flip)", exact: true }).click();
  await board.getByRole("button", { name: "+ H (Hadamard)", exact: true }).click();
  await board.getByRole("button", { name: /Run Equation Simulation/ }).click();
  const guide = board.getByRole("region", { name: "State evolution guide" });
  await expect(guide.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  const slider = guide.getByRole("slider", { name: "Quantum evolution step" });
  await slider.fill("1");
  await expect(board.getByRole("button", { name: "Circuit gate 1: H", exact: true })).toHaveAttribute("aria-current", "step");
  await expect(board.locator("canvas")).toHaveAccessibleName(/Bloch vector x 1.00, y 0.00, z 0.00/);
  await slider.fill("2");
  await expect(board.getByRole("button", { name: "Circuit gate 2: Z", exact: true })).toHaveAttribute("aria-current", "step");
  await expect(board.locator("canvas")).toHaveAccessibleName(/Bloch vector x -1.00/);
  await expect(guide).toContainText("relative phase 180°");
  await slider.fill("3");
  await expect(board.locator("canvas")).toHaveAccessibleName(/z -1.00/);
  await guide.getByRole("combobox", { name: "Evolution playback speed" }).selectOption("700");
  await guide.getByRole("button", { name: "Replay steps", exact: true }).click();
  await expect(slider).toHaveValue("0");
  await expect(guide.getByRole("button", { name: "Replay steps", exact: true })).toBeVisible({ timeout: 5000 });
  await expect(slider).toHaveValue("3");
  await expect(board.getByRole("button", { name: "Circuit gate 3: H", exact: true })).toHaveAttribute("aria-current", "step");
});

for (const width of [1440, 390]) {
  test(`equation Run commits changes and sphere controls fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/workspace?mode=whiteboard");
    const board = page.locator(".qwb-container");
    await board.getByRole("button", { name: "Pauli-X Inversion", exact: true }).click();
    await board.getByRole("button", { name: /Run Equation Simulation/ }).click();
    await expect(board.getByRole("status")).toContainText("Simulation complete · Run 1 · 1 gates");
    const excited = board.locator(".qwb-prob-track-row").filter({ hasText: "Excited State" });
    await expect(excited).toContainText("100.0%");
    await board.getByRole("button", { name: "+ X (Pauli NOT)", exact: true }).click();
    await expect(board.getByRole("status")).toContainText("Changes pending");
    await expect(excited).toContainText("100.0%");
    await board.getByRole("button", { name: /Run Equation Simulation/ }).click();
    await expect(board.getByRole("status")).toContainText("Simulation complete · Run 2 · 2 gates");
    await expect(excited).toContainText("0.0%");
    await expect(board.locator(".qwb-coords-matrix")).toContainText("Undefined");
    const sphere = await board.locator(".qwb-sphere-canvas-box").boundingBox();
    const coordinates = await board.locator(".qwb-coords-matrix").boundingBox();
    expect(sphere).not.toBeNull();
    expect(coordinates!.y).toBeGreaterThanOrEqual(sphere!.y + sphere!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}
