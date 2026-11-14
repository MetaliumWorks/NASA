import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createDemoProfile } from '../../domain/demo';
import { Header } from '../Header';
import { MapScreen } from '../map/MapScreen';
import { halfDoneState, renderApp, todayEntry } from '../test-helpers';
import { CheckIn } from './CheckIn';
import { ReactionTest } from './ReactionTest';
import { VisionTest } from './VisionTest';
import { WeeklyCheckIn } from './WeeklyCheckIn';

const NOT_CLINICAL = 'This is not a clinical test. It compares you with your own baseline on this screen.';

describe('reaction test', () => {
  const clock = { t: 1000, now: () => clock.t };
  const pad = () => screen.getByRole('button', { name: /Wait|Press now/ });

  beforeEach(() => {
    vi.useFakeTimers();
    clock.t = 1000;
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /** Let the signal appear (random 0 gives a one-second wait), then respond `ms` later. */
  function runTrial(ms: number) {
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(pad()).toHaveAccessibleName('Press now');
    clock.t += ms;
    fireEvent.pointerDown(pad());
  }

  test('reports the median of the trials', () => {
    const onDone = vi.fn();
    render(<ReactionTest trials={3} random={() => 0} now={clock.now} onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    for (const ms of [300, 250, 400]) runTrial(ms);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledWith(300, 0);
    expect(screen.getByText(/Median 300 ms/)).toBeInTheDocument();
  });

  test('an even number of trials takes the middle of the two central times', () => {
    const onDone = vi.fn();
    render(<ReactionTest trials={4} random={() => 0} now={clock.now} onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    for (const ms of [300, 250, 400, 320]) runTrial(ms);
    expect(onDone).toHaveBeenCalledWith(310, 0);
  });

  test('pressing before the signal counts as a false start and repeats the trial', () => {
    const onDone = vi.fn();
    render(<ReactionTest trials={3} random={() => 0} now={clock.now} onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    runTrial(300);
    act(() => {
      vi.advanceTimersByTime(400); // still waiting
    });
    fireEvent.pointerDown(pad());
    expect(screen.getByText(/Too early/)).toBeInTheDocument();
    expect(screen.getByText('Try 2 of 3')).toBeInTheDocument(); // the same try again
    runTrial(250);
    runTrial(400);
    expect(onDone).toHaveBeenCalledWith(300, 1);
  });

  test('the keyboard works too, and a held key counts once', () => {
    const onDone = vi.fn();
    render(<ReactionTest trials={2} random={() => 0} now={clock.now} onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    clock.t += 280;
    fireEvent.keyDown(pad(), { key: ' ' });
    fireEvent.keyDown(pad(), { key: ' ', repeat: true }); // still held: not an early press of the next try
    expect(screen.queryByText(/Too early/)).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    clock.t += 320;
    fireEvent.keyDown(pad(), { key: 'Enter' });
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledWith(300, 0);
  });

  test('the wait before the signal is between one and three seconds', () => {
    render(<ReactionTest trials={1} random={() => 0.999} now={clock.now} onDone={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => {
      vi.advanceTimersByTime(2900);
    });
    expect(pad()).toHaveAccessibleName('Wait');
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(pad()).toHaveAccessibleName('Press now');
  });
});

describe('vision test', () => {
  const answer = (correct: boolean) => {
    const shown = screen.getByTestId('tumbling-e').getAttribute('data-direction')!;
    const wrong = shown === 'up' ? 'down' : 'up';
    const key = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[correct ? shown : wrong]!;
    fireEvent.keyDown(window, { key });
  };

  /** Pass every level up to `correctUpTo`, then give two wrong answers. */
  function answerLevels(options: { correctUpTo: number }) {
    for (let level = 1; level <= options.correctUpTo; level++) {
      answer(true);
      answer(true);
    }
    if (options.correctUpTo < 8) {
      answer(false);
      answer(false);
    }
  }

  test('stops at the first level failed', () => {
    const onDone = vi.fn();
    let i = 0;
    render(<VisionTest random={() => [0.1, 0.3, 0.6, 0.9][i++ % 4]} onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    answerLevels({ correctUpTo: 5 });
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledWith(5);
    expect(screen.getByText(/Level 5 of 8/)).toBeInTheDocument();
  });

  test('two of three right passes a level, and the smallest size ends the test', () => {
    const onDone = vi.fn();
    render(<VisionTest random={() => 0.4} onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    answer(true);
    answer(false);
    answer(true); // level 1 passed with one miss
    for (let level = 2; level <= 8; level++) {
      answer(true);
      answer(true);
    }
    expect(onDone).toHaveBeenCalledWith(8);
  });

  test('failing the largest size gives level 0', () => {
    const onDone = vi.fn();
    render(<VisionTest random={() => 0.4} onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    answer(false);
    answer(false);
    expect(onDone).toHaveBeenCalledWith(0);
  });

  test('the letter gets smaller with each level and can be answered with the buttons', async () => {
    render(<VisionTest random={() => 0} onDone={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Start' }));
    const size = () => Number(screen.getByTestId('tumbling-e').getAttribute('width'));
    const first = size();
    expect(screen.getByTestId('tumbling-e')).toHaveAttribute('data-direction', 'right');
    await userEvent.click(screen.getByRole('button', { name: 'Right' }));
    await userEvent.click(screen.getByRole('button', { name: 'Right' }));
    expect(size()).toBeLessThan(first);
  });

  test('random decides the direction', () => {
    render(<VisionTest random={() => 0.99} onDone={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(screen.getByTestId('tumbling-e')).toHaveAttribute('data-direction', 'up');
  });
});

test('both tests say they are not clinical', () => {
  const { unmount } = render(<ReactionTest onDone={() => {}} />);
  expect(screen.getByText(NOT_CLINICAL)).toBeInTheDocument();
  unmount();
  render(<VisionTest onDone={() => {}} />);
  expect(screen.getByText(NOT_CLINICAL)).toBeInTheDocument();
});

describe('weekly check-in', () => {
  const day49 = { profile: { ...createDemoProfile(), missionDay: 49 } };

  test('weekly results are saved as indicators', async () => {
    const { store } = renderApp(<WeeklyCheckIn random={() => 0} now={(() => { let t = 0; return () => (t += 290); })()} reactionTrials={1} />, day49);
    // Height and strength are entered; the two tests are run.
    await userEvent.type(screen.getByLabelText(/Height/), '179,5');
    await userEvent.click(within(screen.getByRole('radiogroup', { name: /Strength/ })).getByRole('radio', { name: '4' }));

    vi.useFakeTimers();
    try {
      fireEvent.click(screen.getByRole('button', { name: 'Start reaction test' }));
      fireEvent.click(screen.getByRole('button', { name: 'Start' }));
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      fireEvent.pointerDown(screen.getByRole('button', { name: 'Press now' }));
    } finally {
      vi.useRealTimers();
    }
    expect(screen.getByText(/Median 290 ms/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Start vision test' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    for (let i = 0; i < 12; i++) fireEvent.keyDown(window, { key: 'ArrowRight' }); // six levels right, random 0 is "right"
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(screen.getByText(/Level 6 of 8/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Save weekly check-in' }));
    expect(todayEntry(store.state).values).toMatchObject({ reactionMs: 290, visionLevel: 6, heightCm: 179.5, strength: 4 });
    expect(store.state.view).toBe('map');
  });

  test('a wrong height blocks the save and explains', async () => {
    const { store } = renderApp(<WeeklyCheckIn />, day49);
    await userEvent.type(screen.getByLabelText(/Height/), '17');
    await userEvent.click(screen.getByRole('button', { name: 'Save weekly check-in' }));
    expect(screen.getByText('Enter a value between 100 and 230')).toBeInTheDocument();
    expect(store.state.profile.entries.find((e) => e.day === 49)).toBeUndefined();
  });

  test('with nothing entered there is nothing to save', () => {
    renderApp(<WeeklyCheckIn />, day49);
    expect(screen.getByRole('button', { name: 'Save weekly check-in' })).toBeDisabled();
  });

  test('the check-in opens on the weekly part when only that is due', async () => {
    const complete = createDemoProfile();
    complete.entries = complete.entries.map((e) => (e.day === 47 ? { ...e, stepsDone: ['vitals', 'sleepMood', 'symptoms', 'intake', 'radiation'] } : e));
    complete.entries = complete.entries.map((e) => (e.day === 42 ? { ...e, values: { ...e.values, strength: undefined, heightCm: undefined, reactionMs: undefined, visionLevel: undefined } } : e));
    renderApp(<CheckIn />, { profile: JSON.parse(JSON.stringify(complete)) });
    expect(screen.getByRole('heading', { name: 'Weekly check-in' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Daily' }));
    expect(screen.getByRole('heading', { name: 'Daily check-in' })).toBeInTheDocument();
  });

  test('the day summary lists what is due today', async () => {
    renderApp(
      <>
        <Header />
        <MapScreen />
      </>,
      halfDoneState,
    );
    const summary = within(screen.getByRole('region', { name: 'Today' }));
    expect(summary.getByText('Nutrition & exercise, Radiation')).toBeInTheDocument();
    expect(summary.queryByText(/Reaction time/)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Advance one day' }));
    await userEvent.click(screen.getByRole('button', { name: 'Advance one day' }));
    expect(summary.getByText('Strength self-rating, Height, Reaction time, Vision level')).toBeInTheDocument();
  });
});
