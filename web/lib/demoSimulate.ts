import { api } from "@/lib/api";

export type DemoPreset = "superposition" | "bell" | "grover2" | "tsp3" | "tsp3grover";

type DemoOperation = { gate: string; target: number; control?: number; angle?: number };

export async function demoSimulate(
  preset: DemoPreset,
  options?: { engine?: "qiskit" | "cirq"; noise_strength?: number }
) {
  return api<Record<string, unknown>>("/api/explorer/demo/simulate", {
    method: "POST",
    body: JSON.stringify({
      preset,
      engine: options?.engine ?? "qiskit",
      ...(options?.noise_strength != null ? { noise_strength: options.noise_strength } : {}),
    }),
  });
}

/** Guest lab: run the circuit on the canvas (≤5 qubits, ≤64 gates). */
export async function demoSimulateCircuit(options: {
  qubits: number;
  operations: DemoOperation[];
  engine?: "qiskit" | "cirq";
  noise_strength?: number;
  shots?: number;
}) {
  return api<Record<string, unknown>>("/api/explorer/demo/simulate", {
    method: "POST",
    body: JSON.stringify({
      qubits: options.qubits,
      operations: options.operations,
      shots: options.shots ?? 1024,
      engine: options.engine ?? "qiskit",
      ...(options.noise_strength != null ? { noise_strength: options.noise_strength } : {}),
    }),
  });
}

/** Map URL preset param to demo catalog id. */
export function demoPresetFromParam(preset: string | null): DemoPreset | null {
  const allowed: DemoPreset[] = ["superposition", "bell", "grover2", "tsp3", "tsp3grover"];
  return allowed.includes(preset as DemoPreset) ? (preset as DemoPreset) : null;
}
