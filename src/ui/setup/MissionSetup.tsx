import { HAZARDS } from '../../content/hazards';
import { MISSIONS } from '../../content/missions';
import type { MissionId } from '../../domain/types';
import { useApp } from '../../state/store';
import { SourceLink } from '../SourceLink';
import './setup.css';

const ORDER: MissionId[] = ['station', 'moon', 'mars'];

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
    </div>
  );
}
