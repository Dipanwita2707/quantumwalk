import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/me", route => route.fulfill({ json: { authenticated: false, google_enabled: true } }));
});

test("practical first-qubit lab runs three actual preparation/readout experiments", async ({ page }, testInfo) => {
  await page.goto("/learn/first-qubit");
  const lab = page.getByRole("region", { name: "From a qubit to a readout" });
  await expect(lab.getByRole("button", { name: "Run experiment", exact: true })).toBeDisabled();
  await lab.getByRole("radio", { name: "About half 0, half 1", exact: true }).check();
  const responsePromise = page.waitForResponse(response => response.url().includes("/api/explorer/demo/simulate") && response.request().method() === "POST");
  await lab.getByRole("button", { name: "Run experiment", exact: true }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  expect(response.request().postDataJSON()).toMatchObject({ qubits: 1, shots: 128, operations: [{ gate: "h", target: 0 }, { gate: "measure", target: 0 }] });
  const data = await response.json();
  expect(Object.values(data.counts as Record<string, number>).reduce((sum, count) => sum + count, 0)).toBe(128);
  const slider = lab.getByRole("slider", { name: "Quantum evolution step" });
  await expect(slider).toBeEnabled();
  await slider.fill("1");
  await expect(lab.getByRole("meter", { name: "Ideal probability of 1", exact: true })).toHaveAttribute("aria-valuenow", /49\.99|50/);
  await expect(lab.locator("canvas")).toHaveAccessibleName(/Bloch vector x 1.00/);
  await expect(lab.getByRole("status")).toHaveCount(0);
  await slider.fill("2");
  await expect(lab.getByRole("status")).toContainText("Your prediction matches the ideal distribution");
  await expect(lab.getByRole("meter", { name: "Sampled frequency of 1", exact: true })).toHaveAttribute("aria-valuenow", String((data.counts["1"] ?? 0) / 128 * 100));
  await page.waitForTimeout(1000); // Capture after the visual state/bar transitions settle.
  await lab.screenshot({ path: testInfo.outputPath("first-qubit-practical-lab.png") });

  await lab.getByRole("button", { name: "01 · Baseline", exact: true }).click();
  await expect(lab.getByRole("slider")).toHaveCount(0);
  await lab.getByRole("combobox", { name: "Repeated preparations (shots)" }).selectOption("32");
  await lab.getByRole("radio", { name: "Only 0", exact: true }).check();
  await lab.getByRole("button", { name: "Run experiment", exact: true }).click();
  await expect(lab.getByRole("slider")).toHaveValue("1");
  await expect(lab.getByRole("meter", { name: "Sampled frequency of 0", exact: true })).toHaveAttribute("aria-valuenow", "100");
  await expect(lab).toContainText("32 / 32 shots");

  await lab.getByRole("button", { name: "03 · Apply H twice", exact: true }).click();
  await lab.getByRole("combobox", { name: "Repeated preparations (shots)" }).selectOption("1024");
  await lab.getByRole("radio", { name: "Only 0", exact: true }).check();
  await lab.getByRole("button", { name: "Run experiment", exact: true }).click();
  await expect(lab.getByRole("slider")).toBeEnabled();
  await lab.getByRole("slider").fill("3");
  await expect(lab).toContainText("1024 / 1024 shots");
  await expect(lab.getByRole("status")).toContainText("H² = I");
  await lab.getByRole("button", { name: "Replay steps", exact: true }).click();
  await expect(lab.getByRole("slider")).toHaveValue("0");
});

test("practical lab retries an API error and fits a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  let fail = true;
  await page.route("**/api/explorer/demo/simulate", async route => {
    if (fail) await route.fulfill({ status: 503, json: { detail: "Simulator unavailable" } });
    else await route.continue();
  });
  await page.goto("/learn/first-qubit");
  const lab = page.getByRole("region", { name: "From a qubit to a readout" });
  await lab.getByRole("radio", { name: "About half 0, half 1", exact: true }).check();
  await lab.getByRole("button", { name: "Run experiment", exact: true }).click();
  await expect(lab.getByRole("alert")).toContainText("Simulator unavailable");
  fail = false;
  await lab.getByRole("button", { name: "Run experiment", exact: true }).click();
  await expect(lab.getByRole("slider")).toBeEnabled();
  await expect(lab.getByRole("alert")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await lab.getByRole("slider").focus();
  await page.keyboard.press("ArrowRight");
  await expect(lab.getByRole("slider")).toHaveValue("1");
});
