import type { IndicatorId } from '../domain/types';

/**
 * Every limit in this file is the team's own setting. None of them is a NASA value:
 * the source pages give no normal ranges or alert thresholds.
 */
export type ThresholdRule =
  /** 3-day average, either direction, as a fraction of baseline. */
  | { kind: 'percentAvg3'; caution: number; warning: number; trendMin: number }
  /** Last value above baseline, absolute. */
  | { kind: 'aboveLast'; caution: number; warning: number; trendMin: number }
  /** 3-day average below baseline, absolute. */
  | { kind: 'belowAvg3'; caution: number; warning: number; trendMin: number }
  /** 3-day average at or below a point on a 1 to 5 scale. */
  | { kind: 'scaleAvg3'; caution: number; warning: number; trendMin: number }
  /** 3-day average as a fraction of baseline, flagged when under the fraction. */
  | { kind: 'fractionAvg3'; caution: number; warning: number; trendMin: number }
  /** Sum over `days` as a fraction of the target, flagged when under the fraction. */
  | { kind: 'sumFraction'; days: number; caution: number; warning: number }
  /** Last value at or below baseline minus the amount. */
  | { kind: 'belowLast'; caution: number; warning: number }
  /** Last value at or above baseline times (1 + fraction). */
  | { kind: 'aboveLastPercent'; caution: number; warning?: number }
  | { kind: 'none' };

/** Source: ISS crews exercise 1.5 hours per day (risk-fitness). */
export const EXERCISE_TARGET_PER_DAY = 1.5;

export const THRESHOLDS: Record<IndicatorId, ThresholdRule> = {
  heartRate: { kind: 'percentAvg3', caution: 0.15, warning: 0.25, trendMin: 0.075 },
  bpSystolic: { kind: 'percentAvg3', caution: 0.1, warning: 0.2, trendMin: 0.05 },
  bpDiastolic: { kind: 'percentAvg3', caution: 0.1, warning: 0.2, trendMin: 0.05 },
  bloodSugar: { kind: 'percentAvg3', caution: 0.15, warning: 0.3, trendMin: 0.075 },
  bodyTemp: { kind: 'aboveLast', caution: 0.5, warning: 1.0, trendMin: 0.25 },
  sleepHours: { kind: 'belowAvg3', caution: 1, warning: 2, trendMin: 0.5 },
  mood: { kind: 'scaleAvg3', caution: 2.5, warning: 1.5, trendMin: 0.5 },
  appetite: { kind: 'scaleAvg3', caution: 2.5, warning: 1.5, trendMin: 0.5 },
  waterLiters: { kind: 'fractionAvg3', caution: 0.8, warning: 0.6, trendMin: 0.1 },
  exerciseHours: { kind: 'sumFraction', days: 7, caution: 0.8, warning: 0.5 },
  strength: { kind: 'belowLast', caution: 1, warning: 2 },
  visionLevel: { kind: 'belowLast', caution: 1, warning: 2 },
  heightCm: { kind: 'aboveLastPercent', caution: 0.03 },
  reactionMs: { kind: 'aboveLastPercent', caution: 0.15, warning: 0.3 },
  radiationDose: { kind: 'none' },
};

/**
 * A single reading this many times further from baseline than its warning limit is
 * "critical". The check-in asks to measure again or confirm it, and a confirmed one is
 * reported to the ground. Like every limit here, a team setting.
 */
export const CRITICAL_FACTOR = 2;

export type CriticalLimit =
  /** Either direction, as a fraction of baseline. */
  | { kind: 'percent'; amount: number }
  /** Above baseline by a fraction of it. */
  | { kind: 'abovePercent'; amount: number }
  /** Above baseline by an absolute amount. */
  | { kind: 'above'; amount: number }
  /** Below baseline by an absolute amount. */
  | { kind: 'below'; amount: number }
  /** At or under this fraction of baseline. */
  | { kind: 'underFraction'; amount: number };

/** The critical limit of one reading, derived from its warning limit. Null where a single reading cannot be critical. */
export function criticalLimit(id: IndicatorId): CriticalLimit | null {
  const rule = THRESHOLDS[id];
  switch (rule.kind) {
    case 'percentAvg3':
      return { kind: 'percent', amount: rule.warning * CRITICAL_FACTOR };
    case 'aboveLast':
      return { kind: 'above', amount: rule.warning * CRITICAL_FACTOR };
    case 'belowAvg3':
    case 'belowLast':
      return { kind: 'below', amount: rule.warning * CRITICAL_FACTOR };
    case 'aboveLastPercent':
      return rule.warning === undefined ? null : { kind: 'abovePercent', amount: rule.warning * CRITICAL_FACTOR };
    case 'fractionAvg3': {
      // The warning is "under 60% of baseline", 40% away; twice as far is "20% or less".
      const fraction = 1 - (1 - rule.warning) * CRITICAL_FACTOR;
      return fraction > 1e-9 ? { kind: 'underFraction', amount: fraction } : null;
    }
    // A scale has no room beyond its warning, a running total is not one reading, and radiation has no limit.
    case 'scaleAvg3':
    case 'sumFraction':
    case 'none':
      return null;
  }
}

export const LONG_TERM = {
  recurring: { days: 7, count: 3 },
  persistent: { days: 30, count: 10 },
  sustained: { days: 30, count: 15 },
  trendWeeks: 4,
  trendMinPerWeekValues: 4,
} as const;
