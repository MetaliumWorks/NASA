import { useEffect, useRef, useState } from 'react';
import { NOT_CLINICAL } from './ReactionTest';

export const VISION_LEVELS = 8;
/** Side of the letter in pixels, level 1 to 8. */
const SIZES = [120, 88, 64, 46, 34, 25, 18, 13];
const QUESTIONS = 3;
const NEEDED = 2;

type Direction = 'right' | 'down' | 'left' | 'up';
const DIRECTIONS: Direction[] = ['right', 'down', 'left', 'up'];
const TURN: Record<Direction, number> = { right: 0, down: 90, left: 180, up: 270 };
const KEYS: Record<string, Direction> = { ArrowRight: 'right', ArrowDown: 'down', ArrowLeft: 'left', ArrowUp: 'up' };
const LABEL: Record<Direction, string> = { up: 'Up', left: 'Left', down: 'Down', right: 'Right' };

/**
 * Vision: a letter E, turned one of four ways, gets smaller level by level. A level is
 * passed with two right answers out of three; the result is the last level passed.
 */
export function VisionTest(p: { random?: () => number; onDone(level: number): void }) {
  const random = p.random ?? Math.random;
  const pick = (): Direction => DIRECTIONS[Math.min(DIRECTIONS.length - 1, Math.floor(random() * DIRECTIONS.length))];

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [view, setView] = useState({ level: 1, direction: 'right' as Direction, asked: 0 });
  const live = useRef({ running: false, level: 1, right: 0, wrong: 0, asked: 0, direction: 'right' as Direction });

  const show = () => setView({ level: live.current.level, direction: live.current.direction, asked: live.current.asked });

  const start = () => {
    live.current = { running: true, level: 1, right: 0, wrong: 0, asked: 0, direction: pick() };
    setResult(null);
    setRunning(true);
    show();
  };

  const finish = (level: number) => {
    live.current.running = false;
    setRunning(false);
    setResult(level);
    p.onDone(level);
  };

  const answer = (given: Direction) => {
    const s = live.current;
    if (!s.running) return;
    s.asked++;
    if (given === s.direction) s.right++;
    else s.wrong++;

    if (s.wrong > QUESTIONS - NEEDED) return finish(s.level - 1); // this level can no longer be passed
    if (s.right >= NEEDED) {
      if (s.level === VISION_LEVELS) return finish(VISION_LEVELS);
      s.level++;
      s.right = 0;
      s.wrong = 0;
      s.asked = 0;
    }
    s.direction = pick();
    show();
  };

  // Arrow keys answer from anywhere on the page while the test runs.
  const answerRef = useRef(answer);
  answerRef.current = answer;
  useEffect(() => {
    if (!running) return;
    const onKey = (e: KeyboardEvent) => {
      const direction = KEYS[e.key];
      if (!direction) return;
      e.preventDefault();
      answerRef.current(direction);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running]);

  const size = SIZES[view.level - 1];

  return (
    <div className="minitest">
      <p className="minitest-note">{NOT_CLINICAL}</p>
      {!running && result === null && (
        <>
          <p>
            A letter E is shown turned one of four ways and gets smaller. Say which way its arms point with the arrow keys or the
            buttons. Sit as far from the screen as you did last time.
          </p>
          <div className="actions">
            <button type="button" className="btn" onClick={start}>
              Start
            </button>
          </div>
        </>
      )}

      {running && (
        <>
          <p className="mono minitest-count">
            Size {view.level} of {VISION_LEVELS}
          </p>
          <div className="vision-stage">
            <svg
              data-testid="tumbling-e"
              data-direction={view.direction}
              width={size}
              height={size}
              viewBox="0 0 5 5"
              role="img"
              aria-label="Letter E"
              style={{ transform: `rotate(${TURN[view.direction]}deg)` }}
            >
              <path d="M0 0h5v1H1v1h4v1H1v1h4v1H0z" fill="currentColor" />
            </svg>
          </div>
          <div className="vision-keys" role="group" aria-label="Which way do the arms point?">
            {(['up', 'left', 'down', 'right'] as Direction[]).map((d) => (
              <button key={d} type="button" className="btn btn-quiet" data-direction={d} onClick={() => answer(d)}>
                {LABEL[d]}
              </button>
            ))}
          </div>
        </>
      )}

      {!running && result !== null && (
        <p className="minitest-result" role="status">
          Level {result} of {VISION_LEVELS}: the smallest size you read correctly.
        </p>
      )}
    </div>
  );
}
