import { test, expect, type Page } from "@playwright/test";

const guestSession = { authenticated: false, google_enabled: true };

/** Backend health + solve live on the Run phase after CRRE runbook (Phase 5b). */
async function openTspRunPhase(page: Page) {
  await page.getByRole("tablist", { name: "Explorer workflow" }).getByRole("tab", { name: "Run" }).click();
}

async function gotoTspRunPhase(page: Page) {
  await page.goto("/explorer/tsp");
  await openTspRunPhase(page);
}

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
  await page.route("**/api/explorer/tsp", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(tspReference) });
  });
});

test("TSP explorer shows offline health and disables backend solve", async ({ page }) => {
  await page.route("**/health", async (route) => {
    await route.abort("failed");
  });

  await gotoTspRunPhase(page);
  await expect(page.getByRole("status", { name: "Backend API status" })).toContainText(/API offline/i, {
    timeout: 20_000,
  });
  await expect(page.getByTestId("tsp-run-backend-solve")).toBeDisabled();
});

test("TSP health non-200 shows offline", async ({ page }) => {
  await page.route("**/health", async (route) => {
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ status: "down" }) });
  });

  await gotoTspRunPhase(page);
  await expect(page.getByRole("status", { name: "Backend API status" })).toContainText(/API offline/i, {
    timeout: 20_000,
  });
});

test("TSP matrix validation rejects negative distance", async ({ page }) => {
  await page.route("**/health", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "ok" }) });
  });

  await page.goto("/explorer/tsp");
  await page.getByTestId("tsp-matrix-cell-0-1").fill("-1");
  await page.getByTestId("tsp-matrix-cell-0-1").blur();
  await expect(page.getByTestId("tsp-matrix-validation")).toContainText(/cannot be negative/i);
  await openTspRunPhase(page);
  await expect(page.getByTestId("tsp-run-backend-solve")).toBeDisabled();
});

test("TSP city count resize preserves values and adds cities", async ({ page }) => {
  await page.route("**/health", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "ok" }) });
  });

  await page.goto("/explorer/tsp");
  await expect(page.getByTestId("tsp-matrix-cell-0-1")).toHaveValue("4");
  await page.getByTestId("tsp-city-count").fill("4");
  await expect(page.getByTestId("tsp-city-count-value")).toHaveText("4");
  await expect(page.getByTestId("tsp-matrix-cell-0-1")).toHaveValue("4");
  await expect(page.getByTestId("tsp-matrix-cell-3-3")).toHaveValue("0");
  await expect(page.getByTestId("tsp-matrix-cell-0-3")).toBeVisible();
});

test("TSP sends edited matrix in solve request and renders mocked results", async ({ page }) => {
  await page.route("**/health", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "ok" }) });
  });

  let solveCalls = 0;
  await page.route("**/api/v3/solve-tsp", async (route) => {
    solveCalls += 1;
    const body = route.request().postDataJSON() as { distance_matrix: number[][] };
    expect(body.distance_matrix[0][1]).toBe(5);
    expect(body.distance_matrix).toHaveLength(3);
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

  await gotoTspRunPhase(page);
  await expect(page.getByRole("status", { name: "Backend API status" })).toContainText(/API online/i, {
    timeout: 20_000,
  });
  await page.getByRole("tab", { name: "Configure" }).click();
  await page.getByTestId("tsp-matrix-cell-0-1").fill("5");
  await page.getByTestId("tsp-matrix-cell-0-1").blur();
  await openTspRunPhase(page);

  const solveBtn = page.getByTestId("tsp-run-backend-solve");
  await expect(solveBtn).toBeEnabled();
  await solveBtn.click();
  await expect(page.getByTestId("tsp-backend-solve-results")).toBeVisible({ timeout: 10_000 });
  expect(solveCalls).toBe(1);

  await page.getByRole("tab", { name: "Configure" }).click();
  await page.getByTestId("tsp-matrix-cell-0-1").fill("8");
  await openTspRunPhase(page);
  await expect(page.getByTestId("tsp-backend-solve-results")).toHaveCount(0);
});

test("TSP duplicate submit prevented while loading", async ({ page }) => {
  await page.route("**/health", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "ok" }) });
  });

  let solveCalls = 0;
  await page.route("**/api/v3/solve-tsp", async (route) => {
    solveCalls += 1;
    await new Promise((r) => setTimeout(r, 800));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        execution_time: 0.05,
        quantum_solutions: [
          { route: [0, 1, 2], distance: 7, probability: 0.5, measurement_count: 512, bitstring: "001" },
        ],
        quantum_advantage: {
          found_optimal: true,
          quantum_optimal_distance: 7,
          classical_optimal_distance: 7,
        },
        execution_details: { algorithm: "grover", shots: 1024, qubits_used: 3, depth: 30, grover_iterations: 2 },
      }),
    });
  });

  await gotoTspRunPhase(page);
  await expect(page.getByRole("status", { name: "Backend API status" })).toContainText(/API online/i, {
    timeout: 20_000,
  });
  const solveBtn = page.getByTestId("tsp-run-backend-solve");
  await solveBtn.click();
  await expect(solveBtn).toBeDisabled();
  await expect(solveBtn).toContainText(/Running backend solve/i);
  await expect(page.getByTestId("tsp-backend-solve-results")).toBeVisible({ timeout: 15_000 });
  expect(solveCalls).toBe(1);
});

test("TSP backend validation error surfaces message", async ({ page }) => {
  await page.route("**/health", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "ok" }) });
  });
  await page.route("**/api/v3/solve-tsp", async (route) => {
    await route.fulfill({
      status: 422,
      contentType: "application/json",
      body: JSON.stringify({ detail: "distance_matrix must be 3–6 cities" }),
    });
  });

  await gotoTspRunPhase(page);
  await expect(page.getByRole("status", { name: "Backend API status" })).toContainText(/API online/i, {
    timeout: 20_000,
  });
  await page.getByTestId("tsp-run-backend-solve").click();
  await expect(page.getByTestId("tsp-solve-error")).toContainText(/3–6 cities/i, { timeout: 10_000 });
});
