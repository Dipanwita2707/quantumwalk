"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import { QuantumMapperLab } from "@/components/QuantumMapperLab";
import { ExplorerHubNav } from "@/components/ExplorerHubNav";
import { ExplorerRunbookPanel, ExplorerRunbookTabs } from "@/components/ExplorerRunbookTabs";
import type { ExplorerRunbookPhase } from "@/lib/explorerRunbook";
import "../explorer.css";

export default function QuantumMapperPage() {
  const [runbook, setRunbook] = useState<ExplorerRunbookPhase>("configure");
  const showLab = runbook !== "explanation";

  return (
    <>
      <SiteHeader />
      <main className="content-shell explorer-hub-layout">
        <ExplorerHubNav />
        <div className="explorer-hub-main explorer-shell explorer-mapper">
        <p className="eyebrow">QUANTUM MAPPER</p>
        <h1>Classical ↔ quantum encoding</h1>
        <GuestExperienceBanner context="explorer" />
        <p className="content-intro">
          Interactive mappings observed in Sirraya’s “Quantum-Classical Mapping” sections (route labels, registers, Grover
          query model). Adjust inputs and read the computed bitstrings — then open the lab or Explorer for full circuits.
        </p>
        <ExplorerRunbookTabs value={runbook} onChange={setRunbook} />

        <ExplorerRunbookPanel phase="configure" activePhase={runbook} title="Configure">
          <p>Pick an encoding example and set city count, route index, or register width.</p>
        </ExplorerRunbookPanel>
        <ExplorerRunbookPanel phase="run" activePhase={runbook} title="Run">
          <p className="explorer-note">
            Mappings recompute instantly in the browser as you edit — no backend job queue. Use Configure inputs below.
          </p>
        </ExplorerRunbookPanel>
        <ExplorerRunbookPanel phase="results" activePhase={runbook} title="Results">
          <p>Bitstrings and Grover success percentages appear in the panels below as you edit.</p>
        </ExplorerRunbookPanel>
        <ExplorerRunbookPanel phase="explanation" activePhase={runbook} title="Explanation">
          <p className="explorer-note" role="note">
            Sirraya gate-level mapper UI beyond these encodings was not fully traced in capture — workflows marked UNKNOWN
            in the parity matrix remain out of scope here.
          </p>
          <p className="explorer-note">
            <strong>Assumptions:</strong> directed TSP costs are separate from label maps; encoding is index → bitstring,
            not a claim of quantum speedup.
          </p>
        </ExplorerRunbookPanel>

        {showLab && <QuantumMapperLab />}
        <div className="explorer-nav">
          <Link className="card-action" href="/explorer/tsp">
            TSP Explorer →
          </Link>
          <Link className="card-action" href="/workspace?mode=circuit">
            Open lab →
          </Link>
          <Link className="card-action" href="/explorer">
            Explorer overview →
          </Link>
        </div>
        </div>
      </main>
    </>
  );
}
