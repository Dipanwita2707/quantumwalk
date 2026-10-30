export type Milestone = { id: string; title: string; description: string; activity: string; href: string };

export const milestones: Milestone[] = [
  { id: "first-qubit", title: "First discovery", description: "Complete Your First Qubit.", activity: "lesson:first-qubit", href: "/learn/first-qubit" },
  { id: "first-challenge", title: "Circuit challenger", description: "Verify a superposition circuit.", activity: "challenge:make-superposition", href: "/challenges/make-superposition" },
  { id: "bell-lesson", title: "Entanglement explorer", description: "Complete the Bell-pair lesson.", activity: "lesson:entanglement", href: "/learn/entanglement" },
  { id: "bell-challenge", title: "Bell-pair builder", description: "Verify a Bell-pair circuit.", activity: "challenge:make-bell-pair", href: "/challenges/make-bell-pair" },
];
