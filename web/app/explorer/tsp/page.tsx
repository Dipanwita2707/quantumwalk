"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { CircuitViewer } from "@/components/CircuitViewer";
import { CIRCUIT_PRESETS } from "@/lib/circuitPresets";
import { ApiError } from "@/lib/api";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import {
  buildThreeCitySolveRequest,
  postSolveTsp,
  resolveServicePath,
  type SolveTspResponse,
} from "@/lib/explorerBackend";
import { useExplorerBackendHealth } from "@/lib/useExplorerBackendHealth";
import {
  CITY_NAMES,
  DISTANCE,
  TSP_ROUTES,
  minTourCost,
  optimalRoutes,
  routesWithin,
} from "@/lib/tspExplorer";
import "../explorer.css";

const stages = [
  {
    title: "Encode",
    body: "Six permutations of three cities become six basis labels. We use three qubits (000–101); 110 and 111 are unused padding.",
  },
  {
    title: "Mark",
    body: "Classically, several tours may sit at or below a cost threshold. The lab Grover preset marks one near-optimal route (lowest label) to fit the gate budget.",
  },
  {
    title: "Amplify",
    body: "One Grover pass boosts that marked route’s ideal probability before measurement.",
  },
  {
    title: "Depth",
    body: "42 gates including Toffoli-style oracles — real hardware pays for depth with noise.",
  },
  {
    title: "Compare",
    body: "Classical brute force checks all six tours. Ideal bars come from the education preset API; live samples come from POST /api/v3/solve-tsp when the API is online.",
  },
];

type TspApi = {
  primary_bits: string;
  ideal_probabilities: Record<string, number>;
  note: string;
};

const maxClassical = Math.max(...TSP_ROUTES.map((r) => r.cost));

function formatRoute(order: number[]): string {
  return order.map((i) => CITY_NAMES[i] ?? String(i)).join(" → ");
}

export default function TspExplorerPage() {
  const [stage, setStage] = useState(0);
  const [tspApi, setTspApi] = useState<TspApi | null>(null);
  const [tspError, setTspError] = useState("");
  const { state: healthState, detail: healthDetail, check: checkHealth, checking, canRunBackendSolve } =
    useExplorerBackendHealth();
  const [solveLoading, setSolveLoading] = useState(false);
  const [solveError, setSolveError] = useState("");
  const [solveResult, setSolveResult] = useState<SolveTspResponse | null>(null);
  const solveAbort = useRef<AbortController | null>(null);

  const minCost = minTourCost();
  const threshold = minCost + 1;
  const marked = useMemo(() => routesWithin(threshold), [threshold]);

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
    solveAbort.current?.abort();
    const controller = new AbortController();
    solveAbort.current = controller;
    setSolveLoading(true);
    setSolveError("");
    try {
      const body = buildThreeCitySolveRequest(DISTANCE);
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
  }, [canRunBackendSolve, solveLoading]);

  useEffect(() => {
    return () => solveAbort.current?.abort();
  }, []);

  const healthLabel =
    healthState === "checking"
      ? "Checking API"
      : healthState === "online"
        ? "API online"
        : "API offline";

  return (
    <>
      <SiteHeader />
      <main className="content-shell explorer-shell explorer-tsp">
        <p className="eyebrow">QUANTUM EXPLORER · TSP</p>
        <h1>Three cities, six routes</h1>
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
          Classical tour costs, education presets in the lab, and optional live Grover sampling on the QuantumWalk API
          (same matrix as below).
        </p>
        <aside className="tsp-oracle-callout content-card" role="note">
          <span className="panel-kicker">WHY ONE MARKED ROUTE?</span>
          <p>
            Classically, up to <strong>three tours</strong> can sit at the same near-optimal cost. The lab preset marks{" "}
            <strong>one</strong> representative label (lowest id) so the Grover circuit stays within the 64-gate education
            budget. Compare charts honestly: brute force lists every tour; ideal quantum bars use the preset reference;
            backend solve shows measured samples from FastAPI.
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

          {stage === 0 && (
            <div className="tsp-matrix" aria-label="City distance matrix">
              <table>
                <caption>Tour leg costs (one-way)</caption>
                <thead>
                  <tr>
                    <th scope="col" />
                    {CITY_NAMES.map((name) => (
                      <th key={name} scope="col">
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CITY_NAMES.map((from, i) => (
                    <tr key={from}>
                      <th scope="row">{from}</th>
                      {CITY_NAMES.map((to, j) => (
                        <td key={to}>{DISTANCE[i][j]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {stage === 1 && (
            <p className="explorer-note">
              Threshold cost ≤ {threshold}. Classically marked: {marked.map((r) => r.bits).join(", ") || "none"}.
              {tspApi && (
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
                <h3 id="classical-chart-title">Classical brute force</h3>
                <div className="explorer-chart">
                  {TSP_ROUTES.map((route) => (
                    <div key={route.bits} className="explorer-bar-row">
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
                  Best classical cost: {minCost} ({optimalRoutes().map((r) => r.bits).join(", ")})
                </p>
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
            <div className="explorer-chart" aria-label="Route costs">
              {TSP_ROUTES.map((route) => (
                <div key={route.bits} className="explorer-bar-row">
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
          )}

          <section className="explorer-solve-panel" aria-labelledby="backend-solve-title">
            <span className="panel-kicker">LIVE BACKEND (FASTAPI)</span>
            <h3 id="backend-solve-title">Grover TSP sampling</h3>
            <p className="explorer-note">
              Sends the matrix above to <code>POST /api/v3/solve-tsp</code> (Grover, 1024 shots). Not the same as the
              read-only preset chart or the lab circuit viewer — this is a real simulator run on the server.
            </p>
            <button
              type="button"
              onClick={() => void runBackendSolve()}
              disabled={!canRunBackendSolve || solveLoading}
              aria-busy={solveLoading}
            >
              {solveLoading ? "Running backend solve…" : "Run backend Grover solve"}
            </button>
            {!canRunBackendSolve && healthState === "offline" && (
              <p className="explorer-note" role="note">
                Backend solve is disabled while the API is offline. Use Check status after starting FastAPI.
              </p>
            )}
            {solveError && (
              <p className="explorer-note" role="alert">
                {solveError}
              </p>
            )}
            {solveResult && (
              <div className="explorer-solve-results" aria-label="Backend solve results">
                <p className="explorer-note">
                  Classical optimal: {solveResult.quantum_advantage.classical_optimal_distance}; quantum best:{" "}
                  {solveResult.quantum_advantage.quantum_optimal_distance}
                  {solveResult.quantum_advantage.found_optimal ? " (matched optimal)" : ""} —{" "}
                  {solveResult.execution_details.algorithm}, {solveResult.execution_details.shots} shots,{" "}
                  {(solveResult.execution_time * 1000).toFixed(0)} ms
                </p>
                {solveResult.quantum_solutions.slice(0, 6).map((row) => (
                  <div key={`${row.bitstring ?? row.route.join("-")}-${row.measurement_count}`} className="explorer-solve-row">
                    <span>{formatRoute(row.route)}</span>
                    <span>cost {row.distance}</span>
                    <span>{(row.probability * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </article>

        {stage >= 1 && stage < 3 && (
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

        {stage >= 2 && (
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
      </main>
    </>
  );
}
