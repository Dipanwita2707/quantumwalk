export type LabMode = "circuit" | "whiteboard";

/** Deep links: which lab mode contains each in-page section. */
export const LAB_SECTION_ROUTES: Record<string, { mode: LabMode }> = {
  "quantum-missions": { mode: "whiteboard" },
  circuit: { mode: "circuit" },
  bloch: { mode: "circuit" },
  probabilities: { mode: "circuit" },
  counts: { mode: "circuit" },
  coach: { mode: "circuit" },
  "quantum-toolbox": { mode: "circuit" },
  "entanglement-lab": { mode: "circuit" },
};

export function normalizeLabHash(hash: string): string {
  return hash.replace(/^#/, "").trim();
}
