/**
 * Educational classical reservoir (echo-state) toy for time-series readout.
 * Not quantum hardware; illustrates feature maps used in quantum-reservoir narratives.
 * Keep in sync with api/reservoir_toy.py for pytest vectors.
 */

export type ReservoirParams = {
  hiddenSize: number;
  leakRate: number;
  inputScale: number;
  spectralRadius: number;
  trainSteps: number;
  seed: number;
};

export const RESERVOIR_DEFAULTS: ReservoirParams = {
  hiddenSize: 16,
  leakRate: 0.35,
  inputScale: 0.8,
  spectralRadius: 0.9,
  trainSteps: 120,
  seed: 42,
};

/** Ridge penalty λ in readout fit (educational default). */
export const RESERVOIR_RIDGE_LAMBDA = 1e-4;

export type ReservoirRunResult = {
  ok: true;
  trainMse: number;
  testMse: number;
  /** MSE on test targets predicting the training-set mean (same split as testMse). */
  testBaselineMse: number;
  samplePredictions: { target: number; predicted: number }[];
  limitation: string;
};

export type ReservoirRunError = { ok: false; message: string };

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function buildReservoirMatrices(params: ReservoirParams): { wIn: number[]; w: number[][] } {
  const rand = mulberry32(params.seed);
  const wIn = Array.from({ length: params.hiddenSize }, () => (rand() * 2 - 1) * params.inputScale);
  const w: number[][] = Array.from({ length: params.hiddenSize }, () =>
    Array.from({ length: params.hiddenSize }, () => (rand() * 2 - 1) / params.hiddenSize),
  );
  let norm = 0;
  for (let i = 0; i < params.hiddenSize; i += 1) {
    for (let j = 0; j < params.hiddenSize; j += 1) norm += w[i][j] ** 2;
  }
  norm = Math.sqrt(norm) || 1;
  const scale = params.spectralRadius / norm;
  for (let i = 0; i < params.hiddenSize; i += 1) {
    for (let j = 0; j < params.hiddenSize; j += 1) w[i][j] *= scale;
  }
  return { wIn, w };
}

/** Sine wave with phase; next-step prediction task. */
export function syntheticSeries(length: number, seed: number): number[] {
  const rand = mulberry32(seed);
  const phase = rand() * Math.PI * 2;
  return Array.from({ length }, (_, t) => Math.sin((2 * Math.PI * t) / 17 + phase));
}

function reservoirStateStep(
  state: number[],
  x: number,
  wIn: number[],
  w: number[][],
  leak: number,
): number[] {
  const next = state.slice();
  for (let i = 0; i < state.length; i += 1) {
    let pre = wIn[i] * x;
    for (let j = 0; j < state.length; j += 1) pre += w[i][j] * state[j];
    next[i] = (1 - leak) * state[i] + leak * Math.tanh(pre);
  }
  return next;
}

function ridgeFit(features: number[][], targets: number[], lambda: number): number[] {
  const d = features[0]?.length ?? 0;
  const w = new Array(d).fill(0);
  if (d === 0) return w;
  const a = Array.from({ length: d }, () => new Array(d).fill(0));
  const b = new Array(d).fill(0);
  for (let n = 0; n < features.length; n += 1) {
    const f = features[n];
    const y = targets[n];
    for (let i = 0; i < d; i += 1) {
      b[i] += f[i] * y;
      for (let j = 0; j < d; j += 1) a[i][j] += f[i] * f[j];
    }
  }
  for (let i = 0; i < d; i += 1) a[i][i] += lambda;
  for (let i = 0; i < d; i += 1) {
    let pivot = a[i][i];
    if (Math.abs(pivot) < 1e-9) continue;
    for (let j = i; j < d; j += 1) a[i][j] /= pivot;
    b[i] /= pivot;
    for (let r = 0; r < d; r += 1) {
      if (r === i) continue;
      const factor = a[r][i];
      for (let c = i; c < d; c += 1) a[r][c] -= factor * a[i][c];
      b[r] -= factor * b[i];
    }
  }
  for (let i = 0; i < d; i += 1) w[i] = b[i];
  return w;
}

function mse(a: number[], b: number[]): number {
  if (a.length === 0) return 0;
  let s = 0;
  for (let i = 0; i < a.length; i += 1) s += (a[i] - b[i]) ** 2;
  return s / a.length;
}

export function validateReservoirParams(p: Partial<ReservoirParams>): ReservoirRunError | null {
  const hidden = p.hiddenSize ?? RESERVOIR_DEFAULTS.hiddenSize;
  const leak = p.leakRate ?? RESERVOIR_DEFAULTS.leakRate;
  const inScale = p.inputScale ?? RESERVOIR_DEFAULTS.inputScale;
  const spec = p.spectralRadius ?? RESERVOIR_DEFAULTS.spectralRadius;
  if (!Number.isInteger(hidden) || hidden < 4 || hidden > 64) {
    return { ok: false, message: "Hidden size must be an integer from 4 to 64." };
  }
  if (leak <= 0 || leak > 1) return { ok: false, message: "Leak rate must be in (0, 1]." };
  if (inScale <= 0 || inScale > 3) return { ok: false, message: "Input scale must be in (0, 3]." };
  if (spec <= 0 || spec > 1.5) return { ok: false, message: "Spectral radius must be in (0, 1.5]." };
  const trainSteps = p.trainSteps ?? RESERVOIR_DEFAULTS.trainSteps;
  const seed = p.seed ?? RESERVOIR_DEFAULTS.seed;
  if (!Number.isInteger(trainSteps) || trainSteps < 20 || trainSteps > 500) {
    return { ok: false, message: "Training steps must be an integer from 20 to 500." };
  }
  if (!Number.isInteger(seed) || seed < 0) {
    return { ok: false, message: "Seed must be a non-negative integer." };
  }
  return null;
}

export function runReservoirExperiment(params: ReservoirParams): ReservoirRunResult | ReservoirRunError {
  const err = validateReservoirParams(params);
  if (err) return err;
  const series = syntheticSeries(params.trainSteps + 40, params.seed);
  const { wIn, w } = buildReservoirMatrices(params);
  const washout = 20;
  let state = new Array(params.hiddenSize).fill(0);
  const featureRows: number[][] = [];
  const trainTargets: number[] = [];
  const testTargets: number[] = [];
  const testFeatures: number[][] = [];

  for (let t = 0; t < series.length - 1; t += 1) {
    state = reservoirStateStep(state, series[t], wIn, w, params.leakRate);
    if (t < washout) continue;
    const row = state.slice();
    const target = series[t + 1];
    if (t < params.trainSteps + washout) {
      featureRows.push(row);
      trainTargets.push(target);
    } else {
      testFeatures.push(row);
      testTargets.push(target);
    }
  }

  if (featureRows.length === 0 || testFeatures.length === 0) {
    return { ok: false, message: "Not enough data after washout; increase training steps." };
  }

  const weights = ridgeFit(featureRows, trainTargets, RESERVOIR_RIDGE_LAMBDA);
  const predict = (row: number[]) => row.reduce((acc, v, i) => acc + v * weights[i], 0);

  const trainPred = featureRows.map(predict);
  const testPred = testFeatures.map(predict);
  const trainMean = trainTargets.reduce((a, y) => a + y, 0) / trainTargets.length;
  const testBaselineMse = mse(
    testTargets,
    testTargets.map(() => trainMean),
  );

  const samplePredictions = testTargets.slice(0, 5).map((target, i) => ({
    target,
    predicted: testPred[i],
  }));

  return {
    ok: true,
    trainMse: mse(trainTargets, trainPred),
    testMse: mse(testTargets, testPred),
    testBaselineMse,
    samplePredictions,
    limitation:
      "Classical echo-state simulation with fixed random weights — not a quantum device or advantage claim.",
  };
}
