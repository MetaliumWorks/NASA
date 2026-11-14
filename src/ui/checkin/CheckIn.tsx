import { useRef, useState, type FormEvent } from 'react';
import { INDICATORS, type IndicatorDef } from '../../content/indicators';
import { REGION_ORDER, REGIONS } from '../../content/regions';
import { SYMPTOMS } from '../../content/symptoms';
import { validateValue } from '../../domain/input';
import { entryFor } from '../../domain/series';
import { ALL_INDICATORS, DAILY_STEPS, type CheckInStep, type DayEntry, type IndicatorId } from '../../domain/types';
import { useApp } from '../../state/store';
import { Checkbox } from '../Checkbox';
import { SourceLink } from '../SourceLink';
import './checkin.css';

export const STEP_TITLE: Record<CheckInStep, string> = {
  vitals: 'Vitals',
  sleepMood: 'Sleep & mood',
  symptoms: 'Symptoms',
  intake: 'Nutrition & exercise',
  radiation: 'Radiation',
};

const fieldsOf = (step: CheckInStep): IndicatorDef[] => ALL_INDICATORS.map((id) => INDICATORS[id]).filter((d) => d.step === step);

/** A typed number with its explanation: why it is tracked (from the source) and how to enter it. */
export function NumberField(p: { def: IndicatorDef; text: string; error?: string; onChange(text: string): void }) {
  const { def } = p;
  const id = `field-${def.id}`;
  return (
    <div className="field">
      <label htmlFor={id}>
        {def.label} <span className="unit mono">{def.unit}</span>
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={p.text}
        aria-invalid={p.error ? true : undefined}
        aria-describedby={`${id}-how${p.error ? ` ${id}-error` : ''}`}
        onChange={(e) => p.onChange(e.target.value)}
      />
      {p.error && (
        <p className="field-error" id={`${id}-error`} role="alert">
          {p.error}
        </p>
      )}
      <FieldHelp def={def} />
    </div>
  );
}

function FieldHelp(p: { def: IndicatorDef }) {
  return (
    <div className="field-help">
      <p id={`field-${p.def.id}-how`}>{p.def.howTo}</p>
      <p className="field-why">
        <span>{p.def.why.text}</span> <SourceLink source={p.def.why.source} />
      </p>
    </div>
  );
}

/** A 1 to 5 scale, picked rather than typed. Picking the same number again clears it. */
export function ScaleField(p: { def: IndicatorDef; text: string; onChange(text: string): void }) {
  const { def } = p;
  const id = `field-${def.id}`;
  return (
    <div className="field">
      <div className="scale" role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={`${id}-how`}>
        <span className="scale-label" id={`${id}-label`}>
          {def.label} <span className="unit mono">{def.unit}</span>
        </span>
        <div className="scale-options">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="scale-option">
              <input
                type="radio"
                name={id}
                checked={p.text === String(n)}
                onChange={() => p.onChange(String(n))}
                onClick={() => {
                  if (p.text === String(n)) p.onChange('');
                }}
              />
              <span>{n}</span>
            </label>
          ))}
        </div>
      </div>
      <FieldHelp def={def} />
    </div>
  );
}

function StepForm(p: { step: CheckInStep; entry: DayEntry | undefined; onSaved(): void; onBack?: () => void }) {
  const { dispatch } = useApp();
  const fields = fieldsOf(p.step);
  const form = useRef<HTMLFormElement>(null);

  const [texts, setTexts] = useState<Partial<Record<IndicatorId, string>>>(() =>
    Object.fromEntries(fields.map((d) => [d.id, p.entry?.values[d.id] !== undefined ? String(p.entry.values[d.id]) : ''])),
  );
  const [errors, setErrors] = useState<Partial<Record<IndicatorId, string>>>({});
  const [symptoms, setSymptoms] = useState<Set<string>>(() => new Set(p.entry?.symptoms ?? []));
  const [other, setOther] = useState(p.entry?.otherDiscomfort ?? '');
  const [journal, setJournal] = useState(p.entry?.journal ?? '');

  const setText = (id: IndicatorId, text: string) => {
    setTexts((prev) => ({ ...prev, [id]: text }));
    setErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const values: Partial<Record<IndicatorId, number>> = {};
    const found: Partial<Record<IndicatorId, string>> = {};
    for (const def of fields) {
      const text = (texts[def.id] ?? '').trim();
      if (text === '') continue; // an empty field is skipped, not an error
      const result = validateValue(def.id, text);
      if ('error' in result) found[def.id] = result.error;
      else values[def.id] = result.value;
    }
    setErrors(found);
    const firstBad = fields.find((d) => found[d.id]);
    if (firstBad) {
      // Nothing of the step is saved until every field in it is right.
      form.current?.querySelector<HTMLInputElement>(`#field-${firstBad.id}`)?.focus();
      return;
    }
    dispatch({
      type: 'saveStep',
      step: p.step,
      values,
      ...(p.step === 'symptoms' ? { symptoms: SYMPTOMS.filter((s) => symptoms.has(s.id)).map((s) => s.id), otherDiscomfort: other } : {}),
      ...(p.step === 'sleepMood' ? { journal } : {}),
    });
    p.onSaved();
  };

  const groups = REGION_ORDER.map((region) => ({ region, items: SYMPTOMS.filter((s) => s.region === region) })).filter(
    (g) => g.items.length > 0,
  );

  return (
    <form ref={form} className="step" onSubmit={submit} noValidate>
      <h3>{STEP_TITLE[p.step]}</h3>

      {fields.length > 0 && (
        <div className="fields">
          {fields.map((def) =>
            def.unit === '1–5' ? (
              <ScaleField key={def.id} def={def} text={texts[def.id] ?? ''} onChange={(t) => setText(def.id, t)} />
            ) : (
              <NumberField key={def.id} def={def} text={texts[def.id] ?? ''} error={errors[def.id]} onChange={(t) => setText(def.id, t)} />
            ),
          )}
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
          <p className="hint">Tick what you notice today. Leave everything empty if you feel well.</p>
          <div className="symptom-groups">
            {groups.map(({ region, items }) => (
              <fieldset key={region} className="symptom-group">
                <legend>{REGIONS[region].name}</legend>
                {items.map((s) => (
                  <div key={s.id} className="symptom">
                    <Checkbox
                      checked={symptoms.has(s.id)}
                      onChange={(on) =>
                        setSymptoms((prev) => {
                          const next = new Set(prev);
                          if (on) next.add(s.id);
                          else next.delete(s.id);
                          return next;
                        })
                      }
                    >
                      {s.label}
                    </Checkbox>
                    <p className="symptom-basis">
                      {s.urgent && <><span className="tag tag-urgent">one report is a warning</span> </>}
                      {s.basis.text} <SourceLink source={s.basis.source} />
                    </p>
                  </div>
                ))}
              </fieldset>
            ))}
          </div>
          <div className="field field-wide">
            <label htmlFor="field-other">Anything else?</label>
            <input id="field-other" type="text" autoComplete="off" value={other} onChange={(e) => setOther(e.target.value)} />
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
      </div>
    </form>
  );
}

/** The daily check-in: five short steps, each saved on its own. */
export function CheckIn() {
  const { state, dispatch } = useApp();
  const { profile } = state;
  const entry = entryFor(profile, profile.missionDay);
  const done = (step: CheckInStep) => !!entry?.stepsDone.includes(step);
  const [step, setStep] = useState<CheckInStep>(() => DAILY_STEPS.find((s) => !done(s)) ?? DAILY_STEPS[0]);
  const at = DAILY_STEPS.indexOf(step);

  return (
    <div className="page">
      <div className="page-head">
        <h2>Daily check-in</h2>
        <span className="panel-meta mono">Flight day {profile.missionDay}</span>
      </div>

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
          if (at < DAILY_STEPS.length - 1) setStep(DAILY_STEPS[at + 1]);
          else dispatch({ type: 'view', view: 'map' });
        }}
      />
    </div>
  );
}
