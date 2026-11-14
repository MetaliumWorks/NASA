import { useState } from 'react';
import { HAZARDS } from '../../content/hazards';
import { INDICATORS } from '../../content/indicators';
import { REGIONS } from '../../content/regions';
import { SYMPTOMS } from '../../content/symptoms';
import { EXERCISE_TARGET_PER_DAY, THRESHOLDS } from '../../content/thresholds';
import { formatDelta, formatValue, num } from '../../domain/format';
import { valuesFor } from '../../domain/series';
import { expectedBoneLoss, indicatorStatus, type Assessment, type Finding } from '../../domain/status';
import type { IndicatorId, Profile, RegionId } from '../../domain/types';
import { useApp } from '../../state/store';
import { Checkbox } from '../Checkbox';
import { SymptomStrip } from '../charts/SymptomStrip';
import { TrendChart } from '../charts/TrendChart';
import { WeekBars } from '../charts/WeekBars';
import { SourceLink } from '../SourceLink';
import { StatusGlyph } from '../StatusGlyph';

const STRIP_DAYS = 30;

/** One indicator under Findings: latest value, how it compares, and its history. */
function IndicatorFinding(p: { profile: Profile; id: IndicatorId; finding: Finding; informational?: RegionId }) {
  const { profile, id, finding } = p;
  const def = INDICATORS[id];
  const day = profile.missionDay;
  const points = valuesFor(profile, id, 1, day);
  const latest = points.at(-1);
  const baseline = profile.baseline[id];
  const rule = THRESHOLDS[id];

  // What the head of the row shows: the latest reading, or for a running total its share of the target.
  let headline = latest ? formatValue(latest.value, def.unit) : '—';
  let chart;
  if (rule.kind === 'sumFraction') {
    // The same days the status looked at: the newest recorded ones inside its window.
    const used = valuesFor(profile, id, day - (rule.days + 1), day).slice(-rule.days);
    const values = [...Array(rule.days - used.length).fill(null), ...used.map((v) => v.value)];
    if (used.length > 0) {
      const total = used.reduce((sum, v) => sum + v.value, 0);
      headline = `${Math.round((total / (EXERCISE_TARGET_PER_DAY * used.length)) * 100)}% of target`;
    }
    chart = (
      <div className="bars-row">
        <WeekBars label={def.label} unit={def.unit} target={EXERCISE_TARGET_PER_DAY} values={values} />
        {used.length > 0 && (
          <span className="caption">
            Hours per day, day {used[0].day} to {used[used.length - 1].day}. The dashed line is the {num(EXERCISE_TARGET_PER_DAY)} h
            target.
          </span>
        )}
      </div>
    );
  } else {
    chart = <TrendChart label={def.label} unit={def.unit} points={points} baseline={baseline} missionDay={day} />;
  }

  return (
    <div className="finding" data-status={finding.status}>
      <div className="finding-head">
        <span className="finding-name">
          {def.label}
          {finding.due && <> <span className="tag">due</span></>}
        </span>
        <span className="finding-value mono">
          {headline}
          {latest && typeof baseline === 'number' && rule.kind !== 'sumFraction' && (
            <span className="finding-delta"> {formatDelta(latest.value - baseline, def.unit)} vs baseline</span>
          )}
        </span>
      </div>
      <p className="finding-note">
        {!p.informational && finding.status !== 'nominal' && <><StatusGlyph status={finding.status} /> </>}
        <span>{finding.reason}</span>
      </p>
      {p.informational && <p className="finding-note">Decides the status of {REGIONS[p.informational].name}; shown here for information.</p>}
      {chart}
    </div>
  );
}

/** The selected region as a short report: Findings, Impression, Recommendation. */
export function RegionPanel(p: { region: RegionId; assessment: Assessment }) {
  const { state, dispatch } = useApp();
  const { profile } = state;
  const day = profile.missionDay;
  const def = REGIONS[p.region];
  const { status, findings } = p.assessment;
  const isFlagged = status !== 'nominal';
  const isRadiation = p.region === 'radiation';

  const byIndicator = (id: IndicatorId) => findings.find((f) => f.indicator === id && !f.label) ?? indicatorStatus(profile, id, day);
  // Today's symptoms and anything long-running: these explain a flag that no single number shows.
  const flags = findings.filter((f) => f.symptom || f.label);
  const hasLongTerm = findings.some((f) => f.label);

  const symptoms = SYMPTOMS.filter((s) => s.region === p.region);
  const reported = symptoms
    .map((s) => ({
      symptom: s,
      days: profile.entries.filter((e) => e.day <= day && e.day > day - STRIP_DAYS && e.symptoms.includes(s.id)).map((e) => e.day),
    }))
    .filter((r) => r.days.length > 0);

  const inPlan = new Set(profile.plan.filter((i) => i.day === day).map((i) => i.recommendationId));
  const recommendations = def.recommendations.filter((r) => r.kind !== 'groundReport' || isFlagged);
  const [ticked, setTicked] = useState<Set<string>>(() => new Set(isFlagged && hasLongTerm ? [`groundReport-${p.region}`] : []));
  const toAdd = recommendations.filter((r) => ticked.has(r.id) && !inPlan.has(r.id)).map((r) => r.id);
  const tick = (id: string, on: boolean) =>
    setTicked((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const totalDose = valuesFor(profile, 'radiationDose', 1, day).reduce((sum, v) => sum + v.value, 0);
  const boneLoss = expectedBoneLoss(day);

  return (
    <section className="panel" aria-labelledby="region-title">
      <div className="panel-head">
        <h2 id="region-title">{def.name}</h2>
        {isRadiation ? (
          <p className="panel-total">
            <span>Total logged dose</span> <span className="mono">{num(totalDose)} mSv</span>
          </p>
        ) : (
          <span className="panel-flag">
            <StatusGlyph status={status} label size={15} />
          </span>
        )}
        <button type="button" className="btn btn-quiet panel-back" onClick={() => dispatch({ type: 'select', region: null })}>
          Back to today
        </button>
      </div>

      <div className="sec">
        <h3>Findings</h3>
        <div className="findings">
          {def.indicators.map((id) => (
            <IndicatorFinding key={id} profile={profile} id={id} finding={byIndicator(id)} />
          ))}
          {(def.related ?? []).map((id) => (
            <IndicatorFinding
              key={id}
              profile={profile}
              id={id}
              finding={indicatorStatus(profile, id, day)}
              informational={INDICATORS[id].region}
            />
          ))}

          {p.region === 'bones' && (
            <div className="finding">
              <div className="finding-head">
                <span className="finding-name">Expected density loss by day {day}</span>
                <span className="finding-value mono">
                  {boneLoss.min.toFixed(1)}–{boneLoss.max.toFixed(1)}%
                </span>
              </div>
              <p className="finding-note">
                Expected from the source rate of 1% to 1.5% per month, not a measurement. <SourceLink source="risk-bone" />
              </p>
            </div>
          )}

          {flags.map((f, i) => (
            <p key={i} className="finding-flag">
              <StatusGlyph status={f.status} />{' '}
              <b>{f.symptom ? (SYMPTOMS.find((s) => s.id === f.symptom)?.label ?? f.symptom) : INDICATORS[f.indicator!].label}</b>{' '}
              <span>{f.reason}</span>
              {f.label && <> <span className="tag">{f.label}</span></>}
            </p>
          ))}

          {reported.map(({ symptom, days }) => (
            <div key={symptom.id} className="strip-row">
              <span className="strip-name">{symptom.label}</span>
              <SymptomStrip label={symptom.label} reportedDays={days} endDay={day} span={STRIP_DAYS} />
              <span className="strip-count mono">
                {days.length} of {STRIP_DAYS} d
              </span>
            </div>
          ))}
          {symptoms.length > 0 && reported.length === 0 && (
            <p className="finding-note">No symptoms reported for this system in the last {STRIP_DAYS} days.</p>
          )}
          {def.indicators.length === 0 && symptoms.length > 0 && (
            <p className="finding-note">This system has no measured indicator. Its status comes from the symptoms you report.</p>
          )}
        </div>
      </div>

      <div className="sec">
        <h3>Impression</h3>
        <div className="impression">
          {def.impression.map((item) => (
            <p key={item.quote}>
              {item.text} <SourceLink source={item.source} />
            </p>
          ))}
          <p className="cause">Caused by: {def.hazards.map((h) => HAZARDS[h].name).join(', ')}</p>
          {def.function && (
            <p>
              <span className="what">What it does:</span> {def.function.text} <SourceLink source={def.function.source} />
            </p>
          )}
        </div>
      </div>

      <div className="sec">
        <h3>Recommendation</h3>
        <div>
          <p className="hint">Tick what you will do today.</p>
          <ul className="todo">
            {recommendations.map((r) => {
              const planned = inPlan.has(r.id);
              return (
                <li key={r.id}>
                  <Checkbox checked={planned || ticked.has(r.id)} disabled={planned} onChange={(on) => tick(r.id, on)}>
                    {r.text}
                  </Checkbox>
                  <p className="todo-basis">
                    {planned && <><span className="tag">In today’s plan</span> </>}
                    {r.basis && (
                      <>
                        {r.basis.text} <SourceLink source={r.basis.source} />
                      </>
                    )}
                    {r.kind === 'groundReport' && !planned && <>Flags {def.name} for your next report to the ground team.</>}
                  </p>
                </li>
              );
            })}
          </ul>
          <div className="actions">
            <button
              type="button"
              className="btn"
              disabled={toAdd.length === 0}
              onClick={() => dispatch({ type: 'planAdd', ids: toAdd })}
            >
              {toAdd.length === 0 ? 'Nothing selected' : `Add ${toAdd.length} to today's plan`}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
