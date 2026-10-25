"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { api } from "@/lib/api";
import "./algorithms.css";

type Algorithm = {
  slug: string;
  title: string;
  level: string;
  summary: string;
  qubits: number;
};

type AlgoMeta = {
  formula: string;
  category: "all" | "superposition" | "entanglement" | "oracles";
  gates: string[];
  probs: { label: string; pct: number; color: string }[];
};

const ALGO_METAS: Record<string, AlgoMeta> = {
  superposition: {
    formula: "(|0⟩ + |1⟩) / √2",
    category: "superposition",
    gates: ["H"],
    probs: [
      { label: "|0⟩ 50%", pct: 50, color: "#57e6ea" },
      { label: "|1⟩ 50%", pct: 50, color: "#a279ff" },
    ],
  },
  "bell-pair": {
    formula: "(|00⟩ + |11⟩) / √2",
    category: "entanglement",
    gates: ["H", "●", "CX"],
    probs: [
      { label: "|00⟩ 50%", pct: 50, color: "#57e6ea" },
      { label: "|11⟩ 50%", pct: 50, color: "#a279ff" },
    ],
  },
  "ghz-three": {
    formula: "(|000⟩ + |111⟩) / √2",
    category: "entanglement",
    gates: ["H", "CX₁", "CX₂"],
    probs: [
      { label: "|000⟩ 50%", pct: 50, color: "#57e6ea" },
      { label: "|111⟩ 50%", pct: 50, color: "#a279ff" },
    ],
  },
  "deutsch-jozsa-balanced": {
    formula: "|1⟩ (Interference Readout)",
    category: "oracles",
    gates: ["X", "H", "CX", "H"],
    probs: [{ label: "|1⟩ 100%", pct: 100, color: "#38bdf8" }],
  },
  "grover-two": {
    formula: "|11⟩ (Amplitude Amplified)",
    category: "oracles",
    gates: ["H", "Oracle", "Diffuser"],
    probs: [{ label: "|11⟩ 100%", pct: 100, color: "#22c55e" }],
  },
};

export default function AlgorithmsPage() {
  const [items, setItems] = useState<Algorithm[] | null>(null);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "superposition" | "entanglement" | "oracles">("all");

  async function load() {
    try {
      setItems(await api<Algorithm[]>("/api/algorithms"));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load examples.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filteredItems = items?.filter((item) => {
    if (activeCategory === "all") return true;
    const meta = ALGO_METAS[item.slug];
    return meta?.category === activeCategory;
  });

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="algo-shell">
        {/* Executive Header Banner */}
        <section className="algo-header">
          <div className="algo-eyebrow">
            <span className="algo-beacon" />
            EXPLORE QUANTUM IDEAS
          </div>
          <h1>
            Algorithm <span>Library</span>
          </h1>
          <p>
            Open an example, run its circuit, and see how the quantum state changes step by step.
          </p>
        </section>

        {/* Category Filters */}
        <div className="algo-filter-bar">
          <button
            type="button"
            className={`algo-filter-btn ${activeCategory === "all" ? "active" : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            All Algorithms ({items?.length || 0})
          </button>
          <button
            type="button"
            className={`algo-filter-btn ${activeCategory === "superposition" ? "active" : ""}`}
            onClick={() => setActiveCategory("superposition")}
          >
            Superposition & Interference
          </button>
          <button
            type="button"
            className={`algo-filter-btn ${activeCategory === "entanglement" ? "active" : ""}`}
            onClick={() => setActiveCategory("entanglement")}
          >
            Entanglement (Bell & GHZ)
          </button>
          <button
            type="button"
            className={`algo-filter-btn ${activeCategory === "oracles" ? "active" : ""}`}
            onClick={() => setActiveCategory("oracles")}
          >
            Quantum Oracles & Search
          </button>
        </div>

        {error && (
          <div className="content-error" role="alert" style={{ marginBottom: "20px" }}>
            {error} <button onClick={() => void load()}>Retry</button>
          </div>
        )}

        {!items && !error && <p role="status" style={{ color: "var(--muted)" }}>Loading quantum library…</p>}

        {/* Algorithm Cards Grid */}
        {filteredItems && (
          <div className="algo-grid">
            {filteredItems.map((item) => {
              const meta = ALGO_METAS[item.slug] || {
                formula: "|ψ⟩ statevector",
                category: "all",
                gates: ["H"],
                probs: [{ label: "|0⟩ 100%", pct: 100, color: "#57e6ea" }],
              };

              const levelClass =
                item.level.toLowerCase() === "beginner"
                  ? "level-beginner"
                  : item.level.toLowerCase() === "intermediate"
                  ? "level-intermediate"
                  : "level-advanced";

              return (
                <article className="algo-card" key={item.slug}>
                  <div>
                    {/* Top Meta */}
                    <div className="algo-meta-row">
                      <span className={`algo-level-badge ${levelClass}`}>{item.level}</span>
                      <span className="algo-qubit-tag">
                        {item.qubits} {item.qubits === 1 ? "Qubit" : "Qubits"}
                      </span>
                    </div>

                    <h2>{item.title}</h2>
                    <p>{item.summary}</p>

                    {/* Target State Math Formula */}
                    <div className="algo-formula-box">
                      <span className="algo-formula-label">Target State</span>
                      <span className="algo-formula-math">{meta.formula}</span>
                    </div>

                    {/* Circuit Gate Footprint */}
                    <div className="algo-schematic">
                      <span className="algo-schematic-label">Footprint:</span>
                      <div className="algo-gates-seq">
                        {meta.gates.map((g, gIdx) => (
                          <React.Fragment key={gIdx}>
                            {g === "●" ? (
                              <span className="algo-mini-ctrl">●</span>
                            ) : (
                              <span className="algo-mini-gate">{g}</span>
                            )}
                            {gIdx < meta.gates.length - 1 && <span className="algo-mini-arrow">→</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* Probability Distribution Sparkline */}
                    <div className="algo-prob-preview">
                      <div className="algo-prob-bars">
                        {meta.probs.map((p, pIdx) => (
                          <div
                            key={pIdx}
                            className="algo-bar-segment"
                            style={{ width: `${p.pct}%`, background: p.color }}
                          />
                        ))}
                      </div>
                      <div className="algo-prob-labels">
                        {meta.probs.map((p, pIdx) => (
                          <span key={pIdx}>{p.label}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <Link className="algo-action-btn" href={`/algorithms/${encodeURIComponent(item.slug)}`}>
                    Explore Quantum Algorithm ↗
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
