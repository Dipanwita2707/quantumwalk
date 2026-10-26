# 04 — User journeys

Environment: Playwright Chromium, guest `GET /api/me` mock (`authenticated: false`), `http://localhost:3000` (implicit via `webServer` in Playwright config if present; tests **passed** 33/33). **No live Google OAuth** in this audit.

**Follow-up (mock auth):** `web/e2e/ux-audit-authenticated.spec.ts` mocks `authenticated: true` plus circuits/progress/lessons APIs — **7/7 passed** (2026-10-26). Does not weaken production AuthGate.

## A. Login → first useful action

| Step | Action | Result | Evidence |
|------|--------|--------|----------|
| 1 | Open `/login` | Sign-in card, Google button or config message | smoke **CONFIRMED** |
| 2 | Google OAuth | **BLOCKED** — requires real credentials + DB | DEVELOPMENT.md |
| 3 | Guest alternate: `/start` → pick level | Path picker visible | smoke **CONFIRMED** |
| 4 | Guest: `/workspace?preset=…` | Lab guest hint | smoke **CONFIRMED** |

**Completion:** Full login journey **BLOCKED**. Guest “useful task” (run preset lab hint) **CONFIRMED**.

---

## B. Navigation and discovery

| Step | Action | Result | Evidence |
|------|--------|--------|----------|
| 1 | `/dashboard` (guest) | Guest intro card, no private circuits | smoke **CONFIRMED** |
| 2 | Header → Academy | `/academy` curriculum visible | smoke **CONFIRMED** |
| 3 | Academy → reference | `/learn/reference` glossary | smoke **CONFIRMED** |
| 4 | Browser back | **UNVERIFIED** explicitly | — |

---

## C. Quantum Explorer

| Step | Action | Result | Evidence |
|------|--------|--------|----------|
| 1 | `/explorer` | Three explorer cards | smoke **CONFIRMED** |
| 2 | Mapper: set cities + route index | Bitstring output | mapper e2e **CONFIRMED** |
| 3 | Invalid decode | Error message | mapper e2e **CONFIRMED** |
| 4 | TSP page | Oracle callout text | smoke **CONFIRMED** |

---

## D. Quantum Mapper

See C.2–C.3. Grover tab on mapper **CODE-ONLY** in this audit (not in mapper e2e list beyond N select).

---

## E. Quantum Academy / Learn

| Step | Action | Result | Evidence |
|------|--------|--------|----------|
| 1 | `/learn` | Trail with guest banner | smoke **CONFIRMED** |
| 2 | Submit quiz (mock lessons API) | Feedback visible | academy e2e **CONFIRMED** |
| 3 | Wrong answer → retry | Second attempt | academy e2e **CONFIRMED** |
| 4 | Prev/next lesson | Catalog order navigation | academy e2e **CONFIRMED** |
| 5 | Prerequisite link on shor-intro | `/learn/qft-intro` | shor e2e **CONFIRMED** |

Progress persistence when signed in: quiz submit with empty progress mock → “Mission accomplished” **CONFIRMED (mock auth)**; server save not validated against real DB.

---

## F. Quantum labs

| Lab | Run experiment | Evidence |
|-----|----------------|----------|
| QFT | Norm + gate fidelity | qft e2e **CONFIRMED** |
| Shor | Factors 15=3×5, multi-shot | shor e2e **CONFIRMED** |
| QEC | Syndrome + correct | academy e2e **CONFIRMED** |
| Grover | Success probability | academy e2e **CONFIRMED** |
| Reservoir | Simulation runs | academy e2e **CONFIRMED** |

---

## G. Account and session

| Step | Action | Result | Evidence |
|------|--------|--------|----------|
| Open `/settings/profile` as guest | AuthGate → login redirect | CO `AuthGate` + publicRoutes |
| Open `/settings/profile` (mock auth) | Profile form, Save, Sign out | ux-audit-authenticated **CONFIRMED** |
| Logout / export / delete | **BLOCKED** (mock only; no click) | — |
| Session expiry | **UNVERIFIED** | — |

---

## H. Authenticated journeys (mock session)

| Step | Action | Result | Evidence |
|------|--------|--------|----------|
| 1 | `/circuits` | Saved list (“Audit Bell pair”), Dashboard nav, header account link | **CONFIRMED** |
| 2 | `/dashboard` | No “Guest overview”; display name in main | **CONFIRMED** |
| 3 | `/achievements` | Milestones + Lessons tab | **CONFIRMED** |
| 4 | `/workspace?mode=circuit` | Lab shell loads (public route; no AuthGate block) | **CONFIRMED** |
| 5 | Mobile menu + `/circuits` | Mobile nav + circuits heading | **CONFIRMED** |

**Still CODE-ONLY / UNVERIFIED (mock):**

- Save circuit in lab → appears in `/circuits` (list mocked, not lab save flow)
- Challenge submission → graded progress on dashboard
- Display name change on profile (form visible; save not clicked)
- Real Google OAuth login → `/dashboard` default
