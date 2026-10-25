import { test, expect } from "@playwright/test";

test("Shor lab factors 15 with base 7", async ({ page }) => {
  await page.goto("/academy/labs/shor");
  await expect(page.getByTestId("shor-lab")).toBeVisible();
  await page.getByTestId("shor-n").selectOption("15");
  await page.getByTestId("shor-a").fill("7");
  await page.getByTestId("shor-run").click();
  await expect(page.getByTestId("shor-steps")).toBeVisible();
  await expect(page.getByTestId("shor-factors")).toContainText(/3.*5.*=.*15|5.*3.*=.*15/);
  await expect(page.getByTestId("shor-measurement")).toContainText(/c =/);
  await expect(page.getByTestId("shor-classical-ref")).toContainText(/verification only/i);
  await expect(page.getByTestId("shor-simulation-mode")).toContainText(/Closed-form state \+ direct IQFT/i);
  await expect(page.getByTestId("shor-path-comparison")).toContainText(/Three-path comparison/i);
  await expect(page.getByTestId("shor-modexp-comparison")).toContainText(/state fidelity/i);
  await expect(page.getByTestId("shor-iqft-comparison")).toContainText(/Bhattacharyya fidelity/i);
});

test("Shor lab end-to-end gate path runs measurement", async ({ page }) => {
  await page.goto("/academy/labs/shor");
  await page.getByTestId("shor-simulation-path").selectOption("gate_e2e");
  await page.getByTestId("shor-run").click();
  await expect(page.getByTestId("shor-simulation-mode")).toContainText(/Orbit-compact gates/i);
  await expect(page.getByTestId("shor-measurement")).toContainText(/c =/);
});

test("Shor lesson links QFT prerequisite", async ({ page }) => {
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
          slug: "shor-intro",
          title: "Shor's algorithm (period finding)",
          level: "Advanced",
          minutes: 18,
          objective: "Period finding.",
          prerequisites: "QFT lesson and lab.",
          prerequisite_slugs: ["qft-intro"],
          steps: ["Open /academy/labs/shor."],
          algorithm_slug: "grover-two",
          question: "Simulated measurement is:",
          choices: ["Counting outcome c", "Classical brute force", "Random"],
        },
      ]),
    });
  });
  await page.goto("/learn/shor-intro");
  await expect(page.getByTestId("lesson-prereq-link-shor-intro-qft-intro")).toHaveAttribute(
    "href",
    "/learn/qft-intro",
  );
});

test("Shor lab rejects non-coprime base", async ({ page }) => {
  await page.goto("/academy/labs/shor");
  await page.getByTestId("shor-n").selectOption("15");
  await page.getByTestId("shor-a").fill("5");
  await page.getByTestId("shor-run").click();
  await expect(page.getByTestId("shor-validation")).toContainText(/gcd/i);
});
