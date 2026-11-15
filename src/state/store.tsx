import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { INDICATORS } from '../content/indicators';
import { MISSIONS } from '../content/missions';
import { REGION_ORDER } from '../content/regions';
import { createDemoProfile, emptyProfile } from '../domain/demo';
import { composeMissed, dayComplete, outbox, withAlerts } from '../domain/ground';
import {
  ALL_INDICATORS,
  type CheckInStep,
  type DayEntry,
  type GroundMessage,
  type IndicatorId,
  type MissionId,
  type Profile,
  type RegionId,
  type SpotCheck,
} from '../domain/types';

export type View = 'map' | 'checkin' | 'check' | 'review' | 'log' | 'report' | 'sources' | 'setup';
const VIEWS: View[] = ['map', 'checkin', 'check', 'review', 'log', 'report', 'sources', 'setup'];

export interface AppState {
  profile: Profile;
  view: View;
  selectedRegion: RegionId | null;
  showOrgans: boolean;
}

export type Action =
  | { type: 'view'; view: View }
  | { type: 'select'; region: RegionId | null }
  | { type: 'toggleOrgans' }
  | {
      type: 'saveStep';
      step: CheckInStep;
      values: Partial<Record<IndicatorId, number>>;
      symptoms?: string[];
      otherDiscomfort?: string;
      journal?: string;
      /** Readings of this step that are far from baseline and were confirmed as measured. */
      critical?: IndicatorId[];
    }
  | { type: 'saveWeekly'; values: Partial<Record<IndicatorId, number>> }
  | {
      /** A symptom check outside the daily check-in. */
      type: 'saveCheck';
      symptoms: string[];
      values: Partial<Record<IndicatorId, number>>;
      note?: string;
      critical?: IndicatorId[];
    }
  | { type: 'advanceDay' }
  | { type: 'resetDemo' }
  | { type: 'setMission'; mission: MissionId }
  | { type: 'planAdd'; ids: string[] }
  | { type: 'planToggle'; id: string }
  | { type: 'newProfile'; name: string; mission: MissionId; baseline: Profile['baseline'] };

export const STORAGE_KEY = 'crew-health/v1';

export function initialState(): AppState {
  return { profile: createDemoProfile(), view: 'map', selectedRegion: null, showOrgans: false };
}

/** Replace today's entry (creating it when there is none) and keep the entries in day order. */
function updateToday(p: Profile, change: (entry: DayEntry) => DayEntry): Profile {
  const day = p.missionDay;
  const existing = p.entries.find((e) => e.day === day);
  const next = change(existing ?? { day, values: {}, symptoms: [], stepsDone: [] });
  const entries = [...p.entries.filter((e) => e.day !== day), next].sort((a, b) => a.day - b.day);
  return { ...p, entries };
}

/** The furthest day the profile has reached, whatever the current mission shows. */
function reached(p: Profile): number {
  return Math.max(p.reachedDay ?? 0, p.missionDay);
}

function optionalText(current: string | undefined, incoming: string | undefined): string | undefined {
  if (incoming === undefined) return current;
  const trimmed = incoming.trim();
  return trimmed === '' ? undefined : trimmed;
}

export function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'view':
      return { ...s, view: a.view };

    case 'select':
      return { ...s, selectedRegion: a.region };

    case 'toggleOrgans':
      return { ...s, showOrgans: !s.showOrgans };

    case 'saveStep': {
      const wasComplete = dayComplete(s.profile, s.profile.missionDay);
      const saved = updateToday(s.profile, (entry) => {
        // The step owns its indicators: a field left empty this time is removed.
        const values: DayEntry['values'] = {};
        for (const id of ALL_INDICATORS) {
          const v = entry.values[id];
          if (v !== undefined && INDICATORS[id].step !== a.step) values[id] = v;
        }
        Object.assign(values, a.values);
        const next: DayEntry = {
          day: entry.day,
          values,
          symptoms: a.symptoms ? [...new Set(a.symptoms)] : entry.symptoms,
          stepsDone: entry.stepsDone.includes(a.step) ? entry.stepsDone : [...entry.stepsDone, a.step],
        };
        const other = optionalText(entry.otherDiscomfort, a.otherDiscomfort);
        if (other !== undefined) next.otherDiscomfort = other;
        const journal = optionalText(entry.journal, a.journal);
        if (journal !== undefined) next.journal = journal;
        // The step owns the confirmations of its own readings, too.
        const critical = [...(entry.critical ?? []).filter((id) => INDICATORS[id].step !== a.step), ...(a.critical ?? [])];
        if (critical.length > 0) next.critical = critical;
        return next;
      });
      const completed = !wasComplete && dayComplete(saved, saved.missionDay);
      return { ...s, profile: withAlerts(saved, { origin: 'checkin', critical: a.critical, completed }) };
    }

    case 'saveWeekly': {
      const saved = updateToday(s.profile, (entry) => ({ ...entry, values: { ...entry.values, ...a.values } }));
      return { ...s, profile: withAlerts(saved, { origin: 'weekly' }) };
    }

    case 'saveCheck': {
      const note = a.note?.trim() || undefined;
      const saved = updateToday(s.profile, (entry) => {
        // The day keeps everything reported on it; a new reading replaces the earlier one.
        const next: DayEntry = {
          ...entry,
          values: { ...entry.values, ...a.values },
          symptoms: [...new Set([...entry.symptoms, ...a.symptoms])],
        };
        if (note && !(entry.otherDiscomfort ?? '').includes(note)) {
          next.otherDiscomfort = entry.otherDiscomfort ? `${entry.otherDiscomfort}; ${note}` : note;
        }
        const critical = [...new Set([...(entry.critical ?? []), ...(a.critical ?? [])])];
        if (critical.length > 0) next.critical = critical;
        return next;
      });
      const check: SpotCheck = { day: saved.missionDay, symptoms: [...new Set(a.symptoms)], values: { ...a.values }, ...(note ? { note } : {}) };
      const recorded = { ...saved, checks: [...(saved.checks ?? []), check] };
      return { ...s, profile: withAlerts(recorded, { origin: 'check', critical: a.critical }) };
    }

    case 'advanceDay': {
      const leaving = s.profile.missionDay;
      const missionDay = Math.min(leaving + 1, MISSIONS[s.profile.mission].days);
      let profile: Profile = { ...s.profile, missionDay, reachedDay: Math.max(reached(s.profile), missionDay) };
      // The daily check-in is mandatory: a day that ends without it is reported to the ground.
      if (missionDay !== leaving && !dayComplete(s.profile, leaving)) {
        const messages = outbox(s.profile);
        profile = { ...profile, outbox: [...messages, composeMissed(s.profile, leaving, `g${messages.length + 1}`)] };
      }
      return { ...s, profile };
    }

    case 'resetDemo':
      return initialState();

    case 'setMission': {
      // A shorter mission pulls the day back inside it; the day reached is kept, so going
      // back to a longer mission does not lose it.
      const reachedDay = reached(s.profile);
      const missionDay = Math.min(reachedDay, MISSIONS[a.mission].days);
      return { ...s, profile: { ...s.profile, mission: a.mission, missionDay, reachedDay } };
    }

    case 'planAdd': {
      const day = s.profile.missionDay;
      const have = new Set(s.profile.plan.filter((i) => i.day === day).map((i) => i.recommendationId));
      const added = [];
      for (const id of a.ids) {
        if (have.has(id)) continue;
        have.add(id);
        added.push({ day, recommendationId: id, done: false });
      }
      return { ...s, profile: { ...s.profile, plan: [...s.profile.plan, ...added] } };
    }

    case 'planToggle': {
      const day = s.profile.missionDay;
      const plan = s.profile.plan.map((i) => (i.day === day && i.recommendationId === a.id ? { ...i, done: !i.done } : i));
      return { ...s, profile: { ...s.profile, plan } };
    }

    case 'newProfile':
      return { profile: emptyProfile(a.name, a.mission, a.baseline), view: 'map', selectedRegion: null, showOrgans: s.showOrgans };
  }
}

// ---------------------------------------------------------------- persistence

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isDay = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x) && x >= 1;

function isEntry(x: unknown): x is DayEntry {
  return (
    isObject(x) &&
    isDay(x.day) &&
    isObject(x.values) &&
    Object.values(x.values).every((v) => typeof v === 'number' && Number.isFinite(v)) &&
    Array.isArray(x.symptoms) &&
    x.symptoms.every((s) => typeof s === 'string') &&
    Array.isArray(x.stepsDone)
  );
}

const KINDS = ['critical', 'urgent', 'review', 'missed'];

function isMessage(x: unknown): x is GroundMessage {
  return (
    isObject(x) &&
    typeof x.id === 'string' &&
    isDay(x.day) &&
    KINDS.includes(x.kind as string) &&
    typeof x.origin === 'string' &&
    typeof x.subject === 'string' &&
    typeof x.body === 'string' &&
    Array.isArray(x.regions)
  );
}

function isCheck(x: unknown): x is SpotCheck {
  return isObject(x) && isDay(x.day) && Array.isArray(x.symptoms) && isObject(x.values);
}

function isProfile(x: unknown): x is Profile {
  return (
    isObject(x) &&
    typeof x.name === 'string' &&
    typeof x.simulated === 'boolean' &&
    typeof x.mission === 'string' &&
    x.mission in MISSIONS &&
    isDay(x.missionDay) &&
    isObject(x.baseline) &&
    Array.isArray(x.entries) &&
    x.entries.every(isEntry) &&
    Array.isArray(x.plan) &&
    x.plan.every((i) => isObject(i) && isDay(i.day) && typeof i.recommendationId === 'string' && typeof i.done === 'boolean')
  );
}

/**
 * Read the saved state. Anything missing, unreadable or of another shape gives the demo
 * back, so a stale or damaged value can never leave the app on a blank screen.
 */
export function loadState(storage: Pick<Storage, 'getItem'>): AppState {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const data: unknown = JSON.parse(raw);
    if (!isObject(data) || !isProfile(data.profile)) return initialState();
    const { reachedDay, outbox: savedOutbox, checks: savedChecks, ...profile } = data.profile as Profile & Record<string, unknown>;
    const messages = Array.isArray(savedOutbox) ? savedOutbox.filter(isMessage) : [];
    const checks = Array.isArray(savedChecks) ? savedChecks.filter(isCheck) : [];
    return {
      profile: {
        ...profile,
        missionDay: Math.min(profile.missionDay, MISSIONS[profile.mission].days),
        // Kept only when it is a real day; anything else is dropped rather than trusted.
        ...(isDay(reachedDay) ? { reachedDay } : {}),
        // The same for the ground log and the symptom checks: what is not of the right shape is left out.
        ...(messages.length > 0 ? { outbox: messages } : {}),
        ...(checks.length > 0 ? { checks } : {}),
      },
      view: VIEWS.includes(data.view as View) ? (data.view as View) : 'map',
      selectedRegion: REGION_ORDER.includes(data.selectedRegion as RegionId) ? (data.selectedRegion as RegionId) : null,
      showOrgans: data.showOrgans === true,
    };
  } catch {
    return initialState();
  }
}

export function saveState(storage: Pick<Storage, 'setItem'>, s: AppState): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Storage full or blocked: the app keeps working for this session.
  }
}

// ---------------------------------------------------------------- React binding

const AppContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(null);

export function AppProvider(props: { children: ReactNode; initial?: AppState }) {
  const [state, dispatch] = useReducer(reducer, props.initial, (given) => given ?? loadState(window.localStorage));
  useEffect(() => {
    saveState(window.localStorage, state);
  }, [state]);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
}

export function useApp(): { state: AppState; dispatch: Dispatch<Action> } {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
