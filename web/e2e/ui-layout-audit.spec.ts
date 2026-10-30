import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const routes = [
  { name: "dashboard", path: "/dashboard" },
  { name: "learn", path: "/learn" },
  { name: "explorer", path: "/explorer" },
  { name: "hub", path: "/hub" },
  { name: "lab", path: "/workspace?mode=circuit&preset=bell" },
] as const;

const viewports = [
  { label: "desktop", width: 1280, height: 900 },
  { label: "tablet", width: 768, height: 1024 },
  { label: "mobile", width: 390, height: 844 },
] as const;

const outRoot = path.join(process.cwd(), "..", "docs", "ux-refinement", "ui-audit", "20261027");

function assertNoHorizontalOverflow(pageWidth: number, scrollWidth: number, route: string, viewport: string) {
  expect(
    scrollWidth,
    `${route} @ ${viewport}: horizontal overflow ${scrollWidth}px > ${pageWidth}px`,
  ).toBeLessThanOrEqual(pageWidth + 1);
}

test.describe("UI layout audit (system)", () => {
  test.beforeAll(() => {
    fs.mkdirSync(outRoot, { recursive: true });
  });

  for (const route of routes) {
    for (const viewport of viewports) {
      test(`${route.name} ${viewport.label} — no overflow, screenshot`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(route.path);
        await page.waitForLoadState("networkidle").catch(() => {});
        await page.waitForTimeout(600);

        const metrics = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        assertNoHorizontalOverflow(metrics.clientWidth, metrics.scrollWidth, route.name, viewport.label);

        await page.screenshot({
          path: path.join(outRoot, `${route.name}-${viewport.label}.png`),
          fullPage: true,
        });
      });
    }
  }

  test("lab — execute keeps the circuit and shows the Bloch sphere", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/workspace?mode=circuit&preset=bell");
    const runBtn = page.locator(".circuit-panel").getByRole("button", { name: /Execute/i });
    await expect(runBtn).toBeVisible({ timeout: 20_000 });
    await runBtn.click();
    await expect(page.getByLabel("Top measurement probabilities").locator("progress").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(".circuit-panel")).toBeVisible();
    await expect(page.locator(".bloch-panel, .quantum-sphere").first()).toBeVisible();
  });

  test("lab — results sit beside the circuit on a desktop width", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/workspace?mode=circuit&preset=bell");
    await expect(page.locator(".bloch-panel")).toBeVisible({ timeout: 20_000 });
    const circuit = await page.locator(".circuit-panel").boundingBox();
    const bloch = await page.locator(".bloch-panel").boundingBox();
    expect(circuit).not.toBeNull();
    expect(bloch).not.toBeNull();
    expect(bloch!.x).toBeGreaterThan(circuit!.x + 200);
  });
});
