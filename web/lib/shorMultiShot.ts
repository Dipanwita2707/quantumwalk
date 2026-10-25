/**
 * Multi-shot Born sampling for Shor educational lab (ideal simulator, seeded PRNG).
 */

import { QFT_NUMERIC_TOLERANCE } from "@/lib/qftSimulator";

type ShorMultiShotError = { ok: false; message: string };

export const SHOR_MIN_SHOTS = 1;
export const SHOR_MAX_SHOTS = 5000;
export const SHOR_DEFAULT_SHOTS = 256;

export type ShorShotHistogramEntry = {
  outcome: number;
  observedCount: number;
  observedFrequency: number;
  theoreticalProbability: number;
  frequencyDelta: number;
};

export type ShorMultiShotHistogram = {
  shots: number;
  seed: number;
  sequence: number[];
  histogram: ShorShotHistogramEntry[];
  maxAbsFrequencyDelta: number;
  l1EmpiricalVsTheory: number;
};

/** Deterministic PRNG for reproducible Born sampling (not hardware noise). */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function validateShorSampleSeed(seed: unknown): ShorMultiShotError | null {
  if (!Number.isInteger(seed)) {
    return { ok: false, message: "Sample seed must be an integer (uint32)." };
  }
  const s = seed as number;
  if (s < 0 || s > 0xffff_ffff) {
    return { ok: false, message: "Sample seed must be between 0 and 2^32 − 1." };
  }
  return null;
}

export function validateShorShotCount(shots: unknown): ShorMultiShotError | null {
  if (!Number.isInteger(shots)) {
    return { ok: false, message: `Shot count must be an integer ${SHOR_MIN_SHOTS}–${SHOR_MAX_SHOTS}.` };
  }
  const n = shots as number;
  if (n < SHOR_MIN_SHOTS || n > SHOR_MAX_SHOTS) {
    return {
      ok: false,
      message: `Shot count must be between ${SHOR_MIN_SHOTS} and ${SHOR_MAX_SHOTS} (got ${n}).`,
    };
  }
  return null;
}

export function validateCountingProbabilities(probabilities: number[]): ShorMultiShotError | null {
  if (!Array.isArray(probabilities) || probabilities.length === 0) {
    return { ok: false, message: "Probability distribution is empty." };
  }
  let sum = 0;
  for (let i = 0; i < probabilities.length; i += 1) {
    const p = probabilities[i];
    if (!Number.isFinite(p) || p < 0) {
      return { ok: false, message: `Invalid probability at outcome c=${i}.` };
    }
    sum += p;
  }
  if (Math.abs(sum - 1) > QFT_NUMERIC_TOLERANCE) {
    return { ok: false, message: `Probabilities must sum to 1 (got ${sum}).` };
  }
  if (!probabilities.some((p) => p > QFT_NUMERIC_TOLERANCE)) {
    return { ok: false, message: "Probability distribution has no support." };
  }
  return null;
}

export function sampleCountingWithRng(probabilities: number[], nextRandom: () => number): number {
  const rnd = nextRandom();
  let cum = 0;
  let lastSupport = 0;
  for (let c = 0; c < probabilities.length; c += 1) {
    const p = probabilities[c];
    if (p <= 0) continue;
    lastSupport = c;
    cum += p;
    if (rnd < cum - 1e-15) return c;
  }
  return lastSupport;
}

export function sampleShorShotSequence(
  probabilities: number[],
  seed: number,
  shots: number,
): number[] | ShorMultiShotError {
  const probErr = validateCountingProbabilities(probabilities);
  if (probErr) return probErr;
  const seedErr = validateShorSampleSeed(seed);
  if (seedErr) return seedErr;
  const shotErr = validateShorShotCount(shots);
  if (shotErr) return shotErr;
  const rng = mulberry32(seed);
  const sequence: number[] = [];
  for (let i = 0; i < shots; i += 1) {
    const c = sampleCountingWithRng(probabilities, rng);
    if (probabilities[c] <= 0) {
      return { ok: false, message: `Sampled zero-probability outcome c=${c}.` };
    }
    sequence.push(c);
  }
  return sequence;
}

export function buildShotHistogram(
  probabilities: number[],
  sequence: number[],
  shots: number,
): ShorMultiShotHistogram["histogram"] {
  const counts = new Map<number, number>();
  for (const c of sequence) {
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const histogram: ShorShotHistogramEntry[] = [];
  let l1 = 0;
  let maxAbs = 0;
  for (let c = 0; c < probabilities.length; c += 1) {
    const theoretical = probabilities[c];
    const observedCount = counts.get(c) ?? 0;
    if (theoretical <= 0 && observedCount === 0) continue;
    const observedFrequency = observedCount / shots;
    const delta = observedFrequency - theoretical;
    l1 += Math.abs(delta);
    maxAbs = Math.max(maxAbs, Math.abs(delta));
    histogram.push({
      outcome: c,
      observedCount,
      observedFrequency,
      theoreticalProbability: theoretical,
      frequencyDelta: delta,
    });
  }
  histogram.sort((x, y) => y.observedCount - x.observedCount || x.outcome - y.outcome);
  void l1;
  void maxAbs;
  return histogram;
}

export function summarizeHistogramMetrics(
  probabilities: number[],
  sequence: number[],
  shots: number,
): { maxAbsFrequencyDelta: number; l1EmpiricalVsTheory: number } {
  const histogram = buildShotHistogram(probabilities, sequence, shots);
  let l1 = 0;
  let maxAbs = 0;
  for (const row of histogram) {
    l1 += Math.abs(row.frequencyDelta);
    maxAbs = Math.max(maxAbs, Math.abs(row.frequencyDelta));
  }
  return { maxAbsFrequencyDelta: maxAbs, l1EmpiricalVsTheory: l1 };
}
