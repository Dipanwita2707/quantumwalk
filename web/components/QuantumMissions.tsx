"use client";

import { useState } from "react";
import Link from "next/link";
import { api, useSession } from "@/lib/api";
import { demoSimulateCircuit } from "@/lib/demoSimulate";
import { QuantumSphere } from "./QuantumSphere";
import type { Operation, Simulation } from "./CircuitViewer";
import "./quantum-missions.css";

const missions = [
  { title: "Split a possibility", badge: "Possibility explorer", question: "After H, what can measuring this qubit reveal?", choices: ["Only 0", "0 or 1, equally likely", "Only 1"], answer: 1, qubits: 1, gates: [{ gate: "h", target: 0 }] as Operation[], story: ["Begin at |0⟩. A Z-basis measurement would give 0 with certainty.", "H creates |+⟩. The two amplitudes have equal size, so 0 and 1 each have probability 50%. This is a coherent quantum state, not a recorded coin toss."], insight: "The length of each amplitude determines its measurement probability. Square its magnitude to get that probability." },
  { title: "Reveal the invisible phase", badge: "Interference detective", question: "H, then Z, then H. What will the final measurement give?", choices: ["Always 0", "0 or 1, equally likely", "Always 1"], answer: 2, qubits: 1, gates: [{ gate: "h", target: 0 }, { gate: "z", target: 0 }, { gate: "h", target: 0 }] as Operation[], story: ["Start at |0⟩. Follow the amplitudes as well as the probabilities.", "The first H creates equal positive amplitudes for 0 and 1.", "Z reverses the sign of the 1 amplitude. The probabilities stay 50/50, but the relative phase has changed.", "The last H mixes the amplitudes. The paths to 0 cancel; the paths to 1 reinforce. The result is |1⟩."], insight: "Phase can be invisible in one measurement basis, yet change the result after another gate. Removing Z makes H followed by H return to |0⟩." },
  { title: "Connect two outcomes", badge: "Entanglement explorer", question: "H on q0, then controlled-X to q1. Which paired outcomes can appear?", choices: ["Only 00 and 11", "All four pairs equally", "Only 01 and 10"], answer: 0, qubits: 2, gates: [{ gate: "h", target: 0 }, { gate: "cx", control: 0, target: 1 }] as Operation[], story: ["Both qubits begin at 0: |00⟩. Labels read q1 then q0.", "H on q0 creates equal amplitudes for |00⟩ and |01⟩. The pair is not entangled yet.", "Controlled-X maps |01⟩ to |11⟩ while leaving |00⟩ unchanged. The Bell pair has only matching Z-basis outcomes. Each individual qubit is maximally mixed."], insight: "The shared pure state contains correlations that neither qubit alone describes. You cannot choose a remote outcome or send a faster-than-light message." },
] as const;

function AmplitudeArrow({ amplitude }: { amplitude: { basis: string; real: number; imag: number } }) {
  const angle = Math.atan2(amplitude.imag, amplitude.real);
  const magnitude = Math.min(1, Math.hypot(amplitude.real, amplitude.imag));
  const cx = 26;
  const cy = 26;
  const len = 21 * magnitude;
  const x2 = cx + len * Math.cos(angle);
  const y2 = cy - len * Math.sin(angle);
  const id = `qm-arr-${amplitude.basis}`;
  return (
    <svg viewBox="0 0 52 52" role="img" aria-label={`Amplitude ${amplitude.real.toFixed(3)} real, ${amplitude.imag.toFixed(3)} imaginary`}>
      <defs>
        <marker id={id} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#9bf6de" />
        </marker>
      </defs>
      <circle cx={cx} cy={cy} r="22" />
      <path d="M4 26H48M26 4V48" stroke="#6075954a" fill="none" />
      {magnitude > 0.02 && (
        <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="#9bf6de" strokeWidth="2.5" markerEnd={`url(#${id})`} />
      )}
      {magnitude <= 0.02 && <circle cx={cx} cy={cy} r="2" fill="#607595" />}
      {magnitude > 0.02 && <circle className="qm-tip" cx={x2} cy={y2} r="2.5" />}
    </svg>
  );
}

export function QuantumMissions() {
  const { profile } = useSession();
  const isGuest = !profile?.authenticated;
  const [missionIndex, setMissionIndex] = useState(0);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [result, setResult] = useState<Simulation | null>(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [withoutPhase, setWithoutPhase] = useState(false);
  const [discoveries, setDiscoveries] = useState<number[]>([]);
  const [observed, setObserved] = useState<number[]>([]);
  const mission = missions[missionIndex];
  const gates = withoutPhase ? mission.gates.filter((op) => op.gate !== "z") : mission.gates;
  const snapshot = result?.steps[step];
  const revealed = !!result && step === gates.length + 1;
  const earned = discoveries.includes(missionIndex);
  const canClaim = revealed && Array.from({ length: gates.length + 2 }, (_, index) => index).every((index) => observed.includes(index));
  const narrative = revealed
    ? "These counts come from 1,024 freshly prepared circuits measured in the Z basis. The state display below remains the ideal state before measurement; it is not a collapsed single-shot trajectory."
    : withoutPhase && step === 2
      ? "With Z removed, the second H undoes the first. The 1 amplitude cancels and the state returns to |0⟩."
      : mission.story[step];

  function resetExperiment() {
    setResult(null);
    setStep(0);
    setObserved([]);
    setError("");
  }

  function visit(next: number) {
    setStep(next);
    setObserved((previous) => (previous.includes(next) ? previous : [...previous, next]));
  }

  async function run() {
    if (busy || prediction === null) return;
    setBusy(true);
    setError("");
    const operations: Operation[] = [
      ...gates,
      ...Array.from({ length: mission.qubits }, (_, target): Operation => ({ gate: "measure", target })),
    ];
    try {
      let data: Simulation;
      if (profile?.authenticated && profile.csrf_token) {
        data = await api<Simulation>(
          "/api/simulate",
          { method: "POST", body: JSON.stringify({ qubits: mission.qubits, operations, shots: 1024 }) },
          profile.csrf_token,
        );
      } else {
        data = (await demoSimulateCircuit({
          qubits: mission.qubits,
          operations,
          shots: 1024,
        })) as Simulation;
      }
      setResult(data);
      setStep(0);
      setObserved([0]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The experiment could not run. Your prediction is kept; try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="qm" id="quantum-missions" aria-labelledby="qm-title">
      <header className="qm-header">
        <div>
          <p className="qm-kicker">QUANTUM MISSIONS / LEARN BY DOING</p>
          <h2 id="qm-title">
            Don’t just run it.
            <br />
            <span>See why it happens.</span>
          </h2>
          <p>Predict → experiment → use the step timeline → discover.</p>
        </div>
        <div className="qm-progress">
          <strong>
            {discoveries.length}
            <small> / 3</small>
          </strong>
          <span>discoveries this visit</span>
          <progress max={3} value={discoveries.length} aria-label="Missions discovered this visit" />
        </div>
      </header>
      <nav className="qm-missions" aria-label="Quantum missions">
        {missions.map((item, index) => (
          <button
            type="button"
            key={item.title}
            disabled={busy}
            aria-pressed={missionIndex === index}
            onClick={() => {
              setMissionIndex(index);
              setPrediction(null);
              setWithoutPhase(false);
              resetExperiment();
            }}
          >
            <span>{discoveries.includes(index) ? "✓" : `0${index + 1}`}</span>
            {item.title}
          </button>
        ))}
      </nav>
      <div className="qm-body">
        <div className="qm-brief">
          <p className="qm-kicker">01 / MAKE A PREDICTION</p>
          <h3>{withoutPhase ? "Remove Z: what will H followed by H reveal?" : mission.question}</h3>
          <div className="qm-choices">
            {mission.choices.map((choice, index) => (
              <button
                type="button"
                key={choice}
                disabled={busy || !!result}
                aria-pressed={prediction === index}
                onClick={() => setPrediction(index)}
              >
                <span>{String.fromCharCode(65 + index)}</span>
                {choice}
              </button>
            ))}
          </div>
          <p className="qm-note">A guess is enough. Discoveries reward exploring every step, not guessing correctly.</p>
          {missionIndex === 1 && (
            <label className="qm-toggle">
              <input
                type="checkbox"
                checked={withoutPhase}
                disabled={busy}
                onChange={(event) => {
                  setWithoutPhase(event.target.checked);
                  setPrediction(null);
                  resetExperiment();
                }}
              />
              What if I remove the Z gate?
            </label>
          )}
          {isGuest && (
            <p className="qm-guest-note" role="status">
              Guest demo: experiments run on the public simulator.{" "}
              <Link href="/login?return_to=%2Fworkspace%3Fmode%3Dwhiteboard%23quantum-missions">Sign in</Link> to sync progress.
            </p>
          )}
          <button
            className="qm-run"
            type="button"
            disabled={busy || prediction === null}
            onClick={() => {
              if (result) resetExperiment();
              void run();
            }}
          >
            {busy ? "Preparing your experiment…" : result ? "Restart experiment ↻" : "Enter the experiment →"}
          </button>
          {error && <p role="alert">{error}</p>}
          {revealed && (
            <div className="qm-feedback" role="status">
              <strong>
                {prediction === (withoutPhase ? 0 : mission.answer)
                  ? "Your prediction matches the ideal result."
                  : "A surprising result is a useful discovery."}
              </strong>
              <p>{mission.insight}</p>
            </div>
          )}
        </div>
        <div className="qm-theatre">
          <p className="qm-kicker">02 / LOOK BEHIND THE RESULT</p>
          <div className="qm-timeline" aria-label="Experiment steps">
            {["Prepare", ...gates.map((op) => `${op.gate.toUpperCase()} · q${op.target}${op.control !== undefined ? ` ← q${op.control}` : ""}`), "Measure"].map((title, index) => (
              <button
                key={`${title}-${index}`}
                type="button"
                disabled={!result}
                aria-current={step === index ? "step" : undefined}
                onClick={() => visit(index)}
              >
                <small>{index === 0 ? "START" : `STEP ${index}`}</small>
                {title}
              </button>
            ))}
          </div>
          {!snapshot ? (
            <div className="qm-wait">
              <span aria-hidden="true">|ψ⟩</span>
              <h3>Your prediction opens the experiment.</h3>
              <p>After you run, use the step buttons above to walk through each gate. Bloch sphere and amplitude arrows update every step.</p>
            </div>
          ) : (
            <>
              <div className="qm-narrative" aria-live="polite">
                <strong>{revealed ? "Measurement results" : step === 0 ? "The starting state" : `After ${gates[step - 1]?.gate.toUpperCase()}`}</strong>
                <p>{narrative}</p>
              </div>
              <div className="qm-state">
                <div className="qm-amplitudes">
                  <h3>Possibility paths</h3>
                  <p className="qm-note">Each arrow is a complex amplitude: direction = phase, length = magnitude. Probability = magnitude².</p>
                  {snapshot.amplitudes.map((amplitude) => {
                    const probability = snapshot.probabilities.find((p) => p.basis === amplitude.basis)?.probability ?? 0;
                    return (
                      <div className="qm-path" key={amplitude.basis}>
                        <span>|{amplitude.basis}⟩</span>
                        <AmplitudeArrow amplitude={amplitude} />
                        <div>
                          <meter min={0} max={1} value={probability} aria-label={`Probability of ${amplitude.basis}`} />
                          <span>
                            {(probability * 100).toFixed(0)}% chance
                            {revealed ? ` · ${result?.counts?.[amplitude.basis] ?? 0} shots` : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="qm-bloch-wrap">
                  <h3>Inside qubit 0</h3>
                  <QuantumSphere vector={snapshot.bloch[0]} autoRotate={false} motionPaused={false} showTrajectory={step > 0} />
                  <p className="qm-note">
                    {mission.qubits === 2
                      ? "This sphere shows q0 alone. The possibility paths describe the full pair."
                      : "Pink arrow on the sphere is the Bloch vector for this step."}
                  </p>
                </div>
              </div>
              <div className="qm-playback">
                <button type="button" disabled={step === 0} onClick={() => visit(step - 1)}>
                  ← Rewind one step
                </button>
                <span>
                  {step} / {gates.length + 1}
                </span>
                <button type="button" disabled={revealed} onClick={() => visit(step + 1)}>
                  {step === gates.length ? "Reveal measurements →" : "Apply next gate →"}
                </button>
              </div>
              {revealed && (
                <div className="qm-discovery">
                  <div>
                    <strong>{earned ? `✓ ${mission.badge}` : "03 / CLAIM YOUR DISCOVERY"}</strong>
                    <p>{canClaim ? "You explored every step of this experiment." : "Visit every step in the timeline to earn this discovery."}</p>
                  </div>
                  <button
                    type="button"
                    disabled={!canClaim || earned}
                    onClick={() => setDiscoveries((previous) => (previous.includes(missionIndex) ? previous : [...previous, missionIndex]))}
                  >
                    {earned ? "Discovery earned" : "Claim discovery ✧"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <footer>
        Ideal simulator · Measurement counts are sampled · Discovery badges last for this visit.{" "}
        <Link href="/workspace?mode=circuit#circuit">Open full circuit lab (drag-and-drop gates) ↓</Link>
      </footer>
    </section>
  );
}
