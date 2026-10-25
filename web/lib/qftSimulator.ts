/**
 * Ideal QFT state-vector simulator (QuantumWalk-original, client-side).
 *
 * Convention (documented):
 * - Computational basis |k⟩ with k = Σ_i b_i 2^i where qubit i is bit b_i (q0 = LSB).
 * - Forward QFT: |j⟩ → (1/√N) Σ_k exp(2π i j k / N) |k⟩ (N = 2^n).
 * - Inverse QFT uses exp(-2π i j k / N). No trailing swap layer; not a hardware claim.
 */

export const QFT_MIN_QUBITS = 1;
export const QFT_MAX_QUBITS = 5;

export type Complex = { re: number; im: number };

export type QftStateVector = {
  qubits: number;
  amplitudes: Complex[];
};

export type QftValidationError = { ok: false; message: string };

export const QFT_NUMERIC_TOLERANCE = 1e-8;

export function complex(re: number, im = 0): Complex {
  return { re, im };
}

export function add(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function mul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

export function scale(a: Complex, s: number): Complex {
  return { re: a.re * s, im: a.im * s };
}

export function normSquared(a: Complex): number {
  return a.re * a.re + a.im * a.im;
}

export function stateDimension(qubits: number): number {
  return 2 ** qubits;
}

export function validateQubitCount(qubits: number): QftValidationError | null {
  if (!Number.isInteger(qubits) || qubits < QFT_MIN_QUBITS || qubits > QFT_MAX_QUBITS) {
    return { ok: false, message: `Qubit count must be ${QFT_MIN_QUBITS}–${QFT_MAX_QUBITS}.` };
  }
  return null;
}

export function validateStateVector(state: QftStateVector): QftValidationError | null {
  const qErr = validateQubitCount(state.qubits);
  if (qErr) return qErr;
  const dim = stateDimension(state.qubits);
  if (state.amplitudes.length !== dim) {
    return { ok: false, message: `Expected ${dim} amplitudes for ${state.qubits} qubits.` };
  }
  let sum = 0;
  for (const amp of state.amplitudes) {
    if (!Number.isFinite(amp.re) || !Number.isFinite(amp.im)) {
      return { ok: false, message: "Amplitudes must be finite numbers." };
    }
    sum += normSquared(amp);
  }
  if (Math.abs(sum - 1) > QFT_NUMERIC_TOLERANCE) {
    return { ok: false, message: `State must be normalized (Σ|α|² = ${sum.toFixed(6)}, expected 1).` };
  }
  return null;
}

export function isQftValidationError(v: QftStateVector | QftValidationError): v is QftValidationError {
  return "ok" in v && v.ok === false;
}

export function basisState(qubits: number, index: number): QftStateVector | QftValidationError {
  const qErr = validateQubitCount(qubits);
  if (qErr) return qErr;
  const dim = stateDimension(qubits);
  if (!Number.isInteger(index) || index < 0 || index >= dim) {
    return { ok: false, message: `Basis index must be 0…${dim - 1}.` };
  }
  const amplitudes = Array.from({ length: dim }, (_, i) => complex(i === index ? 1 : 0, 0));
  return { qubits, amplitudes };
}

function omegaFactor(j: number, k: number, n: number, inverse: boolean): Complex {
  const angle = ((inverse ? -1 : 1) * 2 * Math.PI * j * k) / n;
  return complex(Math.cos(angle), Math.sin(angle));
}

/** Apply forward or inverse QFT unitary to a copy of the state. */
export function applyQftTransform(
  state: QftStateVector,
  inverse = false,
): QftStateVector | QftValidationError {
  const vErr = validateStateVector(state);
  if (vErr) return vErr;
  const n = stateDimension(state.qubits);
  const scale = 1 / Math.sqrt(n);
  const out: Complex[] = Array.from({ length: n }, () => complex(0, 0));
  for (let j = 0; j < n; j += 1) {
    for (let k = 0; k < n; k += 1) {
      const factor = mul(omegaFactor(j, k, n, inverse), complex(scale, 0));
      const contrib = mul(factor, state.amplitudes[j]);
      out[k] = add(out[k], contrib);
    }
  }
  return { qubits: state.qubits, amplitudes: out };
}

export function applyForwardQft(state: QftStateVector): QftStateVector | QftValidationError {
  return applyQftTransform(state, false);
}

export function applyInverseQft(state: QftStateVector): QftStateVector | QftValidationError {
  return applyQftTransform(state, true);
}

export function totalProbability(state: QftStateVector): number {
  return state.amplitudes.reduce((s, a) => s + normSquared(a), 0);
}

/** Fidelity |⟨a|b⟩|² — 1 when equal up to global phase. */
export function fidelity(a: QftStateVector, b: QftStateVector): number | null {
  if (a.qubits !== b.qubits || a.amplitudes.length !== b.amplitudes.length) return null;
  let inner = complex(0, 0);
  for (let i = 0; i < a.amplitudes.length; i += 1) {
    const c = a.amplitudes[i];
    const d = b.amplitudes[i];
    inner.re += c.re * d.re + c.im * d.im;
    inner.im += c.re * d.im - c.im * d.re;
  }
  return normSquared(inner);
}

export function statesEqualUpToGlobalPhase(
  a: QftStateVector,
  b: QftStateVector,
  tol = QFT_NUMERIC_TOLERANCE,
): boolean {
  const fid = fidelity(a, b);
  return fid !== null && Math.abs(fid - 1) <= tol;
}

export function amplitudeProbability(amp: Complex): number {
  return normSquared(amp);
}

export function amplitudePhase(amp: Complex): number {
  return Math.atan2(amp.im, amp.re);
}

export function formatBasisLabel(index: number, qubits: number): string {
  return index.toString(2).padStart(qubits, "0");
}

/** One-qubit Hadamard on |0⟩/|1⟩ for convention check. */
export function hadamard1Qubit(input: 0 | 1): QftStateVector {
  const s = 1 / Math.sqrt(2);
  if (input === 0) {
    return { qubits: 1, amplitudes: [complex(s, 0), complex(s, 0)] };
  }
  return { qubits: 1, amplitudes: [complex(s, 0), complex(-s, 0)] };
}
