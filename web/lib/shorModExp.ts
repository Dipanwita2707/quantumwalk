/**
 * Gate-level modular exponentiation on compact orbit work register (Shor educational).
 * Differs from a full ⌈log₂ N⌉ value register: work index i labels a^i mod N on the discovered orbit.
 * Controlled multiply by a^{2^j} is the orbit permutation i -> (i + 2^j) mod r (unitary on supported subspace).
 */

import { complex, normSquared, type Complex } from "@/lib/qftSimulator";

export const SHOR_WORK_ENCODING = "orbit_compact" as const;

function indexCountWork(count: number, work: number, countingBits: number): number {
  return count + (work << countingBits);
}

export function orbitIndexPermutation(step: number, orbitSize: number): number[] {
  if (orbitSize <= 0) return [0];
  const stepMod = step % orbitSize;
  return Array.from({ length: orbitSize }, (_, i) => (i + stepMod) % orbitSize);
}

export function permutationIsReversible(perm: number[]): boolean {
  const seen = new Array(perm.length).fill(false);
  for (let i = 0; i < perm.length; i += 1) {
    const j = perm[i];
    if (j < 0 || j >= perm.length || seen[j]) return false;
    seen[j] = true;
  }
  return seen.every(Boolean);
}

export function applyHadamardCountingQubit(
  amplitudes: Complex[],
  countingBits: number,
  workDim: number,
  qubit: number,
): Complex[] {
  const tDim = 2 ** countingBits;
  const out = amplitudes.map((z) => complex(0, 0));
  const s = Math.sqrt(2);
  for (let w = 0; w < workDim; w += 1) {
    for (let c = 0; c < tDim; c += 1) {
      if ((c >> qubit) & 1) continue;
      const c1 = c | (1 << qubit);
      const i0 = indexCountWork(c, w, countingBits);
      const i1 = indexCountWork(c1, w, countingBits);
      const z0 = amplitudes[i0];
      const z1 = amplitudes[i1];
      out[i0] = complex((z0.re + z1.re) / s, (z0.im + z1.im) / s);
      out[i1] = complex((z0.re - z1.re) / s, (z0.im - z1.im) / s);
    }
  }
  return out;
}

export function applyControlledOrbitMultiply(
  amplitudes: Complex[],
  countingBits: number,
  workDim: number,
  controlBit: number,
  step: number,
  orbitSize: number,
): Complex[] {
  const perm = orbitIndexPermutation(step, orbitSize);
  const tDim = 2 ** countingBits;
  const out = amplitudes.map(() => complex(0, 0));
  for (let w = 0; w < workDim; w += 1) {
    for (let c = 0; c < tDim; c += 1) {
      const idx = indexCountWork(c, w, countingBits);
      const z = amplitudes[idx];
      if (normSquared(z) < 1e-40) continue;
      let w2 = w;
      if ((c >> controlBit) & 1 && w < orbitSize) w2 = perm[w];
      const j = indexCountWork(c, w2, countingBits);
      out[j] = complex(out[j].re + z.re, out[j].im + z.im);
    }
  }
  return out;
}

export function applyOrbitPermutationWork(
  amplitudes: Complex[],
  countingBits: number,
  workDim: number,
  permOnOrbit: number[],
): Complex[] {
  const orbitSize = permOnOrbit.length;
  const tDim = 2 ** countingBits;
  const out = amplitudes.map(() => complex(0, 0));
  for (let w = 0; w < workDim; w += 1) {
    for (let c = 0; c < tDim; c += 1) {
      const idx = indexCountWork(c, w, countingBits);
      const z = amplitudes[idx];
      if (normSquared(z) < 1e-40) continue;
      const w2 = w < orbitSize ? permOnOrbit[w] : w;
      const j = indexCountWork(c, w2, countingBits);
      out[j] = complex(out[j].re + z.re, out[j].im + z.im);
    }
  }
  return out;
}

export function stateOverlapFidelity(a: Complex[], b: Complex[]): number {
  if (a.length !== b.length) return 0;
  let re = 0;
  let im = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    re += a[i].re * b[i].re + a[i].im * b[i].im;
    im += a[i].re * b[i].im - a[i].im * b[i].re;
    na += normSquared(a[i]);
    nb += normSquared(b[i]);
  }
  if (na < 1e-20 || nb < 1e-20) return 0;
  const innerAbs = Math.sqrt(re * re + im * im);
  return (innerAbs / Math.sqrt(na * nb)) ** 2;
}
