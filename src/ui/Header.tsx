import { MISSIONS } from '../content/missions';
import { stepsDoneToday, streak } from '../domain/streak';
import { DAILY_STEPS } from '../domain/types';
import { getLang, setLang } from '../i18n/translate';
import { useApp } from '../state/store';
import './app.css';
import { checkInRequired, OPEN_WHILE_LOCKED, shownView } from './gate';
import { SCREENS } from './screens';

/** On every screen: what this is, whose data it is, where the mission stands, and the way around. */
export function Header() {
  const { state, dispatch } = useApp();
  const { profile } = state;
  const length = MISSIONS[profile.mission].days;
  const shown = shownView(state);
  const current = SCREENS.some((s) => s.view === shown) ? shown : SCREENS[0].view;
  const locked = checkInRequired(profile);

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
        <div className="lang-switch" role="group" aria-label="Language" data-no-translate>
          {(['tr', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              className="lang-option"
              aria-pressed={getLang() === l}
              onClick={() => getLang() !== l && setLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
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
            disabled={locked && !OPEN_WHILE_LOCKED.includes(s.view)}
            title={locked && !OPEN_WHILE_LOCKED.includes(s.view) ? 'Opens when today’s check-in is done' : undefined}
            onClick={() => dispatch({ type: 'view', view: s.view })}
          >
            {s.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
