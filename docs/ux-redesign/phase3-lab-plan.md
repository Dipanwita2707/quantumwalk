# Phase 3 — Circuit lab workflow (implemented)

**Depends on:** Phase 1 navigation (`dad8251`)

## Changes

- **Build / Simulate / Analyze** tabs (`role="tablist"`) on circuit mode; default **Build**.
- **Sticky run bar** with primary Run action (guest hint: “Demo lab mode · ≤5 qubits”).
- **Progressive disclosure:** engine, noise, and `LabEnginePanel` inside `<details>` on Simulate hero.
- **CSS view switching** via `lab-workflow-view-*` on `#lab` — no simulation logic changes.

## Preserved

- Whiteboard mode, presets, save/export, coach, missions, toolbox, entanglement lab, all `run()` paths.

## Tests

- `e2e/lab-workflow.spec.ts` + existing `smoke` lab preset test.
