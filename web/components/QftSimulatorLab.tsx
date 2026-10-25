"use client";

import { useMemo, useState } from "react";
import {
  QFT_CUSTOM_MAX_QUBITS,
  QFT_MAX_QUBITS,
  QFT_MIN_QUBITS,
  amplitudePhase,
  amplitudeProbability,
  applyForwardQft,
  applyInverseQft,
  basisState,
  complex,
  equalSuperpositionState,
  formatBasisLabel,
  isQftValidationError,
  normalizeAmplitudes,
  plusOnQ0State,
  statesEqualUpToGlobalPhase,
  totalProbability,
  validateAmplitudeDrafts,
  type Complex,
  type QftStateVector,
} from "@/lib/qftSimulator";
import {
  buildForwardQftGateSteps,
  buildInverseQftGateSteps,
  gateSequenceVsDirectFidelity,
} from "@/lib/qftGates";

type LabMode = "forward" | "inverse" | "roundtrip";
type InputMode = "basis" | "custom";

function emptyCustomAmps(qubits: number): Complex[] {
  const dim = 2 ** qubits;
  return Array.from({ length: dim }, (_, i) => complex(i === 0 ? 1 : 0, 0));
}

function AmplitudeTable({ state, caption }: { state: QftStateVector; caption: string }) {
  return (
    <div className="qft-table-wrap">
      <table>
        <caption>{caption}</caption>
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
          {state.amplitudes.map((amp, i) => (
            <tr key={i}>
              <td>|{formatBasisLabel(i, state.qubits)}⟩</td>
              <td>{amp.re.toFixed(4)}</td>
              <td>{amp.im.toFixed(4)}</td>
              <td>{amplitudeProbability(amp).toFixed(4)}</td>
              <td>{amplitudePhase(amp).toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function QftSimulatorLab() {
  const [qubits, setQubits] = useState(2);
  const [basisIndex, setBasisIndex] = useState(0);
  const [inputMode, setInputMode] = useState<InputMode>("basis");
  const [customAmps, setCustomAmps] = useState<Complex[]>(() => emptyCustomAmps(2));
  const [mode, setMode] = useState<LabMode>("forward");
  const [runId, setRunId] = useState(0);

  const customCheck = useMemo(
    () => validateAmplitudeDrafts(qubits, customAmps),
    [qubits, customAmps],
  );

  const inputState = useMemo((): QftStateVector | null => {
    void runId;
    if (inputMode === "basis") {
      const built = basisState(qubits, basisIndex);
      return isQftValidationError(built) ? null : built;
    }
    if (!customCheck.ok) return null;
    if (!customCheck.isNormalized) return null;
    return { qubits, amplitudes: customAmps.map((a) => complex(a.re, a.im)) };
  }, [inputMode, qubits, basisIndex, customAmps, customCheck, runId]);

  const inputValidationMessage = useMemo(() => {
    if (inputMode === "custom" && customCheck.ok && !customCheck.isNormalized) {
      return `State not normalized (Σ|α|² = ${customCheck.totalProbability.toFixed(6)}). Use Normalize or edit amplitudes. Global phase does not change probabilities, but QFT requires a normalized input.`;
    }
    if (inputMode === "custom" && !customCheck.ok) return customCheck.message;
    return null;
  }, [inputMode, customCheck]);

  const result = useMemo((): { ok: true; label: string; state: QftStateVector; note?: string } | { ok: false; message: string } => {
    if (!inputState) {
      return { ok: false, message: inputValidationMessage ?? "Invalid input state." };
    }
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
  }, [inputState, mode, inputValidationMessage]);

  const gateSteps = useMemo(
    () => (mode === "inverse" ? buildInverseQftGateSteps(qubits) : buildForwardQftGateSteps(qubits)),
    [qubits, mode],
  );

  const gateFidelity = useMemo(() => {
    if (!inputState || mode === "roundtrip") return null;
    return gateSequenceVsDirectFidelity(inputState, mode === "inverse");
  }, [inputState, mode]);

  const dim = 2 ** qubits;
  const customAllowed = qubits <= QFT_CUSTOM_MAX_QUBITS;

  function resetAll() {
    setQubits(2);
    setBasisIndex(0);
    setInputMode("basis");
    setCustomAmps(emptyCustomAmps(2));
    setMode("forward");
    setRunId((n) => n + 1);
  }

  function applyPreset(preset: string) {
    if (preset.startsWith("basis:")) {
      const idx = Number(preset.split(":")[1]);
      setCustomAmps(emptyCustomAmps(qubits).map((_, i) => complex(i === idx ? 1 : 0, 0)));
      return;
    }
    if (preset === "equal") {
      const eq = equalSuperpositionState(qubits);
      if (!isQftValidationError(eq)) setCustomAmps(eq.amplitudes.map((a) => complex(a.re, a.im)));
    }
    if (preset === "plus-q0") {
      const plus = plusOnQ0State(qubits);
      if (!isQftValidationError(plus)) setCustomAmps(plus.amplitudes.map((a) => complex(a.re, a.im)));
    }
  }

  return (
    <div className="mapper-lab" data-testid="qft-lab">
      <p className="explorer-note" role="note">
        Ideal state-vector simulation (QuantumWalk-original). q0 is the LSB; no swap layer. Multiplying every amplitude by
        e^(iφ) (global phase) leaves measurement probabilities unchanged but is a different mathematical label for the
        same physical state.
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
              setCustomAmps((prev) => {
                const next = emptyCustomAmps(n);
                for (let i = 0; i < Math.min(prev.length, next.length); i += 1) next[i] = prev[i];
                return next;
              });
              if (n > QFT_CUSTOM_MAX_QUBITS) setInputMode("basis");
            }}
          />
          {qubits}
        </label>

        <fieldset>
          <legend>Input type</legend>
          <label>
            <input
              type="radio"
              name="qft-input-mode"
              checked={inputMode === "basis"}
              onChange={() => setInputMode("basis")}
            />{" "}
            Computational basis (all qubit counts)
          </label>
          <label>
            <input
              type="radio"
              name="qft-input-mode"
              checked={inputMode === "custom"}
              disabled={!customAllowed}
              onChange={() => setInputMode("custom")}
            />{" "}
            Custom amplitudes (≤{QFT_CUSTOM_MAX_QUBITS} qubits)
          </label>
        </fieldset>

        {inputMode === "basis" && (
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
        )}

        {inputMode === "custom" && customAllowed && (
          <div className="qft-custom-editor">
            <label>
              Preset
              <select
                aria-label="Amplitude preset"
                data-testid="qft-preset"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) applyPreset(e.target.value);
                }}
              >
                <option value="">Choose preset…</option>
                {Array.from({ length: dim }, (_, i) => (
                  <option key={i} value={`basis:${i}`}>
                    Basis |{formatBasisLabel(i, qubits)}⟩
                  </option>
                ))}
                <option value="equal">Equal superposition</option>
                <option value="plus-q0">|+⟩ on q0 (H|0…0⟩)</option>
              </select>
            </label>
            <p className="explorer-note">
              Edit real and imaginary parts. Probability for each basis component is |α|²; phase arg(α) is relative — only
              phase differences affect interference.
            </p>
            {customAmps.map((amp, i) => (
              <div key={i} className="qft-amp-row">
                <span>|{formatBasisLabel(i, qubits)}⟩</span>
                <label>
                  Re
                  <input
                    type="number"
                    step="any"
                    aria-label={`Real amplitude for ${formatBasisLabel(i, qubits)}`}
                    data-testid={`qft-amp-re-${i}`}
                    value={amp.re}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setCustomAmps((rows) => rows.map((r, j) => (j === i ? complex(v, r.im) : r)));
                    }}
                  />
                </label>
                <label>
                  Im
                  <input
                    type="number"
                    step="any"
                    aria-label={`Imaginary amplitude for ${formatBasisLabel(i, qubits)}`}
                    data-testid={`qft-amp-im-${i}`}
                    value={amp.im}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setCustomAmps((rows) => rows.map((r, j) => (j === i ? complex(r.re, v) : r)));
                    }}
                  />
                </label>
              </div>
            ))}
            <p data-testid="qft-custom-norm">
              Σ|α|² = {customCheck.ok ? customCheck.totalProbability.toFixed(6) : "—"}
            </p>
            <button
              type="button"
              aria-label="Normalize amplitude vector"
              data-testid="qft-normalize"
              onClick={() => {
                const norm = normalizeAmplitudes(qubits, customAmps);
                if (!isQftValidationError(norm)) setCustomAmps(norm.amplitudes.map((a) => complex(a.re, a.im)));
              }}
            >
              Normalize vector
            </button>
          </div>
        )}

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
                <input type="radio" name="qft-mode" checked={mode === id} onChange={() => setMode(id)} /> {label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="explorer-steps">
          <button type="button" aria-label="Run QFT experiment" data-testid="qft-run" onClick={() => setRunId((n) => n + 1)}>
            Run
          </button>
          <button type="button" aria-label="Reset experiment" data-testid="qft-reset" onClick={resetAll}>
            Reset
          </button>
        </div>
      </section>

      <section className="content-card" aria-labelledby="qft-circuit-title">
        <h2 id="qft-circuit-title">Gate decomposition (same convention)</h2>
        <p className="explorer-note">
          Order: q0 is wire index 0 (LSB). Controlled phases use control q, target j with angle pi divided by 2 to the
          power (j minus q). No swap gates.
          The lab verifies this decomposition against the direct DFT for n = 1; for n ≥ 2 check fidelity below when you
          run an experiment.
        </p>
        <ol data-testid="qft-gate-list">
          {gateSteps.map((step, i) => (
            <li key={i}>
              {step.kind === "H"
                ? `H on q${step.qubit}`
                : `${step.label} control q${step.control} → target q${step.target}`}
            </li>
          ))}
        </ol>
        {gateFidelity !== null && (
          <p data-testid="qft-gate-fidelity">
            Gate-sequence vs direct DFT fidelity: {gateFidelity.toFixed(6)} (1 = match up to global phase)
          </p>
        )}
      </section>

      {inputValidationMessage && (
        <p className="content-error" role="alert" data-testid="qft-validation">
          {inputValidationMessage}
        </p>
      )}

      {!result.ok && !inputValidationMessage && (
        <p className="content-error" role="alert" data-testid="qft-validation">
          {result.message}
        </p>
      )}

      {result.ok && inputState && (
        <>
          <section className="content-card" aria-labelledby="qft-input-title">
            <h2 id="qft-input-title">Input state</h2>
            <AmplitudeTable
              state={inputState}
              caption="Input amplitudes (probability = |α|², phase = arg α)"
            />
          </section>
          <section className="content-card" aria-labelledby="qft-output-title">
            <h2 id="qft-output-title">{result.label}</h2>
            {result.note && <p className="explorer-note">{result.note}</p>}
            <AmplitudeTable state={result.state} caption="Output after transform" />
            <p className="explorer-note" data-testid="qft-norm">
              Total probability: {totalProbability(result.state).toFixed(6)} (ideal unitary preserves norm).
            </p>
          </section>
        </>
      )}
    </div>
  );
}
