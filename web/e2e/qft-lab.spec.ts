import { test, expect } from "@playwright/test";

test("Custom amplitudes require normalize before run", async ({ page }) => {
  await page.goto("/academy/labs/qft");
  await page.getByRole("radio", { name: /Custom amplitudes/i }).check();
  await page.getByTestId("qft-amp-re-0").fill("2");
  await page.getByTestId("qft-run").click();
  await expect(page.getByTestId("qft-validation")).toContainText(/not normalized/i);
  await page.getByTestId("qft-normalize").click();
  await page.getByTestId("qft-run").click();
  await expect(page.getByTestId("qft-norm")).toContainText("1.000000");
});

test("QFT lab preserves norm and round-trips", async ({ page }) => {
  await page.goto("/academy/labs/qft");
  await expect(page.getByTestId("qft-lab")).toBeVisible();
  await page.getByTestId("qft-run").click();
  await expect(page.getByTestId("qft-norm")).toContainText("1.000000");
  await page.getByRole("radio", { name: /Forward then inverse/i }).check();
  await page.getByTestId("qft-run").click();
  await expect(page.getByText(/Recovered original state/i)).toBeVisible();
});

test("QFT lesson page renders expanded title", async ({ page }) => {
  await page.route("**/api/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ authenticated: false, google_enabled: true }),
    });
  });
  await page.route("**/api/lessons", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          slug: "qft-intro",
          title: "Quantum Fourier Transform",
          level: "Advanced",
          minutes: 20,
          objective: "Define the QFT.",
          steps: ["Open /academy/labs/qft for the exercise."],
          algorithm_slug: "superposition",
          question: "Round-trip uses:",
          choices: ["Fidelity (equal up to global phase)", "Hardware", "Random"],
        },
      ]),
    });
  });
  await page.goto("/learn/qft-intro");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Quantum Fourier Transform/i, {
    timeout: 20_000,
  });
});
