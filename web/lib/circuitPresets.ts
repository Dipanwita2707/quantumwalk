export type Gate = "h" | "x" | "y" | "z" | "s" | "t" | "rx" | "ry" | "rz" | "cx" | "cz" | "swap" | "measure";
export type Operation = { gate: Gate; target: number; control?: number; angle?: number };

export const CIRCUIT_PRESETS: Record<string, { qubits: number; operations: Operation[]; name: string }> = {
  superposition: { name: "Fair coin qubit", qubits: 1, operations: [{ gate: "h", target: 0 }] },
  bell: {
    name: "Shared pair",
    qubits: 2,
    operations: [{ gate: "h", target: 0 }, { gate: "cx", control: 0, target: 1 }],
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
