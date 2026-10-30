import type { Operation } from "@/lib/circuitPresets";

export type StateSnapshot = {
  index: number;
  amplitudes: { basis: string; real: number; imag: number }[];
  probabilities: { basis: string; probability: number }[];
  bloch: { qubit: number; x: number; y: number; z: number; purity: number }[];
};

const EPSILON = 1e-8;

export function phaseDegrees(real: number, imag: number): number | null {
  if (Math.hypot(real, imag) < EPSILON) return null;
  const degrees = ((Math.atan2(imag, real) * 180 / Math.PI) % 360 + 360) % 360;
  return degrees > 359.9999 ? 0 : degrees;
}

export function relativePhases(snapshot: StateSnapshot): Map<string, number | null> {
  const reference = phaseReference(snapshot);
  const origin = reference ? phaseDegrees(reference.real, reference.imag)! : 0;
  return new Map(snapshot.amplitudes.map((amp) => {
    const phase = phaseDegrees(amp.real, amp.imag);
    return [amp.basis, phase === null ? null : (phase - origin + 360) % 360];
  }));
}

/** A dominant component avoids defining relative phase against numerical residue. */
export function phaseReference(snapshot: StateSnapshot) {
  return snapshot.amplitudes.reduce<StateSnapshot["amplitudes"][number] | undefined>((best, amp) =>
    Math.hypot(amp.real, amp.imag) >= EPSILON && (!best || Math.hypot(amp.real, amp.imag) > Math.hypot(best.real, best.imag) + EPSILON) ? amp : best, undefined);
}

export function explainStateStep(step: number, operations: Operation[], snapshots: StateSnapshot[]) {
  const current = snapshots[step];
  if (!current || step === 0) return {
    title: "Initial state",
    action: "Every qubit starts in |0⟩. Follow each gate to see how the full state changes.",
    observation: "The rightmost bit in each basis label is q0. Probability is the squared magnitude of its amplitude.",
  };
  const op = operations[step - 1];
  if (!op) return { title: `Step ${step}`, action: "Inspect the simulator snapshot below.", observation: "" };
  const target = `q${op.target}`;
  const actions: Record<Operation["gate"], string> = {
    h: `H mixes the |0⟩ and |1⟩ amplitudes of ${target}. Contributions can reinforce or cancel each other.`,
    x: `X swaps the |0⟩ and |1⟩ amplitudes of ${target}.`,
    y: `Y swaps the amplitudes of ${target} and multiplies them by opposite imaginary phase factors.`,
    z: `Z turns the phase of ${target}'s |1⟩ component by 180°.`,
    s: `S turns the phase of ${target}'s |1⟩ component by 90°.`,
    t: `T turns the phase of ${target}'s |1⟩ component by 45°.`,
    rx: `RX rotates ${target} around the X axis by ${(op.angle ?? 0).toFixed(3)} radians.`,
    ry: `RY rotates ${target} around the Y axis by ${(op.angle ?? 0).toFixed(3)} radians.`,
    rz: `RZ rotates ${target} around the Z axis by ${(op.angle ?? 0).toFixed(3)} radians.`,
    cx: `CX flips ${target} only in components where control q${op.control} is 1. This can create or undo entanglement.`,
    cz: `CZ adds a 180° phase turn only to components where q${op.control} and ${target} are both 1.`,
    swap: `SWAP exchanges the states of q${op.control} and ${target}.`,
    measure: "Measurement samples the circuit. This teaching view keeps the ideal state; sampled readouts are shown separately.",
  };
  const before = snapshots[step - 1];
  let observation = "The ideal measurement probabilities are unchanged. Inspect the phase arrows for the state structure.";
  if (before) {
    const deltas = current.probabilities.map((row) => ({
      basis: row.basis,
      delta: row.probability - (before.probabilities.find((prev) => prev.basis === row.basis)?.probability ?? 0),
    })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    const largest = deltas[0];
    if (largest && Math.abs(largest.delta) > 0.0001) {
      observation = `P(|${largest.basis}⟩) ${largest.delta > 0 ? "increased" : "decreased"} by ${(Math.abs(largest.delta) * 100).toFixed(1)} percentage points. Compare the probability bars before and after this gate.`;
    } else {
      const previousPhases = relativePhases(before);
      const currentPhases = relativePhases(current);
      const changed = [...currentPhases].find(([basis, phase]) => {
        const previous = previousPhases.get(basis);
        if (phase === null || previous == null) return false;
        const distance = Math.abs(phase - previous);
        return Math.min(distance, 360 - distance) > 0.01;
      });
      if (changed) observation = `Probabilities stay the same, but |${changed[0]}⟩ now has relative phase ${Math.round(changed[1]!)}°. A later mixing gate can turn this phase difference into different probabilities.`;
      else if (op.gate !== "measure") observation = "This gate leaves the displayed probabilities and relative phases unchanged for this input. A global phase alone does not change measurement outcomes.";
    }
  }
  return { title: `After ${op.gate.toUpperCase()} on ${target}`, action: actions[op.gate], observation };
}
