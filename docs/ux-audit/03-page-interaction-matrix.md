# 03 — Page interaction matrix

Legend: **CT** = click-tested (Playwright this audit), **CO** = code-only, **BLK** = blocked (auth/env).

## Global chrome (`SiteHeader`)

| Control | Action | Result | Evidence |
|---------|--------|--------|----------|
| Brand | Navigate | `/dashboard` if auth else `/workspace` | CO |
| Pills: Tools, Academy, Learn, … | Navigate | Target route; `aria-current=page` when active | CT partial (smoke) |
| Lab pill | `<a href="/workspace?mode=circuit">` | Full navigation to lab | CO |
| Menu (mobile) | Expand | Whiteboard, Coach, circuits, achievements, account | CO |
| Coach link | Navigate `/coach` | Coach page | CO |
| Account / Sign in | Profile or login | `/settings/profile` or `/login` | CO |

## `/` Landing

| Control | Result | Evidence |
|---------|--------|----------|
| Concept mode tabs | Changes Bloch/field demo | CO |
| CTA Get started | `/start` or `/workspace` if auth | CO |
| Pause motion | Atmosphere toggle | CO |

## `/start`

| Control | Result | Evidence |
|---------|--------|----------|
| Level cards | Sets beginner/intermediate/advanced | CT smoke (path picker visible) |
| Next / skip | Advances slides or login/dashboard | CO |
| Quiz choices | Local feedback | CO |

## `/login`

| Control | Result | Evidence |
|---------|--------|----------|
| Continue with Google | Redirect to API OAuth | CT smoke (page renders); **BLK** full OAuth |
| Continue link (if already auth) | `return_to` path | CO |

## `/dashboard`

| Control | Result | Evidence |
|---------|--------|----------|
| Pause ambient motion | Toggles CSS class | CO |
| Retry (on API error) | Reloads circuits/progress/lessons | CO |
| Unit / lesson / challenge cards | Links to learn, workspace, challenges | CO |
| Skill tree nodes | Links when unlocked | CO |
| Guest banner | Sign-in CTA | CT smoke guest intro |

## `/workspace` (Circuit Lab)

| Control | Result | Evidence |
|---------|--------|----------|
| Gate toolbox | Adds gate to circuit | CO (large page) |
| Run / Step / Reset | API simulate | CT smoke preset hint |
| Engine panel | Qiskit/Cirq compare | CO |
| Save | Requires auth + CSRF | CO |
| Mode tabs (circuit / entanglement / missions / whiteboard) | Switches sub-views | CO |
| Glossary drawer | Opens drawer | CO |

## `/learn` and `/learn/[slug]`

| Control | Result | Evidence |
|---------|--------|----------|
| Sidebar unit expand | Filters lessons | CO |
| Lesson card | Opens slug | CT academy e2e |
| Prerequisite links | `/learn/{pre}` | CT e2e |
| Quiz choices | Feedback; guest localStorage or API progress | CT e2e |
| Open in lab | Preset href | CO |

## `/academy`

| Control | Result | Evidence |
|---------|--------|----------|
| Curriculum unit list | Informational | CT smoke |
| Module map links | Various hrefs | CT smoke |
| Tile grid | Learn, explorer, lab, etc. | CO |

## Academy labs (representative)

### QFT (`QftSimulatorLab`)

| Control | Result | Evidence |
|---------|--------|----------|
| qubits select | Resize register | CT e2e |
| Run / Reset | Simulation + gate fidelity | CT e2e |
| Normalize | Fixes custom amplitudes | CT e2e |

### Shor (`ShorEducationalLab`)

| Control | Result | Evidence |
|---------|--------|----------|
| N, a inputs | Validation | CT e2e |
| Simulation path / measurement policy | Workflow re-run | CT e2e |
| Run workflow | Steps + histogram | CT e2e |

### QEC (`/academy/labs/qec`)

| Control | Result | Evidence |
|---------|--------|----------|
| Flip qubits | Syndrome update | CT e2e |
| Correct | Restores state | CT e2e |

### Grover / Reservoir

| Control | Result | Evidence |
|---------|--------|----------|
| Run simulation | Updates probability / metrics | CT e2e |

## `/explorer/mapper` (`QuantumMapperLab`)

| Control | Result | Evidence |
|---------|--------|----------|
| City count, route index | TSP encode | CT e2e |
| Decode bitstring | Validation errors | CT e2e |
| Binary / Grover tabs | Separate workflows | CT e2e |

## `/explorer/tsp`

| Control | Result | Evidence |
|---------|--------|----------|
| Run classical / open preset | Charts + lab link | CT smoke callout |

## `/hub`

| Control | Result | Evidence |
|---------|--------|----------|
| Featured tool cards | Navigate to tool | CT smoke |
| Category tabs | Filter grid (featured omitted from All) | CT smoke |
| Open → | Same href as title | CO |

## `/hub/doc-editor`

| Control | Result | Evidence |
|---------|--------|----------|
| Markdown textarea | Live preview | CT smoke (label visible) |

## `/challenges`

| Control | Result | Evidence |
|---------|--------|----------|
| Mission cards | Detail slug | CO |
| Submit grade | **BLK** without auth | FEATURE_STATUS |

## `/circuits`, `/settings/profile`, `/achievements`

| Control | Result | Evidence |
|---------|--------|----------|
| Any | AuthGate or sign-in prompt if guest | CO |
| Delete circuit / account | Confirm dialogs | CO; **BLK** live test |

## `/coach`

| Control | Result | Evidence |
|---------|--------|----------|
| Ask / AI toggle | API tutor | CO |

---

## Matrix coverage note

The workspace lab alone exposes **50+** gate and transport controls; this matrix lists **representative** controls per surface. Full control enumeration would duplicate `workspace/page.tsx` (~1700 lines). Redesign phase should auto-generate from component trees if needed.
