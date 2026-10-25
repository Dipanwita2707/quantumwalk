"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { QuantumSphere } from "./QuantumSphere";
import "./QuantumEquationWhiteboard.css";

type Complex = { re: number; im: number };

function formatFloat(n: number, decimals: number = 3): string {
  if (Math.abs(n) < 1e-4) return "0";
  return n.toFixed(decimals);
}

function formatComplex(c: Complex): string {
  const re = Math.abs(c.re) < 1e-4 ? 0 : c.re;
  const im = Math.abs(c.im) < 1e-4 ? 0 : c.im;

  if (im === 0) return formatFloat(re);
  if (re === 0) {
    if (Math.abs(im - 1) < 1e-4) return "i";
    if (Math.abs(im + 1) < 1e-4) return "−i";
    return `${formatFloat(im)}i`;
  }
  const sign = im >= 0 ? "+" : "−";
  const absImStr = Math.abs(Math.abs(im) - 1) < 1e-4 ? "i" : `${formatFloat(Math.abs(im))}i`;
  return `${formatFloat(re)} ${sign} ${absImStr}`;
}

type EquationPreset = {
  id: string;
  name: string;
  description: string;
  initialAlpha: Complex;
  initialBeta: Complex;
  operators: string[];
};

const PRESETS: EquationPreset[] = [
  {
    id: "hadamard",
    name: "Hadamard Superposition",
    description: "Transforms ground state |0⟩ into equal superposition |+⟩ via diagonal π rotation.",
    initialAlpha: { re: 1, im: 0 },
    initialBeta: { re: 0, im: 0 },
    operators: ["H"],
  },
  {
    id: "bell_basis",
    name: "Y-Basis Circular State |+i⟩",
    description: "Creates equal superposition with +90° relative phase along the +Y Bloch equator.",
    initialAlpha: { re: 1, im: 0 },
    initialBeta: { re: 0, im: 0 },
    operators: ["H", "S"],
  },
  {
    id: "bit_flip",
    name: "Pauli-X Inversion",
    description: "Classical NOT gate rotation by π around the X-axis mapping North pole to South pole.",
    initialAlpha: { re: 1, im: 0 },
    initialBeta: { re: 0, im: 0 },
    operators: ["X"],
  },
  {
    id: "t_rotation",
    name: "T-Gate π/4 Phase Turn",
    description: "Applies non-Clifford phase rotation by π/4 around the Z-axis.",
    initialAlpha: { re: Math.SQRT1_2, im: 0 },
    initialBeta: { re: Math.SQRT1_2, im: 0 },
    operators: ["T"],
  },
  {
    id: "hadamard_cancel",
    name: "Hadamard Self-Inverse H² = I",
    description: "Two successive Hadamards return the quantum state back to deterministic |0⟩.",
    initialAlpha: { re: 1, im: 0 },
    initialBeta: { re: 0, im: 0 },
    operators: ["H", "H"],
  },
];

type Quest = {
  id: string;
  title: string;
  targetVector: { x: number; y: number; z: number };
  targetLabel: string;
  hint: string;
};

const QUESTS: Quest[] = [
  {
    id: "quest_plus_i",
    title: "Synthesize |+i⟩ on +Y Equator",
    targetVector: { x: 0, y: 1, z: 0 },
    targetLabel: "(x=0, y=1, z=0)",
    hint: "Start in |0⟩, apply Hadamard (H) to reach +X equator, then Phase (S) to turn 90° onto +Y.",
  },
  {
    id: "quest_minus",
    title: "Synthesize |−⟩ along -X Axis",
    targetVector: { x: -1, y: 0, z: 0 },
    targetLabel: "(x=-1, y=0, z=0)",
    hint: "Apply Hadamard (H) then Pauli-Z (Z) to invert the relative phase.",
  },
  {
    id: "quest_one",
    title: "Invert to South Pole |1⟩",
    targetVector: { x: 0, y: 0, z: -1 },
    targetLabel: "(x=0, y=0, z=-1)",
    hint: "Apply Pauli-X (X) directly to flip the qubit.",
  },
];

export function QuantumEquationWhiteboard() {
  const [activePreset, setActivePreset] = useState<string>("hadamard");
  const [operatorChain, setOperatorChain] = useState<string[]>(["H"]);
  const [userAlpha, setUserAlpha] = useState<Complex>({ re: 1, im: 0 });
  const [userBeta, setUserBeta] = useState<Complex>({ re: 0, im: 0 });
  
  // Gamification state
  const [currentQuestIdx, setCurrentQuestIdx] = useState(0);
  const [masteryXp, setMasteryXp] = useState(0);
  const [solvedQuests, setSolvedQuests] = useState<Record<string, boolean>>({});

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const whiteboardHydratedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("qw_whiteboard_state");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed) {
            if (parsed.activePreset) setActivePreset(parsed.activePreset);
            if (Array.isArray(parsed.operatorChain) && parsed.operatorChain.length > 0) setOperatorChain(parsed.operatorChain);
            if (parsed.userAlpha) setUserAlpha(parsed.userAlpha);
            if (parsed.userBeta) setUserBeta(parsed.userBeta);
            if (typeof parsed.currentQuestIdx === "number") setCurrentQuestIdx(parsed.currentQuestIdx);
            if (typeof parsed.masteryXp === "number") setMasteryXp(parsed.masteryXp);
            if (parsed.solvedQuests) setSolvedQuests(parsed.solvedQuests);
          }
        }
      } catch {}
      whiteboardHydratedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!whiteboardHydratedRef.current || typeof window === "undefined") return;
    try {
      localStorage.setItem(
        "qw_whiteboard_state",
        JSON.stringify({
          activePreset,
          operatorChain,
          userAlpha,
          userBeta,
          currentQuestIdx,
          masteryXp,
          solvedQuests,
        })
      );
    } catch {}
  }, [activePreset, operatorChain, userAlpha, userBeta, currentQuestIdx, masteryXp, solvedQuests]);

  // Compute final state by multiplying unitary operators sequentially
  const simulationResult = useMemo(() => {
    let a: Complex = { ...userAlpha };
    let b: Complex = { ...userBeta };

    // Initial normalization
    const initNormSq = a.re * a.re + a.im * a.im + b.re * b.re + b.im * b.im;
    const initNorm = initNormSq > 1e-8 ? Math.sqrt(initNormSq) : 1;
    a = { re: a.re / initNorm, im: a.im / initNorm };
    b = { re: b.re / initNorm, im: b.im / initNorm };

    const derivationSteps: string[] = [
      `Initialized state |ψ₀⟩ = (${formatComplex(a)})|0⟩ + (${formatComplex(b)})|1⟩`,
    ];

    // Sequentially apply operators
    operatorChain.forEach((op, idx) => {
      let nextA: Complex = { ...a };
      let nextB: Complex = { ...b };

      switch (op) {
        case "H": {
          const s = Math.SQRT1_2;
          nextA = { re: s * (a.re + b.re), im: s * (a.im + b.im) };
          nextB = { re: s * (a.re - b.re), im: s * (a.im - b.im) };
          derivationSteps.push(
            `Step ${idx + 1}: Applied Hadamard H → rotated vector by π around (X+Z)/√2 axis to (${formatComplex(nextA)})|0⟩ + (${formatComplex(nextB)})|1⟩`
          );
          break;
        }
        case "X": {
          nextA = { re: b.re, im: b.im };
          nextB = { re: a.re, im: a.im };
          derivationSteps.push(
            `Step ${idx + 1}: Applied Pauli-X (NOT) → bit flip exchanging |0⟩ and |1⟩ amplitudes`
          );
          break;
        }
        case "Y": {
          nextA = { re: b.im, im: -b.re };
          nextB = { re: -a.im, im: a.re };
          derivationSteps.push(
            `Step ${idx + 1}: Applied Pauli-Y → bit flip with imaginary phase factor ±i`
          );
          break;
        }
        case "Z": {
          nextA = { re: a.re, im: a.im };
          nextB = { re: -b.re, im: -b.im };
          derivationSteps.push(
            `Step ${idx + 1}: Applied Pauli-Z → phase flip injecting −1 into the |1⟩ amplitude`
          );
          break;
        }
        case "S": {
          nextA = { re: a.re, im: a.im };
          nextB = { re: -b.im, im: b.re };
          derivationSteps.push(
            `Step ${idx + 1}: Applied Phase S → rotated azimuthal phase by +π/2 (+90°) around Z`
          );
          break;
        }
        case "T": {
          const cos = Math.SQRT1_2;
          const sin = Math.SQRT1_2;
          nextA = { re: a.re, im: a.im };
          nextB = {
            re: b.re * cos - b.im * sin,
            im: b.re * sin + b.im * cos,
          };
          derivationSteps.push(
            `Step ${idx + 1}: Applied Phase T → rotated azimuthal phase by +π/4 (+45°) around Z`
          );
          break;
        }
      }

      a = nextA;
      b = nextB;
    });

    // Compute Bloch coordinates
    const p0 = a.re * a.re + a.im * a.im;
    const p1 = b.re * b.re + b.im * b.im;

    const x = 2 * (a.re * b.re + a.im * b.im);
    const y = 2 * (a.re * b.im - a.im * b.re);
    const z = p0 - p1;

    const theta = Math.acos(Math.max(-1, Math.min(1, z)));
    const phi = Math.atan2(y, x);
    const normPhi = phi >= 0 ? phi : phi + 2 * Math.PI;

    return {
      alpha: a,
      beta: b,
      prob0: Math.max(0, Math.min(1, p0)),
      prob1: Math.max(0, Math.min(1, p1)),
      vector: { x, y, z },
      theta,
      phi: normPhi,
      steps: derivationSteps,
    };
  }, [userAlpha, userBeta, operatorChain]);

  // Check if current simulation matches current quest
  const currentQuest = QUESTS[currentQuestIdx];
  const isQuestSolved = useMemo(() => {
    if (!currentQuest) return false;
    const target = currentQuest.targetVector;
    const v = simulationResult.vector;
    const dist = Math.sqrt(
      Math.pow(v.x - target.x, 2) + Math.pow(v.y - target.y, 2) + Math.pow(v.z - target.z, 2)
    );
    return dist < 0.05;
  }, [simulationResult, currentQuest]);

  // Handle quest victory
  function claimQuestReward() {
    if (isQuestSolved && !solvedQuests[currentQuest.id]) {
      setSolvedQuests((prev) => ({ ...prev, [currentQuest.id]: true }));
      setMasteryXp((prev) => prev + 100);
      if (currentQuestIdx < QUESTS.length - 1) {
        setCurrentQuestIdx((prev) => prev + 1);
      }
    }
  }

  function handleSelectPreset(preset: EquationPreset) {
    setActivePreset(preset.id);
    setUserAlpha(preset.initialAlpha);
    setUserBeta(preset.initialBeta);
    setOperatorChain([...preset.operators]);
  }

  function addOperator(op: string) {
    setActivePreset("custom");
    setOperatorChain((prev) => [...prev, op]);
  }

  function clearOperators() {
    setActivePreset("custom");
    setOperatorChain([]);
  }

  function runSimulation() {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      if (isQuestSolved && !solvedQuests[currentQuest.id]) {
        claimQuestReward();
      }
    }, 600);
  }

  return (
    <div className="qwb-container">
      <div className="qwb-blueprint-grid" />

      <div className="qwb-content-layer">
        {/* Header with Title and Gamification Tracker */}
        <div className="qwb-header">
          <div className="qwb-title-area">
            <div className="qwb-kicker">
              <span className="qwb-pulse-core" />
              MATHEMATICAL QUANTUM WHITEBOARD · INTERACTIVE SIMULATION
            </div>
            <h2>
              Quantum State & <span>Equation Simulator</span>
            </h2>
            <p>
              Draft quantum statevectors, compose chains of unitary operators, and execute exact mathematical
              simulations. Observe the dynamic 3D Bloch sphere vector, probability readout, and step-by-step
              derivations.
            </p>
          </div>

          {/* Gamification Quest Badge */}
          <div className="qwb-gamify-bar">
            <div className="qwb-xp-badge">
              <small>WHITEBOARD XP</small>
              <strong>{masteryXp}</strong>
            </div>
            <div className="qwb-quest-info">
              <span>CURRENT QUEST ({currentQuestIdx + 1}/{QUESTS.length})</span>
              <strong>{currentQuest.title}</strong>
            </div>
          </div>
        </div>

        {/* Quest Victory Alert */}
        {isQuestSolved && (
          <div className="qwb-victory-toast" style={{ marginBottom: "20px" }}>
            <span className="qwb-trophy">🏆</span>
            <div>
              <strong>Quest Target Synthesized! +100 Mastery XP Earned</strong>
              <p>
                Your equation accurately directed the Bloch vector to target {currentQuest.targetLabel}.
              </p>
            </div>
          </div>
        )}

        {/* Main Blackboard & Visualizer Split */}
        <div className="qwb-main-split">
          {/* Left: The Mathematical Blackboard Slate */}
          <div className="qwb-slate">
            {/* Presets Gallery Ribbon */}
            <div className="qwb-presets-ribbon">
              <span className="qwb-ribbon-label">Load Canonical Equation:</span>
              <div className="qwb-presets-scroll">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`qwb-preset-chip ${activePreset === p.id ? "active" : ""}`}
                    onClick={() => handleSelectPreset(p)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Blackboard Screen */}
            <div className="qwb-blackboard-screen">
              <div className="qwb-chalk-heading">
                <span>MATHEMATICAL WAVEFUNCTION STATE</span>
              </div>

              {/* Mathematical Equation Render */}
              <div className="qwb-formula-display">
                |ψ⟩ ={" "}
                <span className="qwb-alpha-math">
                  ({formatComplex(simulationResult.alpha)})|0⟩
                </span>{" "}
                +{" "}
                <span className="qwb-beta-math">
                  ({formatComplex(simulationResult.beta)})|1⟩
                </span>
              </div>

              {/* Spherical Coordinates Formulation */}
              <div className="qwb-spherical-render">
                = cos(<span>{(simulationResult.theta / 2).toFixed(2)}</span>)|0⟩ + e^(
                <span>{formatFloat(simulationResult.phi, 2)}i</span>) · sin(
                <span>{(simulationResult.theta / 2).toFixed(2)}</span>)|1⟩
              </div>

              {/* Unitary Gate Chain Footprint */}
              <div style={{ fontSize: "12px", color: "#94a3b8", fontFamily: "monospace", marginBottom: "14px" }}>
                <strong>OPERATOR PIPELINE:</strong>{" "}
                {operatorChain.length === 0 ? (
                  <span style={{ color: "#64748b" }}>Identity Ground (No gates)</span>
                ) : (
                  operatorChain.map((op, i) => (
                    <span key={i} style={{ color: "#38bdf8", marginRight: "6px" }}>
                      [{op}]{i < operatorChain.length - 1 ? " →" : ""}
                    </span>
                  ))
                )}
              </div>

              {/* Interactive Mathematical Symbol Pad */}
              <div className="qwb-symbol-pad">
                <div className="qwb-symbol-pad-title">Append Unitary Operators & Basis Gates:</div>
                <div className="qwb-symbols-row">
                  <button type="button" className="qwb-symbol-btn op-gate" onClick={() => addOperator("H")}>
                    + H (Hadamard)
                  </button>
                  <button type="button" className="qwb-symbol-btn op-gate" onClick={() => addOperator("X")}>
                    + X (Pauli NOT)
                  </button>
                  <button type="button" className="qwb-symbol-btn op-gate" onClick={() => addOperator("Y")}>
                    + Y (Pauli-Y)
                  </button>
                  <button type="button" className="qwb-symbol-btn op-gate" onClick={() => addOperator("Z")}>
                    + Z (Phase Flip)
                  </button>
                  <button type="button" className="qwb-symbol-btn op-gate" onClick={() => addOperator("S")}>
                    + S (π/2 Phase)
                  </button>
                  <button type="button" className="qwb-symbol-btn op-gate" onClick={() => addOperator("T")}>
                    + T (π/4 Phase)
                  </button>
                  {operatorChain.length > 0 && (
                    <button
                      type="button"
                      className="qwb-symbol-btn"
                      style={{ borderColor: "#ef4444", color: "#fca5a5" }}
                      onClick={clearOperators}
                    >
                      Clear Chain
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Simulation Run Button */}
            <div className="qwb-sim-bar">
              <button
                type="button"
                className="qwb-btn-simulate"
                disabled={isSimulating}
                onClick={runSimulation}
              >
                {isSimulating ? "⚛ Simulating Wavefunction Dynamics…" : "▶ Run Equation Simulation"}
              </button>

              <div className={`qwb-sim-status ${isSimulating ? "computing" : "coherent"}`}>
                <span>{isSimulating ? "● COMPUTING UNITARY EVOLUTION" : "✓ COHERENT QUANTUM STATE"}</span>
              </div>
            </div>

            {/* Step-by-Step Formal Mathematical Derivation */}
            <div className="qwb-derivation-box">
              <div className="qwb-derivation-title">Mathematical Step Derivation:</div>
              <div className="qwb-derivation-steps">
                {simulationResult.steps.map((st, sIdx) => (
                  <div key={sIdx} className="qwb-step-row">
                    <span className="qwb-step-num">0{sIdx + 1}</span>
                    <span>{st}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Dynamic 3D Bloch Sphere & Exact Result Output */}
          <div className="qwb-output-panel">
            {/* 3D Sphere Card */}
            <div className="qwb-sphere-card">
              <div className="qwb-sphere-card-header">
                <h3>Dynamic Bloch Sphere Vector</h3>
                <span>|r| = 1.000 (Pure State)</span>
              </div>

              <div className="qwb-sphere-canvas-box">
                <QuantumSphere vector={simulationResult.vector} label="Simulation Bloch sphere statevector" />
              </div>

              {/* Exact Coordinate Expectations */}
              <div className="qwb-coords-matrix">
                <div className="qwb-matrix-cell">
                  <small>⟨σ_x⟩ = x</small>
                  <strong>{formatFloat(simulationResult.vector.x)}</strong>
                </div>
                <div className="qwb-matrix-cell">
                  <small>⟨σ_y⟩ = y</small>
                  <strong>{formatFloat(simulationResult.vector.y)}</strong>
                </div>
                <div className="qwb-matrix-cell">
                  <small>⟨σ_z⟩ = z</small>
                  <strong>{formatFloat(simulationResult.vector.z)}</strong>
                </div>
                <div className="qwb-matrix-cell">
                  <small>Polar θ</small>
                  <strong>{((simulationResult.theta * 180) / Math.PI).toFixed(1)}°</strong>
                </div>
                <div className="qwb-matrix-cell">
                  <small>Phase ϕ</small>
                  <strong>{((simulationResult.phi * 180) / Math.PI).toFixed(1)}°</strong>
                </div>
                <div className="qwb-matrix-cell">
                  <small>Purity</small>
                  <strong style={{ color: "#4ade80" }}>100%</strong>
                </div>
              </div>
            </div>

            {/* Measurement Probabilities */}
            <div className="qwb-probs-card">
              <div className="qwb-probs-title">Computational Basis Measurement Probabilities:</div>

              <div className="qwb-prob-track-row">
                <div className="qwb-prob-info">
                  <span>|0⟩ Ground State: cos²(θ/2)</span>
                  <strong>{(simulationResult.prob0 * 100).toFixed(1)}%</strong>
                </div>
                <div className="qwb-bar-base">
                  <div
                    className="qwb-bar-fill-0"
                    style={{ width: `${simulationResult.prob0 * 100}%` }}
                  />
                </div>
              </div>

              <div className="qwb-prob-track-row">
                <div className="qwb-prob-info">
                  <span>|1⟩ Excited State: sin²(θ/2)</span>
                  <strong>{(simulationResult.prob1 * 100).toFixed(1)}%</strong>
                </div>
                <div className="qwb-bar-base">
                  <div
                    className="qwb-bar-fill-1"
                    style={{ width: `${simulationResult.prob1 * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quest Helper Card */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.85)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                borderRadius: "14px",
                padding: "16px",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", marginBottom: "4px" }}>
                Active Quest Guidance
              </div>
              <strong style={{ color: "#ffffff", fontSize: "14px", display: "block", marginBottom: "6px" }}>
                {currentQuest.title}
              </strong>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", lineHeight: 1.5 }}>
                {currentQuest.hint}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
