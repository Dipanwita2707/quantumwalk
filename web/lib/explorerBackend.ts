/**
 * Quantum Explorer ↔ FastAPI health and TSP solve (/health, POST /api/v3/solve-tsp).
 */

import { ApiError, getApiBase } from "@/lib/api";
import { validateNumberMatrix } from "@/lib/tspMatrixConfig";

export type BackendHealthState = "checking" | "online" | "offline";

export type HealthFailureReason = "network" | "timeout" | "http" | "invalid";

export type HealthCheckResult =
  | { ok: true }
  | { ok: false; reason: HealthFailureReason; status?: number };

export type SolveTspAlgorithm = "grover" | "qaoa" | "vqe";
export type ErrorMitigationMethod = "readout" | "zne" | "none";

export type SolveTspRequest = {
  distance_matrix: number[][];
  algorithm?: SolveTspAlgorithm;
  shots?: number;
  optimization_level?: number;
  enable_error_mitigation?: boolean;
  error_mitigation_method?: ErrorMitigationMethod;
  grover_iterations?: number | null;
};

export type QuantumSolution = {
  route: number[];
  distance: number;
  probability: number;
  measurement_count: number;
  bitstring: string | null;
};

export type SolveTspResponse = {
  success: boolean;
  execution_time: number;
  quantum_solutions: QuantumSolution[];
  quantum_advantage: {
    found_optimal: boolean;
    quantum_optimal_distance: number;
    classical_optimal_distance: number;
  };
  execution_details: {
    algorithm: string;
    shots: number;
    qubits_used: number;
    depth: number;
    grover_iterations?: number;
  };
  recommendations?: string[];
};

export const HEALTH_TIMEOUT_MS = 8_000;
export const SOLVE_TIMEOUT_MS = 120_000;

/** Same-origin rewrite when no explicit public API URL; otherwise direct to configured base. */
export function resolveServicePath(path: string): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) return `${configured}${path}`;
  return path;
}

export function healthCheckUrl(): string {
  return resolveServicePath("/health");
}

export function parseHealthPayload(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const status = (body as { status?: unknown }).status;
  return status === "ok";
}

export async function fetchBackendHealth(signal?: AbortSignal): Promise<HealthCheckResult> {
  const timeout = AbortSignal.timeout(HEALTH_TIMEOUT_MS);
  const merged = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let response: Response;
  try {
    response = await fetch(healthCheckUrl(), {
      method: "GET",
      cache: "no-store",
      credentials: "omit",
      signal: merged,
    });
  } catch (cause: unknown) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      if (signal?.aborted) return { ok: false, reason: "network" };
      return { ok: false, reason: "timeout" };
    }
    return { ok: false, reason: "network" };
  }
  if (!response.ok) return { ok: false, reason: "http", status: response.status };
  try {
    const json: unknown = await response.json();
    if (!parseHealthPayload(json)) return { ok: false, reason: "invalid" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

export function healthFailureMessage(reason: HealthFailureReason, status?: number): string {
  switch (reason) {
    case "timeout":
      return "Health check timed out. The API may be slow or unreachable.";
    case "network":
      return "Could not reach the QuantumWalk API. Start the FastAPI server or check your network.";
    case "http":
      return status ? `API health returned HTTP ${status}.` : "API health check failed.";
    case "invalid":
      return "API health response was unexpected.";
    default:
      return "API is offline.";
  }
}

export function buildGroverSolveRequest(distanceMatrix: number[][]): SolveTspRequest {
  return {
    distance_matrix: distanceMatrix,
    algorithm: "grover",
    shots: 1024,
    optimization_level: 3,
    enable_error_mitigation: false,
    error_mitigation_method: "none",
    grover_iterations: 2,
  };
}

/** @deprecated Use buildGroverSolveRequest */
export const buildThreeCitySolveRequest = buildGroverSolveRequest;

export function validateDistanceMatrix(matrix: number[][]): string | null {
  const result = validateNumberMatrix(matrix);
  return result.ok ? null : result.message;
}

export async function postSolveTsp(body: SolveTspRequest, signal?: AbortSignal): Promise<SolveTspResponse> {
  const validation = validateDistanceMatrix(body.distance_matrix);
  if (validation) throw new ApiError(validation, 400);

  const timeout = AbortSignal.timeout(SOLVE_TIMEOUT_MS);
  const merged = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const path = resolveServicePath("/api/v3/solve-tsp");
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
      signal: merged,
    });
  } catch (cause: unknown) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      if (signal?.aborted) throw new ApiError("Solve request was cancelled.", 0);
      throw new ApiError("Solve request timed out. Try again with fewer shots.", 0);
    }
    throw new ApiError("Could not reach the QuantumWalk API.", 0);
  }
  if (!response.ok) {
    let detail = "The solve request could not be completed.";
    try {
      const errBody = (await response.json()) as { detail?: string | { msg?: string }[] };
      if (typeof errBody.detail === "string") detail = errBody.detail;
      else if (Array.isArray(errBody.detail) && errBody.detail[0]?.msg) detail = errBody.detail[0].msg;
    } catch {
      /* safe fallback */
    }
    throw new ApiError(detail, response.status);
  }
  const data = (await response.json()) as SolveTspResponse;
  if (!data.success || !Array.isArray(data.quantum_solutions)) {
    throw new ApiError("Solve response was incomplete.", 502);
  }
  return data;
}

/** Server-side or tests: absolute health URL. */
export function absoluteHealthUrl(): string {
  return `${getApiBase()}/health`;
}
