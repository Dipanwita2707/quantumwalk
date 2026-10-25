"use client";

import { useState } from "react";
import { api } from "@/lib/api";

type Operation = { gate: string; target: number; control?: number; angle?: number };

type Sim = {
  steps: { probabilities: { basis: string; probability: number }[] }[];
  engine?: string;
};

export function LabEnginePanel({
  qubits,
  operations,
  csrf,
  noiseOn,
  onNoiseChange,
  onCompare,
}: {
  qubits: number;
  operations: Operation[];
  csrf?: string;
  noiseOn: boolean;
  onNoiseChange: (value: boolean) => void;
  onCompare: (agree: boolean, caption: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [transpile, setTranspile] = useState<{ depth: number; size: number; basis_gates: string[] } | null>(null);

  async function compareCirq() {
    setBusy(true);
    try {
      const body = { qubits, operations, shots: 1024, engine: "qiskit" as const };
      const q = await api<Sim>("/api/simulate", { method: "POST", body: JSON.stringify(body) }, csrf);
      const c = await api<Sim>("/api/simulate", { method: "POST", body: JSON.stringify({ ...body, engine: "cirq" }) }, csrf);
      const pq = q.steps.at(-1)!.probabilities;
      const pc = c.steps.at(-1)!.probabilities;
      let maxDelta = 0;
      for (const item of pq) {
        const other = pc.find((p) => p.basis === item.basis)?.probability ?? 0;
        maxDelta = Math.max(maxDelta, Math.abs(item.probability - other));
      }
      const agree = maxDelta < 1e-5;
      onCompare(agree, agree ? "Both libraries calculated the same chances." : "Engines differ slightly — check your gate list.");
    } catch {
      onCompare(false, "Could not compare engines.");
    } finally {
      setBusy(false);
    }
  }

  async function loadTranspile() {
    setBusy(true);
    try {
      const data = await api<{ depth: number; size: number; basis_gates: string[] }>("/api/transpile-preview", {
        method: "POST",
        body: JSON.stringify({ qubits, operations, shots: 1 }),
      });
      setTranspile(data);
    } catch {
      setTranspile(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lab-engine-panel">
      <span className="panel-kicker">ADVANCED</span>
      <button type="button" disabled={busy} onClick={() => void compareCirq()}>
        {busy ? "Comparing…" : "Compare Qiskit & Cirq"}
      </button>
      <button type="button" disabled={busy} onClick={() => void loadTranspile()}>
        Transpile preview
      </button>
      <label className="lab-noise-toggle">
        <input type="checkbox" checked={noiseOn} onChange={(e) => onNoiseChange(e.target.checked)} />
        Pedagogical noise on next run
      </label>
      {transpile && (
        <p className="lab-transpile-readout" role="status">
          Depth {transpile.depth} · {transpile.size} ops · gates: {transpile.basis_gates.join(", ")}
        </p>
      )}
    </div>
  );
}
