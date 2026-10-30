export type GlossaryEntry = { term: string; plain: string; anchor?: string };

export type CheatSheetRow = { label: string; detail: string; href?: string };
export type CheatSheet = { id: string; title: string; rows: CheatSheetRow[] };

export const GLOSSARY: GlossaryEntry[] = [
  { term: "Qubit", plain: "A quantum bit. Before you measure, it can have chances for 0 and 1 at the same time.", anchor: "bloch" },
  { term: "Superposition", plain: "More than one outcome is possible until you measure.", anchor: "bloch" },
  { term: "Hadamard (H)", plain: "A gate that turns a definite 0 into a fair mix of 0 and 1.", anchor: "circuit" },
  { term: "Pauli X", plain: "Bit flip — swaps |0⟩ and |1⟩ like a classical NOT.", anchor: "circuit" },
  { term: "Pauli Z", plain: "Phase flip — adds a minus sign to |1⟩ without changing measurement odds alone.", anchor: "circuit" },
  { term: "CNOT (CX)", plain: "Controlled NOT: flips the target qubit when the control is |1⟩.", anchor: "circuit" },
  { term: "Measurement", plain: "One read gives one classical answer. Many reads fill in the chances.", anchor: "counts" },
  { term: "Shot", plain: "One sampled outcome when you run a circuit many times.", anchor: "counts" },
  { term: "Entanglement", plain: "Two qubits share a pattern. Looking at one alone can look random.", anchor: "bloch" },
  { term: "Bloch sphere", plain: "A picture of one qubit’s direction. The dot shows how it will tend to read.", anchor: "bloch" },
  { term: "State vector", plain: "The full list of amplitudes for every basis label in the simulator.", anchor: "probabilities" },
  { term: "Amplitude", plain: "A complex number whose squared size becomes probability after measurement rules.", anchor: "probabilities" },
  { term: "Probability", plain: "The exact chance from the simulator before you sample.", anchor: "probabilities" },
  { term: "Counts", plain: "What this run actually gave when shots were sampled.", anchor: "counts" },
  { term: "Basis label", plain: "A bit string like 010 naming a computational basis state.", anchor: "probabilities" },
  { term: "Phase", plain: "The angle part of an amplitude; shows up in interference.", anchor: "bloch" },
  { term: "Interference", plain: "Amplitudes add or cancel before you measure — the heart of many algorithms.", anchor: "probabilities" },
  { term: "Oracle", plain: "A circuit piece that marks target states with a phase flip.", anchor: "circuit" },
  { term: "Diffuser", plain: "Grover’s step that amplifies marked amplitudes toward measurement.", anchor: "circuit" },
  { term: "Grover search", plain: "Quadratic speedup for unstructured search in ideal models.", anchor: "circuit" },
  { term: "TSP encoding", plain: "Map routes to basis labels so a search circuit can mark good tours.", anchor: "circuit" },
  { term: "Noise", plain: "Pedagogical noise smears results so you can see why hardware is harder.", anchor: "counts" },
  { term: "Depolarizing noise", plain: "A teaching model that randomly mixes states toward uniform error.", anchor: "counts" },
  { term: "Syndrome", plain: "Extra measurements that hint which error happened without revealing data directly.", anchor: "counts" },
  { term: "Bit-flip code", plain: "Simplest QEC story: detect a flip and correct it with ancilla qubits.", anchor: "circuit" },
  { term: "Transpile", plain: "Rewrite a circuit into a device’s native gate set (preview in Lab Advanced).", anchor: "circuit" },
  { term: "Circuit depth", plain: "Longer circuits accumulate more error on real hardware.", anchor: "circuit" },
  { term: "T1 / T2", plain: "Toy decay times: energy loss (T1) and phase loss (T2) — see Hardware Academy.", anchor: "bloch" },
  { term: "Readout fidelity", plain: "How often a measured bit matches the qubit’s true state before readout error.", anchor: "counts" },
  { term: "Ideal simulator", plain: "Exact statevector math — no live device claim.", anchor: "probabilities" },
  { term: "Cirq / Qiskit", plain: "Two libraries that compute the same circuit. Compare them in Lab Advanced.", anchor: "circuit" },
];

export const CHEAT_SHEETS: CheatSheet[] = [
  {
    id: "gates",
    title: "Common gates (1–2 qubits)",
    rows: [
      { label: "H", detail: "Superposition from |0⟩" },
      { label: "X, Y, Z", detail: "Pauli rotations / bit or phase flip" },
      { label: "S, T", detail: "π/2 and π/4 phase on |1⟩" },
      { label: "RX, RY, RZ(θ)", detail: "Rotate by angle θ on Bloch sphere" },
      { label: "CX / CZ", detail: "Entangle when control is |1⟩" },
      { label: "Measure", detail: "Collapse to 0 or 1 for that qubit" },
    ],
  },
  {
    id: "dirac",
    title: "Dirac notation (quick)",
    rows: [
      { label: "|0⟩, |1⟩", detail: "Computational basis kets" },
      { label: "|+⟩", detail: "(|0⟩ + |1⟩)/√2 — H on |0⟩" },
      { label: "⟨ψ|", detail: "Bra — dual row for inner products" },
      { label: "|ψ⟩⟨φ|", detail: "Outer product (operators)" },
    ],
  },
  {
    id: "lab-anchors",
    title: "Jump to lab panels",
    rows: [
      { label: "Circuit", detail: "Composer grid", href: "/workspace#circuit" },
      { label: "Bloch", detail: "3D qubit view", href: "/workspace#bloch" },
      { label: "Probabilities", detail: "Ideal bars", href: "/workspace#probabilities" },
      { label: "Counts", detail: "Shot histogram", href: "/workspace#counts" },
    ],
  },
];

export function filterGlossary(query: string): GlossaryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return GLOSSARY;
  return GLOSSARY.filter(
    (item) => item.term.toLowerCase().includes(q) || item.plain.toLowerCase().includes(q)
  );
}
