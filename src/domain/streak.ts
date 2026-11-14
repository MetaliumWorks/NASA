import { entryFor } from './series';
import { DAILY_STEPS, type Profile } from './types';

function complete(p: Profile, day: number): boolean {
  const e = entryFor(p, day);
  return !!e && DAILY_STEPS.every((step) => e.stepsDone.includes(step));
}

/**
 * Consecutive days with a finished daily check-in. Today counts once it is finished;
 * until then the streak is counted back from yesterday.
 */
export function streak(p: Profile): number {
  let day = complete(p, p.missionDay) ? p.missionDay : p.missionDay - 1;
  let n = 0;
  while (day >= 1 && complete(p, day)) {
    n++;
    day--;
  }
  return n;
}

/** How many of the five daily steps are done today. */
export function stepsDoneToday(p: Profile): number {
  const e = entryFor(p, p.missionDay);
  if (!e) return 0;
  return DAILY_STEPS.filter((step) => e.stepsDone.includes(step)).length;
}
