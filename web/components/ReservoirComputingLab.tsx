"use client";

import { useMemo, useState } from "react";
import {
  RESERVOIR_DEFAULTS,
  runReservoirExperiment,
  type ReservoirParams,
} from "@/lib/reservoirLab";

export function ReservoirComputingLab() {
  const [params, setParams] = useState<ReservoirParams>({ ...RESERVOIR_DEFAULTS });
  const [runId, setRunId] = useState(0);

  const result = useMemo(() => {
    void runId;
    return runReservoirExperiment(params);
  }, [params, runId]);

  function reset() {
    setParams({ ...RESERVOIR_DEFAULTS });
    setRunId((n) => n + 1);
  }

  return (
    <div className="mapper-lab" data-testid="reservoir-lab">
      <p className="explorer-note" role="note" data-testid="reservoir-limitation">
        Educational classical echo-state reservoir: fixed random dynamics map a sine wave into features; a
        ridge-regression readout predicts the next sample. Not quantum hardware and not a scientific advantage claim.
      </p>
      <section className="content-card" aria-labelledby="reservoir-params-title">
        <h2 id="reservoir-params-title">Parameters</h2>
        <label>
          Hidden nodes ({params.hiddenSize})
          <input
            type="range"
            min={4}
            max={32}
            step={4}
            value={params.hiddenSize}
            data-testid="reservoir-hidden"
            onChange={(e) => setParams((p) => ({ ...p, hiddenSize: Number(e.target.value) }))}
          />
        </label>
        <label>
          Leak rate ({params.leakRate.toFixed(2)})
          <input
            type="range"
            min={0.05}
            max={0.95}
            step={0.05}
            value={params.leakRate}
            data-testid="reservoir-leak"
            onChange={(e) => setParams((p) => ({ ...p, leakRate: Number(e.target.value) }))}
          />
        </label>
        <label>
          Input scale ({params.inputScale.toFixed(2)})
          <input
            type="range"
            min={0.2}
            max={2}
            step={0.1}
            value={params.inputScale}
            data-testid="reservoir-input-scale"
            onChange={(e) => setParams((p) => ({ ...p, inputScale: Number(e.target.value) }))}
          />
        </label>
        <div className="explorer-steps">
          <button type="button" onClick={() => setRunId((n) => n + 1)} data-testid="reservoir-rerun">
            Rerun with current parameters
          </button>
          <button type="button" onClick={reset}>
            Reset defaults
          </button>
        </div>
      </section>
      {!result.ok && (
        <p className="content-error" role="alert" data-testid="reservoir-validation">
          {result.message}
        </p>
      )}
      {result.ok && (
        <section className="content-card" aria-labelledby="reservoir-results-title">
          <h2 id="reservoir-results-title">Results</h2>
          <p data-testid="reservoir-mse">
            Train MSE: {result.trainMse.toFixed(4)} · Test MSE: {result.testMse.toFixed(4)} · Mean baseline train MSE:{" "}
            {result.baselineMse.toFixed(4)}
          </p>
          <p className="explorer-note">
            Lower test MSE means the reservoir features helped the linear readout predict the next sine sample better than
            guessing the training mean.
          </p>
          <table>
            <caption>Sample test predictions</caption>
            <thead>
              <tr>
                <th scope="col">Target</th>
                <th scope="col">Predicted</th>
              </tr>
            </thead>
            <tbody>
              {result.samplePredictions.map((row, i) => (
                <tr key={i}>
                  <td>{row.target.toFixed(3)}</td>
                  <td>{row.predicted.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="explorer-note">{result.limitation}</p>
        </section>
      )}
    </div>
  );
}
