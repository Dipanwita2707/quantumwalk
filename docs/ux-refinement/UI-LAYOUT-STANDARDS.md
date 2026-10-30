# UI layout standards (QuantumWalk)

Use these rules when adding sticky bars, sidebars, or dense panels so headers and controls do not overlap.

## Sticky stacking

| Layer | Element | `top` | `z-index` |
|-------|---------|-------|-----------|
| 1 | `.topbar` / `.site-topbar` | `0` | `10` |
| 2 | Lab run bar, explorer sidebar nav | `var(--qw-topbar-height)` | `9` |
| 3 | Page content | — | `1` (`.qw-app-layer`) |

Define **`--qw-topbar-height: 72px`** on `:root` (see `web/app/style.css`). Any new sticky control below the global header must use `top: var(--qw-topbar-height)`, not `top: 0`.

## Grids and overflow

- Grid children that hold charts, code, or circuit rows: **`min-width: 0`** and **`overflow-x: clip`** or **`auto`** as appropriate.
- Run **`web/e2e/ui-layout-audit.spec.ts`** after layout changes (desktop / tablet / mobile).

## API in local dev

Browser fetches should use **same-origin** (`getApiBase()` → `""`) so Next rewrites hit `API_INTERNAL_URL`. Do not point the UI at `:8000` unless `NEXT_PUBLIC_API_URL` is intentional.

## Verification

```powershell
cd D:\quantumwalk\web
$env:PLAYWRIGHT_REUSE_DEV="1"
$env:API_INTERNAL_URL="http://127.0.0.1:8001"   # match your uvicorn port
npx playwright test --project=chromium e2e/ui-layout-audit.spec.ts
```

Screenshots: `docs/ux-refinement/ui-audit/20261027/`.
