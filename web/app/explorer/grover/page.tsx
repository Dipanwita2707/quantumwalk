"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import { CIRCUIT_PRESETS } from "@/lib/circuitPresets";
import { CircuitViewer } from "@/components/CircuitViewer";
import { ExplorerHubNav } from "@/components/ExplorerHubNav";
import { ExplorerRunbookPanel, ExplorerRunbookTabs } from "@/components/ExplorerRunbookTabs";
import type { ExplorerRunbookPhase } from "@/lib/explorerRunbook";
import "../explorer.css";

const stages = [
  { title: "Encode", body: "Four possible answers become four quantum states in superposition." },
  { title: "Mark", body: "An oracle adds a minus sign to the one state we want to find (here |11⟩)." },
  { title: "Amplify", body: "Grover steps boost the marked state’s chance before you measure." },
  { title: "Depth check", body: "Each step adds gates. Fewer steps help on real hardware with noise." },
  { title: "Compare", body: "Ideal probabilities jump toward the marked outcome; counts from shots wobble around them." },
];

export default function GroverExplorerPage() {
  const [runbook, setRunbook] = useState<ExplorerRunbookPhase>("configure");
  const [stage, setStage] = useState(0);
  const ideal = useMemo(
    () => [
      { label: "00", p: 0.25 },
      { label: "01", p: 0.25 },
      { label: "10", p: 0.25 },
      { label: "11", p: 0.25 },
    ],
    [],
  );
  const after = useMemo(
    () => [
      { label: "00", p: 0 },
      { label: "01", p: 0 },
      { label: "10", p: 0 },
      { label: "11", p: 1 },
    ],
    [],
  );
  const bars = stage >= 4 ? after : ideal;

  useEffect(() => {
    if (runbook === "configure" && stage > 1) setStage(1);
    if (runbook === "run" && (stage < 2 || stage > 3)) setStage(2);
    if (runbook === "results" && stage !== 4) setStage(4);
  }, [runbook, stage]);

  function selectRunbook(phase: ExplorerRunbookPhase) {
    setRunbook(phase);
    if (phase === "configure") setStage(0);
    if (phase === "run") setStage(2);
    if (phase === "results") setStage(4);
  }

  return (
    <>
      <SiteHeader />
      <main className="content-shell explorer-hub-layout">
        <ExplorerHubNav />
        <div className="explorer-hub-main explorer-shell">
          <p className="eyebrow">QUANTUM EXPLORER</p>
          <h1>Find the marked state</h1>
          <GuestExperienceBanner context="explorer" />
          <p className="content-intro">
            A layman walk through search on four possibilities — then open the same circuit in your lab.
          </p>
          <ExplorerRunbookTabs value={runbook} onChange={selectRunbook} />

          <ExplorerRunbookPanel phase="configure" activePhase={runbook} title="Configure">
            <p>Set up four labels and which state the oracle marks (teaching preset uses |11⟩).</p>
            <div className="explorer-steps" aria-label="Setup stages">
              {stages.slice(0, 2).map((item, index) => (
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
            <h2>{stages[stage].title}</h2>
            <p>{stages[stage].body}</p>
          </ExplorerRunbookPanel>

          <ExplorerRunbookPanel phase="run" activePhase={runbook} title="Run">
            <p>Walk amplification and gate depth, then step through the Grover preset in the embedded simulator.</p>
            <div className="explorer-steps" aria-label="Run stages">
              {stages.slice(2, 4).map((item, index) => {
                const stageIndex = index + 2;
                return (
                  <button
                    key={item.title}
                    type="button"
                    className={stageIndex === stage ? "active" : stageIndex < stage ? "done" : ""}
                    aria-current={stageIndex === stage ? "step" : undefined}
                    onClick={() => setStage(stageIndex)}
                  >
                    {stageIndex + 1}. {item.title}
                  </button>
                );
              })}
            </div>
            <h2>{stages[stage].title}</h2>
            <p>{stages[stage].body}</p>
            <section className="content-card" aria-labelledby="explorer-live-title">
              <span className="panel-kicker">SIMULATOR-GROUNDED</span>
              <h2 id="explorer-live-title">Run the teaching circuit</h2>
              <p>
                Sign in to execute the same Grover preset the Lab uses. Probabilities come from the backend simulator,
                not this page’s static chart.
              </p>
              <CircuitViewer
                initialQubits={CIRCUIT_PRESETS.grover2.qubits}
                initialOperations={CIRCUIT_PRESETS.grover2.operations}
                demoPreset="grover2"
                readonly
                title="Grover search (2 qubits)"
                subtitle="Step through gates, then compare shot counts in Results."
                fullLabHref="/workspace?preset=grover2"
              />
            </section>
          </ExplorerRunbookPanel>

          <ExplorerRunbookPanel phase="results" activePhase={runbook} title="Results">
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
            <p className="explorer-note">
              Classical brute force on 4 labels: 25% per random guess. After amplification, ideal simulator targets
              ~100% on |11⟩.
            </p>
          </ExplorerRunbookPanel>

          <ExplorerRunbookPanel phase="explanation" activePhase={runbook} title="Explanation">
            <ol>
              {stages.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}.</strong> {item.body}
                </li>
              ))}
            </ol>
            <p className="explorer-note">
              Preset uses {CIRCUIT_PRESETS.grover2.operations.length} gates on {CIRCUIT_PRESETS.grover2.qubits} qubits.
              This is an education simulator — not a claim about quantum advantage on hardware.
            </p>
          </ExplorerRunbookPanel>

          <div className="explorer-nav">
            <Link className="card-action" href="/workspace?preset=grover2">
              Open in Lab →
            </Link>
            <Link className="card-action" href="/explorer/tsp">
              TSP explorer →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
