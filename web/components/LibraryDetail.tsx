"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SiteHeader } from "./SiteHeader";
import { DiscoveryVisual, type DiscoveryScene } from "./DiscoveryVisual";
import { CircuitViewer, type Operation, type Gate } from "./CircuitViewer";

type Entry = {
  slug: string;
  title: string;
  level: string;
  summary: string;
  qubits: number;
  operations?: { gate: string; target: number; control?: number; angle?: number }[];
};

const guides: Record<string, { scene: DiscoveryScene; steps: string[] }> = {
  superposition: {
    scene: "superposition",
    steps: [
      "Start in |0⟩, where measuring 0 is deterministic (100% probability).",
      "Hadamard creates equal quantum amplitudes for |0⟩ and |1⟩ (50/50 split).",
      "Repeated measurements sample randomly from this distribution.",
    ],
  },
  "bell-pair": {
    scene: "bell",
    steps: [
      "Start with two qubits initialized to |00⟩ ground state.",
      "H on q0 creates a superposition of branches: (|00⟩ + |10⟩)/√2.",
      "CX flips q1 if q0 is |1⟩, producing the entangled Bell state (|00⟩ + |11⟩)/√2.",
    ],
  },
  "ghz-three": {
    scene: "mixed",
    steps: [
      "H puts q0 into an equal superposition.",
      "Two successive CX gates cascade entanglement across three qubits.",
      "The joint state becomes (|000⟩ + |111⟩)/√2 — maximally entangled across all 3 systems.",
    ],
  },
  "deutsch-jozsa-balanced": {
    scene: "kickback",
    steps: [
      "Prepare the auxiliary target qubit in the |−⟩ state using X followed by H.",
      "The CX oracle encodes f(x) via quantum phase kickback.",
      "The interference Hadamard turns relative phase into deterministic constructive readout.",
    ],
  },
  "grover-two": {
    scene: "grover",
    steps: [
      "Hadamard on both qubits prepares an equal superposition over all 4 basis states.",
      "The quantum oracle flips the phase of the marked target state |11⟩.",
      "The Grover diffuser inverts amplitudes about the mean, amplifying |11⟩ to 100%.",
    ],
  },
};

export function LibraryDetail({ kind, slug }: { kind: "algorithms" | "challenges"; slug: string }) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setEntry(null);
    setError("");

    async function load() {
      try {
        const item =
          kind === "algorithms"
            ? await api<Entry>(`/api/algorithms/${encodeURIComponent(slug)}`, { signal: controller.signal })
            : (await api<Entry[]>("/api/challenges", { signal: controller.signal })).find((i) => i.slug === slug);
        if (!item) throw new Error("Activity not found. Please select an available item from the library.");
        if (!controller.signal.aborted) setEntry(item);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load this activity.");
      }
    }

    void load();
    return () => controller.abort();
  }, [kind, slug, attempt]);

  const challenge = kind === "challenges";
  const guide = guides[slug];

  // Convert raw operations to typed Operation[]
  const initialOps: Operation[] = (entry?.operations || []).map((op) => ({
    gate: op.gate as Gate,
    target: op.target,
    control: op.control,
    angle: op.angle,
  }));

  return (
    <>
      <SiteHeader />
      <main className="content-shell activity-detail">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <Link href={`/${kind}`} className="card-action" style={{ margin: 0 }}>
            ← Back to {challenge ? "Challenges" : "Algorithm Library"}
          </Link>
          <span style={{ fontSize: "12px", color: "var(--muted)", fontFamily: "monospace" }}>
            MODULE: {slug.toUpperCase()}
          </span>
        </div>

        {error && (
          <div className="content-error" role="alert">
            {error} <button onClick={() => setAttempt((v) => v + 1)}>Retry</button>
          </div>
        )}

        {!entry && !error && <p role="status">Loading quantum activity…</p>}

        {entry && (
          <>
            <p className="eyebrow">
              {challenge ? "MISSION OBJECTIVE" : "INTERACTIVE ALGORITHM"} · {entry.level.toUpperCase()} ·{" "}
              {entry.qubits} {entry.qubits === 1 ? "QUBIT" : "QUBITS"}
            </p>
            <h1>{entry.title}</h1>
            <p className="content-intro">{entry.summary}</p>

            {/* EMBEDDED SELF-CONTAINED CIRCUIT VIEWER & SIMULATOR */}
            <section aria-label="Interactive Quantum Simulation">
              <CircuitViewer
                initialQubits={entry.qubits}
                initialOperations={challenge ? [] : initialOps}
                readonly={!challenge}
                editable={challenge}
                challengeSlug={challenge ? slug : undefined}
                title={challenge ? `Challenge Workbench: Synthesize ${entry.title}` : `Live Circuit: ${entry.title}`}
                subtitle={
                  challenge
                    ? "Add gates to construct the solution. Test probabilities in real-time, then submit to earn XP."
                    : "Step through the quantum gate execution to inspect state vector evolution and Bloch vectors."
                }
                fullLabHref={`/workspace?${challenge ? "challenge" : "algorithm"}=${encodeURIComponent(slug)}`}
              />
            </section>

            {/* THEORY & BREAKDOWN SECTION */}
            <div className="activity-grid" style={{ marginTop: "32px" }}>
              <section className="content-card">
                <span className="panel-kicker">{challenge ? "THE BRIEF & CONSTRAINTS" : "ALGORITHM PRINCIPLES"}</span>
                <h2>{challenge ? "Construct & Verify Target State" : "Step-by-step Transformation"}</h2>
                {challenge ? (
                  <>
                    <p>
                      Start with {entry.qubits} qubit{entry.qubits === 1 ? "" : "s"} in the ground state |0⟩.
                      Assemble unitary gates above to arrive at the specified state vector.
                    </p>
                    <ol>
                      <li>Choose gates from the builder tray above and append them to target qubits.</li>
                      <li>Observe live state vector probabilities and Bloch sphere rotations as you build.</li>
                      <li>
                        Click <strong>Verify Circuit & Submit Challenge</strong> directly above.
                      </li>
                    </ol>
                    <p className="content-intro">
                      Tiers: <strong>Bronze</strong> — correct probabilities · <strong>Silver</strong> — fewer gates · <strong>Gold</strong> — reference gate count.
                    </p>
                    <details style={{ marginTop: "16px", cursor: "pointer" }}>
                      <summary style={{ color: "var(--cyan)", fontWeight: 600 }}>Need a conceptual hint?</summary>
                      <p style={{ marginTop: "8px" }}>
                        {entry.qubits === 1
                          ? "Apply a Hadamard (H) gate to split a certain outcome into equal superposition."
                          : "Create equal superposition on the control qubit (H on q0), then entangle the target qubit using a CNOT (CX)."}
                      </p>
                    </details>
                  </>
                ) : (
                  <>
                    <ol>
                      {guide?.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                    <h3>Sequence Structure</h3>
                    <ol>
                      {entry.operations?.map((op, idx) => (
                        <li key={idx}>
                          <strong>{op.gate.toUpperCase()}</strong> ·{" "}
                          {op.control !== undefined ? `q${op.control} → ` : ""}
                          q{op.target}
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </section>

              <aside className="content-card">
                {guide ? (
                  <DiscoveryVisual scene={guide.scene} />
                ) : (
                  <>
                    <span className="panel-kicker">QUANTUM LAB VERIFICATION</span>
                    <h2>Check Prediction vs Result</h2>
                    <p>
                      In quantum algorithms, relative phase differences drive constructive and destructive interference.
                    </p>
                    <p>
                      Use the step playback controls on the simulator above to see how each gate alters probability amplitudes.
                    </p>
                    <Link className="card-action" href="/coach">
                      Ask AI Coach for Explanation →
                    </Link>
                  </>
                )}
              </aside>
            </div>
          </>
        )}
      </main>
    </>
  );
}
