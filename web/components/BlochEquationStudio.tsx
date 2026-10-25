"use client";

import React, { useState, useEffect, useMemo } from "react";
import { QuantumSphere } from "./QuantumSphere";
import "./BlochEquationStudio.css";

type Complex = { re: number; im: number };

function formatFloat(n: number, decimals: number = 3): string {
  if (Math.abs(n) < 1e-5) return "0";
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
  const absImStr = Math.abs(im - 1) < 1e-4 ? "i" : `${formatFloat(Math.abs(im))}i`;
  return `${formatFloat(re)} ${sign} ${absImStr}`;
}

export function BlochEquationStudio() {
  // Mode: "angles" (theta, phi) or "amplitudes" (alpha, beta) or "unitary" (transform)
  const [controlMode, setControlMode] = useState<"angles" | "amplitudes" | "matrix">("angles");

  // Spherical Coordinates
  const [theta, setTheta] = useState<number>(Math.PI / 2); // 0 to pi
  const [phi, setPhi] = useState<number>(0); // 0 to 2pi

  // Complex amplitude manual inputs (used in amplitudes mode)
  const [alphaRe, setAlphaRe] = useState("0.7071");
  const [alphaIm, setAlphaIm] = useState("0");
  const [betaRe, setBetaRe] = useState("0.7071");
  const [betaIm, setBetaIm] = useState("0");

  // Dynamic calculations
  const state = useMemo(() => {
    let a: Complex;
    let b: Complex;

    if (controlMode === "angles") {
      // |psi> = cos(theta/2)|0> + e^(i*phi)*sin(theta/2)|1>
      const halfTheta = theta / 2;
      const cosHalf = Math.cos(halfTheta);
      const sinHalf = Math.sin(halfTheta);

      a = { re: cosHalf, im: 0 };
      b = {
        re: sinHalf * Math.cos(phi),
        im: sinHalf * Math.sin(phi),
      };
    } else {
      // From manual amplitude inputs with automatic normalization
      const rawARe = parseFloat(alphaRe) || 0;
      const rawAIm = parseFloat(alphaIm) || 0;
      const rawBRe = parseFloat(betaRe) || 0;
      const rawBIm = parseFloat(betaIm) || 0;

      const normSq = rawARe * rawARe + rawAIm * rawAIm + rawBRe * rawBRe + rawBIm * rawBIm;
      const norm = normSq > 1e-8 ? Math.sqrt(normSq) : 1;

      a = { re: rawARe / norm, im: rawAIm / norm };
      b = { re: rawBRe / norm, im: rawBIm / norm };
    }

    // Compute Bloch vector coordinates:
    // x = 2 * Re(alpha* * beta) = 2 * (a.re * b.re + a.im * b.im)
    // y = 2 * Im(alpha* * beta) = 2 * (a.re * b.im - a.im * b.re)
    // z = |alpha|^2 - |beta|^2 = (a.re^2 + a.im^2) - (b.re^2 + b.im^2)
    const prob0 = a.re * a.re + a.im * a.im;
    const prob1 = b.re * b.re + b.im * b.im;

    const x = 2 * (a.re * b.re + a.im * b.im);
    const y = 2 * (a.re * b.im - a.im * b.re);
    const z = prob0 - prob1;

    // Derived angles
    const calculatedTheta = Math.acos(Math.max(-1, Math.min(1, z)));
    const calculatedPhi = Math.atan2(y, x);
    const normalizedPhi = calculatedPhi >= 0 ? calculatedPhi : calculatedPhi + 2 * Math.PI;

    return {
      alpha: a,
      beta: b,
      prob0: Math.max(0, Math.min(1, prob0)),
      prob1: Math.max(0, Math.min(1, prob1)),
      vector: { x, y, z },
      theta: calculatedTheta,
      phi: normalizedPhi,
    };
  }, [controlMode, theta, phi, alphaRe, alphaIm, betaRe, betaIm]);

  // Apply a Unitary transformation matrix dynamically
  function applyGate(gate: "H" | "X" | "Y" | "Z" | "S" | "T") {
    // Current statevector: [a, b]
    const a = state.alpha;
    const b = state.beta;

    let newA: Complex;
    let newB: Complex;

    switch (gate) {
      case "H": {
        // H = 1/sqrt(2) * [[1, 1], [1, -1]]
        const s = Math.SQRT1_2;
        newA = { re: s * (a.re + b.re), im: s * (a.im + b.im) };
        newB = { re: s * (a.re - b.re), im: s * (a.im - b.im) };
        break;
      }
      case "X": {
        // X = [[0, 1], [1, 0]]
        newA = { re: b.re, im: b.im };
        newB = { re: a.re, im: a.im };
        break;
      }
      case "Y": {
        // Y = [[0, -i], [i, 0]]
        // newA = -i * b = (b.im, -b.re)
        // newB = i * a = (-a.im, a.re)
        newA = { re: b.im, im: -b.re };
        newB = { re: -a.im, im: a.re };
        break;
      }
      case "Z": {
        // Z = [[1, 0], [0, -1]]
        newA = { re: a.re, im: a.im };
        newB = { re: -b.re, im: -b.im };
        break;
      }
      case "S": {
        // S = [[1, 0], [0, i]]
        // newA = a
        // newB = i * b = (-b.im, b.re)
        newA = { re: a.re, im: a.im };
        newB = { re: -b.im, im: b.re };
        break;
      }
      case "T": {
        // T = [[1, 0], [0, e^(i*pi/4)]]
        // e^(i*pi/4) = 1/sqrt(2) + i/sqrt(2)
        const cos = Math.SQRT1_2;
        const sin = Math.SQRT1_2;
        newA = { re: a.re, im: a.im };
        newB = {
          re: b.re * cos - b.im * sin,
          im: b.re * sin + b.im * cos,
        };
        break;
      }
    }

    // Convert new amplitudes to theta and phi
    const p0 = newA.re * newA.re + newA.im * newA.im;
    const p1 = newB.re * newB.re + newB.im * newB.im;
    const newX = 2 * (newA.re * newB.re + newA.im * newB.im);
    const newY = 2 * (newA.re * newB.im - newA.im * newB.re);
    const newZ = p0 - p1;

    const newTheta = Math.acos(Math.max(-1, Math.min(1, newZ)));
    const newPhi = Math.atan2(newY, newX);
    const normPhi = newPhi >= 0 ? newPhi : newPhi + 2 * Math.PI;

    setTheta(newTheta);
    setPhi(normPhi);
    setAlphaRe(newA.re.toFixed(4));
    setAlphaIm(newA.im.toFixed(4));
    setBetaRe(newB.re.toFixed(4));
    setBetaIm(newB.im.toFixed(4));
  }

  // Preset canonical quantum states
  function setCanonicalPreset(name: "0" | "1" | "+" | "-" | "+i" | "-i") {
    switch (name) {
      case "0":
        setTheta(0);
        setPhi(0);
        break;
      case "1":
        setTheta(Math.PI);
        setPhi(0);
        break;
      case "+":
        setTheta(Math.PI / 2);
        setPhi(0);
        break;
      case "-":
        setTheta(Math.PI / 2);
        setPhi(Math.PI);
        break;
      case "+i":
        setTheta(Math.PI / 2);
        setPhi(Math.PI / 2);
        break;
      case "-i":
        setTheta(Math.PI / 2);
        setPhi((3 * Math.PI) / 2);
        break;
    }
  }

  return (
    <div className="bes-container">
      {/* Studio Header */}
      <div className="bes-header">
        <div>
          <div className="bes-badge">EQUATION-DRIVEN QUANTUM ENGINE</div>
          <h3>Dynamic Bloch Sphere & Wavefunction Studio</h3>
          <p>
            Continuous mathematical simulation of single-qubit Hilbert space. Adjust polar angles $\theta, \phi$ or
            complex amplitudes $\alpha, \beta$ to observe real-time unitary dynamics.
          </p>
        </div>

        {/* State Presets */}
        <div className="bes-presets">
          <span className="bes-presets-label">Basis States:</span>
          <button type="button" onClick={() => setCanonicalPreset("0")} title="North Pole |0⟩">
            |0⟩
          </button>
          <button type="button" onClick={() => setCanonicalPreset("1")} title="South Pole |1⟩">
            |1⟩
          </button>
          <button type="button" onClick={() => setCanonicalPreset("+")} title="+X Equator |+⟩">
            |+⟩
          </button>
          <button type="button" onClick={() => setCanonicalPreset("-")} title="-X Equator |-⟩">
            |−⟩
          </button>
          <button type="button" onClick={() => setCanonicalPreset("+i")} title="+Y Equator |+i⟩">
            |+i⟩
          </button>
          <button type="button" onClick={() => setCanonicalPreset("-i")} title="-Y Equator |-i⟩">
            |−i⟩
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="bes-grid">
        {/* Left: 3D Sphere Display & Rotation Viewport */}
        <div className="bes-viewport-card">
          <div className="bes-sphere-box">
            <QuantumSphere vector={state.vector} label="Real-time dynamic Bloch sphere vector" />
          </div>

          {/* Coordinate Readout Badges */}
          <div className="bes-coords-strip">
            <div className="bes-coord-pill">
              <span>⟨X⟩</span>
              <strong>{formatFloat(state.vector.x)}</strong>
            </div>
            <div className="bes-coord-pill">
              <span>⟨Y⟩</span>
              <strong>{formatFloat(state.vector.y)}</strong>
            </div>
            <div className="bes-coord-pill">
              <span>⟨Z⟩</span>
              <strong>{formatFloat(state.vector.z)}</strong>
            </div>
            <div className="bes-coord-pill">
              <span>θ (polar)</span>
              <strong>{(state.theta * (180 / Math.PI)).toFixed(1)}°</strong>
            </div>
            <div className="bes-coord-pill">
              <span>ϕ (phase)</span>
              <strong>{(state.phi * (180 / Math.PI)).toFixed(1)}°</strong>
            </div>
          </div>
        </div>

        {/* Right: Dynamic Equation & Interactive Controls */}
        <div className="bes-controls-card">
          {/* Live Mathematical Formula Banner */}
          <div className="bes-equation-display">
            <span className="bes-equation-kicker">CURRENT WAVEFUNCTION EQUATION</span>
            <div className="bes-math-formula">
              |ψ⟩ = <span className="math-alpha">({formatComplex(state.alpha)})</span>|0⟩ +{" "}
              <span className="math-beta">({formatComplex(state.beta)})</span>|1⟩
            </div>
            <div className="bes-spherical-formula">
              = cos({(state.theta / 2).toFixed(2)})|0⟩ + e^({formatFloat(state.phi, 2)}i) · sin({(state.theta / 2).toFixed(2)})|1⟩
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="bes-tab-bar">
            <button
              type="button"
              className={controlMode === "angles" ? "active" : ""}
              onClick={() => setControlMode("angles")}
            >
              Spherical Angles (θ, ϕ)
            </button>
            <button
              type="button"
              className={controlMode === "amplitudes" ? "active" : ""}
              onClick={() => setControlMode("amplitudes")}
            >
              Custom Amplitudes (α, β)
            </button>
            <button
              type="button"
              className={controlMode === "matrix" ? "active" : ""}
              onClick={() => setControlMode("matrix")}
            >
              Unitary Transformations (U)
            </button>
          </div>

          {/* Tab 1: Spherical Angles Sliders */}
          {controlMode === "angles" && (
            <div className="bes-tab-content">
              <div className="bes-slider-group">
                <div className="bes-slider-header">
                  <label htmlFor="theta-slider">Polar Angle θ (Bloch Latitude):</label>
                  <span>
                    {formatFloat(theta, 3)} rad ({((theta * 180) / Math.PI).toFixed(1)}°)
                  </span>
                </div>
                <input
                  id="theta-slider"
                  type="range"
                  min="0"
                  max={Math.PI}
                  step="0.01"
                  value={theta}
                  onChange={(e) => setTheta(parseFloat(e.target.value))}
                />
                <div className="bes-slider-hints">
                  <span>θ = 0 (|0⟩)</span>
                  <span>θ = π/2 (Equator)</span>
                  <span>θ = π (|1⟩)</span>
                </div>
              </div>

              <div className="bes-slider-group" style={{ marginTop: "18px" }}>
                <div className="bes-slider-header">
                  <label htmlFor="phi-slider">Azimuthal Phase ϕ (Bloch Longitude):</label>
                  <span>
                    {formatFloat(phi, 3)} rad ({((phi * 180) / Math.PI).toFixed(1)}°)
                  </span>
                </div>
                <input
                  id="phi-slider"
                  type="range"
                  min="0"
                  max={2 * Math.PI}
                  step="0.01"
                  value={phi}
                  onChange={(e) => setPhi(parseFloat(e.target.value))}
                />
                <div className="bes-slider-hints">
                  <span>ϕ = 0 (+X)</span>
                  <span>ϕ = π/2 (+Y)</span>
                  <span>ϕ = π (-X)</span>
                  <span>ϕ = 2π</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Custom Complex Amplitudes Inputs */}
          {controlMode === "amplitudes" && (
            <div className="bes-tab-content">
              <p className="bes-tab-sub">
                Input arbitrary coefficients. The engine automatically enforces quantum normalization:{" "}
                <code>|α|² + |β|² = 1</code>.
              </p>
              <div className="bes-amp-inputs-grid">
                <div className="bes-amp-field">
                  <label>Re(α) |0⟩:</label>
                  <input
                    type="number"
                    step="0.05"
                    value={alphaRe}
                    onChange={(e) => setAlphaRe(e.target.value)}
                  />
                </div>
                <div className="bes-amp-field">
                  <label>Im(α) |0⟩:</label>
                  <input
                    type="number"
                    step="0.05"
                    value={alphaIm}
                    onChange={(e) => setAlphaIm(e.target.value)}
                  />
                </div>
                <div className="bes-amp-field">
                  <label>Re(β) |1⟩:</label>
                  <input
                    type="number"
                    step="0.05"
                    value={betaRe}
                    onChange={(e) => setBetaRe(e.target.value)}
                  />
                </div>
                <div className="bes-amp-field">
                  <label>Im(β) |1⟩:</label>
                  <input
                    type="number"
                    step="0.05"
                    value={betaIm}
                    onChange={(e) => setBetaIm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Unitary Operator Simulator */}
          {controlMode === "matrix" && (
            <div className="bes-tab-content">
              <p className="bes-tab-sub">
                Apply a unitary matrix to rotate $|ψ\rangle$ according to quantum mechanics: $|ψ'\rangle = U|ψ\rangle$.
              </p>
              <div className="bes-gate-buttons">
                <button type="button" onClick={() => applyGate("H")}>
                  <strong>H</strong>
                  <small>Hadamard (Superposition)</small>
                </button>
                <button type="button" onClick={() => applyGate("X")}>
                  <strong>X</strong>
                  <small>Pauli-X (Bit flip π around X)</small>
                </button>
                <button type="button" onClick={() => applyGate("Y")}>
                  <strong>Y</strong>
                  <small>Pauli-Y (Bit+Phase flip)</small>
                </button>
                <button type="button" onClick={() => applyGate("Z")}>
                  <strong>Z</strong>
                  <small>Pauli-Z (Phase flip π around Z)</small>
                </button>
                <button type="button" onClick={() => applyGate("S")}>
                  <strong>S</strong>
                  <small>Phase π/2 around Z</small>
                </button>
                <button type="button" onClick={() => applyGate("T")}>
                  <strong>T</strong>
                  <small>Phase π/4 around Z</small>
                </button>
              </div>
            </div>
          )}

          {/* Live Computational Basis Probabilities */}
          <div className="bes-probs-box">
            <div className="bes-prob-item">
              <div className="bes-prob-title">
                <span>P(|0⟩) = |α|² = cos²(θ/2)</span>
                <strong>{(state.prob0 * 100).toFixed(1)}%</strong>
              </div>
              <div className="bes-prob-track">
                <div className="bes-prob-bar p0" style={{ width: `${state.prob0 * 100}%` }} />
              </div>
            </div>

            <div className="bes-prob-item">
              <div className="bes-prob-title">
                <span>P(|1⟩) = |β|² = sin²(θ/2)</span>
                <strong>{(state.prob1 * 100).toFixed(1)}%</strong>
              </div>
              <div className="bes-prob-track">
                <div className="bes-prob-bar p1" style={{ width: `${state.prob1 * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
