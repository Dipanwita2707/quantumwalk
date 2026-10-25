import { test, expect } from "@playwright/test";

test("Shor lab factors 15 with base 7", async ({ page }) => {
  await page.goto("/academy/labs/shor");
  await expect(page.getByTestId("shor-lab")).toBeVisible();
  await page.getByTestId("shor-n").selectOption("15");
  await page.getByTestId("shor-a").fill("7");
  await page.getByTestId("shor-run").click();
  await expect(page.getByTestId("shor-steps")).toBeVisible();
  await expect(page.getByTestId("shor-factors")).toContainText(/3.*5.*=.*15|5.*3.*=.*15/);
  await expect(page.getByTestId("shor-measurement")).toContainText(/c =/);
  await expect(page.getByTestId("shor-classical-ref")).toContainText(/verification only/i);
});

test("Shor lab rejects non-coprime base", async ({ page }) => {
  await page.goto("/academy/labs/shor");
  await page.getByTestId("shor-n").selectOption("15");
  await page.getByTestId("shor-a").fill("5");
  await page.getByTestId("shor-run").click();
  await expect(page.getByTestId("shor-validation")).toContainText(/gcd/i);
});
