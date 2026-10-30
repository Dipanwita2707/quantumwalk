/**
 * Live integration — requires FastAPI with POST /api/v3/solve-tsp (not mocked).
 *
 * Run (PowerShell, from repo root):
 *   $env:API_INTERNAL_URL = "http://127.0.0.1:8000"   # or 8001 if 8000 is stale
 *   cd web
 *   npx playwright test --project=live-tsp-backend
 *
 * See web/e2e/LIVE_BACKEND.md
 */
import { test, expect } from "@playwright/test";

const guestSession = { authenticated: false, google_enabled: true };

/** Same matrix as web/lib/tspExplorer.ts DISTANCE — classical optimal tour cost is 7. */
const CLASSICAL_OPTIMAL = 7;

const apiInternal = (process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
const browserBase = (process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** 404 = route missing; 422/200/429/etc. = route registered (same path the UI uses when proxied). */
async function backendExposesSolveTsp(base: string): Promise<boolean> {
  try {
    const response = await fetch(`${base}/api/v3/solve-tsp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    return response.status !== 404;
  } catch {
    return false;
  }
}

async function resolveLiveBackendBase(): Promise<string | null> {
  const candidates = [...new Set([browserBase, apiInternal])];
  for (const base of candidates) {
    if (await backendExposesSolveTsp(base)) return base;
  }
  return null;
}

type SolveTspResponse = {
  success: boolean;
  quantum_solutions: { route: number[]; distance: number; probability: number }[];
  quantum_advantage: { classical_optimal_distance: number; quantum_optimal_distance: number };
};

test.describe("TSP live backend @live-backend", () => {
  test.beforeAll(async () => {
    const base = await resolveLiveBackendBase();
    test.skip(
      !base,
      `No POST /api/v3/solve-tsp via ${browserBase} or ${apiInternal}. Restart uvicorn (see web/e2e/LIVE_BACKEND.md).`,
    );
  });

  test.beforeEach(async ({ page }) => {
    await page.route("**/api/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(guestSession),
      });
    });
  });

  test("health online, real solve, and scoped backend results", async ({ page }) => {
    test.setTimeout(180_000);

    await page.goto("/explorer/tsp");
    await page.getByRole("tab", { name: "Run" }).click();
    await expect(page.getByRole("status", { name: "Backend API status" })).toContainText(/API online/i, {
      timeout: 30_000,
    });

    await page.getByRole("tab", { name: "Configure" }).click();
    await page.getByTestId("tsp-matrix-cell-0-1").fill("1");
    await page.getByTestId("tsp-matrix-cell-0-1").blur();
    await page.getByRole("tab", { name: "Run" }).click();

    const solveBtn = page.getByRole("button", { name: "Run backend Grover solve" });
    await expect(solveBtn).toBeEnabled();

    const solveResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/v3/solve-tsp") && res.request().method() === "POST",
      { timeout: 120_000 },
    );
    await solveBtn.click();
    const solveResponse = await solveResponsePromise;
    expect(solveResponse.status()).toBe(200);

    const requestBody = solveResponse.request().postDataJSON() as { distance_matrix: number[][] };
    expect(requestBody.distance_matrix[0][1]).toBe(1);

    const body = (await solveResponse.json()) as SolveTspResponse;
    expect(body.success).toBe(true);
    expect(body.quantum_solutions.length).toBeGreaterThan(0);
    expect(body.quantum_advantage.classical_optimal_distance).toBeGreaterThan(0);
    for (const row of body.quantum_solutions) {
      expect(row.route).toHaveLength(3);
      expect(row.distance).toBeGreaterThan(0);
      expect(row.probability).toBeGreaterThan(0);
      expect(row.probability).toBeLessThanOrEqual(1);
    }

    const results = page.getByTestId("tsp-backend-solve-results");
    await expect(results).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("tsp-backend-solve-summary")).toContainText(
      `Classical optimal: ${body.quantum_advantage.classical_optimal_distance}`,
    );
    await expect(page.getByTestId("tsp-backend-solve-row-0")).toBeVisible();
    await expect(page.getByTestId("tsp-backend-solve-distance-0")).toContainText(/^cost /);
  });

  test("default matrix live solve matches classical optimum 7", async ({ page }) => {
    test.setTimeout(180_000);

    await page.goto("/explorer/tsp");
    await page.getByRole("tab", { name: "Run" }).click();
    await expect(page.getByRole("status", { name: "Backend API status" })).toContainText(/API online/i, {
      timeout: 30_000,
    });

    const solveBtn = page.getByRole("button", { name: "Run backend Grover solve" });
    await expect(solveBtn).toBeEnabled();

    const solveResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/v3/solve-tsp") && res.request().method() === "POST",
      { timeout: 120_000 },
    );
    await solveBtn.click();
    const solveResponse = await solveResponsePromise;
    expect(solveResponse.status()).toBe(200);

    const body = (await solveResponse.json()) as SolveTspResponse;
    expect(body.success).toBe(true);
    expect(body.quantum_solutions.length).toBeGreaterThan(0);
    expect(body.quantum_advantage.classical_optimal_distance).toBe(CLASSICAL_OPTIMAL);
    for (const row of body.quantum_solutions) {
      expect(row.route).toHaveLength(3);
      expect(row.distance).toBeGreaterThan(0);
      expect(row.probability).toBeGreaterThan(0);
      expect(row.probability).toBeLessThanOrEqual(1);
    }

    const results = page.getByTestId("tsp-backend-solve-results");
    await expect(results).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("tsp-backend-solve-summary")).toContainText(`Classical optimal: ${CLASSICAL_OPTIMAL}`);
    await expect(page.getByTestId("tsp-backend-solve-row-0")).toBeVisible();
    await expect(page.getByTestId("tsp-backend-solve-distance-0")).toContainText(/^cost /);
    await expect(page.getByTestId("tsp-backend-solve-probability-0")).toContainText(/%$/);
  });

  test("six-city matrix reaches the bounded live solver", async ({ page }) => {
    test.setTimeout(180_000);

    await page.goto("/explorer/tsp");
    await page.getByTestId("tsp-city-count").fill("6");
    await expect(page.getByTestId("tsp-city-count-value")).toHaveText("6");
    await page.getByRole("tab", { name: "Run" }).click();
    await expect(page.getByRole("status", { name: "Backend API status" })).toContainText(/API online/i);

    const solveResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/v3/solve-tsp") && res.request().method() === "POST",
      { timeout: 120_000 },
    );
    await page.getByRole("button", { name: "Run backend Grover solve" }).click();
    const solveResponse = await solveResponsePromise;
    expect(solveResponse.status()).toBe(200);
    const requestBody = solveResponse.request().postDataJSON() as { distance_matrix: number[][] };
    expect(requestBody.distance_matrix).toHaveLength(6);
    const body = (await solveResponse.json()) as SolveTspResponse;
    expect(body.success).toBe(true);
    expect(body.quantum_solutions.length).toBeGreaterThan(0);
    expect(body.quantum_solutions[0].route).toHaveLength(6);
    await expect(page.getByTestId("tsp-backend-solve-results")).toBeVisible();
  });
});
