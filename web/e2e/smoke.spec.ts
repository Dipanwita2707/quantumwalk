import { test, expect } from "@playwright/test";

const guestSession = { authenticated: false, google_enabled: true };

test.beforeEach(async ({ page }) => {
  await page.route("**/api/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(guestSession),
    });
  });
  await page.route("**/api/lessons", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          slug: "first-qubit",
          title: "Your First Qubit",
          level: "Beginner",
          minutes: 5,
          objective: "See superposition.",
          steps: ["Step"],
          algorithm_slug: "superposition",
          question: "Q?",
          choices: ["A", "B"],
        },
      ]),
    });
  });
  await page.route("**/api/challenges", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
});

test.describe("QuantumWalk smoke", () => {
  test("landing hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/possibilities/i);
  });

  test("start path picker", async ({ page }) => {
    await page.goto("/start");
    await expect(page.getByRole("navigation", { name: /QuantumWalk tools/i })).toBeVisible();
  });

  test("learn trail with guest banner", async ({ page }) => {
    await page.goto("/learn");
    await expect(page.getByText("Preview mode")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 1, name: /Quantum Academy/i })).toBeVisible();
    await expect(page.getByRole("navigation", { name: /Academy path/i })).toBeVisible();
  });

  test("tools hub and doc editor", async ({ page }) => {
    await page.goto("/hub");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Research, documents/i);
    await expect(page.getByRole("link", { name: /Document Pro/i })).toBeVisible();
    await page.goto("/hub/doc-editor");
    await expect(page.getByLabel("Markdown source")).toBeVisible();
  });

  test("academy hub and reference", async ({ page }) => {
    await page.goto("/academy");
    await expect(page).toHaveURL(/\/learn\/?$/);
    await expect(page.getByRole("heading", { level: 1, name: /Quantum Academy/i })).toBeVisible();
    await expect(page.getByLabel("More learning resources")).toBeVisible();
    await page.goto("/learn/reference");
    await expect(page.getByRole("heading", { level: 1, name: /Glossary & cheat sheets/i })).toBeVisible();
    await expect(page.getByLabel("Search glossary")).toBeVisible();
  });

  test("explorer hub", async ({ page }) => {
    await page.goto("/explorer");
    await expect(page.getByText("Explorer preview")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Problem/i);
  });

  test("TSP oracle callout", async ({ page }) => {
    await page.goto("/explorer/tsp");
    await expect(page.getByText(/WHY ONE MARKED ROUTE/i)).toBeVisible({ timeout: 20_000 });
  });

  test("lab guest hint on preset", async ({ page }) => {
    await page.goto("/workspace?preset=bell");
    await expect(page.getByText("Demo lab mode", { exact: true })).toBeVisible({ timeout: 20_000 });
  });

  test("challenges arena guest banner", async ({ page }) => {
    await page.goto("/challenges");
    await expect(page.getByText("Sign in to compete")).toBeVisible({ timeout: 20_000 });
  });

  test("login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("dashboard guest intro card", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Guest overview")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("region", { name: /Discovery introduction/i })).toBeVisible();
    await expect(page.getByText(/ACADEMY UNITS/i)).toBeVisible();
  });
});
