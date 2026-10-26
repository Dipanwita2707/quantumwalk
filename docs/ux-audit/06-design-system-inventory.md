# 06 — Design system inventory

Evidence from `web/app/style.css`, `web/app/qw-layout.css`, module CSS (`dashboard.css`, `lab.css`, `challenges.css`, `sirraya/web/styles/hub.css`, `quantum-site-ambience.css`).

## Color & theme

| Token | Value | Usage |
|-------|-------|--------|
| `--bg` | `#07101f` | Page background |
| `--surface`, `--surface-2` | Navy panels | Cards, shells |
| `--line` | `#203250` | Borders |
| `--text` | `#e9f0ff` | Body |
| `--muted` | `#9baac5` | Secondary text |
| `--violet` | `#a279ff` | Accents |
| `--cyan` | `#57e6ea` | Brand mark, focus ring |
| `color-scheme` | dark | Global |

Background: layered radial gradients on `body` — consistent “quantum navy” brand (AGENTS.md reference UI).

## Typography

- **Font stack:** `Inter, Geist, Arial, sans-serif` on `:root`.
- **Hierarchy:** `.eyebrow` / `.panel-kicker` (uppercase labels), `h1` on content pages, `.content-intro` for lede.
- **Landing:** separate `.ql-*` classes in `landing.css` (larger marketing type).

## Layout primitives

| Class | Role |
|-------|------|
| `.app-shell` | Min-height page wrapper |
| `.topbar` / `.site-topbar` | Sticky 72px header |
| `.content-shell` | Standard main padding |
| `.content-card` | Card surfaces |
| `.mapper-lab` | Lab-style two-column experiments |
| `.db-shell` | Dashboard-specific grid |

## Components (reusable)

| Component | Path | Notes |
|-----------|------|-------|
| `SiteHeader` | `web/components/SiteHeader.tsx` | Pills + mobile details |
| `GuestExperienceBanner` | `web/components/GuestExperienceBanner.tsx` | Guest CTAs |
| `AuthGate` | `web/components/AuthGate.tsx` | Session gate |
| `CircuitViewer` | `web/components/CircuitViewer.tsx` | Lesson/lab diagrams |
| `QuantumSphere` / Bloch | Multiple | Visualizations |
| `SkillTreePanel` | `web/components/SkillTreePanel.tsx` | Dashboard gamification |
| `*EducationalLab` | Shor, QFT, etc. | Shared “mapper-lab” layout |
| Sirraya `HubHome` | `web/sirraya/components/hub/HubHome.tsx` | `.qw-hub-*` classes |

## Buttons & actions

- `.primary-action` — main CTA
- `.card-action` — secondary link-styled
- `.google-action` — OAuth
- `.danger-action` — account delete
- `.header-nav-pill` + `.active` — nav state

## Forms

- Labels wrap inputs in profile and labs.
- `.content-error`, `.success-note`, `[role=alert|status]` for feedback.
- Checkboxes: `.checkbox-line`.

## Motion

- `QuantumSiteAmbience` / `CircuitAtmosphere` — ambient backgrounds; dashboard pause control.
- `scroll-behavior: smooth` on `html`.

## Breakpoints

- No single `@media` source of truth documented; header uses `.header-mobile-nav` vs `.header-nav-pills` (CO — exact breakpoint in CSS not fully extracted).
- Playwright default desktop; **mobile viewport not systematically tested** in this audit.

## Inconsistencies (recorded, not normalized)

| Area | Observation |
|------|-------------|
| Landing | Own header, no `SiteHeader` |
| Login | Minimal header vs app chrome |
| Hub | Sirraya `.qw-hub-*` vs QuantumWalk `.content-card` |
| Lab | Dense toolbar vs academy lab simple forms |
| Dashboard | Unique `.db-*` subsystem vs generic content pages |

## Tests as living UI spec

- `data-testid` heavily used in labs (Shor, QFT, Mapper, QEC) — good hook for redesign regression.
