"use client";

import type { ReactNode } from "react";
import { EXPLORER_RUNBOOK_PHASES, type ExplorerRunbookPhase } from "@/lib/explorerRunbook";

export function ExplorerRunbookTabs({
  value,
  onChange,
  label = "Explorer workflow",
}: {
  value: ExplorerRunbookPhase;
  onChange: (phase: ExplorerRunbookPhase) => void;
  label?: string;
}) {
  return (
    <div className="explorer-runbook-tabs" role="tablist" aria-label={label}>
      {EXPLORER_RUNBOOK_PHASES.map((phase) => (
        <button
          key={phase.id}
          type="button"
          role="tab"
          id={`runbook-tab-${phase.id}`}
          aria-selected={value === phase.id}
          aria-controls={`runbook-panel-${phase.id}`}
          className={value === phase.id ? "active" : ""}
          title={phase.hint}
          onClick={() => onChange(phase.id)}
        >
          {phase.label}
        </button>
      ))}
    </div>
  );
}

export function ExplorerRunbookPanel({
  phase,
  activePhase,
  title,
  children,
}: {
  phase: ExplorerRunbookPhase;
  activePhase: ExplorerRunbookPhase;
  title: string;
  children: ReactNode;
}) {
  if (activePhase !== phase) return null;
  return (
    <section
      className="explorer-runbook-panel content-card"
      role="tabpanel"
      id={`runbook-panel-${phase}`}
      aria-labelledby={`runbook-tab-${phase}`}
      aria-label={title}
    >
      <span className="panel-kicker">{title.toUpperCase()}</span>
      {children}
    </section>
  );
}
