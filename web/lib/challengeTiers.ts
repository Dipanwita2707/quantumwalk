export type TierKey = "bronze" | "silver" | "gold";

export const CHALLENGE_TIER_GUIDE: Record<
  string,
  { bronze: string; silver: string; gold: string }
> = {
  "make-superposition": {
    bronze: "Ideal 50% |0⟩ and 50% |1⟩",
    silver: "At most 2 gates",
    gold: "As compact as the reference (1 gate)",
  },
  "make-bell-pair": {
    bronze: "Ideal 50% |00⟩ and 50% |11⟩",
    silver: "At most 3 gates",
    gold: "As compact as the reference (2 gates)",
  },
  "mark-grover-state": {
    bronze: "Ideal |11⟩ probability ≥ 90%",
    silver: "At most 15 gates",
    gold: "At most 14 gates (reference Grover2 length)",
  },
  "tsp-encode-superposition": {
    bronze: "Equal ~12.5% on each 3-qubit label",
    silver: "At most 4 gates",
    gold: "Three H gates only",
  },
};
