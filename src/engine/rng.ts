export function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small deterministic PRNG (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rand = () => number;

export const pick = <T,>(r: Rand, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];

export function shuffle<T>(r: Rand, arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sample<T>(r: Rand, arr: readonly T[], n: number): T[] {
  return shuffle(r, arr).slice(0, n);
}

export function weighted<T>(r: Rand, items: readonly T[], weight: (t: T) => number): T | undefined {
  const total = items.reduce((s, i) => s + Math.max(0, weight(i)), 0);
  if (total <= 0) return undefined;
  let x = r() * total;
  for (const i of items) {
    x -= Math.max(0, weight(i));
    if (x <= 0) return i;
  }
  return items[items.length - 1];
}
