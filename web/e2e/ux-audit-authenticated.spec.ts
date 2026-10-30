/**
 * UX audit: authenticated journeys via mocked /api/me (no production auth bypass).
 * Run: npx playwright test e2e/ux-audit-authenticated.spec.ts
 */
import { test, expect } from "@playwright/test";

const authSession = {
  authenticated: true,
  id: "ux-audit-user",
  display_name: "UX Audit User",
  email: "ux-audit@quantumwalk.local",
  avatar_url: null,
  analytics_opt_in: false,
  csrf_token: "ux-audit-csrf-mock",
};

const lessons = [
  {
    slug: "first-qubit",
    title: "Your First Qubit",
    level: "Beginner",
    minutes: 5,
    objective: "See superposition.",
    steps: ["Step"],
    algorithm_slug: "superposition",
    question: "Q?",
    choices: ["A", "B", "C"],
  },
];

const progress = [
  { activity_slug: "lesson:first-qubit", completed: true, score: 100 },
  { activity_slug: "discovery:introduction", completed: false, score: 50 },
];

const challenges = [
  {
    slug: "make-superposition",
    title: "Make superposition",
    level: "Beginner",
    summary: "Target 50/50",
    qubits: 1,
  },
];

async function mockAuthenticatedApi(page: import("@playwright/test").Page) {
  await page.route("**/api/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(authSession),
    });
  });
  await page.route("**/api/circuits", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "c-audit-1",
            name: "Audit Bell pair",
            qubits: 2,
            operations: [{ gate: "h", target: 0 }],
            updated_at: new Date().toISOString(),
          },
        ]),
      });
      return;
    }
    await route.continue();
  });
  await page.route("**/api/progress", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(progress),
    });
  });
  await page.route("**/api/lessons", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(lessons) });
  });
  await page.route("**/api/challenges", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(challenges) });
  });
  await page.route("**/api/lessons/first-qubit/answer", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ correct: true, score: 100, saved: true }),
    });
  });
}

test.describe("Authenticated UX audit (mock session)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedApi(page);
  });

  test("AuthGate allows private routes and header shows Dashboard", async ({ page }) => {
    await page.goto("/circuits");
    await expect(page.getByRole("heading", { level: 1, name: /Saved circuits/i })).toBeVisible();
    await expect(page.getByText("Audit Bell pair")).toBeVisible();
    await expect(page.getByRole("navigation", { name: /Primary navigation/i })).toContainText("Home");
    await expect(page.locator(".header-account-menu summary")).toContainText("UX Audit User");
  });

  test("Dashboard loads private data without guest intro card", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByTestId("dashboard-continue")).toBeVisible();
    await expect(page.getByRole("main").getByText("UX Audit User")).toBeVisible();
    await expect(page.getByText("Guest overview")).toHaveCount(0);
  });

  test("Profile settings form is reachable", async ({ page }) => {
    await page.goto("/settings/profile");
    await expect(page.getByRole("heading", { level: 1, name: /Your profile/i })).toBeVisible();
    await expect(page.getByLabel(/Display name/i)).toHaveValue("UX Audit User");
    await expect(page.getByRole("button", { name: /Save profile/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign out/i })).toBeVisible();
  });

  test("Achievements load with progress filters", async ({ page }) => {
    await page.goto("/achievements");
    await expect(page.getByRole("heading", { level: 1, name: /Achievements/i })).toBeVisible();
    await expect(page.getByText(/milestones earned/i)).toBeVisible({ timeout: 15_000 });
    await page.getByRole("tab", { name: "Lessons" }).click();
    await expect(page.getByRole("tab", { name: "Lessons" })).toHaveAttribute("aria-selected", "true");
  });

  test("Lesson quiz reports server saved progress when authenticated", async ({ page }) => {
    await page.route("**/api/progress", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    await page.goto("/learn/first-qubit");
    await expect(page.getByTestId("lesson-quiz-first-qubit")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Answer: B" }).click();
    await expect(page.getByText(/Mission accomplished/i)).toBeVisible({ timeout: 10_000 });
  });

  test("Workspace reachable without AuthGate block", async ({ page }) => {
    await page.goto("/workspace?mode=circuit");
    await expect(page.getByRole("navigation", { name: /Primary navigation/i })).toBeVisible();
    await expect(page.locator(".topbar")).toBeVisible();
  });

  test("Mobile: primary nav menu and circuits", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    await page.getByRole("group").getByText("Menu").click();
    await expect(page.getByRole("navigation", { name: /Mobile navigation/i })).toBeVisible();
    await page.goto("/circuits");
    await expect(page.getByRole("heading", { level: 1, name: /Saved circuits/i })).toBeVisible();
  });
});
