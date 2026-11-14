import { INDICATORS } from '../content/indicators';
import { entryFor, valuesFor } from './series';
import { ALL_INDICATORS, DAILY_STEPS, type CheckInStep, type IndicatorId, type Profile } from './types';

/**
 * What the check-in still asks for today: the daily steps not done yet, and the weekly
 * measurements with no value in the last seven days.
 */
export function dueToday(p: Profile): { dailySteps: CheckInStep[]; weekly: IndicatorId[] } {
  const day = p.missionDay;
  const done = entryFor(p, day)?.stepsDone ?? [];
  return {
    dailySteps: DAILY_STEPS.filter((step) => !done.includes(step)),
    weekly: ALL_INDICATORS.filter((id) => INDICATORS[id].cadence === 'weekly' && valuesFor(p, id, day - 6, day).length === 0),
  };
}
