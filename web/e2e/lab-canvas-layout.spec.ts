import { expect, test } from "@playwright/test";

for (const width of [1920, 1280, 390]) {
  test(`five-qubit circuit keeps ten gates aligned and clear of actions at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1080 });
    await page.goto("/workspace?mode=circuit&blank=1");
    const composer = page.locator(".circuit-panel");
    await expect(composer.getByRole("button", { name: /Execute/i })).toBeEnabled();
    for (let count = 1; count < 5; count++) {
      await composer.getByRole("button", { name: new RegExp(`\\+ Qubit \\(${count}/5\\)`) }).click();
    }
    if (width < 700) await composer.getByRole("button", { name: /RY Rotation Ry/ }).click();
    else await page.getByRole("button", { name: /Select Rotation Ry/ }).click();
    for (let index = 0; index < 10; index++) {
      await composer.getByRole("button", { name: new RegExp(`Add Rotation Ry.* to qubit ${index % 5}$`) }).click();
    }
    const rows = composer.locator(".wire-row");
    await expect(rows).toHaveCount(5);
    const ruler = composer.locator(".lab-circuit-ruler > div > span");
    await expect(ruler).toHaveCount(10);
    for (const row of await rows.all()) {
      const slots = row.locator(".operation-slot");
      await expect(slots).toHaveCount(10);
      const action = await row.locator(".add-wire").boundingBox();
      const last = await slots.last().boundingBox();
      expect(last!.x + last!.width).toBeLessThan(action!.x);
      for (const index of [0, 4, 9]) {
        const gate = await slots.nth(index).boundingBox();
        const tick = await ruler.nth(index).boundingBox();
        expect(Math.abs(gate!.x - tick!.x)).toBeLessThan(1);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await composer.locator(".circuit-scroll").screenshot({ path: testInfo.outputPath("five-qubit-canvas.png") });
  });
}
