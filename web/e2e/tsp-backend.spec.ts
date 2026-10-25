import { test, expect } from "@playwright/test";

const guestSession = { authenticated: false, google_enabled: true };

const tspReference = {
  primary_bits: "001",
  ideal_probabilities: { "000": 0.1, "001": 0.5, "010": 0.1 },
  note: "Test preset reference.",
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(guestSession),
    });
  });
});

test("TSP explorer shows offline health and disables backend solve", async ({ page }) => {
  await page.route("**/health", async (route) => {
    await route.abort("failed");
  });
  await page.route("**/api/explorer/tsp", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(tspReference) });
  });

  await page.goto("/explorer/tsp");
  await expect(page.getByRole("status", { name: "Backend API status" })).toContainText(/API offline/i, {
    timeout: 20_000,
  });
  await expect(page.getByRole("button", { name: "Run backend Grover solve" })).toBeDisabled();
});

test("TSP explorer online health and mocked solve results", async ({ page }) => {
  await page.route("**/health", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "ok" }) });
  });
  await page.route("**/api/explorer/tsp", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(tspReference) });
  });
  await page.route("**/api/v3/solve-tsp", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        execution_time: 0.12,
        quantum_solutions: [
          {
            route: [0, 1, 2],
            distance: 6,
            probability: 0.42,
            measurement_count: 430,
            bitstring: "001",
          },
        ],
        quantum_advantage: {
          found_optimal: true,
          quantum_optimal_distance: 6,
          classical_optimal_distance: 6,
        },
        execution_details: { algorithm: "grover", shots: 1024, qubits_used: 3, depth: 40, grover_iterations: 2 },
      }),
    });
  });

  await page.goto("/explorer/tsp");
  await expect(page.getByRole("status", { name: "Backend API status" })).toContainText(/API online/i, {
    timeout: 20_000,
  });
  const solveBtn = page.getByRole("button", { name: "Run backend Grover solve" });
  await expect(solveBtn).toBeEnabled();
  await solveBtn.click();
  const results = page.getByTestId("tsp-backend-solve-results");
  await expect(results).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("tsp-backend-solve-distance-0")).toHaveText("cost 6");
  await expect(page.getByTestId("tsp-backend-solve-probability-0")).toHaveText("42.0%");
});

test("TSP health non-200 shows offline", async ({ page }) => {
  await page.route("**/health", async (route) => {
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ status: "down" }) });
  });
  await page.route("**/api/explorer/tsp", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(tspReference) });
  });

  await page.goto("/explorer/tsp");
  await expect(page.getByRole("status", { name: "Backend API status" })).toContainText(/API offline/i, {
    timeout: 20_000,
  });
});
