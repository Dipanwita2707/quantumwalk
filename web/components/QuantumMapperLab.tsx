"use client";

import { useMemo, useState } from "react";
import { CircuitViewer } from "@/components/CircuitViewer";
import { CIRCUIT_PRESETS } from "@/lib/circuitPresets";
import {
  MAPPER_MAX_CITIES,
  MAPPER_MIN_CITIES,
  encodeBinaryInteger,
  encodeTspRouteIndex,
  groverSuccessProbability,
  suggestedGroverIterations,
  type MapperExampleId,
} from "@/lib/quantumMapper";

const EXAMPLES: { id: MapperExampleId; title: string; body: string }[] = [
  {
    id: "tsp-route",
    title: "TSP route → computational basis",
    body: "Each permutation of n cities maps to an integer 0…n!−1, then to a bitstring using ⌈log₂(n!)⌉ qubits. Padding labels may be unused.",
  },
  {
    id: "binary-int",
    title: "Classical integer → bit register",
    body: "A non-negative integer becomes a fixed-width binary string — the usual classical-to-quantum preparation target.",
  },
  {
    id: "grover-mark",
    title: "Grover amplitude (query model)",
    body: "After k Grover iterations on N items with one marked, ideal success probability is sin²((2k+1)θ) with θ = asin(1/√N). Not a hardware timing claim.",
  },
];

export function QuantumMapperLab() {
  const [example, setExample] = useState<MapperExampleId>("tsp-route");
  const [nCities, setNCities] = useState(3);
  const [routeIndex, setRouteIndex] = useState(0);
  const [binaryValue, setBinaryValue] = useState(5);
  const [binaryBits, setBinaryBits] = useState(3);
  const [searchSize, setSearchSize] = useState(16);
  const [groverIters, setGroverIters] = useState(3);

  const tspResult = useMemo(() => encodeTspRouteIndex(routeIndex, nCities), [routeIndex, nCities]);
  const binaryResult = useMemo(() => encodeBinaryInteger(binaryValue, binaryBits), [binaryValue, binaryBits]);
  const groverP = useMemo(() => groverSuccessProbability(searchSize, groverIters), [searchSize, groverIters]);
  const groverSuggested = useMemo(() => suggestedGroverIterations(searchSize), [searchSize]);

  return (
    <div className="mapper-lab">
      <p className="explorer-note">
        <strong>Assumptions:</strong> directed TSP costs are separate from this label map; asymmetric matrices are fine on
        the Explorer. Encoding here is <em>index → bitstring</em>, not a claim of quantum speedup.
      </p>

      <div className="explorer-steps" role="tablist" aria-label="Mapping examples">
        {EXAMPLES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={example === item.id}
            className={example === item.id ? "active" : ""}
            data-testid={`mapper-example-${item.id}`}
            onClick={() => setExample(item.id)}
          >
            {item.title}
          </button>
        ))}
      </div>

      {EXAMPLES.filter((e) => e.id === example).map((item) => (
        <p key={item.id} className="explorer-note">
          {item.body}
        </p>
      ))}

      {example === "tsp-route" && (
        <section aria-labelledby="mapper-tsp-title">
          <h3 id="mapper-tsp-title">Route index encoding</h3>
          <label>
            Cities ({MAPPER_MIN_CITIES}–{MAPPER_MAX_CITIES})
            <input
              type="range"
              min={MAPPER_MIN_CITIES}
              max={MAPPER_MAX_CITIES}
              value={nCities}
              data-testid="mapper-city-count"
              onChange={(e) => {
                const n = Number(e.target.value);
                setNCities(n);
                setRouteIndex(0);
              }}
            />
            <span data-testid="mapper-city-count-value">{nCities}</span>
          </label>
          <label>
            Route index (permutation id)
            <input
              type="number"
              min={0}
              max={tspResult.ok ? tspResult.permutationCount - 1 : 999}
              value={routeIndex}
              data-testid="mapper-route-index"
              onChange={(e) => setRouteIndex(Number(e.target.value))}
            />
          </label>
          {!tspResult.ok && (
            <p className="explorer-note" role="alert" data-testid="mapper-validation">
              {tspResult.message}
            </p>
          )}
          {tspResult.ok && (
            <div className="mapper-result" data-testid="mapper-tsp-result">
              <p>
                <strong>Qubits:</strong> {tspResult.qubits} · <strong>Permutations:</strong>{" "}
                {tspResult.permutationCount}
              </p>
              <p>
                <strong>Bitstring:</strong> <code data-testid="mapper-bitstring">{tspResult.bitstring}</code>
              </p>
              <p className="explorer-note">
                Classical source: permutation #{tspResult.routeIndex}. Quantum target: |{tspResult.bitstring}⟩ in the
                computational basis (padding bits may be unused when n! is not a power of two).
              </p>
            </div>
          )}
          {nCities === 3 && (
            <div className="mapper-circuit-preview">
              <span className="panel-kicker">RELATED LAB PRESET</span>
              <CircuitViewer
                initialQubits={CIRCUIT_PRESETS.tsp3.qubits}
                initialOperations={CIRCUIT_PRESETS.tsp3.operations}
                demoPreset="tsp3"
                readonly
                title="Three-qubit route superposition"
                subtitle="Education preset — not your custom index map."
                fullLabHref="/workspace?preset=tsp3"
              />
            </div>
          )}
        </section>
      )}

      {example === "binary-int" && (
        <section aria-labelledby="mapper-binary-title">
          <h3 id="mapper-binary-title">Binary register</h3>
          <label>
            Value
            <input
              type="number"
              min={0}
              value={binaryValue}
              data-testid="mapper-binary-value"
              onChange={(e) => setBinaryValue(Number(e.target.value))}
            />
          </label>
          <label>
            Bit width
            <input
              type="range"
              min={1}
              max={8}
              value={binaryBits}
              data-testid="mapper-binary-bits"
              onChange={(e) => setBinaryBits(Number(e.target.value))}
            />
            {binaryBits} bits
          </label>
          {!binaryResult.ok && (
            <p className="explorer-note" role="alert" data-testid="mapper-validation">
              {binaryResult.message}
            </p>
          )}
          {binaryResult.ok && (
            <div className="mapper-result" data-testid="mapper-binary-result">
              <p>
                Classical: {binaryResult.value} → quantum label |{binaryResult.bitstring}⟩
              </p>
              <code data-testid="mapper-bitstring">{binaryResult.bitstring}</code>
            </div>
          )}
        </section>
      )}

      {example === "grover-mark" && (
        <section aria-labelledby="mapper-grover-title">
          <h3 id="mapper-grover-title">Grover success curve</h3>
          <label>
            Search space N
            <select value={searchSize} data-testid="mapper-grover-n" onChange={(e) => setSearchSize(Number(e.target.value))}>
              {[8, 16, 64, 256].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            Iterations k = {groverIters}
            <input
              type="range"
              min={0}
              max={Math.max(2, 2 * groverSuggested + 2)}
              value={groverIters}
              data-testid="mapper-grover-iters"
              onChange={(e) => setGroverIters(Number(e.target.value))}
            />
          </label>
          <button type="button" onClick={() => setGroverIters(groverSuggested)}>
            Use suggested k ≈ {groverSuggested}
          </button>
          <p className="mapper-result" data-testid="mapper-grover-result">
            Ideal success: <strong data-testid="mapper-grover-probability">{(groverP * 100).toFixed(1)}%</strong>
          </p>
          <p className="explorer-note">
            Maps classical “which item is marked?” to rotation in amplitude space — see{" "}
            <a href="/explorer/grover">Grover explorer</a>.
          </p>
        </section>
      )}
    </div>
  );
}
