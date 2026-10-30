export type BlochState = { x: number; y: number; z: number };
export type NoiseChannel = "depolarizing" | "damping" | "dephasing";

/** One application of a single-qubit channel; strength is a dimensionless [0,1] parameter. */
export function applyNoise(state: BlochState, channel: NoiseChannel, strength: number): BlochState {
  if (!Number.isFinite(strength) || strength < 0 || strength > 1) throw new RangeError("Noise strength must be between 0 and 1.");
  if (![state.x, state.y, state.z].every(Number.isFinite) || Math.hypot(state.x, state.y, state.z) > 1 + 1e-9) throw new RangeError("Invalid Bloch state.");
  if (channel === "depolarizing") return { x: state.x * (1 - strength), y: state.y * (1 - strength), z: state.z * (1 - strength) };
  const remaining = Math.sqrt(1 - strength);
  return { x: state.x * remaining, y: state.y * remaining, z: channel === "damping" ? (1 - strength) * state.z + strength : state.z };
}
