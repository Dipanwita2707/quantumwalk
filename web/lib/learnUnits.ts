export type LearnUnit = {
  id: string;
  title: string;
  lessonSlugs: string[];
  links: { label: string; href: string }[];
};

export const LEARN_UNITS: LearnUnit[] = [
  {
    id: "math-spine",
    title: "Math & physics spine",
    lessonSlugs: [],
    links: [{ label: "Foundations reader", href: "/academy/foundations" }],
  },
  {
    id: "foundations",
    title: "Foundations",
    lessonSlugs: [
      "first-qubit",
      "math-amplitudes",
      "entanglement",
      "quantum-teleportation",
      "grover-boost",
      "deutsch-intro",
    ],
    links: [],
  },
  {
    id: "algorithms",
    title: "Algorithms & search",
    lessonSlugs: ["tsp-classical", "qft-intro", "shor-intro", "vqe-intro"],
    links: [
      { label: "Quantum mapper", href: "/explorer/mapper" },
      { label: "Grover explorer", href: "/explorer/grover" },
      { label: "Grover lab", href: "/academy/labs/grover" },
      { label: "QFT lab (simulator)", href: "/academy/labs/qft" },
      { label: "TSP explorer", href: "/explorer/tsp" },
    ],
  },
  {
    id: "noise",
    title: "Noise & integrity",
    lessonSlugs: ["pedagogy-noise", "qec-bit-flip"],
    links: [{ label: "Bit-flip lab (simulator)", href: "/academy/labs/qec" }],
  },
  {
    id: "hardware",
    title: "Hardware concepts",
    lessonSlugs: [],
    links: [
      { label: "Architecture cards (no live device)", href: "/learn/hardware" },
      { label: "Glossary & cheat sheets", href: "/learn/reference" },
    ],
  },
  {
    id: "reservoir",
    title: "Reservoir computing",
    lessonSlugs: ["quantum-reservoir"],
    links: [
      { label: "Concept overview", href: "/academy/reservoir" },
      { label: "Reservoir lab (simulation)", href: "/academy/labs/reservoir" },
    ],
  },
];

export function unitCompletion(unit: LearnUnit, completed: Set<string>): { done: number; total: number; pct: number } {
  const total = unit.lessonSlugs.length;
  const done = unit.lessonSlugs.filter((slug) => completed.has(`lesson:${slug}`)).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, pct };
}
