import { expect, test } from "@playwright/test";

const guest = { authenticated: false, google_enabled: true };

test("top tutor guides guest execution, manual stepping, and circuit edits", async ({ page }, testInfo) => {
  await page.route("**/api/me", route => route.fulfill({ json: guest }));
  await page.goto("/workspace?preset=superposition&mode=circuit");
  const tutor = page.getByRole("region", { name: "Circuit tutor", exact: true });
  await expect(tutor).toBeVisible();
  const tutorBox = await tutor.boundingBox();
  const circuitBox = await page.locator(".circuit-panel").boundingBox();
  expect(tutorBox!.y + tutorBox!.height).toBeLessThan(circuitBox!.y);
  expect(await tutor.evaluate(element => element.closest("details") === null)).toBe(true);
  await tutor.getByRole("button", { name: "Probabilities", exact: true }).click();
  await expect(tutor).toContainText("Execute the circuit to calculate probabilities");
  await tutor.getByRole("button", { name: "Execute & follow", exact: true }).click();
  await tutor.getByRole("button", { name: "Pause walkthrough", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Quantum evolution step" })).toHaveValue("0");
  await tutor.getByRole("button", { name: "Next gate", exact: false }).click();
  await expect(tutor).toContainText("50.0%");
  await tutor.getByRole("button", { name: "This step", exact: true }).click();
  await expect(tutor).toContainText("After H on q0");
  await tutor.getByRole("button", { name: "Ask a question", exact: true }).click();
  await expect(tutor.getByRole("link", { name: /Sign in to ask/ })).toBeVisible();
  await page.getByRole("button", { name: "Select Pauli Z gate", exact: true }).click();
  await page.getByRole("button", { name: "Add Pauli Z to qubit 0", exact: true }).click();
  await expect(tutor).toContainText("Your circuit changed");
  await expect(tutor.getByRole("button", { name: /Next gate/ })).toBeDisabled();
  await tutor.screenshot({ path: testInfo.outputPath("top-circuit-tutor.png") });
});

test("custom tutor questions handle errors and require external AI opt-in", async ({ page }) => {
  await page.route("**/api/me", route => route.fulfill({ json: { authenticated: true, id: "tutor-test", display_name: "Tutor Test", email: "tutor@example.test", avatar_url: null, analytics_opt_in: false, csrf_token: "test-csrf" } }));
  const sent: boolean[] = [];
  await page.route("**/api/tutor/explain", async route => {
    const body = route.request().postDataJSON();
    expect(route.request().headers()["x-csrf-token"]).toBe("test-csrf");
    sent.push(body.allow_external_ai);
    if (sent.length === 1) await route.fulfill({ status: 503, json: { detail: "Tutor unavailable" } });
    else await route.fulfill({ json: { answer: "Compare the amplitudes before and after H.", uses_external_ai: body.allow_external_ai } });
  });
  await page.goto("/workspace?preset=superposition&mode=circuit");
  const tutor = page.getByRole("region", { name: "Circuit tutor", exact: true });
  await tutor.getByRole("button", { name: "Ask a question", exact: true }).click();
  await tutor.getByRole("textbox", { name: "Ask about your circuit" }).fill("What does H change?");
  await tutor.getByRole("button", { name: "Ask tutor", exact: true }).click();
  await expect(tutor.getByRole("alert")).toContainText("Tutor unavailable");
  await tutor.getByRole("button", { name: "Ask tutor", exact: true }).click();
  await expect(tutor.getByRole("status")).toContainText("Local circuit explanation");
  await tutor.getByRole("checkbox", { name: /Use external AI/ }).check();
  await tutor.getByRole("button", { name: "Ask tutor", exact: true }).click();
  await expect(tutor.getByRole("status")).toContainText("AI explanation");
  expect(sent).toEqual([false, false, true]);
  await page.getByRole("button", { name: "Add Hadamard to qubit 0", exact: true }).click();
  await expect(tutor.locator(".lab-tutor-answer")).toHaveCount(0);
});

test("mobile tutor appears above the canvas and fits the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/me", route => route.fulfill({ json: guest }));
  await page.goto("/workspace?preset=superposition&mode=circuit");
  const tutor = page.getByRole("region", { name: "Circuit tutor", exact: true });
  await expect(tutor).toBeVisible();
  const top = await tutor.boundingBox();
  const canvas = await page.locator(".circuit-panel").boundingBox();
  expect(top!.y + top!.height).toBeLessThan(canvas!.y);
  await tutor.getByRole("button", { name: "What next?", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(tutor.getByRole("button", { name: "What next?", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
