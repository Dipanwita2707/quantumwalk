"use client";

import { useMemo, useState } from "react";
import {
  SHOR_N_MAX,
  SHOR_N_MIN,
  gcd,
  isComposite,
  isShorValidationError,
  runShorEducationalWorkflow,
  type ShorRunResult,
} from "@/lib/shorEducational";

const COMPOSITE_CHOICES = Array.from({ length: SHOR_N_MAX - SHOR_N_MIN + 1 }, (_, i) => SHOR_N_MIN + i).filter(
  isComposite,
);

function defaultBase(N: number): number {
  for (let a = 2; a < N; a += 1) {
    if (gcd(a, N) === 1) return a;
  }
  return 2;
}

export function ShorEducationalLab() {
  const [N, setN] = useState(15);
  const [a, setA] = useState(7);
  const [runId, setRunId] = useState(0);

  const result = useMemo((): ShorRunResult | { ok: false; message: string } | null => {
    void runId;
    return runShorEducationalWorkflow(N, a);
  }, [N, a, runId]);

  const validationMessage = result && isShorValidationError(result) ? result.message : null;

  return (
    <div className="mapper-lab" data-testid="shor-lab">
      <p className="explorer-note" role="note">
        Educational Shor workflow (QuantumWalk-original). Classical steps (validation, continued fractions, gcd factors)
        are labeled separately from the ideal state-vector quantum simulation (QPE state plus inverse QFT on the counting
        register). Small composites N = {SHOR_N_MIN}–{SHOR_N_MAX} only; no cryptoscale speedup claim.
      </p>
      <section className="content-card" aria-labelledby="shor-controls-title">
        <h2 id="shor-controls-title">Experiment controls</h2>
        <label>
          Composite modulus N
          <select
            aria-label="Composite N"
            data-testid="shor-n"
            value={N}
            onChange={(e) => {
              const next = Number(e.target.value);
              setN(next);
              setA(defaultBase(next));
            }}
          >
            {COMPOSITE_CHOICES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          Base a (2 ≤ a &lt; N, coprime)
          <input
            type="number"
            min={2}
            max={N - 1}
            value={a}
            data-testid="shor-a"
            aria-label="Base a"
            onChange={(e) => setA(Number(e.target.value))}
          />
        </label>
        <div className="explorer-steps">
          <button type="button" data-testid="shor-run" aria-label="Run Shor educational workflow" onClick={() => setRunId((x) => x + 1)}>
            Run workflow
          </button>
          <button
            type="button"
            data-testid="shor-reset"
            onClick={() => {
              setN(15);
              setA(7);
              setRunId((x) => x + 1);
            }}
          >
            Reset
          </button>
        </div>
      </section>

      {validationMessage && (
        <p className="content-error" role="alert" data-testid="shor-validation">
          {validationMessage}
        </p>
      )}

      {result && !validationMessage && "steps" in result && (
        <>
          <section className="content-card" aria-labelledby="shor-steps-title">
            <h2 id="shor-steps-title">Step-by-step trace</h2>
            <ol data-testid="shor-steps">
              {result.steps.map((step, i) => (
                <li key={i} data-step-kind={step.kind}>
                  <strong>{step.title}</strong> — {step.detail}
                </li>
              ))}
            </ol>
          </section>

          <p data-testid="shor-simulation-mode" className="explorer-note">
            Mode: {result.quantumPlan ? "ideal quantum-state simulation + classical post-processing" : "classical reference only (no counting-register simulation)"}
          </p>

          {result.quantumPlan && (
            <section className="content-card">
              <h2>Quantum simulation summary</h2>
              <p data-testid="shor-quantum-summary">
                {result.quantumPlan.totalQubits} qubits ({result.quantumPlan.countingQubits} counting +{" "}
                {result.quantumPlan.workQubits} work). Inverse QFT uses the same convention as{" "}
                <a href="/academy/labs/qft">the QFT lab</a>.
              </p>
              {result.countingProbabilities && (
                <p data-testid="shor-measurement">
                  Simulated counting peaks (deterministic tie-break): c = {result.measuredCounting ?? "—"}; order from
                  measurement post-processing r = {result.orderFromMeasurement ?? "—"}.
                </p>
              )}
            </section>
          )}

          <section className="content-card" aria-labelledby="shor-outcome-title">
            <h2 id="shor-outcome-title">Outcome</h2>
            {result.factors?.ok ? (
              <p className="explorer-note" data-testid="shor-factors">
                Factors: {result.factors.p} × {result.factors.q} = {result.N} (via {result.factors.via}).
              </p>
            ) : (
              <p className="content-error" role="status" data-testid="shor-factors">
                {result.factors?.reason ?? "No non-trivial factors from this trial — try another base or repeat."}
              </p>
            )}
            {result.classicalReferenceOrder !== null && (
              <p className="explorer-note" data-testid="shor-classical-ref">
                Classical reference period (verification only, not the simulated measurement): r ={" "}
                {result.classicalReferenceOrder}.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
