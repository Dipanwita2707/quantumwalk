import { expect, test } from "@playwright/test";

// Reuse one real Bell result across viewports. Rendering can request both a guest
// and signed-in result during session hydration; layout checks must not exhaust
// the public simulator's shared quota before testing the mobile layout.
let bellResult: Promise<unknown> | undefined;

for (const width of [1920, 1280, 390]) {
  test(`lesson uses available width and organized navigation at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1080 });
    await page.route("**/api/me", route => route.fulfill({ json: { authenticated: true, id: "layout-test", display_name: "Layout Test", email: "layout@example.test", avatar_url: null, analytics_opt_in: false, csrf_token: "test-csrf" } }));
    await page.route("**/api/progress", route => route.fulfill({ json: [] }));
    await page.route(/\/api\/(?:simulate|explorer\/demo\/simulate)$/, async route => {
      expect(route.request().postDataJSON()).toMatchObject({ qubits: 2, operations: [{ gate: "h", target: 0 }, { gate: "cx", target: 1, control: 0 }] });
      bellResult ??= route.fetch({ url: new URL("/api/explorer/demo/simulate", route.request().url()).href }).then(async response => {
        expect(response.ok()).toBe(true);
        return response.json();
      });
      await route.fulfill({ json: await bellResult });
    });
    await page.goto("/learn/entanglement");
    const shell = page.locator(".learn-trail-layout");
    const layout = await shell.boundingBox();
    expect(layout!.width).toBeGreaterThanOrEqual(width - 20);
    await expect(page.getByRole("heading", { name: "Build a Bell pair", exact: true })).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Understand the idea", exact: false })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Try the experiment", exact: false })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Check understanding", exact: false })).toBeVisible();
    await expect(page.getByRole("slider", { name: "Quantum evolution step" })).toBeEnabled();
    const navigation = page.getByRole("navigation", { name: "Academy path" });
    if (width < 900) {
      await expect(navigation).toBeHidden();
      await page.getByRole("button", { name: /Course navigation/ }).click();
      await expect(navigation).toBeVisible();
      await page.getByRole("button", { name: /Course navigation/ }).click();
    } else {
      const openUnits = navigation.locator(".learn-path-unit[open]");
      await expect(openUnits).toHaveCount(1);
      await expect(openUnits).toContainText("Entanglement");
      await navigation.locator("summary").filter({ hasText: "Algorithms & search" }).click();
      await expect(navigation.getByRole("link", { name: "Qft intro", exact: true })).toBeVisible();
      await navigation.locator("summary").filter({ hasText: "Algorithms & search" }).click();
      const content = await page.locator(".learn-trail-main").boundingBox();
      expect(width - (content!.x + content!.width)).toBeLessThan(60);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`lesson-${width}.png`), fullPage: true });
  });
}
