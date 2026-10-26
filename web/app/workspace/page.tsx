"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import { api, useSession } from "@/lib/api";
import { QuantumSphere } from "@/components/QuantumSphere";
import { EntanglementLab } from "@/components/EntanglementLab";
import { QuantumMissions } from "@/components/QuantumMissions";
import { QuantumToolbox } from "@/components/QuantumToolbox";
import { QuantumEquationWhiteboard } from "@/components/QuantumEquationWhiteboard";
import { LabGlossaryDrawer } from "@/components/LabGlossaryDrawer";
import { LabEnginePanel, type EngineCompareResult } from "@/components/LabEnginePanel";
import { demoPresetFromParam, demoSimulateCircuit, type DemoPreset } from "@/lib/demoSimulate";
import { CIRCUIT_PRESETS } from "@/lib/circuitPresets";
import { stepButtonLabel, stepNarrator } from "@/lib/stepNarrator";
import "./lab.css";

type Gate = "h" | "x" | "y" | "z" | "s" | "t" | "rx" | "ry" | "rz" | "cx" | "cz" | "swap" | "measure";
type Operation = { gate: Gate; target: number; control?: number; angle?: number };
type CircuitState = { operations: Operation[]; qubits: number };
type Amplitude = { basis: string; real: number; imag: number };
type Probability = { basis: string; probability: number };
type Bloch = { qubit: number; x: number; y: number; z: number; purity: number };
type Snapshot = { index: number; amplitudes: Amplitude[]; probabilities: Probability[]; bloch: Bloch[] };
type Simulation = {
  qubits: number;
  shots: number;
  steps: Snapshot[];
  counts: Record<string, number> | null;
  noisy_counts?: Record<string, number> | null;
  basis_order: string;
  mode: string;
  engine?: string;
};
type CircuitResource = { id: string; name: string; qubits: number; operations: Operation[] };
type AlgorithmResource = { title: string; qubits: number; operations: Operation[] };
type ChallengeResource = { slug: string; title: string; summary: string; qubits: number };

type GateCategory = "all" | "superposition" | "pauli" | "rotations" | "entangle" | "readout";

const gateOptions: Gate[] = ["h", "x", "y", "z", "s", "t", "rx", "ry", "rz", "cx", "cz", "swap", "measure"];
const twoQubit = new Set<Gate>(["cx", "cz", "swap"]);
const rotations = new Set<Gate>(["rx", "ry", "rz"]);
const gateNames: Record<Gate, string> = {
  h: "Hadamard",
  x: "Pauli X (NOT)",
  y: "Pauli Y",
  z: "Pauli Z",
  s: "Phase S (π/2)",
  t: "Phase T (π/4)",
  rx: "Rotation Rx(θ)",
  ry: "Rotation Ry(θ)",
  rz: "Rotation Rz(θ)",
  cx: "Controlled-NOT (CX)",
  cz: "Controlled-Z (CZ)",
  swap: "SWAP Gate",
  measure: "Measurement Z",
};

const gateCategoryMap: Record<Gate, GateCategory> = {
  h: "superposition",
  x: "pauli",
  y: "pauli",
  z: "pauli",
  s: "pauli",
  t: "pauli",
  rx: "rotations",
  ry: "rotations",
  rz: "rotations",
  cx: "entangle",
  cz: "entangle",
  swap: "entangle",
  measure: "readout",
};

const gateHints: Record<Gate, string> = {
  h: "Creates a balanced superposition: |0⟩ → (|0⟩+|1⟩)/√2. The cornerstone of quantum parallelism.",
  x: "Pauli-X bit-flip: swaps amplitudes of |0⟩ and |1⟩ (quantum NOT operator).",
  y: "Pauli-Y: flips basis state and injects an imaginary phase factor (±i).",
  z: "Pauli-Z phase-flip: maps |1⟩ → -|1⟩, leaves |0⟩ invariant.",
  s: "Phase gate S: injects a +π/2 (90°) phase turn to |1⟩ (S² = Z).",
  t: "Phase gate T: injects a +π/4 (45°) phase turn to |1⟩ (T² = S).",
  rx: "Parametric rotation around the Bloch sphere X-axis by angle θ.",
  ry: "Parametric rotation around the Bloch sphere Y-axis by angle θ.",
  rz: "Parametric rotation around the Bloch sphere Z-axis by angle θ.",
  cx: "Entangling CNOT: flips target qubit if and only if control qubit is |1⟩.",
  cz: "Controlled-Z: injects a -1 phase factor if both control and target are in |1⟩.",
  swap: "SWAP operator: exchanges the quantum states of two selected qubits.",
  measure: "Computational Z-basis projection: collapses the quantum state into a classical bit.",
};

const bell: Operation[] = [
  { gate: "h", target: 0 },
  { gate: "cx", control: 0, target: 1 },
  { gate: "measure", target: 0 },
  { gate: "measure", target: 1 },
];

const ghz: Operation[] = [
  { gate: "h", target: 0 },
  { gate: "cx", control: 0, target: 1 },
  { gate: "cx", control: 1, target: 2 },
  { gate: "measure", target: 0 },
  { gate: "measure", target: 1 },
  { gate: "measure", target: 2 },
];

const superposition: Operation[] = [{ gate: "h", target: 0 }];

function complexLabel(item: Amplitude) {
  const r = Math.abs(item.real) < 0.0001 ? 0 : item.real;
  const i = Math.abs(item.imag) < 0.0001 ? 0 : item.imag;
  if (!i) return r.toFixed(3);
  return `${r.toFixed(3)} ${i < 0 ? "−" : "+"} ${Math.abs(i).toFixed(3)}i`;
}

export default function Home() {
  const { profile, loading: accountLoading, refresh: refreshSession } = useSession();

  useEffect(() => {
    const syncSession = () => {
      if (profile?.authenticated) void refreshSession();
    };
    window.addEventListener("focus", syncSession);
    document.addEventListener("visibilitychange", syncSession);
    return () => {
      window.removeEventListener("focus", syncSession);
      document.removeEventListener("visibilitychange", syncSession);
    };
  }, [profile?.authenticated, refreshSession]);
  const [qubits, setQubits] = useState(1);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [past, setPast] = useState<CircuitState[]>([]);
  const [future, setFuture] = useState<CircuitState[]>([]);
  const [gate, setGate] = useState<Gate>("h");
  const [control, setControl] = useState(0);
  const [angleText, setAngleText] = useState((Math.PI / 2).toFixed(4));
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ revision: number; operations: Operation[]; data: Simulation } | null>(null);
  const [step, setStep] = useState(0);
  const [selectedQubit, setSelectedQubit] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("My quantum circuit");
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState("");
  const [challenge, setChallenge] = useState<{ slug: string; title: string; summary: string } | null>(null);
  const [challengeNotice, setChallengeNotice] = useState("");
  const [question, setQuestion] = useState("");
  const [coachAnswer, setCoachAnswer] = useState("");
  const [coachBusy, setCoachBusy] = useState(false);
  const [allowExternalAI, setAllowExternalAI] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<GateCategory>("all");
  const [labMode, setLabMode] = useState<"circuit" | "whiteboard">("circuit");
  const [workflowView, setWorkflowView] = useState<"build" | "simulate" | "analyze">("build");
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [engineCompare, setEngineCompare] = useState<EngineCompareResult | null>(null);
  const [noiseOn, setNoiseOn] = useState(false);
  const [runEngine, setRunEngine] = useState<"qiskit" | "cirq">("qiskit");
  const [demoPresetKey, setDemoPresetKey] = useState<DemoPreset | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hydratedOwnerRef = useRef<string | null>(null);

  const current = result?.data.steps[Math.min(step, result.data.steps.length - 1)];
  const stale = result !== null && result.revision !== revision;
  const vector = current?.bloch[selectedQubit];

  // Auto-play step evolution
  useEffect(() => {
    if (!isPlaying || !result || result.data.steps.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setStep((prev) => (prev < result.data.steps.length - 1 ? prev + 1 : 0));
    }, 1400);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, result]);

  const isHydratedRef = useRef(false);

  function switchMode(nextMode: "circuit" | "whiteboard") {
    setLabMode(nextMode);
    try {
      localStorage.setItem("qw_lab_mode", nextMode);
      const url = new URL(window.location.href);
      url.searchParams.set("mode", nextMode);
      window.history.replaceState({}, "", url.toString());
      window.dispatchEvent(new Event("popstate"));
    } catch {}
  }

  // Persistent circuit draft and simulation auto-save
  useEffect(() => {
    if (!isHydratedRef.current || !profile?.authenticated || hydratedOwnerRef.current !== profile.id || typeof window === "undefined") return;
    try {
      localStorage.setItem(
        `qw_circuit_draft_${profile.id}`,
        JSON.stringify({
          qubits,
          operations,
          name,
          loadedId,
          result,
          step,
          revision,
        })
      );
    } catch {}
  }, [qubits, operations, name, loadedId, result, step, revision, profile]);

  useEffect(() => {
    function onPopState() {
      const mode = new URLSearchParams(window.location.search).get("mode");
      if (mode === "whiteboard") {
        setLabMode("whiteboard");
      } else if (mode === "circuit") {
        setLabMode("circuit");
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (accountLoading) return;
    const ownerKey = profile?.authenticated ? profile.id : "guest";
    if (hydratedOwnerRef.current === ownerKey) return;
    hydratedOwnerRef.current = ownerKey;
    isHydratedRef.current = false;
    setQubits(1);
    setOperations([]);
    setResult(null);
    setName("My quantum circuit");
    setLoadedId(null);
    const params = new URLSearchParams(window.location.search);
    const algorithm = params.get("algorithm");
    const slug = params.get("challenge");
    const preset = params.get("preset");
    const mode = params.get("mode");
    const savedMode = typeof window !== "undefined" ? localStorage.getItem("qw_lab_mode") : null;

    if (mode === "whiteboard") {
      setLabMode("whiteboard");
    } else if (mode === "circuit") {
      setLabMode("circuit");
    } else if (savedMode === "whiteboard" || savedMode === "circuit") {
      setLabMode(savedMode);
    }

    if (preset && CIRCUIT_PRESETS[preset]) {
      const item = CIRCUIT_PRESETS[preset];
      applyCircuit(item.operations, item.qubits);
      setDemoPresetKey(demoPresetFromParam(preset));
      setResult(null);
      setName(item.name);
      setLoadedId(null);
      isHydratedRef.current = true;
    } else if (algorithm) {
      void api<AlgorithmResource>(`/api/algorithms/${encodeURIComponent(algorithm)}`)
        .then((item) => {
          changeCircuit(item.operations, item.qubits);
          setResult(null);
          setName(item.title);
          setLoadedId(null);
          isHydratedRef.current = true;
        })
        .catch((cause) => {
          setError(cause instanceof Error ? cause.message : "Could not load algorithm.");
          isHydratedRef.current = true;
        });
    } else if (slug) {
      void api<ChallengeResource[]>("/api/challenges")
        .then((items) => {
          const item = items.find((entry) => entry.slug === slug);
          if (!item) throw new Error("Challenge not found.");
          setChallenge({ slug, title: item.title, summary: item.summary });
          changeCircuit([], item.qubits);
          setResult(null);
          setLoadedId(null);
          isHydratedRef.current = true;
        })
        .catch((cause) => {
          setError(cause instanceof Error ? cause.message : "Could not load challenge.");
          isHydratedRef.current = true;
        });
    } else if (!params.get("circuit") && profile?.authenticated) {
      // Rehydrate persisted draft and simulation cache
      try {
        const saved = localStorage.getItem(`qw_circuit_draft_${profile.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.qubits === "number" && Array.isArray(parsed.operations)) {
            setQubits(parsed.qubits);
            setOperations(parsed.operations);
            if (parsed.name) setName(parsed.name);
            if (parsed.loadedId) setLoadedId(parsed.loadedId);
            if (parsed.result) {
              setResult(parsed.result);
              if (typeof parsed.step === "number") setStep(parsed.step);
              if (typeof parsed.revision === "number") setRevision(parsed.revision);
            }
          }
        }
      } catch {}
      isHydratedRef.current = true;
    } else {
      isHydratedRef.current = true;
    }
  }, [accountLoading, profile?.authenticated]);

  useEffect(() => {
    const circuitId = new URLSearchParams(window.location.search).get("circuit");
    if (!circuitId || accountLoading) return;
    if (!profile?.authenticated) {
      setError("Sign in to load your saved circuit.");
      return;
    }
    void api<CircuitResource>(`/api/circuits/${encodeURIComponent(circuitId)}`)
      .then((item) => {
        changeCircuit(item.operations, item.qubits);
        setResult(null);
        setName(item.name);
        setLoadedId(item.id);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load saved circuit."));
  }, [accountLoading, profile?.authenticated]);

  function applyCircuit(next: Operation[], count: number) {
    setOperations(next);
    setQubits(count);
    setRevision((value) => value + 1);
    setStep(0);
    setIsPlaying(false);
    setError("");
    setSaveNotice("");
    setChallengeNotice("");
    setSelectedQubit((value) => Math.min(value, count - 1));
    setControl((value) => Math.min(value, count - 1));
  }

  function changeCircuit(next: Operation[], count = qubits) {
    setDemoPresetKey(null);
    setPast((items) => [...items.slice(-49), { operations, qubits }]);
    setFuture([]);
    applyCircuit(next, count);
  }

  function undo() {
    if (!past.length) return;
    const previous = past[past.length - 1];
    setPast(past.slice(0, -1));
    setFuture((items) => [...items, { operations, qubits }]);
    applyCircuit(previous.operations, previous.qubits);
  }

  function redo() {
    if (!future.length) return;
    const next = future[future.length - 1];
    setFuture(future.slice(0, -1));
    setPast((items) => [...items, { operations, qubits }]);
    applyCircuit(next.operations, next.qubits);
  }

  function moveOperation(index: number, direction: -1 | 1) {
    const adjacent = index + direction;
    if (adjacent < 0 || adjacent >= operations.length) return;
    if ((operations[index].gate === "measure") !== (operations[adjacent].gate === "measure")) return;
    const next = [...operations];
    [next[index], next[adjacent]] = [next[adjacent], next[index]];
    changeCircuit(next);
  }

  function removeOperation(index: number) {
    changeCircuit(operations.filter((_, current) => current !== index));
  }

  function removeQubit() {
    if (qubits <= 1) return;
    if (operations.some((operation) => operation.target === qubits - 1 || operation.control === qubits - 1)) {
      setError(`Remove gates on q${qubits - 1} before removing that qubit.`);
      return;
    }
    changeCircuit(operations, qubits - 1);
  }

  function addGate(target: number) {
    if (operations.length >= 64) {
      setError("This system supports up to 64 operations.");
      return;
    }
    if (operations.some((item) => item.gate === "measure") && gate !== "measure") {
      setError("Add gates before measurement. Remove measurement to keep editing.");
      return;
    }
    if (gate === "measure" && operations.some((item) => item.gate === "measure" && item.target === target)) {
      setError(`Qubit ${target} is already measured.`);
      return;
    }
    if (twoQubit.has(gate) && target === control) {
      setError("Choose a different second qubit.");
      return;
    }
    const angle = Number(angleText);
    if (rotations.has(gate) && (!angleText.trim() || !Number.isFinite(angle) || Math.abs(angle) > 2 * Math.PI)) {
      setError("Enter an angle between −2π and 2π radians.");
      return;
    }
    changeCircuit([...operations, { gate, target, ...(twoQubit.has(gate) ? { control } : {}), ...(rotations.has(gate) ? { angle } : {}) }]);
  }

  async function run() {
    if (busy) return;
    setBusy(true);
    setError("");
    setEngineCompare(null);
    const submittedRevision = revision;
    try {
      let data: Simulation;
      if (!profile?.authenticated) {
        data = (await demoSimulateCircuit({
          qubits,
          operations,
          engine: runEngine,
          shots: 1024,
          ...(noiseOn ? { noise_strength: 0.08 } : {}),
        })) as Simulation;
      } else if (!profile.csrf_token) {
        setError("Session incomplete — refresh the page or sign in again.");
        return;
      } else {
        data = await api<Simulation>(
          "/api/simulate",
          {
            method: "POST",
            body: JSON.stringify({
              qubits,
              operations,
              shots: 1024,
              engine: runEngine,
              ...(noiseOn ? { noise_strength: 0.08 } : {}),
            }),
          },
          profile.csrf_token
        );
      }
      setResult({ revision: submittedRevision, operations, data });
      setStep(data.steps.length - 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Simulation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!profile?.authenticated) return;
    setBusy(true);
    setError("");
    try {
      const path = loadedId ? `/api/circuits/${encodeURIComponent(loadedId)}` : "/api/circuits";
      const item = await api<CircuitResource>(
        path,
        { method: loadedId ? "PUT" : "POST", body: JSON.stringify({ name, qubits, operations }) },
        profile.csrf_token
      );
      setLoadedId(item.id);
      setSaveNotice("Circuit saved privately to your account.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save circuit.");
    } finally {
      setBusy(false);
    }
  }

  async function checkChallenge() {
    if (!challenge || accountLoading) return;
    setBusy(true);
    setError("");
    try {
      const outcome = await api<{ solved: boolean; saved: boolean; tier?: string; xp_awarded?: number }>(
        `/api/challenges/${challenge.slug}/submit`,
        { method: "POST", body: JSON.stringify({ circuit: { qubits, operations } }) },
        profile?.authenticated ? profile.csrf_token : undefined
      );
      setChallengeNotice(
        outcome.solved
          ? `Mission complete${outcome.tier ? ` (${outcome.tier})` : ""}.${outcome.saved ? " Progress saved." : " Sign in to save progress."}`
          : "Not yet. Your top chances do not match this mission yet — adjust gates and run again."
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not check challenge.");
    } finally {
      setBusy(false);
    }
  }

  async function askCoach(event: React.FormEvent) {
    event.preventDefault();
    if (!question.trim() || coachBusy) return;
    setCoachBusy(true);
    setError("");
    try {
      const response = await api<{ answer: string; uses_external_ai: boolean }>(
        "/api/tutor/explain",
        {
          method: "POST",
          body: JSON.stringify({ question, circuit: { qubits, operations }, allow_external_ai: allowExternalAI }),
        },
        profile?.authenticated ? profile.csrf_token : undefined
      );
      setCoachAnswer(`${response.answer}\n\n${response.uses_external_ai ? "AI explanation · verify numbers in simulator." : "Local circuit explanation."}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The coach is unavailable.");
    } finally {
      setCoachBusy(false);
    }
  }

  async function exportCircuit(format: "qasm" | "qiskit" | "cirq") {
    setError("");
    try {
      const result = await api<{ code: string }>(`/api/export/${format}`, { method: "POST", body: JSON.stringify({ qubits, operations }) });
      const url = URL.createObjectURL(new Blob([result.code], { type: "text/plain" }));
      const link = document.createElement("a");
      link.href = url;
      link.download =
        format === "qasm" ? "quantumwalk-circuit.qasm" : format === "cirq" ? "quantumwalk-cirq.py" : "quantumwalk-circuit.py";
      link.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not export circuit.");
    }
  }

  const hilbertDim = 1 << qubits;
  const isEntangled = Boolean(vector && vector.purity < 0.985);
  const filteredGates = categoryFilter === "all" ? gateOptions : gateOptions.filter((g) => gateCategoryMap[g] === categoryFilter);
  const stepGate = step > 0 && result ? result.operations[step - 1]?.gate : null;
  const narrator = stepNarrator(step, stepGate ?? null);
  const shots = result?.data.shots || 1024;
  const dualHistogram =
    result?.data.mode === "pedagogical_noise" && result.data.counts && result.data.noisy_counts
      ? { ideal: result.data.counts, noisy: result.data.noisy_counts }
      : null;
  const displayCounts = dualHistogram ? null : result?.data.counts;
  const histogramLabels = dualHistogram
    ? [...new Set([...Object.keys(dualHistogram.ideal), ...Object.keys(dualHistogram.noisy)])].sort()
    : [];

  return (
    <div
      className={`app-shell lab-shell nextlevel-system ${labMode === "whiteboard" ? "whiteboard-mode" : ""} ${
        labMode === "circuit" ? `lab-workflow-view-${workflowView}` : ""
      }`}
    >
      <SiteHeader />

      <main id="top" className="workspace">
        {labMode === "circuit" && (
          <div className="lab-guest-banner-wrap">
            <GuestExperienceBanner context="lab" />
          </div>
        )}
        {/* Left Quantum Navigation & Gate Library */}
        <aside className="sidebar" aria-label="Gate library and quantum tools">
          <div className="lab-rail-heading">
            <div className="rail-brand-kicker">
              <span className="quantum-live-beacon" />
              <span>CIRCUIT LAB</span>
            </div>
            <small>Local statevector simulator</small>
          </div>

          <div className="side-caption">QUICK PRESETS</div>
          <div className="sidebar-presets-list">
            {labMode === "circuit" && <a className="side-preset-btn" href="#quantum-toolbox">◎ <span>Noise & concept toolbox ↘</span></a>}
            {labMode === "circuit" && <a className="side-preset-btn" href="#quantum-missions">✧ <span>Quantum missions ↘</span></a>}
            {labMode === "circuit" && <a className="side-preset-btn" href="#entanglement-lab">⊗ <span>Entanglement experiment ↘</span></a>}
            <button
              type="button"
              className="side-preset-btn"
              onClick={() => {
                changeCircuit(superposition, 1);
                setGate("h");
                setResult(null);
                setLoadedId(null);
                setChallenge(null);
                setName("Single Qubit Superposition");
              }}
            >
              ◈ <span>|+⟩ Superposition</span>
            </button>
            <button
              type="button"
              className="side-preset-btn"
              onClick={() => {
                changeCircuit(bell, 2);
                setGate("h");
                setResult(null);
                setLoadedId(null);
                setChallenge(null);
                setName("Bell Pair |Φ+⟩");
              }}
            >
              ◈ <span>|Φ+⟩ Bell State (2Q)</span>
            </button>
            <button
              type="button"
              className="side-preset-btn"
              onClick={() => {
                changeCircuit(ghz, 3);
                setGate("h");
                setResult(null);
                setLoadedId(null);
                setChallenge(null);
                setName("GHZ Entanglement");
              }}
            >
              ◈ <span>|GHZ⟩ Entanglement (3Q)</span>
            </button>
            <button
              type="button"
              className="side-preset-btn"
              onClick={() => {
                changeCircuit([{ gate: "x", target: 0 }, { gate: "measure", target: 0 }], 1);
                setResult(null);
                setLoadedId(null);
                setChallenge(null);
                setName("Pauli-X Inversion");
              }}
            >
              ◈ <span>|1⟩ Bit Flip</span>
            </button>
          </div>

          <div className="side-divider" />

          <div className="side-caption-row">
            <div className="side-caption">GATE LIBRARY</div>
            <span className="side-badge">{gateOptions.length}</span>
          </div>

          {/* Gate category filter tabs */}
          <div className="gate-category-tabs" role="tablist" aria-label="Gate categories">
            <button
              type="button"
              className={categoryFilter === "all" ? "active-tab" : ""}
              onClick={() => setCategoryFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={categoryFilter === "superposition" ? "active-tab" : ""}
              onClick={() => setCategoryFilter("superposition")}
              title="Superposition gates (H)"
            >
              Sup
            </button>
            <button
              type="button"
              className={categoryFilter === "pauli" ? "active-tab" : ""}
              onClick={() => setCategoryFilter("pauli")}
              title="Pauli & Phase gates"
            >
              Pauli
            </button>
            <button
              type="button"
              className={categoryFilter === "rotations" ? "active-tab" : ""}
              onClick={() => setCategoryFilter("rotations")}
              title="Parametric rotations"
            >
              Rot
            </button>
            <button
              type="button"
              className={categoryFilter === "entangle" ? "active-tab" : ""}
              onClick={() => setCategoryFilter("entangle")}
              title="Multi-qubit entanglement"
            >
              Ent
            </button>
          </div>

          <div className="gate-list" role="group" aria-label="Choose a gate">
            {filteredGates.map((item) => (
              <button
                key={item}
                type="button"
                title={gateNames[item]}
                aria-label={`Select ${gateNames[item]} gate`}
                className={`gate-choice gate-chip-${item} ${gate === item ? "chosen" : ""}`}
                aria-pressed={gate === item}
                onClick={() => {
                  setGate(item);
                  setError("");
                }}
              >
                <span className={`gate-symbol ${item}`}>{item === "measure" ? "M" : item.toUpperCase()}</span>
                <span>
                  <strong>{gateNames[item]}</strong>
                  <small>
                    {item === "h"
                      ? "Superposition"
                      : twoQubit.has(item)
                      ? "Entangler"
                      : item === "measure"
                      ? "Readout"
                      : rotations.has(item)
                      ? "Angle θ"
                      : "Single Qubit"}
                  </small>
                </span>
              </button>
            ))}
          </div>

          <p className="side-note">
            Select a gate chip, then click <strong>+ Wire q</strong> on any qubit register.
          </p>

          <div className="lab-private-note">
            <span aria-hidden="true">⚛</span>
            <strong>Hardware-grade privacy</strong>
            <p>Circuits are isolated and private to your secure session.</p>
            <Link href="/circuits">Open saved work ↗</Link>
          </div>

          <Link href="/dashboard" className="side-dash-return">
            ← Back to Home
          </Link>
        </aside>

        {/* Main Quantum Workbench */}
        <div className="main-column" id="lab">
          {/* Workspace Mode Switcher */}
          <div className="lab-mode-switcher-bar" role="group" aria-label="Lab view">
            <button
              type="button"
              aria-pressed={labMode === "circuit"}
              className={`lab-mode-tab ${labMode === "circuit" ? "active" : ""}`}
              onClick={() => switchMode("circuit")}
            >
              Circuit builder
            </button>
            <button
              type="button"
              aria-pressed={labMode === "whiteboard"}
              className={`lab-mode-tab ${labMode === "whiteboard" ? "active" : ""}`}
              onClick={() => switchMode("whiteboard")}
            >
              Whiteboard
            </button>
          </div>

          {labMode === "circuit" && (
            <div className="lab-workflow-tabs" role="tablist" aria-label="Lab workflow">
              {(
                [
                  { id: "build" as const, label: "Build" },
                  { id: "simulate" as const, label: "Simulate" },
                  { id: "analyze" as const, label: "Analyze" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={workflowView === tab.id}
                  className={`lab-workflow-tab ${workflowView === tab.id ? "active" : ""}`}
                  onClick={() => setWorkflowView(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {labMode === "circuit" && (
            <div className="lab-sticky-runbar" role="region" aria-label="Run simulation">
              <button
                type="button"
                className={`run-button ${busy ? "busy-glow" : ""}`}
                disabled={busy || accountLoading}
                onClick={run}
              >
                {busy ? "Running simulation…" : "Run simulation"}
              </button>
              <span className="lab-session-state">
                {busy ? "Running" : stale ? "Results out of date" : result ? "Latest result loaded" : "Ready"}
              </span>
              {!profile?.authenticated && (
                <span className="lab-guest-hint-inline" role="status">
                  Guest demo · ≤5 qubits
                </span>
              )}
            </div>
          )}

          {labMode === "whiteboard" ? (
            <div style={{ padding: "0 28px 40px" }}>
              <QuantumEquationWhiteboard />
            </div>
          ) : (
            <>
              <div className="lab-wf-build">
                <QuantumMissions />
              </div>
              {/* Top Quantum HUD Banner */}
              <section id="circuit" className="hero nextlevel-hero lab-wf-simulate" aria-labelledby="page-title">
            <div className="hero-quantum-content">
              <div className="eyebrow">
                <span className="lab-status-dot" />
                <span>VISUAL CIRCUIT LAB</span>
                <span className="quantum-dim-tag">dim(ℋ) = 2^{qubits} = {hilbertDim}</span>
              </div>
              <h1 id="page-title">
                Build a circuit. <span>See what changes.</span>
              </h1>
              <p>
                Add gates, run the simulator, and inspect each step through the Bloch sphere, state vector, and probabilities.
              </p>
            </div>

            <div className="lab-launch">
              <div className="quantum-hud-status">
                <span className="quantum-pulse-beacon" />
                <span className="lab-session-state">
                  {busy ? "Running simulation" : stale ? "Results out of date — run again" : result ? "Showing latest result" : "Ready to run"}
                </span>
              </div>
              <div className="launch-specs">
                <span>Exact Statevector</span>
                <span>·</span>
                <span>1,024 Shots</span>
              </div>
              <details className="lab-advanced-engine" open={workflowView === "simulate"}>
                <summary>Engine, noise & comparison</summary>
                <label className="lab-engine-select">
                  Engine{" "}
                  <select value={runEngine} onChange={(e) => setRunEngine(e.target.value as "qiskit" | "cirq")}>
                    <option value="qiskit">Qiskit</option>
                    <option value="cirq">Cirq</option>
                  </select>
                </label>
                <LabEnginePanel
                  qubits={qubits}
                  operations={operations}
                  csrf={profile?.authenticated ? profile.csrf_token : undefined}
                  noiseOn={noiseOn}
                  onNoiseChange={setNoiseOn}
                  onCompare={setEngineCompare}
                />
              </details>
              {error && (
                <p className="error lab-run-error" role="alert">
                  {error}{" "}
                  <button type="button" onClick={() => setError("")}>
                    Dismiss
                  </button>
                </p>
              )}
              {!profile?.authenticated && (
                <p className="lab-guest-hint lab-wf-simulate" role="status">
                  Demo simulator (≤5 qubits). Sign in to save, export, and sync progress.
                </p>
              )}
              {engineCompare && (
                <div className="engine-compare-block" role="status">
                  <p className="engine-agree-caption">{engineCompare.caption}</p>
                  <div className="engine-compare-grid" aria-label="Qiskit versus Cirq ideal probabilities">
                    <div>
                      <span className="panel-kicker">Qiskit</span>
                      {engineCompare.qiskit.map((row) => (
                        <div key={row.basis} className="engine-compare-row">
                          <span>|{row.basis}⟩</span>
                          <span>{(row.probability * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <span className="panel-kicker">Cirq</span>
                      {engineCompare.cirq.map((row) => (
                        <div key={row.basis} className="engine-compare-row">
                          <span>|{row.basis}⟩</span>
                          <span>{(row.probability * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="lab-build-intro lab-wf-build" aria-labelledby="lab-build-title">
            <h1 id="lab-build-title">Circuit lab</h1>
            <p>Add gates from the library, wire them on the canvas, then run simulation to inspect results.</p>
          </section>

          {/* Precision Telemetry Bar */}
          <div className="lab-telemetry quantum-hud-telemetry lab-wf-simulate" aria-label="Current quantum experiment telemetry">
            <div>
              <span>QUBITS</span>
              <strong>
                {String(qubits).padStart(2, "0")} <small>{qubits === 1 ? "qubit" : "qubits"}</small>
              </strong>
              <small className="hud-sub">Register q0..q{qubits - 1}</small>
            </div>
            <div>
              <span>STATE SPACE DIMENSION</span>
              <strong>
                2^{qubits} <small>= {hilbertDim} states</small>
              </strong>
              <small className="hud-sub">Hilbert space ℂ^{hilbertDim}</small>
            </div>
            <div>
              <span>GATES IN CIRCUIT</span>
              <strong>
                {String(operations.length).padStart(2, "0")} <small>gates</small>
              </strong>
              <small className="hud-sub">{twoQubit.has(gate) ? "Entangling gate ready" : "Single-qubit ready"}</small>
            </div>
            <div className="lab-telemetry-coherence">
              <span>SELECTED QUBIT</span>
              <strong className={isEntangled ? "entangled-accent" : "coherent-accent"}>
                {!vector ? "Run to inspect" : isEntangled ? "Mixed local state" : "Pure local state"}
              </strong>
              <small className="hud-sub">{vector ? `q${selectedQubit} purity: ${(vector.purity * 100).toFixed(1)}%` : "Initial ground state"}</small>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="quantum-presets-bar lab-wf-build" aria-label="Quantum algorithm quick presets">
            <span className="preset-label">PRESETS:</span>
            <button
              type="button"
              className="preset-pill"
              onClick={() => {
                changeCircuit(superposition, 1);
                setGate("h");
                setResult(null);
                setLoadedId(null);
                setChallenge(null);
                setName("Single Qubit Superposition");
              }}
            >
              |+⟩ Superposition
            </button>
            <button
              type="button"
              className="preset-pill"
              onClick={() => {
                changeCircuit(bell, 2);
                setGate("h");
                setResult(null);
                setLoadedId(null);
                setChallenge(null);
                setName("Bell Pair |Φ+⟩");
              }}
            >
              |Φ+⟩ Bell Pair
            </button>
            <button
              type="button"
              className="preset-pill"
              onClick={() => {
                changeCircuit(ghz, 3);
                setGate("h");
                setResult(null);
                setLoadedId(null);
                setChallenge(null);
                setName("GHZ 3-Qubit Entanglement");
              }}
            >
              |GHZ⟩ 3-Qubit State
            </button>
            <button
              type="button"
              className="preset-pill"
              onClick={() => {
                changeCircuit([{ gate: "x", target: 0 }, { gate: "measure", target: 0 }], 1);
                setResult(null);
                setLoadedId(null);
                setChallenge(null);
                setName("Bit Flip & Measure");
              }}
            >
              X Bit-Flip & Readout
            </button>
          </div>

          {/* Active challenge strip if loaded */}
          {challenge && (
            <section className="challenge-strip" aria-label="Active challenge">
              <div>
                <span className="panel-kicker">ACTIVE CHALLENGE</span>
                <strong>{challenge.title}</strong>
                <p>{challenge.summary}</p>
              </div>
              <button type="button" disabled={busy || accountLoading} onClick={() => void checkChallenge()}>
                Verify solution
              </button>
              {challengeNotice && <p role="status">{challengeNotice}</p>}
            </section>
          )}

          {stale && (
            <p className="stale-notice" role="status">
              Circuit modified. Run simulation to compute updated amplitudes and Bloch coordinates.
            </p>
          )}

          {/* Main 2-column Workbench (Circuit Grid + 3D Bloch Sphere) */}
          <div className="panel-grid">
            {/* Panel 01: Circuit Builder */}
            <section className="panel circuit-panel lab-wf-build" aria-labelledby="circuit-title">
              <div className="panel-head">
                <div>
                  <span className="panel-kicker">01 / BUILD</span>
                  <h2 id="circuit-title">Quantum circuit composer</h2>
                </div>
                <div className="composer-meta-tags">
                  <span className="meta">{qubits} {qubits === 1 ? "qubit" : "qubits"}</span>
                  <span className="meta">{operations.length} gates</span>
                </div>
              </div>

              {/* Selected Gate HUD Card */}
              <div className="lab-selected-gate">
                <span className={`lab-selected-symbol gate-symbol-${gate}`}>
                  {gate === "measure" ? "M" : gate.toUpperCase()}
                </span>
                <div className="selected-gate-info">
                  <div className="selected-gate-title">
                    <strong>{gateNames[gate]}</strong>
                    <span className="lab-gate-category">
                      {twoQubit.has(gate) ? "2-QUBIT ENTANGLER" : rotations.has(gate) ? "PARAMETRIC ROTATION" : "1-QUBIT CLIFFORD"}
                    </span>
                  </div>
                  <p>{gateHints[gate]}</p>
                </div>
              </div>

              {/* Mobile Gate Picker */}
              <div className="mobile-gates" role="group" aria-label="Choose a gate">
                {gateOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={gate === item}
                    className={gate === item ? "active-gate" : ""}
                    onClick={() => {
                      setGate(item);
                      setError("");
                    }}
                  >
                    {item.toUpperCase()}
                    <span className="sr-only"> {gateNames[item]}</span>
                  </button>
                ))}
              </div>

              {/* Two-Qubit Controls or Angle inputs */}
              <div className="gate-parameter-controls">
                {twoQubit.has(gate) && (
                  <label className="control-select">
                    <span>{gate === "swap" ? "Secondary target qubit" : "Control qubit (●)"}</span>
                    <select value={control} onChange={(event) => setControl(Number(event.target.value))}>
                      {Array.from({ length: qubits }, (_, q) => (
                        <option key={q} value={q}>
                          q{q} (|0⟩)
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {rotations.has(gate) && (
                  <label className="control-select">
                    <span>Rotation angle θ (radians)</span>
                    <div className="angle-input-wrap">
                      <input
                        type="number"
                        min={-2 * Math.PI}
                        max={2 * Math.PI}
                        step="0.1"
                        value={angleText}
                        onChange={(event) => setAngleText(event.target.value)}
                      />
                      <div className="angle-presets">
                        <button type="button" onClick={() => setAngleText((Math.PI / 4).toFixed(4))}>
                          π/4
                        </button>
                        <button type="button" onClick={() => setAngleText((Math.PI / 2).toFixed(4))}>
                          π/2
                        </button>
                        <button type="button" onClick={() => setAngleText(Math.PI.toFixed(4))}>
                          π
                        </button>
                      </div>
                    </div>
                  </label>
                )}
              </div>

              {/* The Superconducting Circuit Canvas */}
              <div className="circuit-scroll">
                <div className="circuit-grid">
                  <div className="lab-circuit-ruler" aria-hidden="true">
                    <span>REGISTER</span>
                    <div>
                      {Array.from({ length: Math.max(5, operations.length) }, (_, i) => (
                        <span key={i} className={step === i + 1 ? "ruler-active" : ""}>
                          T{String(i + 1).padStart(2, "0")}
                        </span>
                      ))}
                    </div>
                    <span>ACTIONS</span>
                  </div>

                  {Array.from({ length: qubits }, (_, q) => (
                    <div className="wire-row" key={q}>
                      <span className="wire-label">
                        <span className="wire-idx">q{q}</span>
                        <small className="wire-init">|0⟩</small>
                      </span>
                      <div className="wire">
                        <div className="operation-track">
                          {operations.map((item, i) => {
                            const isTarget = item.target === q;
                            const isControl = twoQubit.has(item.gate) && item.control === q;
                            const isStepActive = !stale && result && step === i + 1;
                            const hasEntangleLine =
                              twoQubit.has(item.gate) &&
                              item.control !== undefined &&
                              q >= Math.min(item.target, item.control) &&
                              q <= Math.max(item.target, item.control);

                            return (
                              <div
                                key={i}
                                className={`operation-slot ${isStepActive ? "slot-highlight" : ""}`}
                              >
                                {hasEntangleLine && (
                                  <div
                                    className={`entanglement-connector ${
                                      item.control !== undefined && item.control < item.target ? "connect-down" : "connect-up"
                                    }`}
                                  />
                                )}
                                <span
                                  className={`operation ${isStepActive ? "step-highlight" : ""} ${
                                    isTarget ? "on-wire" : isControl ? "control-dot" : "empty"
                                  } ${isTarget ? `gate-${item.gate}` : ""}`}
                                  title={
                                    isTarget
                                      ? `${gateNames[item.gate]} at step ${i + 1}${
                                          item.angle !== undefined ? ` (θ=${item.angle.toFixed(2)})` : ""
                                        }`
                                      : isControl
                                      ? `Control qubit for ${gateNames[item.gate]} at step ${i + 1}`
                                      : undefined
                                  }
                                >
                                  {isTarget ? (
                                    <>
                                      <span>{item.gate === "measure" ? "M" : item.gate.toUpperCase()}</span>
                                      {item.angle !== undefined && (
                                        <small className="gate-angle-sub">θ</small>
                                      )}
                                    </>
                                  ) : isControl ? (
                                    item.gate === "swap" ? "×" : "●"
                                  ) : (
                                    ""
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="add-wire"
                        onClick={() => addGate(q)}
                        aria-label={`Add ${gateNames[gate]} to qubit ${q}`}
                      >
                        + Wire q{q}
                      </button>
                    </div>
                  ))}
                </div>
                {operations.length === 0 && (
                  <p className="lab-canvas-hint">
                    Start with a Hadamard (H) gate. Select it, add it to <strong>q0</strong>, then choose <strong>Run simulation</strong> to see what changes.
                  </p>
                )}
              </div>

              {/* Circuit Controls Toolbar */}
              <div className="circuit-actions">
                <button type="button" className="subtle-button" onClick={undo} disabled={!past.length} title="Undo last gate change">
                  ↶ Undo
                </button>
                <button type="button" className="subtle-button" onClick={redo} disabled={!future.length} title="Redo gate change">
                  ↷ Redo
                </button>
                <button type="button" className="subtle-button" onClick={() => changeCircuit([], qubits)} disabled={!operations.length}>
                  Clear all
                </button>
                <button type="button" className="subtle-button" onClick={removeQubit} disabled={qubits <= 1}>
                  − Qubit
                </button>
                <button type="button" className="subtle-button" onClick={() => changeCircuit(operations, Math.min(5, qubits + 1))} disabled={qubits >= 5}>
                  + Qubit ({qubits}/5)
                </button>
                <button type="button" className="run-button circuit-run-btn" onClick={run} disabled={busy}>
                  {busy ? "Computing…" : "▶ Execute"}
                </button>
              </div>

              {/* Reorder / Details list */}
              {operations.length > 0 && (
                <details className="operation-details">
                  <summary>Inspect & reorder gates ({operations.length})</summary>
                  <ol className="operation-list">
                    {operations.map((operation, index) => (
                      <li key={index}>
                        <span>
                          <strong>T{String(index + 1).padStart(2, "0")}</strong> · {gateNames[operation.gate]} on q{operation.target}
                          {operation.control !== undefined ? ` [Ctrl: q${operation.control}]` : ""}
                          {operation.angle !== undefined ? ` · ${operation.angle.toFixed(2)} rad` : ""}
                        </span>
                        <button
                          type="button"
                          aria-label={`Move step ${index + 1} earlier`}
                          disabled={index === 0 || (operations[index - 1].gate === "measure") !== (operation.gate === "measure")}
                          onClick={() => moveOperation(index, -1)}
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          aria-label={`Move step ${index + 1} later`}
                          disabled={index === operations.length - 1 || (operations[index + 1].gate === "measure") !== (operation.gate === "measure")}
                          onClick={() => moveOperation(index, 1)}
                        >
                          →
                        </button>
                        <button type="button" aria-label={`Remove step ${index + 1}`} onClick={() => removeOperation(index)}>
                          ×
                        </button>
                      </li>
                    ))}
                  </ol>
                </details>
              )}

              {/* Save & Export */}
              <div className="save-row">
                <label>
                  <span>Circuit name</span>
                  <input value={name} maxLength={120} onChange={(event) => setName(event.target.value)} />
                </label>
                {profile?.authenticated ? (
                  <button type="button" disabled={busy || !name.trim()} onClick={() => void save()}>
                    {loadedId ? "Update saved" : "Save to cloud"}
                  </button>
                ) : (
                  <Link href="/login" className="save-signin-link">
                    Sign in to save
                  </Link>
                )}
                <div className="export-btn-group">
                  <button type="button" disabled={!profile?.authenticated} onClick={() => void exportCircuit("qasm")} title="Export standard OpenQASM 2.0 file">
                    OpenQASM
                  </button>
                  <button type="button" disabled={!profile?.authenticated} onClick={() => void exportCircuit("qiskit")} title="Export executable Qiskit Python script">
                    Qiskit
                  </button>
                  <button type="button" disabled={!profile?.authenticated} onClick={() => void exportCircuit("cirq")} title="Export Cirq Python script">
                    Cirq
                  </button>
                </div>
                <button type="button" className="glossary-open-btn" onClick={() => setGlossaryOpen(true)}>
                  Glossary
                </button>
              </div>

              {saveNotice && <p className="success-note" role="status">{saveNotice}</p>}
              {error && (
                <p className="error" role="alert">
                  {error} <button type="button" onClick={() => setError("")}>Dismiss</button>
                </p>
              )}
            </section>

            {/* Panel 02: 3D Bloch Sphere */}
            <section id="bloch" className="panel bloch-panel lab-wf-analyze" aria-labelledby="bloch-title">
              <div className="panel-head">
                <div>
                  <span className="panel-kicker">02 / VISUALIZE</span>
                  <h2 id="bloch-title">3D Bloch sphere</h2>
                </div>
                <label className="qubit-picker">
                  <span>Probing</span>
                  <select value={selectedQubit} onChange={(event) => setSelectedQubit(Number(event.target.value))}>
                    {Array.from({ length: qubits }, (_, q) => (
                      <option key={q} value={q}>
                        Qubit q{q}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="lab-sphere-caption">
                <span>{vector ? "STATEVECTOR EVOLUTION" : "GROUND STATE |0⟩"}</span>
                <span>DRAG OR ROTATE IN 3D</span>
              </div>

              <QuantumSphere
                vector={vector || { x: 0, y: 0, z: 1 }}
                label={
                  vector
                    ? `Bloch vector for qubit ${selectedQubit}: x ${vector.x.toFixed(2)}, y ${vector.y.toFixed(2)}, z ${vector.z.toFixed(2)}`
                    : "Initial Bloch sphere state"
                }
              />

              {/* Step Scrubber & Playback */}
              {result && (
                <div className="lab-preview-stepper" role="group" aria-label="Explore state evolution">
                  <button
                    type="button"
                    aria-label="View previous quantum state"
                    disabled={step === 0}
                    onClick={() => {
                      setIsPlaying(false);
                      setStep(step - 1);
                    }}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="stepper-play-btn"
                    onClick={() => setIsPlaying(!isPlaying)}
                    aria-label={isPlaying ? "Pause auto step evolution" : "Play auto step evolution"}
                  >
                    {isPlaying ? "⏸" : "▶"}
                  </button>
                  <div className="stepper-state-text">
                    <span>
                      {stale ? "OUTDATED RUN" : "STEP EVOLUTION"} · {step} / {result.data.steps.length - 1}
                    </span>
                    <strong>{step === 0 ? "Initial ground state |0⟩" : gateNames[result.operations[step - 1].gate]}</strong>
                  </div>
                  <button
                    type="button"
                    aria-label="View next quantum state"
                    disabled={step >= result.data.steps.length - 1}
                    onClick={() => {
                      setIsPlaying(false);
                      setStep(step + 1);
                    }}
                  >
                    →
                  </button>
                </div>
              )}

              {/* Exact Coordinate Readout */}
              <div className="bloch-readout">
                {vector ? (
                  <>
                    <span title="X expectation value ⟨σ_x⟩">
                      <small>X</small> {vector.x >= 0 ? "+" : ""}{vector.x.toFixed(3)}
                    </span>
                    <span title="Y expectation value ⟨σ_y⟩">
                      <small>Y</small> {vector.y >= 0 ? "+" : ""}{vector.y.toFixed(3)}
                    </span>
                    <span title="Z expectation value ⟨σ_z⟩">
                      <small>Z</small> {vector.z >= 0 ? "+" : ""}{vector.z.toFixed(3)}
                    </span>
                  </>
                ) : (
                  <span>Execute simulation to calculate expectation values.</span>
                )}
              </div>

              <div style={{ marginTop: "14px" }}>
                <Link
                  href="/studio"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    background: "linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(168, 85, 247, 0.2))",
                    border: "1px solid rgba(56, 189, 248, 0.4)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#ffffff",
                    textDecoration: "none",
                  }}
                >
                  ⚛ Open Equation Whiteboard Simulator ↗
                </Link>
              </div>

              {vector && vector.purity < 0.985 && (
                <div className="explain-note mixed-state-alert">
                  <span className="alert-icon">⚡</span>
                  <div>
                    <strong>Entangled Subsystem detected</strong>
                    <p>
                      Qubit q{selectedQubit} is entangled with another register. Its reduced density matrix describes a mixed state (purity {(vector.purity * 100).toFixed(1)}%).
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Panel 03: State Vector & Wavefunction */}
            <section id="probabilities" className="panel state-panel lab-wf-analyze" aria-labelledby="state-title">
              <div className="panel-head">
                <div>
                  <span className="panel-kicker">03 / WAVEFUNCTION</span>
                  <h2 id="state-title">State vector & complex amplitudes</h2>
                </div>
                <div className="state-panel-meta">
                  <span className="meta">2^{qubits} basis states</span>
                  <span className="meta">Exact Aer engine</span>
                </div>
              </div>

              {current ? (
                <>
                  <div className="state-vector-hud">
                    <p className="panel-description">
                      Wavefunction amplitudes at execution step {step}. Basis string |b⟩ format places q0 as the rightmost bit.
                    </p>
                    <div className="vector-hud-metrics">
                      <span>Total probability: <strong>100.0%</strong></span>
                      <span>·</span>
                      <span>State norm: <strong>⟨ψ|ψ⟩ = 1.000</strong></span>
                    </div>
                  </div>

                  <div className="state-rows nextlevel-state-rows">
                    {current.probabilities.map((item, i) => {
                      const amp = current.amplitudes[i];
                      const phaseRad = Math.atan2(amp.imag, amp.real);
                      const phaseDeg = Math.round(((phaseRad < 0 ? phaseRad + 2 * Math.PI : phaseRad) * 180) / Math.PI);
                      const magnitude = Math.sqrt(amp.real ** 2 + amp.imag ** 2);
                      const hue = Math.round(phaseDeg % 360);

                      return (
                        <div className="state-row quantum-state-card" key={`${step}-${item.basis}`}>
                          <div className="ket-header">
                            <span className="ket">|{item.basis}⟩</span>
                            <span
                              className="phase-pill"
                              style={{ borderColor: `hsl(${hue}, 80%, 55%)`, color: `hsl(${hue}, 90%, 75%)` }}
                              title={`Phase angle φ = ${phaseDeg}°`}
                            >
                              <span className="phase-dot" style={{ backgroundColor: `hsl(${hue}, 90%, 65%)` }} />
                              φ = {phaseDeg}°
                            </span>
                          </div>
                          <div className="bar-track">
                            <div className="prob-bar-fill" style={{ width: `${item.probability * 100}%` }} />
                          </div>
                          <div className="state-metrics-row">
                            <span className="probability">{(item.probability * 100).toFixed(1)}%</span>
                            <span className="amplitude-complex" title="Cartesian complex amplitude (a + bi)">
                              {complexLabel(amp)}
                            </span>
                            <small className="amplitude-polar" title="Polar magnitude and phase angle">
                              {magnitude > 0.001 ? `${magnitude.toFixed(3)}∠${phaseDeg}°` : "0.000"}
                            </small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="lab-state-empty">
                  <span className="lab-empty-wave" aria-hidden="true">
                    Ψ
                  </span>
                  <div>
                    <strong>Quantum superposition ready.</strong>
                    <p>
                      Execute the experiment to inspect exact complex amplitudes, quantum interference phases, and measurement probabilities across all 2^{qubits} basis states.
                    </p>
                  </div>
                  <button type="button" className="text-button" disabled={busy || accountLoading} onClick={run}>
                    Compute wavefunction ↗
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* Lower Grid: Step execution, Measurement counts, and AI Coach */}
          <div className="lower-grid">
            {/* 04: Step-by-Step Execution Scrubber */}
            <section className="panel steps-panel lab-wf-simulate" aria-labelledby="steps-title">
              <div className="panel-head">
                <div>
                  <span className="panel-kicker">04 / CHRONOLOGY</span>
                  <h2 id="steps-title">Step-by-step state evolution</h2>
                </div>
                {result && (
                  <button
                    type="button"
                    className="auto-play-toggle"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? "⏸ Pause" : "▶ Play evolution"}
                  </button>
                )}
              </div>

              {result ? (
                <>
                  <div className="step-buttons" role="group" aria-label="Select circuit step">
                    {result.data.steps.map((snapshot) => (
                      <button
                        key={snapshot.index}
                        type="button"
                        className={step === snapshot.index ? "active-step" : ""}
                        aria-current={step === snapshot.index ? "step" : undefined}
                        onClick={() => {
                          setIsPlaying(false);
                          setStep(snapshot.index);
                        }}
                      >
                        {stepButtonLabel(snapshot.index, snapshot.index === 0 ? null : result.operations[snapshot.index - 1]?.gate ?? null)}
                      </button>
                    ))}
                  </div>
                  <div className="step-explanation-box">
                    <strong>{narrator.headline}</strong>
                    <p>{narrator.body}</p>
                    {stepGate && (
                      <details>
                        <summary>Technical detail</summary>
                        <p>{gateHints[stepGate]}</p>
                      </details>
                    )}
                  </div>
                  <div className="step-nav">
                    <button
                      type="button"
                      disabled={step === 0}
                      onClick={() => {
                        setIsPlaying(false);
                        setStep(step - 1);
                      }}
                    >
                      ← Previous step
                    </button>
                    <button
                      type="button"
                      disabled={step >= result.data.steps.length - 1}
                      onClick={() => {
                        setIsPlaying(false);
                        setStep(step + 1);
                      }}
                    >
                      Next step →
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  Execute a circuit to trace the time evolution of statevector amplitudes step by step.
                </div>
              )}
            </section>

            {/* 05: Measurement Counts (Shot sampling) */}
            <section id="counts" className="panel measurement-panel lab-wf-analyze" aria-labelledby="measurement-title">
              <div className="panel-head">
                <div>
                  <span className="panel-kicker">05 / READOUT</span>
                  <h2 id="measurement-title">Measurement sampling</h2>
                </div>
                <span className="meta">1,024 shots</span>
              </div>

              {result && dualHistogram ? (
                <>
                  <p className="panel-description">
                    Same circuit revision: ideal shot sampling (no noise model) beside a pedagogical depolarizing model — not live
                    hardware.
                  </p>
                  <div className="count-dual-grid" aria-label="Ideal versus pedagogical noise shot histograms">
                    <div className="count-dual-col">
                      <span className="panel-kicker">Ideal sampling</span>
                      <div className="count-list">
                        {histogramLabels.map((basis) => {
                          const count = dualHistogram.ideal[basis] ?? 0;
                          const pct = ((count / shots) * 100).toFixed(1);
                          return (
                            <div key={basis} className="count-row">
                              <span className="count-ket">|{basis}⟩</span>
                              <div className="bar-track bar-track-ideal">
                                <div style={{ width: `${(count / shots) * 100}%` }} />
                              </div>
                              <div className="count-stat">
                                <strong>{count}</strong>
                                <small>({pct}%)</small>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="count-dual-col">
                      <span className="panel-kicker">Pedagogical noise</span>
                      <div className="count-list">
                        {histogramLabels.map((basis) => {
                          const count = dualHistogram.noisy[basis] ?? 0;
                          const pct = ((count / shots) * 100).toFixed(1);
                          return (
                            <div key={basis} className="count-row">
                              <span className="count-ket">|{basis}⟩</span>
                              <div className="bar-track bar-track-noisy">
                                <div style={{ width: `${(count / shots) * 100}%` }} />
                              </div>
                              <div className="count-stat">
                                <strong>{count}</strong>
                                <small>({pct}%)</small>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              ) : result && displayCounts ? (
                <>
                  <p className="panel-description">
                    Empirical collapse statistics over 1,024 shots. Notice quantum shot noise compared to exact probabilities.
                  </p>
                  <div className="count-list">
                    {Object.entries(displayCounts).map(([basis, count]) => {
                      const pct = ((count / shots) * 100).toFixed(1);
                      return (
                        <div key={basis} className="count-row">
                          <span className="count-ket">|{basis}⟩</span>
                          <div className="bar-track">
                            <div style={{ width: `${(count / shots) * 100}%` }} />
                          </div>
                          <div className="count-stat">
                            <strong>{count}</strong>
                            <small>({pct}%)</small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  Add a <strong>Measure (M)</strong> gate to a wire and execute to sample collapse outcomes.
                </div>
              )}
            </section>

            {/* 06: Circuit AI Coach */}
            <section className="panel insight-panel lab-wf-analyze" id="coach" aria-labelledby="insight-title">
              <div className="panel-head">
                <div>
                  <span className="panel-kicker">06 / REASONING</span>
                  <h2 id="insight-title">Quantum circuit tutor</h2>
                </div>
                <div className="insight-icon">✦</div>
              </div>

              <p className="coach-intro-text">
                {step > 0 && result?.operations[step - 1]
                  ? gateHints[result.operations[step - 1].gate]
                  : "Ask conceptual questions about phase interference, entanglement, or your circuit's unitary matrix."}
              </p>

              <form className="coach-form" onSubmit={(event) => void askCoach(event)}>
                <label htmlFor="coach-question" className="sr-only">
                  Your question
                </label>
                <input
                  id="coach-question"
                  value={question}
                  maxLength={500}
                  placeholder="e.g. Why did the phase shift create destructive interference?"
                  onChange={(event) => setQuestion(event.target.value)}
                />
                <label className="ai-consent">
                  <input
                    type="checkbox"
                    checked={allowExternalAI}
                    onChange={(event) => setAllowExternalAI(event.target.checked)}
                  />
                  <span>Opt-in AI reasoning (send circuit structure to provider)</span>
                </label>
                <button type="submit" disabled={coachBusy || !question.trim()}>
                  {coachBusy ? "Analyzing state…" : "Ask coach ↗"}
                </button>
              </form>

              {coachAnswer && (
                <div className="coach-answer" role="status">
                  {coachAnswer}
                </div>
              )}
            </section>
          </div>
            </>
          )}

          {labMode === "circuit" && (
            <div className="lab-wf-analyze">
              <QuantumToolbox />
              <EntanglementLab />
            </div>
          )}
          <footer className="nextlevel-footer">
            <div className="footer-left">
              <span>◈ QuantumWalk Operating System</span>
              <span>·</span>
              <span>Aer AerSimulator Backend</span>
              <span>·</span>
              <span>Ideal statevector mode</span>
            </div>
            <div className="footer-links">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/algorithms">Algorithms</Link>
              <Link href="/learn">Lessons</Link>
            </div>
          </footer>
        </div>
      </main>
      <LabGlossaryDrawer open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
    </div>
  );
}
