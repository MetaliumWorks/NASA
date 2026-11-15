import type { DayEntry, IndicatorId, Profile } from './types';

export function entryFor(p: Profile, day: number): DayEntry | undefined {
  return p.entries.find((e) => e.day === day);
}

/** Recorded values of one indicator between two days, both included, oldest first. */
export function valuesFor(p: Profile, id: IndicatorId, fromDay: number, toDay: number): { day: number; value: number }[] {
  const out: { day: number; value: number }[] = [];
  for (const e of p.entries) {
    const value = e.values[id];
    if (e.day >= fromDay && e.day <= toDay && typeof value === 'number' && Number.isFinite(value)) {
      out.push({ day: e.day, value });
    }
  }
  return out.sort((a, b) => a.day - b.day);
}

/**
 * The newest `n` values at or before `day`. Values older than `day - (n + 1)` are
 * left out, so a gap in the record cannot stand in for the present.
 */
export function recent(p: Profile, id: IndicatorId, day: number, n: number): number[] {
  return valuesFor(p, id, day - (n + 1), day)
    .slice(-n)
    .map((v) => v.value);
}

/** The middle value; one extreme reading does not move it. */
export function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function mean(xs: number[]): number | null {
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
