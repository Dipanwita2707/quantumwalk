import { expect, test } from "@playwright/test";

const account = { authenticated: true, id: "ui-pages", display_name: "Ada", csrf_token: "test-only" };

test("illustrated sign-in preserves OAuth destinations and the optional qubit preview", async ({ page }) => {
  await page.route("**/api/me", route => route.fulfill({ json: { authenticated: false, google_enabled: true } }));
  await page.goto("/login?return_to=%2Flearn%2Fentanglement");
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Continue with Google" })).toHaveAttribute("href", "/auth/google/start?return_to=%2Flearn%2Fentanglement");
  const preview = page.locator(".q-ui-identity-preview");
  await expect(preview.locator("canvas")).toBeHidden();
  await preview.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(preview.locator("canvas")).toBeVisible();
  await expect(page.getByRole("link", { name: /Sign in or register with email/ })).toHaveAttribute("href", "/account/access");
});

test("email account modes work by keyboard and reflect actual provider availability", async ({ page }) => {
  await page.route("**/api/me", route => route.fulfill({ json: { authenticated: false, google_enabled: true } }));
  await page.route("**/api/v1/auth/methods", route => route.fulfill({ json: { email_enabled: false } }));
  await page.goto("/account/access?action=register");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Create your quantum identity");
  await expect(page.getByRole("button", { name: "Create your quantum identity", exact: true })).toBeDisabled();
  await expect(page.getByLabel("Display name")).toBeVisible();
  const modes = page.getByRole("group", { name: "Email account action" });
  await modes.getByRole("button", { name: "Create account", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Recover your account");
  await expect(page.getByLabel("Display name")).toHaveCount(0);
  await expect(page.getByLabel(/Password/)).toHaveCount(0);
  await page.keyboard.press("Home");
  await expect(page.getByRole("button", { name: "Sign in with email", exact: true })).toBeEnabled();
  await expect(page.getByRole("status")).toContainText("Email delivery is not configured");
});

test("community uses server filters, retains a failed draft, and only publishes with consent", async ({ page }) => {
  await page.route("**/api/me", route => route.fulfill({ json: account }));
  const event = { id: "event", title: "Interference study group", body: "Compare the results of the double-slit model together.", category: "event", created_at: "2026-10-29T12:00:00Z", mine: false };
  let attempts = 0;
  const posts = [{ id: "question", title: "Why do phases matter?", body: "How can I see a phase change in a measurement?", category: "discussion", created_at: "2026-10-29T11:00:00Z", mine: false }, event];
  await page.route("**/api/v1/community/posts?**", route => {
    const params = new URL(route.request().url()).searchParams;
    return route.fulfill({ json: posts.filter(post => (!params.get("q") || post.title.toLowerCase().includes(params.get("q")!.toLowerCase())) && (!params.get("category") || params.get("category") === "all" || post.category === params.get("category"))) });
  });
  await page.route("**/api/v1/community/posts", async route => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().headers()["x-csrf-token"]).toBe(account.csrf_token);
    expect(route.request().postDataJSON()).toMatchObject({ title: "My experiment", consent_public: true });
    attempts++;
    if (attempts === 1) return route.fulfill({ status: 503, json: { detail: "Please try again" } });
    posts.unshift({ ...event, id: "new", title: "My experiment", category: "discussion", mine: true });
    return route.fulfill({ status: 201, json: posts[0] });
  });
  await page.goto("/community");
  const feed = page.locator(".community-posts");
  await expect(feed.getByRole("article")).toHaveCount(2);
  await expect(page.getByRole("complementary", { name: "Community events" })).toContainText(event.title);
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No posts match" })).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(feed.getByRole("article")).toHaveCount(2);
  await page.getByRole("searchbox", { name: "Search posts" }).fill("phases");
  await expect(feed.getByRole("article")).toHaveCount(1);
  await page.getByRole("searchbox").fill("");
  await page.getByRole("button", { name: "New post", exact: true }).click();
  await expect(page.getByLabel("Title", { exact: true })).toBeFocused();
  await page.getByLabel("Title", { exact: true }).fill("My experiment");
  await page.getByLabel("Your message").fill("I compared repeated preparations and their measurement counts.");
  await expect(page.getByRole("button", { name: "Publish post", exact: true })).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Publish post", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Please try again");
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("My experiment");
  await page.getByRole("button", { name: "Publish post", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Your post was published" })).toBeVisible();
  await expect(page.getByRole("button", { name: "New post", exact: true })).toBeFocused();
  await expect(feed.getByRole("heading", { name: "My experiment", exact: true })).toBeVisible();
  expect(attempts).toBe(2);
});

for (const width of [390, 768, 1440]) {
  test(`identity, lesson and community fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route("**/api/me", route => route.fulfill({ json: account }));
    await page.route("**/api/progress", route => route.fulfill({ json: [] }));
    await page.route("**/api/v1/community/posts?**", route => route.fulfill({ json: [] }));
    await page.route("**/api/v1/auth/methods", route => route.fulfill({ json: { email_enabled: false } }));
    for (const path of ["/login", "/account/access", "/learn/first-qubit", "/community"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBe(true);
    }
  });
}
