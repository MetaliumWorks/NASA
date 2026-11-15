import { useState, type FormEvent } from 'react';
import { INDICATORS } from '../../content/indicators';
import { SYMPTOMS } from '../../content/symptoms';
import type { CriticalReading } from '../../domain/critical';
import { formatValue } from '../../domain/format';
import { followUp } from '../../domain/possible';
import type { IndicatorId } from '../../domain/types';
import { useApp } from '../../state/store';
import { CheckResult } from '../checkin/CheckResult';
import '../checkin/checkin.css';
import { ReadingField, readFields, SymptomPicker, type Texts } from '../checkin/fields';
import { ReactionTest } from '../checkin/ReactionTest';
import { VisionTest } from '../checkin/VisionTest';
import { checkInRequired } from '../gate';

const TESTS: IndicatorId[] = ['reactionMs', 'visionLevel'];
const MEASURE = 'The app asks for this measurement';

/**
 * A check at any time, outside the daily check-in. The crew member says what they notice;
 * the app asks about the other signs of the conditions it may be and for the measurements
 * that help tell, then says what it found and reports to the ground what is urgent.
 */
export function SymptomCheck(p: { random?: () => number; now?: () => number; reactionTrials?: number }) {
  const { state, dispatch } = useApp();
  const { profile } = state;
  const day = profile.missionDay;

  const [stage, setStage] = useState<'report' | 'ask' | 'result'>('report');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [also, setAlso] = useState<Set<string>>(new Set());
  const [note, setNote] = useState('');
  const [texts, setTexts] = useState<Texts>({});
  const [errors, setErrors] = useState<Texts>({});
  const [asked, setAsked] = useState<CriticalReading[]>([]);
  const [confirmed, setConfirmed] = useState<Set<IndicatorId>>(new Set());
  const [tested, setTested] = useState<Partial<Record<IndicatorId, number>>>({});
  const [running, setRunning] = useState<IndicatorId | null>(null);

  // The questions come from what was reported first; the measurements follow every sign named so far.
  const first = followUp([...picked]);
  const wanted = followUp([...picked, ...also]).measure;
  const typed = wanted.filter((id) => !TESTS.includes(id)).map((id) => INDICATORS[id]);
  const tests = wanted.filter((id) => TESTS.includes(id));
  const nothingToAsk = first.alsoAsk.length === 0 && wanted.length === 0;

  const toggle = (set: (fn: (prev: Set<string>) => Set<string>) => void) => (id: string, on: boolean) =>
    set((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const save = (values: Partial<Record<IndicatorId, number>>, critical: IndicatorId[]) => {
    const symptoms = SYMPTOMS.filter((s) => picked.has(s.id) || also.has(s.id)).map((s) => s.id);
    dispatch({ type: 'saveCheck', symptoms, values: { ...values, ...tested }, note, critical });
    setStage('result');
  };

  const next = (e: FormEvent) => {
    e.preventDefault();
    if (nothingToAsk) save({}, []);
    else setStage('ask');
  };

  const finish = (e: FormEvent) => {
    e.preventDefault();
    const read = readFields(profile, typed, texts, MEASURE);
    setErrors(read.errors);
    const firstBad = typed.find((d) => read.errors[d.id]);
    if (firstBad) {
      document.querySelector<HTMLInputElement>(`#field-${firstBad.id}, input[name="field-${firstBad.id}"]`)?.focus();
      return;
    }
    setAsked(read.critical);
    const unconfirmed = read.critical.filter((r) => !confirmed.has(r.indicator));
    if (unconfirmed.length > 0) {
      document.querySelector<HTMLInputElement>(`#field-${unconfirmed[0].indicator}`)?.focus();
      return;
    }
    save(read.values, read.critical.map((r) => r.indicator));
  };

  const restart = () => {
    setStage('report');
    setPicked(new Set());
    setAlso(new Set());
    setNote('');
    setTexts({});
    setErrors({});
    setAsked([]);
    setConfirmed(new Set());
    setTested({});
    setRunning(null);
  };

  const earlier = (profile.checks ?? []).filter((c) => c.day === day);
  const label = (id: string) => SYMPTOMS.find((s) => s.id === id)?.label ?? id;

  return (
    <div className="page">
      <div className="page-head">
        <h2>Symptom check</h2>
        <span className="panel-meta mono">Flight day {day}</span>
      </div>

      {stage === 'report' && (
        <form className="step" onSubmit={next} noValidate>
          <h3>What do you notice?</h3>
          <p className="hint">
            Any time, outside the daily check-in. Tick what you notice now; the app then asks what it needs to know and tells you what it
            finds.
          </p>
          <SymptomPicker selected={picked} onToggle={toggle(setPicked)} />
          <div className="field field-wide">
            <label htmlFor="check-note">Anything else?</label>
            <input id="check-note" type="text" autoComplete="off" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="field-help">
              <p>A discomfort that is not in the list. It is kept in your log and the ground report and does not change any status.</p>
            </div>
          </div>
          <div className="actions">
            <button type="submit" className="btn" disabled={picked.size === 0 && note.trim() === ''}>
              Continue
            </button>
          </div>
        </form>
      )}

      {stage === 'ask' && (
        <form className="step" onSubmit={finish} noValidate>
          <h3>The app asks</h3>
          <p className="hint">You reported: {[...picked].map(label).join(', ')}.</p>

          {first.alsoAsk.length > 0 && (
            <section className="ask-block" aria-labelledby="ask-also">
              <h4 id="ask-also">Do you also notice any of these?</h4>
              <p className="field-help">
                They belong to the same conditions in the sources: {first.conditions.map((c) => c.name).join(', ')}. Leave them empty if
                not.
              </p>
              <SymptomPicker selected={also} onToggle={toggle(setAlso)} only={first.alsoAsk} />
            </section>
          )}

          {wanted.length > 0 && (
            <section className="ask-block" aria-labelledby="ask-measure">
              <h4 id="ask-measure">Measure now</h4>
              <p className="field-help">These readings help tell what it is. They replace the earlier reading of today.</p>
              {typed.length > 0 && (
                <div className="fields">
                  {typed.map((def) => {
                    const reading = asked.find((r) => r.indicator === def.id);
                    return (
                      <ReadingField
                        key={def.id}
                        id={def.id}
                        text={texts[def.id] ?? ''}
                        error={errors[def.id]}
                        critical={
                          reading && {
                            reading,
                            confirmed: confirmed.has(def.id),
                            onConfirm: (on) =>
                              setConfirmed((prev) => {
                                const next = new Set(prev);
                                if (on) next.add(def.id);
                                else next.delete(def.id);
                                return next;
                              }),
                          }
                        }
                        onChange={(t) => {
                          setTexts((prev) => ({ ...prev, [def.id]: t }));
                          setErrors((prev) => ({ ...prev, [def.id]: undefined }));
                          setAsked((prev) => prev.filter((r) => r.indicator !== def.id));
                          setConfirmed((prev) => {
                            const next = new Set(prev);
                            next.delete(def.id);
                            return next;
                          });
                        }}
                      />
                    );
                  })}
                </div>
              )}
              {tests.map((id) => {
                const def = INDICATORS[id];
                const name = id === 'reactionMs' ? 'reaction test' : 'vision test';
                return (
                  <div key={id} className="weekly-block ask-test">
                    <p className="field-help">{def.why.text}</p>
                    {running === id ? (
                      id === 'reactionMs' ? (
                        <ReactionTest
                          trials={p.reactionTrials}
                          random={p.random}
                          now={p.now}
                          onDone={(ms) => {
                            if (ms >= def.min && ms <= def.max) setTested((prev) => ({ ...prev, reactionMs: ms }));
                            else setRunning(null);
                          }}
                        />
                      ) : (
                        <VisionTest random={p.random} onDone={(level) => setTested((prev) => ({ ...prev, visionLevel: level }))} />
                      )
                    ) : (
                      <div className="actions">
                        <button type="button" className="btn btn-quiet" onClick={() => setRunning(id)}>
                          {tested[id] === undefined ? `Run the ${name}` : `Run the ${name} again`}
                        </button>
                        {tested[id] !== undefined && <span className="mono weekly-result">{formatValue(tested[id] as number, def.unit)}</span>}
                        {tested[id] === undefined && <span className="hint">Optional, about a minute.</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          <div className="actions">
            <button type="submit" className="btn">
              See what the app finds
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setStage('report')}>
              Back
            </button>
          </div>
        </form>
      )}

      {stage === 'result' && (
        <>
          <CheckResult
            title="What the check found"
            doneLabel={checkInRequired(profile) ? 'Back to the daily check-in' : 'Go to body map'}
            onDone={() => dispatch({ type: 'view', view: checkInRequired(profile) ? 'checkin' : 'map' })}
          />
          <div className="actions">
            <button type="button" className="btn btn-quiet" onClick={restart}>
              Start another check
            </button>
          </div>
        </>
      )}

      {stage === 'report' && earlier.length > 0 && (
        <section className="sec check-earlier" aria-labelledby="check-earlier">
          <h3 id="check-earlier">Earlier today</h3>
          <ul className="log-notes">
            {earlier.map((c, i) => {
              const measured = Object.entries(c.values).map(([id, v]) => `${INDICATORS[id as IndicatorId].label} ${formatValue(v as number, INDICATORS[id as IndicatorId].unit)}`);
              return (
                <li key={i}>
                  Check {i + 1}: {c.symptoms.length > 0 ? c.symptoms.map(label).join(', ') : 'no listed symptom'}
                  {measured.length > 0 ? `; measured ${measured.join(', ')}` : ''}
                  {c.note ? `; “${c.note}”` : ''}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
