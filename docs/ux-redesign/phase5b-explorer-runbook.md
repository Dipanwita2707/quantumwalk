# Phase 5b — Explorer CRRE runbook

**Depends on:** Phase 5 hub sidebars (`1274ed7`)

## Change

Standard **Configure · Run · Results · Explanation** tabs on Grover, TSP, and Mapper explorers via `ExplorerRunbookTabs` / `ExplorerRunbookPanel`.

- **Grover:** panels split setup, simulator run, probability results, and stage narrative.
- **TSP:** Configure = matrix; Run = stages + backend solve; Results = compare charts; Explanation = stage list.
- **Mapper:** Configure/Run/Results share `QuantumMapperLab`; Explanation hides the lab.

## Tests

`web/e2e/explorer-runbook.spec.ts`
