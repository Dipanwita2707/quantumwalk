// Checks same-origin destinations found by the control inventory. Read-only GETs.
const fs = require("node:fs");
const path = require("node:path");

const base = process.env.CONTROL_AUDIT_BASE_URL || "http://localhost:3000";
const inventory = path.resolve(__dirname, "../../docs/ux-audit/2026-10-27-control-inventory.csv");
const lines = fs.readFileSync(inventory, "utf8").trim().split(/\r?\n/);
const rows = lines.slice(1).map((line) => [...line.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map((match) => match[1].replace(/""/g, '"')));
const hrefs = [...new Set(rows.filter((row) => row[4] === "a" && row[8] === "true").map((row) => row[6]))]
  .filter((href) => href.startsWith("/") && !href.startsWith("/auth/google/start"));

async function main() {
  const failures = [];
  let cursor = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (cursor < hrefs.length) {
      const href = hrefs[cursor++];
      try {
        const response = await fetch(new URL(href, base), { signal: AbortSignal.timeout(15000) });
        if (!response.ok) failures.push({ href, status: response.status });
      } catch (error) {
        failures.push({ href, error: error instanceof Error ? error.message : String(error) });
      }
    }
  }));
  process.stdout.write(JSON.stringify({ checked: hrefs.length, failures }) + "\n");
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; });
