"use client";

import { SiteHeader } from "@/components/SiteHeader";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import { ExplorerHubNav } from "@/components/ExplorerHubNav";
import { ExplorerHubCatalog } from "@/components/ExplorerHubCatalog";
import "./explorer.css";

export default function ExplorerHubPage() {
  return (
    <>
      <SiteHeader />
      <main className="content-shell explorer-hub-layout">
        <ExplorerHubNav />
        <div className="explorer-hub-main explorer-shell">
          <p className="eyebrow">QUANTUM EXPLORER</p>
          <h1>Problem → circuit → compare</h1>
          <GuestExperienceBanner context="explorer" />
          <p className="content-intro">
            Bounded demos (≤4 qubits). Presets use the public demo simulator; sign in for the full lab.
          </p>
          <ExplorerHubCatalog />
        </div>
      </main>
    </>
  );
}
