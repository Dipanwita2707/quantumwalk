// Read-only browser inventory for the platform UX audit.
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("@playwright/test");

const base = process.env.CONTROL_AUDIT_BASE_URL || "http://localhost:3000";
const api = process.env.CONTROL_AUDIT_API_URL || "http://127.0.0.1:8000";
const output = path.resolve(__dirname, "../../docs/ux-audit/2026-10-27-control-inventory.csv");
const common = [
  "/", "/start", "/login", "/dashboard", "/workspace?mode=circuit&preset=bell",
  "/workspace?mode=whiteboard", "/learn", "/learn/reference", "/learn/hardware",
  "/academy", "/academy/foundations", "/academy/reservoir",
  "/academy/labs/grover", "/academy/labs/qft", "/academy/labs/shor",
  "/academy/labs/qec", "/academy/labs/reservoir", "/explorer", "/explorer/grover",
  "/explorer/tsp", "/explorer/mapper", "/hub", "/hub/doc-editor",
  "/hub/document-pro", "/hub/ml-studio", "/algorithms", "/challenges", "/coach",
  "/circuits", "/achievements", "/settings/profile", "/hardware", "/privacy", "/terms",
];

async function catalogRoutes(endpoint, prefix) {
  try {
    const response = await fetch(`${api}/api/${endpoint}`);
    if (!response.ok) return [];
    const records = await response.json();
    return Array.isArray(records) ? records.filter((item) => typeof item.slug === "string").map((item) => `/${prefix}/${encodeURIComponent(item.slug)}`) : [];
  } catch { return []; }
}

const quote = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

async function main() {
  const routes = [...new Set([...common,
    ...await catalogRoutes("lessons", "learn"),
    ...await catalogRoutes("algorithms", "algorithms"),
    ...await catalogRoutes("challenges", "challenges"),
  ])];
  const browser = await chromium.launch({ headless: true });
  const rows = [["session", "requested_route", "final_route", "control_index", "element", "label", "href", "disabled", "visible", "execution_status"]];
  const failures = [];
  try {
    for (const session of ["guest", "mock-authenticated"]) {
      const selectedRoutes = session === "guest" ? routes : ["/dashboard", "/workspace?mode=circuit&preset=bell", "/circuits", "/achievements", "/settings/profile", "/coach", "/challenges", "/learn"];
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      if (session === "mock-authenticated") {
        await context.route("**/api/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ authenticated: true, id: "control-audit", display_name: "Audit User", email: "audit@example.test", avatar_url: null, analytics_opt_in: false, csrf_token: "audit-only" }) }));
        await context.route("**/api/progress", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
        await context.route("**/api/circuits", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
      }
      const page = await context.newPage();
      page.on("pageerror", (error) => failures.push(`${session}: ${page.url()}: ${error.message}`));
      for (const route of selectedRoutes) {
        try {
          await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 20_000 });
          await page.waitForTimeout(650);
          const controls = await page.locator("button, a[href], input, select, textarea, summary").evaluateAll((elements) => elements.map((element, index) => {
            const style = getComputedStyle(element);
            const label = (element.getAttribute("aria-label") || element.getAttribute("title") || element.labels?.[0]?.textContent || element.closest("label")?.textContent || element.textContent || element.getAttribute("placeholder") || element.getAttribute("name") || "").replace(/\s+/g, " ").trim().slice(0, 140);
            return {
              index,
              tag: element.tagName.toLowerCase(),
              label,
              href: element.getAttribute("href") || "",
              disabled: element.matches(":disabled") || element.getAttribute("aria-disabled") === "true",
              visible: element.getClientRects().length > 0 && style.visibility !== "hidden" && style.display !== "none",
            };
          }));
          for (const control of controls) rows.push([session, route, new URL(page.url()).pathname, control.index, control.tag, control.label, control.href, control.disabled, control.visible, "rendered only; action not exercised by this inventory"]);
        } catch (error) { failures.push(`${session}: ${route}: ${error.message}`); }
      }
      await context.close();
    }
  } finally { await browser.close(); }
  fs.writeFileSync(output, rows.map((row) => row.map(quote).join(",")).join("\n") + "\n", "utf8");
  process.stdout.write(JSON.stringify({ routes: routes.length, controls: rows.length - 1, failures, output }) + "\n");
}

main().catch((error) => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; });
