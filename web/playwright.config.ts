import { defineConfig, devices } from "@playwright/test";

const devPort = process.env.PLAYWRIGHT_DEV_PORT;
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? (devPort ? `http://localhost:${devPort}` : "http://localhost:3000");
const apiInternal = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8000";
const devCommand = devPort ? `npm run dev -- -p ${devPort}` : "npm run dev";

const skipWebServer = process.env.PLAYWRIGHT_LIVE_NO_WEBSERVER === "1";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  projects: [
    {
      name: "chromium",
      testIgnore: "**/tsp-live-integration.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "live-tsp-backend",
      testMatch: "**/tsp-live-integration.spec.ts",
      timeout: 180_000,
      expect: { timeout: 15_000 },
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  ...(skipWebServer
    ? {}
    : {
        webServer: {
          command: devCommand,
          url: baseURL,
          reuseExistingServer:
            process.env.PLAYWRIGHT_REUSE_DEV === "1" ? true : !process.env.CI && !devPort,
          timeout: 120_000,
          env: {
            ...process.env,
            API_INTERNAL_URL: apiInternal,
          },
        },
      }),
});
