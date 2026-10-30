import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const cookiePath = process.env.SRS_TEST_COOKIE;
test.skip(!cookiePath, "Requires an isolated migrated API and a synthetic test-session cookie file.");

test.beforeEach(async ({ context }) => {
  if (cookiePath) await context.addCookies([JSON.parse(fs.readFileSync(cookiePath, "utf8"))]);
});

test("prediction to real experiment, persisted run, report and mission reward", async ({ page }) => {
  await page.goto("/lab/double-slit");
  await expect(page.getByRole("heading", { level: 1, name: "Double-Slit Mystery" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run experiment", exact: true })).toBeDisabled();
  await page.getByLabel("Your prediction").fill("Recording the path will remove the interference fringes because coherence is lost.");
  await page.getByRole("button", { name: "Run experiment", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved privately" })).toBeVisible();
  await expect(page.locator(".science-metrics dt").filter({ hasText: "Detected particles" })).toBeVisible();
  await page.getByRole("link", { name: /Open saved run/ }).click();
  await expect(page.getByRole("heading", { name: "Double-Slit Mystery", exact: true }).first()).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PDF", exact: true }).click();
  const file = await download;
  const filePath = await file.path();
  expect(filePath).toBeTruthy();
  expect(fs.readFileSync(filePath!).subarray(0, 8).toString()).toBe("%PDF-1.4");
  const notebookTitle = `Interference observations ${Date.now()}`;
  await page.getByLabel("Notebook title").fill(notebookTitle);
  await page.getByRole("button", { name: "Create notebook", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Notebook created" })).toBeVisible();
  await page.getByLabel("Choose notebook").selectOption({ label: notebookTitle });
  await page.getByLabel("Interpretation and notes").fill("The seeded samples approach the analytic intensity distribution.");
  await page.getByRole("button", { name: "Save entry", exact: true }).click();
  await expect(page.getByText("The seeded samples approach the analytic intensity distribution.")).toBeVisible();
  await page.goto("/missions");
  await page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Double-Slit Mystery", exact: true }) }).getByRole("button").click();
  const options = page.getByLabel("Completed experiment");
  await options.selectOption({ index: 1 });
  await page.getByLabel("Which-path information removes coherence").check();
  await page.getByLabel("Reflect on your prediction").fill("The measured distribution supports the prediction that recording the path removes interference.");
  await page.getByRole("button", { name: "Submit evidence" }).click();
  await expect(page.getByRole("status").filter({ hasText: /Checkpoint passed|already recorded/ })).toBeVisible();
});

for (const width of [390, 1440]) {
  test(`reference scientific screens fit ${width}px with real API data`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 960 });
    for (const route of ["/lab", "/lab/tunnelling", "/missions", "/notebook", "/pricing", "/billing", "/community", "/faculty"]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator(".site-topbar.private-topbar")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`${route.replaceAll("/", "-")}-${width}.png`), fullPage: true });
    }
  });
}

test("catalog filters real labs and reset restores them", async ({ page }) => {
  await page.goto("/lab");
  await expect(page.getByRole("heading", { name: "Double-Slit Mystery", exact: true })).toBeVisible();
  await page.getByRole("searchbox", { name: "Search experiments" }).fill("hydrogen");
  await expect(page.locator(".science-lab-card")).toHaveCount(1);
  await page.getByRole("searchbox").fill("no-such-model");
  await page.getByRole("button", { name: "Reset filters", exact: true }).click();
  await expect(page.locator(".science-lab-card")).toHaveCount(9);
});

test("community publishes with consent and deletes its own post through the real API", async ({ page }) => {
  await page.goto("/community");
  const title = `Isolated reference review ${Date.now()}`;
  await page.getByRole("button", { name: "New post", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByLabel("Your message").fill("Synthetic isolated test: I compared ideal probabilities with repeated measurements.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Publish post", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Your post was published" })).toBeVisible();
  const post = page.locator(".community-posts article").filter({ has: page.getByRole("heading", { name: title, exact: true }) });
  await expect(post).toBeVisible();
  await post.locator("summary").click();
  page.once("dialog", dialog => dialog.accept());
  await post.getByRole("button", { name: "Delete my post" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Post deleted" })).toBeVisible();
  await expect(post).toHaveCount(0);
});
