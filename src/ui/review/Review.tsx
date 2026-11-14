import { useMemo, useState } from 'react';
import { INDICATORS } from '../../content/indicators';
import { REGIONS } from '../../content/regions';
import { SYMPTOMS } from '../../content/symptoms';
import { formatValue } from '../../domain/format';
import { periodReview, periodWindow, reviewDue, type Period, type ReviewRow } from '../../domain/review';
import type { Status } from '../../domain/types';
import { useApp } from '../../state/store';
import { StatusGlyph } from '../StatusGlyph';
import './review.css';

const NAME: Record<Period, { this: string; before: string }> = {
  week: { this: 'This week', before: 'Week before' },
  month: { this: 'This month', before: 'Month before' },
};

function flaggedText(d: ReviewRow['flaggedDays']): string {
  const days = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`;
  if (d.warning && d.caution) return `${days(d.warning)} at warning, ${d.caution} at caution`;
  if (d.warning) return `${days(d.warning)} at warning`;
  if (d.caution) return `${days(d.caution)} at caution`;
  return 'No flagged days';
}

/** The last week or month, system by system: the place a long-running problem shows. */
export function Review() {
  const { state } = useApp();
  const { profile } = state;
  const day = profile.missionDay;
  const [period, setPeriod] = useState<Period>(() => reviewDue(day) ?? 'week');
  const rows = useMemo(() => periodReview(profile, period, day), [profile, period, day]);
  const window = periodWindow(period, day);
  const value = (v: number | null | undefined, unit: string) => (typeof v === 'number' ? formatValue(v, unit) : '—');

  return (
    <div className="page">
      <div className="page-head">
        <h2>Review</h2>
        <span className="panel-meta mono">
          {window.from === window.to ? `Flight day ${window.to}` : `Flight days ${window.from} to ${window.to}`}
        </span>
        <div className="segmented" role="group" aria-label="Period">
          {(['week', 'month'] as Period[]).map((p) => (
            <button key={p} type="button" aria-pressed={period === p} onClick={() => setPeriod(p)}>
              {p === 'week' ? 'Week' : 'Month'}
            </button>
          ))}
        </div>
      </div>
      <p className="hint">
        Single days can look fine while a problem builds. This view counts how often each symptom was reported, how many days each
        system was flagged, and how this period’s averages compare with the one before and with your baseline.
      </p>

      <table className="review">
        <thead>
          <tr>
            <th scope="col">System</th>
            <th scope="col">Symptoms and long-term checks</th>
            <th scope="col">Indicators</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const worstDay: Status = row.flaggedDays.warning ? 'warning' : row.flaggedDays.caution ? 'caution' : 'nominal';
            const symptoms = Object.entries(row.symptomDays);
            return (
              <tr key={row.region} data-status={worstDay}>
                <th scope="row">
                  <span className="review-name">{REGIONS[row.region].name}</span>{' '}
                  <span className="review-days">
                    <StatusGlyph status={worstDay} /> <span>{flaggedText(row.flaggedDays)}</span>
                  </span>
                </th>
                <td>
                  {symptoms.map(([id, n]) => (
                    <p key={id}>
                      {SYMPTOMS.find((s) => s.id === id)?.label ?? id} · {n} of {window.days} days
                    </p>
                  ))}
                  {row.flags.map((f, i) => (
                    <p key={i} className="review-flag">
                      <StatusGlyph status={f.status} /> <span>{f.reason}</span> <span className="tag">{f.label}</span>
                    </p>
                  ))}
                  {symptoms.length === 0 && row.flags.length === 0 && <p className="review-none">Nothing reported</p>}
                </td>
                <td>
                  {row.indicators.map((ind) => {
                    const def = INDICATORS[ind.id];
                    return (
                      <div key={ind.id} className="review-ind" role="group" aria-label={def.label}>
                        <span className="review-ind-name">{def.label}</span>
                        <span>
                          {NAME[period].this} <b className="mono">{value(ind.mean, def.unit)}</b>
                        </span>
                        <span>
                          {NAME[period].before} <b className="mono">{value(ind.previousMean, def.unit)}</b>
                        </span>
                        <span>
                          Baseline <b className="mono">{value(ind.baseline, def.unit)}</b>
                        </span>
                      </div>
                    );
                  })}
                  {row.indicators.length === 0 && <p className="review-none">No measured indicator</p>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
