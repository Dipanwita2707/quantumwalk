/**
 * TSP matrix editing — bounds match sirraya/api/sirraya_v3_routes.py (3–6 cities).
 */

import { DISTANCE } from "@/lib/tspExplorer";

/** Backend Pydantic validator: distance_matrix must be 3–6 square. */
export const TSP_MIN_CITIES = 3;
export const TSP_MAX_CITIES = 6;

/** Default 3×3 education example (asymmetric allowed). */
export const DEFAULT_TSP_MATRIX: number[][] = DISTANCE.map((row) => [...row]);

export function cityLabel(index: number): string {
  const letters = "ABCDEF";
  return letters[index] ?? String(index + 1);
}

export function cloneMatrix(matrix: number[][]): number[][] {
  return matrix.map((row) => [...row]);
}

export function createDefaultMatrix(n: number): number[][] {
  const size = Math.min(TSP_MAX_CITIES, Math.max(TSP_MIN_CITIES, n));
  const matrix: number[][] = [];
  for (let i = 0; i < size; i += 1) {
    const row: number[] = [];
    for (let j = 0; j < size; j += 1) {
      row.push(i === j ? 0 : 1);
    }
    matrix.push(row);
  }
  return matrix;
}

/** Grow or shrink matrix; preserve top-left submatrix values. */
export function resizeMatrix(previous: number[][], newSize: number): number[][] {
  const n = Math.min(TSP_MAX_CITIES, Math.max(TSP_MIN_CITIES, newSize));
  const next = createDefaultMatrix(n);
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      if (i < previous.length && j < previous[i]?.length) {
        next[i][j] = previous[i][j];
      }
    }
  }
  return next;
}

export function matrixToInputStrings(matrix: number[][]): string[][] {
  return matrix.map((row) => row.map((value) => String(value)));
}

export function parseDistanceInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  return value;
}

export type MatrixValidationResult =
  | { ok: true; matrix: number[][] }
  | { ok: false; message: string };

/**
 * Validate before POST /api/v3/solve-tsp.
 * Asymmetric directed costs are supported (backend sums matrix[route[i]][route[i+1]]).
 */
export function validateMatrixInputs(inputs: string[][]): MatrixValidationResult {
  const n = inputs.length;
  if (n < TSP_MIN_CITIES || n > TSP_MAX_CITIES) {
    return { ok: false, message: `City count must be between ${TSP_MIN_CITIES} and ${TSP_MAX_CITIES}.` };
  }
  const matrix: number[][] = [];
  for (let i = 0; i < n; i += 1) {
    if (inputs[i].length !== n) {
      return { ok: false, message: "Distance matrix must be square." };
    }
    const row: number[] = [];
    for (let j = 0; j < n; j += 1) {
      const parsed = parseDistanceInput(inputs[i][j]);
      if (parsed === null) {
        return { ok: false, message: `Enter a valid number for ${cityLabel(i)} → ${cityLabel(j)}.` };
      }
      if (parsed < 0) {
        return { ok: false, message: "Distances cannot be negative." };
      }
      if (i === j && parsed !== 0) {
        return { ok: false, message: `Diagonal entries (${cityLabel(i)} → ${cityLabel(i)}) must be 0.` };
      }
      row.push(parsed);
    }
    matrix.push(row);
  }
  return { ok: true, matrix };
}

export function validateNumberMatrix(matrix: number[][]): MatrixValidationResult {
  return validateMatrixInputs(matrixToInputStrings(matrix));
}

export type ClassicalTour = {
  id: number;
  bits: string;
  cities: number[];
  cost: number;
  label: string;
};

function tourCost(matrix: number[][], order: number[]): number {
  let total = 0;
  const n = order.length;
  for (let i = 0; i < n; i += 1) {
    total += matrix[order[i]][order[(i + 1) % n]];
  }
  return total;
}

function permutations(n: number): number[][] {
  if (n <= 0) return [[]];
  const results: number[][] = [];
  const used = new Array<boolean>(n).fill(false);
  const path: number[] = [];
  const walk = () => {
    if (path.length === n) {
      results.push([...path]);
      return;
    }
    for (let i = 0; i < n; i += 1) {
      if (used[i]) continue;
      used[i] = true;
      path.push(i);
      walk();
      path.pop();
      used[i] = false;
    }
  };
  walk();
  return results;
}

export function classicalToursForMatrix(matrix: number[][]): ClassicalTour[] | null {
  const check = validateNumberMatrix(matrix);
  if (!check.ok) return null;
  const n = check.matrix.length;
  const routeCount = permutationCount(n);
  const padBits = Math.max(1, Math.ceil(Math.log2(routeCount)));
  return permutations(n).map((cities, id) => {
    const cost = tourCost(check.matrix, cities);
    const bits = id.toString(2).padStart(padBits, "0");
    const label = cities.map((c) => cityLabel(c)).join("→") + "→" + cityLabel(cities[0]);
    return { id, bits, cities, cost, label };
  });
}

export function permutationCount(n: number): number {
  let f = 1;
  for (let i = 2; i <= n; i += 1) f *= i;
  return f;
}
