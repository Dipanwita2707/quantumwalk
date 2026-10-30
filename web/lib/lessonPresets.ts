import type { Operation } from "./circuitPresets";

export const LESSON_CIRCUITS: Record<string, { qubits: number; operations: Operation[] }> = {
  "phase-interference": {
    qubits: 1,
    operations: [{ gate: "h", target: 0 }, { gate: "z", target: 0 }, { gate: "h", target: 0 }],
  },
  superposition: {
    qubits: 1,
    operations: [{ gate: "h", target: 0 }],
  },
  "bell-pair": {
    qubits: 2,
    operations: [
      { gate: "h", target: 0 },
      { gate: "cx", control: 0, target: 1 },
    ],
  },
  "teleportation-demo": {
    qubits: 3,
    operations: [
      { gate: "h", target: 0 },
      { gate: "h", target: 1 },
      { gate: "cx", control: 1, target: 2 },
      { gate: "cx", control: 0, target: 1 },
      { gate: "h", target: 0 },
      { gate: "cx", control: 1, target: 2 },
      { gate: "cz", control: 0, target: 2 },
    ],
  },
  "deutsch-jozsa-balanced": {
    qubits: 2,
    operations: [
      { gate: "x", target: 1 },
      { gate: "h", target: 0 },
      { gate: "h", target: 1 },
      { gate: "cx", control: 0, target: 1 },
      { gate: "h", target: 0 },
    ],
  },
  "grover-two": {
    qubits: 2,
    operations: [
      { gate: "h", target: 0 },
      { gate: "h", target: 1 },
      { gate: "cz", control: 0, target: 1 },
      { gate: "h", target: 0 },
      { gate: "h", target: 1 },
      { gate: "x", target: 0 },
      { gate: "x", target: 1 },
      { gate: "cz", control: 0, target: 1 },
      { gate: "x", target: 0 },
      { gate: "x", target: 1 },
      { gate: "h", target: 0 },
      { gate: "h", target: 1 },
    ],
  },
};

/** Lab and lesson viewer use the same circuit, including lesson-specific phase experiments. */
export function labPresetHref(algorithmSlug: string, lessonSlug?: string): string {
  const lessonKey = lessonSlug === "math-amplitudes" ? "phase-interference" : algorithmSlug;
  if (Object.hasOwn(LESSON_CIRCUITS, lessonKey)) return `/workspace?mode=circuit&preset=lesson-${encodeURIComponent(lessonKey)}`;
  return `/workspace?mode=circuit&algorithm=${encodeURIComponent(algorithmSlug)}`;
}
