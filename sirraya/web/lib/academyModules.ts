/** Sirraya Quantum Academy module map (OBSERVED names → QuantumWalk routes). */

export type AcademyModule = {
  id: string;
  title: string;
  description: string;
  href: string;
  evidence: "observed" | "proposed";
};

export const ACADEMY_MODULES: AcademyModule[] = [
  {
    id: "virtual-lab",
    title: "Virtual Lab",
    description: "Circuit composer with step playback, Bloch sphere, amplitudes, and shot histograms.",
    href: "/workspace?mode=circuit",
    evidence: "observed",
  },
  {
    id: "gate-composer",
    title: "Gate composer",
    description: "Drag-and-drop gates, multi-qubit controls, and engine comparison (Qiskit / Cirq).",
    href: "/workspace?mode=circuit",
    evidence: "observed",
  },
  {
    id: "bloch",
    title: "Bloch sphere",
    description: "3D qubit visualization tied to the active step in the lab.",
    href: "/workspace?mode=circuit",
    evidence: "observed",
  },
  {
    id: "characterization",
    title: "Characterization lab",
    description: "T1/T2 toys and readout fidelity vocabulary — teaching models only.",
    href: "/learn/hardware",
    evidence: "observed",
  },
  {
    id: "hardware-lab",
    title: "Hardware lab",
    description: "Architecture cards: superconducting, trapped ion, neutral atom connectivity.",
    href: "/learn/hardware",
    evidence: "observed",
  },
  {
    id: "algorithms",
    title: "Algorithms at a glance",
    description: "Grover, Bell, Deutsch–Jozsa narratives with library templates.",
    href: "/algorithms",
    evidence: "observed",
  },
  {
    id: "quantum-mapper",
    title: "Quantum mapper",
    description: "Route index, binary register, and Grover query encodings (interactive).",
    href: "/explorer/mapper",
    evidence: "observed",
  },
  {
    id: "grover-lab",
    title: "Grover lab",
    description: "Ideal success probability vs iterations (query model calculator).",
    href: "/academy/labs/grover",
    evidence: "proposed",
  },
  {
    id: "noise-qec",
    title: "Noise & error correction",
    description: "Pedagogical noise in the lab plus bit-flip code vocabulary lesson.",
    href: "/learn/qec-bit-flip",
    evidence: "observed",
  },
  {
    id: "qec-lab",
    title: "Bit-flip code lab",
    description: "Simulator syndrome toy for three data qubits — not live hardware.",
    href: "/academy/labs/qec",
    evidence: "proposed",
  },
  {
    id: "reservoir",
    title: "Quantum reservoir computing",
    description: "Concept overview — how disordered dynamics can feature-map time series (no hardware claim).",
    href: "/academy/reservoir",
    evidence: "observed",
  },
  {
    id: "reference",
    title: "Glossary & cheat sheets",
    description: "Searchable terms and gate notation with links into the lab.",
    href: "/learn/reference",
    evidence: "observed",
  },
  {
    id: "math-spine",
    title: "Math & physics spine",
    description: "Reading path for complex numbers, measurement, and tensor products before deep labs.",
    href: "/academy/foundations",
    evidence: "proposed",
  },
];
