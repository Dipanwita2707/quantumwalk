"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { CIRCUIT_PRESETS } from "@/lib/circuitPresets";
import "../explorer.css";

const stages = [
  { title: "Encode", body: "Four possible answers become four quantum states in superposition." },
  { title: "Mark", body: "An oracle adds a minus sign to the one state we want to find (here |11⟩)." },
  { title: "Amplify", body: "Grover steps boost the marked state’s chance before you measure." },
  { title: "Depth check", body: "Each step adds gates. Fewer steps help on real hardware with noise." },
  { title: "Compare", body: "Ideal probabilities jump toward the marked outcome; counts from shots wobble around them." },
];

export default function GroverExplorerPage() {
  const [stage, setStage] = useState(0);
  const ideal = useMemo(
    () => [
      { label: "00", p: 0.25 },
      { label: "01", p: 0.25 },
      { label: "10", p: 0.25 },
      { label: "11", p: 0.25 },
    ],
    []
  );
  const after = useMemo(
    () => [
      { label: "00", p: 0 },
      { label: "01", p: 0 },
      { label: "10", p: 0 },
      { label: "11", p: 1 },
    ],
    []
  );
  const bars = stage >= 4 ? after : ideal;

  return (
    <>
      <SiteHeader />
      <main className="content-shell explorer-shell">
        <p className="eyebrow">QUANTUM EXPLORER</p>
        <h1>Find the marked state</h1>
        <p className="content-intro">A layman walk through search on four possibilities — then open the same circuit in your lab.</p>
        <div className="explorer-steps" aria-label="Explorer stages">
          {stages.map((item, index) => (
            <button
              key={item.title}
              type="button"
              className={index === stage ? "active" : index < stage ? "done" : ""}
              aria-current={index === stage ? "step" : undefined}
              onClick={() => setStage(index)}
            >
              {index + 1}. {item.title}
            </button>
          ))}
        </div>
        <article className="content-card">
          <h2>{stages[stage].title}</h2>
          <p>{stages[stage].body}</p>
          <div className="explorer-chart" aria-label="Probability comparison">
            {bars.map((bar) => (
              <div key={bar.label} className="explorer-bar-row">
                <span>{bar.label}</span>
                <div className="explorer-bar-track">
                  <div className="explorer-bar-fill" style={{ width: `${bar.p * 100}%` }} />
                </div>
                <span>{(bar.p * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
          <p className="explorer-note">{stage >= 4 ? "Ideal simulator target for this teaching circuit." : "Before amplification — equal chances."}</p>
        </article>
        <div className="explorer-nav">
          <button type="button" disabled={stage === 0} onClick={() => setStage((s) => s - 1)}>
            ← Back
          </button>
          <button type="button" disabled={stage === stages.length - 1} onClick={() => setStage((s) => s + 1)}>
            Next →
          </button>
          <Link className="card-action" href="/workspace?preset=grover2">
            Open in Lab →
          </Link>
        </div>
        <p className="content-intro">
          Preset uses {CIRCUIT_PRESETS.grover2.operations.length} gates on {CIRCUIT_PRESETS.grover2.qubits} qubits.
        </p>
      </main>
    </>
  );
}
