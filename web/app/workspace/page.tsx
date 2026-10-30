"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { PageHeading } from "@/components/ui/QuantumUI";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import { api, useSession } from "@/lib/api";
import { QuantumSphere } from "@/components/QuantumSphere";
import { EngineProbabilityComparison, StateEvolutionGuide, StateVectorView } from "@/components/StateEvolution";
import { explainStateStep } from "@/lib/stateExplanation";
import { EntanglementLab } from "@/components/EntanglementLab";
import { QuantumMissions } from "@/components/QuantumMissions";
import { QuantumToolbox } from "@/components/QuantumToolbox";
import { QuantumEquationWhiteboard } from "@/components/QuantumEquationWhiteboard";
import { LabGlossaryDrawer } from "@/components/LabGlossaryDrawer";
import { LabEnginePanel, type EngineCompareResult } from "@/components/LabEnginePanel";
import { LabCircuitTutor } from "@/components/LabCircuitTutor";
import { demoPresetFromParam, demoSimulateCircuit, type DemoPreset } from "@/lib/demoSimulate";
import { CIRCUIT_PRESETS } from "@/lib/circuitPresets";
import { LAB_SECTION_ROUTES, normalizeLabHash } from "@/lib/labSections";
import { stepButtonLabel } from "@/lib/stepNarrator";
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



export default function Home() {
  return <Suspense fallback={<p role="status">Loading circuit workspace…</p>}><Workspace /></Suspense>;
}

function Workspace() {
  const searchParams = useSearchParams();
  const sourceKey = JSON.stringify(["preset", "algorithm", "challenge", "circuit", "blank"].map(key => searchParams.get(key)));
  const requestedMode = searchParams.get("mode");
  const hydratedSourceRef = useRef<string | null>(null);
  const { profile, loading: accountLoading, error: sessionError, refresh: refreshSession } = useSession();

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackDelay, setPlaybackDelay] = useState(1400);
  const [categoryFilter, setCategoryFilter] = useState<GateCategory>("all");
  const [labMode, setLabMode] = useState<"circuit" | "whiteboard">("circuit");
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [engineCompare, setEngineCompare] = useState<EngineCompareResult | null>(null);
  const [noiseOn, setNoiseOn] = useState(false);
  const [runEngine, setRunEngine] = useState<"qiskit" | "cirq">("qiskit");
  const [demoPresetKey, setDemoPresetKey] = useState<DemoPreset | null>(null);
  const hydratedOwnerRef = useRef<string | null>(null);

  const current = result?.data.steps[Math.min(step, result.data.steps.length - 1)];
  const stale = result !== null && result.revision !== revision;
  const vector = stale ? undefined : current?.bloch[selectedQubit];

  // Auto-play step evolution
  useEffect(() => {
    if (!isPlaying || !result) return;
    if (stale || busy || step >= result.data.steps.length - 1) { setIsPlaying(false); return; }
    const timer = setTimeout(() => setStep(step + 1), playbackDelay);
    return () => clearTimeout(timer);
  }, [isPlaying, result, step, stale, busy, playbackDelay]);

  const isHydratedRef = useRef(false);

  useEffect(() => {
    if (requestedMode === "circuit" || requestedMode === "whiteboard") setLabMode(requestedMode);
  }, [requestedMode]);

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
    if (typeof window === "undefined" || accountLoading) return;

    function applyLabSectionHash(rawHash: string) {
      const hash = normalizeLabHash(rawHash);
      if (!hash) return;
      const route = LAB_SECTION_ROUTES[hash];
      if (route) {
        setLabMode(route.mode);
        try {
          localStorage.setItem("qw_lab_mode", route.mode);
          const url = new URL(window.location.href);
          url.searchParams.set("mode", route.mode);
          url.hash = hash;
          window.history.replaceState({}, "", url.toString());
        } catch {}
      }
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const target = document.getElementById(hash);
          if (!target) return;
          let parent: HTMLElement | null = target;
          while (parent) {
            if (parent instanceof HTMLDetailsElement) parent.open = true;
            parent = parent.parentElement;
          }
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    }

    applyLabSectionHash(window.location.hash);
    const onHashChange = () => applyLabSectionHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [accountLoading]);

  useEffect(() => {
    if (accountLoading) return;
    const ownerKey = profile?.authenticated ? profile.id : "guest";
    if (hydratedOwnerRef.current === ownerKey && hydratedSourceRef.current === sourceKey) return;
    hydratedSourceRef.current = sourceKey;
    hydratedOwnerRef.current = ownerKey;
    isHydratedRef.current = false;
    setQubits(1);
    setOperations([]);
    setResult(null);
    setName("My quantum circuit");
    setLoadedId(null);
    setChallenge(null);
    setPast([]);
    setFuture([]);
    setDemoPresetKey(null);
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
          if (hydratedSourceRef.current !== sourceKey || hydratedOwnerRef.current !== ownerKey) return;
          changeCircuit(item.operations, item.qubits);
          setResult(null);
          setName(item.title);
          setLoadedId(null);
          isHydratedRef.current = true;
        })
        .catch((cause) => {
          if (hydratedSourceRef.current !== sourceKey || hydratedOwnerRef.current !== ownerKey) return;
          setError(cause instanceof Error ? cause.message : "Could not load algorithm.");
          isHydratedRef.current = true;
        });
    } else if (slug) {
      void api<ChallengeResource[]>("/api/challenges")
        .then((items) => {
          if (hydratedSourceRef.current !== sourceKey || hydratedOwnerRef.current !== ownerKey) return;
          const item = items.find((entry) => entry.slug === slug);
          if (!item) throw new Error("Challenge not found.");
          setChallenge({ slug, title: item.title, summary: item.summary });
          changeCircuit([], item.qubits);
          setResult(null);
          setLoadedId(null);
          isHydratedRef.current = true;
        })
        .catch((cause) => {
          if (hydratedSourceRef.current !== sourceKey || hydratedOwnerRef.current !== ownerKey) return;
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
    } else if (params.get("blank") === "1") {
      isHydratedRef.current = true;
    } else if (mode === "circuit" || mode === null) {
      applyCircuit(superposition, 1);
      setGate("h");
      setName("Single Qubit Superposition");
      isHydratedRef.current = true;
    } else {
      isHydratedRef.current = true;
    }
  }, [accountLoading, profile?.authenticated, profile?.authenticated ? profile.id : null, sourceKey]);

  useEffect(() => {
    const circuitId = new URLSearchParams(window.location.search).get("circuit");
    if (!circuitId || accountLoading) return;
    if (!profile?.authenticated) {
      setError("Sign in to load your saved circuit.");
      return;
    }
    let active = true;
    void api<CircuitResource>(`/api/circuits/${encodeURIComponent(circuitId)}`)
      .then((item) => {
        if (!active) return;
        changeCircuit(item.operations, item.qubits);
        setResult(null);
        setName(item.name);
        setLoadedId(item.id);
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load saved circuit."); });
    return () => { active = false; };
  }, [accountLoading, profile?.authenticated, sourceKey]);

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

  function focusSimulationResults() {
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 1100px)").matches) return;
    requestAnimationFrame(() => {
      document.getElementById("bloch")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    });
  }

  async function run() {
    if (busy || accountLoading) return;
    setBusy(true);
    setError("");
    setEngineCompare(null);
    setIsPlaying(false);
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
      setStep(0);
      setIsPlaying(data.steps.length > 1);
      focusSimulationResults();
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

  const filteredGates = categoryFilter === "all" ? gateOptions : gateOptions.filter((g) => gateCategoryMap[g] === categoryFilter);
  const stepGate = step > 0 && result ? result.operations[step - 1]?.gate : null;
  const narrator = result ? explainStateStep(step, result.operations, result.data.steps) : null;
  const shots = result?.data.shots || 1024;
  const dualHistogram =
    result?.data.mode === "pedagogical_noise" && result.data.counts && result.data.noisy_counts
      ? { ideal: result.data.counts, noisy: result.data.noisy_counts }
      : null;
  const displayCounts = dualHistogram ? null : result?.data.counts;
  const histogramLabels = dualHistogram
    ? [...new Set([...Object.keys(dualHistogram.ideal), ...Object.keys(dualHistogram.noisy)])].sort()
    : [];

  const latestProbs = useMemo(() => {
    if (!result || stale) return null;
    const probs = current?.probabilities ?? [];
    return [...probs].sort((a, b) => b.probability - a.probability).filter((p) => p.probability > 0.0001).slice(0, 4);
  }, [result, current, stale]);

  return (
    <div
      className={`app-shell lab-shell nextlevel-system ${labMode === "whiteboard" ? "whiteboard-mode" : ""}`}
    >
      <SiteHeader />

      <main id="top" className="workspace">
        {labMode === "circuit" && (
          <div className="lab-guest-banner-wrap">
            <GuestExperienceBanner context="lab" />
            {sessionError && (
              <p className="error lab-run-error" role="alert">
                {sessionError} You can still try the guest simulator while sign-in is unavailable.
              </p>
            )}
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

          {/* Gate category filters */}
          <div className="gate-category-tabs" role="group" aria-label="Gate categories">
            <button
              type="button"
              className={categoryFilter === "all" ? "active-tab" : ""}
              aria-pressed={categoryFilter === "all"}
              onClick={() => setCategoryFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={categoryFilter === "superposition" ? "active-tab" : ""}
              aria-pressed={categoryFilter === "superposition"}
              onClick={() => setCategoryFilter("superposition")}
              title="Superposition gates (H)"
            >
              Sup
            </button>
            <button
              type="button"
              className={categoryFilter === "pauli" ? "active-tab" : ""}
              aria-pressed={categoryFilter === "pauli"}
              onClick={() => setCategoryFilter("pauli")}
              title="Pauli & Phase gates"
            >
              Pauli
            </button>
            <button
              type="button"
              className={categoryFilter === "rotations" ? "active-tab" : ""}
              aria-pressed={categoryFilter === "rotations"}
              onClick={() => setCategoryFilter("rotations")}
              title="Parametric rotations"
            >
              Rot
            </button>
            <button
              type="button"
              className={categoryFilter === "entangle" ? "active-tab" : ""}
              aria-pressed={categoryFilter === "entangle"}
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
            <strong>{profile?.authenticated ? "Private saved circuits" : "Guest lab"}</strong>
            <p>{profile?.authenticated ? "Saved circuits are private to your account." : "Guest simulations run on the QuantumWalk API. Sign in to save your circuits."}</p>
            <Link href={profile?.authenticated ? "/circuits" : "/login?return_to=%2Fworkspace%3Fmode%3Dcircuit"}>
              {profile?.authenticated ? "Open saved work ↗" : "Sign in to save ↗"}
            </Link>
          </div>

          <Link href="/dashboard" className="side-dash-return">
            ← Back to Home
          </Link>
        </aside>

        {/* Main Quantum Workbench */}
        <div className="main-column" id="lab">
          <PageHeading title="Build & run quantum circuits" description="Create circuits, follow each gate, and inspect the quantum state. Executions use a classical simulator." />
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

          {labMode === "whiteboard" ? (
            <div className="lab-whiteboard-stack">
              <div className="lab-whiteboard-mode-bar" role="region" aria-label="Whiteboard vs circuit builder">
                <div>
                  <strong>Whiteboard mode</strong>
                  <p>
                    Preset operators and missions live here. Gates, the circuit canvas, and Execute are in{" "}
                    <strong>Circuit builder</strong>.
                  </p>
                </div>
                <button type="button" className="lab-whiteboard-to-circuit" onClick={() => switchMode("circuit")}>
                  Open circuit builder →
                </button>
              </div>
              <QuantumEquationWhiteboard />
              <QuantumMissions />
            </div>
          ) : (
            <>
          <LabCircuitTutor qubits={qubits} operations={operations} snapshot={current} explanation={narrator}
            step={step} lastStep={result ? result.data.steps.length - 1 : 0} stale={stale}
            busy={busy || accountLoading} playing={isPlaying}
            onRun={() => void run()}
            onPlay={() => { if (!isPlaying && result && step >= result.data.steps.length - 1) setStep(0); setIsPlaying(!isPlaying); }}
            onNext={() => { setIsPlaying(false); if (result) setStep(Math.min(step + 1, result.data.steps.length - 1)); }} />
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
              Circuit modified. Execute again to refresh the sphere and probabilities.
            </p>
          )}

          {/* Main 2-column Workbench (Circuit Grid + 3D Bloch Sphere) */}
          <div className="panel-grid">
            {/* Panel 01: Circuit Builder */}
            <section id="circuit" className="panel circuit-panel" aria-labelledby="circuit-title">
              <div className="panel-head lab-canvas-status">
                <div>
                  <h2 id="circuit-title">{name}</h2>
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
              {result && !stale && <p className="lab-execution-progress" role="status">{step === 0 ? "Initial state — all qubits prepared in |0⟩" : step === result.data.steps.length - 1 ? "Final state" : `After gate ${step}: ${result.operations[step - 1]?.gate.toUpperCase()}`} · Step {step} of {result.data.steps.length - 1}{isPlaying ? " · Playing" : " · Paused"}</p>}
              <div className={`circuit-scroll${busy ? " lab-circuit-busy" : ""}`}>
                {busy && (
                  <div className="lab-circuit-busy-overlay" role="status" aria-label="Simulation in progress">
                    Computing amplitudes…
                  </div>
                )}
                <div className="circuit-grid" style={{ "--lab-gate-columns": Math.max(5, operations.length) } as CSSProperties}>
                  <div className="lab-circuit-ruler" aria-hidden="true">
                    <span>REGISTER</span>
                    <div>
                      {Array.from({ length: Math.max(5, operations.length) }, (_, i) => (
                        <span key={i} className={!stale && result && step === i + 1 ? "ruler-active" : ""}>
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
                                className={`operation-slot ${isStepActive ? "slot-highlight" : !stale && result && step > i + 1 ? "slot-completed" : ""}`}
                                aria-current={isStepActive ? "step" : undefined}
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
                    Start with a Hadamard (H) gate. Select it, add it to <strong>q0</strong>, then choose <strong>Execute</strong> to see what changes.
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
                <button
                  type="button"
                  className={`run-button circuit-run-btn${busy ? " busy-glow" : ""}`}
                  onClick={() => void run()}
                  disabled={busy || accountLoading}
                  aria-busy={busy}
                >
                  {busy ? "Computing…" : "▶ Execute"}
                </button>
              </div>

              {result && (
                <StateEvolutionGuide
                  snapshots={result.data.steps} operations={result.operations} step={step}
                  onStep={(next) => { setIsPlaying(false); setStep(next); }}
                  playing={isPlaying} disabled={busy || stale}
                  onPlay={() => { if (!isPlaying && step >= result.data.steps.length - 1) setStep(0); setIsPlaying(!isPlaying); }}
                  delay={playbackDelay} onDelay={setPlaybackDelay}
                />
              )}

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

            <div className="lab-results-stack">
            <section id="bloch" className="panel bloch-panel" aria-labelledby="bloch-title">
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
                autoRotate={false}
                transitionMs={Math.min(playbackDelay - 150, 900)}
                vector={vector || { x: 0, y: 0, z: 1 }}
                label={
                  vector
                    ? `Bloch vector for qubit ${selectedQubit}: x ${vector.x.toFixed(2)}, y ${vector.y.toFixed(2)}, z ${vector.z.toFixed(2)}`
                    : "Initial Bloch sphere state"
                }
              />

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

              <ul className="lab-side-probs" aria-label="Top measurement probabilities">
                {busy && <li className="lab-side-probs-empty">Computing amplitudes…</li>}
                {!busy && stale && <li className="lab-side-probs-empty">Circuit changed. Execute again to refresh.</li>}
                {!busy && !stale && latestProbs && latestProbs.map((item) => (
                  <li key={item.basis}>
                    <span>|{item.basis}⟩</span>
                    <progress value={item.probability * 100} max={100} aria-label={`Probability of ${item.basis}`} />
                    <span>{(item.probability * 100).toFixed(1)}%</span>
                  </li>
                ))}
                {!busy && !result && <li className="lab-side-probs-empty">Execute the circuit to see probabilities here.</li>}
              </ul>

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
            <section id="probabilities" className="panel state-panel" aria-labelledby="state-title">
              <div className="panel-head">
                <div>
                  <span className="panel-kicker">03 · Wavefunction</span>
                  <h2 id="state-title">State vector & complex amplitudes</h2>
                </div>
                <div className="state-panel-meta">
                  <span className="meta">{2 ** qubits} basis states</span>
                  <span className="meta">Local statevector</span>
                </div>
              </div>

              {current && !stale ? (
                <StateVectorView snapshot={current} />
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
                </div>
              )}
            </section>
            </div>
          </div>

          <section className="lab-analysis" aria-labelledby="lab-analysis-title">
            <div className="lab-analysis-head">
              <div>
                <span className="panel-kicker">READ THE RESULT</span>
                <h2 id="lab-analysis-title">Analysis</h2>
              </div>
              <p>Evolution, measurements, and comparisons stay on one board. Open a card when you need it.</p>
            </div>
            <div className="lab-analysis-grid">
            <details className="lab-analysis-card lab-analysis-steps">
              <summary>
                <span className="panel-kicker">04 · Chronology</span>
                <span className="lab-analysis-label">Step-by-step state evolution</span>
              </summary>
            <section className="panel steps-panel" aria-labelledby="steps-title">
              <div className="panel-head">
                <div>
                  <h2 id="steps-title">Step-by-step state evolution</h2>
                </div>
                {result && (
                  <button
                    type="button"
                    className="auto-play-toggle"
                    disabled={busy || stale}
                    onClick={() => { if (!isPlaying && step >= result.data.steps.length - 1) setStep(0); setIsPlaying(!isPlaying); }}
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
                    <strong>{narrator?.title}</strong>
                    <p>{narrator?.action}</p><p>{narrator?.observation}</p>
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
            </details>

            <details className="lab-analysis-card lab-analysis-measure">
              <summary>
                <span className="panel-kicker">05 · Readout</span>
                <span className="lab-analysis-label">Measurement sampling</span>
              </summary>
            <section id="counts" className="panel measurement-panel" aria-labelledby="measurement-title">
              <div className="panel-head">
                <div>
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
            </details>

            <details className="lab-analysis-card lab-analysis-engine">
              <summary>
                <span className="panel-kicker">Engines</span>
                <span className="lab-analysis-label">Engine, noise, and comparison</span>
              </summary>
              <div className="lab-more-body">
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
                {engineCompare && (
                  <EngineProbabilityComparison result={engineCompare} />
                )}
              </div>
            </details>

            <details className="lab-analysis-card lab-analysis-tools">
              <summary>
                <span className="panel-kicker">Explore</span>
                <span className="lab-analysis-label">Noise and concept toolbox</span>
              </summary>
              <QuantumToolbox />
            </details>
            <details className="lab-analysis-card lab-analysis-experiment">
              <summary>
                <span className="panel-kicker">Explore</span>
                <span className="lab-analysis-label">Entanglement experiment</span>
              </summary>
              <EntanglementLab />
            </details>
            </div>
          </section>
            </>
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
