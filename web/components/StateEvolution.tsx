"use client";

import type { Operation } from "@/lib/circuitPresets";
import { useState } from "react";
import { explainStateStep, phaseReference, relativePhases, type StateSnapshot } from "@/lib/stateExplanation";
import "./state-evolution.css";

type GuideProps = {
  snapshots: StateSnapshot[];
  operations: Operation[];
  step: number;
  onStep: (step: number) => void;
  playing: boolean;
  onPlay: () => void;
  disabled?: boolean;
  delay: number;
  onDelay: (delay: number) => void;
  initialStateDescription?: string;
};

export function StateEvolutionGuide({ snapshots, operations, step, onStep, playing, onPlay, disabled, delay, onDelay, initialStateDescription }: GuideProps) {
  const last = snapshots.length - 1;
  const explanation = explainStateStep(step, operations, snapshots);
  return <section className="qse-guide" aria-label="State evolution guide">
    <div className="qse-guide-head">
      <div><span className="qse-eyebrow">FOLLOW THE ALGORITHM</span><strong>{step === 0 ? "Initial state" : step === last ? "Final state" : "Gate in progress"} <small>· Step {step} of {last}</small></strong></div>
      <div className="qse-playback" role="group" aria-label="State playback">
        <button type="button" aria-label="Previous evolution step" disabled={disabled || step === 0} onClick={() => onStep(step - 1)}>←</button>
        <button type="button" aria-pressed={playing} disabled={disabled || last < 1} onClick={onPlay}>{playing ? "Pause" : step === last ? "Replay steps" : step === 0 ? "Start simulation" : "Resume steps"}</button>
        <button type="button" aria-label="Next evolution step" disabled={disabled || step === last} onClick={() => onStep(step + 1)}>→</button>
        <label>Speed<select aria-label="Evolution playback speed" value={delay} onChange={(event) => onDelay(Number(event.target.value))}><option value={2400}>Slow</option><option value={1400}>Normal</option><option value={700}>Fast</option></select></label>
      </div>
    </div>
    <input className="qse-scrubber" aria-label="Quantum evolution step" type="range" min={0} max={Math.max(0, last)} value={step} disabled={disabled || last < 1} onChange={(event) => onStep(Number(event.target.value))} aria-valuetext={`${explanation.title}, step ${step} of ${last}`} />
    <div className="qse-step-list" role="group" aria-label="Algorithm steps">
      {snapshots.map((snapshot, index) => <button type="button" key={snapshot.index} disabled={disabled || (index === 0 && step === 0 && !playing)} aria-current={step === index ? "step" : undefined} title={index === 0 ? "Return to the prepared state at step 0" : undefined} onClick={() => onStep(index)}><span>{index === 0 ? "Initial state" : `${index} · ${operations[index - 1]?.gate.toUpperCase() ?? "Gate"}`}</span>{index > 0 && <small>q{operations[index - 1]?.target}</small>}</button>)}
    </div>
    {step === 0 && !playing && !disabled && last > 0 && <p className="qse-note">Choose Start simulation to watch every gate, or select a gate step to inspect its result.</p>}
    <div className="qse-explanation" aria-live={playing ? "off" : "polite"} aria-atomic="true">
      <strong>{explanation.title}</strong><p>{step === 0 && initialStateDescription ? initialStateDescription : explanation.action}</p><p className="qse-observation"><span>What to notice</span>{explanation.observation}</p>
    </div>
    {disabled && <p className="qse-note">Execute the updated circuit to refresh this walkthrough.</p>}
  </section>;
}

export function StateVectorView({ snapshot }: { snapshot: StateSnapshot }) {
  const [selectedBasis, setSelectedBasis] = useState("");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [sort, setSort] = useState("basis");
  const phases = relativePhases(snapshot);
  const reference = phaseReference(snapshot);
  const total = snapshot.probabilities.reduce((sum, row) => sum + row.probability, 0);
  const norm = snapshot.amplitudes.reduce((sum, amp) => sum + amp.real ** 2 + amp.imag ** 2, 0);
  const hideTiny = !showAll && snapshot.probabilities.length > 8;
  const rows = snapshot.probabilities.filter((row) => (!hideTiny || row.probability > 1e-10) && row.basis.includes(query.trim().replace(/[|⟩\s]/g, ""))).slice().sort((a, b) => sort === "probability" ? b.probability - a.probability || a.basis.localeCompare(b.basis) : a.basis.localeCompare(b.basis));
  const selected = rows.find((row) => row.basis === selectedBasis) ?? rows.find((row) => row.basis === reference?.basis) ?? rows[0];
  const amplitude = snapshot.amplitudes.find((amp) => amp.basis === selected?.basis);
  const phase = selected ? phases.get(selected.basis) ?? null : null;
  const magnitude = amplitude ? Math.hypot(amplitude.real, amplitude.imag) : 0;
  const angle = (phase ?? 0) * Math.PI / 180;
  const point = { x: 110 + Math.cos(angle) * magnitude * 76, y: 110 - Math.sin(angle) * magnitude * 76 };
  function number(value: number) {
    if (Math.abs(value) < 1e-10) return "0";
    return Math.abs(value) < .0005 ? value.toExponential(2) : value.toFixed(3);
  }
  function probability(value: number) {
    return value > 0 && value < .0005 ? `${(value * 100).toExponential(2)}%` : `${(value * 100).toFixed(1)}%`;
  }
  return <div className="qsv-view">
    <div className="qsv-legend"><p><strong>Explore the wavefunction</strong>Select a probability bar to inspect its amplitude and relative phase. Updates follow the current circuit step.</p><span>Total {(total * 100).toFixed(1)}% · Norm² {norm.toFixed(3)}</span></div>
    <div className="qsv-toolbar">
      <label>Find a basis state<input type="search" value={query} placeholder="e.g. 110" onChange={(event) => setQuery(event.target.value)} /></label>
      <label>Order<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="basis">Basis order</option><option value="probability">Highest probability</option></select></label>
      {snapshot.probabilities.length > 8 && <button type="button" aria-pressed={showAll} onClick={() => setShowAll(!showAll)}>{showAll ? "Hide near-zero states" : `Show all ${snapshot.probabilities.length} states`}</button>}
    </div>
    <div className="qsv-explorer">
      <div className="qsv-distribution"><div className="qsv-axis"><span>Basis state</span><span>Measurement probability</span><span>Phase</span></div>
        <div className="qsv-bars" role="group" aria-label="Basis state probabilities">
          {rows.map((row) => { const rowPhase = phases.get(row.basis) ?? null; return <button type="button" key={row.basis} className="qsv-row" data-basis={row.basis} aria-pressed={selected?.basis === row.basis} aria-label={`Inspect basis ${row.basis}`} onClick={() => setSelectedBasis(row.basis)}>
            <strong>|{row.basis}⟩</strong><span className="qsv-bar"><span style={{ width: `${row.probability * 100}%` }} /></span><span className="qsv-percent">{probability(row.probability)}</span>
            <svg viewBox="0 0 48 48" className="qsv-dial" role="img" aria-label={rowPhase === null ? "Phase undefined for zero amplitude" : `Relative phase ${Math.round(rowPhase)} degrees`}><circle cx="24" cy="24" r="19" />{rowPhase !== null && <g style={{ transform: `rotate(${-rowPhase}deg)`, transformOrigin: "24px 24px" }}><path d="M24 24h16m-5-4 5 4-5 4" /></g>}</svg>
          </button>; })}
          {!rows.length && <p className="qse-note" role="status">No matching states. Try another basis label{hideTiny ? " or show all states" : ""}.</p>}
        </div>
        <p className="qse-note">{rows.length} of {snapshot.probabilities.length} states shown{hideTiny ? " · Near-zero probabilities hidden" : ""}. Basis labels put q0 on the right.</p>
      </div>
      <aside className="qsv-inspector" aria-label="Selected amplitude">
        {selected && amplitude ? <>
          <span className="qse-eyebrow">AMPLITUDE SPOTLIGHT</span><h3>|{selected.basis}⟩ <small>{probability(selected.probability)} probability</small></h3>
          <svg className="qsv-phase-plane" viewBox="0 0 220 220" role="img" aria-label={phase === null ? "Selected amplitude is zero; phase is undefined" : `Selected relative phase ${Math.round(phase)} degrees, magnitude ${magnitude.toFixed(3)}`}>
            <circle cx="110" cy="110" r="76" /><circle cx="110" cy="110" r="38" /><path d="M24 110h172M110 24v172" /><text x="194" y="104">0°</text><text x="111" y="20">90°</text><text x="1" y="104">180°</text><text x="100" y="211">270°</text>
            {phase !== null && <><line x1="110" y1="110" x2={point.x} y2={point.y} /><circle className="qsv-phase-point" cx={point.x} cy={point.y} r="5" /></>}<circle className="qsv-phase-origin" cx="110" cy="110" r="3" />
          </svg>
          <dl><div><dt>Magnitude |α|</dt><dd>{number(magnitude)}</dd></div><div><dt>Relative phase</dt><dd>{phase === null ? "Undefined" : `${Math.round(phase)}°`}</dd></div></dl>
          <p className="qsv-complex">Simulator amplitude <code>{number(amplitude.real)} {amplitude.imag < -1e-10 ? "−" : "+"} {number(Math.abs(amplitude.imag))}i</code></p>
          <p className="qse-note">{phase === null ? "Zero amplitude has no phase." : `Direction is relative to |${reference?.basis}⟩, the dominant reference. Arrow length is amplitude magnitude; probability is its square.`} A shared global phase does not affect measurement.</p>
        </> : <p className="qse-note">Choose a matching basis state to inspect it.</p>}
      </aside>
    </div>
  </div>;
}

export function EngineProbabilityComparison({ result }: { result: { caption: string; qiskit: StateSnapshot["probabilities"]; cirq: StateSnapshot["probabilities"] } }) {
  const [showAll, setShowAll] = useState(false);
  const qiskit = new Map(result.qiskit.map((row) => [row.basis, row.probability]));
  const cirq = new Map(result.cirq.map((row) => [row.basis, row.probability]));
  const bases = [...new Set([...qiskit.keys(), ...cirq.keys()])].sort();
  const visible = bases.filter((basis) => showAll || Math.max(qiskit.get(basis) ?? 0, cirq.get(basis) ?? 0) > 1e-10);
  return <div className="qsv-view qsv-comparison">
    <p className="engine-agree-caption" role="status">{result.caption}</p>
    <div className="qsv-toolbar"><span className="qsv-engine-key">Cyan: Qiskit · Violet: Cirq</span><button type="button" aria-pressed={showAll} onClick={() => setShowAll(!showAll)}>{showAll ? "Hide near-zero outcomes" : "Show all outcomes"}</button></div>
    <div className="qsv-bars" aria-label="Qiskit versus Cirq ideal probabilities">
      {visible.map((basis) => <div className="qsv-comparison-row" key={basis}><strong>|{basis}⟩</strong><div>{(["Qiskit", "Cirq"] as const).map((engine) => {
        const value = (engine === "Qiskit" ? qiskit : cirq).get(basis) ?? 0;
        return <div className={`qsv-engine-bar ${engine.toLowerCase()}`} key={engine}><span className="qsv-bar" role="meter" aria-label={`${engine} probability of ${basis}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value * 100}><span style={{ width: `${value * 100}%` }} /></span><span>{(value * 100).toFixed(1)}%</span></div>;
      })}</div></div>)}
    </div>
    <p className="qse-note">{visible.length} of {bases.length} outcomes shown. Both engines use q0 as the rightmost bit.</p>
  </div>;
}
