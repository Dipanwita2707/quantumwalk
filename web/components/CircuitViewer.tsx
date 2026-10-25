"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { api, useSession } from "@/lib/api";
import { QuantumSphere } from "@/components/QuantumSphere";
import "./CircuitViewer.css";

export type Gate = "h" | "x" | "y" | "z" | "s" | "t" | "rx" | "ry" | "rz" | "cx" | "cz" | "swap" | "measure";
export type Operation = { gate: Gate; target: number; control?: number; angle?: number };
export type Amplitude = { basis: string; real: number; imag: number };
export type Probability = { basis: string; probability: number };
export type Bloch = { qubit: number; x: number; y: number; z: number; purity: number };
export type Snapshot = { index: number; amplitudes: Amplitude[]; probabilities: Probability[]; bloch: Bloch[] };
export type Simulation = { qubits: number; shots: number; steps: Snapshot[]; counts: Record<string, number> | null; basis_order: string; mode: string };

interface CircuitViewerProps {
  initialQubits?: number;
  initialOperations?: Operation[];
  readonly?: boolean;
  editable?: boolean;
  title?: string;
  subtitle?: string;
  showBloch?: boolean;
  showStateVector?: boolean;
  challengeSlug?: string;
  onSolved?: () => void;
  fullLabHref?: string;
}

const AVAILABLE_GATES: Gate[] = ["h", "x", "y", "z", "s", "t", "rx", "ry", "rz", "cx", "cz", "swap", "measure"];
const TWO_QUBIT_GATES = new Set<Gate>(["cx", "cz", "swap"]);

export function CircuitViewer({
  initialQubits = 2,
  initialOperations = [],
  readonly = false,
  editable = false,
  title,
  subtitle,
  showBloch = true,
  showStateVector = true,
  challengeSlug,
  onSolved,
  fullLabHref,
}: CircuitViewerProps) {
  const { profile } = useSession();
  const csrfToken = profile?.authenticated ? profile.csrf_token : undefined;
  const [qubits, setQubits] = useState(initialQubits);
  const [operations, setOperations] = useState<Operation[]>(initialOperations);
  const [simData, setSimData] = useState<Simulation | null>(null);
  const [step, setStep] = useState(0);
  const [selectedQubit, setSelectedQubit] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Builder state when editable is true
  const [activeGate, setActiveGate] = useState<Gate>("h");
  const [targetQubit, setTargetQubit] = useState(0);
  const [controlQubit, setControlQubit] = useState(0);
  const [angle, setAngle] = useState("1.5708"); // pi/2
  
  // Challenge verification state
  const [verifying, setVerifying] = useState(false);
  const [challengeStatus, setChallengeStatus] = useState<{ solved?: boolean; message?: string } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync when initial operations change
  useEffect(() => {
    setQubits(initialQubits);
    setOperations(initialOperations);
    setStep(0);
  }, [initialQubits, initialOperations]);

  // Run simulation whenever circuit operations or qubits change
  useEffect(() => {
    if (!csrfToken) return;
    let active = true;
    async function runSim() {
      setBusy(true);
      setError("");
      try {
        const payload = {
          qubits,
          operations,
          shots: 1024,
        };
        const data = await api<Simulation>("/api/simulate", {
          method: "POST",
          body: JSON.stringify(payload),
        }, csrfToken);
        if (active) {
          setSimData(data);
          setStep((prev) => Math.min(prev, Math.max(0, data.steps.length - 1)));
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Simulation failed.");
        }
      } finally {
        if (active) setBusy(false);
      }
    }

    void runSim();
    return () => {
      active = false;
    };
  }, [qubits, operations, csrfToken]);

  // Auto-play state evolution
  useEffect(() => {
    if (!isPlaying || !simData || simData.steps.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setStep((prev) => (prev < simData.steps.length - 1 ? prev + 1 : 0));
    }, 1200);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, simData]);

  const currentSnapshot = simData?.steps[Math.min(step, (simData?.steps.length || 1) - 1)];
  const blochVector = currentSnapshot?.bloch[selectedQubit];

  function addGate() {
    if (readonly) return;
    const isTwo = TWO_QUBIT_GATES.has(activeGate);
    if (isTwo && targetQubit === controlQubit) {
      setError("Control and target qubits cannot be the same.");
      return;
    }
    const newOp: Operation = {
      gate: activeGate,
      target: targetQubit,
      control: isTwo ? controlQubit : undefined,
      angle: ["rx", "ry", "rz"].includes(activeGate) ? parseFloat(angle) || 0 : undefined,
    };
    setOperations((prev) => [...prev, newOp]);
    setError("");
  }

  function removeGate(index: number) {
    if (readonly) return;
    setOperations((prev) => prev.filter((_, i) => i !== index));
  }

  function clearCircuit() {
    if (readonly) return;
    setOperations([]);
  }

  async function handleChallengeSubmit() {
    if (!challengeSlug) return;
    setVerifying(true);
    setChallengeStatus(null);
    try {
      const res = await api<{ solved: boolean; saved: boolean }>(
        `/api/challenges/${challengeSlug}/submit`,
        {
          method: "POST",
          body: JSON.stringify({ circuit: { qubits, operations } }),
        },
        profile?.authenticated ? profile.csrf_token : undefined
      );
      if (res.solved) {
        setChallengeStatus({
          solved: true,
          message: `Mission Accomplished! Target quantum state successfully synthesized.${
            res.saved ? " Progress & XP recorded to your profile." : " (Sign in to permanently save progress)."
          }`,
        });
        if (onSolved) onSolved();
      } else {
        setChallengeStatus({
          solved: false,
          message: "Target state not matched yet. Inspect the statevector probability distribution below and adjust your gates.",
        });
      }
    } catch (err) {
      setChallengeStatus({
        solved: false,
        message: err instanceof Error ? err.message : "Submission verification failed.",
      });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="cv-container">
      {/* Header bar */}
      <div className="cv-header">
        <div className="cv-header-title">
          <span className="cv-badge-live">LIVE SIMULATOR</span>
          {title && <h3>{title}</h3>}
          {subtitle && <p className="cv-subtitle">{subtitle}</p>}
        </div>
        <div className="cv-header-actions">
          {fullLabHref && (
            <Link href={fullLabHref} className="cv-btn-lab" title="Open with complete gate library & advanced tools">
              Launch in Lab ↗
            </Link>
          )}
        </div>
      </div>

      {error && <div className="cv-error" role="alert">⚠ {error}</div>}

      {/* Circuit wire diagram */}
      <div className="cv-circuit-board">
        <div className="cv-wires-container">
          {Array.from({ length: qubits }).map((_, qIdx) => (
            <div key={qIdx} className={`cv-wire-row ${selectedQubit === qIdx ? "active-qubit" : ""}`}>
              <div 
                className="cv-qubit-label" 
                onClick={() => setSelectedQubit(qIdx)}
                title="Click to view Bloch Sphere for this qubit"
              >
                <span>q[{qIdx}]</span>
                <small>{selectedQubit === qIdx ? "inspecting" : ""}</small>
              </div>
              <div className="cv-wire-line">
                <div className="cv-wire-track" />
                <div className="cv-gates-slot-list">
                  {operations.map((op, opIdx) => {
                    const isTarget = op.target === qIdx;
                    const isControl = op.control === qIdx;
                    if (!isTarget && !isControl) {
                      return <div key={opIdx} className="cv-gate-pass" />;
                    }

                    return (
                      <div
                        key={opIdx}
                        className={`cv-gate-chip ${isControl ? "cv-gate-control" : "cv-gate-target"} ${
                          step === opIdx + 1 ? "cv-gate-current" : ""
                        }`}
                        title={`${op.gate.toUpperCase()} on q${op.target}${op.control !== undefined ? ` (ctrl q${op.control})` : ""}`}
                      >
                        {isControl ? (
                          <span className="cv-dot-ctrl">●</span>
                        ) : (
                          <span className="cv-gate-symbol">{op.gate.toUpperCase()}</span>
                        )}
                        {!readonly && editable && (
                          <button
                            type="button"
                            className="cv-remove-gate"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeGate(opIdx);
                            }}
                            title="Remove gate"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {operations.length === 0 && (
                    <div className="cv-wire-empty">|0⟩ (Identity ground state)</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Controls & Step Evolution */}
      <div className="cv-playback-bar">
        <div className="cv-step-controls">
          <button
            type="button"
            className="cv-ctrl-btn"
            disabled={step <= 0 || busy}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            title="Step Back"
          >
            ◀
          </button>
          <button
            type="button"
            className={`cv-ctrl-btn cv-play-btn ${isPlaying ? "playing" : ""}`}
            disabled={!simData || simData.steps.length <= 1 || busy}
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause Evolution" : "Auto-play Evolution"}
          >
            {isPlaying ? "❚❚ Pause" : "▶ Play Evolution"}
          </button>
          <button
            type="button"
            className="cv-ctrl-btn"
            disabled={!simData || step >= simData.steps.length - 1 || busy}
            onClick={() => setStep((s) => (simData ? Math.min(simData.steps.length - 1, s + 1) : s))}
            title="Step Forward"
          >
            ▶
          </button>
          <span className="cv-step-counter">
            Step <strong>{step}</strong> / {simData ? simData.steps.length - 1 : operations.length}
          </span>
        </div>

        <div className="cv-status-telemetry">
          <span className="cv-telemetry-badge">
            Hilbert Dim: <strong>2^{qubits} = {Math.pow(2, qubits)}</strong>
          </span>
          <span className={`cv-telemetry-state ${busy ? "busy" : "ready"}`}>
            {busy ? "● Simulating…" : "✓ Coherent"}
          </span>
        </div>
      </div>

      {/* Optional Mini-Builder (For Challenges & Experimentation) */}
      {editable && (
        <div className="cv-builder-tray">
          <div className="cv-tray-title">Add Quantum Operation:</div>
          <div className="cv-tray-controls">
            <div className="cv-gate-select-row">
              {AVAILABLE_GATES.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`cv-gate-pill ${activeGate === g ? "selected" : ""}`}
                  onClick={() => setActiveGate(g)}
                >
                  {g.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="cv-gate-params">
              <label>
                Target Qubit:
                <select value={targetQubit} onChange={(e) => setTargetQubit(Number(e.target.value))}>
                  {Array.from({ length: qubits }).map((_, i) => (
                    <option key={i} value={i}>q[{i}]</option>
                  ))}
                </select>
              </label>

              {TWO_QUBIT_GATES.has(activeGate) && (
                <label>
                  Control Qubit:
                  <select value={controlQubit} onChange={(e) => setControlQubit(Number(e.target.value))}>
                    {Array.from({ length: qubits }).map((_, i) => (
                      <option key={i} value={i}>q[{i}]</option>
                    ))}
                  </select>
                </label>
              )}

              {["rx", "ry", "rz"].includes(activeGate) && (
                <label>
                  Angle θ (rad):
                  <input
                    type="number"
                    step="0.1"
                    value={angle}
                    onChange={(e) => setAngle(e.target.value)}
                  />
                </label>
              )}

              <button type="button" className="cv-add-btn" onClick={addGate}>
                + Append Gate
              </button>
              {operations.length > 0 && (
                <button type="button" className="cv-clear-btn" onClick={clearCircuit}>
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Challenge verification button & result */}
      {challengeSlug && (
        <div className="cv-challenge-zone">
          <button
            type="button"
            className="cv-submit-challenge-btn"
            disabled={verifying || busy}
            onClick={handleChallengeSubmit}
          >
            {verifying ? "Checking against Quantum Oracles…" : "✦ Verify Circuit & Submit Challenge"}
          </button>
          {challengeStatus && (
            <div className={`cv-challenge-status ${challengeStatus.solved ? "solved" : "failed"}`}>
              <div className="cv-status-icon">{challengeStatus.solved ? "🏆" : "✖"}</div>
              <div className="cv-status-text">{challengeStatus.message}</div>
            </div>
          )}
        </div>
      )}

      {/* Quantum Diagnostics Grid: State Vector & Bloch Sphere */}
      <div className="cv-diagnostics-grid">
        {/* State Vector Probabilities */}
        {showStateVector && (
          <div className="cv-diag-card">
            <div className="cv-card-header">
              <h4>State Vector Probabilities</h4>
              <small>|ψ⟩ at Step {step}</small>
            </div>
            <div className="cv-probabilities-list">
              {currentSnapshot?.probabilities.map((prob) => {
                const pct = (prob.probability * 100).toFixed(1);
                const amp = currentSnapshot.amplitudes.find((a) => a.basis === prob.basis);
                const ampStr = amp ? `${amp.real.toFixed(2)} + ${amp.imag.toFixed(2)}i` : "";

                return (
                  <div key={prob.basis} className="cv-prob-row">
                    <div className="cv-prob-basis">|{prob.basis}⟩</div>
                    <div className="cv-prob-bar-wrapper">
                      <div
                        className="cv-prob-bar-fill"
                        style={{ width: `${Math.max(prob.probability * 100, 0)}%` }}
                      />
                    </div>
                    <div className="cv-prob-values">
                      <strong>{pct}%</strong>
                      <span className="cv-amp-label" title={`Amplitude: ${ampStr}`}>
                        {amp ? `(${amp.real.toFixed(2)}, ${amp.imag.toFixed(2)}i)` : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Bloch Sphere Visualizer */}
        {showBloch && (
          <div className="cv-diag-card cv-bloch-card">
            <div className="cv-card-header">
              <h4>Qubit q[{selectedQubit}] Bloch Sphere</h4>
              <small>Local State Representation</small>
            </div>
            <div className="cv-sphere-wrapper">
              <QuantumSphere
                vector={{
                  x: blochVector?.x ?? 0,
                  y: blochVector?.y ?? 0,
                  z: blochVector?.z ?? 1,
                }}
              />
            </div>
            {blochVector && (
              <div className="cv-bloch-coords">
                <span>X: {blochVector.x.toFixed(3)}</span>
                <span>Y: {blochVector.y.toFixed(3)}</span>
                <span>Z: {blochVector.z.toFixed(3)}</span>
                <span>Purity: {(blochVector.purity * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
