"use client";

import {
  TSP_MAX_CITIES,
  TSP_MIN_CITIES,
  cityLabel,
  permutationCount,
  resizeMatrix,
  validateMatrixInputs,
  type MatrixValidationResult,
} from "@/lib/tspMatrixConfig";

type Props = {
  cityCount: number;
  inputs: string[][];
  onCityCountChange: (count: number) => void;
  onInputsChange: (next: string[][]) => void;
  validation: MatrixValidationResult | null;
  onValidationChange: (result: MatrixValidationResult | null) => void;
};

export function TspMatrixEditor({
  cityCount,
  inputs,
  onCityCountChange,
  onInputsChange,
  validation,
  onValidationChange,
}: Props) {
  const runValidation = (nextInputs: string[][]) => {
    const result = validateMatrixInputs(nextInputs);
    onValidationChange(result.ok ? result : result);
    return result;
  };

  const handleCityCount = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return;
    const nextCount = Math.min(TSP_MAX_CITIES, Math.max(TSP_MIN_CITIES, parsed));
    const numeric = inputs.map((row, i) =>
      row.map((cell, j) => {
        const v = Number(cell.trim());
        return Number.isFinite(v) ? v : i === j ? 0 : 1;
      }),
    );
    const resized = resizeMatrix(numeric, nextCount);
    const nextInputs = resized.map((row) => row.map(String));
    onCityCountChange(nextCount);
    onInputsChange(nextInputs);
    runValidation(nextInputs);
  };

  const handleCell = (i: number, j: number, value: string) => {
    const next = inputs.map((row, ri) => row.map((cell, ci) => (ri === i && ci === j ? value : cell)));
    onInputsChange(next);
    onValidationChange(null);
  };

  const handleCellBlur = () => {
    runValidation(inputs);
  };

  const permutations = permutationCount(cityCount);

  return (
    <section className="content-card tsp-config-panel" aria-labelledby="tsp-config-title">
      <span className="panel-kicker">PROBLEM SETUP</span>
      <h2 id="tsp-config-title">Cities and distance matrix</h2>
      <p className="explorer-note" data-testid="tsp-asymmetric-note">
        Directed (one-way) leg costs are supported — rows and columns need not match. Diagonal cells must stay{" "}
        <strong>0</strong> (no self-loop cost).
      </p>
      <p className="explorer-note">
        Backend Grover sampling accepts <strong>{TSP_MIN_CITIES}–{TSP_MAX_CITIES} cities</strong> (
        {permutations.toLocaleString()} permutations at {cityCount} cities). Larger counts use more simulator time and
        qubits on the server.
      </p>
      <label className="tsp-city-count-label">
        Number of cities
        <input
          type="range"
          min={TSP_MIN_CITIES}
          max={TSP_MAX_CITIES}
          step={1}
          value={cityCount}
          onChange={(e) => handleCityCount(e.target.value)}
          data-testid="tsp-city-count"
          aria-valuemin={TSP_MIN_CITIES}
          aria-valuemax={TSP_MAX_CITIES}
          aria-valuenow={cityCount}
        />
        <span data-testid="tsp-city-count-value">{cityCount}</span>
      </label>
      <div className="tsp-matrix" aria-label="Editable city distance matrix">
        <table>
          <caption>Tour leg costs (one-way)</caption>
          <thead>
            <tr>
              <th scope="col" />
              {inputs[0]?.map((_, j) => (
                <th key={j} scope="col">
                  {cityLabel(j)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inputs.map((row, i) => (
              <tr key={i}>
                <th scope="row">{cityLabel(i)}</th>
                {row.map((cell, j) => (
                  <td key={j}>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="tsp-matrix-input"
                      aria-label={`Distance ${cityLabel(i)} to ${cityLabel(j)}`}
                      value={cell}
                      readOnly={i === j}
                      data-testid={`tsp-matrix-cell-${i}-${j}`}
                      onChange={(e) => handleCell(i, j, e.target.value)}
                      onBlur={handleCellBlur}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {validation && !validation.ok && (
        <p className="explorer-note" role="alert" data-testid="tsp-matrix-validation">
          {validation.message}
        </p>
      )}
    </section>
  );
}
