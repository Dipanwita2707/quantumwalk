import { test, expect } from "@playwright/test";

const guestSession = { authenticated: false, google_enabled: true };

const lessons = [
  {
    slug: "first-qubit",
    title: "Your First Qubit",
    level: "Beginner",
    minutes: 5,
    objective: "See superposition.",
    steps: ["Step"],
    algorithm_slug: "superposition",
    question: "After H on |0⟩, what happens on Z measurement?",
    choices: ["Always 0", "50/50 random 0 or 1", "Always 1"],
  },
];

test.beforeEach(async ({ page }) => {
  await page.route("**/api/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(guestSession),
    });
  });
  await page.route("**/api/lessons", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(lessons) });
  });
  await page.route("**/api/lessons/first-qubit/answer", async (route) => {
    const body = route.request().postDataJSON() as { choice: number };
    const correct = body.choice === 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ correct, score: correct ? 100 : 0, saved: false }),
    });
  });
});

test("Guest can submit lesson quiz and see feedback", async ({ page }) => {
  await page.goto("/learn/first-qubit");
  await expect(page.getByTestId("lesson-quiz-first-qubit")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: lessons[0].choices[1] }).click();
  await expect(page.getByText(/Correct! Progress stored on this device/i)).toBeVisible({ timeout: 10_000 });
});

test("QEC lab shows syndrome after flip", async ({ page }) => {
  await page.goto("/academy/labs/qec");
  await page.getByTestId("qec-flip-1").click();
  await expect(page.getByTestId("qec-syndrome")).toContainText("inferred error qubit: q1");
});

test("Grover lab updates success probability", async ({ page }) => {
  await page.goto("/academy/labs/grover");
  await expect(page.getByTestId("grover-lab-success")).toBeVisible();
});

test("QEC explanation matches s01/s12 syndrome toy", async ({ page }) => {
  await page.goto("/academy/labs/qec");
  const intro = page.getByTestId("qec-explanation");
  await expect(intro).toContainText("s01");
  await expect(intro).toContainText("s12");
  await expect(intro).not.toContainText("ZZZ");
});

test("Reservoir lab runs educational simulation", async ({ page }) => {
  await page.goto("/academy/labs/reservoir");
  await expect(page.getByTestId("reservoir-lab")).toBeVisible();
  await expect(page.getByTestId("reservoir-mse")).toContainText("Test baseline MSE");
  await page.getByTestId("reservoir-rerun").click();
  await expect(page.getByTestId("reservoir-mse")).toBeVisible();
});

test("Teleportation lesson shows prerequisites", async ({ page }) => {
  await page.route("**/api/lessons", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          slug: "quantum-teleportation",
          title: "Teleport a qubit state",
          level: "Intermediate",
          minutes: 9,
          objective: "Follow teleportation.",
          prerequisites: "Bell pair lesson.",
          steps: ["Step"],
          algorithm_slug: "teleportation-demo",
          question: "Needs?",
          choices: ["Shared entanglement", "Cloning", "FTL"],
        },
      ]),
    });
  });
  await page.goto("/learn/quantum-teleportation");
  await expect(page.getByTestId("lesson-prereq-quantum-teleportation")).toContainText("Bell pair");
});
