import { REGIONS } from '../content/regions';
import { SYMPTOMS } from '../content/symptoms';
import { LONG_TERM, THRESHOLDS } from '../content/thresholds';
import { mean, valuesFor } from './series';
import { EPS, indicatorStatus, withUnit, type Finding } from './status';
import type { IndicatorId, Profile, RegionId } from './types';

/** On how many days of the window ending at `day` the symptom was reported. */
export function symptomDays(p: Profile, symptom: string, day: number, span: number): number {
  const from = day - span + 1;
  return p.entries.filter((e) => e.day >= from && e.day <= day && e.symptoms.includes(symptom)).length;
}

function symptomChecks(p: Profile, region: RegionId, day: number): Finding[] {
  const out: Finding[] = [];
  for (const s of SYMPTOMS) {
    if (s.region !== region) continue;
    const month = symptomDays(p, s.id, day, LONG_TERM.persistent.days);
    const week = symptomDays(p, s.id, day, LONG_TERM.recurring.days);
    // A symptom that meets both is reported once, at the heavier level.
    if (month >= LONG_TERM.persistent.count) {
      out.push({
        symptom: s.id,
        status: 'warning',
        due: false,
        value: month,
        label: 'persistent',
        reason: `Reported on ${month} of the last ${LONG_TERM.persistent.days} days`,
      });
    } else if (week >= LONG_TERM.recurring.count) {
      out.push({
        symptom: s.id,
        status: 'caution',
        due: false,
        value: week,
        label: 'recurring',
        reason: `Reported on ${week} of the last ${LONG_TERM.recurring.days} days`,
      });
    }
  }
  return out;
}

function sustained(p: Profile, id: IndicatorId, day: number): Finding | null {
  const { days, count } = LONG_TERM.sustained;
  let flagged = 0;
  for (let d = Math.max(1, day - days + 1); d <= day; d++) {
    if (indicatorStatus(p, id, d).status !== 'nominal') flagged++;
  }
  if (flagged < count) return null;
  return {
    indicator: id,
    status: 'warning',
    due: false,
    value: flagged,
    label: 'sustained',
    reason: `Outside its limit on ${flagged} of the last ${days} days`,
  };
}

/**
 * Slow drift: the weekly average has moved further from baseline three weeks running,
 * and by at least half the caution limit in total. It fires inside the daily limit; its
 * job is the slide that no single day shows.
 */
function trending(p: Profile, id: IndicatorId, day: number): Finding | null {
  const rule = THRESHOLDS[id];
  if (!('trendMin' in rule)) return null;
  const base = p.baseline[id];
  const hasBase = typeof base === 'number' && Number.isFinite(base) && base !== 0;
  if (rule.kind !== 'scaleAvg3' && !hasBase) return null;

  // Weekly means, newest first: week k covers [day - 7k - 6, day - 7k].
  const means: number[] = [];
  for (let k = 0; k < LONG_TERM.trendWeeks; k++) {
    const values = valuesFor(p, id, day - 7 * k - 6, day - 7 * k).map((v) => v.value);
    if (values.length < LONG_TERM.trendMinPerWeekValues) return null;
    means.push(mean(values) as number);
  }

  // Distance from baseline in the direction that is bad for this indicator.
  const b = hasBase ? (base as number) : 0;
  const away = (m: number): number => {
    switch (rule.kind) {
      case 'percentAvg3':
        return Math.abs(m - b) / b;
      case 'fractionAvg3':
        return (b - m) / b;
      case 'aboveLast':
        return m - b;
      case 'belowAvg3':
      case 'scaleAvg3':
        return b - m;
    }
  };
  const d = means.map(away);
  for (let k = 0; k < d.length - 1; k++) {
    if (!(d[k] > d[k + 1] + EPS)) return null; // each week further away than the one before
  }
  const newest = d[0];
  const oldest = d[d.length - 1];
  if (newest - oldest < rule.trendMin - EPS) return null;
  if (hasBase && newest <= EPS) return null; // only closing in on baseline from the good side

  const then = means[means.length - 1];
  return {
    indicator: id,
    status: 'caution',
    due: false,
    value: means[0],
    label: 'trending',
    reason: `Weekly average has moved from ${withUnit(id, then)} to ${withUnit(id, means[0])} over four weeks`,
  };
}

/** Weekly and monthly checks of one region. Empty when nothing long-running is found. */
export function longTermFindings(p: Profile, region: RegionId, day: number): Finding[] {
  const out = symptomChecks(p, region, day);
  for (const id of REGIONS[region].indicators) {
    const s = sustained(p, id, day);
    if (s) out.push(s);
    const t = trending(p, id, day);
    if (t) out.push(t);
  }
  return out;
}
