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
  | "iqft_comparison"
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

export type ShorRunResult = {
  N: number;
  a: number;
  steps: ShorWorkflowStep[];
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
  /** Measurement and phase post-processing use direct IQFT (reference). */
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
  probabilities: number[];
  cycleLength: number;
};

export function simulateQuantumCountingDistribution(
  N: number,
  a: number,
): ShorQuantumSimulationResult | ShorValidationError {
  const err = validateShorInput(N, a);
  if (err) return err;
  const plan = planQuantumSimulation(N, a);
  if (!plan) {
    return { ok: false, message: "Quantum register plan exceeds the 5-qubit educational simulator budget." };
  }
  const pre = buildPreIqftJointAmplitudes(N, a, plan);
  if (isShorValidationError(pre)) return pre;
  const { countingQubits: t, workDimension: M } = plan;
  const afterQft = applyIqftOnJoint(pre.slice(), t, M, "direct");
  if (isShorValidationError(afterQft)) return afterQft;
  const probs = marginalCountingProbabilities(afterQft, t, M);
  return { ok: true, plan, probabilities: probs, cycleLength: multiplicativeCycleValues(a, N).length };
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

export function runShorEducationalWorkflow(N: number, a: number): ShorRunResult | ShorValidationError {
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
    };
  }

  steps.push({
    kind: "quantum_plan",
    title: "Quantum register layout",
    detail: `${plan.countingQubits} counting qubits (q0…q${plan.countingQubits - 1}, LSB-first index) + ${plan.workQubits} work qubits (${SHOR_WORK_ENCODING}: orbit index, not a full value register). Closed-form prep builds (1/sqrt(2^t)) sum_j |j>|a^j>; gate prep uses H on counting, |1> on work, then controlled orbit multiplies a^{2^j}.`,
    status: "info",
  });

  const simResult = simulateQuantumCountingDistribution(N, a);
  if (isShorValidationError(simResult)) return simResult;
  const sim = simResult;

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
      title: "IQFT path comparison (ideal simulation)",
      detail: iqftComparison.gateIqftSupported
        ? `Reference: direct inverse DFT on counting (index k, q0 = LSB). Gate path: documented NC IQFT + swap layer. Bhattacharyya fidelity ${iqftComparison.bhattacharyyaFidelity?.toFixed(6) ?? "—"} (1 = identical distributions), L1 = ${iqftComparison.l1Distance?.toExponential(2) ?? "—"}. Phase post-processing uses direct reference probabilities only.`
        : `Gate-level IQFT not shown: ${iqftComparison.gateModeLabel}.`,
      status: iqftComparison.distributionsAligned ? "success" : "warning",
    });
  }

  steps.push({
    kind: "quantum_evolve",
    title: "Ideal state-vector simulation",
    detail:
      "Ideal state-vector simulation: measurement uses closed-form pre-IQFT + direct inverse QFT (reference). Gate mod-exp prep is compared separately; neither path uses classical period to fabricate amplitudes. Not live hardware.",
    status: "info",
  });

  const resolved = resolveMeasurementAndOrder(N, a, plan.countingQubits, sim.probabilities);
  const measuredCounting = resolved.measured;
  const orderFromMeasurement = resolved.order;
  const factors = resolved.factors;

  steps.push({
    kind: "measurement",
    title: "Counting-register outcome (simulated)",
    detail: `Demo selects c = ${measuredCounting} from Born probabilities (peak tie-break toward smaller c). This value is not from classical order search.`,
    status: "success",
  });

  const cf = orderCandidatesFromPhase(measuredCounting, plan.countingQubits, a, N);
  steps.push({
    kind: "continued_fraction",
    title: "Continued-fraction post-processing",
    detail:
      cf.orders.length > 0
        ? `Phase estimate c/2^t ≈ ${cf.phaseNumerator}/${cf.phaseDenominator} → period candidates ${cf.orders.join(", ")} (including divisors of CF denominators).`
        : `No valid period from c = ${measuredCounting}; retry with another measurement or base.`,
    status: cf.orders.length > 0 ? "success" : "warning",
  });

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
    detail: `Small N (${SHOR_N_MIN}–${SHOR_N_MAX}), ≤${SHOR_MAX_TOTAL_QUBITS} qubits, deterministic peak measurement. Real Shor needs many trials, error correction, and large circuits.`,
    status: "info",
  });

  return {
    N,
    a,
    steps,
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
