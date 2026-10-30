/**
 * Textbook QFT gate decomposition (QuantumWalk-original).
 * Qubit q0 = LSB; trailing swap layer aligns circuit output with direct DFT — see docs/qft-simulator-conventions.md.
 *
 * Forward: for q = n−1…0 apply H(q), then CP(π/2^{q−j}) with control j, target q (j < q);
 * then SWAP(q_i, q_{n−1−i}) for i = 0…⌊n/2⌋−1.
 * Inverse: reverse gate list with negated CP angles.
 */

import {
  applyForwardQft,
  applyInverseQft,
  complex,
  fidelity,
  isQftValidationError,
  mul,
  type Complex,
  type QftStateVector,
} from "@/lib/qftSimulator";

export type QftGateStep =
  | { kind: "H"; qubit: number }
  | { kind: "CP"; control: number; target: number; angleRad: number; label: string }
  | { kind: "SWAP"; qubitA: number; qubitB: number };

export function buildForwardQftGateSteps(qubits: number): QftGateStep[] {
  const steps: QftGateStep[] = [];
  for (let q = qubits - 1; q >= 0; q -= 1) {
    steps.push({ kind: "H", qubit: q });
    for (let j = q - 1; j >= 0; j -= 1) {
      const power = q - j;
      const angle = Math.PI / 2 ** power;
      steps.push({
        kind: "CP",
        control: j,
        target: q,
        angleRad: angle,
        label: `CP(π/2^${power})`,
      });
    }
  }
  for (let i = 0; i < Math.floor(qubits / 2); i += 1) {
    steps.push({ kind: "SWAP", qubitA: i, qubitB: qubits - 1 - i });
  }
  return steps;
}

export function buildInverseQftGateSteps(qubits: number): QftGateStep[] {
  return [...buildForwardQftGateSteps(qubits)]
    .reverse()
    .map((step) =>
      step.kind === "CP"
        ? { ...step, angleRad: -step.angleRad, label: step.label.replace("CP(", "CP†(") }
        : step,
    );
}

function applyHadamard(amps: Complex[], qubit: number): Complex[] {
  const n = amps.length;
  const out = Array.from({ length: n }, () => complex(0, 0));
  const s = Math.sqrt(2);
  for (let k = 0; k < n; k += 1) {
    if ((k >> qubit) & 1) continue;
    const k1 = k | (1 << qubit);
    out[k] = complex((amps[k].re + amps[k1].re) / s, (amps[k].im + amps[k1].im) / s);
    out[k1] = complex((amps[k].re - amps[k1].re) / s, (amps[k].im - amps[k1].im) / s);
  }
  return out;
}

function applyControlledPhase(amps: Complex[], control: number, target: number, angle: number): Complex[] {
  const phase = complex(Math.cos(angle), Math.sin(angle));
  return amps.map((z, k) => {
    if (((k >> control) & 1) && ((k >> target) & 1)) {
      return mul(z, phase);
    }
    return z;
  });
}

function applySwap(amps: Complex[], qubitA: number, qubitB: number): Complex[] {
  const n = amps.length;
  const out = Array.from({ length: n }, () => complex(0, 0));
  for (let k = 0; k < n; k += 1) {
    const bitA = (k >> qubitA) & 1;
    const bitB = (k >> qubitB) & 1;
    const nk = bitA !== bitB ? k ^ (1 << qubitA) ^ (1 << qubitB) : k;
    out[nk] = amps[k];
  }
  return out;
}

export function applyQftGateSequence(state: QftStateVector, inverse = false): QftStateVector {
  const steps = inverse ? buildInverseQftGateSteps(state.qubits) : buildForwardQftGateSteps(state.qubits);
  let amps = state.amplitudes.slice();
  for (const step of steps) {
    if (step.kind === "H") amps = applyHadamard(amps, step.qubit);
    else if (step.kind === "CP") amps = applyControlledPhase(amps, step.control, step.target, step.angleRad);
    else amps = applySwap(amps, step.qubitA, step.qubitB);
  }
  return { qubits: state.qubits, amplitudes: amps };
}

export function gateSequenceVsDirectFidelity(state: QftStateVector, inverse = false): number | null {
  const fromGates = applyQftGateSequence(state, inverse);
  const fromDirect = inverse ? applyInverseQft(state) : applyForwardQft(state);
  if (isQftValidationError(fromDirect)) return null;
  return fidelity(fromGates, fromDirect);
}
