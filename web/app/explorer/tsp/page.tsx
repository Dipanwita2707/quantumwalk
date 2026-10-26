"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { CircuitViewer } from "@/components/CircuitViewer";
import { TspMatrixEditor } from "@/components/TspMatrixEditor";
import { CIRCUIT_PRESETS } from "@/lib/circuitPresets";
import { ApiError } from "@/lib/api";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import { ExplorerHubNav } from "@/components/ExplorerHubNav";
import { buildGroverSolveRequest, postSolveTsp, resolveServicePath, type SolveTspResponse } from "@/lib/explorerBackend";
import { useExplorerBackendHealth } from "@/lib/useExplorerBackendHealth";
import { CITY_NAMES, TSP_ROUTES, routesWithin } from "@/lib/tspExplorer";
import {
  DEFAULT_TSP_MATRIX,
  cityLabel,
  classicalToursForMatrix,
  matrixToInputStrings,
  validateMatrixInputs,
  type MatrixValidationResult,
} from "@/lib/tspMatrixConfig";
import "../explorer.css";

const stages = [
  {
    title: "Encode",
    body: "Route labels map permutations to basis states. The education preset uses three qubits for six routes; the backend scales qubits with city count (3–6 cities).",
  },
  {
    title: "Mark",
    body: "Classically, several tours may sit at or below a cost threshold. The lab Grover preset marks one near-optimal route (lowest label) to fit the gate budget.",
  },
  {
    title: "Amplify",
    body: "Grover iterations boost marked routes before measurement.",
  },
  {
    title: "Depth",
    body: "Oracle depth grows with problem size — real hardware pays for depth with noise.",
  },
  {
    title: "Compare",
    body: "Classical brute force uses your matrix below. Ideal bars use the fixed education preset API; live samples use POST /api/v3/solve-tsp when the API is online.",
  },
];

type TspApi = {
  primary_bits: string;
  ideal_probabilities: Record<string, number>;
  note: string;
};

function formatRoute(order: number[]): string {
  return order.map((i) => cityLabel(i)).join(" → ");
}

function isDefaultThreeMatrix(inputs: string[][]): boolean {
  if (inputs.length !== 3) return false;
  const ref = matrixToInputStrings(DEFAULT_TSP_MATRIX);
  return inputs.every((row, i) => row.every((cell, j) => cell.trim() === ref[i][j]));
}

export default function TspExplorerPage() {
  const [stage, setStage] = useState(0);
  const [cityCount, setCityCount] = useState(3);
  const [matrixInputs, setMatrixInputs] = useState<string[][]>(() => matrixToInputStrings(DEFAULT_TSP_MATRIX));
  const [matrixValidation, setMatrixValidation] = useState<MatrixValidationResult | null>(null);
  const [tspApi, setTspApi] = useState<TspApi | null>(null);
  const [tspError, setTspError] = useState("");
  const { state: healthState, detail: healthDetail, check: checkHealth, checking, canRunBackendSolve } =
    useExplorerBackendHealth();
  const [solveLoading, setSolveLoading] = useState(false);
  const [solveError, setSolveError] = useState("");
  const [solveResult, setSolveResult] = useState<SolveTspResponse | null>(null);
  const solveAbort = useRef<AbortController | null>(null);

  const parsedMatrix = useMemo(() => validateMatrixInputs(matrixInputs), [matrixInputs]);
  const classicalTours = useMemo(() => {
    if (!parsedMatrix.ok) return [];
    const computed = classicalToursForMatrix(parsedMatrix.matrix);
    return computed ?? [];
  }, [parsedMatrix]);

  const useLegacyThreeCharts = cityCount === 3 && isDefaultThreeMatrix(matrixInputs);
  const displayRoutes = useLegacyThreeCharts ? TSP_ROUTES : classicalTours;
  const maxClassical = displayRoutes.length ? Math.max(...displayRoutes.map((r) => r.cost)) : 1;
  const minCost = displayRoutes.length ? Math.min(...displayRoutes.map((r) => r.cost)) : 0;
  const threshold = minCost + 1;
  const marked = useLegacyThreeCharts ? routesWithin(threshold) : displayRoutes.filter((r) => r.cost <= threshold);

  const matrixReady = parsedMatrix.ok;
  const solveDisabled = !canRunBackendSolve || solveLoading || !matrixReady;

  useEffect(() => {
    void fetch(resolveServicePath("/api/explorer/tsp"))
      .then((res) => {
        if (!res.ok) throw new Error("Could not load TSP reference.");
        return res.json() as Promise<TspApi>;
      })
      .then((data) => {
        setTspApi(data);
        setTspError("");
      })
      .catch((cause: unknown) => {
        setTspError(cause instanceof Error ? cause.message : "TSP reference unavailable.");
      });
  }, []);

  const quantumBars = useMemo(() => {
    if (!tspApi) return [];
    return Object.entries(tspApi.ideal_probabilities)
      .filter(([bits]) => Number.parseInt(bits, 2) < 6 || tspApi.ideal_probabilities[bits] > 0.001)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([bits, p]) => ({ bits, p }));
  }, [tspApi]);

  const runBackendSolve = useCallback(async () => {
    if (!canRunBackendSolve || solveLoading) return;
    const validation = validateMatrixInputs(matrixInputs);
    if (!validation.ok) {
      setSolveError(validation.message);
      return;
    }
    solveAbort.current?.abort();
    const controller = new AbortController();
    solveAbort.current = controller;
    setSolveLoading(true);
    setSolveError("");
    setSolveResult(null);
    try {
      const body = buildGroverSolveRequest(validation.matrix);
      const result = await postSolveTsp(body, controller.signal);
      if (!controller.signal.aborted) setSolveResult(result);
    } catch (cause: unknown) {
      if (controller.signal.aborted) return;
      if (cause instanceof ApiError) setSolveError(cause.message);
      else setSolveError("Backend solve failed.");
    } finally {
      if (solveAbort.current === controller) solveAbort.current = null;
      if (!controller.signal.aborted) setSolveLoading(false);
    }
  }, [canRunBackendSolve, solveLoading, matrixInputs]);

  useEffect(() => {
    return () => solveAbort.current?.abort();
  }, []);

  const healthLabel =
    healthState === "checking" ? "Checking API" : healthState === "online" ? "API online" : "API offline";

  return (
    <>
      <SiteHeader />
      <main className="content-shell explorer-hub-layout">
        <ExplorerHubNav />
        <div className="explorer-hub-main explorer-shell explorer-tsp">
        <p className="eyebrow">QUANTUM EXPLORER · TSP</p>
        <h1>
          {cityCount} cities · {displayRoutes.length.toLocaleString()} routes
        </h1>
        <GuestExperienceBanner context="explorer" />
        <div
          className="explorer-backend-status"
          data-state={healthState}
          role="status"
          aria-label="Backend API status"
          aria-live="polite"
          aria-busy={checking}
        >
          <span className="explorer-backend-dot" aria-hidden="true" />
          <p className="explorer-backend-status-text">
            <strong>{healthLabel}.</strong> {healthDetail}
          </p>
          <div className="explorer-backend-actions">
            <button type="button" onClick={() => void checkHealth()} disabled={checking}>
              {checking ? "Checking…" : "Check status"}
            </button>
          </div>
        </div>
        <p className="content-intro">
          Edit the directed distance matrix and city count (3–6), then run Grover sampling on the QuantumWalk API. Education
          presets and charts below stay separate from live backend results.
        </p>

        <TspMatrixEditor
          cityCount={cityCount}
          inputs={matrixInputs}
          onCityCountChange={setCityCount}
          onInputsChange={setMatrixInputs}
          validation={matrixValidation ?? (!parsedMatrix.ok ? parsedMatrix : null)}
          onValidationChange={setMatrixValidation}
        />

        {useLegacyThreeCharts && (
          <aside className="tsp-oracle-callout content-card" role="note">
            <span className="panel-kicker">WHY ONE MARKED ROUTE?</span>
            <p>
              Classically, up to <strong>three tours</strong> can sit at the same near-optimal cost on the default matrix.
              The lab preset marks <strong>one</strong> representative label (lowest id) so the Grover circuit stays within
              the 64-gate education budget.
            </p>
            <table className="tsp-threshold-table">
              <caption>Classical threshold vs lab oracle (simulator-grounded)</caption>
              <thead>
                <tr>
                  <th scope="col">View</th>
                  <th scope="col">Marked routes</th>
                  <th scope="col">Grover preset</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Classical (cost ≤ {threshold})</th>
                  <td>{marked.map((r) => r.bits).join(", ") || "—"}</td>
                  <td>All listed tours are equally good classically</td>
                </tr>
                <tr>
                  <th scope="row">Lab oracle</th>
                  <td>{tspApi?.primary_bits ?? "001"} (one label)</td>
                  <td>Single mark to fit ≤64 gates — not multi-route search</td>
                </tr>
              </tbody>
            </table>
          </aside>
        )}

        {!useLegacyThreeCharts && (
          <p className="explorer-note content-card" role="note">
            Lab circuit presets target the default 3-city example ({CITY_NAMES.join(", ")}). Classical charts below reflect
            your edited matrix; ideal preset bars remain the fixed education reference.
          </p>
        )}

        <div className="explorer-steps" aria-label="Explorer stages">
          {stages.map((item, index) => (
            <button
              key={item.title}
              type="button"
              className={index === stage ? "active" : index < stage ? "done" : ""}
              aria-current={index === stage ? "step" : undefined}
              onClick={() => setStage(index)}
            >
              {index + 1}. {item.title}
            </button>
          ))}
        </div>

        <article className="content-card">
          <h2>{stages[stage].title}</h2>
          <p>{stages[stage].body}</p>

          {stage === 1 && matrixReady && (
            <p className="explorer-note">
              Threshold cost ≤ {threshold}. Classically marked: {marked.map((r) => r.bits).join(", ") || "none"}.
              {useLegacyThreeCharts && tspApi && (
                <>
                  {" "}
                  Lab oracle marks |{tspApi.primary_bits}⟩ (one representative optimal tour).
                </>
              )}
            </p>
          )}

          {stage >= 4 ? (
            <div className="explorer-dual-chart">
              <section aria-labelledby="classical-chart-title">
                <h3 id="classical-chart-title">Classical brute force (your matrix)</h3>
                {!matrixReady && (
                  <p className="explorer-note" role="alert">
                    Fix matrix validation errors to see classical tours.
                  </p>
                )}
                {matrixReady && (
                  <>
                    <div className="explorer-chart">
                      {displayRoutes.map((route) => (
                        <div key={route.bits + route.id} className="explorer-bar-row">
                          <span title={route.label}>{route.bits}</span>
                          <div className="explorer-bar-track">
                            <div
                              className="explorer-bar-fill classical"
                              style={{ width: `${(route.cost / maxClassical) * 100}%` }}
                            />
                          </div>
                          <span>{route.cost}</span>
                        </div>
                      ))}
                    </div>
                    <p className="explorer-note">
                      Best classical cost: {minCost} (
                      {displayRoutes
                        .filter((r) => r.cost === minCost)
                        .map((r) => r.bits)
                        .join(", ")}
                      )
                    </p>
                  </>
                )}
              </section>
              <section aria-labelledby="quantum-chart-title">
                <h3 id="quantum-chart-title">Ideal preset reference (GET /api/explorer/tsp)</h3>
                {tspError && (
                  <p className="explorer-note" role="alert">
                    {tspError}
                  </p>
                )}
                {!tspApi && !tspError && <p className="explorer-note">Loading preset reference…</p>}
                {tspApi && (
                  <>
                    <div className="explorer-chart">
                      {quantumBars.map((bar) => (
                        <div key={bar.bits} className="explorer-bar-row">
                          <span>{bar.bits}</span>
                          <div className="explorer-bar-track">
                            <div className="explorer-bar-fill quantum" style={{ width: `${bar.p * 100}%` }} />
                          </div>
                          <span>{(bar.p * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                    <p className="explorer-note">{tspApi.note}</p>
                  </>
                )}
              </section>
            </div>
          ) : (
            matrixReady && (
              <div className="explorer-chart" aria-label="Route costs">
                {displayRoutes.map((route) => (
                  <div key={route.bits + route.id} className="explorer-bar-row">
                    <span title={route.label}>{route.bits}</span>
                    <div className="explorer-bar-track">
                      <div
                        className={`explorer-bar-fill ${route.cost <= threshold && stage >= 1 ? "marked" : ""}`}
                        style={{ width: `${(route.cost / maxClassical) * 100}%` }}
                      />
                    </div>
                    <span>{route.cost}</span>
                  </div>
                ))}
              </div>
            )
          )}

          <section className="explorer-solve-panel" aria-labelledby="backend-solve-title">
            <span className="panel-kicker">LIVE BACKEND (FASTAPI)</span>
            <h3 id="backend-solve-title">Grover TSP sampling</h3>
            <p className="explorer-note">
              Sends the edited matrix to <code>POST /api/v3/solve-tsp</code> (Grover, 1024 shots). Not the preset chart or
              lab circuits.
            </p>
            <button
              type="button"
              onClick={() => void runBackendSolve()}
              disabled={solveDisabled}
              aria-busy={solveLoading}
              data-testid="tsp-run-backend-solve"
            >
              {solveLoading ? "Running backend solve…" : "Run backend Grover solve"}
            </button>
            {!matrixReady && (
              <p className="explorer-note" role="alert" data-testid="tsp-solve-blocked-validation">
                Fix matrix validation errors before running a backend solve.
              </p>
            )}
            {!canRunBackendSolve && healthState === "offline" && (
              <p className="explorer-note" role="note">
                Backend solve is disabled while the API is offline. Use Check status after starting FastAPI.
              </p>
            )}
            {solveError && (
              <p className="explorer-note" role="alert" data-testid="tsp-solve-error">
                {solveError}
              </p>
            )}
            {solveResult && (
              <div
                className="explorer-solve-results"
                aria-label="Backend solve results"
                data-testid="tsp-backend-solve-results"
              >
                <p className="explorer-note" data-testid="tsp-backend-solve-summary">
                  Classical optimal: {solveResult.quantum_advantage.classical_optimal_distance}; quantum best:{" "}
                  {solveResult.quantum_advantage.quantum_optimal_distance}
                  {solveResult.quantum_advantage.found_optimal ? " (matched optimal)" : ""} —{" "}
                  {solveResult.execution_details.algorithm}, {solveResult.execution_details.shots} shots,{" "}
                  {(solveResult.execution_time * 1000).toFixed(0)} ms
                </p>
                {solveResult.quantum_solutions.slice(0, 6).map((row, index) => (
                  <div
                    key={`${row.bitstring ?? row.route.join("-")}-${row.measurement_count}`}
                    className="explorer-solve-row"
                    data-testid={`tsp-backend-solve-row-${index}`}
                  >
                    <span data-testid={`tsp-backend-solve-route-${index}`}>{formatRoute(row.route)}</span>
                    <span data-testid={`tsp-backend-solve-distance-${index}`}>cost {row.distance}</span>
                    <span data-testid={`tsp-backend-solve-probability-${index}`}>
                      {(row.probability * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </article>

        {useLegacyThreeCharts && stage >= 1 && stage < 3 && (
          <section className="content-card" aria-labelledby="tsp-encode-title">
            <span className="panel-kicker">EDUCATION PRESET (NOT BACKEND SOLVE)</span>
            <h2 id="tsp-encode-title">Equal superposition (encode)</h2>
            <CircuitViewer
              initialQubits={CIRCUIT_PRESETS.tsp3.qubits}
              initialOperations={CIRCUIT_PRESETS.tsp3.operations}
              demoPreset="tsp3"
              readonly
              title="Route encoding superposition"
              subtitle="Before the oracle — uniform ideal weights on each label."
              fullLabHref="/workspace?preset=tsp3"
            />
          </section>
        )}

        {useLegacyThreeCharts && stage >= 2 && (
          <section className="content-card" aria-labelledby="tsp-grover-title">
            <span className="panel-kicker">LAB PRESET · SIGN IN TO SIMULATE IN WORKSPACE</span>
            <h2 id="tsp-grover-title">Grover search preset</h2>
            <p>
              Sign in to run the full {CIRCUIT_PRESETS.tsp3grover.operations.length}-gate circuit in the lab; ideal peak on
              |{tspApi?.primary_bits ?? "001"}⟩.
            </p>
            <CircuitViewer
              initialQubits={CIRCUIT_PRESETS.tsp3grover.qubits}
              initialOperations={CIRCUIT_PRESETS.tsp3grover.operations}
              demoPreset="tsp3grover"
              readonly
              title="TSP Grover (bounded)"
              subtitle="Oracle + diffuser + measure — same JSON as the lab preset."
              fullLabHref="/workspace?preset=tsp3grover"
            />
          </section>
        )}

        <div className="explorer-nav">
          <button type="button" disabled={stage === 0} onClick={() => setStage((s) => s - 1)}>
            ← Back
          </button>
          <button type="button" disabled={stage === stages.length - 1} onClick={() => setStage((s) => s + 1)}>
            Next →
          </button>
          <Link className="card-action" href="/workspace?preset=tsp3grover">
            Open Grover preset in Lab →
          </Link>
          <Link className="card-action" href="/explorer/grover">
            Grover explorer →
          </Link>
        </div>
        </div>
      </main>
    </>
  );
}
