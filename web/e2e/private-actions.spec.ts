import { expect, test } from "@playwright/test";

const session = {
  authenticated: true,
  id: "private-action-audit",
  display_name: "Private Action Audit",
  email: "private@example.test",
  avatar_url: null,
  analytics_opt_in: false,
  csrf_token: "private-action-csrf",
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(session) }));
});

test("Lab saves and exports a circuit with the expected request", async ({ page }) => {
  const savedRequests: Array<{ name: string; qubits: number; operations: unknown[] }> = [];
  await page.route("**/api/circuits", async (route) => {
    if (route.request().method() === "POST") {
      expect(route.request().headers()["x-csrf-token"]).toBe(session.csrf_token);
      const saved = route.request().postDataJSON();
      savedRequests.push(saved);
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "saved-audit", ...saved }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  const formats: string[] = [];
  await page.route(/\/api\/export\/(qasm|qiskit|cirq)$/, async (route) => {
    const format = route.request().url().split("/").at(-1)!;
    formats.push(format);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ code: `// ${format} export` }) });
  });

  await page.goto("/workspace?mode=circuit&preset=bell");
  await expect(page.getByRole("button", { name: "Save to cloud" })).toBeEnabled();
  await page.getByRole("button", { name: "Save to cloud" }).click();
  await expect(page.getByText("Circuit saved privately to your account.")).toBeVisible();
  expect(savedRequests[0].qubits).toBe(2);
  expect(savedRequests[0].operations.length).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: "Update saved" })).toBeVisible();

  for (const [label, filename] of [["OpenQASM", "quantumwalk-circuit.qasm"], ["Qiskit", "quantumwalk-circuit.py"], ["Cirq", "quantumwalk-cirq.py"]]) {
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: label, exact: true }).click();
    expect((await downloadPromise).suggestedFilename()).toBe(filename);
  }
  expect(formats).toEqual(["qasm", "qiskit", "cirq"]);
});

test("Lab compares engines, previews transpilation, and reports API failures", async ({ page }) => {
  const engines: string[] = [];
  await page.route("**/api/simulate", async (route) => {
    const body = route.request().postDataJSON();
    engines.push(body.engine);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ steps: [{ probabilities: [{ basis: "0", probability: 0.5 }, { basis: "1", probability: 0.5 }] }] }) });
  });
  await page.route("**/api/transpile-preview", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ depth: 2, size: 2, basis_gates: ["h", "measure"] }) }));
  await page.goto("/workspace?mode=circuit&preset=superposition");
  await page.getByText("Engine, noise, and comparison", { exact: true }).click();
  await page.getByRole("button", { name: "Compare Qiskit & Cirq" }).click();
  await expect(page.getByText("Both libraries calculated the same chances.")).toBeVisible();
  expect(engines).toEqual(["qiskit", "cirq"]);
  await page.getByRole("button", { name: "Transpile preview" }).click();
  await expect(page.getByText(/Depth 2.*2 ops/)).toBeVisible();

  await page.route("**/api/transpile-preview", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ detail: "Transpiler unavailable." }) }));
  await page.getByRole("button", { name: "Transpile preview" }).click();
  await expect(page.locator(".lab-engine-panel [role=alert]")).toContainText("Transpiler unavailable.");
});

test("Challenge verification sends the circuit and shows saved tier", async ({ page }) => {
  await page.route("**/api/challenges", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ slug: "make-superposition", title: "Make superposition", summary: "Create equal chances", qubits: 1 }]) }));
  const submittedRequests: Array<{ circuit: { qubits: number; operations: unknown[] } }> = [];
  await page.route("**/api/challenges/make-superposition/submit", async (route) => {
    expect(route.request().headers()["x-csrf-token"]).toBe(session.csrf_token);
    submittedRequests.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ solved: true, saved: true, tier: "gold", xp_awarded: 100 }) });
  });
  await page.goto("/workspace?mode=circuit&challenge=make-superposition");
  await page.getByRole("button", { name: "Select Hadamard gate" }).click();
  await page.getByRole("button", { name: "Add Hadamard to qubit 0" }).click();
  await page.getByRole("button", { name: "Verify solution" }).click();
  await expect(page.getByText(/Mission complete \(gold\).*Progress saved/)).toBeVisible();
  expect(submittedRequests[0].circuit.qubits).toBe(1);
  expect(submittedRequests[0].circuit.operations.length).toBeGreaterThan(0);
});

test("Profile save and data export use the private API", async ({ page }) => {
  let profileUpdate: { display_name: string; analytics_opt_in: boolean } | null = null;
  let currentSession = { ...session };
  await page.route("**/api/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(currentSession) }));
  await page.route("**/api/profile", async (route) => {
    expect(route.request().headers()["x-csrf-token"]).toBe(session.csrf_token);
    profileUpdate = route.request().postDataJSON();
    currentSession = { ...currentSession, ...profileUpdate };
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.route("**/api/account/export", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ profile: { display_name: "Updated Name" }, circuits: [], progress: [] }) }));
  await page.goto("/settings/profile");
  await expect(page.getByRole("textbox", { name: "Display name" })).toHaveValue(session.display_name);
  await page.getByRole("textbox", { name: "Display name" }).fill("Updated Name");
  await page.getByRole("checkbox", { name: /Allow optional product analytics/i }).check();
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect.poll(() => profileUpdate).not.toBeNull();
  await expect(page.getByText("Profile saved.")).toBeVisible();
  expect(profileUpdate).toEqual({ display_name: "Updated Name", analytics_opt_in: true });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export my data" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("quantumwalk-data.json");
  await expect(page.getByText("Data export started.")).toBeVisible();
});

test("Sign out revokes the session and leaves the private page", async ({ page }) => {
  let currentSession: typeof session | { authenticated: false; google_enabled: true } = session;
  await page.route("**/api/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(currentSession) }));
  let logoutCalls = 0;
  await page.route("**/api/logout", async (route) => {
    expect(route.request().headers()["x-csrf-token"]).toBe(session.csrf_token);
    logoutCalls += 1;
    currentSession = { authenticated: false, google_enabled: true };
    await route.fulfill({ status: 204, body: "" });
  });
  await page.goto("/settings/profile");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(new URL("/", page.url()).href);
  expect(logoutCalls).toBe(1);
});

test("Account deletion requires typed confirmation before submitting", async ({ page }) => {
  let currentSession: typeof session | { authenticated: false; google_enabled: true } = session;
  await page.route("**/api/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(currentSession) }));
  let deleteCalls = 0;
  await page.route("**/api/account", async (route) => {
    expect(route.request().method()).toBe("DELETE");
    expect(route.request().headers()["x-csrf-token"]).toBe(session.csrf_token);
    deleteCalls += 1;
    currentSession = { authenticated: false, google_enabled: true };
    await route.fulfill({ status: 204, body: "" });
  });
  await page.goto("/settings/profile");
  const deleteButton = page.getByRole("button", { name: "Delete account and data" });
  await expect(deleteButton).toBeDisabled();
  await page.getByRole("textbox", { name: /Type DELETE/i }).fill("DELETE");
  await expect(deleteButton).toBeEnabled();
  await deleteButton.click();
  await expect(page).toHaveURL(new URL("/", page.url()).href);
  expect(deleteCalls).toBe(1);
});
