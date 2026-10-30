# Sirraya reference analysis & QuantumWalk roadmap

**Document ID:** QW-REF-SIRRAYA-001  
**Status:** draft — competitive reference & implementation plan  
**Date:** 19 October 2026  
**Author:** Codex (for QuantumWalk product)  
**Primary reference:** [tools.sirraya.org](https://tools.sirraya.org/)  
**Related QuantumWalk docs:** [PLATFORM_BUILD_PLAN.md](PLATFORM_BUILD_PLAN.md), [DEVELOPMENT.md](DEVELOPMENT.md)

---

## 1. Purpose

Compare **Sirraya Labs** public offerings (**Quantum Explorer**, **Quantum Academy**, and related tooling) with **QuantumWalk**, then define:

1. Capabilities worth adding or deepening in QuantumWalk  
2. UI/UX patterns to borrow (without copying brand or layout wholesale)  
3. A phased, scoped implementation plan aligned with QuantumWalk’s promise: **“See inside a quantum algorithm.”**

---

## 2. Research method & limitations

| Source | What was captured | Reliability |
| --- | --- | --- |
| [tools.sirraya.org](https://tools.sirraya.org/) (HTTP fetch) | Hub page currently surfaces **Document Pro** prominently; deep links such as `/quantum-academy`, `/quantum-explorer`, `/explorer` returned **404** to automated fetch (likely SPA routing or gated entry). | Partial — hub only |
| Sirraya LinkedIn / announcements | Quantum Academy: Virtual Lab, Gate Composer, **Characterization**, Hardware Lab (superconducting, trapped-ion, neutral-atom, silicon spin, photonic), glossary, cheat sheets, career pathways (planned). | High for *intent*; medium for UI detail |
| Public posts on **QC TSP Explorer** | Five-stage workflow: encoding → oracle → Grover → transpilation → classical benchmark; noise / error mitigation framing. | High for Explorer *scope* |
| [docs.sirraya.org](https://docs.sirraya.org/introduction) (QuTub) | Compiler/transpiler ecosystem; student/researcher documentation tone. | Context for “stack depth” positioning |
| QuantumWalk codebase inventory | Routes: `/workspace`, `/learn`, `/algorithms`, `/challenges`, `/start`, `/coach`, `/dashboard`, `/hardware` (placeholder), `/studio`, etc. | High for *current* product |

**Follow-up (recommended):** Manual browse of tools.sirraya.org while signed in (if required), export **screenshots** of Academy module nav, Explorer stages, and Hardware Lab panels; store under `docs/references/sirraya/` for pixel-level UI comparison.

---

## 3. Sirraya capability inventory (target reference)

### 3.1 Quantum Academy (education + playground)

| Area | Sirraya positioning (public) | Learner outcome |
| --- | --- | --- |
| Foundations | Maths & physics from first principles | Classical → quantum mental model |
| Interactive playground | In-browser experiments tied to lessons | Theory ↔ hands-on loop |
| **Virtual Lab** | Circuit-level experimentation | Build and run without external installs |
| **Gate Composer** | Gate / circuit construction | Same skill as industry tools, simplified |
| **Characterization** | Device-oriented metrics (newer tooling) | Connect algorithms to real device behavior |
| **Hardware Lab** | Architecture-specific views (SC, ion, neutral atom, spin, photonic) | Compiler → control → physical qubit narrative |
| Control stack depth | Pulse schedules, microwave envelopes, frequency spectra (described in posts) | “What happens on hardware” literacy |
| Reference material | Glossary, cheat sheets | Low-friction lookup during labs |
| Curriculum shape | Zero-to-one path; career guidance (planned) | Retention & role clarity |
| Pricing / access | Free, browser-based, private workspace (hub messaging) | Low barrier to entry |

**Topics called out on hub/marketing (Academy bundle):** 3D Bloch sphere, circuit composer, major algorithms, **noise & error correction**, **quantum reservoir computing** — all interactive.

### 3.2 Quantum Explorer (research / problem mapping)

| Stage | Focus |
| --- | --- |
| State encoding | Canonical TSP route → quantum state; qubit budget tradeoffs |
| Oracle design | Threshold oracles marking near-optimal routes |
| Amplitude amplification | Grover-style boosting |
| Hardware-aware optimization | Transpilation, depth/gate minimization (NISQ) |
| Benchmarking | Quantum distribution vs classical brute force |
| Realism | Noise, ZNE/readout mitigation narratives |

**Audience:** developers moving past “Hello World,” optimization researchers, students who want transparent NISQ limits.

### 3.3 Ecosystem (differentiator, not MVP clone)

- Rust simulator, QuTub compiler/transpiler, QEC research stack (Sirraya engineering story).  
- QuantumWalk should **not** rebuild a full compiler in MVP; **do** expose *concepts* (basis gates, depth, transpile preview) where they teach “see inside.”

---

## 4. QuantumWalk today (baseline)

| Pillar | Current strength | Gap vs Sirraya Academy/Explorer |
| --- | --- | --- |
| **Core lab** (`/workspace`) | Circuit builder, step playback, amplitudes/probabilities, **3D Bloch**, shots, stale-run UX | Less emphasis on **device characterization**, **multi-architecture hardware story**, **transpile-to-native** preview |
| **Learning** (`/learn`, `LearningTrail`) | Lessons + quizzes + embedded `CircuitViewer`; progress API | No full **math/physics spine**, limited **cheat sheet / glossary** as first-class product surface |
| **Algorithms** (`/algorithms`) | Curated templates & narratives | No dedicated **optimization explorer** (TSP/QAOA lab with classical baseline) |
| **Toolbox** (workspace-adjacent) | `QuantumToolbox`: noise channels on Bloch, classical↔quantum mapper, inline glossary | Noise is **single-qubit pedagogical**, not circuit-level noise models or **QEC** modules |
| **Entanglement / comparison labs** | `EntanglementLab`, `ComputerComparison`, Grover toy | Strong pedagogy; not packaged as “Academy modules” with clear progression |
| **Onboarding** (`/start`, landing) | Three paths, discovery coach, polished global ambience | Sirraya-like **tool hub** entry (pick Virtual Lab vs Characterization vs Explorer) could clarify IA |
| **Account & privacy** | Google OIDC, private circuits, dashboard, achievements | Sirraya stresses **in-browser privacy** — align messaging on landing/settings |
| **Hardware** (`/hardware`) | Placeholder / status only | Sirraya **Hardware Lab** is a major Academy differentiator |
| **AI** (`/coach`) | Local curated coach | Sirraya does not center AI; QuantumWalk can keep **simulator-grounded** tutor as advantage |

**Strategic overlap:** Both products aim at accessible, hands-on quantum learning in the browser.  
**Strategic divergence:** QuantumWalk leads with **algorithm introspection** and **guided discovery**; Sirraya leads with **full-stack depth** (hardware, characterization, optimization explorer, career path).

---

## 5. Gap analysis — what to add (prioritized)

### 5.1 High impact / aligned with QuantumWalk promise

| ID | Capability | Rationale | Sirraya analog |
| --- | --- | --- | --- |
| H1 | **Structured Academy map** | Single visible curriculum: Foundations → Circuits → Algorithms → Noise → (optional) Hardware | Academy pathways |
| H2 | **First-class glossary + cheat sheets** | Searchable concepts linked to live lab anchors (`#bloch`, `#noise`) | Academy reference |
| H3 | **Optimization Explorer (TSP mini-lab)** | Problem mapping + oracle + Grover + **classical baseline chart** | Quantum Explorer |
| H4 | **Circuit-level noise lab** | Depolarizing/thermal on **small circuits** after ideal run; compare distributions | Explorer “embrace noise” |
| H5 | **Transpile & depth panel** | Show equivalent native gate set, depth, width — educational transpile, bounded | Explorer / QuTub *concept* |
| H6 | **Characterization primer** | Interactive T1/T2/readout fidelity **toy models** (not claiming real device data) | Characterization tool |

### 5.2 Medium impact / differentiation

| ID | Capability | Rationale |
| --- | --- | --- |
| M1 | **Hardware Lab (conceptual)** | Pick architecture → see *typical* gate set, connectivity graph, pulse **illustration** (SVG), link to lesson |
| M2 | **QEC intro module** | Bit-flip code, syndrome, simple error injection demo (2–3 qubits) |
| M3 | **Reservoir computing teaser** | Optional advanced module if content owner supplies scope; defer if no SME |
| M4 | **Module completion artifacts** | Export lesson summary PDF / personal “lab notebook” (privacy-safe) |

### 5.3 Lower priority / avoid scope creep

| ID | Item | Note |
| --- | --- | --- |
| L1 | Full QuTub-style compiler | Partner or link externally; do not block MVP |
| L2 | Production TSP API to 6+ cities | Bounded demo (3–4 cities) sufficient for education |
| L3 | Document Pro–style legal product | Out of scope |

---

## 6. UI/UX reference — patterns to adopt

Sirraya (from public descriptions and edu-product norms) emphasizes **tool clarity**, **stack narrative**, and **serious research tone**. QuantumWalk already uses **dark navy + violet/cyan** ambience; improve **information architecture** and **lab chrome** using these patterns:

### 6.1 Information architecture

| Pattern | Sirraya-like behavior | QuantumWalk application |
| --- | --- | --- |
| **Tool hub** | Landing lists distinct tools with one-line outcomes | Add `/tools` or enhance `/start` step 0 with tiles: **Lab**, **Learn**, **Explorer**, **Compare** |
| **Module sidebar** | Academy progress along a vertical spine | `/learn` left rail: unit → lesson → lab link (deep-link to workspace preset) |
| **Stage-based Explorer** | Five numbered stages with next/back | TSP Explorer as stepped wizard with shared step indicator component |
| **Honest labels** | Simulator vs hardware vs mitigation | Keep badges: *Ideal simulation*, *Pedagogical noise*, *Not connected* on `/hardware` |

### 6.2 Visual design (keep QuantumWalk brand)

| Element | Reference direction | QuantumWalk token / component |
| --- | --- | --- |
| **Reduce “card boxes”** | Sirraya tools feel like panels in a workspace, not marketing cards | Continue **borderless streams** (`path-stream`), glass panels in lab only |
| **Typography hierarchy** | Eyebrow → title → one outcome sentence | Reuse `.qw-eyebrow`, `.qw-heading-gradient` on hub tiles |
| **Data-first panels** | Charts beside circuit (benchmarks, distributions) | Split pane: circuit left, **metrics rail** right (depth, success prob, classical ref) |
| **3D Bloch** | Prominent but not gimmicky | Keep `QuantumSphere`; add **sync highlight** when step selects gate |
| **Reference drawer** | Glossary without leaving lab | Slide-over from workspace top bar (search + anchor links) |
| **Motion** | Subtle; content leads | Global `QuantumFlowField` stays **low in lab** (`lab` profile); no extra canvases per page |

### 6.3 UX flows to mirror

1. **Lesson → preset circuit → workspace** — one click opens seeded circuit from lesson slug.  
2. **Explorer → export to workspace** — “Open this oracle circuit in Lab” for inspection.  
3. **Compare run** — ideal vs noisy vs mitigated (three tabs, same circuit revision ID).

### 6.4 Accessibility (non-negotiable)

- Stepped Explorer: focus order follows stage; `aria-current="step"`.  
- Glossary drawer: trap focus, Esc closes, return focus to trigger.  
- Charts: table fallback or sonified summary text for screen readers.

---

## 7. Implementation plan (phased)

**Principles:** Smallest complete vertical slices; simulator-grounded numbers; bounded qubits/shots/runtime per [AGENTS.md](AGENTS.md); no user Python execution.

### Phase A — Academy surface (2–3 weeks)

| Task | Deliverable | Acceptance |
| --- | --- | --- |
| A1 | Curriculum map data model (units, lessons, lab presets) | `/learn` shows ordered path + progress |
| A2 | Glossary/cheat sheet route + workspace drawer | Search finds ≥30 terms; links open lab anchors |
| A3 | Deep links: `?preset=bell` loads workspace | From lesson CTA, user sees correct circuit in ≤2 clicks |

### Phase B — Optimization Explorer MVP (2–3 weeks)

| Task | Deliverable | Acceptance |
| --- | --- | --- |
| B1 | `/explorer/tsp` (or `/algorithms/tsp-lab`) 3-city demo | Stages 1–5 navigable; classical optimum shown |
| B2 | Grover iteration slider + success probability chart | Matches known small-instance fixtures |
| B3 | “Open in Lab” exports allowlisted circuit JSON | Workspace loads; simulation succeeds |

### Phase C — Noise & transpile depth (2 weeks)

| Task | Deliverable | Acceptance |
| --- | --- | --- |
| C1 | Circuit noise pass (backend or client-bound pedagogical model) | 2-qubit Bell demo: ideal vs noisy histogram |
| C2 | Transpile preview panel (Qiskit transpile, bounded) | Shows depth + basis gates; errors handled gracefully |
| C3 | Mitigation explainer (ZNE/readout) — **concept UI** optional toggle | Copy clearly labeled non-production |

### Phase D — Hardware & characterization story (2–3 weeks)

| Task | Deliverable | Acceptance |
| --- | --- | --- |
| D1 | `/learn/hardware` or `/hardware/lab` conceptual architectures | ≥3 architecture cards with connectivity + typical gates |
| D2 | Characterization toys (T1/T2 decay on Bloch) | Interactive; labeled pedagogical |
| D3 | Replace hardware placeholder copy with link to Hardware Lab module | No false “live device” claims |

### Phase E — Polish & validation (1 week)

| Task | Deliverable | Acceptance |
| --- | --- | --- |
| E1 | UI pass: hub tiles, explorer metrics rail, drawer | Desktop + mobile smoke; reduced-motion |
| E2 | Targeted tests for TSP fixtures + noise labeling | CI green for scoped tests |
| E3 | Update README / DEVELOPMENT limits for new bounds | Docs match enforced quotas |

**Dependencies:** Phase B can start in parallel with A2; D depends on C1 for consistent noise vocabulary.

---

## 8. Success metrics

| Metric | Target (90 days post Phase B) |
| --- | --- |
| Time to first simulation (new user from `/start`) | ≤ 3 minutes median (instrumentation) |
| Learn → Lab conversion | ≥ 40% of lesson starters open preset lab |
| Explorer comprehension | Usability n=5: user explains oracle vs amplification |
| Performance | Lab TTI unchanged ±10% with drawer closed |
| Trust | Zero UI implying live hardware without provider status |

---

## 9. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Sirraya UI inaccessible to automated audit | Manual screenshot pack + quarterly re-review |
| Scope creep into full compiler/QEC research | Cap qubits; module-based releases |
| Noise models mislead vs real devices | Persistent *pedagogical* badges + link to ideal baseline |
| Duplicate animated backgrounds | Single `QuantumSiteAmbience`; route profiles only |

---

## 10. Decision log (initial)

| Date | Decision |
| --- | --- |
| 2026-10-19 | Treat Sirraya as **reference**, not fork; keep QuantumWalk violet/cyan discovery brand |
| 2026-10-19 | Prioritize **TSP Explorer MVP** over reservoir computing until SME content exists |
| 2026-10-19 | Hardware Lab v1 = **conceptual** architectures, not provider integration |

---

## 11. Appendix — quick feature matrix

| Feature | Sirraya (public) | QuantumWalk now | Planned phase |
| --- | --- | --- | --- |
| 3D Bloch | Yes | Yes (`/workspace`) | Enhance sync |
| Gate/circuit composer | Yes | Yes | — |
| Step-by-step execution | Implied | Yes | — |
| Glossary / cheatsheets | Yes | Partial (toolbox) | A |
| TSP / optimization explorer | Yes | No | B |
| Circuit noise + mitigation story | Yes | Partial (1-qubit toolbox) | C |
| Transpile / native gates | Yes (QuTub) | Limited | C |
| Multi-architecture hardware lab | Yes | No | D |
| Characterization tooling | Yes (new) | No | D |
| QEC interactive | Mentioned | No | D (intro) |
| Reservoir computing | Mentioned | No | Deferred |
| AI tutor | Not central | Yes (`/coach`) | Keep simulator-grounded |
| Google account / private saves | Unclear | Yes | Messaging only |

---

## 12. Next actions for product owner

1. Confirm priority order: **A (Academy IA)** vs **B (TSP Explorer)** first.  
2. Provide Sirraya **screenshots or entry URLs** if tools require auth.  
3. Approve bounded limits for Explorer (max cities, shots, runtime).  
4. Optional: add `docs/references/sirraya/README.md` with image checklist once captures exist.

---

*This document is the living plan for Sirraya-informed enhancements. Update section 10 when decisions change; do not duplicate full platform scope from [PLATFORM_BUILD_PLAN.md](PLATFORM_BUILD_PLAN.md).*
