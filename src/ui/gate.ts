import { dueToday } from '../domain/due';
import type { Profile } from '../domain/types';
import type { AppState, View } from '../state/store';

/**
 * The daily check-in is mandatory. Until today's five steps are done, only the check-in,
 * the symptom check (something may be wrong right now) and the mission screen are open.
 */
export const OPEN_WHILE_LOCKED: View[] = ['checkin', 'check', 'setup'];

export function checkInRequired(p: Profile): boolean {
  return dueToday(p).dailySteps.length > 0;
}

/** The view actually shown: the one asked for, or the check-in while it is still required. */
export function shownView(state: AppState): View {
  if (checkInRequired(state.profile) && !OPEN_WHILE_LOCKED.includes(state.view)) return 'checkin';
  return state.view;
}
