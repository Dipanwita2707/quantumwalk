# QuantumWalk platform UX: login, learning, dashboard, and gamification plan

Date: 13 October 2026. Status: implementation in progress.

Scope update: start with login and assess the complete platform journey. Sections 13–17 extend this plan with source-backed findings and supersede the dashboard-first delivery order in sections 10 and 12.

Implementation checkpoint (13 October 2026): focused login and retry states, condensed navigation with a mobile menu, optional introduction exit and honest temporary progress wording, a mission-led dashboard and achievement collection derived from lesson/challenge progress, clearer Lab guidance, account-scoped Lab drafts, corrected challenge probability labels, saved-circuit loading feedback, and account-action pending states are in the application. Typecheck and production build passed for the earlier slices. Headless Chrome screenshots were visually reviewed at desktop and 500px width, using temporary local API fixtures for the private dashboard; the fixtures and screenshots were removed afterward. Live Google OAuth, full browser interaction and keyboard testing, the approved reference comparison, usability sessions, and time-based rewards still require verification or implementation. Do not interpret this document as a completed release sign-off.

## 1. Direction and review scope

Make the dashboard a calm starting point for an engaging quantum-learning journey. Within a few seconds, a learner should understand what to do next, what they have learned, and where to experiment freely. Preserve the dark navy foundation and violet/cyan identity, with the tagline “See inside a quantum algorithm.”

This review inspected the dashboard TSX/CSS, shared navigation, learning progress interactions, app layout, and existing platform plan. It is a source-level review: no rendered browser inspection or reference-image comparison was performed. Visual judgments below are design hypotheses to validate in a prototype. Backend reward verification and the approved database schema still need inspection before implementation.

Existing references: [platform plan](PLATFORM_BUILD_PLAN.md), [dashboard](web/app/dashboard/page.tsx), [dashboard styles](web/app/dashboard/dashboard.css), [navigation](web/components/SiteHeader.tsx), and [learning flow](web/components/LearningTrail.tsx).

## 2. Current dashboard assessment

| Finding | User impact | Priority and proposed change |
| --- | --- | --- |
| Header exposes seven destinations when signed in; Circuit Lab and Whiteboard are separate peers. | Navigation asks users to understand the product structure immediately. | P1: consolidate creation under Lab, with Circuit and Whiteboard tabs. |
| Welcome actions, module tiles, quick templates, and a featured algorithm repeat destinations. | Several competing starting points dilute the next action. | P1: make one recommended mission dominant; keep deliberate shortcuts secondary. |
| “Quantum System Control,” “4 Engines,” telemetry, and backend version occupy prominent space. | The introduction emphasizes machinery more than learning outcomes. | P1: use direct language and move technical status into the lab where useful. |
| Dashboard shows `completedCount * 100` XP and a fixed “Level 1 Explorer.” | Level does not reflect progress; mastery and participation are conflated. | P0: establish consistent progress definitions before adding rewards. |
| Foundations percentage uses all completed progress times 33; fill has an 8% minimum and a 100% maximum. | Zero can look partly complete, and the label can exceed 100%. | P0: count completed lessons belonging to the actual foundation track and use its real denominator. |
| Circuit/progress request failures become empty arrays. | An outage can look like lost work or reset progress. | P0: independent loading, error, retry, and empty states. |
| “Simulator active” and Aer version are hard-coded in the dashboard. | Availability is presented without a live signal. | P0: remove from the dashboard or derive from a verified capability/health response. |
| The Superposition quick-launch link points to generic `/workspace`. | The link itself does not specify the promised template. | P1: verify workspace behavior and give templates explicit, tested destinations. |
| Styles include many 9–12px labels, a dense three-column grid, and an infinite pulse animation. | Readability and attention may suffer, especially on narrow screens. | P1: larger text, fewer card layers, calmer motion; verify inherited focus/reduced-motion rules. |
| Saved circuits are all rendered in the dashboard list. | The home screen becomes longer as users create more work. | P1: show a short subset and provide a full-list destination. |

Keep the existing real saved-circuit data, direct lab access, lesson/challenge destinations, navy palette, and responsive grid foundation.

## 3. Navigation architecture

Retain top navigation as the initial direction to preserve the existing product composition. Prototype it before considering a sidebar; a sidebar would consume valuable circuit-editor space.

| Primary destination | Route | Purpose and secondary navigation |
| --- | --- | --- |
| Home | `/dashboard` | Recommended mission, progress, recent circuits. |
| Learn | `/learn` | Learning path, lesson details, practice recommendations. |
| Lab | `/workspace?mode=circuit` | Circuit and Whiteboard tabs; saved circuits reachable from the lab. |
| Challenges | `/challenges` | Recommended challenge, difficulty filters, completed challenges. |
| Library | `/algorithms` | Searchable algorithms and working starter templates. |

Coach remains available as a labeled contextual action and through the navigation overflow; keep `/coach` directly reachable. Put account, preferences, and privacy access under the profile control. Keep hardware as an optional advanced destination rather than promoting it in beginner navigation. Preserve existing routes, including `/studio`, with compatible behavior.

Desktop: brand, five primary destinations, Coach action, profile. Tablet/mobile: brand and a labeled menu button opening an accessible drawer with the same order and visible current location. Do not squeeze every destination into horizontally scrolling pills. Detail pages get breadcrumbs/back links; lab tabs retain their selected mode across navigation.

## 4. Dashboard composition

The learning mission owns the strongest contrast and largest action. The dashboard should contain approximately five useful regions, with minimal nested cards.

```text
QuantumWalk     Home  Learn  Lab  Challenges  Library     Coach  Profile

Welcome back, [name]                         Level / XP to next level
See inside a quantum algorithm.

+--------------------------------------+-----------------------------+
| YOUR NEXT MISSION                    | YOUR LEARNING PATH          |
| Create your first superposition      | Qubits -> Gates ->          |
| Learn what H changes. About 5 min.    | Measurement -> Entanglement |
| Small circuit + probability preview | 2 of 6 foundation lessons   |
| [Continue mission]   Open Lab        | [View path]                 |
+--------------------------------------+-----------------------------+
| RECENT CIRCUITS                      | RECOMMENDED CHALLENGE       |
| Up to 3 saved items + View all       | One suitable challenge      |
+--------------------------------------+-----------------------------+
| LATEST MILESTONE / NEXT ACHIEVEMENT                                  |
+--------------------------------------------------------------------+
```

Illustrated titles, durations, counts, and XP in prototypes must be marked as sample data. Production values come from available content and saved progress.

For a first-time learner, show “Start your first mission,” explain the first outcome, and replace the empty circuit list with one useful creation prompt. For returning learners, resume a stored checkpoint if supported; otherwise link honestly to the next incomplete lesson without claiming exact resumption. For a completed track, recommend a suitable challenge or the next available track. Experienced users always retain direct Open Lab access.

Cap recent circuits at three and offer “View all” linking to `/circuits`. Only call them “recent” after verifying a reliable modification timestamp and sort order. Display name, qubits, gate count, and a clear Open action. Do not add unsupported timestamps or thumbnails.

## 5. A distinctive quantum visual identity

Use quantum structure as the visual language: circuit wires, H/X/control-gate symbols, probability bars, phase markers, and restrained Bloch-sphere geometry. A small mission preview should explain the activity, such as H changing ideal measurement probabilities from 100/0 to 50/50. Label previews as examples; never present decorative motion as a simulation result.

Preserve mathematical accuracy: distinguish sampled counts from ideal probabilities, and avoid representing an entangled pair as a single pure-state Bloch vector. Bloch visuals must identify the qubit and explain mixed-state limitations when relevant.

| Design element | Proposed rule |
| --- | --- |
| Background | Existing deep navy; quiet surfaces with one slightly brighter elevated tone. |
| Violet | Primary action, current mission, selected learning node. |
| Cyan | State information, circuit highlights, supporting interactive accents. |
| Green / amber | Success / caution with icon and text, never color alone. |
| Typography | Keep the existing font family; approximately 30–36px page title, 18–20px section title, 14–16px body, at least 12px supporting metadata. |
| Spacing | Consistent 4/8px rhythm; 24px desktop card padding and gaps, 16px on mobile. |
| Surfaces | Subtle borders, consistent 12–16px radii; reduce stacked borders, blur, and shadows. |
| Content width | Prototype a 1280–1360px dashboard maximum; let the lab use its own wider layout. |
| Icons | One consistent existing SVG/CSS icon vocabulary with text labels for important actions. |
| Motion | Short state transitions; brief completion feedback; no persistent pulsing required to read status. |

Keep most of the screen visually quiet. Put the strongest quantum artwork in the mission region rather than giving every card a glow, orbital background, and badge. No new visual dependency is required for the initial pass.

## 6. Gamification: learning actions drive rewards

Core loop: choose a mission -> predict an outcome -> build or modify a circuit -> inspect the result -> explain what happened -> receive feedback -> see the next useful mission.

Use depth of progression to create engagement while showing only a compact summary on Home. Full paths, achievement collections, and challenge details live on their own screens.

| Mechanic | Proposed behavior | Clean-interface constraint |
| --- | --- | --- |
| Missions | Short lessons with one learning objective and a visible finish condition. | One dominant recommendation on Home. |
| XP | First verified lesson completion starts at 100 XP, preserving current lesson messaging. Proposed challenge rewards: 150/250/400 by reviewed difficulty. | One total and one next-level indicator. Values need balance review before release. |
| Levels | Initial proposal: level = 1 + floor(total XP / 500), with progress toward the next 500. Levels measure activity, not expertise. | Display once; no repeated level badges on every card. |
| Mastery | Per-concept evidence from assessment, separate from accumulated XP. Until evidence supports mastery, say “Track progress.” | Show completed/total lessons clearly. |
| Learning path | Qubits, gates, measurement, entanglement, then supported algorithms. Map to existing content first. | A short preview on Home; full accessible list/map in Learn. |
| Challenges | Predict a result, build a target state, explain a phase change; add gate-efficiency goals only where mathematically appropriate. | One recommended challenge; filters on the challenge page. |
| Achievements | Specific outcomes such as first correct prediction or verified Bell-pair challenge. Expose the criteria. | Latest earned and next attainable achievement only. |
| Weekly goal | User chooses a modest activity target; meaningful completed work counts. | Optional small indicator; no pressure banner. |
| Streaks | Optional later feature with a stated timezone, forgiving missed days, and no XP loss. | Off the critical path; avoid urgency or punishment. |
| Rewards | Brief “Mission complete” feedback, what was learned, earned XP, and a next action. | Inline celebration; avoid stacked modals and blocking confetti. |

Do not award repeat XP for reloads, repeated submissions, or repeatedly running the same circuit. Hints must support learning without removing core completion credit. Keep the sandbox accessible regardless of level; prerequisites may guide a course, but users can inspect upcoming material. Avoid global leaderboards, virtual currency, daily loot, and social feeds in the first release.

Example mission: predict an H gate's measurement probabilities, run the one-qubit example, compare prediction with ideal results, answer a short explanation question, receive first-completion XP, and continue to measurement. If a probability prediction is wrong, explain it and allow another attempt without erasing prior work.

## 7. Connected page experience

Learn: clear path grouped by concept, one current node, lesson duration estimate, visible prerequisites, and a standard completion panel. Provide a linear list equivalent to any graphical path.

Lab: default to the circuit builder with synchronized state views and step controls. Put Whiteboard in a sibling tab. Open mission/template links into the intended context; preserve unsaved work before replacing it. Keep rewards away from scientific controls and results.

Challenges: show objective, required concepts, difficulty, verification criteria, hint access, and retry feedback before the learner starts. Completion must depend on a verified result.

Library: show concept, difficulty, qubits, and a useful short description; provide “Explore algorithm” and, where supported, “Open template in Lab.” Avoid showing identical featured algorithms in several dashboard regions.

Coach: provide contextual help such as “Explain this gate” or “Help with this mission.” Accurately identify the current local curated explanation capability. External AI is a separate, consent-based integration, not assumed by this design.

## 8. Data, correctness, and state requirements

Start with the existing authenticated session, circuit list, lesson catalog, and progress endpoints. Track progress is the number of completed matching lesson identifiers divided by the actual track membership; zero is visually zero, and text and fill always agree. If a track has no available lessons, show an unavailable state rather than dividing by zero.

Inspect backend completion validation before labeling rewards “verified.” Persistent rewards require server-authoritative completion, deduplication per user/activity/reward version, and atomic awards so concurrent requests cannot double-credit. Never accept XP totals or ownership claims from the browser. Existing lesson and dashboard XP messaging must share the same policy.

Before adding any fields, compare needs against the user's approved schema: reward history or equivalent derivation, completion timestamps, resume checkpoints, weekly goals, and level preferences may not be supported. Explicit approval is required for schema changes. Ship truthful lesson progress first if richer mechanics need later work. Do not fabricate historical streaks or award dates during migration.

Each dashboard region needs independent loading, empty, error, and retry behavior. Keep usable circuit data visible if progress fails. Render unknown progress as unavailable, not zero. Ensure switching users or signing out clears private data, and session resolution cannot flash a misleading new-user state. Use “Loading your progress” rather than a guessed XP total.

## 9. Responsive and accessible behavior

Desktop: two main columns with the mission dominant. Tablet: reduce secondary content and collapse navigation before it crowds. Mobile: greeting, mission, compact progress, recent work, recommended challenge, milestone in that order. No essential action depends on hover; circuit canvases may scroll within their region without making the whole page overflow.

Verify keyboard navigation, visible focus, semantic heading order, labeled progress, accessible menus with Escape/focus return, status announcements, and contrast. Aim for comfortable 44px action targets. Respect reduced motion and retain meaning without animation. Check 200% zoom, long user/circuit names, large XP values, and error messages that wrap. Validate at 390px, 768px, 1280px, and 1440px widths plus a narrow 320px reflow check.

## 10. Delivery sequence and acceptance gates

| Phase | Concrete deliverable | Acceptance gate |
| --- | --- | --- |
| 1: Baseline and truthful state | Capture current rendered screens; verify route/template behavior; repair progress calculation, level labeling, false status, and silent errors. | Zero/partial/full progress matches catalog; failure is distinct from empty; all promised links open the correct context. |
| 2: Prototype navigation and Home | Responsive prototype with first-time, returning, finished-track, loading, and failure variants; agreed visual tokens. | A new learner identifies the next action within five seconds; lab and saved work remain easy to find. Compare against the approved reference when available. |
| 3: Implement the clean dashboard | Mission-led layout, simplified shared navigation, recent-circuit subset, working path/challenge links. | Existing authenticated routes remain reachable; keyboard/mobile walkthrough passes; no dead controls. |
| 4: Progression foundation | Shared XP policy, verified first-completion behavior, honest levels, consistent completion feedback. | Reload, retry, and concurrent submissions cannot duplicate rewards; dashboard and Learn totals agree. Schema gaps reviewed before any migration. |
| 5: Richer learning loop | Concept path, criteria-based achievements, contextual recommendations, optional weekly goals. | Rewards correspond to demonstrated actions; recommendations fit prerequisites; partial failures recover cleanly. |
| 6: Validate and refine | Reference comparison, usability sessions, accessibility checks, targeted regression tests and performance review. | Learners complete the start -> lesson -> lab -> result -> return flow without assistance; first-screen clarity and data accuracy meet the criteria below. |

Implement each phase as a scoped change. No framework rewrite, production deployment, new dependency, external AI integration, or schema change is authorized by this planning document.

## 11. Verification and success measures

Test progress arithmetic against real catalog membership, empty tracks, unrelated challenge progress, and duplicate completion records. Check first-time and existing users, partial API failure, session expiry, missing saved-circuit access, deleted content, and unsaved work during template navigation. Verify keyboard and touch paths manually in a rendered browser. Run frontend typecheck/build for implementation changes and relevant backend tests for any reward work.

Use a small usability review to measure whether users identify the next mission, resume the intended activity, find saved circuits, and explain the learning outcome. Proposed product metrics are first-mission completion, return-to-learning, verified challenge completion, and successful circuit resumption. Record a baseline before setting improvement claims. Analytics are a separate implementation decision: avoid recording circuit contents, answers, or private research data and disclose collection appropriately.

Release criteria: one obvious primary action; no contradictory XP/progress/status; no fabricated achievements; full keyboard operation; readable narrow layouts; working recovery states; preserved private data boundaries; quantum visuals that teach an accurate concept.

## 12. Recommended first implementation scope

Start with login, return destinations, and onboarding continuity as detailed below. Then address shared navigation and the mission-led dashboard using existing lesson progress and routes. Add deeper rewards after completion semantics and schema compatibility are verified.

## 13. Extended review: where the platform journey breaks down

Additional source inspection: login, AuthGate, the five-step start experience, onboarding content, workspace initialization/draft persistence, saved circuits, algorithm and challenge lists, shared activity detail, Coach, profile, and targeted global styles. This remains a source-level assessment, not a completed browser or security audit. Existing global focus and reduced-motion styles were found; their coverage must be tested rather than assumed absent.

| Observed behavior | UX consequence | Required plan item |
| --- | --- | --- |
| Login uses the full SiteHeader, including links to protected tools. | Users can leave sign-in for another destination that requires sign-in again. | Give login a minimal public header: brand, Back to home, and necessary help/legal access. |
| Login's authenticated CTA always says “Open your dashboard,” but its URL can be a lesson or lab deep link. | The action label can disagree with its outcome. | Use destination-aware text, or the honest generic “Continue”; preserve the validated destination. |
| Login displays session errors without an explicit retry control; AuthGate has a retry control. | Recovery differs across the same sign-in journey. | Add consistent retry behavior and separate session-loading, provider-unavailable, canceled, and failed states. |
| Start has five stages; its two question stages require an answer before advancing. Direct Sign in exists, but there is no explicit Skip introduction action preserving the selected path. | Users who want the tool must infer an exit route and may lose their chosen context. | Make the introduction optional and provide “Skip to sign in” or “Open Lab” with path context preserved. |
| Introduction XP rewards viewed articles and submitted answers; its badge and points reset on reload, as disclosed near the end. | Temporary exploration rewards can be mistaken for persistent learning XP. | Remove the XP label from this preview or identify it as temporary from the first display. Do not claim a saved badge without persistence. |
| Onboarding's final link carries algorithm and level; workspace can prefer a locally saved Whiteboard mode when no mode is specified. | A circuit starter may arrive in a different tool view than intended. | Set circuit mode explicitly on circuit-mission links and test all entry paths, including a prior Whiteboard session. |
| Workspace stores draft and simulation data under a browser-wide `qw_circuit_draft` key. Inspected logout code does not clear this key. | On a shared browser, draft handling may violate expectations of an account-private workspace. | Audit hydration and account transitions; isolate drafts by account, clear appropriate private state on logout, and verify cross-account behavior before claiming privacy. This is a risk finding, not a confirmed exploit. |
| Saved circuits show account loading but no explicit circuit-list loading indicator while the authenticated request is pending. | The page can look unfinished or blank during a normal fetch. | Add a list loading state and preserve clear retry/empty states. |
| Circuit actions use “Open in visualizer,” “Open in Lab,” and other variants across the platform. | Users must work out whether these are different tools. | Standardize the destination name to Lab; distinguish only genuinely different actions. |
| Challenge target strings write “50%” as coefficients in a ket expression. | Probability is confused with amplitude in the learning interface. | Use normalized amplitudes such as 1/sqrt(2), or label outcomes separately as probabilities. Add a quantum-content correctness gate. |
| Profile save/export/logout/delete handlers have no operation-specific pending controls in the inspected component. | Repeated clicks and uncertain completion are possible. | Show pending status, prevent duplicate submissions, retain editable values on failure, and announce success. |
| Coach's standalone page sends an empty one-qubit example; the workspace Coach sends the current circuit. | “Ask the coach” does not always mean “ask about my circuit.” | Explicitly label general help versus circuit-context help and preserve the distinction during navigation. |

Do not replace existing useful behavior: keep AuthGate recovery, legal links, privacy defaults, accessible gate labels, stale-result detection, saved-circuit retry, explicit deletion confirmation, and local Coach explanations.

## 14. Login and onboarding redesign

### Login composition

Desktop: a focused sign-in panel beside a restrained, labeled quantum illustration. Mobile: the sign-in panel comes first; illustration is secondary and must not push the action below the first useful viewport. Preserve the navy/violet/cyan palette. Reduce benefit copy to two short lines about private circuits and saved progress.

Use a direct heading such as “Welcome to QuantumWalk,” supporting text “Sign in to continue your quantum journey,” and one primary “Continue with Google” action. When entering from a lesson or template, show a compact context line such as “Continue to: Your first qubit.” Avoid simulator telemetry, XP, achievement claims, and navigation to the full tool suite here.

The illustration should connect to the product: a small H-gate circuit with labeled ideal probabilities, or a quiet Bloch illustration with an accessible explanation. Login must remain functional if graphics cannot render.

### Login state specification

| State | Visible response | Recovery/continuation |
| --- | --- | --- |
| Checking session | Short stable loading message; no premature Google action. | Resolve to authenticated, unauthenticated, or an actionable error. |
| Ready to sign in | One Google action and concise privacy/terms links. | Begin the existing OAuth flow with the validated return destination. |
| Leaving for Google | Brief pending feedback if navigation is delayed. | Avoid duplicate activation; recover if navigation fails. |
| Google canceled / failed | Explain that sign-in did not complete; preserve context. | Retry sign-in or return home. |
| Provider unavailable | Explain temporary unavailability without a dead CTA. | Recheck availability and return home. |
| Session check failed | Distinguish a connection/service problem from being signed out. | Visible “Try again” control. |
| Already signed in | “Continue” or a destination-specific action. | Go to the intended destination without restarting onboarding. |
| Session expired in a tool | Explain what happened and preserve recoverable draft context safely. | Sign in again, then return to the same activity. |

Keep the existing Google-only model. No password fields or additional providers are needed. Retain proper OAuth protections and validate return paths on the server as well as the client; this plan does not certify the backend implementation. Test safe internal deep links, malformed/external destinations, callback failure, and browser Back behavior.

### First-session and returning-session flows

Default new-user flow: landing -> login -> optional short path selection -> first guided mission -> feedback -> Home with an accurate next step. Existing `/start` remains an optional public concept preview, clearly distinguished from authenticated saved learning. Do not force both the public five-stage preview and a second introduction after login.

Returning user: login -> requested deep link, otherwise Home with next lesson and recent circuits. An explicit deep link takes precedence over optional onboarding. If durable onboarding completion/experience preferences are unsupported by the approved schema, use a skippable flow without asserting that the preference is saved.

Provide a clear “I'm new,” “I know the basics,” or “Take me to the Lab” entry choice with a recommended default and a later way to change it. Carry the selection and intended circuit mode through sign-in. A user who skips the introduction can still complete every lesson and earn the same learning rewards.

## 15. Shared platform UX contract

### Navigation and continuity

Use section 3's five-destination navigation consistently on authenticated pages. Public/login pages use the minimal public shell. Give every detail page a clear parent destination. Browser Back should restore useful list filters and context where supported. Do not add a second competing global navigation system inside the lab.

Define predictable URL semantics for circuit/whiteboard mode, algorithm templates, saved circuits, and challenge context. Verify query changes on an already mounted workspace, not just cold page loads. Explicit resource links must win over a restored draft, with protection before replacing unsaved work. A failed template load must explain the failure rather than silently opening an unrelated draft.

### Consistent interaction language

Use “Open Lab,” “Run simulation,” “Save circuit,” “Continue lesson,” “Check answer,” and “Verify solution” consistently. Use an action label that states the immediate result. Replace “engines,” “system control,” and “vault” where “tools,” “learning,” and “saved circuits” are clearer. Keep advanced scientific terms in context with a short explanation or expandable details.

Shared components should cover page titles, primary/secondary actions, loading/empty/error/status messages, progress summaries, confirmations, and content cards. Extend existing components and tokens incrementally; avoid a wholesale redesign or component-library dependency.

### Main-tool workflows

| Area | Primary user task | Proposed UX change | Completion criterion |
| --- | --- | --- | --- |
| Learn | Understand one concept and test it. | Objective first, short explanation, experiment, prediction/question, feedback, next activity. Keep advanced math expandable. | User knows what was learned and whether progress was saved. |
| Lab | Build, run, inspect, and save a circuit. | Make that order visible; distinguish circuit edits, current execution step, stale results, local draft, and server save. Keep advanced settings secondary. | User can connect a gate change to the resulting state and recover from an invalid edit. |
| Whiteboard | Explore equations and relate them to a circuit. | Explain its purpose in the Lab tab; preserve relevant work when switching views. State unsupported transfers honestly. | Mode switching does not imply that incompatible work was converted or saved. |
| Library | Find an appropriate example and inspect it. | Reuse existing filters; clarify concept, prerequisites, qubits, and difficulty; separate Explore from Open in Lab. | The chosen template opens in the intended mode with the correct circuit. |
| Challenges | Reach a stated target and verify understanding. | Use accurate target notation, plain objective, hint access, meaningful failure feedback, and verified completion. | The learner knows why an attempt passed or failed and what to try next. |
| Saved circuits | Find and reopen private work. | Loading indicator, consistent Open in Lab action, useful sort order, protected deletion, and clear empty state. | Reloading a saved circuit restores the correct resource; failed fetches never look like an empty library. |
| Coach | Resolve a specific point of confusion. | Suggested questions, explicit general/circuit context, preserved question on failure, truthful local/AI labeling. | User knows what context was used and can return to the task. |
| Account | Update preferences, export data, or leave safely. | Separate normal preferences from destructive actions; operation-specific pending/success/error states. | Repeated activation cannot start duplicate operations; logout clears appropriate private state. |

### Feedback and state coverage

Every asynchronous action needs an obvious pending state, a meaningful result, and recovery on failure. Preserve work when retrying. Do not show a stale success message alongside a newer failure. Confirm destructive actions and replacement of unsaved work, not routine reversible navigation. Notifications must not steal focus or hide the next task.

Apply the same spacing, type hierarchy, status colors, and focus treatment across login, onboarding, lists, details, and Lab. On narrow screens, reveal advanced information progressively rather than scaling down a desktop control wall. Keep the first useful action visible without navigating past decorative content.

## 16. Revised execution order: login first

This sequence supersedes section 10's order; its existing dashboard and reward acceptance checks still apply.

| Order | Scoped work package | Verification gate |
| --- | --- | --- |
| 0 | Capture rendered baseline for login, start, Home, Learn, Lab, Whiteboard, Library, Challenges, saved circuits, Coach, and profile. Inspect the approved reference and relevant contracts. | Separate confirmed visual/behavioral problems from source-based hypotheses; record desktop/mobile states. |
| 1 | Login shell, destination-aware continuation, error/retry behavior, session-expiry flow. | Test direct login and protected deep links, failure/cancel/unavailable states, keyboard navigation, and mobile layout. Live OAuth remains an explicit test gate requiring configured credentials. |
| 2 | Optional onboarding, skip route, consistent starter destinations, truthful preview rewards. | Beginner/intermediate/advanced choices reach the intended circuit; prior Whiteboard preference cannot override a circuit mission; explicit deep links are preserved. |
| 3 | Shared navigation and action language; minimal reusable state components. | Every existing destination stays reachable; back navigation and mode changes work; consistent focus and responsive behavior. |
| 4 | Dashboard correctness and mission-led layout from sections 2–4. | Progress and labels agree, errors are recoverable, one next action is clear. |
| 5 | Learn -> Lab -> result -> completion flow; saved-work continuity and challenge notation fixes. | Complete a first lesson and a challenge end to end; check stale results, safe draft restoration, save/reopen, and mathematical correctness. Prioritize any confirmed cross-account draft leak immediately. |
| 6 | Library, saved circuits, Coach, and profile polish. | Consistent empty/loading/error/pending states; accurate context; no duplicate destructive or save actions. |
| 7 | Deeper gamification, following section 6 and verified data support. | Rewards persist correctly and resist duplicate credit; skip/hints do not unfairly penalize learning. |
| 8 | Full responsive, accessibility, privacy, and regression review. | All critical journeys pass without unexplained dead ends or work loss; compare actual screens to the approved reference. |

No schema changes, new dependencies, broad refactors, or production deployment are implied. Identify those needs separately before implementation. Keep the existing authentication requirement for platform tools.

## 17. End-to-end acceptance checklist

- A first-time visitor can sign in and start a relevant mission without a mandatory multi-screen introduction.
- A returning user reaches the requested lesson, circuit, or template after sign-in; the label matches that destination.
- Optional public previews cannot be mistaken for saved XP, badges, or mastery.
- Google cancellation, account-check failure, provider unavailability, and session expiry all offer a clear next action.
- Circuit links consistently open Circuit mode; Whiteboard links consistently open Whiteboard mode, including after prior sessions and client-side navigation.
- Switching accounts on the same browser cannot expose another account's draft or result; private state handling is verified, not inferred from the page copy.
- Learners can build, run, interpret, save, reopen, and ask for contextual help with consistent labels and recoverable errors.
- Challenges distinguish amplitudes from probabilities, and reward only the verified outcome defined by the activity.
- Mobile/keyboard users can complete the same critical journeys; focus, contrast, zoom, and reduced motion are checked in a browser.
- Implementation is verified with targeted frontend checks and relevant authentication, ownership, progress, and simulator tests. The current checkpoint covers typecheck, build, backend platform tests, and static screenshot review; full interactive verification remains open.

## 18. Proposed data change for time-based goals (approval required)

The current `user_progress` table has one row per user and activity, with `completed`, `score`, and `updated_at`. Repeating an already completed activity can update `updated_at`, so it cannot reliably identify the first completion day. The current `users` table has no weekly-goal preference. These two gaps prevent honest weekly goals and streaks across devices.

Proposed minimal additions, subject to comparison with the user's approved schema before any migration:

| Table | Proposed column | Reason and migration behavior |
| --- | --- | --- |
| `user_progress` | `completed_at` nullable UTC timestamp | Set once when a verified activity first changes from incomplete to complete. Existing completed rows remain null; do not invent historical dates. Repeat submissions never move it. |
| `users` | `weekly_goal_target` nullable small integer with an allowed range of 1–7 | User-selected number of distinct verified activities per week. Null means the feature is off. |

The weekly goal counts distinct activities whose `completed_at` falls in the user's displayed week, using a clearly stated timezone; a streak counts consecutive weeks meeting the chosen target. No missed-week penalty, virtual currency, or backfilled history. The API would expose only the signed-in user's goal and completion dates, validate input server-side, and preserve private ownership. Tests must cover first completion, repeat submissions, concurrent submissions, week boundaries, null historical timestamps, account export/deletion, and cross-account access. This proposal does not alter the schema until the user approves it, as `AGENTS.md` requires approval before schema changes.
