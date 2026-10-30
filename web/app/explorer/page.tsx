"use client";

import { SiteHeader } from "@/components/SiteHeader";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import { ExplorerHubCatalog } from "@/components/ExplorerHubCatalog";
import "./explorer.css";

export default function ExplorerHubPage() {
  return (
    <>
      <SiteHeader />
      <main className="content-shell explorer-hub-layout explorer-overview">
        <div className="explorer-hub-main explorer-shell">
          <p className="eyebrow">QUANTUM EXPLORER</p>
          <h1>Explore a problem. See the quantum steps.</h1>
          <p className="content-intro explorer-hub-lede">
            Encode a problem, inspect its quantum model, and compare the outcomes. Small educational experiments,
            powered by classical simulation.
          </p>
          <ExplorerHubCatalog />
          <p><a className="card-action" href="/lab">Explore physics, atoms & cosmology experiments →</a></p>
          <GuestExperienceBanner context="explorer" />
        </div>
      </main>
    </>
  );
}
