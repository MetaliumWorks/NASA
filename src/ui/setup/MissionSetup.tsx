import { useRef, useState, type FormEvent } from 'react';
import { HAZARDS } from '../../content/hazards';
import { INDICATORS } from '../../content/indicators';
import { MISSIONS } from '../../content/missions';
import { THRESHOLDS } from '../../content/thresholds';
import { validateValue } from '../../domain/input';
import { ALL_INDICATORS, type IndicatorId, type MissionId, type Profile } from '../../domain/types';
import { useApp } from '../../state/store';
import { SourceLink } from '../SourceLink';
import './setup.css';

const ORDER: MissionId[] = ['station', 'moon', 'mars'];

/** Indicators that are compared with a personal baseline. Exercise has a target and radiation has no limit. */
const WITH_BASELINE = ALL_INDICATORS.filter((id) => !['sumFraction', 'none'].includes(THRESHOLDS[id].kind));

/** A real profile: name, mission and the pre-flight value of each indicator. */
function NewProfile() {
  const { state, dispatch } = useApp();
  const current = state.profile;
  const form = useRef<HTMLFormElement>(null);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [mission, setMission] = useState<MissionId>('station');
  const [texts, setTexts] = useState<Partial<Record<IndicatorId, string>>>({});
  const [errors, setErrors] = useState<Partial<Record<IndicatorId, string>>>({});
  // Entries of a real profile exist nowhere else, so replacing it has to be said out loud.
  const mustConfirm = !current.simulated && current.entries.length > 0;
  const [confirmed, setConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const baseline: Profile['baseline'] = {};
    const found: Partial<Record<IndicatorId, string>> = {};
    for (const id of WITH_BASELINE) {
      const text = (texts[id] ?? '').trim();
      if (text === '') continue; // a baseline can be left out; that indicator then shows as due
      const result = validateValue(id, text);
      if ('error' in result) found[id] = result.error;
      else baseline[id] = result.value;
    }
    const missingName = name.trim() === '';
    const unconfirmed = mustConfirm && !confirmed;
    setNameError(missingName ? 'Enter a name' : '');
    setErrors(found);
    setConfirmError(unconfirmed);

    const firstBad = WITH_BASELINE.find((id) => found[id]);
    if (missingName) form.current?.querySelector<HTMLInputElement>('#new-name')?.focus();
    else if (firstBad) form.current?.querySelector<HTMLInputElement>(`#base-${firstBad}`)?.focus();
    if (missingName || firstBad || unconfirmed) return;

    dispatch({ type: 'newProfile', name: name.trim(), mission, baseline });
  };

  return (
    <form ref={form} className="newprofile" aria-label="Start a new profile" onSubmit={submit} noValidate>
      <p className="hint">
        A real profile starts on flight day 1 with nothing recorded and no simulated-data tag. Every status is a comparison with the
        baseline you enter here; an indicator without a baseline shows as due and never flags.
      </p>

      <div className="newprofile-top">
        <div className="field">
          <label htmlFor="new-name">Name</label>
          <input
            id="new-name"
            type="text"
            autoComplete="off"
            value={name}
            aria-invalid={nameError ? true : undefined}
            onChange={(e) => {
              setName(e.target.value);
              setNameError('');
            }}
          />
          {nameError && (
            <p className="field-error" role="alert">
              {nameError}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor="new-mission">Mission</label>
          <select id="new-mission" value={mission} onChange={(e) => setMission(e.target.value as MissionId)}>
            {ORDER.map((id) => (
              <option key={id} value={id}>
                {MISSIONS[id].name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="baselines">
        <legend>Baseline, measured before flight</legend>
        {WITH_BASELINE.map((id) => {
          const def = INDICATORS[id];
          return (
            <div key={id} className="field">
              <label htmlFor={`base-${id}`}>
                {def.label} <span className="unit mono">{def.unit}</span>
              </label>
              <input
                id={`base-${id}`}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={texts[id] ?? ''}
                aria-invalid={errors[id] ? true : undefined}
                onChange={(e) => {
                  setTexts((prev) => ({ ...prev, [id]: e.target.value }));
                  setErrors((prev) => ({ ...prev, [id]: undefined }));
                }}
              />
              {errors[id] && (
                <p className="field-error" role="alert">
                  {errors[id]}
                </p>
              )}
            </div>
          );
        })}
      </fieldset>

      {mustConfirm && (
        <div className="newprofile-confirm">
          <label className="check">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => {
                setConfirmed(e.target.checked);
                setConfirmError(false);
              }}
            />
            <span>
              Replace {current.name} and remove its {current.entries.length} {current.entries.length === 1 ? 'day' : 'days'} of entries
            </span>
          </label>
          {confirmError && (
            <p className="field-error" role="alert">
              Tick the box to replace the profile that is on this device.
            </p>
          )}
        </div>
      )}

      <div className="actions">
        <button type="submit" className="btn">
          Start profile
        </button>
      </div>
    </form>
  );
}

/** The mission: its length, how far away help is, and which hazards weigh most on it. */
export function MissionSetup() {
  const { state, dispatch } = useApp();
  const { profile } = state;

  return (
    <div className="page">
      <div className="page-head">
        <h2>Mission</h2>
        <span className="panel-meta mono">{profile.name}</span>
      </div>
      <p className="hint">
        The mission sets the length of the day counter, the communications line of the ground report and the hazards that are
        emphasised in each system’s panel.
      </p>

      <div className="missions" role="radiogroup" aria-label="Mission">
        {ORDER.map((id) => {
          const m = MISSIONS[id];
          return (
            <label key={id} className="mission" data-current={profile.mission === id ? 'true' : undefined}>
              <input
                type="radio"
                name="mission"
                checked={profile.mission === id}
                onChange={() => dispatch({ type: 'setMission', mission: id })}
              />
              <span className="mission-name">{m.name}</span>
              <dl>
                <div>
                  <dt>Length</dt>
                  <dd>
                    <span>{m.teamSetDuration ? `${m.days} days (team setting)` : `${m.days} days`}</span>
                    {m.basis?.duration && (
                      <>
                        {' '}
                        <SourceLink source={m.basis.duration} />
                      </>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Comms</dt>
                  <dd>
                    {m.commsLine ? (
                      <>
                        <span>{m.commsLine}</span>
                        {m.basis?.comms && (
                          <>
                            {' '}
                            <SourceLink source={m.basis.comms} />
                          </>
                        )}
                      </>
                    ) : (
                      <span className="mission-none">The source pages give no figure, so no line is shown.</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Emphasised hazards</dt>
                  <dd>
                    <span>{m.hazards.map((h) => HAZARDS[h].name).join(', ')}</span>
                  </dd>
                </div>
              </dl>
            </label>
          );
        })}
      </div>
      {profile.missionDay >= MISSIONS[profile.mission].days && (
        <p className="hint">This mission is on its last day, so the day counter cannot advance further.</p>
      )}

      <section className="sec setup-sec" aria-labelledby="setup-new">
        <h3 id="setup-new">New profile</h3>
        <NewProfile key={`${profile.name}-${profile.simulated}`} />
      </section>

      <section className="sec setup-sec" aria-labelledby="setup-demo">
        <h3 id="setup-demo">Demo</h3>
        <div>
          <p>
            {profile.simulated
              ? 'You are looking at the simulated demo profile. Resetting it removes what was entered on top of it.'
              : 'Returns to the simulated demo profile. The profile on this device is replaced.'}
          </p>
          <div className="actions">
            <button type="button" className="btn btn-quiet setup-reset" onClick={() => dispatch({ type: 'resetDemo' })}>
              Reset demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
