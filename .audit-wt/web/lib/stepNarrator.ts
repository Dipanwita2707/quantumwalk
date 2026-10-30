import type { Gate } from "@/lib/circuitPresets";

const gatePlain: Record<string, string> = {
  h: "You mixed 0 and 1 so each outcome is equally likely.",
  x: "You flipped the qubit: what was 0 became 1 and vice versa.",
  y: "You applied a Y gate: the state rotated on the sphere.",
  z: "You applied a phase flip on the 1 side of the superposition.",
  s: "You added a quarter-turn of phase on |1⟩.",
  t: "You added an eighth-turn of phase on |1⟩.",
  rx: "You rotated the state around the X axis.",
  ry: "You rotated the state around the Y axis.",
  rz: "You rotated the state around the Z axis.",
  cx: "You linked two qubits: the second flips when the first is 1.",
  cz: "You linked two qubits with a controlled phase.",
  swap: "You exchanged the states of two qubits.",
  measure: "This step records a readout. The ideal chances above stay the same until you sample many runs.",
};

export function stepNarrator(
  stepIndex: number,
  gate: Gate | null,
  beforeProb?: { zero: number; one: number }
): { headline: string; body: string } {
  if (stepIndex === 0) {
    return {
      headline: "Start",
      body: "Right now every qubit reads 0. Add a gate and run to see the chances change.",
    };
  }
  if (!gate) {
    return { headline: `Step ${stepIndex}`, body: "Watch the bars and the sphere for this moment in the circuit." };
  }
  if (gate === "h" && beforeProb && beforeProb.zero > 0.99) {
    return {
      headline: "After Hadamard",
      body: "H made 0 and 1 equally likely. You have not read the qubit yet.",
    };
  }
  return {
    headline: gate === "measure" ? "Measurement step" : `After ${gate.toUpperCase()}`,
    body: gatePlain[gate] ?? "The simulator updated the state.",
  };
}

export function stepButtonLabel(stepIndex: number, gate: Gate | null): string {
  if (stepIndex === 0) return "Start";
  if (!gate) return `Step ${stepIndex}`;
  if (gate === "measure") return "Measure";
  return `After ${gate.toUpperCase()}`;
}
