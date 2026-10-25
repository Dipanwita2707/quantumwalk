/**
 * Classical ↔ quantum encoding utilities (Mapper workspace).
 * TSP route bounds align with sirraya/api/sirraya_v3_routes.py (3–6 cities).
 */

export const MAPPER_MIN_CITIES = 3;
export const MAPPER_MAX_CITIES = 6;

export type MapperExampleId = "tsp-route" | "binary-int" | "grover-mark";

export function permutationCount(n: number): number {
  if (!Number.isInteger(n) || n < 1) return 0;
  let f = 1;
  for (let i = 2; i <= n; i += 1) f *= i;
  return f;
}

export function qubitsForRouteEncoding(nCities: number): number {
  const routes = permutationCount(nCities);
  if (routes <= 1) return 1;
  return Math.ceil(Math.log2(routes));
}

export type RouteEncodingResult =
  | { ok: true; routeIndex: number; bitstring: string; qubits: number; permutationCount: number }
  | { ok: false; message: string };

export function encodeTspRouteIndex(routeIndex: number, nCities: number): RouteEncodingResult {
  if (!Number.isInteger(nCities) || nCities < MAPPER_MIN_CITIES || nCities > MAPPER_MAX_CITIES) {
    return { ok: false, message: `City count must be ${MAPPER_MIN_CITIES}–${MAPPER_MAX_CITIES}.` };
  }
  if (!Number.isInteger(routeIndex)) {
    return { ok: false, message: "Route index must be a whole number." };
  }
  const count = permutationCount(nCities);
  const qubits = qubitsForRouteEncoding(nCities);
  if (routeIndex < 0 || routeIndex >= count) {
    return { ok: false, message: `Route index must be between 0 and ${count - 1} (${count} permutations).` };
  }
  return {
    ok: true,
    routeIndex,
    bitstring: routeIndex.toString(2).padStart(qubits, "0"),
    qubits,
    permutationCount: count,
  };
}

export type BinaryEncodingResult =
  | { ok: true; value: number; bitstring: string; bits: number }
  | { ok: false; message: string };

export function encodeBinaryInteger(value: number, bits: number): BinaryEncodingResult {
  if (!Number.isInteger(bits) || bits < 1 || bits > 10) {
    return { ok: false, message: "Bit width must be 1–10." };
  }
  if (!Number.isInteger(value) || value < 0) {
    return { ok: false, message: "Value must be a non-negative integer." };
  }
  const max = 2 ** bits - 1;
  if (value > max) {
    return { ok: false, message: `Value must be at most ${max} for ${bits} bits.` };
  }
  return { ok: true, value, bitstring: value.toString(2).padStart(bits, "0"), bits };
}

/** Ideal Grover success for one marked item, uniform start (query model). */
export function groverSuccessProbability(searchSize: number, iterations: number): number {
  if (searchSize < 2 || !Number.isInteger(searchSize)) return 0;
  if (iterations < 0 || !Number.isInteger(iterations)) return 0;
  const theta = Math.asin(1 / Math.sqrt(searchSize));
  return Math.sin((2 * iterations + 1) * theta) ** 2;
}

export function suggestedGroverIterations(searchSize: number): number {
  if (searchSize < 2) return 0;
  const theta = Math.asin(1 / Math.sqrt(searchSize));
  return Math.max(0, Math.floor(Math.PI / (4 * theta)));
}

export type DecodeRouteResult =
  | { ok: true; routeIndex: number; bitstring: string; nCities: number }
  | { ok: false; message: string };

/** Inverse of encodeTspRouteIndex when bitstring matches width for n cities. */
export function decodeTspRouteBitstring(bitstring: string, nCities: number): DecodeRouteResult {
  if (!/^[01]+$/.test(bitstring)) {
    return { ok: false, message: "Bitstring must contain only 0 and 1." };
  }
  const qubits = qubitsForRouteEncoding(nCities);
  if (bitstring.length !== qubits) {
    return { ok: false, message: `For ${nCities} cities use exactly ${qubits} bits.` };
  }
  const routeIndex = parseInt(bitstring, 2);
  const count = permutationCount(nCities);
  if (routeIndex >= count) {
    return { ok: false, message: `Index ${routeIndex} exceeds ${count - 1} (padding label).` };
  }
  return { ok: true, routeIndex, bitstring, nCities };
}
