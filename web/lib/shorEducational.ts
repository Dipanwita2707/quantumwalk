/**
 * Educational Shor period-finding workflow (QuantumWalk-original).
 * Uses web/lib/qftSimulator inverse QFT on the counting register only.
 * See docs/shor-educational-lab.md for register layout and scope limits.
 */

import {
  applyInverseQft,
  complex,
  isQftValidationError,
  normSquared,
  scale,
  QFT_MAX_QUBITS,
  QFT_MIN_QUBITS,
  QFT_NUMERIC_TOLERANCE,
  type Complex,
  type QftStateVector,
} from "@/lib/qftSimulator";
import { applyQftGateSequence } from "@/lib/qftGates";
import {
  applyControlledOrbitMultiply,
  applyHadamardCountingQubit,
  SHOR_WORK_ENCODING,
  stateOverlapFidelity,
} from "@/lib/shorModExp";
import {
  buildShotHistogram,
  mulberry32,
  sampleCountingWithRng,
  sampleShorShotSequence,
  summarizeHistogramMetrics,
  SHOR_DEFAULT_SHOTS,
  SHOR_MAX_SHOTS,
  SHOR_MIN_SHOTS,
  validateCountingProbabilities,
  validateShorSampleSeed,
  validateShorShotCount,
  type ShorMultiShotHistogram,
} from "@/lib/shorMultiShot";

export {
  mulberry32,
  SHOR_DEFAULT_SHOTS,
  SHOR_MAX_SHOTS,
  SHOR_MIN_SHOTS,
  validateCountingProbabilities,
  validateShorSampleSeed,
  validateShorShotCount,
} from "@/lib/shorMultiShot";

export const SHOR_N_MIN = 4;
export const SHOR_N_MAX = 21;
/** Must stay within shared ideal simulator qubit budget (QFT path). */
export const SHOR_MAX_TOTAL_QUBITS = 5;

export type ShorValidationError = { ok: false; message: string };

export function isShorValidationError(v: unknown): v is ShorValidationError {
  return typeof v === "object" && v !== null && "ok" in v && (v as ShorValidationError).ok === false;
}

export type ShorQuantumPlan = {
  countingQubits: number;
  workQubits: number;
  totalQubits: number;
  workDimension: number;
};

export type ShorStepKind =
  | "preprocess"
  | "gcd"
  | "quantum_plan"
  | "quantum_evolve"
  | "modexp_comparison"
  | "path_comparison"
  | "iqft_comparison"
  | "multi_shot"
  | "measurement"
  | "continued_fraction"
  | "factor_attempt"
  | "classical_reference"
  | "limitation";

export type ShorWorkflowStep = {
  kind: ShorStepKind;
  title: string;
  detail: string;
  status: "info" | "success" | "warning" | "error";
};

export type ShorFactorResult =
  | { ok: true; p: number; q: number; via: "gcd" | "order" }
  | { ok: false; reason: string };

/** Ideal simulation pipeline for counting-register Born probabilities. */
export type ShorSimulationPath = "closed_direct" | "closed_gate" | "gate_e2e";

export type ShorMeasurementPolicy = "deterministic_peak" | "multi_shot";

export const SHOR_SIMULATION_PATH_LABELS: Record<ShorSimulationPath, string> = {
  closed_direct: "Closed-form state + direct IQFT (reference)",
  closed_gate: "Closed-form state + gate IQFT",
  gate_e2e: "Orbit-compact gates + gate IQFT (end-to-end)",
};

export type ShorPathDistributionMetrics = {
  l1Distance: number;
  bhattacharyyaFidelity: number;
  maxAbsoluteDifference: number;
};

export type ShorThreePathComparison = {
  gateIqftSupported: boolean;
  gateE2eSupported: boolean;
  closedDirectProbabilities: number[];
  closedGateProbabilities: number[] | null;
  gateE2eProbabilities: number[] | null;
  closedDirectVsClosedGate: ShorPathDistributionMetrics | null;
  closedDirectVsGateE2e: ShorPathDistributionMetrics | null;
  closedGateVsGateE2e: ShorPathDistributionMetrics | null;
  /** Full joint-state fidelity is meaningful for closed vs gate pre-IQFT; marginals compare all three paths. */
  comparisonNote: string;
};

export type ShorWorkflowOptions = {
  simulationPath?: ShorSimulationPath;
  measurementPolicy?: ShorMeasurementPolicy;
  sampleSeed?: number;
  shotCount?: number;
};

export type ShorShotOutcomeCategory =
  | "success"
  | "failed_phase"
  | "odd_order"
  | "minus_one"
  | "trivial_factor"
  | "no_candidates";

export type ShorShotOutcomeAnalysis = {
  measured: number;
  phaseCandidates: number[];
  factorResult: ShorFactorResult | null;
  category: ShorShotOutcomeCategory;
  detail: string;
};

export type ShorMultiShotSummary = ShorMultiShotHistogram & {
  uniqueOutcomeAnalyses: ShorShotOutcomeAnalysis[];
  shotsWithPhaseCandidates: number;
  shotsWithSuccessfulFactors: number;
};

export type ShorRunResult = {
  N: number;
  a: number;
  steps: ShorWorkflowStep[];
  simulationPath: ShorSimulationPath | null;
  measurementPolicy: ShorMeasurementPolicy | null;
  measurementSeed: number | null;
  /** Human-readable: deterministic peak pick vs seeded Born sample. */
  measurementSemantics: string | null;
  quantumPlan: ShorQuantumPlan | null;
  /** Marginal probabilities P(c) on counting register after simulated IQFT. */
  countingProbabilities: number[] | null;
  /** Outcome used for post-processing (highest-probability peak for deterministic demos). */
  measuredCounting: number | null;
  phaseNumerator: number | null;
  phaseDenominator: number | null;
  orderFromMeasurement: number | null;
  factors: ShorFactorResult | null;
  /** Brute-force period for teaching checks only — never labeled as measurement. */
  classicalReferenceOrder: number | null;
  iqftComparison: ShorIqftComparison | null;
  modexpComparison: ShorModExpComparison | null;
  pathComparison: ShorThreePathComparison | null;
  shotCount: number | null;
  multiShot: ShorMultiShotSummary | null;
};

export type ShorModExpComparison = {
  workEncoding: typeof SHOR_WORK_ENCODING;
  orbitSize: number;
  closedPreNorm: number;
  gatePreNorm: number;
  /** |<psi_closed|psi_gate>|^2 (global phase ignored). */
  preIqftStateFidelity: number;
  preIqftStatesAligned: boolean;
  closedProbabilities: number[];
  gatePreparationProbabilities: number[];
  l1Distance: number;
  bhattacharyyaFidelity: number;
  maxAbsoluteDifference: number;
  distributionsAligned: boolean;
};

export type ShorIqftMode = "direct" | "gate";

export type ShorIqftComparison = {
  gateIqftSupported: boolean;
  referenceMode: "direct";
  gateModeLabel: string;
  preIqftNorm: number;
  postIqftNormDirect: number;
  directProbabilities: number[];
  gateProbabilities: number[] | null;
  /** L1 distance Σ|c| P_direct(c) − P_gate(c)|. */
  l1Distance: number | null;
  /** Bhattacharyya fidelity (Σ√(P_i Q_i))² — 1 means identical distributions. */
  bhattacharyyaFidelity: number | null;
  maxAbsoluteDifference: number | null;
  distributionsAligned: boolean;
};

export function gateIqftSupported(countingBits: number): boolean {
  return countingBits >= QFT_MIN_QUBITS && countingBits <= QFT_MAX_QUBITS;
}

export function compareCountingProbabilities(
  direct: number[],
  gate: number[],
): { l1: number; bhattacharyyaFidelity: number; maxAbsDiff: number } {
  let l1 = 0;
  let bc = 0;
  let maxAbs = 0;
  for (let i = 0; i < direct.length; i += 1) {
    const d = direct[i];
    const g = gate[i];
    l1 += Math.abs(d - g);
    bc += Math.sqrt(Math.max(0, d) * Math.max(0, g));
    maxAbs = Math.max(maxAbs, Math.abs(d - g));
  }
  return { l1, bhattacharyyaFidelity: bc * bc, maxAbsDiff: maxAbs };
}

function toPathMetrics(m: ReturnType<typeof compareCountingProbabilities>): ShorPathDistributionMetrics {
  return {
    l1Distance: m.l1,
    bhattacharyyaFidelity: m.bhattacharyyaFidelity,
    maxAbsoluteDifference: m.maxAbsDiff,
  };
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export function isComposite(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n % 2 === 0) return n > 2;
  for (let d = 3; d * d <= n; d += 2) {
    if (n % d === 0) return true;
  }
  return false;
}

export function modPow(base: number, exp: number, mod: number): number {
  let b = base % mod;
  let e = exp;
  let out = 1;
  while (e > 0) {
    if (e & 1) out = (out * b) % mod;
    b = (b * b) % mod;
    e >>= 1;
  }
  return out;
}

export function validateShorInput(N: number, a: number): ShorValidationError | null {
  if (!Number.isInteger(N) || N < SHOR_N_MIN || N > SHOR_N_MAX) {
    return { ok: false, message: `N must be a composite integer ${SHOR_N_MIN}–${SHOR_N_MAX}.` };
  }
  if (!isComposite(N)) {
    return { ok: false, message: `${N} is not composite (Shor targets composite moduli).` };
  }
  if (!Number.isInteger(a) || a < 2 || a >= N) {
    return { ok: false, message: `Base a must satisfy 2 ≤ a < N (${N}).` };
  }
  const g = gcd(a, N);
  if (g !== 1) {
    return { ok: false, message: `gcd(a, N) = ${g} ≠ 1. Pick a coprime to N or use gcd directly.` };
  }
  return null;
}

/** Smallest n with 2^n ≥ N (at least 2 for this lab). */
export function workQubitsForModulus(N: number): number {
  let n = 2;
  while (2 ** n < N) n += 1;
  return n;
}

/** Multiplicative cycle of a mod N (simulator discovers orbit while building QPE state). */
export function multiplicativeCycleValues(a: number, N: number): number[] {
  const vals: number[] = [1];
  let x = 1;
  for (let i = 0; i < N; i += 1) {
    x = (x * a) % N;
    if (x === 1) break;
    vals.push(x);
  }
  return vals;
}

export function planQuantumSimulation(N: number, a: number): ShorQuantumPlan | null {
  if (gcd(a, N) !== 1) return null;
  const cycle = multiplicativeCycleValues(a, N);
  const orbitSize = Math.max(2, cycle.length);
  const workQubits = Math.max(1, Math.ceil(Math.log2(orbitSize)));
  const countingQubits = SHOR_MAX_TOTAL_QUBITS - workQubits;
  if (countingQubits < 1) return null;
  return {
    countingQubits,
    workQubits,
    totalQubits: workQubits + countingQubits,
    workDimension: 2 ** workQubits,
  };
}

/** Classical brute-force period (reference / verification only). */
export function classicalOrderReference(a: number, N: number): number | null {
  if (gcd(a, N) !== 1) return null;
  let x = 1;
  for (let r = 1; r <= N; r += 1) {
    x = (x * a) % N;
    if (x === 1) return r;
  }
  return null;
}

export function tryExtractFactors(N: number, r: number, a: number): ShorFactorResult {
  if (r % 2 !== 0) {
    return { ok: false, reason: "Order r is odd — need an even r for the usual gcd(a^{r/2} ± 1, N) step." };
  }
  const half = modPow(a, r / 2, N);
  if (half === N - 1) {
    return { ok: false, reason: "a^{r/2} ≡ −1 (mod N); this trial does not split N (try another base)." };
  }
  const p = gcd(half - 1, N);
  const q = gcd(half + 1, N);
  if (p <= 1 || q <= 1 || p * q !== N) {
    return { ok: false, reason: "Candidate gcds did not yield non-trivial factors of N." };
  }
  return { ok: true, p: Math.min(p, q), q: Math.max(p, q), via: "order" };
}

export function tryGcdFactor(N: number, a: number): ShorFactorResult {
  const g = gcd(a, N);
  if (g <= 1 || g >= N) {
    return { ok: false, reason: "gcd(a, N) is trivial — need a coprime base for period finding." };
  }
  return { ok: true, p: g, q: N / g, via: "gcd" };
}

/** Convergents of num/den; return denominators r that satisfy a^r ≡ 1 (mod N). */
export function orderCandidatesFromPhase(
  count: number,
  countingBits: number,
  a: number,
  N: number,
): { orders: number[]; phaseNumerator: number; phaseDenominator: number } {
  const den = 2 ** countingBits;
  const phaseNumerator = count;
  const phaseDenominator = den;
  const orders: number[] = [];
  let p0 = 0;
  let q0 = 1;
  let p1 = count;
  let q1 = den;
  const pushIfPeriod = (r: number) => {
    if (r > 0 && r < N && !orders.includes(r) && modPow(a, r, N) === 1) orders.push(r);
  };
  pushIfPeriod(q1);
  let aRem = count;
  let bRem = den;
  for (let i = 0; i < 12 && bRem !== 0; i += 1) {
    const quot = Math.floor(aRem / bRem);
    const p2 = quot * p1 + p0;
    const q2 = quot * q1 + q0;
    pushIfPeriod(q2);
    p0 = p1;
    q0 = q1;
    p1 = p2;
    q1 = q2;
    const t = aRem % bRem;
    aRem = bRem;
    bRem = t;
  }
  const merged = [...orders, ...phaseOrderScan(phaseNumerator, phaseDenominator, a, N)];
  return { orders: expandPeriodCandidates(merged, a, N), phaseNumerator, phaseDenominator };
}

/** Match c/2^t to k/r for small periods (educational fallback when CF list is sparse). */
export function phaseOrderScan(count: number, den: number, a: number, N: number, tol = 1e-6): number[] {
  const phase = count / den;
  const found: number[] = [];
  for (let r = 2; r <= N; r += 1) {
    if (modPow(a, r, N) !== 1) continue;
    for (let k = 0; k < r; k += 1) {
      const target = k / r;
      if (Math.abs(phase - target) < tol || Math.abs(phase - target - 1) < tol || Math.abs(phase - target + 1) < tol) {
        found.push(r);
        break;
      }
    }
  }
  return found;
}

/** Include divisors of CF denominators that are still valid periods. */
export function expandPeriodCandidates(orders: number[], a: number, N: number): number[] {
  const expanded = new Set<number>();
  for (const q of orders) {
    for (let d = 1; d <= q; d += 1) {
      if (q % d === 0 && modPow(a, d, N) === 1) expanded.add(d);
    }
  }
  return [...expanded].sort((x, y) => x - y);
}

function indexCountWork(count: number, work: number, countingBits: number): number {
  return count + (work << countingBits);
}

function transformCountingSlice(
  normalized: Complex[],
  countingBits: number,
  mode: ShorIqftMode,
): Complex[] | ShorValidationError {
  if (mode === "gate") {
    return applyQftGateSequence({ qubits: countingBits, amplitudes: normalized }, true).amplitudes;
  }
  const transformed = applyInverseQft({ qubits: countingBits, amplitudes: normalized });
  if (isQftValidationError(transformed)) {
    return { ok: false, message: transformed.message };
  }
  return transformed.amplitudes;
}

function applyIqftOnJoint(
  amps: Complex[],
  countingBits: number,
  workDim: number,
  mode: ShorIqftMode,
): Complex[] | ShorValidationError {
  const out = amps.map((z) => complex(z.re, z.im));
  const tDim = 2 ** countingBits;
  for (let w = 0; w < workDim; w += 1) {
    const slice: Complex[] = [];
    for (let c = 0; c < tDim; c += 1) {
      slice.push(out[indexCountWork(c, w, countingBits)]);
    }
    const weight = slice.reduce((s, z) => s + normSquared(z), 0);
    if (weight < 1e-14) continue;
    const invNorm = 1 / Math.sqrt(weight);
    const normalized = slice.map((z) => scale(z, invNorm));
    const transformed = transformCountingSlice(normalized, countingBits, mode);
    if (isShorValidationError(transformed)) return transformed;
    const scaleBack = Math.sqrt(weight);
    for (let c = 0; c < tDim; c += 1) {
      out[indexCountWork(c, w, countingBits)] = scale(transformed[c], scaleBack);
    }
  }
  return out;
}

function marginalCountingProbabilities(amps: Complex[], countingBits: number, workDim: number): number[] {
  const tDim = 2 ** countingBits;
  const probs = Array.from({ length: tDim }, () => 0);
  for (let w = 0; w < workDim; w += 1) {
    for (let c = 0; c < tDim; c += 1) {
      probs[c] += normSquared(amps[indexCountWork(c, w, countingBits)]);
    }
  }
  return probs;
}

export function buildPreIqftJointAmplitudes(
  N: number,
  a: number,
  plan: ShorQuantumPlan,
): Complex[] | ShorValidationError {
  const { countingQubits: t, workDimension: M } = plan;
  const cycle = multiplicativeCycleValues(a, N);
  const valueToIndex = new Map(cycle.map((v, i) => [v, i]));
  const tDim = 2 ** t;
  const scale = 1 / Math.sqrt(tDim);
  const amps = Array.from({ length: M * tDim }, () => complex(0, 0));
  for (let j = 0; j < tDim; j += 1) {
    const val = modPow(a, j, N);
    const wi = valueToIndex.get(val);
    if (wi === undefined) continue;
    amps[indexCountWork(j, wi, t)] = complex(scale, 0);
  }
  return amps;
}

/** |0..0>|1> (orbit index 0) -> H on counting -> controlled orbit multiplies a^{2^j}. */
export function buildPreIqftViaGates(
  N: number,
  a: number,
  plan: ShorQuantumPlan,
): Complex[] | ShorValidationError {
  const t = plan.countingQubits;
  const m = plan.workDimension;
  const r = multiplicativeCycleValues(a, N).length;
  const dim = m * 2 ** t;
  let amps = Array.from({ length: dim }, () => complex(0, 0));
  amps[indexCountWork(0, 0, t)] = complex(1, 0);
  for (let q = 0; q < t; q += 1) {
    amps = applyHadamardCountingQubit(amps, t, m, q);
  }
  for (let j = 0; j < t; j += 1) {
    amps = applyControlledOrbitMultiply(amps, t, m, j, 2 ** j, r);
  }
  if (Math.abs(jointTotalProbability(amps) - 1) > QFT_NUMERIC_TOLERANCE) {
    return { ok: false, message: "Gate mod-exp path did not preserve unit norm." };
  }
  return amps;
}

export function simulateModExpComparison(N: number, a: number): ShorModExpComparison | ShorValidationError {
  const err = validateShorInput(N, a);
  if (err) return err;
  const plan = planQuantumSimulation(N, a);
  if (!plan) {
    return { ok: false, message: "Quantum register plan exceeds the 5-qubit educational simulator budget." };
  }
  const closed = buildPreIqftJointAmplitudes(N, a, plan);
  if (isShorValidationError(closed)) return closed;
  const gated = buildPreIqftViaGates(N, a, plan);
  if (isShorValidationError(gated)) return gated;
  const r = multiplicativeCycleValues(a, N).length;
  const preFidelity = stateOverlapFidelity(closed, gated);
  const { countingQubits: t, workDimension: M } = plan;
  const closedPost = applyIqftOnJoint(closed.slice(), t, M, "direct");
  if (isShorValidationError(closedPost)) return closedPost;
  const gatePost = applyIqftOnJoint(gated.slice(), t, M, "direct");
  if (isShorValidationError(gatePost)) return gatePost;
  const closedProbs = marginalCountingProbabilities(closedPost, t, M);
  const gateProbs = marginalCountingProbabilities(gatePost, t, M);
  const metrics = compareCountingProbabilities(closedProbs, gateProbs);
  return {
    workEncoding: SHOR_WORK_ENCODING,
    orbitSize: r,
    closedPreNorm: jointTotalProbability(closed),
    gatePreNorm: jointTotalProbability(gated),
    preIqftStateFidelity: preFidelity,
    preIqftStatesAligned: preFidelity >= 1 - QFT_NUMERIC_TOLERANCE,
    closedProbabilities: closedProbs,
    gatePreparationProbabilities: gateProbs,
    l1Distance: metrics.l1,
    bhattacharyyaFidelity: metrics.bhattacharyyaFidelity,
    maxAbsoluteDifference: metrics.maxAbsDiff,
    distributionsAligned: metrics.bhattacharyyaFidelity >= 1 - QFT_NUMERIC_TOLERANCE,
  };
}

export function jointTotalProbability(amps: Complex[]): number {
  return amps.reduce((s, z) => s + normSquared(z), 0);
}

export function simulateIqftComparison(N: number, a: number): ShorIqftComparison | ShorValidationError {
  const err = validateShorInput(N, a);
  if (err) return err;
  const plan = planQuantumSimulation(N, a);
  if (!plan) {
    return { ok: false, message: "Quantum register plan exceeds the 5-qubit educational simulator budget." };
  }
  const pre = buildPreIqftJointAmplitudes(N, a, plan);
  if (isShorValidationError(pre)) return pre;
  const preNorm = jointTotalProbability(pre);
  const { countingQubits: t, workDimension: M } = plan;
  const directOut = applyIqftOnJoint(pre.slice(), t, M, "direct");
  if (isShorValidationError(directOut)) return directOut;
  const directProbs = marginalCountingProbabilities(directOut, t, M);
  const postNormDirect = jointTotalProbability(directOut);
  const supported = gateIqftSupported(t);
  let gateProbs: number[] | null = null;
  let metrics: ReturnType<typeof compareCountingProbabilities> | null = null;
  if (supported) {
    const gateOut = applyIqftOnJoint(pre.slice(), t, M, "gate");
    if (isShorValidationError(gateOut)) return gateOut;
    if (Math.abs(jointTotalProbability(gateOut) - 1) > QFT_NUMERIC_TOLERANCE) {
      return { ok: false, message: "Gate IQFT path did not preserve unit norm." };
    }
    gateProbs = marginalCountingProbabilities(gateOut, t, M);
    metrics = compareCountingProbabilities(directProbs, gateProbs);
  }
  return {
    gateIqftSupported: supported,
    referenceMode: "direct",
    gateModeLabel: supported
      ? "NC gate IQFT + swap layer (same as QFT lab gate path)"
      : "unsupported — counting width outside gate simulator",
    preIqftNorm: preNorm,
    postIqftNormDirect: postNormDirect,
    directProbabilities: directProbs,
    gateProbabilities: gateProbs,
    l1Distance: metrics?.l1 ?? null,
    bhattacharyyaFidelity: metrics?.bhattacharyyaFidelity ?? null,
    maxAbsoluteDifference: metrics?.maxAbsDiff ?? null,
    distributionsAligned:
      metrics !== null && metrics.bhattacharyyaFidelity >= 1 - QFT_NUMERIC_TOLERANCE,
  };
}

export type ShorQuantumSimulationResult = {
  ok: true;
  plan: ShorQuantumPlan;
  path: ShorSimulationPath;
  preIqftNorm: number;
  postIqftNorm: number;
  probabilities: number[];
  cycleLength: number;
};

function buildPreIqftForPath(
  N: number,
  a: number,
  plan: ShorQuantumPlan,
  path: ShorSimulationPath,
): Complex[] | ShorValidationError {
  if (path === "gate_e2e") {
    return buildPreIqftViaGates(N, a, plan);
  }
  return buildPreIqftJointAmplitudes(N, a, plan);
}

function iqftModeForPath(path: ShorSimulationPath): ShorIqftMode {
  return path === "closed_direct" ? "direct" : "gate";
}

export function simulateCountingForPath(
  N: number,
  a: number,
  path: ShorSimulationPath,
): ShorQuantumSimulationResult | ShorValidationError {
  const err = validateShorInput(N, a);
  if (err) return err;
  const plan = planQuantumSimulation(N, a);
  if (!plan) {
    return { ok: false, message: "Quantum register plan exceeds the 5-qubit educational simulator budget." };
  }
  const t = plan.countingQubits;
  if (path !== "closed_direct" && !gateIqftSupported(t)) {
    return {
      ok: false,
      message: `Simulation path "${path}" requires gate IQFT; counting width t=${t} is outside the gate simulator (1–${QFT_MAX_QUBITS}).`,
    };
  }
  const pre = buildPreIqftForPath(N, a, plan, path);
  if (isShorValidationError(pre)) return pre;
  const preNorm = jointTotalProbability(pre);
  const { workDimension: M } = plan;
  const mode = iqftModeForPath(path);
  const afterQft = applyIqftOnJoint(pre.slice(), t, M, mode);
  if (isShorValidationError(afterQft)) return afterQft;
  const postNorm = jointTotalProbability(afterQft);
  if (Math.abs(postNorm - 1) > QFT_NUMERIC_TOLERANCE) {
    return { ok: false, message: `Path "${path}" did not preserve unit norm after inverse QFT.` };
  }
  const probs = marginalCountingProbabilities(afterQft, t, M);
  const probSum = probs.reduce((s, p) => s + p, 0);
  if (Math.abs(probSum - 1) > QFT_NUMERIC_TOLERANCE) {
    return { ok: false, message: `Path "${path}" counting marginals do not sum to 1.` };
  }
  return {
    ok: true,
    plan,
    path,
    preIqftNorm: preNorm,
    postIqftNorm: postNorm,
    probabilities: probs,
    cycleLength: multiplicativeCycleValues(a, N).length,
  };
}

export function simulateQuantumCountingDistribution(
  N: number,
  a: number,
): ShorQuantumSimulationResult | ShorValidationError {
  return simulateCountingForPath(N, a, "closed_direct");
}

export function simulateThreePathComparison(N: number, a: number): ShorThreePathComparison | ShorValidationError {
  const err = validateShorInput(N, a);
  if (err) return err;
  const plan = planQuantumSimulation(N, a);
  if (!plan) {
    return { ok: false, message: "Quantum register plan exceeds the 5-qubit educational simulator budget." };
  }
  const supported = gateIqftSupported(plan.countingQubits);
  const directSim = simulateCountingForPath(N, a, "closed_direct");
  if (isShorValidationError(directSim)) return directSim;
  let closedGate: number[] | null = null;
  let gateE2e: number[] | null = null;
  let m1: ShorPathDistributionMetrics | null = null;
  let m2: ShorPathDistributionMetrics | null = null;
  let m3: ShorPathDistributionMetrics | null = null;
  if (supported) {
    const g1 = simulateCountingForPath(N, a, "closed_gate");
    if (isShorValidationError(g1)) return g1;
    closedGate = g1.probabilities;
    m1 = toPathMetrics(compareCountingProbabilities(directSim.probabilities, closedGate));
    const g2 = simulateCountingForPath(N, a, "gate_e2e");
    if (isShorValidationError(g2)) return g2;
    gateE2e = g2.probabilities;
    m2 = toPathMetrics(compareCountingProbabilities(directSim.probabilities, gateE2e));
    m3 = toPathMetrics(compareCountingProbabilities(closedGate, gateE2e));
  }
  return {
    gateIqftSupported: supported,
    gateE2eSupported: supported,
    closedDirectProbabilities: directSim.probabilities,
    closedGateProbabilities: closedGate,
    gateE2eProbabilities: gateE2e,
    closedDirectVsClosedGate: m1,
    closedDirectVsGateE2e: m2,
    closedGateVsGateE2e: m3,
    comparisonNote:
      "Full joint-state overlap is reported separately (closed-form vs gate mod-exp pre-IQFT). All three paths compare counting-register marginals P(c) after IQFT; orbit_compact padding makes work slices the right object for marginal comparison.",
  };
}

export function sampleCountingFromDistribution(probabilities: number[], seed: number): number | ShorValidationError {
  const err = validateCountingProbabilities(probabilities);
  if (err) return err;
  const seedErr = validateShorSampleSeed(seed);
  if (seedErr) return seedErr;
  return sampleCountingWithRng(probabilities, mulberry32(seed));
}

function classifyShotOutcome(N: number, a: number, countingBits: number, measured: number): ShorShotOutcomeAnalysis {
  const cf = orderCandidatesFromPhase(measured, countingBits, a, N);
  if (cf.orders.length === 0) {
    return {
      measured,
      phaseCandidates: [],
      factorResult: null,
      category: "no_candidates",
      detail: "Continued-fraction / phase scan found no valid period candidates.",
    };
  }
  for (const candidate of cf.orders) {
    const attempt = tryExtractFactors(N, candidate, a);
    if (attempt.ok) {
      return {
        measured,
        phaseCandidates: cf.orders,
        factorResult: attempt,
        category: "success",
        detail: `Nontrivial factors from r = ${candidate}.`,
      };
    }
  }
  const probe = tryExtractFactors(N, cf.orders[0], a);
  if (!probe.ok && probe.reason.includes("odd")) {
    return {
      measured,
      phaseCandidates: cf.orders,
      factorResult: probe,
      category: "odd_order",
      detail: probe.reason,
    };
  }
  if (!probe.ok && (probe.reason.includes("−1") || probe.reason.includes("-1"))) {
    return {
      measured,
      phaseCandidates: cf.orders,
      factorResult: probe,
      category: "minus_one",
      detail: probe.reason,
    };
  }
  if (!probe.ok && (probe.reason.includes("trivial") || probe.reason.includes("gcd"))) {
    return {
      measured,
      phaseCandidates: cf.orders,
      factorResult: probe,
      category: "trivial_factor",
      detail: probe.reason,
    };
  }
  return {
    measured,
    phaseCandidates: cf.orders,
    factorResult: probe.ok ? probe : probe,
    category: "failed_phase",
    detail: probe.ok ? "Factor extraction succeeded on fallback." : probe.reason,
  };
}

export function buildMultiShotSummary(
  N: number,
  a: number,
  countingBits: number,
  probabilities: number[],
  seed: number,
  shots: number,
): ShorMultiShotSummary | ShorValidationError {
  const sequence = sampleShorShotSequence(probabilities, seed, shots);
  if (!Array.isArray(sequence)) return sequence;
  const histogram = buildShotHistogram(probabilities, sequence, shots);
  const metrics = summarizeHistogramMetrics(probabilities, sequence, shots);
  const uniqueOutcomes = [...new Set(sequence)].sort((x, y) => x - y);
  const uniqueOutcomeAnalyses = uniqueOutcomes.map((c) => classifyShotOutcome(N, a, countingBits, c));
  let shotsWithPhaseCandidates = 0;
  let shotsWithSuccessfulFactors = 0;
  for (const c of sequence) {
    const analysis = uniqueOutcomeAnalyses.find((u) => u.measured === c);
    if (analysis && analysis.phaseCandidates.length > 0) shotsWithPhaseCandidates += 1;
    if (analysis?.category === "success") shotsWithSuccessfulFactors += 1;
  }
  return {
    shots,
    seed,
    sequence,
    histogram,
    ...metrics,
    uniqueOutcomeAnalyses,
    shotsWithPhaseCandidates,
    shotsWithSuccessfulFactors,
  };
}

export function pickPrimaryFromMultiShot(
  N: number,
  a: number,
  summary: ShorMultiShotSummary,
): { measured: number; order: number | null; factors: ShorFactorResult | null } {
  for (const c of summary.sequence) {
    const analysis = summary.uniqueOutcomeAnalyses.find((u) => u.measured === c);
    if (analysis?.category === "success" && analysis.factorResult?.ok) {
      for (const candidate of analysis.phaseCandidates) {
        const attempt = tryExtractFactors(N, candidate, a);
        if (attempt.ok) {
          return { measured: c, order: candidate, factors: attempt };
        }
      }
    }
  }
  const top = summary.histogram[0];
  const measured = top?.outcome ?? 0;
  const analysis = summary.uniqueOutcomeAnalyses.find((u) => u.measured === measured);
  return {
    measured,
    order: analysis?.phaseCandidates[0] ?? null,
    factors: analysis?.factorResult?.ok ? analysis.factorResult : null,
  };
}

export function resolveOrderFromSingleCount(
  N: number,
  a: number,
  countingBits: number,
  measured: number,
): { order: number | null; factors: ShorFactorResult | null } {
  const cf = orderCandidatesFromPhase(measured, countingBits, a, N);
  for (const candidate of cf.orders) {
    const attempt = tryExtractFactors(N, candidate, a);
    if (attempt.ok) return { order: candidate, factors: attempt };
  }
  const order = cf.orders[0] ?? null;
  return {
    order,
    factors: order !== null ? tryExtractFactors(N, order, a) : null,
  };
}

export function pickDeterministicMeasurement(probabilities: number[]): number {
  let best = 0;
  let bestP = -1;
  for (let c = 0; c < probabilities.length; c += 1) {
    if (probabilities[c] > bestP + 1e-12) {
      bestP = probabilities[c];
      best = c;
    } else if (Math.abs(probabilities[c] - bestP) <= 1e-12 && c < best) {
      best = c;
    }
  }
  return best;
}

/** Try high-probability measurements until factor extraction succeeds. */
export function resolveMeasurementAndOrder(
  N: number,
  a: number,
  countingBits: number,
  probabilities: number[],
): { measured: number; order: number | null; factors: ShorFactorResult | null } {
  const ranked = probabilities
    .map((p, c) => ({ c, p }))
    .sort((x, y) => y.p - x.p || x.c - y.c);
  for (const { c } of ranked) {
    if (ranked[0].p > 0 && ranked[0].p - probabilities[c] > 1e-9) break;
    const cf = orderCandidatesFromPhase(c, countingBits, a, N);
    for (const candidate of cf.orders) {
      const attempt = tryExtractFactors(N, candidate, a);
      if (attempt.ok) {
        return { measured: c, order: candidate, factors: attempt };
      }
    }
  }
  const measured = pickDeterministicMeasurement(probabilities);
  const cf = orderCandidatesFromPhase(measured, countingBits, a, N);
  const order = cf.orders[0] ?? null;
  return {
    measured,
    order,
    factors: order !== null ? tryExtractFactors(N, order, a) : null,
  };
}

export function runShorEducationalWorkflow(
  N: number,
  a: number,
  options: ShorWorkflowOptions = {},
): ShorRunResult | ShorValidationError {
  const simulationPath: ShorSimulationPath = options.simulationPath ?? "closed_direct";
  const measurementPolicy: ShorMeasurementPolicy = options.measurementPolicy ?? "deterministic_peak";
  const sampleSeed = options.sampleSeed ?? 1;
  const shotCount = options.shotCount ?? SHOR_DEFAULT_SHOTS;
  if (measurementPolicy === "multi_shot") {
    const seedErr = validateShorSampleSeed(sampleSeed);
    if (seedErr) return seedErr;
    const shotErr = validateShorShotCount(shotCount);
    if (shotErr) return shotErr;
  }
  const steps: ShorWorkflowStep[] = [];
  const err = validateShorInput(N, a);
  if (err) return err;

  steps.push({
    kind: "preprocess",
    title: "Problem setup",
    detail: `Factor composite N = ${N} by reducing to order finding for a base a (coprime to N).`,
    status: "info",
  });

  const g = gcd(a, N);
  steps.push({
    kind: "gcd",
    title: "Coprimality check",
    detail: `gcd(${a}, ${N}) = ${g}. ${g === 1 ? "Proceed to period finding." : "Non-trivial gcd already factors N."}`,
    status: g === 1 ? "success" : "warning",
  });

  if (g !== 1) {
    const fac = tryGcdFactor(N, a);
    return {
      N,
      a,
      steps,
      simulationPath: null,
      measurementPolicy: null,
      measurementSeed: null,
      measurementSemantics: null,
      quantumPlan: null,
      countingProbabilities: null,
      measuredCounting: null,
      phaseNumerator: null,
      phaseDenominator: null,
      orderFromMeasurement: null,
      factors: fac.ok ? fac : null,
      classicalReferenceOrder: null,
      iqftComparison: null,
      modexpComparison: null,
      pathComparison: null,
      shotCount: null,
      multiShot: null,
    };
  }

  const classicalReferenceOrder = classicalOrderReference(a, N);
  const plan = planQuantumSimulation(N, a);

  if (!plan) {
    steps.push({
      kind: "quantum_plan",
      title: "Quantum simulation unavailable",
      detail: `Work register needs ${workQubitsForModulus(N)} qubits; with ≤${SHOR_MAX_TOTAL_QUBITS} total qubits there is no counting register. Use classical reference order finding below (not a hardware measurement).`,
      status: "warning",
    });
    steps.push({
      kind: "classical_reference",
      title: "Classical reference period (not quantum measurement)",
      detail:
        classicalReferenceOrder !== null
          ? `Brute-force check gives r = ${classicalReferenceOrder} for verification only.`
          : "Could not find a period classically.",
      status: "info",
    });
    let factors: ShorFactorResult | null = null;
    if (classicalReferenceOrder !== null) {
      factors = tryExtractFactors(N, classicalReferenceOrder, a);
      steps.push({
        kind: "factor_attempt",
        title: "Factor extraction (classical r)",
        detail: factors.ok ? `Non-trivial factors: ${factors.p} × ${factors.q} = ${N}.` : factors.reason,
        status: factors.ok ? "success" : "warning",
      });
    }
    return {
      N,
      a,
      steps,
      simulationPath: null,
      measurementPolicy: null,
      measurementSeed: null,
      measurementSemantics: null,
      quantumPlan: null,
      countingProbabilities: null,
      measuredCounting: null,
      phaseNumerator: null,
      phaseDenominator: null,
      orderFromMeasurement: null,
      factors,
      classicalReferenceOrder,
      iqftComparison: null,
      modexpComparison: null,
      pathComparison: null,
      shotCount: null,
      multiShot: null,
    };
  }

  steps.push({
    kind: "quantum_plan",
    title: "Quantum register layout",
    detail: `${plan.countingQubits} counting qubits (q0…q${plan.countingQubits - 1}, LSB-first index) + ${plan.workQubits} work qubits (${SHOR_WORK_ENCODING}: orbit index, not a full value register). Closed-form prep builds (1/sqrt(2^t)) sum_j |j>|a^j>; gate prep uses H on counting, |1> on work, then controlled orbit multiplies a^{2^j}.`,
    status: "info",
  });

  const pathCmpResult = simulateThreePathComparison(N, a);
  if (isShorValidationError(pathCmpResult)) return pathCmpResult;
  const pathComparison = pathCmpResult;

  const simResult = simulateCountingForPath(N, a, simulationPath);
  if (isShorValidationError(simResult)) return simResult;
  const sim = simResult;

  steps.push({
    kind: "quantum_evolve",
    title: "Selected ideal simulation path",
    detail: `${SHOR_SIMULATION_PATH_LABELS[simulationPath]} — ${plan.countingQubits} counting qubits (q0 LSB, NC+swap IQFT when gate path), ${plan.workQubits} work qubits (${SHOR_WORK_ENCODING}). Pre-IQFT norm ${sim.preIqftNorm.toFixed(6)}, post-IQFT norm ${sim.postIqftNorm.toFixed(6)}. Not hardware.`,
    status: "info",
  });

  const modexpCmpResult = simulateModExpComparison(N, a);
  const modexpComparison = isShorValidationError(modexpCmpResult) ? null : modexpCmpResult;
  if (modexpComparison) {
    steps.push({
      kind: "modexp_comparison",
      title: "State preparation: gate mod-exp vs closed-form",
      detail: modexpComparison.preIqftStatesAligned
        ? `Ideal gate sequence (Hadamard + controlled orbit permutations, r=${modexpComparison.orbitSize}) matches closed-form pre-IQFT state (fidelity ${modexpComparison.preIqftStateFidelity.toFixed(8)}). After direct IQFT, Bhattacharyya ${modexpComparison.bhattacharyyaFidelity.toFixed(6)} on counting marginals.`
        : `Gate and closed-form paths diverge: pre-IQFT fidelity ${modexpComparison.preIqftStateFidelity.toFixed(6)}, Bhattacharyya ${modexpComparison.bhattacharyyaFidelity.toFixed(6)} — inspect without renormalizing away the gap.`,
      status: modexpComparison.distributionsAligned && modexpComparison.preIqftStatesAligned ? "success" : "warning",
    });
  }

  const iqftCmpResult = simulateIqftComparison(N, a);
  const iqftComparison = isShorValidationError(iqftCmpResult) ? null : iqftCmpResult;
  if (iqftComparison) {
    steps.push({
      kind: "iqft_comparison",
      title: "IQFT path comparison (closed-form prep only)",
      detail: iqftComparison.gateIqftSupported
        ? `Same pre-IQFT state: direct vs gate IQFT marginals — Bhattacharyya ${iqftComparison.bhattacharyyaFidelity?.toFixed(6) ?? "—"}, L1 ${iqftComparison.l1Distance?.toExponential(2) ?? "—"}. Three-path table compares closed+direct, closed+gate, and gate mod-exp+gate IQFT.`
        : `Gate-level IQFT not shown: ${iqftComparison.gateModeLabel}.`,
      status: iqftComparison.distributionsAligned ? "success" : "warning",
    });
  }

  if (pathComparison.gateIqftSupported && pathComparison.closedDirectVsGateE2e) {
    const m = pathComparison.closedDirectVsGateE2e;
    steps.push({
      kind: "path_comparison",
      title: "Three-path counting distributions",
      detail: `Reference vs end-to-end gate path: Bhattacharyya ${m.bhattacharyyaFidelity.toFixed(6)}, L1 ${m.l1Distance.toExponential(2)}, max |ΔP| ${m.maxAbsoluteDifference.toExponential(2)}. ${pathComparison.comparisonNote}`,
      status: m.bhattacharyyaFidelity >= 1 - QFT_NUMERIC_TOLERANCE ? "success" : "warning",
    });
  }

  let measuredCounting: number;
  let orderFromMeasurement: number | null;
  let factors: ShorFactorResult | null;
  let measurementSemantics: string;
  let multiShot: ShorMultiShotSummary | null = null;

  if (measurementPolicy === "multi_shot") {
    const probErr = validateCountingProbabilities(sim.probabilities);
    if (probErr) return probErr;
    const built = buildMultiShotSummary(N, a, plan.countingQubits, sim.probabilities, sampleSeed, shotCount);
    if (isShorValidationError(built)) return built;
    multiShot = built;
    const primary = pickPrimaryFromMultiShot(N, a, multiShot);
    measuredCounting = primary.measured;
    orderFromMeasurement = primary.order;
    factors = primary.factors;
    measurementSemantics = `Multi-shot ideal Born sampling (${shotCount} shots, seed=${sampleSeed}) from path "${SHOR_SIMULATION_PATH_LABELS[simulationPath]}" — not noisy hardware.`;
    const useful = multiShot.uniqueOutcomeAnalyses.filter((u) => u.phaseCandidates.length > 0);
    const successes = multiShot.uniqueOutcomeAnalyses.filter((u) => u.category === "success");
    steps.push({
      kind: "multi_shot",
      title: "Multi-shot histogram vs theory",
      detail: `${shotCount} samples: L1(|empirical−P|)=${multiShot.l1EmpiricalVsTheory.toFixed(4)}, max |Δ|=${multiShot.maxAbsFrequencyDelta.toFixed(4)}. ${successes.length} distinct outcomes factor N nontrivially; ${useful.length} distinct outcomes yield phase candidates. Most shots are not successful factorizations — real Shor repeats many times.`,
      status: "info",
    });
    const outcomeLines = multiShot.uniqueOutcomeAnalyses
      .slice(0, 6)
      .map((u) => `c=${u.measured} (${u.category}): ${u.detail}`)
      .join(" · ");
    steps.push({
      kind: "continued_fraction",
      title: "Phase recovery across distinct outcomes",
      detail:
        outcomeLines.length > 0
          ? outcomeLines
          : "No phase candidates from observed outcomes in this sample.",
      status: useful.length > 0 ? "success" : "warning",
    });
  } else {
    const resolved = resolveMeasurementAndOrder(N, a, plan.countingQubits, sim.probabilities);
    measuredCounting = resolved.measured;
    orderFromMeasurement = resolved.order;
    factors = resolved.factors;
    measurementSemantics =
      "Deterministic peak pick (ties → smallest c, then try tied peaks for factor extraction) — teaching default, not random hardware sampling.";
  }

  steps.push({
    kind: "measurement",
    title: "Counting-register outcome (simulated)",
    detail: `${measurementSemantics} Primary c = ${measuredCounting} for summary post-processing. Not from classical order search.`,
    status: "success",
  });

  const cf = orderCandidatesFromPhase(measuredCounting, plan.countingQubits, a, N);
  if (measurementPolicy !== "multi_shot") {
    steps.push({
      kind: "continued_fraction",
      title: "Continued-fraction post-processing",
      detail:
        cf.orders.length > 0
          ? `Phase estimate c/2^t ≈ ${cf.phaseNumerator}/${cf.phaseDenominator} → period candidates ${cf.orders.join(", ")} (including divisors of CF denominators).`
          : `No valid period from c = ${measuredCounting}; retry with another measurement or base.`,
      status: cf.orders.length > 0 ? "success" : "warning",
    });
  }

  if (orderFromMeasurement !== null) {
    steps.push({
      kind: "factor_attempt",
      title: "Factor extraction from measured order",
      detail: factors?.ok
        ? `Success with r = ${orderFromMeasurement}: ${factors.p} × ${factors.q} = ${N}.`
        : factors?.reason ?? "Factor extraction failed.",
      status: factors?.ok ? "success" : "warning",
    });
  }

  if (classicalReferenceOrder !== null) {
    steps.push({
      kind: "classical_reference",
      title: "Classical reference period (verification only)",
      detail: `Brute-force r = ${classicalReferenceOrder} for cross-check — not used as the simulated measurement.`,
      status: "info",
    });
  }

  steps.push({
    kind: "limitation",
    title: "Educational scope",
    detail: `Small N (${SHOR_N_MIN}–${SHOR_N_MAX}), ≤${SHOR_MAX_TOTAL_QUBITS} qubits, orbit_compact work register (not a general value mod-mult). Real Shor needs many trials, error correction, and large circuits.`,
    status: "info",
  });

  return {
    N,
    a,
    steps,
    simulationPath,
    measurementPolicy,
    measurementSeed: measurementPolicy === "multi_shot" ? sampleSeed : null,
    measurementSemantics,
    quantumPlan: plan,
    countingProbabilities: sim.probabilities,
    measuredCounting,
    phaseNumerator: cf.phaseNumerator,
    phaseDenominator: cf.phaseDenominator,
    orderFromMeasurement,
    factors,
    classicalReferenceOrder,
    iqftComparison,
    modexpComparison,
    pathComparison,
    shotCount: measurementPolicy === "multi_shot" ? shotCount : null,
    multiShot,
  };
}

/** Expose QFT integration check: IQFT on uniform counting slice matches qftSimulator. */
export function qftConventionSelfCheck(countingBits: number): boolean {
  const tDim = 2 ** countingBits;
  const amps = Array.from({ length: tDim }, () => complex(1 / Math.sqrt(tDim), 0));
  const out = applyInverseQft({ qubits: countingBits, amplitudes: amps });
  if (isQftValidationError(out)) return false;
  const peak = out.amplitudes.reduce((best, z, i) => (normSquared(z) > normSquared(out.amplitudes[best]) ? i : best), 0);
  return peak === 0 && normSquared(out.amplitudes[0]) > 0.99;
}
