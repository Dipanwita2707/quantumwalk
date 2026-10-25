"use client";

import { useState } from "react";
import { api, useSession } from "@/lib/api";
import type { Operation, Simulation } from "./CircuitViewer";
import { QuantumSphere } from "./QuantumSphere";
import "./entanglement-lab.css";

export function EntanglementLab() {
  const { profile } = useSession();
  const [kind, setKind] = useState<"bell" | "independent">("bell");
  const [result, setResult] = useState<Simulation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [spacing, setSpacing] = useState(45);
  const [paused, setPaused] = useState(false);
  const snapshot = result?.steps.at(-1);
  async function run() {
    if (!profile?.authenticated || busy) return;
    setBusy(true); setError("");
    const operations: Operation[] = [{ gate: "h", target: 0 }, kind === "bell" ? { gate: "cx", control: 0, target: 1 } : { gate: "h", target: 1 }, { gate: "measure", target: 0 }, { gate: "measure", target: 1 }];
    try {
      setResult(await api<Simulation>("/api/simulate", { method: "POST", body: JSON.stringify({ qubits: 2, operations, shots: 1024 }) }, profile.csrf_token));
    } catch { setError("The simulator could not finish. Please try again."); }
    finally { setBusy(false); }
  }
  return <section id="entanglement-lab" className={`ent-lab ${paused ? "ent-paused" : ""}`} aria-labelledby="ent-title">
    <header><div><p className="ent-eyebrow">PAIRED REALITIES / INTERACTIVE EXPERIMENT</p><h2 id="ent-title">Two qubits. One shared story.</h2><p>Discover entanglement by comparing what two qubits do together.</p></div><span className="ent-tag">02 QUBITS · IDEAL SIMULATOR</span></header>
    <div className="ent-layout"><div className="ent-console">
      <div className="ent-options" aria-label="Experiment type">{([['bell', 'Entangled pair'], ['independent', 'Independent pair']] as const).map(([id, title]) => <button key={id} type="button" disabled={busy} aria-pressed={kind === id} onClick={() => { setKind(id); setResult(null); setError(""); }}>{title}</button>)}</div>
      <h3>{kind === "bell" ? "Prepare a Bell pair" : "Prepare two separate superpositions"}</h3>
      <p>{kind === "bell" ? "H gives the first qubit equal chances of 0 and 1. A controlled-X gate then entangles the pair. Measure both in the Z basis: their outcomes always match in this ideal experiment." : "Apply H to each qubit separately. Each has equal chances of 0 and 1, but their joint outcomes can match or differ. Equal individual probabilities do not prove entanglement."}</p>
      <div className="ent-circuit" aria-label={kind === "bell" ? "Hadamard on q0, controlled X from q0 to q1, measure both" : "Hadamard on both qubits, measure both"}><div>q0 <span>── [ H ] ── {kind === "bell" ? '●' : '─'} ── [ M ]</span></div><div>q1 <span>── {kind === "bell" ? '───── ⊕' : '[ H ] ── ─'} ── [ M ]</span></div></div>
      <button className="ent-run" type="button" disabled={busy || !profile?.authenticated} onClick={run}>{busy ? "Simulating 1,024 shots…" : result ? "Run another 1,024 shots →" : "Prepare & measure the pair →"}</button>
      {error && <p role="alert">{error}</p>}
      <p className="ent-note">A shot is one fresh preparation and measurement. The bars compare ideal probabilities with sampled counts.</p>
    </div><div className="ent-stage">
      <div className="ent-pair" aria-hidden="true"><svg viewBox="0 0 500 180"><defs><radialGradient id="ent-glow"><stop stopColor="#c4fffa"/><stop offset=".24" stopColor="#69e7e0"/><stop offset="1" stopColor="#7465d0" stopOpacity="0"/></radialGradient><radialGradient id="ent-core"><stop stopColor="#f0ffff"/><stop offset=".4" stopColor="#57e6ea"/><stop offset="1" stopColor="#7465d0" stopOpacity="0"/></radialGradient></defs>
        {kind === "bell" && [0, 1, 2, 3, 4].map((strand) => {
          const lx = 220 - spacing;
          const rx = 280 + spacing;
          const amp = 8 + strand * 4;
          const d = `M ${lx} 90 C ${lx + 40} ${90 - amp - strand * 2}, ${250 - 20} ${90 - amp}, 250 ${90 - amp * 0.5} S ${rx - 40} ${90 + amp + strand}, ${rx} 90 S ${250 + 20} ${90 + amp}, 250 ${90 + amp * 0.5} S ${lx + 40} ${90 - amp - strand}, ${lx} 90`;
          return <path key={strand} className="ent-helix" style={{ animationDelay: `${strand * -1.1}s` }} d={d} />;
        })}
        <path className={kind === "bell" ? "ent-link" : "ent-unlinked"} d={`M ${220 - spacing} 90 Q 250 10 ${280 + spacing} 90 Q 250 170 ${220 - spacing} 90`} />
        <circle className="ent-orb ent-orb-a" cx={220 - spacing} cy="90" r="65" fill="url(#ent-glow)"/><circle className="ent-orb ent-orb-b" cx={280 + spacing} cy="90" r="65" fill="url(#ent-glow)"/>
        <circle cx={220 - spacing} cy="90" r="14" fill="url(#ent-core)"/><circle cx={280 + spacing} cy="90" r="14" fill="url(#ent-core)"/>
        <text x={220 - spacing} y="96">q0</text><text x={280 + spacing} y="96">q1</text></svg></div>
      <label className="ent-distance">Pull apart / push together<input type="range" min="0" max="100" value={spacing} onChange={event => setSpacing(Number(event.target.value))} /></label>
      <div className="ent-stage-caption"><span>Concept illustration · spacing does not change the state</span><button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "Resume glow" : "Pause glow"}</button></div>
      <div className="ent-results" aria-live="polite">{snapshot ? <><h3>Joint outcomes · |q1 q0⟩</h3>{['00', '01', '10', '11'].map(basis => { const probability = snapshot.probabilities.find(p => p.basis === basis)?.probability ?? 0; return <div className="ent-result" key={basis}><span>|{basis}⟩</span><meter min="0" max="1" value={probability} aria-label={`Ideal probability of ${basis}`}/><span>{(probability * 100).toFixed(0)}% · {result?.counts?.[basis] ?? 0} shots</span></div>; })}</> : <p>Make a prediction: will the pair ever give different answers? Run the experiment to reveal the results.</p>}</div>
    </div></div>
    {snapshot && <div className="ent-local"><div><h3>Look inside either qubit</h3><p>{kind === "bell" ? "Each qubit alone is maximally mixed: its Bloch vector sits at the center, with purity 50%. The complete pair is still a pure, entangled state." : "Each independent qubit is in the pure |+⟩ state. Its Bloch vector points along +X, even though measuring Z still gives 50/50 outcomes."}</p><p>Entanglement cannot send a message faster than light. You cannot choose the random result on the other side.</p></div>{snapshot.bloch.map(qubit => <div key={qubit.qubit}><h3>Qubit {qubit.qubit}</h3><QuantumSphere vector={qubit} motionPaused label={`Qubit ${qubit.qubit} reduced state`} /></div>)}</div>}
  </section>;
}
