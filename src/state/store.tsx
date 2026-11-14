import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { INDICATORS } from '../content/indicators';
import { MISSIONS } from '../content/missions';
import { REGION_ORDER } from '../content/regions';
import { createDemoProfile, emptyProfile } from '../domain/demo';
import {
  ALL_INDICATORS,
  type CheckInStep,
  type DayEntry,
  type IndicatorId,
  type MissionId,
  type Profile,
  type RegionId,
} from '../domain/types';

export type View = 'map' | 'checkin' | 'review' | 'log' | 'report' | 'sources' | 'setup';
const VIEWS: View[] = ['map', 'checkin', 'review', 'log', 'report', 'sources', 'setup'];

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
    }
  | { type: 'saveWeekly'; values: Partial<Record<IndicatorId, number>> }
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
      const profile = updateToday(s.profile, (entry) => {
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
        return next;
      });
      return { ...s, profile };
    }

    case 'saveWeekly':
      return { ...s, profile: updateToday(s.profile, (entry) => ({ ...entry, values: { ...entry.values, ...a.values } })) };

    case 'advanceDay': {
      const missionDay = Math.min(s.profile.missionDay + 1, MISSIONS[s.profile.mission].days);
      return { ...s, profile: { ...s.profile, missionDay } };
    }

    case 'resetDemo':
      return initialState();

    case 'setMission': {
      const missionDay = Math.min(s.profile.missionDay, MISSIONS[a.mission].days);
      return { ...s, profile: { ...s.profile, mission: a.mission, missionDay } };
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
    const profile = data.profile;
    return {
      profile: { ...profile, missionDay: Math.min(profile.missionDay, MISSIONS[profile.mission].days) },
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
