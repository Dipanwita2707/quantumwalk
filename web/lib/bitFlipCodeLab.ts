/** Three-qubit bit-flip code toy (simulator — not hardware). */

export type QubitBit = 0 | 1;

export function parity(bits: QubitBit[]): QubitBit {
  return bits.reduce<QubitBit>((acc, b) => (acc ^ b) as QubitBit, 0);
}

export type BitFlipLabState = {
  data: [QubitBit, QubitBit, QubitBit];
  errorQubit: 0 | 1 | 2 | null;
};

/** Inject a single bit-flip error on qubit q from |000⟩. */
export function injectBitFlip(_state: BitFlipLabState, qubit: 0 | 1 | 2): BitFlipLabState {
  const data: [QubitBit, QubitBit, QubitBit] = [0, 0, 0];
  data[qubit] = 1;
  return { data, errorQubit: qubit };
}

export function resetBitFlipLab(): BitFlipLabState {
  return { data: [0, 0, 0], errorQubit: null };
}

/** Neighbor parity checks ( pedagogical toy, not full QEC circuit ). */
export function measureSyndrome(state: BitFlipLabState): { s01: QubitBit; s12: QubitBit } {
  const [d0, d1, d2] = state.data;
  return {
    s01: (d0 ^ d1) as QubitBit,
    s12: (d1 ^ d2) as QubitBit,
  };
}

export function inferErrorFromSyndrome(s01: QubitBit, s12: QubitBit): 0 | 1 | 2 | null {
  if (!isValidSyndromeBit(s01) || !isValidSyndromeBit(s12)) return null;
  if (s01 === 0 && s12 === 0) return null;
  if (s01 === 1 && s12 === 0) return 0;
  if (s01 === 1 && s12 === 1) return 1;
  if (s01 === 0 && s12 === 1) return 2;
  return null;
}

export function isValidSyndromeBit(bit: number): bit is QubitBit {
  return bit === 0 || bit === 1;
}

/** Teaching correction: restore logical |000⟩ when syndrome indicates a single bit-flip. */
export function applyTeachingCorrection(state: BitFlipLabState): BitFlipLabState {
  const { s01, s12 } = measureSyndrome(state);
  if (!isValidSyndromeBit(s01) || !isValidSyndromeBit(s12)) {
    return state;
  }
  const target = inferErrorFromSyndrome(s01, s12);
  if (target === null) return state;
  return resetBitFlipLab();
}
