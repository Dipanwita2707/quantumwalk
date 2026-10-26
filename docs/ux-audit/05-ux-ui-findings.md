# 05 — UX/UI findings (prioritized)

**Redesign triage (2026-10-26):** UX-NAV-01, UX-NAV-03, UX-IA-01 partially addressed in Phases 1–5. See `09-redesign-implementation-status.md`.

| ID | Route / area | Severity | Confidence | Finding |
|----|--------------|----------|------------|---------|
| UX-AUTH-01 | Global | P1 | CONFIRMED | **`/dashboard` is a public route** (`publicRoutes.ts`) while copy says “private lab” and login promises a private space. Guests see dashboard with `GuestExperienceBanner`; signed-in users see the same shell with API-backed data. **Impact:** blurred guest vs authenticated mental model. **Direction:** Clarify “Dashboard” as progress hub for everyone vs rename guest view; or gate route. |
| UX-AUTH-02 | `/workspace` | P2 | CONFIRMED | **DEVELOPMENT.md** states Google sign-in required for workspace; **`/workspace` is public**. Guests can use lab with demo/preset limits per FEATURE_STATUS. **Impact:** doc/user expectation mismatch. **Direction:** Align docs and in-app labels with hybrid guest lab. |
| UX-NAV-01 | Header | P2 | CONFIRMED | **Explorer** not in desktop pill nav; only via Academy tile or direct URL. **Impact:** Mapper/TSP hidden from primary discovery. **Direction:** Add Explorer pill or merge under Lab/Academy with clear IA. |
| UX-NAV-02 | Header | P2 | CODE-ONLY | **Coach** linked in header but omitted from desktop pills (only mobile menu). **Impact:** uneven discoverability desktop vs mobile. |
| UX-NAV-03 | `/learn/reference` | P3 | CODE-ONLY | `checkIsActive("academy")` true for `/learn/reference`, while Learn pill uses `/learn` prefix — both may show active. **Impact:** ambiguous location indicator. |
| UX-NAV-04 | Lab link | P3 | CODE-ONLY | Lab uses raw `<a href>` not Next `Link` — may full-reload vs client transition. **Impact:** minor performance/state reset. |
| UX-IA-01 | Tools vs Lab vs Academy | P2 | CONFIRMED | Three parallel entry points (Hub documents, Workspace quantum lab, Academy/learn curriculum) with overlapping tiles linking to same destinations. **Impact:** cognitive load for new users. |
| UX-IA-02 | Sirraya hub | P3 | CONFIRMED | `/hub` content (Document Pro, ML Studio) sits beside quantum product with same chrome. **Impact:** brand boundary confusion (mitigated by “Sirraya-style” copy). |
| UX-DASH-01 | `/dashboard` | P2 | CODE-ONLY | Many parallel async loads with independent error/retry — partial failure states possible. **Impact:** cluttered error UX. |
| UX-LAB-01 | `/workspace` | P2 | CODE-ONLY | Monolithic page component (~1700+ lines) combining modes, engines, save, tutor hooks. **Impact:** redesign/regression risk, hard empty states. |
| UX-A11Y-01 | Mobile nav | P2 | CODE-ONLY | Primary nav collapsed in `<details><summary>Menu</summary>` — works natively but easy to miss; focus order not validated in audit. **Direction:** audit with axe/keyboard pass. |
| UX-A11Y-02 | Global | P3 | CONFIRMED | `:focus-visible` outline defined in `style.css` (cyan). **Impact:** positive baseline; spot-check lab controls UNVERIFIED. |
| UX-LEARN-01 | `/learn` | P2 | CT | Guest quiz uses localStorage; signed-in uses API — different persistence semantics on same UI. **Impact:** progress surprise on sign-in. |
| UX-CHAL-01 | `/challenges` | P2 | CONFIRMED | Guest can read missions; grading requires sign-in (FEATURE_STATUS). Banner present in smoke. **Direction:** clearer CTA on submit. |
| UX-DOC-01 | Docs vs product | P3 | CONFIRMED | FEATURE_STATUS says “6 lessons”; learnUnits lists 13 slugs — marketing counts may drift. |

### Security note (not UX polish)

| ID | Severity | Confidence | Finding |
|----|----------|------------|---------|
| SEC-01 | P0 | CODE-ONLY | AuthGate only protects 3 routes; authorization for data relies on API cookies/CSRF — expected if API enforces; **not penetration-tested** in this audit. |

Each finding includes reproduction in §03–§04 or source files cited in §01.
