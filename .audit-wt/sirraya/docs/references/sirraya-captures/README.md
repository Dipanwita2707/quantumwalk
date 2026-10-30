# Sirraya live captures (REA)

Evidence from [tools.sirraya.org](https://tools.sirraya.org/) via REA MCP / CLI.

**Primary report:** [2026-10-25-comprehensive-recon-report.md](./2026-10-25-comprehensive-recon-report.md)

## One-command replay

```powershell
cd D:\quantumwalk\sirraya
.\scripts\sirraya-one-command-capture.ps1
```

Requires Google Chrome and Node.js. Does not reinstall REA.

## Key artifacts (2026-10-25)

| File | Contents |
| --- | --- |
| `2026-10-25-rea-browser-scenario-v3.json` | Hub + Explorer, Mapper, ML Studio, Doc Editor (scenario tour) |
| `2026-10-25-rea-document-pro.json` | Document Pro via “Create a document” |
| `2026-10-25-rea-academy-v2.json` | Quantum Academy via command palette |
| `2026-10-25-rea-web-bundle.json` | Landing static bundle graph (MCP) |
| `2026-10-25-rea-landing-web-bundle.json` | Landing bundle CLI pass |
| `2026-10-25-cdp-targets.json` | Raw CDP target list snapshot |

Older attempts (`*-v2.json`, `*-tail.json`, failed partial runs) kept for audit trail.

See [rea-mcp-setup.md](../../operations/rea-mcp-setup.md) for MCP registration (already verified in Cursor).
