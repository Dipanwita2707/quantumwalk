"use client";

import { useMemo, useState } from "react";
import {
  SHOR_N_MAX,
  SHOR_N_MIN,
  SHOR_DEFAULT_SHOTS,
  SHOR_MAX_SHOTS,
  SHOR_MIN_SHOTS,
  SHOR_SIMULATION_PATH_LABELS,
  gcd,
  isComposite,
  isShorValidationError,
  runShorEducationalWorkflow,
  type ShorMeasurementPolicy,
  type ShorRunResult,
  type ShorSimulationPath,
} from "@/lib/shorEducational";

const COMPOSITE_CHOICES = Array.from({ length: SHOR_N_MAX - SHOR_N_MIN + 1 }, (_, i) => SHOR_N_MIN + i).filter(
  isComposite,
);

const PATH_OPTIONS: ShorSimulationPath[] = ["closed_direct", "closed_gate", "gate_e2e"];

function defaultBase(N: number): number {
  for (let a = 2; a < N; a += 1) {
    if (gcd(a, N) === 1) return a;
  }
  return 2;
}

export function ShorEducationalLab() {
  const [N, setN] = useState(15);
  const [a, setA] = useState(7);
  const [simulationPath, setSimulationPath] = useState<ShorSimulationPath>("closed_direct");
  const [measurementPolicy, setMeasurementPolicy] = useState<ShorMeasurementPolicy>("deterministic_peak");
  const [sampleSeed, setSampleSeed] = useState(1);
  const [shotCount, setShotCount] = useState(SHOR_DEFAULT_SHOTS);
  const [runId, setRunId] = useState(0);

  const result = useMemo((): ShorRunResult | { ok: false; message: string } | null => {
    void runId;
    return runShorEducationalWorkflow(N, a, {
      simulationPath,
      measurementPolicy,
      sampleSeed,
      shotCount,
    });
  }, [N, a, runId, simulationPath, measurementPolicy, sampleSeed, shotCount]);

  const validationMessage = result && isShorValidationError(result) ? result.message : null;

  return (
    <div className="mapper-lab" data-testid="shor-lab">
      <p className="explorer-note" role="note">
        Educational Shor workflow (QuantumWalk-original). Layers: classical post-processing (continued fractions, gcd),
        ideal state-vector simulation (selectable path below), and classical reference period (verification only). Not
        real hardware; orbit_compact work register, not a general value mod-mult.
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
        <label>
          Ideal simulation path
          <select
            aria-label="Simulation path"
            data-testid="shor-simulation-path"
            value={simulationPath}
            onChange={(e) => setSimulationPath(e.target.value as ShorSimulationPath)}
          >
            {PATH_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {SHOR_SIMULATION_PATH_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Measurement policy
          <select
            aria-label="Measurement policy"
            data-testid="shor-measurement-policy"
            value={measurementPolicy}
            onChange={(e) => setMeasurementPolicy(e.target.value as ShorMeasurementPolicy)}
          >
            <option value="deterministic_peak">Deterministic peak (teaching default)</option>
            <option value="multi_shot">Multi-shot Born sampling (ideal simulator)</option>
          </select>
        </label>
        {measurementPolicy === "multi_shot" && (
          <>
            <label>
              Shot count ({SHOR_MIN_SHOTS}–{SHOR_MAX_SHOTS})
              <input
                type="number"
                min={SHOR_MIN_SHOTS}
                max={SHOR_MAX_SHOTS}
                value={shotCount}
                data-testid="shor-shot-count"
                aria-label="Shot count"
                onChange={(e) => setShotCount(Number(e.target.value))}
              />
            </label>
            <label>
              Sample seed (uint32)
              <input
                type="number"
                min={0}
                value={sampleSeed}
                data-testid="shor-sample-seed"
                aria-label="Sample seed"
                onChange={(e) => setSampleSeed(Number(e.target.value))}
              />
            </label>
          </>
        )}
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
              setSimulationPath("closed_direct");
              setMeasurementPolicy("deterministic_peak");
              setSampleSeed(1);
              setShotCount(SHOR_DEFAULT_SHOTS);
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
            Active path:{" "}
            {result.simulationPath ? SHOR_SIMULATION_PATH_LABELS[result.simulationPath] : "classical reference only"} ·{" "}
            {result.measurementSemantics ?? "—"}
          </p>

          {result.quantumPlan && (
            <section className="content-card">
              <h2>Quantum simulation summary</h2>
              <p data-testid="shor-quantum-summary">
                {result.quantumPlan.totalQubits} qubits ({result.quantumPlan.countingQubits} counting +{" "}
                {result.quantumPlan.workQubits} work). Counting index c uses q0 = LSB; gate IQFT uses NC order + swap
                layer (QFT lab convention).
              </p>
              {result.countingProbabilities && (
                <p data-testid="shor-measurement">
                  Primary c = {result.measuredCounting ?? "—"}; order from post-processing r ={" "}
                  {result.orderFromMeasurement ?? "—"}.
                  {result.shotCount !== null ? ` ${result.shotCount} ideal Born samples (seed ${result.measurementSeed ?? "—"}).` : ""}{" "}
                  Theoretical P(c) from selected path — not hardware shots.
                </p>
              )}
              {result.multiShot && (
                <div data-testid="shor-multishot-histogram">
                  <h3>Observed vs theoretical counting outcomes</h3>
                  <p className="explorer-note">
                    Ideal state-vector Born sampling (mulberry32). Max |freq − P| ={" "}
                    {result.multiShot.maxAbsFrequencyDelta.toFixed(4)}; successful factor shots in sample:{" "}
                    {result.multiShot.shotsWithSuccessfulFactors} / {result.multiShot.shots}.
                  </p>
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">c</th>
                        <th scope="col">Observed count</th>
                        <th scope="col">Empirical freq</th>
                        <th scope="col">P(c) theory</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.multiShot.histogram.map((row) => (
                        <tr key={row.outcome}>
                          <td>{row.outcome}</td>
                          <td>{row.observedCount}</td>
                          <td>{row.observedFrequency.toFixed(4)}</td>
                          <td>{row.theoreticalProbability.toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {result.pathComparison && (
                <div className="explorer-note" data-testid="shor-path-comparison">
                  <p>Three-path comparison (counting marginals P(c), reference = closed-form + direct IQFT):</p>
                  {result.pathComparison.closedDirectVsClosedGate && (
                    <p>
                      vs closed+gate IQFT: Bhattacharyya{" "}
                      {result.pathComparison.closedDirectVsClosedGate.bhattacharyyaFidelity.toFixed(6)}, L1{" "}
                      {result.pathComparison.closedDirectVsClosedGate.l1Distance.toExponential(3)}, max |ΔP|{" "}
                      {result.pathComparison.closedDirectVsClosedGate.maxAbsoluteDifference.toExponential(3)}
                    </p>
                  )}
                  {result.pathComparison.closedDirectVsGateE2e && (
                    <p>
                      vs gate mod-exp + gate IQFT: Bhattacharyya{" "}
                      {result.pathComparison.closedDirectVsGateE2e.bhattacharyyaFidelity.toFixed(6)}, L1{" "}
                      {result.pathComparison.closedDirectVsGateE2e.l1Distance.toExponential(3)}, max |ΔP|{" "}
                      {result.pathComparison.closedDirectVsGateE2e.maxAbsoluteDifference.toExponential(3)}
                    </p>
                  )}
                  <p>{result.pathComparison.comparisonNote}</p>
                </div>
              )}
              {result.modexpComparison && (
                <div className="explorer-note" data-testid="shor-modexp-comparison">
                  <p>
                    Pre-IQFT prep: closed-form vs gate (H + controlled orbit permutations). Orbit r ={" "}
                    {result.modexpComparison.orbitSize}; state fidelity{" "}
                    {result.modexpComparison.preIqftStateFidelity.toFixed(8)}.
                  </p>
                  {(!result.modexpComparison.preIqftStatesAligned ||
                    !result.modexpComparison.distributionsAligned) && (
                    <p className="content-error" role="alert">
                      Gate and closed-form paths diverge beyond tolerance.
                    </p>
                  )}
                </div>
              )}
              {result.iqftComparison && (
                <div className="explorer-note" data-testid="shor-iqft-comparison">
                  <p>Closed-form prep: direct vs gate IQFT on counting register.</p>
                  {result.iqftComparison.gateIqftSupported ? (
                    <>
                      <p>
                        Bhattacharyya fidelity: {result.iqftComparison.bhattacharyyaFidelity?.toFixed(6) ?? "—"}; L1:{" "}
                        {result.iqftComparison.l1Distance?.toExponential(3) ?? "—"}; max |ΔP|:{" "}
                        {result.iqftComparison.maxAbsoluteDifference?.toExponential(3) ?? "—"}.
                      </p>
                      {!result.iqftComparison.distributionsAligned && (
                        <p className="content-error" role="alert">
                          Gate and direct IQFT marginals diverge beyond tolerance.
                        </p>
                      )}
                    </>
                  ) : (
                    <p>Gate-level IQFT comparison unavailable for this register width.</p>
                  )}
                </div>
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
