# 01 — Route and page inventory

**Audit date:** 2026-10-26  
**Git HEAD:** `3f77ade` (branch `master`)  
**Stack:** Next.js 16 App Router (`web/app/**`), global `AuthGate` + `SessionProvider` in `web/app/layout.tsx`, FastAPI backend (`api/`), CSS design tokens in `web/app/style.css` + module CSS.

## Authentication model (implementation)

| Mechanism | Source | Behavior |
|-----------|--------|----------|
| Session | `GET /api/me` via `useSession()` | Returns `authenticated`, `display_name`, `google_enabled`, `csrf_token`, etc. |
| Route gate | `web/components/AuthGate.tsx` + `web/lib/publicRoutes.ts` | Only **non-public** paths redirect to `/login?return_to=…` when unauthenticated. |
| Google OAuth | `web/app/login/page.tsx` → `${API}/auth/google/start` | Default post-login target **`/dashboard`** (`return_to` query, sanitized). |
| Feature gates | Per-page (e.g. `circuits`, `settings/profile`, challenge submit) | UI + API enforce sign-in for save/progress/account actions. |

**Important:** Most product surfaces—including **`/dashboard`**, **`/workspace`**, **`/learn`**, **`/academy`**, **`/explorer`**, **`/hub`**—are **public paths** in `publicRoutes.ts`. “After login” often means **enhanced** UI (Dashboard nav item, saved circuits, progress persistence), not a separate app shell.

**Auth-required paths (AuthGate):** `/circuits`, `/achievements`, `/settings/profile` (not listed in `PUBLIC_PREFIXES`). All other listed app routes are reachable without login at the routing layer.

**Post-login landing (code):** Login defaults to **`/dashboard`**; onboarding `/start` sends authenticated users to **`/workspace?mode=circuit&algorithm=…`** or **`/dashboard`** on skip; brand link → **`/dashboard`** when authenticated (`SiteHeader.tsx`).

---

## Route inventory

Status key: **Implemented** | **Partial** (guest vs signed-in split) | **Dynamic** | **Not verified at runtime** (code-only this audit).

### Marketing & legal

| Path | Title / H1 (typical) | Purpose | Auth | Layout | Status |
|------|----------------------|---------|------|--------|--------|
| `/` | Landing hero | Acquisition, concept preview (Bloch toy) | Public | Custom landing (`landing.css`), no `SiteHeader` | Implemented; smoke **CONFIRMED** |
| `/start` | Onboarding slides | Level pick, discovery, questions → login or lab | Public | Custom `experience.css` | Implemented; smoke **CONFIRMED** |
| `/login` | Welcome to QuantumWalk | Google sign-in, `return_to` | Public | Minimal login header | Implemented; smoke **CONFIRMED** |
| `/privacy` | Privacy | Legal | Public | Content shell | CODE-ONLY |
| `/terms` | Terms | Legal | Public | Content shell | CODE-ONLY |

### Home & account (authenticated-enhanced)

| Path | Title | Purpose | Auth | Main sections (order) | Status |
|------|-------|---------|------|------------------------|--------|
| `/dashboard` | Your dashboard | XP, units, skill tree, next lesson/challenge, saved circuits preview | **Public route**; private data if signed in | `SiteHeader` → guest banner or personal header → Bloch/atmosphere → unit rails → skill tree → cards | Partial; smoke guest card **CONFIRMED** |
| `/settings/profile` | Your profile | Display name, analytics opt-in, export, logout, delete | **AuthGate required** | Form, data actions, DELETE confirm | Partial; CODE-ONLY signed-in |
| `/circuits` | Saved circuits | List/open/delete saved circuits | **AuthGate required** | Empty/sign-in prompt or circuit cards | Partial; CODE-ONLY |
| `/achievements` | Achievements | Milestones (progress-backed) | **AuthGate required** | CODE-ONLY structure | Partial |

### Primary nav (`SiteHeader` desktop pills)

Shown when authenticated: **Dashboard** + always **Tools, Lab, Academy, Learn, Challenges, Library**. Mobile `<details Menu>` adds Whiteboard, Coach, Saved circuits, Achievements, Account.

| Path | Title | Purpose | Auth | Status |
|------|-------|---------|------|--------|
| `/hub` | Research, documents… | Sirraya-style tools hub | Public | Implemented; smoke **CONFIRMED** |
| `/hub/doc-editor` | Doc Editor | Markdown editor | Public | smoke **CONFIRMED** |
| `/hub/document-pro` | Document Pro | Document templates (Sirraya module) | Public | CODE-ONLY page |
| `/hub/ml-studio` | ML Studio | NN layer toy | Public | CODE-ONLY |
| `/workspace` | Circuit Lab | Full composer, step playback, engines | Public; save/sim limits per FEATURE_STATUS | Implemented; smoke preset **CONFIRMED** |
| `/workspace?mode=whiteboard` | Whiteboard | Equation whiteboard mode | Public | CODE-ONLY |
| `/studio` | Studio alias | Linked from mobile nav | Public | CODE-ONLY |
| `/academy` | Learn the stack… | Academy hub, curriculum map, tiles | Public | smoke **CONFIRMED** |
| `/learn` | Quantum Academy (trail) | Unit sidebar + lesson list / detail | Public; progress saved if signed in | smoke **CONFIRMED** |
| `/learn/reference` | Glossary & cheat sheets | Reference glossary | Public | smoke **CONFIRMED** |
| `/learn/hardware` | Hardware concepts | Architecture cards | Public | CODE-ONLY |
| `/learn/[slug]` | Per-lesson | Lesson body, quiz, prerequisites | Public | Dynamic (13 lesson slugs in `api/content.py`); e2e quiz **CONFIRMED** (mocked API) |
| `/challenges` | Challenges arena | Mission list | Public read | smoke guest banner **CONFIRMED** |
| `/challenges/[slug]` | Challenge detail | Grading when signed in | Public view | Partial; CODE-ONLY |
| `/algorithms` | Algorithm library | Catalog | Public | CODE-ONLY |
| `/algorithms/[slug]` | Algorithm detail | Preset operations | Public | Dynamic (content slugs) |
| `/coach` | Coach | Tutor (local + optional AI) | Public | CODE-ONLY; link in header |

### Academy extensions

| Path | Purpose | Status |
|------|---------|--------|
| `/academy/foundations` | Math spine reader | CODE-ONLY |
| `/academy/reservoir` | Reservoir concept | CODE-ONLY |
| `/academy/labs/grover` | Grover lab | e2e **CONFIRMED** |
| `/academy/labs/qft` | QFT simulator lab | e2e **CONFIRMED** |
| `/academy/labs/shor` | Shor educational lab | e2e **CONFIRMED** |
| `/academy/labs/qec` | Bit-flip QEC toy | e2e **CONFIRMED** |
| `/academy/labs/reservoir` | Reservoir simulation | e2e **CONFIRMED** |

### Explorer (not in desktop primary nav)

| Path | Purpose | Status |
|------|---------|--------|
| `/explorer` | Explorer hub (3 cards) | smoke **CONFIRMED** |
| `/explorer/mapper` | Classical↔quantum mapper | e2e **CONFIRMED** |
| `/explorer/tsp` | TSP + Grover preset callout | smoke TSP **CONFIRMED** |
| `/explorer/grover` | Grover walkthrough | CODE-ONLY |

### Other product routes

| Path | Purpose | Status |
|------|---------|--------|
| `/hardware` | Hardware info | Public; CODE-ONLY |
| `/explorer` | See above | |

---

## Lesson slugs (`/learn/[slug]`)

From `api/content.py` / `web/lib/learnUnits.ts`:  
`first-qubit`, `math-amplitudes`, `entanglement`, `quantum-teleportation`, `grover-boost`, `deutsch-intro`, `tsp-classical`, `qft-intro`, `shor-intro`, `vqe-intro`, `pedagogy-noise`, `qec-bit-flip`, `quantum-reservoir`.

---

## Implementation map (major routes)

| Route | Page file | Key components |
|-------|-----------|----------------|
| `/dashboard` | `web/app/dashboard/page.tsx` | `SiteHeader`, `SkillTreePanel`, `GuestExperienceBanner`, `dashboard.css` |
| `/workspace` | `web/app/workspace/page.tsx` | `LabEnginePanel`, `QuantumToolbox`, `EntanglementLab`, `lab.css` |
| `/learn`, `/learn/[slug]` | `web/app/learn/page.tsx`, `[slug]/page.tsx` | `LearningTrail`, `LearnPathSidebar` |
| `/academy` | `web/sirraya/routes/academy/page.tsx` | `ACADEMY_MODULES`, `LEARN_UNITS` |
| Labs | `web/app/academy/labs/*/page.tsx` | `*EducationalLab`, `QftSimulatorLab`, etc. |
| `/explorer/*` | `web/app/explorer/**` | `QuantumMapperLab`, TSP pages |
| `/hub` | `web/app/hub/page.tsx` → Sirraya | `HubHome`, `hubTools.ts` |
| Auth | `AuthGate`, `publicRoutes.ts`, `web/lib/api.ts` | Session provider |

---

## Loading / empty / error patterns (cross-cutting)

- **Session loading:** AuthGate “Opening your private lab…”; pages use `role="status"` loading copy.
- **API errors:** `.content-error` + Retry buttons (dashboard, circuits, learn).
- **Guest prompts:** `GuestExperienceBanner`, sign-in CTAs on `/circuits`, `/settings/profile`.
- **Lab:** Extensive inline validation and simulation error strings in `workspace/page.tsx` (CODE-ONLY depth).

---

## Count summary

| Category | Count |
|----------|------:|
| Static `page.tsx` routes | 37 |
| Dynamic lesson URLs | 13 |
| Dynamic algorithm/challenge URLs | ~10+ (content-driven) |
| **Distinct URL patterns documented** | **~50+** |
