import { expect, test } from "@playwright/test";

const cases = [
  { lesson: "math-amplitudes", qubits: 1, gates: ["h", "z", "h"] },
  { lesson: "entanglement", qubits: 2, gates: ["h", "cx"] },
  { lesson: "quantum-teleportation", qubits: 3, gates: ["h", "h", "cx", "cx", "h", "cx", "cz"] },
  { lesson: "grover-boost", qubits: 2, gates: ["h", "h", "cz", "h", "h", "x", "x", "cz", "x", "x", "h", "h"] },
  { lesson: "deutsch-intro", qubits: 2, gates: ["x", "h", "h", "cx", "h"] },
];

for (const item of cases) {
  test(`${item.lesson} launches the displayed circuit into Lab`, async ({ page }) => {
    await page.route("**/api/me", route => route.fulfill({ json: { authenticated: false } }));
    await page.goto(`/learn/${item.lesson}`);
    await page.getByRole("link", { name: /Launch in Lab/ }).click();
    await expect(page).toHaveURL(/\/workspace\?mode=circuit&preset=lesson-/);
    const panel = page.locator(".circuit-panel");
    await expect(panel.locator(".operation.on-wire")).toHaveCount(item.gates.length);
    await expect(panel.locator(".wire-row")).toHaveCount(item.qubits);
    for (let index = 0; index < item.gates.length; index++) {
      const gate = panel.locator(`.operation-slot:nth-child(${index + 1}) .operation.on-wire`);
      await expect(gate).toContainText(item.gates[index].toUpperCase());
    }
    const requestPromise = page.waitForRequest(request => request.url().endsWith("/api/explorer/demo/simulate") && request.method() === "POST");
    await panel.getByRole("button", { name: /Execute/ }).click();
    const payload = (await requestPromise).postDataJSON();
    expect(payload.qubits).toBe(item.qubits);
    expect(payload.operations.map((operation: { gate: string }) => operation.gate)).toEqual(item.gates);
  });
}

test("returning from a different lesson replaces an already visited Lab circuit", async ({ page }) => {
  await page.route("**/api/me", route => route.fulfill({ json: { authenticated: false } }));
  await page.goto("/learn/entanglement");
  await page.getByRole("link", { name: /Launch in Lab/ }).click();
  await expect(page.locator(".circuit-panel .operation.on-wire")).toHaveCount(2);
  await page.goBack();
  await page.getByRole("navigation", { name: "Academy path" }).getByRole("link", { name: "Quantum teleportation", exact: true }).click();
  await expect(page).toHaveURL(/\/learn\/quantum-teleportation$/);
  await expect(page.getByRole("link", { name: /Launch in Lab/ })).toHaveAttribute("href", /preset=lesson-teleportation-demo/);
  await page.getByRole("link", { name: /Launch in Lab/ }).click();
  await expect(page.locator(".circuit-panel .operation.on-wire")).toHaveCount(7);
  await expect(page.locator(".circuit-panel .wire-row")).toHaveCount(3);
  await page.reload();
  await expect(page.locator(".circuit-panel .operation.on-wire")).toHaveCount(7);
});

test("a signed-in draft and saved whiteboard mode do not override the lesson", async ({ page }) => {
  await page.route("**/api/me", route => route.fulfill({ json: { authenticated: true, id: "handoff-test", display_name: "Handoff Test", csrf_token: "test-csrf" } }));
  await page.route("**/api/progress", route => route.fulfill({ json: [] }));
  await page.addInitScript(() => {
    localStorage.setItem("qw_lab_mode", "whiteboard");
    localStorage.setItem("qw_circuit_draft_handoff-test", JSON.stringify({ qubits: 1, name: "Old draft", operations: [{ gate: "x", target: 0 }] }));
  });
  await page.goto("/learn/math-amplitudes");
  await page.getByRole("link", { name: /Launch in Lab/ }).click();
  await expect(page.locator(".circuit-panel")).toBeVisible();
  await expect(page.locator(".circuit-panel .operation.on-wire")).toHaveCount(3);
  await expect(page.locator(".circuit-panel .gate-z")).toHaveCount(1);
});
