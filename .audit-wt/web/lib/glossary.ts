export type GlossaryEntry = { term: string; plain: string; anchor?: string };

export const GLOSSARY: GlossaryEntry[] = [
  { term: "Qubit", plain: "A quantum bit. Before you measure, it can have chances for 0 and 1 at the same time.", anchor: "probabilities" },
  { term: "Superposition", plain: "More than one outcome is possible until you measure.", anchor: "bloch" },
  { term: "Hadamard (H)", plain: "A gate that turns a definite 0 into a fair mix of 0 and 1.", anchor: "circuit" },
  { term: "Measurement", plain: "One read gives one classical answer. Many reads fill in the chances.", anchor: "counts" },
  { term: "Entanglement", plain: "Two qubits share a pattern. Looking at one alone can look random.", anchor: "bloch" },
  { term: "Bloch sphere", plain: "A picture of one qubit’s direction. The dot shows how it will tend to read.", anchor: "bloch" },
  { term: "Probability", plain: "The exact chance from the simulator before you sample.", anchor: "probabilities" },
  { term: "Counts", plain: "What this run actually gave when shots were sampled.", anchor: "counts" },
  { term: "Noise", plain: "Pedagogical noise smears results so you can see why hardware is harder.", anchor: "counts" },
  { term: "Cirq / Qiskit", plain: "Two libraries that compute the same circuit. We compare them in Advanced.", anchor: "circuit" },
];
