// The daily challenge and Slang Wordle use the UTC calendar date, so everyone worldwide
// gets the same puzzle at the same moment (new puzzle at 00:00 UTC).
export const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);

export function addDays(key: string, n: number) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return todayKey(d);
}

/** Consecutive days ending today (or yesterday, if today isn't done yet). */
export function streakFrom(days: Set<string>, today = todayKey()) {
  let cursor = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(cursor)) { n++; cursor = addDays(cursor, -1); }
  return n;
}

export function bestStreak(days: Set<string>) {
  const sorted = [...days].sort();
  let best = 0, run = 0, prev = '';
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export const msUntilNextUtcDay = () => {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) - now.getTime();
};
