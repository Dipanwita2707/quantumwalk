# REA MCP setup (deeper Sirraya capture)

**Status (2026-10-25):** Cursor registration is **aligned** (`~/.cursor/mcp.json` → `npx -y rea-agents@6.8.0 mcp`). MCP probes (`binary_session`, `inspect_analysis_settings`) succeed in Cursor. CLI `npx rea-agents doctor` may still report `environment_healthy: false` until optional native engines (Ghidra, Hopper, etc.) are installed — that does **not** block Sirraya **web** capture.

Use this runbook for browser/bundle capture and optional native RE tooling.

## Prerequisites

- Node.js 22+ (matches `rea-agents` engines)
- Git

## Install and register

```powershell
npx rea-agents setup
```

1. Select **Cursor** when prompted.  
2. Approve MCP config changes (backup created by setup).  
3. Restart Cursor.

Verify:

```powershell
npx rea-agents doctor
```

## Capture Sirraya (after MCP live)

With a browser target on `https://tools.sirraya.org/`:

```powershell
npx rea-agents list-browser-targets <cdp-endpoint>
npx rea-agents analyze-web-bundle <cdp-endpoint> <targetId> --fetch-source-maps
```

Store evidence bundles under `docs/references/sirraya-captures/`.

### Full automated browser recon (recommended)

```powershell
cd D:\quantumwalk\sirraya
.\scripts\sirraya-one-command-capture.ps1
```

Uses `capture_browser_scenario` JSON in `sirraya/scripts/` (Chrome launch, headless). Output summary: `docs/references/sirraya-captures/2026-10-25-comprehensive-recon-report.md`.

**Source maps:** Production `*.js.map` URLs return **404** on current deploy (E027); rely on bundle analysis and local captures.

Passive landing bundle (optional, user Chrome on CDP 9222):

```powershell
npx -y rea-agents@6.8.0 analyze-web-bundle http://127.0.0.1:9222 <targetId> --fetch-source-maps --evidence_output docs/references/sirraya-captures/landing-bundle.json
```

## CLI fallback (no MCP)

```powershell
npx rea-agents analyze-javascript-application "$env:TEMP\sirraya-assets" --json
```

Helper scripts in `scripts/sirraya_*.py` remain for hub/TSP bundle parsing.

## Automation script

```powershell
.\sirraya\scripts\setup-rea.ps1
```

Runs `doctor` and prints setup link — does not modify config without your approval.
