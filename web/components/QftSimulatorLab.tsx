"use client";

import { useMemo, useState } from "react";
import {
  QFT_MAX_QUBITS,
  QFT_MIN_QUBITS,
  amplitudePhase,
  amplitudeProbability,
  applyForwardQft,
  applyInverseQft,
  basisState,
  formatBasisLabel,
  isQftValidationError,
  statesEqualUpToGlobalPhase,
  totalProbability,
  type QftStateVector,
} from "@/lib/qftSimulator";

type LabMode = "forward" | "inverse" | "roundtrip";

export function QftSimulatorLab() {
  const [qubits, setQubits] = useState(2);
  const [basisIndex, setBasisIndex] = useState(0);
  const [mode, setMode] = useState<LabMode>("forward");
  const [runId, setRunId] = useState(0);

  const inputState = useMemo((): QftStateVector | null => {
    void runId;
    const built = basisState(qubits, basisIndex);
    return isQftValidationError(built) ? null : built;
  }, [qubits, basisIndex, runId]);

  const result = useMemo((): { ok: true; label: string; state: QftStateVector; note?: string } | { ok: false; message: string } => {
    if (!inputState) return { ok: false, message: "Invalid input state." };
    if (mode === "forward") {
      const out = applyForwardQft(inputState);
      if (isQftValidationError(out)) return out;
      return { ok: true, label: "After forward QFT", state: out };
    }
    if (mode === "inverse") {
      const out = applyInverseQft(inputState);
      if (isQftValidationError(out)) return out;
      return { ok: true, label: "After inverse QFT", state: out };
    }
    const fwd = applyForwardQft(inputState);
    if (isQftValidationError(fwd)) return fwd;
    const back = applyInverseQft(fwd);
    if (isQftValidationError(back)) return back;
    const match = statesEqualUpToGlobalPhase(inputState, back);
    return {
      ok: true,
      label: "Forward QFT then inverse QFT",
      state: back,
      note: match ? "Recovered original state (up to global phase)." : "Round-trip mismatch — report if reproducible.",
    };
  }, [inputState, mode]);

  const dim = 2 ** qubits;

  return (
    <div className="mapper-lab" data-testid="qft-lab">
      <p className="explorer-note" role="note">
        Ideal state-vector simulation (QuantumWalk-original). Convention: basis index k = Σ b_i 2^i with q0 as LSB; forward
        QFT uses exp(2πijk/N)/√N. No swap layer — circuit diagrams in textbooks may reorder bits differently.
      </p>
      <section className="content-card" aria-labelledby="qft-controls-title">
        <h2 id="qft-controls-title">Experiment controls</h2>
        <label>
          Qubits ({QFT_MIN_QUBITS}–{QFT_MAX_QUBITS})
          <input
            type="range"
            min={QFT_MIN_QUBITS}
            max={QFT_MAX_QUBITS}
            value={qubits}
            aria-label="Number of qubits"
            data-testid="qft-qubits"
            onChange={(e) => {
              const n = Number(e.target.value);
              setQubits(n);
              setBasisIndex((i) => Math.min(i, 2 ** n - 1));
            }}
          />
          {qubits}
        </label>
        <label>
          Input basis state |x⟩
          <select
            aria-label="Input computational basis state"
            data-testid="qft-basis-index"
            value={basisIndex}
            onChange={(e) => setBasisIndex(Number(e.target.value))}
          >
            {Array.from({ length: dim }, (_, i) => (
              <option key={i} value={i}>
                |{formatBasisLabel(i, qubits)}⟩ (index {i})
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Transform</legend>
          <div className="explorer-steps" role="radiogroup" aria-label="QFT mode">
            {(
              [
                ["forward", "Forward QFT"],
                ["inverse", "Inverse QFT"],
                ["roundtrip", "Forward then inverse"],
              ] as const
            ).map(([id, label]) => (
              <label key={id}>
                <input
                  type="radio"
                  name="qft-mode"
                  checked={mode === id}
                  onChange={() => setMode(id)}
                />{" "}
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="explorer-steps">
          <button type="button" aria-label="Run QFT experiment" data-testid="qft-run" onClick={() => setRunId((n) => n + 1)}>
            Run
          </button>
          <button
            type="button"
            aria-label="Reset experiment"
            onClick={() => {
              setQubits(2);
              setBasisIndex(0);
              setMode("forward");
              setRunId((n) => n + 1);
            }}
          >
            Reset
          </button>
        </div>
      </section>

      {!result.ok && (
        <p className="content-error" role="alert" data-testid="qft-validation">
          {result.message}
        </p>
      )}

      {result.ok && inputState && (
        <>
          <section className="content-card" aria-labelledby="qft-input-title">
            <h2 id="qft-input-title">Input</h2>
            <p data-testid="qft-input-summary">
              |{formatBasisLabel(basisIndex, qubits)}⟩ · Σ|α|² = {totalProbability(inputState).toFixed(6)}
            </p>
          </section>
          <section className="content-card" aria-labelledby="qft-output-title">
            <h2 id="qft-output-title">{result.label}</h2>
            {result.note && <p className="explorer-note">{result.note}</p>}
            <div className="qft-table-wrap">
              <table data-testid="qft-amplitude-table">
                <caption>Amplitudes after transform (probability = |α|², phase = arg α)</caption>
                <thead>
                  <tr>
                    <th scope="col">Basis</th>
                    <th scope="col">Re(α)</th>
                    <th scope="col">Im(α)</th>
                    <th scope="col">Probability</th>
                    <th scope="col">Phase (rad)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.state.amplitudes.map((amp, i) => (
                    <tr key={i}>
                      <td>|{formatBasisLabel(i, result.state.qubits)}⟩</td>
                      <td>{amp.re.toFixed(4)}</td>
                      <td>{amp.im.toFixed(4)}</td>
                      <td>{amplitudeProbability(amp).toFixed(4)}</td>
                      <td>{amplitudePhase(amp).toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="explorer-note" data-testid="qft-norm">
              Total probability: {totalProbability(result.state).toFixed(6)} (ideal unitary preserves norm).
            </p>
          </section>
        </>
      )}
    </div>
  );
}
