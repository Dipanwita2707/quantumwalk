"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircuitViewer, type Operation } from "./CircuitViewer";
import { FirstQubitExperiment } from "./FirstQubitExperiment";
import { StateVectorView } from "./StateEvolution";
import type { StateSnapshot } from "@/lib/stateExplanation";
import "./foundation-activities.css";

const activities = [
  { title: "Amplitudes & phase", subtitle: "Change a complex amplitude without losing normalization.", lesson: "/learn/math-amplitudes", question: "If an amplitude has magnitude 0.5, what is its measurement probability?", choices: ["25%", "50%", "100%"], correct: 0, explanation: "Probability is magnitude squared: 0.5² = 0.25. Phase affects interference, not that basis probability directly." },
  { title: "Measurement & sampling", subtitle: "Predict a readout, run a circuit, and compare measured counts.", lesson: "/learn/first-qubit", question: "Why can 128 shots of an ideal 50/50 state give unequal counts?", choices: ["Finite-sample variation", "The qubit has lost normalization", "H always returns 0"], correct: 0, explanation: "Independent random samples need not split evenly. The underlying ideal probabilities remain 50/50." },
  { title: "Two-qubit states", subtitle: "Build a product state, then compare it with a Bell state.", lesson: "/learn/entanglement", question: "Which outcomes occur when the Bell state (|00⟩ + |11⟩)/√2 is measured in the Z basis?", choices: ["All four equally", "00 and 11, each with 50% probability", "Only 01"], correct: 1, explanation: "Only 00 and 11 have nonzero amplitudes. Their correlated readouts arise from a joint state that cannot be written as a product of two pure single-qubit states." },
  { title: "Reversible gates", subtitle: "Step through H², X², and a phase-interference sequence.", lesson: "/learn/math-amplitudes", question: "What does H followed by H do to |0⟩ before measurement?", choices: ["Leaves it at 50/50", "Returns it to |0⟩", "Always produces |1⟩"], correct: 1, explanation: "H² = I. Amplitudes recombine coherently, returning the qubit to |0⟩ in this ideal simulation." },
];
const sequences: { label: string; operations: Operation[] }[] = [
  { label: "H → H", operations: [{ gate: "h", target: 0 }, { gate: "h", target: 0 }] },
  { label: "X → X", operations: [{ gate: "x", target: 0 }, { gate: "x", target: 0 }] },
  { label: "H → Z → H", operations: [{ gate: "h", target: 0 }, { gate: "z", target: 0 }, { gate: "h", target: 0 }] },
];
const states: Record<string, number[]> = { "0": [1, 0], "1": [0, 1], "+": [Math.SQRT1_2, Math.SQRT1_2], "−": [Math.SQRT1_2, -Math.SQRT1_2] };

function amplitudeSnapshot(probability: number, degrees: number): StateSnapshot {
  const a = Math.sqrt(1 - probability), magnitude = Math.sqrt(probability), angle = degrees * Math.PI / 180;
  const real = magnitude * Math.cos(angle), imag = magnitude * Math.sin(angle);
  return { index: 0, amplitudes: [{ basis: "0", real: a, imag: 0 }, { basis: "1", real, imag }], probabilities: [{ basis: "0", probability: 1 - probability }, { basis: "1", probability }], bloch: [{ qubit: 0, x: 2 * a * real, y: 2 * a * imag, z: 1 - 2 * probability, purity: 1 }] };
}

export function FoundationActivities() {
  const [active, setActive] = useState(0);
  const [p1, setP1] = useState(.5);
  const [phase, setPhase] = useState(0);
  const [q0, setQ0] = useState("+");
  const [q1, setQ1] = useState("0");
  const [bell, setBell] = useState(false);
  const [sequence, setSequence] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [ambientPaused, setAmbientPaused] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => { setReducedMotion(preference.matches); if (preference.matches) setSweeping(false); };
    sync(); setReady(true); preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (!sweeping || reducedMotion || active !== 0) return;
    if (phase >= 360) { setSweeping(false); return; }
    const timer = setTimeout(() => setPhase(value => Math.min(360, value + 15)), 250);
    return () => clearTimeout(timer);
  }, [sweeping, reducedMotion, active, phase]);
  const activity = activities[active];
  const completed = activities.filter((item, index) => answers[index] === item.correct).length;
  const amplitudes = Array.from({ length: 4 }, (_, index) => ({ basis: index.toString(2).padStart(2, "0"), real: bell ? index === 0 || index === 3 ? Math.SQRT1_2 : 0 : states[q0][index & 1] * states[q1][index >> 1], imag: 0 }));
  const pair: StateSnapshot = { index: 0, amplitudes, probabilities: amplitudes.map(amp => ({ basis: amp.basis, probability: amp.real ** 2 })), bloch: [] };
  return <div className={`fa-course fa-quantum-deck${ambientPaused ? " fa-motion-paused" : ""}`}>
    <fieldset className="fa-ready-shell" disabled={!ready} aria-busy={!ready}><legend className="sr-only">Quantum foundation experiments</legend>
    <div className="fa-progress"><div><span className="fa-eyebrow">DISCOVERY MAP</span><p>{completed === 4 ? "Every insight illuminated. Keep experimenting." : "Follow your curiosity. Light up an insight by understanding it."}</p></div><button type="button" className="fa-motion-control" aria-pressed={ambientPaused} onClick={() => setAmbientPaused(!ambientPaused)}>{ambientPaused ? "Resume ambient motion" : "Pause ambient motion"}</button><progress className="sr-only" value={completed} max={4} aria-label="Foundation activity checks completed" /></div>
    <nav className="fa-navigation" aria-label="Foundation activities">{activities.map((item, index) => <button type="button" key={item.title} className={answers[index] === item.correct ? "fa-node-unlocked" : ""} aria-current={active === index ? "step" : undefined} onClick={() => { setSweeping(false); setActive(index); }}><span className="fa-node-index">{String(index + 1).padStart(2, "0")}</span><svg className="fa-node-symbol" viewBox="0 0 80 64" aria-hidden="true">{index === 0 ? <><ellipse cx="40" cy="32" rx="30" ry="12" /><ellipse cx="40" cy="32" rx="30" ry="12" transform="rotate(60 40 32)" /><ellipse cx="40" cy="32" rx="30" ry="12" transform="rotate(120 40 32)" /><circle cx="40" cy="32" r="4" /></> : index === 1 ? <><path d="M10 48h60M18 42V26m15 16V12m15 30V20m15 22V32" /><circle cx="33" cy="12" r="4" /></> : index === 2 ? <><circle cx="23" cy="32" r="14" /><circle cx="57" cy="32" r="14" /><path d="M23 32h34M34 15c8-10 18-10 23 0M23 49c7 10 19 10 23 0" /><circle cx="23" cy="32" r="3" /><circle cx="57" cy="32" r="3" /></> : <><path d="M18 22a24 24 0 1 1-2 21M8 9l10 13 15-6" /><path d="M31 22v20m18-20v20M31 32h18" /></>}</svg><strong>{item.title}</strong><small>{answers[index] === item.correct ? "✦ Insight unlocked" : active === index ? "Exploring now" : "Enter experiment"}</small></button>)}</nav>
    <section key={active} className="fa-activity fa-activity-enter" aria-labelledby="fa-activity-title">
      <header><span className="fa-eyebrow">ACTIVITY {active + 1} / 4 · LEARN BY DOING</span><h2 id="fa-activity-title">{activity.title}</h2><p>{activity.subtitle}</p></header>
      {active === 0 && <>
        <p className="fa-instruction">Move the controls. The two probabilities must add to 100%; changing phase alone leaves them unchanged. Select a bar to inspect its complex amplitude.</p>
        <div className="fa-state-lens">
          <div className="fa-phasor-instrument"><span className="fa-eyebrow">AMPLITUDE INSTRUMENT</span><svg viewBox="0 0 320 260" role="img" aria-label={`Amplitude diagram: magnitude of 0 is ${Math.sqrt(1 - p1).toFixed(3)}, magnitude of 1 is ${Math.sqrt(p1).toFixed(3)}, phase parameter ${phase} degrees`}>
            <circle className="fa-orbit-halo" cx="160" cy="130" r="96" /><circle className="fa-phasor-ring" cx="160" cy="130" r="80" /><circle className="fa-phasor-ring fa-phasor-inner" cx="160" cy="130" r="40" /><path className="fa-phasor-axes" d="M58 130h204M160 28v204" />
            <text x="266" y="134">0°</text><text x="150" y="22">90°</text><text x="18" y="134">180°</text><text x="146" y="251">270°</text>
            <g className="fa-phasor-zero"><line x1="160" y1="130" x2={160 + Math.sqrt(1 - p1) * 80} y2="130" /><circle cx={160 + Math.sqrt(1 - p1) * 80} cy="130" r="5" /></g>
            <g className="fa-phasor-one" style={{ transform: `rotate(${-phase}deg)`, transformOrigin: "160px 130px" }}><line x1="160" y1="130" x2={160 + Math.sqrt(p1) * 80} y2="130" /><circle cx={160 + Math.sqrt(p1) * 80} cy="130" r="5" /></g><circle className="fa-phasor-origin" cx="160" cy="130" r="3" />
          </svg><div className="fa-phasor-key"><span>|0⟩ amplitude</span><span>|1⟩ amplitude</span></div><p>Arrow length is magnitude. Direction shows complex phase in this chosen convention.</p></div>
          <div className="fa-state-console"><span className="fa-eyebrow">SHAPE THE STATE</span><h3>Turn the phase. Watch what stays.</h3><div className="fa-state-presets" role="group" aria-label="Prepare an amplitude state">{[{ label: "|0⟩", p: 0, angle: 0 }, { label: "|+⟩", p: .5, angle: 0 }, { label: "|+i⟩", p: .5, angle: 90 }, { label: "|1⟩", p: 1, angle: 0 }].map(item => <button type="button" key={item.label} aria-pressed={p1 === item.p && phase === item.angle} onClick={() => { setSweeping(false); setP1(item.p); setPhase(item.angle); }}>{item.label}</button>)}</div>
          <div className="fa-controls"><label>Probability of reading 1: {(p1 * 100).toFixed(0)}%<input type="range" min={0} max={100} value={p1 * 100} onChange={event => setP1(Number(event.target.value) / 100)} aria-label="Probability of reading 1" /></label><label>Phase of the |1⟩ amplitude: {phase}°<input type="range" min={0} max={360} step={15} value={phase} onChange={event => { setSweeping(false); setPhase(Number(event.target.value)); }} aria-label="Phase of the 1 amplitude" /></label></div>
          <button type="button" className="fa-sweep-button" aria-pressed={sweeping} onClick={() => { if (reducedMotion) { setPhase(value => (value + 15) % 360); return; } if (!sweeping && phase >= 360) setPhase(0); setSweeping(!sweeping); }}>{reducedMotion ? "Advance phase 15°" : sweeping ? "Pause phase sweep" : "Sweep phase"}</button><p className="fa-sweep-note">A parameter sweep, not a simulation of a hardware pulse. Try |+⟩, then sweep: the probabilities stay 50/50 while phase turns.</p></div>
        </div>
        <p className="fa-equation">|ψ⟩ = √{(1 - p1).toFixed(2)} |0⟩ + e<sup>iφ</sup> √{p1.toFixed(2)} |1⟩ <small>φ = {phase}°</small></p>
        <StateVectorView snapshot={amplitudeSnapshot(p1, phase)} />
        <p className="fa-instruction">Phase is relative to a nonzero reference amplitude. If either component is zero, the phase relationship between the two components is undefined.</p>
      </>}
      {active === 1 && <FirstQubitExperiment />}
      {active === 2 && <>
        <p className="fa-instruction">Labels read |q1 q0⟩. For a product state, multiply the two single-qubit amplitudes. Compare that construction with a Bell state.</p>
        <div className="fa-controls"><label>State of q0<select value={q0} disabled={bell} onChange={event => setQ0(event.target.value)}>{Object.keys(states).map(state => <option key={state} value={state}>|{state}⟩</option>)}</select></label><label>State of q1<select value={q1} disabled={bell} onChange={event => setQ1(event.target.value)}>{Object.keys(states).map(state => <option key={state} value={state}>|{state}⟩</option>)}</select></label></div>
        <div className="fa-mode" role="group" aria-label="Joint state preparation"><button type="button" aria-pressed={!bell} onClick={() => setBell(false)}>Build a product state</button><button type="button" aria-pressed={bell} onClick={() => setBell(true)}>Prepare Bell state</button></div>
        <p className="fa-equation">{bell ? "|ψ⟩ = (|00⟩ + |11⟩) / √2" : `|ψ⟩ = |${q1}⟩q1 ⊗ |${q0}⟩q0`}</p>
        <StateVectorView snapshot={pair} />
        <p className="fa-instruction">{bell ? "Each qubit has a 50/50 local readout, but the two Z-basis results agree. This Bell state is entangled; no pair of pure single-qubit states reproduces its full joint state." : "This is a separable pure state by construction. Changing one input updates the joint amplitudes without entangling the pair."}</p>
      </>}
      {active === 3 && <>
        <p className="fa-instruction">Choose a gate sequence, then use Start simulation or the step buttons. H² and X² return |0⟩ to itself. H→Z→H uses relative phase to reach |1⟩. These are ideal statevector simulations; measurement is not a reversible unitary gate.</p>
        <div className="fa-mode" role="group" aria-label="Reversible gate sequence">{sequences.map((item, index) => <button type="button" key={item.label} aria-pressed={sequence === index} onClick={() => setSequence(index)}>{item.label}</button>)}</div>
        <CircuitViewer initialQubits={1} initialOperations={sequences[sequence].operations} readonly title="Follow the gate sequence" subtitle="Inspect the state after each operation, before any measurement." />
      </>}
      <fieldset className="fa-check"><legend>Check your understanding</legend><p>{activity.question}</p>{activity.choices.map((choice, index) => <button type="button" key={choice} aria-pressed={answers[active] === index} onClick={() => setAnswers(previous => ({ ...previous, [active]: index }))}>{choice}</button>)}</fieldset>
      {answers[active] !== undefined && <p className={`fa-feedback ${answers[active] === activity.correct ? "fa-correct" : ""}`} role="status">{answers[active] === activity.correct ? `Correct. ${activity.explanation}` : "Try again. Explore the activity and compare the states before choosing another answer."}</p>}
      <footer><Link href={activity.lesson}>Read the full lesson →</Link>{active < 3 && <button type="button" onClick={() => setActive(active + 1)}>Next activity →</button>}{active === 3 && <Link href="/learn">Continue the learning trail →</Link>}</footer>
    </section>
    </fieldset>
  </div>;
}
