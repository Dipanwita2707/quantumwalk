"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import { ExplorerHubNav } from "@/components/ExplorerHubNav";
import { EXPLORER_DEMOS, EXPLORER_WORKFLOW } from "@/lib/explorerDemos";
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
          <div className="explorer-workflow-strip" aria-label="Typical explorer flow">
            {EXPLORER_WORKFLOW.map((step) => (
              <span key={step}>{step}</span>
            ))}
          </div>
          <p className="explorer-note">
            Start with <Link href="/explorer/tsp">Three-city routes</Link> for the full classical vs quantum story, or pick
            any demo in the sidebar.
          </p>
          <div className="content-cards explorer-hub-cards" aria-label="Explorer demos">
            {EXPLORER_DEMOS.map((item) => (
              <article key={item.href} className="content-card">
                <h2>{item.title}</h2>
                <p>{item.body}</p>
                <Link className="card-action" href={item.href}>
                  Open explorer →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
