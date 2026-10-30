import { expect, test } from "@playwright/test";

const signedIn = {
  authenticated: true,
  id: "action-audit",
  display_name: "Action Audit",
  email: "action@example.test",
  avatar_url: null,
  analytics_opt_in: false,
  csrf_token: "action-audit-csrf",
};

test("Coach explains the sign-in requirement to guests", async ({ page }) => {
  await page.route("**/api/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ authenticated: false, google_enabled: true }) }));
  await page.goto("/coach");
  await page.getByRole("button", { name: "What does a Hadamard gate do?" }).click();
  await expect(page.getByRole("button", { name: "Ask the coach" })).toBeDisabled();
  await expect(page.locator('a[href="/login?return_to=%2Fcoach"]')).toBeVisible();
});

test("Coach sends only opted-in questions to the AI path", async ({ page }) => {
  await page.route("**/api/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(signedIn) }));
  const requests: Array<{ question: string; allow_external_ai: boolean; circuit: unknown }> = [];
  await page.route("**/api/tutor/explain", async (route) => {
    expect(route.request().headers()["x-csrf-token"]).toBe(signedIn.csrf_token);
    const body = route.request().postDataJSON();
    requests.push(body);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ answer: "H changes amplitudes.", uses_external_ai: body.allow_external_ai }) });
  });

  await page.goto("/coach");
  await page.getByRole("button", { name: "What does a Hadamard gate do?" }).click();
  await page.getByRole("button", { name: "Ask the coach" }).click();
  await expect(page.locator(".coach-answer .panel-kicker")).toHaveText("LOCAL EXPLANATION");
  await page.getByRole("checkbox", { name: /Use AI/i }).check();
  await page.getByRole("button", { name: "Ask the coach" }).click();
  await expect(page.locator(".coach-answer .panel-kicker")).toHaveText("AI EXPLANATION");
  expect(requests.map((item) => item.allow_external_ai)).toEqual([false, true]);
  expect(requests[0].circuit).toEqual({ qubits: 1, operations: [] });
  expect(requests[0].question).toBe("What does a Hadamard gate do?");
});

test("Doc Editor previews, persists, and exports the draft", async ({ page }) => {
  await page.goto("/hub/doc-editor");
  const source = page.getByRole("textbox", { name: "Markdown source" });
  await expect(source).toBeEnabled();
  await source.fill("# Quantum note\n\n**Bell pair**");
  await expect(page.getByLabel("Live preview")).toContainText("Quantum note");
  await expect(page.getByLabel("Live preview")).toContainText("Bell pair");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("qw-hub-doc-editor"))).toBe("# Quantum note\n\n**Bell pair**");
  await page.reload();
  await expect(source).toHaveValue("# Quantum note\n\n**Bell pair**");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export HTML" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("document.html");
});

test("Doc Editor remains usable and warns when draft storage is blocked", async ({ page }) => {
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem;
    const set = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) { if (key === "qw-hub-doc-editor") throw new Error("blocked"); return get.call(this, key); };
    Storage.prototype.setItem = function (key, value) { if (key === "qw-hub-doc-editor") throw new Error("blocked"); return set.call(this, key, value); };
  });
  await page.goto("/hub/doc-editor");
  await expect(page.locator(".qw-doc-editor [role=alert]")).toContainText("not saving drafts");
  const source = page.getByRole("textbox", { name: "Markdown source" });
  await expect(source).toBeEnabled();
  await source.fill("# Temporary draft");
  await expect(page.getByLabel("Live preview")).toContainText("Temporary draft");
});

test("Document Pro template fields update the printable draft", async ({ page }) => {
  await page.goto("/hub/document-pro");
  await page.getByRole("combobox", { name: "Template" }).selectOption("letter");
  await page.getByRole("textbox", { name: "recipient" }).fill("Ada");
  await expect(page.locator(".qw-doc-pro-render")).toContainText("Dear Ada,");
  await page.evaluate(() => { window.print = () => { document.body.dataset.printInvoked = "yes"; }; });
  await page.getByRole("button", { name: "Print / save as PDF" }).click();
  await expect(page.locator("body")).toHaveAttribute("data-print-invoked", "yes");
});

test("ML Studio layer controls update the diagram", async ({ page }) => {
  await page.goto("/hub/ml-studio");
  await page.getByRole("spinbutton", { name: "Input features" }).fill("12");
  await expect(page.getByLabel("Network diagram")).toContainText("Input (12)");
  await page.getByRole("button", { name: "Add layer" }).click();
  await expect(page.locator(".qw-ml-layers li")).toHaveCount(5);
  await expect(page.getByLabel("Network diagram")).toContainText("Dense (8)");
});
