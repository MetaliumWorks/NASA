import type { ReactNode } from 'react';
import { INDICATORS, type IndicatorDef } from '../../content/indicators';
import { REGION_ORDER, REGIONS } from '../../content/regions';
import { SYMPTOMS } from '../../content/symptoms';
import { criticalReading, type CriticalReading } from '../../domain/critical';
import { formatValue } from '../../domain/format';
import { validateValue } from '../../domain/input';
import type { IndicatorId, Profile } from '../../domain/types';
import { Checkbox } from '../Checkbox';
import { SourceLink } from '../SourceLink';

export type Texts = Partial<Record<IndicatorId, string>>;

export interface FieldRead {
  values: Partial<Record<IndicatorId, number>>;
  errors: Partial<Record<IndicatorId, string>>;
  /** Readings that are far from baseline, confirmed or not. */
  critical: CriticalReading[];
}

/**
 * Turn what was typed into values. Text that is not a number or is outside the entry range
 * is an error; an empty field is an error only when `requiredMessage` is given. A reading
 * far from the personal baseline is returned as critical, for the form to ask about.
 */
export function readFields(profile: Profile, defs: IndicatorDef[], texts: Texts, requiredMessage?: string): FieldRead {
  const read: FieldRead = { values: {}, errors: {}, critical: [] };
  for (const def of defs) {
    const text = (texts[def.id] ?? '').trim();
    if (text === '') {
      if (requiredMessage) read.errors[def.id] = requiredMessage;
      continue;
    }
    const result = validateValue(def.id, text);
    if ('error' in result) {
      read.errors[def.id] = result.error;
      continue;
    }
    read.values[def.id] = result.value;
    const critical = criticalReading(profile, def.id, result.value);
    if (critical) read.critical.push(critical);
  }
  return read;
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

/** A reading far from baseline: measure again, or say that it is right. */
export interface CriticalAsk {
  reading: CriticalReading;
  confirmed: boolean;
  onConfirm(confirmed: boolean): void;
}

/** A typed number with its explanation: why it is tracked (from the source) and how to enter it. */
export function NumberField(p: { def: IndicatorDef; text: string; error?: string; critical?: CriticalAsk; onChange(text: string): void }) {
  const { def } = p;
  const id = `field-${def.id}`;
  const describedBy = [`${id}-how`, p.error ? `${id}-error` : '', p.critical ? `${id}-critical` : ''].filter(Boolean).join(' ');
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
        aria-describedby={describedBy}
        onChange={(e) => p.onChange(e.target.value)}
      />
      {p.error && (
        <p className="field-error" id={`${id}-error`} role="alert">
          {p.error}
        </p>
      )}
      {p.critical && (
        <div className="field-critical" id={`${id}-critical`} role="alert">
          <p>
            {formatValue(p.critical.reading.value, def.unit)} is far from your baseline of{' '}
            {formatValue(p.critical.reading.baseline, def.unit)}. Measure again, or confirm the reading. A confirmed reading is
            reported to the ground.
          </p>
          <Checkbox checked={p.critical.confirmed} onChange={p.critical.onConfirm}>
            Confirm {def.label.toLowerCase()}: this reading is correct
          </Checkbox>
        </div>
      )}
      <FieldHelp def={def} />
    </div>
  );
}

/** A 1 to 5 scale, picked rather than typed. Picking the same number again clears it. */
export function ScaleField(p: { def: IndicatorDef; text: string; error?: string; onChange(text: string): void }) {
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
      {p.error && (
        <p className="field-error" role="alert">
          {p.error}
        </p>
      )}
      <FieldHelp def={def} />
    </div>
  );
}

/** One field of the right kind for its indicator. */
export function ReadingField(p: { id: IndicatorId; text: string; error?: string; critical?: CriticalAsk; onChange(text: string): void }) {
  const def = INDICATORS[p.id];
  if (def.unit === '1–5') return <ScaleField def={def} text={p.text} error={p.error} onChange={p.onChange} />;
  return <NumberField def={def} text={p.text} error={p.error} critical={p.critical} onChange={p.onChange} />;
}

/** Symptoms as tick boxes, grouped by system, each with the source passage that names it. */
export function SymptomPicker(p: { selected: Set<string>; onToggle(id: string, on: boolean): void; only?: string[]; children?: ReactNode }) {
  const shown = p.only ? SYMPTOMS.filter((s) => p.only!.includes(s.id)) : SYMPTOMS;
  const groups = REGION_ORDER.map((region) => ({ region, items: shown.filter((s) => s.region === region) })).filter((g) => g.items.length > 0);
  return (
    <div className="symptom-groups">
      {groups.map(({ region, items }) => (
        <fieldset key={region} className="symptom-group">
          <legend>{REGIONS[region].name}</legend>
          {items.map((s) => (
            <div key={s.id} className="symptom">
              <Checkbox checked={p.selected.has(s.id)} onChange={(on) => p.onToggle(s.id, on)}>
                {s.label}
              </Checkbox>
              <p className="symptom-basis">
                {s.urgent && (
                  <>
                    <span className="tag tag-urgent">one report is a warning</span>{' '}
                  </>
                )}
                {s.basis.text} <SourceLink source={s.basis.source} />
              </p>
            </div>
          ))}
        </fieldset>
      ))}
      {p.children}
    </div>
  );
}
