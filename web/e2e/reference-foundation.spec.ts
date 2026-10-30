import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/me", route => route.fulfill({ json: { authenticated: true, id: "ui-test", display_name: "Ada", csrf_token: "test-only" } }));
  for (const endpoint of ["lessons", "progress", "circuits", "challenges"]) {
    await page.route(`**/api/${endpoint}`, route => route.fulfill({ json: [] }));
  }
});

test("path filters support the keyboard, preserve resource links and sort actual paths", async ({ page }) => {
  await page.goto("/learn");
  const paths = page.getByRole("region", { name: "Academy units" });
  const cards = paths.getByRole("article");
  await expect(cards).toHaveCount(6);
  const filters = page.getByRole("group", { name: "Learning path difficulty" });
  await filters.getByRole("button", { name: "All paths", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(filters.getByRole("button", { name: "For beginners" })).toBeFocused();
  await expect(filters.getByRole("button", { name: "For beginners" })).toHaveAttribute("aria-pressed", "true");
  await expect(cards).toHaveCount(2);
  await page.keyboard.press("End");
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("Reservoir computing");
  await cards.first().getByText("Lessons & resources", { exact: true }).click();
  await expect(cards.first().getByRole("link", { name: "Reservoir lab (simulation)" })).toHaveAttribute("href", "/academy/labs/reservoir");
  await filters.getByRole("button", { name: "All paths", exact: true }).click();
  await page.getByLabel("Sort by", { exact: true }).selectOption("title");
  await expect(cards.first().getByRole("heading")).toHaveText("Algorithms & search");
});

test("dashboard keeps the optional qubit demonstration accessible", async ({ page }) => {
  await page.goto("/dashboard");
  const preview = page.locator(".db-bloch-disclosure");
  await expect(preview).not.toHaveAttribute("open");
  await preview.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(preview.locator("canvas")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(preview.locator("canvas")).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ada");
});

test("unavailable learning progress is not displayed as zero completed lessons", async ({ page }) => {
  await page.route("**/api/progress", route => route.fulfill({ status: 503, json: { detail: "Progress unavailable" } }));
  await page.goto("/dashboard");
  await expect(page.locator(".q-ui-metric").filter({ hasText: "Lessons" }).locator("strong")).toHaveText("\u2014");
  await expect(page.locator(".db-continue-primary").getByRole("alert")).toBeVisible();
});
