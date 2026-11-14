import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

export const NOT_CLINICAL = 'This is not a clinical test. It compares you with your own baseline on this screen.';

type Phase = 'idle' | 'waiting' | 'signal' | 'done';

function median(times: number[]): number {
  const sorted = [...times].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return Math.round(sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * Reaction and attention: wait for the panel to light up, then press. The result is the
 * median time over the tries; a press before the signal is counted and that try repeats.
 * `random` and `now` can be passed in so the test can be tested.
 */
export function ReactionTest(p: {
  trials?: number;
  random?: () => number;
  now?: () => number;
  onDone(medianMs: number, falseStarts: number): void;
}) {
  const trials = p.trials ?? 5;
  const random = p.random ?? Math.random;
  const now = p.now ?? (() => performance.now());

  const [phase, setPhase] = useState<Phase>('idle');
  const [count, setCount] = useState(0);
  const [early, setEarly] = useState(0);
  const [tooEarly, setTooEarly] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  // The timer callback and the key handler must see the current values, not those of an old render.
  const live = useRef({ phase: 'idle' as Phase, times: [] as number[], early: 0, signalAt: 0, timer: 0 as ReturnType<typeof setTimeout> | 0 });
  const pad = useRef<HTMLButtonElement>(null);

  useEffect(() => () => clearTimeout(live.current.timer), []);

  const go = (next: Phase) => {
    live.current.phase = next;
    setPhase(next);
  };

  const beginTry = () => {
    go('waiting');
    clearTimeout(live.current.timer);
    live.current.timer = setTimeout(
      () => {
        live.current.signalAt = now();
        go('signal');
      },
      1000 + random() * 2000,
    );
  };

  const start = () => {
    live.current.times = [];
    live.current.early = 0;
    setCount(0);
    setEarly(0);
    setTooEarly(false);
    setResult(null);
    beginTry();
    // Space and Enter go to the pad from the first try on.
    setTimeout(() => pad.current?.focus(), 0);
  };

  const respond = () => {
    const state = live.current;
    if (state.phase === 'waiting') {
      state.early++;
      setEarly(state.early);
      setTooEarly(true);
      beginTry(); // the same try, with a new wait
      return;
    }
    if (state.phase !== 'signal') return;
    state.times.push(now() - state.signalAt);
    setCount(state.times.length);
    setTooEarly(false);
    if (state.times.length < trials) {
      beginTry();
      return;
    }
    const ms = median(state.times);
    setResult(ms);
    go('done');
    p.onDone(ms, state.early);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault(); // no click on key-up, no page scroll
    if (!e.repeat) respond();
  };

  return (
    <div className="minitest">
      <p className="minitest-note">{NOT_CLINICAL}</p>
      {phase === 'idle' && (
        <>
          <p>
            The panel lights up after a short wait. Press <kbd>Space</kbd> or click it as soon as it does. {trials}{' '}
            {trials === 1 ? 'try' : 'tries'}, about 40 seconds.
          </p>
          <div className="actions">
            <button type="button" className="btn" onClick={start}>
              Start
            </button>
          </div>
        </>
      )}

      {(phase === 'waiting' || phase === 'signal') && (
        <>
          <p className="mono minitest-count">
            Try {Math.min(count + 1, trials)} of {trials}
          </p>
          <button
            ref={pad}
            type="button"
            className="reaction-pad"
            data-phase={phase}
            onPointerDown={respond}
            onKeyDown={onKeyDown}
            // A click with no pointer and no key behind it comes from assistive technology.
            onClick={(e) => {
              if (e.detail === 0) respond();
            }}
          >
            {phase === 'signal' ? 'Press now' : 'Wait'}
          </button>
          <p className="minitest-status" role="status">
            {tooEarly ? 'Too early. That try starts again.' : ''}
          </p>
        </>
      )}

      {phase === 'done' && result !== null && (
        <p className="minitest-result" role="status">
          Median {result} ms over {trials} {trials === 1 ? 'try' : 'tries'}
          {early > 0 ? `, ${early} early ${early === 1 ? 'press' : 'presses'}` : ''}.
        </p>
      )}
    </div>
  );
}
