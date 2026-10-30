import { TSP3_GROVER_OPERATIONS } from "./tspGroverPreset";
import { LESSON_CIRCUITS } from "./lessonPresets";

export type Gate = "h" | "x" | "y" | "z" | "s" | "t" | "rx" | "ry" | "rz" | "cx" | "cz" | "swap" | "measure";
export type Operation = { gate: Gate; target: number; control?: number; angle?: number };

export const CIRCUIT_PRESETS: Record<string, { qubits: number; operations: Operation[]; name: string }> = {
  ...Object.fromEntries(Object.entries(LESSON_CIRCUITS).map(([key, circuit]) => [`lesson-${key}`, { ...circuit, name: `Lesson: ${key.replace(/-/g, " ")}` }])),
  superposition: { name: "Fair coin qubit", qubits: 1, operations: [{ gate: "h", target: 0 }] },
  bell: {
    name: "Shared pair",
    qubits: 2,
    operations: [{ gate: "h", target: 0 }, { gate: "cx", control: 0, target: 1 }],
  },
  tsp3grover: {
    name: "TSP Grover (mark route 001)",
    qubits: 3,
    operations: [...TSP3_GROVER_OPERATIONS] as Operation[],
  },
  tsp3: {
    name: "Three-city route superposition",
    qubits: 3,
    operations: [
      { gate: "h", target: 0 },
      { gate: "h", target: 1 },
      { gate: "h", target: 2 },
      { gate: "measure", target: 0 },
      { gate: "measure", target: 1 },
      { gate: "measure", target: 2 },
    ],
  },
  grover2: {
    name: "Find |11⟩",
    qubits: 2,
    operations: [
      { gate: "h", target: 0 },
      { gate: "h", target: 1 },
      { gate: "z", target: 0 },
      { gate: "z", target: 1 },
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
