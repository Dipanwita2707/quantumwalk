// Read-only mobile layout and basic control reachability audit over inventoried routes.
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("@playwright/test");

const base = process.env.CONTROL_AUDIT_BASE_URL || "http://localhost:3000";
const inventory = path.resolve(__dirname, "../../docs/ux-audit/2026-10-27-control-inventory.csv");
const output = path.resolve(__dirname, "../../docs/ux-audit/2026-10-27-mobile-route-audit.json");
const lines = fs.readFileSync(inventory, "utf8").trim().split(/\r?\n/);
const rows = lines.slice(1).map((line) => [...line.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map((match) => match[1].replace(/""/g, '"')));
const allRoutes = [...new Set(rows.filter((row) => row[0] === "guest").map((row) => row[1]))];
const selectedRoutes = process.env.CONTROL_AUDIT_ROUTES?.split(",").filter(Boolean);
const routes = selectedRoutes ?? allRoutes;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const results = [];
  try {
    for (const route of routes) {
      try {
        const response = await page.goto(new URL(route, base).toString(), { waitUntil: "domcontentloaded", timeout: 20000 });
        await page.waitForTimeout(700);
        const result = await page.evaluate(() => {
          const visible = (element) => {
            const style = getComputedStyle(element);
            return element.getClientRects().length > 0 && style.display !== "none" && style.visibility !== "hidden";
          };
          const controls = [...document.querySelectorAll("button,a[href],input,select,textarea,summary")].filter(visible);
          const unnamed = controls.filter((element) => !(
            element.getAttribute("aria-label") || element.getAttribute("title") || element.labels?.[0]?.textContent ||
            element.closest("label")?.textContent || element.textContent || element.getAttribute("placeholder")
          )?.trim()).map((element) => element.outerHTML.slice(0, 180));
          const unreachable = controls.filter((element) => !element.matches(":disabled") && element.getAttribute("aria-hidden") !== "true" && element.tabIndex < 0 && element.getAttribute("role") !== "tab").map((element) => element.outerHTML.slice(0, 180));
          const outside = [...document.querySelectorAll("body *")].filter((element) => visible(element) && element.getBoundingClientRect().right > document.documentElement.clientWidth + 1);
          const overflowElements = outside.filter((element) => ![...element.children].some((child) => outside.includes(child))).slice(0, 8).map((element) => ({ tag: element.tagName.toLowerCase(), className: String(element.className).slice(0, 100), width: Math.round(element.getBoundingClientRect().width), right: Math.round(element.getBoundingClientRect().right), html: element.outerHTML.slice(0, 220) }));
          return { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, controlCount: controls.length, unnamed, unreachable, overflowElements };
        });
        results.push({ route, finalRoute: new URL(page.url()).pathname, status: response?.status() ?? null, ...result });
      } catch (error) { results.push({ route, error: error instanceof Error ? error.message : String(error) }); }
    }
  } finally { await browser.close(); }
  fs.writeFileSync(output, JSON.stringify(results, null, 2) + "\n");
  const problems = results.filter((result) => result.error || (result.status && result.status >= 400) || result.scrollWidth > result.clientWidth + 1 || result.unnamed?.length || result.unreachable?.length);
  process.stdout.write(JSON.stringify({ routes: routes.length, problems, output }) + "\n");
  if (problems.length) process.exitCode = 1;
}

main().catch((error) => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; });
