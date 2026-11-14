import { MISSIONS } from '../content/missions';
import { stepsDoneToday, streak } from '../domain/streak';
import { DAILY_STEPS } from '../domain/types';
import { useApp } from '../state/store';
import './app.css';
import { SCREENS } from './screens';

/** On every screen: what this is, whose data it is, where the mission stands, and the way around. */
export function Header() {
  const { state, dispatch } = useApp();
  const { profile } = state;
  const length = MISSIONS[profile.mission].days;
  const current = SCREENS.some((s) => s.view === state.view) ? state.view : SCREENS[0].view;

  return (
    <header className="header">
      <div className="header-top">
        <h1 className="brand">Crew Health</h1>
        {profile.simulated && <span className="tag tag-simulated">Simulated data</span>}
        <button
          type="button"
          className="btn btn-quiet mission-button"
          aria-label={`Mission: ${MISSIONS[profile.mission].name}`}
          aria-current={current === 'setup' ? 'page' : undefined}
          onClick={() => dispatch({ type: 'view', view: 'setup' })}
        >
          {MISSIONS[profile.mission].name}
        </button>
        <div className="header-status mono">
          <span>
            Flight day {profile.missionDay} of {length}
          </span>
          <span>
            Check-in {stepsDoneToday(profile)} of {DAILY_STEPS.length}
          </span>
          <span>Streak {streak(profile)} d</span>
        </div>
        <button
          type="button"
          className="btn btn-quiet"
          disabled={profile.missionDay >= length}
          onClick={() => dispatch({ type: 'advanceDay' })}
        >
          Advance one day
        </button>
      </div>
      <nav className="header-nav" aria-label="Screens">
        {SCREENS.filter((s) => s.inNav !== false).map((s) => (
          <button
            key={s.view}
            type="button"
            className="tab"
            aria-current={s.view === current ? 'page' : undefined}
            onClick={() => dispatch({ type: 'view', view: s.view })}
          >
            {s.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
