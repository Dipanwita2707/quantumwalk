import { expect, test } from "@playwright/test";

test("Dashboard Bloch canvas draws magenta state arrow", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByText("Explore a qubit", { exact: true }).click();
  const canvas = page.locator(".db-bloch-demo canvas");
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(900);
  const stats = await canvas.evaluate((c) => {
    const el = c as HTMLCanvasElement;
    const ctx = el.getContext("2d");
    if (!ctx || el.width < 10 || el.height < 10) {
      return { w: el.width, h: el.height, pink: 0 };
    }
    const data = ctx.getImageData(0, 0, el.width, el.height).data;
    let pink = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a > 40 && r > 180 && g < 150 && b > 100) pink += 1;
    }
    return { w: el.width, h: el.height, pink };
  });
  expect(stats.w, `canvas buffer ${stats.w}x${stats.h}`).toBeGreaterThan(50);
  expect(stats.pink, "magenta arrow pixels on canvas").toBeGreaterThan(30);
});
