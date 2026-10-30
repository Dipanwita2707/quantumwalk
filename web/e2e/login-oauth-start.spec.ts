import { expect, test } from "@playwright/test";

test("login keeps a local return path and rejects an external return URL", async ({ page }) => {
  await page.route("**/api/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ authenticated: false, google_enabled: true }) }));
  await page.goto("/login?return_to=%2Fworkspace%3Fmode%3Dcircuit");
  await expect(page.getByRole("link", { name: /Continue with Google/i })).toHaveAttribute("href", "/auth/google/start?return_to=%2Fworkspace%3Fmode%3Dcircuit");

  await page.goto("/login?return_to=https%3A%2F%2Fevil.example.test");
  await expect(page.getByRole("link", { name: /Continue with Google/i })).toHaveAttribute("href", "/auth/google/start?return_to=%2Fdashboard");
});

test("configured Google start sends state, nonce, PKCE, and minimal scopes", async ({ request }) => {
  const response = await request.get("/auth/google/start?return_to=%2Fcoach", { maxRedirects: 0, timeout: 15_000 });
  if (response.status() === 503) test.skip(true, "Google OAuth is not configured in this environment.");
  expect(response.status()).toBe(302);
  const location = new URL(response.headers().location);
  expect(location.origin).toBe("https://accounts.google.com");
  expect(location.searchParams.get("response_type")).toBe("code");
  expect(location.searchParams.get("state")).toBeTruthy();
  expect(location.searchParams.get("nonce")).toBeTruthy();
  expect(location.searchParams.get("code_challenge_method")).toBe("S256");
  expect(location.searchParams.get("code_challenge")).toBeTruthy();
  expect(new Set((location.searchParams.get("scope") ?? "").split(" "))).toEqual(new Set(["openid", "email", "profile"]));
});

test("local 127.0.0.1 login moves to the OAuth cookie host", async ({ page, baseURL }) => {
  await page.route("**/api/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ authenticated: false, google_enabled: true }) }));
  const local = new URL("/login?return_to=%2Fdashboard", baseURL);
  local.hostname = "127.0.0.1";
  await page.goto(local.href);
  local.hostname = "localhost";
  await expect(page).toHaveURL(local.href);
  await expect(page.getByRole("link", { name: /Continue with Google/i })).toHaveAttribute("href", "/auth/google/start?return_to=%2Fdashboard");
});

test("lost OAuth state gives a clear retry path", async ({ page }) => {
  await page.route("**/api/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ authenticated: false, google_enabled: true }) }));
  await page.goto("/login?error=session_expired");
  await expect(page.getByRole("alert").filter({ hasText: "session expired or changed browser address" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Continue with Google/i })).toBeVisible();
});

test("Google button starts OAuth and stores state in the browser cookie", async ({ page, context, baseURL }) => {
  await page.goto("/login");
  const startResponse = page.waitForResponse((response) => response.url().includes("/auth/google/start"));
  await page.getByRole("link", { name: /Continue with Google/i }).click({ noWaitAfter: true });
  const response = await startResponse;
  expect(response.status()).toBe(302);
  expect(new URL(response.headers().location).origin).toBe("https://accounts.google.com");
  const cookies = await context.cookies(baseURL!);
  expect(cookies.some((cookie) => cookie.name === "session" && cookie.httpOnly && cookie.sameSite === "Lax")).toBe(true);
});

test("an authenticated visitor is not shown a stale Google error", async ({ page }) => {
  await page.route("**/api/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ authenticated: true, id: "test", display_name: "Learner", email: "learner@example.test", avatar_url: null, analytics_opt_in: false, csrf_token: "test" }) }));
  await page.goto("/login?error=sign_in_failed&return_to=%2Fdashboard");
  await expect(page.getByRole("link", { name: /Continue to your dashboard/i })).toBeVisible();
  await expect(page.getByText("Google sign-in did not finish.")).toHaveCount(0);
});
