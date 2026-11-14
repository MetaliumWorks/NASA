import { REGION_ORDER, REGIONS } from '../content/regions';
import { SYMPTOMS } from '../content/symptoms';
import { assessRegion } from './assess';
import { longTermFindings } from './longterm';
import { mean, valuesFor } from './series';
import type { Finding } from './status';
import type { IndicatorId, Profile, RegionId } from './types';

export type Period = 'week' | 'month';

export const PERIOD_DAYS: Record<Period, number> = { week: 7, month: 30 };

/** Which review a mission day brings: every 30th day a monthly one, every 7th a weekly one. */
export function reviewDue(day: number): Period | null {
  if (day <= 0) return null;
  if (day % PERIOD_DAYS.month === 0) return 'month';
  if (day % PERIOD_DAYS.week === 0) return 'week';
  return null;
}

/** The days a review ending on `endDay` looks at. */
export function periodWindow(period: Period, endDay: number): { from: number; to: number; days: number } {
  const from = Math.max(1, endDay - PERIOD_DAYS[period] + 1);
  return { from, to: endDay, days: endDay - from + 1 };
}

export interface ReviewRow {
  region: RegionId;
  /** Symptom id -> days reported in the period. Symptoms never reported are left out. */
  symptomDays: Record<string, number>;
  /** Days of the period the region spent at each status, each day counted once at its worst. */
  flaggedDays: { caution: number; warning: number };
  indicators: { id: IndicatorId; mean: number | null; previousMean: number | null; baseline: number | undefined }[];
  /** Long-term findings standing at the end of the period. */
  flags: Finding[];
}

/** One row per region, in display order, for the period ending on `endDay`. */
export function periodReview(p: Profile, period: Period, endDay: number): ReviewRow[] {
  const span = PERIOD_DAYS[period];
  const { from, to } = periodWindow(period, endDay);

  return REGION_ORDER.map((region) => {
    const symptomDays: Record<string, number> = {};
    for (const s of SYMPTOMS) {
      if (s.region !== region) continue;
      const days = p.entries.filter((e) => e.day >= from && e.day <= to && e.symptoms.includes(s.id)).length;
      if (days > 0) symptomDays[s.id] = days;
    }

    const flaggedDays = { caution: 0, warning: 0 };
    for (let day = from; day <= to; day++) {
      const status = assessRegion(p, region, day).status;
      if (status !== 'nominal') flaggedDays[status]++;
    }

    const indicators = REGIONS[region].indicators.map((id) => ({
      id,
      mean: mean(valuesFor(p, id, from, to).map((v) => v.value)),
      previousMean: mean(valuesFor(p, id, from - span, from - 1).map((v) => v.value)),
      baseline: p.baseline[id],
    }));

    return { region, symptomDays, flaggedDays, indicators, flags: longTermFindings(p, region, to) };
  });
}
