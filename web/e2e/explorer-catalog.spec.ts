import { expect, test } from "@playwright/test";

test("Explorer shows all experiments on desktop and filters by topic and query", async ({ page }) => {
  await page.goto("/explorer");
  const catalog = page.locator(".explorer-hub-cards");
  await expect(catalog.getByRole("article")).toHaveCount(3);
  for (const card of await catalog.getByRole("article").all()) await expect(card).toBeVisible();
  await page.getByRole("group", { name: "Filter experiment topics" }).getByRole("button", { name: "Optimization", exact: true }).click();
  await expect(catalog.getByRole("article")).toHaveCount(1);
  await expect(catalog).toContainText("Three-city routes");
  await page.getByRole("searchbox", { name: "Search experiments" }).fill("no matching experiment");
  await page.getByRole("button", { name: "Reset filters", exact: true }).click();
  await expect(catalog.getByRole("article")).toHaveCount(3);
});

test("analytical search preview responds to target selection and fits mobile", async ({ page }, testInfo) => {
  await page.goto("/explorer");
  const preview = page.getByRole("region", { name: "Make one answer stand out." });
  const target = preview.getByRole("group", { name: "Search preview target" }).getByRole("button", { name: /\|01/ });
  await target.click();
  await preview.getByRole("button", { name: "Apply one Grover iteration", exact: true }).click();
  await expect(target).toContainText("100%");
  await expect(preview.getByRole("status")).toContainText("|01⟩ is now 100%");
  await preview.getByRole("button", { name: "Reset to uniform state", exact: true }).click();
  await expect(target).toContainText("25%");
  await page.screenshot({ path: testInfo.outputPath("explorer-redesign.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await preview.getByRole("button", { name: "Apply one Grover iteration", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(target).toContainText("100%");
});
