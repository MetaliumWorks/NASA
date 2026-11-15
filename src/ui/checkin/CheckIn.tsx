import { useRef, useState, type FormEvent } from 'react';
import { INDICATORS, type IndicatorDef } from '../../content/indicators';
import { SYMPTOMS } from '../../content/symptoms';
import type { CriticalReading } from '../../domain/critical';
import { simulatedReadings } from '../../domain/demo';
import { dueToday } from '../../domain/due';
import { entryFor } from '../../domain/series';
import { ALL_INDICATORS, DAILY_STEPS, type CheckInStep, type DayEntry, type IndicatorId } from '../../domain/types';
import { useApp } from '../../state/store';
import { Checkbox } from '../Checkbox';
import './checkin.css';
import { CheckResult } from './CheckResult';
import { ReadingField, readFields, SymptomPicker, type Texts } from './fields';
import { WeeklyCheckIn } from './WeeklyCheckIn';

export const STEP_TITLE: Record<CheckInStep, string> = {
  vitals: 'Vitals',
  sleepMood: 'Sleep & mood',
  symptoms: 'Symptoms',
  intake: 'Nutrition & exercise',
  radiation: 'Radiation',
};

const fieldsOf = (step: CheckInStep): IndicatorDef[] => ALL_INDICATORS.map((id) => INDICATORS[id]).filter((d) => d.step === step);

const REQUIRED = 'Required for the daily check-in';
const NO_CHOICE = 'Tick what you notice, or tick “No symptoms today”.';

function StepForm(p: { step: CheckInStep; entry: DayEntry | undefined; onSaved(): void; onBack?: () => void }) {
  const { state, dispatch } = useApp();
  const { profile } = state;
  const fields = fieldsOf(p.step);
  const form = useRef<HTMLFormElement>(null);
  const wasDone = !!p.entry?.stepsDone.includes(p.step);

  const [texts, setTexts] = useState<Texts>(() =>
    Object.fromEntries(fields.map((d) => [d.id, p.entry?.values[d.id] !== undefined ? String(p.entry.values[d.id]) : ''])),
  );
  const [errors, setErrors] = useState<Texts>({});
  // Readings found far from baseline on the last attempt, and those the crew member confirmed.
  const [asked, setAsked] = useState<CriticalReading[]>([]);
  const [confirmed, setConfirmed] = useState<Set<IndicatorId>>(() => new Set(p.entry?.critical ?? []));
  const [symptoms, setSymptoms] = useState<Set<string>>(() => new Set(p.entry?.symptoms ?? []));
  const [none, setNone] = useState(wasDone && (p.entry?.symptoms.length ?? 0) === 0 && !p.entry?.otherDiscomfort);
  const [choiceError, setChoiceError] = useState(false);
  const [other, setOther] = useState(p.entry?.otherDiscomfort ?? '');
  const [journal, setJournal] = useState(p.entry?.journal ?? '');

  const setText = (id: IndicatorId, text: string) => {
    setTexts((prev) => ({ ...prev, [id]: text }));
    setErrors((prev) => ({ ...prev, [id]: undefined }));
    // A changed reading has to be looked at again.
    setAsked((prev) => prev.filter((r) => r.indicator !== id));
    setConfirmed((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const fillSimulated = () => {
    const readings = simulatedReadings(profile, p.step);
    setTexts((prev) => {
      const next = { ...prev };
      for (const def of fields) if ((next[def.id] ?? '').trim() === '' && readings[def.id] !== undefined) next[def.id] = String(readings[def.id]);
      return next;
    });
    setErrors({});
    if (p.step === 'symptoms' && symptoms.size === 0 && other.trim() === '') {
      setNone(true);
      setChoiceError(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    // The daily check-in is mandatory: every measurement of the step is required.
    const read = readFields(profile, fields, texts, REQUIRED);
    setErrors(read.errors);
    const firstBad = fields.find((d) => read.errors[d.id]);
    if (firstBad) {
      // Nothing of the step is saved until every field in it is right.
      form.current?.querySelector<HTMLInputElement>(`#field-${firstBad.id}, input[name="field-${firstBad.id}"]`)?.focus();
      return;
    }
    const unconfirmed = read.critical.filter((r) => !confirmed.has(r.indicator));
    setAsked(read.critical);
    if (unconfirmed.length > 0) {
      form.current?.querySelector<HTMLInputElement>(`#field-${unconfirmed[0].indicator}`)?.focus();
      return;
    }
    if (p.step === 'symptoms' && symptoms.size === 0 && !none && other.trim() === '') {
      setChoiceError(true);
      return;
    }
    dispatch({
      type: 'saveStep',
      step: p.step,
      values: read.values,
      critical: read.critical.map((r) => r.indicator),
      ...(p.step === 'symptoms' ? { symptoms: SYMPTOMS.filter((s) => symptoms.has(s.id)).map((s) => s.id), otherDiscomfort: other } : {}),
      ...(p.step === 'sleepMood' ? { journal } : {}),
    });
    p.onSaved();
  };

  return (
    <form ref={form} className="step" onSubmit={submit} noValidate>
      <h3>{STEP_TITLE[p.step]}</h3>

      {fields.length > 0 && (
        <div className="fields">
          {fields.map((def) => {
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
                onChange={(t) => setText(def.id, t)}
              />
            );
          })}
        </div>
      )}

      {p.step === 'sleepMood' && (
        <div className="field field-wide">
          <label htmlFor="field-journal">Journal note</label>
          <textarea id="field-journal" rows={3} value={journal} onChange={(e) => setJournal(e.target.value)} />
          <div className="field-help">
            <p>Optional. A few words about the day, for yourself.</p>
          </div>
        </div>
      )}

      {p.step === 'symptoms' && (
        <>
          <p className="hint">Tick what you notice today. If you feel well, tick “No symptoms today”.</p>
          <div className="symptom-none">
            <Checkbox
              checked={none}
              onChange={(on) => {
                setNone(on);
                setChoiceError(false);
                if (on) setSymptoms(new Set());
              }}
            >
              No symptoms today
            </Checkbox>
            {choiceError && (
              <p className="field-error" role="alert">
                {NO_CHOICE}
              </p>
            )}
          </div>
          <SymptomPicker
            selected={symptoms}
            onToggle={(id, on) => {
              setChoiceError(false);
              if (on) setNone(false);
              setSymptoms((prev) => {
                const next = new Set(prev);
                if (on) next.add(id);
                else next.delete(id);
                return next;
              });
            }}
          />
          <div className="field field-wide">
            <label htmlFor="field-other">Anything else?</label>
            <input
              id="field-other"
              type="text"
              autoComplete="off"
              value={other}
              onChange={(e) => {
                setOther(e.target.value);
                setChoiceError(false);
                if (e.target.value.trim() !== '') setNone(false);
              }}
            />
            <div className="field-help">
              <p>A discomfort that is not in the list. It is kept in your log and the ground report and does not change any status.</p>
            </div>
          </div>
        </>
      )}

      <div className="actions">
        <button type="submit" className="btn">
          Save and continue
        </button>
        {p.onBack && (
          <button type="button" className="btn btn-quiet" onClick={p.onBack}>
            Back
          </button>
        )}
        {profile.simulated && (
          <button type="button" className="btn btn-quiet" onClick={fillSimulated}>
            Fill with simulated readings
          </button>
        )}
      </div>
    </form>
  );
}

/** The check-in: five short daily steps, each saved on its own and all of them required, and a weekly part. */
export function CheckIn() {
  const { state, dispatch } = useApp();
  const { profile } = state;
  const entry = entryFor(profile, profile.missionDay);
  const done = (step: CheckInStep) => !!entry?.stepsDone.includes(step);
  const due = dueToday(profile);
  const required = due.dailySteps.length > 0;
  // Opens where there is something to do: the daily steps first, then the weekly part.
  const [weekly, setWeekly] = useState(() => !required && due.weekly.length > 0);
  const [step, setStep] = useState<CheckInStep>(() => DAILY_STEPS.find((s) => !done(s)) ?? DAILY_STEPS[0]);
  const [showResult, setShowResult] = useState(false);
  const at = DAILY_STEPS.indexOf(step);

  const head = (
    <div className="page-head">
      <h2>{weekly ? 'Weekly check-in' : 'Daily check-in'}</h2>
      <span className="panel-meta mono">Flight day {profile.missionDay}</span>
      <div className="segmented" role="group" aria-label="Part">
        <button type="button" aria-pressed={!weekly} onClick={() => setWeekly(false)}>
          Daily
        </button>
        <button type="button" aria-pressed={weekly} disabled={required} onClick={() => setWeekly(true)}>
          Weekly{due.weekly.length > 0 && <> <span className="tag">due</span></>}
        </button>
      </div>
    </div>
  );

  if (weekly && !required) {
    return (
      <div className="page">
        {head}
        <WeeklyCheckIn />
      </div>
    );
  }

  if (showResult && !required) {
    return (
      <div className="page">
        {head}
        <CheckResult title="What today’s check-in found" doneLabel="Go to body map" onDone={() => dispatch({ type: 'view', view: 'map' })} />
        <div className="actions">
          <button type="button" className="btn btn-quiet" onClick={() => setShowResult(false)}>
            Review today’s entries
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {head}

      {required ? (
        <div className="gate" role="status">
          <p>
            <b>The daily check-in is required.</b> Flight day {profile.missionDay} has begun: the other screens open when its five steps
            are done. Every measurement is needed.
          </p>
          <p>
            Is something wrong right now?{' '}
            <button type="button" className="linklike" onClick={() => dispatch({ type: 'view', view: 'check' })}>
              Start a symptom check
            </button>
          </p>
        </div>
      ) : (
        <p className="hint">
          Today’s check-in is done.{' '}
          <button type="button" className="linklike" onClick={() => setShowResult(true)}>
            See what it found
          </button>
        </p>
      )}

      <ol className="steps" aria-label="Steps">
        {DAILY_STEPS.map((s, i) => (
          <li key={s}>
            <button type="button" className="steps-item" aria-current={s === step ? 'step' : undefined} onClick={() => setStep(s)}>
              <span className="steps-n mono">{i + 1}</span> {STEP_TITLE[s]}
              {done(s) && <> <span className="tag">done</span></>}
            </button>
          </li>
        ))}
      </ol>

      <StepForm
        key={step}
        step={step}
        entry={entry}
        onBack={at > 0 ? () => setStep(DAILY_STEPS[at - 1]) : undefined}
        onSaved={() => {
          const left = DAILY_STEPS.filter((s) => s !== step && !done(s));
          if (left.length > 0) {
            // On to the next step that is still open, in order.
            setStep(DAILY_STEPS.slice(at + 1).find((s) => !done(s)) ?? left[0]);
            return;
          }
          // The day is complete: stay on this screen and say what was found.
          dispatch({ type: 'view', view: 'checkin' });
          setShowResult(true);
        }}
      />
    </div>
  );
}
