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

export const LONG_TERM = {
  recurring: { days: 7, count: 3 },
  persistent: { days: 30, count: 10 },
  sustained: { days: 30, count: 15 },
  trendWeeks: 4,
  trendMinPerWeekValues: 4,
} as const;
