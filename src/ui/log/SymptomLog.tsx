import { useState } from 'react';
import { REGION_ORDER, REGIONS } from '../../content/regions';
import { SYMPTOMS } from '../../content/symptoms';
import { useApp } from '../../state/store';
import { SymptomStrip } from '../charts/SymptomStrip';
import './log.css';

const SPAN = 30;

/** Every symptom, day by day. Old days are kept as they were entered and can be paged back to. */
export function SymptomLog() {
  const { state } = useApp();
  const { profile } = state;
  const today = profile.missionDay;
  const [endDay, setEndDay] = useState(today);
  const end = Math.min(endDay, today);
  const from = Math.max(1, end - SPAN + 1);

  const groups = REGION_ORDER.map((region) => ({ region, items: SYMPTOMS.filter((s) => s.region === region) })).filter(
    (g) => g.items.length > 0,
  );
  const reportedOn = (id: string) => profile.entries.filter((e) => e.day <= today && e.symptoms.includes(id)).map((e) => e.day);
  const others = profile.entries
    .filter((e) => e.day <= today && e.otherDiscomfort)
    .sort((a, b) => b.day - a.day);

  return (
    <div className="page">
      <div className="page-head">
        <h2>Symptom log</h2>
        <span className="panel-meta mono">{from === end ? `Flight day ${end}` : `Flight days ${from} to ${end}`}</span>
        <div className="pager">
          <button type="button" className="btn btn-quiet" disabled={end - SPAN < 1} onClick={() => setEndDay(end - SPAN)}>
            Earlier
          </button>
          <button type="button" className="btn btn-quiet" disabled={end >= today} onClick={() => setEndDay(Math.min(today, end + SPAN))}>
            Later
          </button>
        </div>
      </div>
      <p className="hint">
        One cell per day, oldest on the left. A filled cell is a day the symptom was reported. Past days are kept as they were entered.
      </p>

      <div className="log">
        <div className="log-scale mono" aria-hidden="true">
          <span>day {end - SPAN + 1 < 1 ? 1 : end - SPAN + 1}</span>
          <span>day {end}</span>
        </div>
        {groups.map(({ region, items }) => (
          <div key={region} className="log-group" role="group" aria-label={REGIONS[region].name}>
            <h3>{REGIONS[region].name}</h3>
            {items.map((s) => {
              const days = reportedOn(s.id);
              const inWindow = days.filter((d) => d > end - SPAN && d <= end).length;
              return (
                <div key={s.id} className="log-row" data-any={inWindow > 0 ? 'true' : undefined}>
                  <span className="log-name">{s.label}</span>
                  <SymptomStrip label={s.label} reportedDays={days} endDay={end} span={SPAN} />
                  <span className="log-count mono">{inWindow > 0 ? `${inWindow} ${inWindow === 1 ? 'day' : 'days'}` : ''}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <section className="sec log-other" aria-labelledby="log-other">
        <h3 id="log-other">Other discomforts</h3>
        <div>
          <p className="hint">What you wrote under “Anything else?”. These notes belong to no system and change no status.</p>
          {others.length === 0 ? (
            <p>Nothing written yet.</p>
          ) : (
            <ul className="log-notes">
              {others.map((e) => (
                <li key={e.day}>
                  Day {e.day} · {e.otherDiscomfort}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
