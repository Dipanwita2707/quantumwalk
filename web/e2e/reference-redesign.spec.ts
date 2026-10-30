import { expect, test } from "@playwright/test";

const account = { authenticated: true, id: "reference-user", display_name: "Ada", email: "ada@example.test", csrf_token: "test-only" };

test.beforeEach(async ({ page }) => {
  await page.route("**/api/me", route => route.fulfill({ json: account }));
  for (const endpoint of ["progress", "lessons", "challenges"]) {
    await page.route(`**/api/${endpoint}`, route => route.fulfill({ json: [] }));
  }
  await page.route("**/api/circuits", route => route.fulfill({ json: [
    { id: "bell", name: "Bell correlations", qubits: 2, operations: [{ gate: "H", target: 0 }], updated_at: "2026-10-28T12:00:00Z" },
    { id: "amplitude", name: "Amplitude experiment", qubits: 1, operations: [], updated_at: "2026-10-27T12:00:00Z" },
  ] }));
});

test("saved work searches, recovers empty results, sorts and reopens the original circuit", async ({ page }) => {
  await page.goto("/circuits");
  const cards = page.locator(".saved-work-list article");
  await expect(cards.first()).toContainText("Bell correlations");
  await page.getByLabel("Sort by").selectOption("name");
  await expect(cards.first()).toContainText("Amplitude experiment");
  await page.getByRole("searchbox", { name: "Search saved circuits" }).fill("  BELL ");
  await expect(cards).toHaveCount(1);
  await expect(cards.first().getByRole("link", { name: /Open in Lab/ })).toHaveAttribute("href", "/workspace?mode=circuit&circuit=bell");
  await page.getByRole("searchbox").fill("unmatched");
  await expect(page.getByRole("heading", { name: "No circuits match your search" })).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(cards).toHaveCount(2);
});

test("skip link moves keyboard focus past navigation into the route content", async ({ page }) => {
  await page.goto("/circuits");
  // Next's development toolbar can precede application links in the tab order.
  await page.getByRole("link", { name: "Skip to main content" }).focus();
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});

test("discovery overview has one catalog rather than repeating a directory", async ({ page }) => {
  await page.goto("/explorer");
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Explorer demos" })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Explore a problem");
});

test("unavailable sign-in offers public lessons without exposing server configuration", async ({ page }) => {
  await page.route("**/api/me", route => route.fulfill({ json: { authenticated: false, google_enabled: false } }));
  await page.goto("/login");
  await expect(page.getByRole("status")).toContainText("Sign-in is temporarily unavailable");
  await expect(page.getByRole("link", { name: "Explore lessons" })).toHaveAttribute("href", "/learn");
  await expect(page.getByText("GOOGLE_CLIENT_SECRET")).toHaveCount(0);
});

for (const width of [375, 768, 1280, 1600]) {
  test(`primary screens fit a ${width}px viewport`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const [name, route] of Object.entries({ home: "/", dashboard: "/dashboard", learn: "/learn", lab: "/workspace?mode=circuit", explorer: "/explorer", tools: "/hub", saved: "/circuits", account: "/settings/profile" })) {
      await page.goto(route);
      await expect(page.getByRole("main")).toBeVisible();
      await expect(page.locator(".site-topbar.private-topbar")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`${name}-${width}.png`) });
    }
  });
}
