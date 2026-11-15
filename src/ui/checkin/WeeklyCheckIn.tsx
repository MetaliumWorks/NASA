import { useState, type FormEvent } from 'react';
import { INDICATORS } from '../../content/indicators';
import { formatValue } from '../../domain/format';
import { validateValue } from '../../domain/input';
import { entryFor } from '../../domain/series';
import type { IndicatorId } from '../../domain/types';
import { useApp } from '../../state/store';
import { SourceLink } from '../SourceLink';
import { NumberField, ScaleField } from './fields';
import { ReactionTest } from './ReactionTest';
import { VisionTest } from './VisionTest';

/** A mini test with its reason, its last result and a way to run it. */
function TestBlock(p: {
  id: 'reactionMs' | 'visionLevel';
  title: string;
  value: number | undefined;
  baseline: number | undefined;
  running: boolean;
  note?: string;
  onStart(): void;
  children: React.ReactNode;
}) {
  const def = INDICATORS[p.id];
  return (
    <section className="weekly-block" aria-label={p.title}>
      <h4>{p.title}</h4>
      <p className="field-help">
        {def.why.text} <SourceLink source={def.why.source} />
      </p>
      {p.running ? (
        p.children
      ) : (
        <div className="actions">
          <button type="button" className="btn btn-quiet" onClick={p.onStart}>
            {p.value === undefined ? `Start ${p.title.toLowerCase()}` : `Run the ${p.title.toLowerCase()} again`}
          </button>
          {p.value !== undefined && (
            <span className="mono weekly-result">
              {formatValue(p.value, def.unit)}
              {p.baseline !== undefined && ` · baseline ${formatValue(p.baseline, def.unit)}`}
            </span>
          )}
        </div>
      )}
      {p.note && (
        <p className="field-error" role="alert">
          {p.note}
        </p>
      )}
    </section>
  );
}

/**
 * Once a week: reaction and vision tests, height and a strength self-rating. What is
 * filled in is saved; an item left out stays due.
 */
export function WeeklyCheckIn(p: { random?: () => number; now?: () => number; reactionTrials?: number }) {
  const { state, dispatch } = useApp();
  const { profile } = state;
  const today = entryFor(profile, profile.missionDay);

  const [reaction, setReaction] = useState<number | undefined>(today?.values.reactionMs);
  const [vision, setVision] = useState<number | undefined>(today?.values.visionLevel);
  const [running, setRunning] = useState<'reaction' | 'vision' | null>(null);
  const [reactionNote, setReactionNote] = useState('');
  const [height, setHeight] = useState(today?.values.heightCm !== undefined ? String(today.values.heightCm) : '');
  const [heightError, setHeightError] = useState<string>();
  const [strength, setStrength] = useState(today?.values.strength !== undefined ? String(today.values.strength) : '');

  const nothing = reaction === undefined && vision === undefined && height.trim() === '' && strength === '';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const values: Partial<Record<IndicatorId, number>> = {};
    if (reaction !== undefined) values.reactionMs = reaction;
    if (vision !== undefined) values.visionLevel = vision;
    if (strength !== '') values.strength = Number(strength);
    if (height.trim() !== '') {
      const result = validateValue('heightCm', height);
      if ('error' in result) {
        setHeightError(result.error);
        document.getElementById('field-heightCm')?.focus();
        return;
      }
      values.heightCm = result.value;
    }
    dispatch({ type: 'saveWeekly', values });
    dispatch({ type: 'view', view: 'map' });
  };

  const { min, max } = INDICATORS.reactionMs;

  return (
    <form className="step" onSubmit={submit} noValidate>
      <h3>This week</h3>
      <p className="hint">Two short tests and two measurements. Fill in what you can; what you leave out stays due.</p>

      <div className="weekly-tests">
        <TestBlock
          id="reactionMs"
          title="Reaction test"
          value={reaction}
          baseline={profile.baseline.reactionMs}
          running={running === 'reaction'}
          note={reactionNote}
          onStart={() => {
            setReactionNote('');
            setRunning('reaction');
          }}
        >
          <ReactionTest
            trials={p.reactionTrials}
            random={p.random}
            now={p.now}
            onDone={(ms) => {
              // A median outside the entry range is anticipation or a long pause, not a reaction time.
              if (ms < min || ms > max) {
                setReactionNote(`A median of ${ms} ms is outside ${min} to ${max} ms and was not kept. Run the test again.`);
                setRunning(null);
              } else setReaction(ms);
            }}
          />
        </TestBlock>

        <TestBlock
          id="visionLevel"
          title="Vision test"
          value={vision}
          baseline={profile.baseline.visionLevel}
          running={running === 'vision'}
          onStart={() => setRunning('vision')}
        >
          <VisionTest random={p.random} onDone={setVision} />
        </TestBlock>
      </div>

      <div className="fields">
        <NumberField
          def={INDICATORS.heightCm}
          text={height}
          error={heightError}
          onChange={(t) => {
            setHeight(t);
            setHeightError(undefined);
          }}
        />
        <ScaleField def={INDICATORS.strength} text={strength} onChange={setStrength} />
      </div>

      <div className="actions">
        <button type="submit" className="btn" disabled={nothing}>
          Save weekly check-in
        </button>
      </div>
    </form>
  );
}
