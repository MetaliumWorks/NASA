import { INDICATORS } from '../content/indicators';
import { criticalLimit } from '../content/thresholds';
import { formatValue } from './format';
import type { IndicatorId, Profile } from './types';

const EPS = 1e-9;

export interface CriticalReading {
  indicator: IndicatorId;
  value: number;
  baseline: number;
  direction: 'above' | 'below';
  /** Short English sentence, as in the findings. */
  reason: string;
}

/**
 * Is this one reading critical: far beyond its warning limit, measured from the personal
 * baseline? Null when it is not, when the indicator has no critical limit, or when there
 * is no baseline to measure from.
 */
export function criticalReading(p: Profile, id: IndicatorId, value: number): CriticalReading | null {
  const limit = criticalLimit(id);
  const baseline = p.baseline[id];
  if (!limit || typeof baseline !== 'number' || !Number.isFinite(baseline) || baseline === 0) return null;

  const diff = value - baseline;
  let critical = false;
  switch (limit.kind) {
    case 'percent':
      critical = Math.abs(diff) / baseline >= limit.amount - EPS;
      break;
    case 'abovePercent':
      critical = diff / baseline >= limit.amount - EPS;
      break;
    case 'above':
      critical = diff >= limit.amount - EPS;
      break;
    case 'below':
      critical = -diff >= limit.amount - EPS;
      break;
    case 'underFraction':
      critical = value / baseline <= limit.amount + EPS;
      break;
  }
  if (!critical) return null;

  const unit = INDICATORS[id].unit;
  const direction = diff > 0 ? 'above' : 'below';
  const relative = limit.kind === 'percent' || limit.kind === 'abovePercent' || limit.kind === 'underFraction';
  const distance = relative ? `${((Math.abs(diff) / baseline) * 100).toFixed(1)}%` : formatValue(Math.abs(diff), unit);
  return {
    indicator: id,
    value,
    baseline,
    direction,
    reason: `Critical reading ${formatValue(value, unit)}, ${distance} ${direction} baseline`,
  };
}
