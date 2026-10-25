# Market-capture plan: Cirq + Sirraya reference

**Document ID:** QW-PLAN-MARKET-003  
**Status:** product strategy & build backlog  
**Date:** 19 October 2026  
**Builds on:** [SIRRAYA_REFERENCE_AND_ROADMAP.md](SIRRAYA_REFERENCE_AND_ROADMAP.md), [CIRQ_ENGINE_AND_GAMIFICATION_PLAN.md](CIRQ_ENGINE_AND_GAMIFICATION_PLAN.md)  
**Promise to protect:** “See inside a quantum algorithm.”

---

## 1. Market thesis

Sirraya’s public tools ([tools.sirraya.org](https://tools.sirraya.org/)) position a **research stack**: Quantum Academy (virtual lab, gate composer, characterization, multi-architecture hardware lab, glossary) and Quantum Explorer (TSP mapping, oracle, Grover, transpile, classical benchmark, noise). Their engineering story includes QuTub and a compiler-to-hardware narrative.

QuantumWalk already owns a different job: a **private, guided lab** where every panel shows the **same simulator step** (circuit, probabilities, state vector, 3D Bloch), with Google sign-in, lessons, challenges, and a discovery path (`/start`).

**Do not clone Sirraya.** Capture the market by being the place people go when they want to **watch an algorithm change**, then **prove they understood it**, in a product that feels premium and personal.

**One-line positioning:**

> QuantumWalk is the private quantum lab where you walk inside an algorithm — step by step, in Qiskit and Cirq — and earn mastery as the state actually changes.

---

## 2. Where Sirraya leads vs where QuantumWalk can win

| Dimension | Sirraya (public) | QuantumWalk today | Market move |
| --- | --- | --- | --- |
| First session | Tool hub + course | Landing + `/start` discovery | Make the first 3 minutes a **visible state change**, then a saved private circuit |
| Depth story | Hardware, pulses, characterization, TSP explorer | Ideal simulator + honest `/hardware` placeholder | Add a **thin** hardware story and a **small** Explorer, not a compiler |
| SDK story | Own stack (QuTub / Rust) | Qiskit only + Qiskit export | **Live Qiskit ↔ Cirq** on one circuit — rare in education products |
| Motivation | Self-paced course, career path (planned) | 4 milestones, local ✦ on `/start` | **Mastery loop**: XP, skill path, challenge tiers, simulator-graded |
| Feel | Serious research tools | Dark navy, violet/cyan, global flow field | Keep the vibe; make motion **explain the step**, not decorate the page |
| Trust | In-browser, private workspace messaging | Private circuits, OAuth, bounded sim | Lead with privacy + “numbers come from the simulator” |

**Wedge (only QuantumWalk):** synchronized step playback + dual-engine proof + private progress that feels like a game without faking science.

---

## 3. Product shape that feels new

Three public surfaces, one engine underneath.

| Surface | Name in UI | Job | Sirraya analog (reference only) |
| --- | --- | --- | --- |
| **Inside** | Lab (`/workspace`) | Build, step, Bloch, probabilities, shots | Virtual Lab + Gate Composer |
| **Walk** | Path (`/start`, `/learn`, dashboard) | Level, missions, skill nodes, coach | Academy pathways |
| **Prove** | Explorer (`/explorer`) | Map a small problem, compare to classical, open the circuit in Lab | Quantum Explorer (TSP stages) |

**Signature feature (marketing headline):**

**Twin engines.** Same circuit JSON. Run on Qiskit (default) and Cirq (advanced). Show “engines agree” or a clear mismatch. Export both. Nobody in the education set does this as the core interaction.

---

## 4. What must be added (backlog)

### 4.1 Must ship — makes the site a product, not a demo

| ID | Add | Why it captures users | Source |
| --- | --- | --- | --- |
| M1 | **Cirq export** `POST /api/export/cirq` | Shareable “I built this in Cirq” moment; Colab handoff | Cirq plan C0 |
| M2 | **Engine toggle** on simulate (`qiskit` default, `cirq` opt-in) + parity tests | Differentiator vs Sirraya and vs IBM-only sandboxes | Cirq plan C1–C2 |
| M3 | **Tool hub** on `/start` (or `/`) : Lab · Path · Explorer · Compare | Sirraya hub clarity without their layout | Sirraya IA |
| M4 | **Lesson → preset circuit** deep link into Lab | Academy “theory then hands-on” loop | Sirraya Academy |
| M5 | **Glossary drawer** inside Lab (search, jump to Bloch / noise / measurement) | Stay in flow; cheat sheets without a separate textbook | Sirraya glossary |
| M6 | **XP, level, next mission** on dashboard; persist `/start` discoveries | Reason to return; Sirraya is weaker on game feel | Gamification plan |
| M7 | **Challenge tiers** (correct / fewer gates / match steps) graded by simulator | Skill, not a checkbox | Challenges already exist |
| M8 | **Step-synced motion** (gate glow, Bloch lerp, probability tween) | “See inside” becomes visible; reduced-motion fallback | Animation plan |
| M11 | **Plain-language narrator** on every step and reward | A newcomer sees what changed before any symbol | Section 6 |
| M9 | **Result identity** (circuit revision ↔ simulation result) | Trust: panels never mix old and new runs | Robustness |
| M10 | Landing line that states the wedge in one sentence + dual-engine proof chip | Market message matches the product | Positioning |

### 4.2 Should ship — closes the Sirraya gap without copying the stack

| ID | Add | Bound |
| --- | --- | --- |
| S1 | **Explorer MVP**: 3-city TSP or marked-item search in 5 stages (encode → mark → amplify → depth → classical chart) | ≤4 qubits; “Open in Lab” |
| S2 | **Circuit noise compare**: ideal vs pedagogical noise histogram on the same revision | Labeled pedagogical, not hardware |
| S3 | **Transpile preview**: depth + basis gates (Qiskit transpile, bounded) | Read-only panel |
| S4 | **Hardware story**: 3 architecture cards (superconducting, trapped ion, neutral atom) with typical gates and connectivity SVG | No fake live device |
| S5 | **Characterization toys**: T1/T2 style decay on one Bloch vector | Linked from glossary |
| S6 | **Skill tree** on dashboard (lesson → lab preset → challenge) | Reuse `activity_slug` |
| S7 | **Achievement unlock** motion + category filters | No public leaderboard in v1 |
| S8 | **Compare mode** in Lab: Qiskit result vs Cirq result side by side | Only when both runs succeed |

### 4.3 Later — only after the wedge is obvious

| ID | Add | Why wait |
| --- | --- | --- |
| L1 | QEC intro (bit-flip, syndrome) | Needs a finished noise vocabulary (S2) |
| L2 | Cirq density-matrix noise path | After engine toggle is trusted |
| L3 | Career-path copy (roles: software, hardware, research) | Content, not engine; Sirraya plans this |
| L4 | Reservoir computing module | Needs a subject-matter owner |
| L5 | Real hardware provider | Explicit confirmation, quotas, cost |
| L6 | Cirq circuit import | After export + dual-run are stable |
| L7 | Full compiler / QuTub-class stack | Out of scope; link out if ever needed |

### 4.4 Do not add

- A second product (documents, legal templates, unrelated tools).  
- User-supplied Python or shell.  
- Unbounded qubits, shots, or city counts.  
- Motion or XP that is not tied to a real simulator or progress event.  
- Claims of quantum advantage on toy TSP.

---

## 5. Cirq’s role in the market story

Cirq is not a backend swap. It is the **public proof** that QuantumWalk is framework-honest.

```text
User circuit (JSON)
    → validator (same bounds as today: ≤5 qubits, ≤64 ops, ≤4096 shots)
    → bridge
         → Qiskit Statevector + Aer shots   (default)
         → Cirq Simulator                    (opt-in)
    → one SimulationResponse the Lab already renders
Export: Qiskit Python  |  Cirq Python
```

**UI that sells it**

- Lab header: `Engine · Qiskit` with Advanced → `Also run Cirq`.  
- When both finish: badge **Engines agree** (or a short diff if they do not).  
- Export menu: Download Qiskit · Download Cirq.  
- Explorer and challenges call the same API so grades do not depend on which engine the learner picked (parity tests enforce this).

**Marketing line:** “Build once. See the state. Export to Qiskit or Cirq.”

---

## 6. Layman comprehension: gamification and animation

Checked against the live UI (`/start`, `DiscoveryVisual`, Lab step panel in `web/app/workspace/page.tsx`).

### 6.1 What already helps a newcomer

| Already in the product | Why it works |
| --- | --- |
| `/start` steps “01 / 05” with names (Your level → One more discovery) | People know where they are |
| Mission line in everyday words (“Make a qubit unpredictable, then measure it.”) | A goal before jargon |
| Prediction still awards exploration points when the guess is wrong | Safe to try |
| “KEEP THIS IDEA” takeaway + “New words?” glossary | One sentence to remember, definitions on demand |
| Concept explorer: before/after pictures and a caption (“Before H: 0 is certain”) | The picture and the sentence match |
| Lab: Play evolution, Previous/Next step, stale “run again” notice | The user controls time |

### 6.2 Where a layman still gets lost

| Surface | What they see today | What they need |
| --- | --- | --- |
| Lab step box | “Initial ground state \|0...0⟩” and gate formulas | One sentence: what was true, what you did, what is true now |
| Step buttons | “Ground”, “T1”, “T2” | “Start”, “After H”, “After measure” |
| Empty lab | “trace the time evolution of statevector amplitudes” | “Add H on the first qubit, then press Run. The bars will split.” |
| Points | “+10 exploration XP” | The point **names the idea**: “You predicted a measurement.” |
| Background motion | Site-wide flow field | Pretty, but it does not explain the circuit. Explanation motion belongs on the qubit, the bars, and the sphere |
| Dual engine (planned) | “Engines agree” | For newcomers: “Both libraries computed the same chances.” Hide the toggle under Advanced |

### 6.3 Rule: every animation has a sentence

No motion ships without a caption a non-physicist can read aloud. Three layers, always in this order:

1. **Notice** — one sentence, no symbols required.  
2. **Picture** — the moving bar, sphere, or coin-toss counts.  
3. **Precise** — optional disclosure: amplitudes, kets, Cirq/Qiskit names.

If reduced motion is on, layer 1 and the final picture still appear instantly. The sentence is the feature; the tween is optional.

### 6.4 Scripts a newcomer should recognize

| Moment | Animation | Sentence on screen |
| --- | --- | --- |
| Before any gate | Sphere at the top; one bar at 100% for 0 | “Right now this qubit will always read 0.” |
| Add H, press play | Bar eases from 100/0 to 50/50; sphere tilts to the side | “H made 0 and 1 equally likely. You have not read it yet.” |
| Measure / sample | One chip lands on 0 or 1; a tally grows | “One read gives one answer. Many reads fill in the chances.” |
| Second H (interference) | Bars return toward a single outcome | “A second H can cancel the mix and make 0 certain again.” |
| H then CNOT (Bell) | Two rows of bars; only 00 and 11 grow | “These two qubits now share a result. You will see 00 or 11, not 01 or 10.” |
| Entangled Bloch | Each sphere sits at the center while the pair bars stay peaked | “Looking at one qubit alone looks random. The pattern is in the pair.” |
| Stale circuit | Bars dim; caption replaces numbers | “You changed the circuit. Press Run to see the new chances.” |
| Challenge pass | Short pulse on the goal bar that matched | “Your circuit produced the chances this mission asked for.” |
| Wrong try | No shake-only feedback | “Not yet. Your top chance is 00. This mission needs 00 and 11 to match.” |
| Engines agree | Small check, not a second animation | “Qiskit and Cirq calculated the same chances.” |

Play evolution speaks these sentences in order as the step index moves. The user can pause. Autoplay starts only after Run, never on page load.

### 6.5 Gamification that teaches, not distracts

Points exist to mark **understanding**, using the same voice as `/start` (curiosity, not a game store).

| Reward | When it fires | Words the user sees |
| --- | --- | --- |
| First look | They press Run on the starter circuit | “You ran your first circuit.” |
| You noticed | They step to the H snapshot | “You watched 0 become a fair chance of 0 or 1.” |
| You predicted | They answer a `/start` question (already +10 even if wrong) | “Prediction made.” plus the explanation already on the page |
| You matched | Challenge probabilities match the goal | “Mission complete: shared pair.” |
| You compared | They open ideal vs samples | “Chances are exact. Counts are what this run happened to give.” |
| Come back | Next-day visit with a saved circuit | “Continue yesterday’s circuit.” Streak is a quiet chip, not a popup |

XP numbers stay on the dashboard. Inside the lab and `/start`, show the **sentence** and a small ✦. Do not pop “+50 XP” over the Bloch sphere while the state is changing.

Skill path for a layman (four nodes, plain titles):

1. Make it unpredictable  
2. Read it  
3. Share a result between two qubits  
4. Check your circuit against a mission  

Each node opens a preset and the matching narrator script. Advanced paths (phase, Grover, noise, Cirq) stay behind “Go further” after node 2.

### 6.6 Motion budget

| Allowed | Not allowed |
| --- | --- |
| Bar height and sphere position follow the selected simulator step | Extra particles when a gate is applied |
| One site-wide flow field, quieter in the lab | A second full-screen canvas inside the lab |
| 400ms badge pulse when a mission completes, after the sentence | Loot boxes, shaking the whole page, sound on by default |
| Dim stale results | Animation that shows a different probability than the API |

### 6.7 Comprehension check before calling R2 done

Five people who have never used a quantum tool should, after the starter mission with Play evolution:

- Say that H made both outcomes possible.  
- Say that one measurement is a single 0 or 1.  
- Point at the bars when asked “where are the chances?”  
- Recover after editing the circuit (they press Run because the caption says the picture is old).

If they only remember the points and not the change, the reward copy is too loud and the narrator is too weak.

---

## 7. Release sequence (market order)

Ship in this order so each release has a sentence you can post.

| Release | Name | Includes | Public sentence |
| --- | --- | --- | --- |
| **R1** | Twin engines | M1, M2, M9, M10, export UI | “The same circuit, two industry libraries, one state.” |
| **R2** | Your path | M3, M4, M5, M6, M7, M8, M11 | “A private path from first qubit to a verified circuit.” |
| **R3** | See the limit | S1, S2, S3, S8 | “Watch a search, then watch noise — and open it in the lab.” |
| **R4** | Machines, honestly | S4, S5, S6, S7 | “What real architectures look like, without pretending you are on the device.” |

R1 is the capture hook (new vs IBM composers and vs Sirraya). R2 is retention. R3 is the Explorer comparison. R4 is credibility next to Sirraya’s Hardware Lab, at a fraction of the scope.

---

## 8. Success signals (90 days after R2)

| Signal | Target |
| --- | --- |
| Landing → first successful simulate | Median under 3 minutes for signed-in users |
| Shareable export | Cirq or Qiskit export used at least once by 15% of users who run 3+ simulations |
| Return | 25% of activated accounts back within 7 days |
| Dual engine | Cirq opt-in runs with agreement rate ≥ 99% on the supported gate set |
| Trust | Zero UI copy that implies a live quantum device |
| Layman check | 4 of 5 first-time users can say what H changed after Play evolution (section 6.7) |

---

## 9. Build map (when implementation starts)

| Work | Where |
| --- | --- |
| Bridge, Cirq simulate, parity tests | `api/circuit_bridge.py`, `api/simulator.py`, `api/tests/` |
| Cirq export | `api/platform_routes.py` next to existing Qiskit export |
| Engine toggle + agree badge | `web/app/workspace/page.tsx` |
| Hub, glossary drawer, lesson presets | `/start`, `/learn`, workspace query `preset=` |
| XP / tiers / dashboard | progress API, `web/app/dashboard`, `web/lib/milestones.ts` |
| Explorer | new route under `web/app/explorer/` calling the same simulate API |
| Motion + narrator | Lab step box and `DiscoveryVisual` captions; `prefers-reduced-motion` keeps the sentence |

Keep the canonical circuit JSON. Do not add a second editor format.

---

## 10. Decisions to lock before build

1. **R1 scope:** export + Cirq engine in one release (recommended) or export only.  
2. **Explorer problem:** 3-city tour **or** a clearer Grover “find the marked item” lab (Grover is faster to ship and already partly in the product).  
3. **XP visibility:** show numbers on the dashboard only, keep `/start` in plain language (“4 discoveries”).  
4. **Leaderboards:** off for v1.

---

## 11. Document index

| ID | Document | Role |
| --- | --- | --- |
| QW-REF-SIRRAYA-001 | [SIRRAYA_REFERENCE_AND_ROADMAP.md](SIRRAYA_REFERENCE_AND_ROADMAP.md) | Competitive inventory and phased feature gaps |
| QW-PLAN-CIRQ-ENG-002 | [CIRQ_ENGINE_AND_GAMIFICATION_PLAN.md](CIRQ_ENGINE_AND_GAMIFICATION_PLAN.md) | Engine architecture, XP model, animation rules |
| QW-PLAN-MARKET-003 | This file | What to add, in what order, to be new in the market |
| QW-BACKLOG-004 | [IMPLEMENTATION_BACKLOG.md](IMPLEMENTATION_BACKLOG.md) | Ticket-level PR slices (R1–R4) |
| — | [PLATFORM_BUILD_PLAN.md](PLATFORM_BUILD_PLAN.md) | Security, privacy, and release boundaries that still apply |

---

*This plan treats Sirraya as a reference for academy depth and explorer structure, and Cirq as QuantumWalk’s public differentiator. Update section 10 when the four decisions are locked.*
