"use client";

import { useState } from "react";
import Link from "next/link";
import { QuantumSphere } from "./QuantumSphere";
import { ComputerComparison } from "./ComputerComparison";
import { applyNoise, type NoiseChannel } from "@/lib/noise";
import "./quantum-toolbox.css";

const states = [{ label: "|+⟩ · superposition", x: 1, y: 0, z: 0 }, { label: "|1⟩ · excited", x: 0, y: 0, z: -1 }, { label: "|0⟩ · ground", x: 0, y: 0, z: 1 }, { label: "|+i⟩ · phase", x: 0, y: 1, z: 0 }];
const channels: { id: NoiseChannel; title: string; explanation: string; formula: string }[] = [
  { id: "depolarizing", title: "Depolarization", explanation: "Moves the state toward an equal mixture. At full strength the Bloch vector is at the center: every measurement axis gives 50/50 outcomes.", formula: "ρ′ = (1 − p)ρ + pI/2" },
  { id: "damping", title: "Energy relaxation", explanation: "Models loss of excitation into a zero-temperature environment. At full strength every input reaches the ground state |0⟩. Noise can therefore end in a pure state again.", formula: "x′ = √(1 − p)x; y′ = √(1 − p)y; z′ = (1 − p)z + p" },
  { id: "dephasing", title: "Phase damping", explanation: "Reduces coherence while preserving Z-basis probabilities. Try |+⟩: Z stays 50/50, but the X-basis certainty disappears as noise grows.", formula: "x′ = √(1 − p)x; y′ = √(1 − p)y; z′ = z" },
];
const concepts = [
  { term: "Amplitude", text: "A complex weight for a possible outcome. Its squared magnitude gives a measurement probability. Unlike probabilities, amplitudes can cancel.", href: "#quantum-missions" },
  { term: "Bloch sphere", text: "A picture of one qubit. Pure states lie on its surface; mixed states lie inside. It cannot display the entire state of an entangled pair.", href: "#circuit-workbench" },
  { term: "Density matrix", text: "A state description that also works for statistical mixtures and individual parts of entangled systems. Diagonal entries give basis probabilities; off-diagonal entries encode coherence.", href: "#quantum-toolbox" },
  { term: "Entanglement", text: "A joint state that cannot be described as a mixture of independent product states. Matching outcomes alone do not prove entanglement, and it cannot transmit messages faster than light.", href: "#entanglement-lab" },
  { term: "Interference", text: "Amplitudes contributing to the same outcome can reinforce or cancel. Gate sequences use this to change which outcomes are likely.", href: "#quantum-missions" },
  { term: "Measurement", text: "Produces a classical outcome according to the measurement basis. Repeating an experiment means preparing a fresh state for each shot.", href: "#circuit-workbench" },
  { term: "Purity", text: "Tr(ρ²) measures how mixed a state is. For one qubit it ranges from 1/2 for the maximally mixed state to 1 for a pure state. It is not a hardware accuracy score.", href: "#quantum-toolbox" },
  { term: "Relative phase", text: "The angle between complex amplitudes. A gate can change phase without changing current measurement probabilities; later interference can reveal the difference.", href: "#quantum-missions" },
  { term: "Shot", text: "One circuit preparation and measurement. Finite shot counts fluctuate even when the ideal probabilities are fixed.", href: "#entanglement-lab" },
];

export function QuantumToolbox() {
  const [tab, setTab] = useState("noise");
  const [stateIndex, setStateIndex] = useState(0);
  const [channel, setChannel] = useState<NoiseChannel>("dephasing");
  const [strength, setStrength] = useState(0.5);
  const [query, setQuery] = useState("");
  const initial = states[stateIndex];
  const noisy = applyNoise(initial, channel, strength);
  const info = channels.find(item => item.id === channel)!;
  const purity = (1 + noisy.x ** 2 + noisy.y ** 2 + noisy.z ** 2) / 2;
  const visible = concepts.filter(item => `${item.term} ${item.text}`.toLowerCase().includes(query.trim().toLowerCase()));
  const decimal = (value: number) => (Math.abs(value) < 0.0005 ? 0 : value).toFixed(3);
  return <section id="quantum-toolbox" className="qt" aria-labelledby="qt-title"><header><p className="qt-kicker">QUANTUM TOOLBOX / EXPLORE THE MECHANISM</p><h2 id="qt-title">Make the invisible understandable.</h2><p>Change one thing. Compare the states. Learn the language as you go.</p></header>
    <div className="qt-tabs" role="group" aria-label="Quantum toolbox">{[["noise", "Noise playground"], ["mapper", "Classical → quantum"], ["glossary", "Search concepts"]].map(([id, title]) => <button type="button" key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{title}</button>)}</div>
    {tab === "noise" && <><div className="qt-controls"><label>Starting state<select value={stateIndex} onChange={event => setStateIndex(Number(event.target.value))}>{states.map((item, index) => <option key={item.label} value={index}>{item.label}</option>)}</select></label><label>Noise channel<select value={channel} onChange={event => setChannel(event.target.value as NoiseChannel)}>{channels.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>Channel strength p = {strength.toFixed(2)}<input type="range" min="0" max="1" step="0.01" value={strength} onChange={event => setStrength(Number(event.target.value))} /></label><button type="button" onClick={() => setStrength(0)}>Reset noise</button></div><p className="qt-explanation">{info.explanation}</p>
      <div className="qt-spheres"><article><h3>Before · pure preparation</h3><QuantumSphere vector={initial} motionPaused label="Before noise" /></article><article><h3>After · {info.title}</h3><QuantumSphere vector={noisy} motionPaused label="After noise" /></article><article className="qt-readout"><h3>Read the state</h3><p>Purity <strong data-testid="noise-purity">{purity.toFixed(3)}</strong></p><div className="qt-matrix" aria-label="Density matrix in the Z basis"><span>{decimal((1 + noisy.z) / 2)}</span><span>{decimal(noisy.x / 2)} {noisy.y < 0 ? "+" : "−"} {decimal(Math.abs(noisy.y / 2))}i</span><span>{decimal(noisy.x / 2)} {noisy.y < 0 ? "−" : "+"} {decimal(Math.abs(noisy.y / 2))}i</span><span>{decimal((1 - noisy.z) / 2)}</span></div><p className="qt-small">Diagonal entries are Z probabilities. Off-diagonal entries describe coherence.</p>{[{ axis: "Z", before: initial.z, after: noisy.z, outcome: "0" }, { axis: "X", before: initial.x, after: noisy.x, outcome: "+" }].map(item => <div className="qt-probability" key={item.axis}><strong>{item.axis} basis · P({item.outcome})</strong><span>{((1 + item.before) * 50).toFixed(0)}% before → {((1 + item.after) * 50).toFixed(0)}% after</span><meter min="0" max="1" value={(1 + item.after) / 2} aria-label={`${item.axis} basis probability after noise`} /></div>)}</article></div><details><summary>See the mathematics and model limits</summary><code>{info.formula}</code><p>One channel is applied once to one prepared qubit. The slider is not elapsed time or a calibrated hardware error rate. This exact analytical model runs locally; it does not add noise to your saved circuit or represent a hardware run.</p><a href="https://quantum.cloud.ibm.com/docs/en/guides/build-noise-models" target="_blank" rel="noreferrer">Read about quantum noise channels ↗</a></details></>}
    {tab === "mapper" && <ComputerComparison />}
    {tab === "glossary" && <><label className="qt-search">Find a concept<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try phase, measurement, or purity" /></label><p role="status">{visible.length} concepts found</p><div className="qt-concepts">{visible.map(item => <article key={item.term}><h3>{item.term}</h3><p>{item.text}</p><a href={item.href} onClick={() => { if (item.href === "#quantum-toolbox") setTab("noise"); }}>Explore this concept →</a></article>)}</div>{visible.length === 0 && <p>Try a shorter word, or <button type="button" onClick={() => setQuery("")}>show all concepts</button>.</p>}<Link href="/learn">Continue your learning path →</Link></>}
  </section>;
}
