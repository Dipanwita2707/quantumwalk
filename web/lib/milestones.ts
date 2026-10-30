export type Milestone = { id: string; title: string; description: string; activity: string; href: string };

export const milestones: Milestone[] = [
  { id: "intro", title: "Discovery graduate", description: "Finish the /start introduction.", activity: "discovery:introduction", href: "/start" },
  { id: "first-qubit", title: "First discovery", description: "Complete Your First Qubit.", activity: "lesson:first-qubit", href: "/learn/first-qubit" },
  { id: "first-challenge", title: "Circuit challenger", description: "Verify a superposition circuit.", activity: "challenge:make-superposition", href: "/challenges/make-superposition" },
  { id: "bell-lesson", title: "Entanglement explorer", description: "Complete the Bell-pair lesson.", activity: "lesson:entanglement", href: "/learn/entanglement" },
  { id: "grover-lesson", title: "Search amplifier", description: "Complete the Grover boost lesson.", activity: "lesson:grover-boost", href: "/learn/grover-boost" },
  { id: "noise-lesson", title: "Noise vocabulary", description: "Complete the pedagogical noise lesson.", activity: "lesson:pedagogy-noise", href: "/learn/pedagogy-noise" },
  { id: "qec-lesson", title: "QEC teaser", description: "Complete the bit-flip vocabulary lesson.", activity: "lesson:qec-bit-flip", href: "/learn/qec-bit-flip" },
  { id: "bell-challenge", title: "Bell-pair builder", description: "Verify a Bell-pair circuit.", activity: "challenge:make-bell-pair", href: "/challenges/make-bell-pair" },
];
