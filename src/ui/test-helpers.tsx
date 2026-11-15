import { render, type RenderResult } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createDemoProfile } from '../domain/demo';
import { halfDone } from '../domain/test-helpers';
import { entryFor } from '../domain/series';
import type { DayEntry } from '../domain/types';
import { AppProvider, useApp, type AppState } from '../state/store';

/** The demo on its opening screen: map view, nothing selected, organs hidden. */
export const demoState: AppState = { profile: createDemoProfile(), view: 'map', selectedRegion: null, showOrgans: false };

/** The demo with today's check-in half done: three steps saved, nothing reported, two steps to go. */
export const halfDoneState: AppState = { ...demoState, profile: halfDone(demoState.profile) };

export function todayEntry(state: AppState): DayEntry {
  const entry = entryFor(state.profile, state.profile.missionDay);
  if (!entry) throw new Error(`no entry for day ${state.profile.missionDay}`);
  return entry;
}

/**
 * Render inside the app's store. `store.state` is always the latest state, so a test
 * can act through the interface and then look at what was saved.
 */
export function renderApp(ui: ReactNode, initial: Partial<AppState> = {}): RenderResult & { store: { readonly state: AppState } } {
  let latest: AppState = { ...demoState, ...initial };
  function Probe() {
    latest = useApp().state;
    return null;
  }
  const result = render(
    <AppProvider initial={latest}>
      <Probe />
      {ui}
    </AppProvider>,
  );
  return {
    ...result,
    store: {
      get state() {
        return latest;
      },
    },
  };
}
