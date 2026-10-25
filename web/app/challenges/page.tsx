"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { api } from "@/lib/api";
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
        <section className="chal-header">
          <div className="chal-eyebrow">
            <span className="chal-beacon" />
            QUANTUM COMPUTING ARENA
          </div>
          <h1>
            Circuit <span>Challenge Mode</span>
          </h1>
          <p>
            Synthesize quantum target states using ideal unitary gates. Observe live statevector probability evolution
            and verify your solution directly on the challenge page to earn learning XP.
          </p>
        </section>

        {error && (
          <div className="content-error" role="alert" style={{ marginBottom: "20px" }}>
            {error} <button onClick={() => void load()}>Retry</button>
          </div>
        )}

        {!items && !error && <p role="status" style={{ color: "var(--muted)" }}>Loading arena challenges…</p>}

        {items && (
          <div className="chal-grid">
            {items.map((item) => {
              const target = CHALLENGE_TARGETS[item.slug] || "Synthesize target probability";
              return (
                <article className="chal-card" key={item.slug}>
                  <div>
                    <div className="chal-meta-row">
                      <span className="chal-level-badge">{item.level}</span>
                      <span className="chal-reward-badge">+100 XP</span>
                    </div>

                    <h2>{item.title}</h2>
                    <p>{item.summary}</p>

                    <div className="chal-target-box">
                      <span className="chal-target-label">Ideal target outcomes</span>
                      <span className="chal-target-val">{target}</span>
                    </div>
                  </div>

                  <Link className="chal-action-btn" href={`/challenges/${encodeURIComponent(item.slug)}`}>
                    Try challenge →
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
