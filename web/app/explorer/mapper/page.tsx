"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import { QuantumMapperLab } from "@/components/QuantumMapperLab";
import { ExplorerHubNav } from "@/components/ExplorerHubNav";
import "../explorer.css";

export default function QuantumMapperPage() {
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
        <p className="explorer-note" role="note">
          Sirraya gate-level mapper UI beyond these encodings was not fully traced in capture — workflows marked UNKNOWN
          in the parity matrix remain out of scope here.
        </p>
        <QuantumMapperLab />
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
