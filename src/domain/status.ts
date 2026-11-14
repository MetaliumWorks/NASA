import { INDICATORS } from '../content/indicators';
import { REGIONS } from '../content/regions';
import { SYMPTOMS } from '../content/symptoms';
import { EXERCISE_TARGET_PER_DAY, THRESHOLDS } from '../content/thresholds';
import { criticalReading } from './critical';
import { formatValue, num } from './format';
import { entryFor, mean, recent, valuesFor } from './series';
import type { IndicatorId, Profile, RegionId, Status } from './types';

export type FlagLabel = 'recurring' | 'persistent' | 'sustained' | 'trending';

export interface Finding {
  indicator?: IndicatorId;
  symptom?: string;
  status: Status;
  /** No usable value (or no baseline to compare it with). A due finding never flags. */
  due: boolean;
  /** The number that was compared: an average, a total or the last reading. */
  value: number | null;
  /** Set on long-term findings. */
  label?: FlagLabel;
  /** On a flagged indicator: which side of its baseline (or target) it is on. */
  direction?: 'above' | 'below';
  /** Today's own reading is far beyond its warning limit. */
  critical?: boolean;
  /** Short English sentence shown under Findings and in the ground report. */
  reason: string;
}

export interface Assessment {
  region: RegionId;
  status: Status;
  findings: Finding[];
}

/** Tolerance for limits that sit on a floating-point edge, such as 36.7 + 0.5. */
export const EPS = 1e-9;

const RANK: Record<Status, number> = { nominal: 0, caution: 1, warning: 2 };

export function worst(a: Status, b: Status): Status {
  return RANK[a] >= RANK[b] ? a : b;
}

function pct(fraction: number): string {
  return `${(Math.abs(fraction) * 100).toFixed(1)}%`;
}

/** A value with its unit, worded for the indicator's kind of scale. */
export function withUnit(id: IndicatorId, v: number): string {
  return formatValue(v, INDICATORS[id].unit);
}

/**
 * The last reading that still counts. A daily reading goes stale after two days; a
 * weekly one stays valid for the seven days up to today, then becomes due.
 */
export function lastValue(p: Profile, id: IndicatorId, day: number): number | undefined {
  if (INDICATORS[id].cadence === 'weekly') return valuesFor(p, id, day - 6, day).at(-1)?.value;
  return recent(p, id, day, 1)[0];
}

/** `amount` at or beyond a limit flags; the limit itself counts. */
function atLeast(amount: number, caution: number, warning: number | undefined): Status {
  if (warning !== undefined && amount >= warning - EPS) return 'warning';
  if (amount >= caution - EPS) return 'caution';
  return 'nominal';
}

/** `fraction` strictly under a limit flags; exactly on the limit is still nominal. */
function under(fraction: number, caution: number, warning: number): Status {
  if (fraction < warning - EPS) return 'warning';
  if (fraction < caution - EPS) return 'caution';
  return 'nominal';
}

function side(diff: number, amount: string): string {
  if (Math.abs(diff) < EPS) return 'at baseline';
  return `${amount} ${diff > 0 ? 'above' : 'below'} baseline`;
}

export function indicatorStatus(p: Profile, id: IndicatorId, day: number): Finding {
  // One reading far beyond its limit is a warning on its own day, whatever the average says.
  const today = entryFor(p, day)?.values[id];
  if (typeof today === 'number') {
    const critical = criticalReading(p, id, today);
    if (critical) {
      return { indicator: id, status: 'warning', due: false, value: today, direction: critical.direction, critical: true, reason: critical.reason };
    }
  }
  return ruleFinding(p, id, day);
}

/** The indicator against its own rule: an average, a total or the last reading. */
function ruleFinding(p: Profile, id: IndicatorId, day: number): Finding {
  const rule = THRESHOLDS[id];
  const base = p.baseline[id];
  const hasBase = typeof base === 'number' && Number.isFinite(base) && base !== 0;

  const due = (reason: string, value: number | null = null): Finding => ({
    indicator: id,
    status: 'nominal',
    due: true,
    value,
    reason,
  });
  const found = (status: Status, value: number, reason: string, direction: 'above' | 'below'): Finding => ({
    indicator: id,
    status,
    due: false,
    value,
    ...(status !== 'nominal' ? { direction } : {}),
    reason,
  });
  const noEntry = () => due(INDICATORS[id].cadence === 'weekly' ? 'No entry this week' : 'No recent entry');
  const noBaseline = (value: number) => due('No baseline to compare with', value);

  switch (rule.kind) {
    case 'none': {
      const last = lastValue(p, id, day);
      return {
        indicator: id,
        status: 'nominal',
        due: false,
        value: last ?? null,
        reason: 'Recorded only. The sources give no limit.',
      };
    }

    case 'percentAvg3': {
      const avg = mean(recent(p, id, day, 3));
      if (avg === null) return noEntry();
      if (!hasBase) return noBaseline(avg);
      const dev = (avg - base) / base;
      const status = atLeast(Math.abs(dev), rule.caution, rule.warning);
      return found(status, avg, `3-day average ${withUnit(id, avg)}, ${side(dev, pct(dev))}`, dev > 0 ? 'above' : 'below');
    }

    case 'aboveLast': {
      const last = lastValue(p, id, day);
      if (last === undefined) return noEntry();
      if (!hasBase) return noBaseline(last);
      const diff = last - base;
      const status = atLeast(diff, rule.caution, rule.warning);
      return found(status, last, `Last reading ${withUnit(id, last)}, ${side(diff, withUnit(id, Math.abs(diff)))}`, 'above');
    }

    case 'belowAvg3': {
      const avg = mean(recent(p, id, day, 3));
      if (avg === null) return noEntry();
      if (!hasBase) return noBaseline(avg);
      const diff = avg - base;
      const status = atLeast(-diff, rule.caution, rule.warning);
      return found(status, avg, `3-day average ${withUnit(id, avg)}, ${side(diff, withUnit(id, Math.abs(diff)))}`, 'below');
    }

    case 'scaleAvg3': {
      const avg = mean(recent(p, id, day, 3));
      if (avg === null) return noEntry();
      // A low score flags: the limit is "at or below".
      const status = atLeast(-avg, -rule.caution, -rule.warning);
      return found(status, avg, `3-day average ${withUnit(id, avg)}`, 'below');
    }

    case 'fractionAvg3': {
      const avg = mean(recent(p, id, day, 3));
      if (avg === null) return noEntry();
      if (!hasBase) return noBaseline(avg);
      const fraction = avg / base;
      const status = under(fraction, rule.caution, rule.warning);
      return found(status, avg, `3-day average ${withUnit(id, avg)}, ${Math.round(fraction * 100)}% of baseline`, 'below');
    }

    case 'sumFraction': {
      const values = recent(p, id, day, rule.days);
      if (values.length === 0) return noEntry();
      const total = values.reduce((a, b) => a + b, 0);
      // The target covers the recorded days only, so a day with no entry is not read as zero.
      const target = EXERCISE_TARGET_PER_DAY * values.length;
      const status = under(total / target, rule.caution, rule.warning);
      const span =
        values.length === rule.days
          ? `the last ${rule.days} days`
          : `${values.length} recorded ${values.length === 1 ? 'day' : 'days'}`;
      return found(status, total, `${num(total)} of ${withUnit(id, target)} over ${span}`, 'below');
    }

    case 'belowLast': {
      const last = lastValue(p, id, day);
      if (last === undefined) return noEntry();
      if (!hasBase) return noBaseline(last);
      const diff = last - base;
      const status = atLeast(-diff, rule.caution, rule.warning);
      return found(status, last, `Last result ${withUnit(id, last)}, ${side(diff, num(Math.abs(diff)))}`, 'below');
    }

    case 'aboveLastPercent': {
      const last = lastValue(p, id, day);
      if (last === undefined) return noEntry();
      if (!hasBase) return noBaseline(last);
      const dev = (last - base) / base;
      const status = atLeast(dev, rule.caution, rule.warning);
      return found(status, last, `Last result ${withUnit(id, last)}, ${side(dev, pct(dev))}`, 'above');
    }
  }
}

/** Today's reported symptoms of one region. One is a caution; two or more, or an urgent one, a warning. */
export function symptomFindings(p: Profile, region: RegionId, day: number): Finding[] {
  const today = entryFor(p, day);
  if (!today) return [];
  const here = SYMPTOMS.filter((s) => s.region === region && today.symptoms.includes(s.id));
  return here.map((s) => {
    const status: Status = s.urgent || here.length >= 2 ? 'warning' : 'caution';
    let reason = 'Reported today';
    if (s.urgent) reason = 'Reported today. One report of this symptom is a warning.';
    else if (here.length >= 2) reason = `Reported today, with ${here.length - 1} more in this system`;
    return { symptom: s.id, status, due: false, value: null, reason };
  });
}

/** Today's picture of one region: its own indicators and today's symptoms. */
export function assessDaily(p: Profile, region: RegionId, day: number): Assessment {
  const findings = [
    ...REGIONS[region].indicators.map((id) => indicatorStatus(p, id, day)),
    ...symptomFindings(p, region, day),
  ];
  return { region, status: findings.reduce<Status>((s, f) => worst(s, f.status), 'nominal'), findings };
}

/**
 * Expected loss of bone density by a mission day, in percent. From the source rate of
 * 1% to 1.5% per month; an expectation, not a measurement.
 */
export function expectedBoneLoss(day: number): { min: number; max: number } {
  const months = day / 30;
  return { min: months * 1, max: months * 1.5 };
}
