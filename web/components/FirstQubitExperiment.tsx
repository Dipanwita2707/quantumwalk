"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, useSession } from "@/lib/api";
import { demoSimulateCircuit } from "@/lib/demoSimulate";
import { QuantumSphere } from "./QuantumSphere";
import { StateEvolutionGuide, StateVectorView } from "./StateEvolution";
import type { Operation, Simulation } from "./CircuitViewer";
import "./first-qubit-experiment.css";

const setups: { id: string; label: string; name: string; purpose: string; operations: Operation[]; expected: string; conclusion: string }[] = [
  { id: "baseline", label: "01 · Baseline", name: "Measure the prepared state", purpose: "Prepare |0⟩ and read it directly. Establish a reference before introducing a gate.", operations: [{ gate: "measure", target: 0 }], expected: "zero", conclusion: "With ideal preparation and readout, |0⟩ always produces the classical bit 0. Hardware can deviate because of preparation or readout errors." },
  { id: "superposition", label: "02 · Apply H", name: "Prepare a superposition", purpose: "Place one Hadamard gate between preparation and readout. Predict how the output distribution changes.", operations: [{ gate: "h", target: 0 }, { gate: "measure", target: 0 }], expected: "balanced", conclusion: "H prepares |+⟩ = (|0⟩ + |1⟩)/√2. Each Z-basis readout has probability ½ for either bit. Repeating the experiment estimates those probabilities; a finite run need not split exactly in half." },
  { id: "undo", label: "03 · Apply H twice", name: "Test whether H reverses itself", purpose: "Apply a second H before readout. Does the state stay uncertain, or return to the starting state?", operations: [{ gate: "h", target: 0 }, { gate: "h", target: 0 }, { gate: "measure", target: 0 }], expected: "zero", conclusion: "H² = I. The second H recombines amplitudes: they reinforce for |0⟩ and cancel for |1⟩. A classical coin-flip analogy cannot explain this coherent reversal." },
];

export function FirstQubitExperiment() {
  const { profile } = useSession();
  const [setupIndex, setSetupIndex] = useState(1);
  const [shots, setShots] = useState(128);
  const [prediction, setPrediction] = useState("");
  const [result, setResult] = useState<Simulation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [delay, setDelay] = useState(1400);
  const pending = useRef<AbortController | null>(null);
  const setup = setups[setupIndex];
  useEffect(() => () => pending.current?.abort(), []);
  useEffect(() => {
    if (!playing || !result) return;
    if (step >= result.steps.length - 1) { setPlaying(false); return; }
    const timer = setTimeout(() => setStep(value => value + 1), delay);
    return () => clearTimeout(timer);
  }, [playing, result, step, delay]);

  function clearRun() {
    pending.current?.abort(); setBusy(false); setResult(null); setError(""); setStep(0); setPlaying(false);
  }
  async function run() {
    if (!prediction || busy) return;
    const controller = new AbortController();
    pending.current?.abort(); pending.current = controller;
    setBusy(true); setError(""); setResult(null); setPlaying(false); setStep(0);
    try {
      const payload = { qubits: 1, operations: setup.operations, shots };
      const data = profile?.authenticated
        ? await api<Simulation>("/api/simulate", { method: "POST", body: JSON.stringify(payload), signal: controller.signal }, profile.csrf_token)
        : await demoSimulateCircuit(payload) as Simulation;
      if (!controller.signal.aborted) { setResult(data); setPlaying(true); }
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "The simulator could not complete this run. Try again.");
    } finally { if (!controller.signal.aborted) setBusy(false); }
  }

  const snapshot = result?.steps[step];
  const readoutReady = !!result && step === result.steps.length - 1;
  const final = result?.steps[result.steps.length - 1];
  const sampleCount = Object.values(result?.counts ?? {}).reduce((sum, count) => sum + count, 0);

  return <section id="lesson-experiment" className="fq-lab" aria-labelledby="fq-title">
    <header className="fq-header"><div><span className="fq-eyebrow">GUIDED EXPERIMENT / 01</span><h3 id="fq-title">From a qubit to a readout</h3><p>Prepare → control → measure. Change one condition and compare the evidence.</p></div><span className="fq-model">Ideal simulator · 1 qubit</span></header>
    <div className="fq-workspace"><div className="fq-controls">
    <div className="fq-setups" role="group" aria-label="Experiment setup">{setups.map((item, index) => <button type="button" key={item.id} aria-pressed={setupIndex === index} onClick={() => { clearRun(); setSetupIndex(index); setPrediction(""); }}>{item.label}</button>)}</div>
    <div className="fq-protocol"><div><h4>{setup.name}</h4><p>{setup.purpose}</p></div><label>Repeated preparations (shots)<select value={shots} onChange={event => { clearRun(); setShots(Number(event.target.value)); }}><option value={32}>32 shots · quick check</option><option value={128}>128 shots · compare</option><option value={1024}>1,024 shots · larger sample</option></select></label></div>
    <div className="fq-circuit" role="group" aria-label="Experiment circuit"><span>q0 · |0⟩</span>{setup.operations.map((operation, index) => <button type="button" key={`${setup.id}-${index}`} disabled={!result || busy} aria-label={`Inspect experiment gate ${index + 1}: ${operation.gate.toUpperCase()}`} aria-current={result && step === index + 1 ? "step" : undefined} onClick={() => { setPlaying(false); setStep(index + 1); }}>{operation.gate === "measure" ? "MZ" : operation.gate.toUpperCase()}</button>)}<span>classical bit</span></div>
    <div className="fq-predict"><fieldset disabled={busy || !!result}><legend>Predict the Z-basis readout before running</legend><div>{[["zero", "Only 0"], ["balanced", "About half 0, half 1"], ["one", "Only 1"]].map(([value, label]) => <label key={value}><input type="radio" name="fq-prediction" value={value} checked={prediction === value} onChange={() => setPrediction(value)} />{label}</label>)}</div></fieldset><button type="button" className="fq-run" disabled={!prediction || busy} onClick={() => void run()}>{busy ? "Running experiment…" : result ? "Repeat experiment" : "Run experiment"}</button></div>
    {!prediction && <p className="fq-hint">Choose a prediction to begin. A wrong prediction is useful evidence, too.</p>}
    {error && <p className="fq-error" role="alert">{error} Select Run experiment to retry.</p>}
    </div><div className="fq-observations">
    {result && <StateEvolutionGuide snapshots={result.steps} operations={setup.operations} step={step} playing={playing} onStep={next => { setPlaying(false); setStep(next); }} onPlay={() => { if (!playing && step >= result.steps.length - 1) setStep(0); setPlaying(!playing); }} delay={delay} onDelay={setDelay} />}
    <div className="fq-observation-grid">
      <section className="fq-state" aria-label="Qubit state before readout"><div className="fq-section-head"><span className="fq-eyebrow">INSIDE THE EXPERIMENT</span><h4>{snapshot ? `State at step ${step}` : "Prepared state |0⟩"}</h4></div><QuantumSphere vector={snapshot?.bloch[0] ?? { x: 0, y: 0, z: 1 }} autoRotate={false} transitionMs={Math.min(delay - 150, 900)} label="First-qubit experiment Bloch sphere" /><p className="fq-hint">The sphere shows the ideal state before readout collapse. The MZ step displays sampled outcomes separately; it does not animate a particular shot's collapsed state.</p></section>
      <section className="fq-readout" aria-labelledby="fq-readout-title"><span className="fq-eyebrow">LAB NOTEBOOK</span><h4 id="fq-readout-title">Prediction vs. observation</h4><p className="fq-hint">Each shot prepares the input again, applies the entire sequence, and records one classical bit.</p>
        <div className="fq-results-key"><span>Ideal probability</span><span>Sampled frequency</span></div>
        {(["0", "1"] as const).map(basis => {
          const probability = snapshot?.probabilities.find(row => row.basis === basis)?.probability ?? (basis === "0" ? 1 : 0);
          const count = readoutReady ? result?.counts?.[basis] ?? 0 : 0;
          return <div className="fq-outcome" key={basis}><div><strong>Read {basis}</strong><span>{(probability * 100).toFixed(1)}% ideal</span></div><div className="fq-result-track" role="meter" aria-label={`Ideal probability of ${basis}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={probability * 100}><span style={{ width: `${probability * 100}%` }} /></div><div className="fq-result-track fq-sampled" role="meter" aria-label={`Sampled frequency of ${basis}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={readoutReady && sampleCount ? count / sampleCount * 100 : 0}><span style={{ width: `${readoutReady && sampleCount ? count / sampleCount * 100 : 0}%` }} /></div><small>{readoutReady ? `${count} / ${sampleCount} shots · ${(sampleCount ? count / sampleCount * 100 : 0).toFixed(1)}% observed` : "Awaiting measurement step"}</small></div>;
        })}
        {readoutReady && <div className="fq-conclusion" role="status"><strong>{prediction === setup.expected ? "Your prediction matches the ideal distribution." : "Compare your prediction with the ideal distribution."}</strong><p>{setup.conclusion}</p><p>{final && setup.expected === "balanced" ? `For ${sampleCount} shots, the expected standard deviation of the observed percentage is ${(50 / Math.sqrt(sampleCount)).toFixed(1)} percentage points. This describes sampling variation, not hardware noise.` : "Try the next setup to change one part of the preparation and compare results."}</p></div>}
        {!result && <div className="fq-ready-note"><strong>Your notebook is ready.</strong><p>Run your prediction, then watch the state evolve and inspect the measured counts here.</p></div>}
      </section>
    </div>
    {snapshot && <details className="fq-amplitudes"><summary>Inspect the complex amplitudes behind these probabilities</summary><StateVectorView snapshot={snapshot} /></details>}
    </div></div>
    <details className="fq-hardware"><summary>What this model represents</summary><div className="fq-hardware-content"><span className="fq-eyebrow">WHAT THIS MEANS IN A LAB</span><h4>Same experimental logic. Different physical equipment.</h4><p>On a superconducting processor, compiled control pulses implement the gates and a readout system distinguishes 0 from 1. Here, a classical statevector simulator calculates the ideal quantum state and samples readouts. It models neither physical control pulses nor device errors.</p><p>H followed by H is a practical coherence check in this ideal model: the state returns to |0⟩. On hardware, imperfect preparation, gates, readout, and decoherence can change the observed counts.</p><div><Link href="/workspace?mode=circuit&preset=superposition">Continue with the circuit builder →</Link><a href="https://quantum.cloud.ibm.com/learning/en/courses/quantum-computing-in-practice/running-quantum-circuits" target="_blank" rel="noreferrer">How circuits run on hardware ↗</a></div></div></details>
  </section>;
}
