import { expect, test } from "@playwright/test";

const gates = [
  { id: "h", name: "Hadamard" },
  { id: "x", name: "Pauli X (NOT)" },
  { id: "y", name: "Pauli Y" },
  { id: "z", name: "Pauli Z" },
  { id: "s", name: "Phase S (π/2)" },
  { id: "t", name: "Phase T (π/4)" },
  { id: "rx", name: "Rotation Rx(θ)", angle: 1.5708 },
  { id: "ry", name: "Rotation Ry(θ)", angle: 1.5708 },
  { id: "rz", name: "Rotation Rz(θ)", angle: 1.5708 },
  { id: "cx", name: "Controlled-NOT (CX)", twoQubit: true },
  { id: "cz", name: "Controlled-Z (CZ)", twoQubit: true },
  { id: "swap", name: "SWAP Gate", twoQubit: true },
  { id: "measure", name: "Measurement Z" },
] as const;

test("all 13 Lab gates reach the live guest simulator with valid parameters", async ({ page }) => {
  await page.goto("/workspace?mode=circuit&blank=1");
  const composer = page.locator(".circuit-panel");
  const run = composer.getByRole("button", { name: /Execute/i });
  await expect(run).toBeEnabled();
  await page.getByRole("button", { name: /\+ Qubit \(1\/5\)/ }).click();

  for (const gate of gates) {
    await test.step(gate.id, async () => {
      await page.locator(".gate-list").getByRole("button", { name: `Select ${gate.name} gate` }).click();
      if ("angle" in gate) await composer.locator(".gate-parameter-controls input[type=number]").fill(String(gate.angle));
      const target = "twoQubit" in gate ? 1 : 0;
      await composer.getByRole("button", { name: `Add ${gate.name} to qubit ${target}` }).click();
      await expect(composer.locator(".meta").filter({ hasText: /gates/i })).toHaveText(/1 gates/);

      const responsePromise = page.waitForResponse((response) => response.url().includes("/api/explorer/demo/simulate") && response.request().method() === "POST");
      await run.click();
      const response = await responsePromise;
      expect(response.status(), `${gate.id} simulation status`).toBe(200);
      const sent = response.request().postDataJSON();
      expect(sent.operations[0].gate).toBe(gate.id);
      expect(sent.operations[0].target).toBe(target);
      if ("twoQubit" in gate) expect(sent.operations[0].control).toBe(0);
      if ("angle" in gate) expect(sent.operations[0].angle).toBeCloseTo(gate.angle);
      expect((await response.json()).steps.length).toBeGreaterThan(0);
      await composer.getByRole("button", { name: "Clear all" }).click();
    });
  }
});
