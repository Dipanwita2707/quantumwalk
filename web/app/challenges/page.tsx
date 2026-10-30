"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import { api } from "@/lib/api";
import { CHALLENGE_TIER_GUIDE } from "@/lib/challengeTiers";
import { PageHeading, ScienceIcon } from "@/components/ui/QuantumUI";
import { LeaderboardPanel } from "@/components/ui/LeaderboardPanel";
import "./challenges.css";

type Challenge = {
  slug: string;
  title: string;
  level: string;
  summary: string;
  qubits: number;
};

const CHALLENGE_TARGETS: Record<string, string> = {
  "make-superposition": "Ideal outcomes: 50% |0⟩, 50% |1⟩",
  "make-bell-pair": "Ideal outcomes: 50% |00⟩, 50% |11⟩",
};

export default function ChallengesPage() {
  const [items, setItems] = useState<Challenge[] | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      setItems(await api<Challenge[]>("/api/challenges"));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load challenges.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="chal-shell">
        {/* Header */}
        <GuestExperienceBanner context="challenge" />
        <PageHeading title="Quantum challenges" description="Build a circuit, reach the target state, and verify your reasoning in the simulator." />

        <div className="q-ui-challenge-layout"><div>

        {error && (
          <div className="content-error" role="alert" style={{ marginBottom: "20px" }}>
            {error} <button onClick={() => void load()}>Retry</button>
          </div>
        )}

        {!items && !error && <p role="status" style={{ color: "var(--muted)" }}>Loading arena challenges…</p>}
        {items?.length === 0 && <section className="q-ui-panel"><h2>No challenges available</h2><p>Challenge activities will appear here when available. You can still build and run a circuit in the Lab.</p><Link className="card-action" href="/workspace?mode=circuit">Open the circuit builder</Link></section>}

        {items && (
          <div className="chal-grid">
            {items.map((item) => {
              const target = CHALLENGE_TARGETS[item.slug] || "Synthesize target probability";
              const tiers = CHALLENGE_TIER_GUIDE[item.slug];
              return (
                <article className="chal-card" key={item.slug}>
                  <span className="q-ui-challenge-icon" aria-hidden="true"><ScienceIcon name="atom" size={30} /></span>
                  <div>
                    <div className="chal-meta-row">
                      <span className="chal-level-badge">{item.level}</span>
                      <span className="chal-reward-badge">Up to +100 XP</span>
                    </div>

                    <h2>{item.title}</h2>
                    <p>{item.summary}</p>

                    <details className="q-ui-challenge-criteria"><summary>Target &amp; grading criteria</summary><div className="chal-target-box">
                      <span className="chal-target-label">Ideal target outcomes</span>
                      <span className="chal-target-val">{target}</span>
                    </div>
                    {tiers && (
                      <ul className="chal-tier-list" aria-label="Simulator-graded tiers">
                        <li><strong>Bronze</strong> — {tiers.bronze}</li>
                        <li><strong>Silver</strong> — {tiers.silver}</li>
                        <li><strong>Gold</strong> — {tiers.gold}</li>
                      </ul>
                    )}
                    </details>
                  </div>

                  <Link className="chal-action-btn" href={`/challenges/${encodeURIComponent(item.slug)}`}>
                    Try challenge →
                  </Link>
                </article>
              );
            })}
          </div>
        )}
        </div><aside><LeaderboardPanel compact /></aside></div>
      </main>
    </div>
  );
}
