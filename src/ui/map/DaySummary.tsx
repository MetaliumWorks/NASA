import { REGIONS } from '../../content/regions';
import { flagged } from '../../domain/assess';
import type { Assessment } from '../../domain/status';
import { stepsDoneToday } from '../../domain/streak';
import { DAILY_STEPS, type RegionId } from '../../domain/types';
import { useApp } from '../../state/store';
import { StatusGlyph } from '../StatusGlyph';

/** The right-hand panel when no region is selected: what needs attention today. */
export function DaySummary(p: { all: Record<RegionId, Assessment> }) {
  const { state, dispatch } = useApp();
  const { profile } = state;
  const attention = flagged(p.all);
  const steps = stepsDoneToday(profile);

  let lead = `All ${Object.keys(p.all).length} systems nominal`;
  if (attention.length === 1) lead = '1 system needs attention';
  if (attention.length > 1) lead = `${attention.length} systems need attention`;

  return (
    <section className="panel" aria-labelledby="summary-title">
      <div className="panel-head">
        <h2 id="summary-title">Today</h2>
        <span className="panel-meta mono">Flight day {profile.missionDay}</span>
      </div>

      <div className="sec">
        <h3>Systems</h3>
        <div>
          <p className="lead">{lead}</p>
          {attention.length === 0 ? (
            <p className="hint">Nothing is flagged. Select a system below to see its findings and what space does to it.</p>
          ) : (
            <ul className="flag-list">
              {attention.map((a) => {
                // The heaviest finding explains the flag.
                const why = a.findings.find((f) => f.status === a.status);
                return (
                  <li key={a.region}>
                    <button type="button" className="flag-item" onClick={() => dispatch({ type: 'select', region: a.region })}>
                      <span className="flag-name">{REGIONS[a.region].name}</span> <StatusGlyph status={a.status} label />{' '}
                      {why && <span className="flag-why">{why.reason}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="sec">
        <h3>Check-in</h3>
        <div>
          <p>
            {steps} of {DAILY_STEPS.length} steps done today.
          </p>
          <div className="actions">
            <button type="button" className="btn" onClick={() => dispatch({ type: 'view', view: 'checkin' })}>
              {steps === 0 ? 'Start check-in' : steps < DAILY_STEPS.length ? 'Continue check-in' : 'Review today’s entries'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
