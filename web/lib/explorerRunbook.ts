/** Configure → Run → Results → Explanation (Phase 5 explorer standard). */

export type ExplorerRunbookPhase = "configure" | "run" | "results" | "explanation";

export const EXPLORER_RUNBOOK_PHASES: { id: ExplorerRunbookPhase; label: string; hint: string }[] = [
  { id: "configure", label: "Configure", hint: "Problem size, matrix, or encoding inputs" },
  { id: "run", label: "Run", hint: "Execute preset or backend sampling" },
  { id: "results", label: "Results", hint: "Charts, counts, and measured outcomes" },
  { id: "explanation", label: "Explanation", hint: "What the numbers mean — no hardware claims" },
];
