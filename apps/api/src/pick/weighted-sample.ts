export type QuotationScore = {
  fvm: number | null;
  quotationCurrent: number | null;
};

const EMPTY_POOL = "Nessun giocatore da estrarre";
const MIN_WEIGHT = 0.01;

export function nonnegative(n: number | null): number | null {
  return n != null && n >= 0 ? n : null;
}

export function playerScore(p: QuotationScore): number {
  return nonnegative(p.fvm) ?? nonnegative(p.quotationCurrent) ?? 0;
}

export function playerWeight(p: QuotationScore): number {
  return playerScore(p) + 1;
}

export const ENTROPY_BLEND = 0.75;

export function atLeast(n: number, floor: number): number {
  return n > 0 ? n : floor;
}

export function logFlatten(weight: number): number {
  return 1 + Math.log1p(atLeast(weight, 1) - 1);
}

export function mixTowardUniform(
  value: number,
  blend = ENTROPY_BLEND,
): number {
  return value * (1 - blend) + blend;
}

export function entropyWeight(
  base: number,
  blend = ENTROPY_BLEND,
  jitter = 1,
): number {
  const flattened = logFlatten(base);
  const mixed = mixTowardUniform(flattened, blend);
  const scaled = mixed * atLeast(jitter, 1);
  return atLeast(scaled, MIN_WEIGHT);
}

export function sampleWeight(p: QuotationScore, entropy = false): number {
  const base = playerWeight(p);
  return entropy ? entropyWeight(base) : base;
}

export function positiveWeight(weight: number): number {
  return atLeast(weight, 1);
}

export function sumWeights(weights: number[]): number {
  return weights.reduce((total, weight) => total + weight, 0);
}

export function mapWeights<T>(
  items: T[],
  weightOf: (item: T) => number,
): number[] {
  return items.map((item) => positiveWeight(weightOf(item)));
}

export function pickByWeights<T>(
  items: T[],
  weights: number[],
  unitRandom: number,
): T {
  let cursor = unitRandom * sumWeights(weights);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    cursor -= weights[i] ?? 1;
    if (cursor <= 0 && item) return item;
  }
  const last = items.at(-1);
  if (!last) throw new Error(EMPTY_POOL);
  return last;
}

export function weightedSample<T>(
  items: T[],
  weightOf: (item: T) => number,
  rng: () => number = Math.random,
): T {
  if (items.length === 0) throw new Error(EMPTY_POOL);
  return pickByWeights(items, mapWeights(items, weightOf), rng());
}
