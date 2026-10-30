import { expect, test } from "@playwright/test";

const account = { authenticated: true, id: "secondary-ui", display_name: "Ada", csrf_token: "test-only" };
const freePlan = { slug: "explorer", title: "Free Explorer", amount_minor: 0, currency: "USD", interval: "month", features: { "lab.run": 30 } };
const paidPlan = { slug: "pro", title: "Quantum Pro", amount_minor: 1299, currency: "USD", interval: "month", features: { "lab.run": 200 } };

test.beforeEach(async ({ page }) => {
  await page.route("**/api/me", route => route.fulfill({ json: account }));
});

test("challenge rows keep grading criteria and show only returned leaderboard entries", async ({ page }) => {
  await page.route("**/api/challenges", route => route.fulfill({ json: [{ slug: "make-superposition", title: "Split a possibility", summary: "Create equal probabilities.", level: "Beginner", qubits: 1 }] }));
  await page.route("**/api/v1/leaderboard?**", route => route.fulfill({ json: { category: "Validated missions", players: new URL(route.request().url()).searchParams.get("period") === "week" ? [{ rank: 1, display_name: "Reference Learner", xp: 100 }] : [] } }));
  await page.goto("/challenges");
  const challenge = page.locator(".chal-card");
  await expect(challenge.getByRole("link", { name: /Try challenge/ })).toHaveAttribute("href", "/challenges/make-superposition");
  await challenge.locator("summary").click();
  await expect(challenge.getByLabel("Simulator-graded tiers")).toContainText("Bronze");
  const ranking = page.getByRole("region", { name: "Mastery leaderboard" });
  await expect(ranking.getByRole("listitem")).toHaveCount(1);
  await expect(ranking).toContainText("Reference Learner");
  await ranking.getByRole("button", { name: "Last 30 days" }).click();
  await expect(ranking.getByRole("listitem")).toHaveCount(0);
  await expect(ranking).toContainText("No participating learners");
});

test("pricing preserves configured amounts and exposes checkout errors", async ({ page }) => {
  await page.route("**/api/v1/plans", route => route.fulfill({ json: { configured: true, plans: [freePlan, paidPlan] } }));
  await page.route("**/api/v1/billing/checkout", route => {
    expect(route.request().headers()["x-csrf-token"]).toBe(account.csrf_token);
    expect(route.request().postDataJSON().plan).toBe("pro");
    return route.fulfill({ status: 503, json: { detail: "Checkout temporarily unavailable" } });
  });
  await page.goto("/pricing");
  const pro = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Quantum Pro", exact: true }) });
  await expect(pro).toContainText("12.99");
  await expect(pro).toContainText("Experiment runs: 200 per day");
  await pro.getByRole("button", { name: "Continue to secure checkout" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Checkout temporarily unavailable");
  await expect(pro.getByRole("button")).toBeEnabled();
  await page.getByText("Clear limits. Private work.", { exact: true }).click();
  await expect(page.getByRole("link", { name: /Manage subscription/ })).toHaveAttribute("href", "/billing");
});

test("an unavailable provider does not become a fabricated hardware execution", async ({ page }) => {
  await page.route("**/api/hardware/status", route => route.fulfill({ status: 503, json: { detail: "Unavailable" } }));
  await page.goto("/hardware");
  await expect(page.getByRole("status")).toContainText("Hardware status is unavailable");
  await expect(page.getByRole("button", { name: "Hardware execution unavailable" })).toBeDisabled();
  await expect(page.getByRole("link", { name: "Run in the simulator" })).toHaveAttribute("href", "/workspace?mode=circuit&preset=bell");
  await expect(page.getByRole("heading", { name: "No hardware job submitted" })).toBeVisible();
});

test("continue quest opens the first unfinished unlocked mission", async ({ page }) => {
  await page.route("**/api/v1/missions", route => route.fulfill({ json: [
    { slug: "double-slit", title: "Completed mission", completed: true, locked: false, objective: "Already mastered", xp: 100 },
    { slug: "tunnelling", title: "Next experiment", completed: false, locked: false, objective: "Compare a barrier", criteria: "Submit evidence from your experiment", choices: ["Transmission"], xp: 100 },
    { slug: "fusion", title: "Locked mission", completed: false, locked: true, prerequisite: "tunnelling", objective: "Requires a checkpoint", xp: 100 },
  ] }));
  await page.route("**/api/v1/runs?**", route => route.fulfill({ json: { items: [] } }));
  await page.goto("/missions");
  await expect(page.getByRole("article").filter({ hasText: "Locked mission" }).getByRole("button")).toBeDisabled();
  await page.getByRole("button", { name: "Continue quest", exact: true }).click();
  const checkpoint = page.locator(".mission-checkpoint");
  await expect(checkpoint).toBeFocused();
  await expect(checkpoint.getByRole("heading")).toHaveText("Next experiment");
  await expect(checkpoint.getByRole("link", { name: /Open experiment/ })).toHaveAttribute("href", "/lab/tunnelling");
  await expect(checkpoint.getByRole("button", { name: "Submit evidence" })).toBeDisabled();
});

for (const width of [375, 768, 1440, 1600]) {
  test(`remaining showcase pages fit ${width}px without losing controls`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route("**/api/v1/plans", route => route.fulfill({ json: { configured: false, plans: [freePlan, paidPlan] } }));
    for (const route of ["/challenges", "/leaderboard", "/missions", "/pricing", "/hardware", "/learn/hardware"]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBe(true);
      if (route === "/pricing") await expect(page.getByRole("button", { name: "Continue to secure checkout" })).toBeDisabled();
    }
  });
}
