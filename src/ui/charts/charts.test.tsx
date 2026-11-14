import { render, screen } from '@testing-library/react';
import { SymptomStrip } from './SymptomStrip';
import { TrendChart } from './TrendChart';
import { WeekBars } from './WeekBars';

describe('TrendChart', () => {
  test('draws one line through every point and labels the last value', () => {
    const { container } = render(
      <TrendChart
        label="Water"
        unit="L"
        baseline={2.4}
        missionDay={47}
        points={[
          { day: 45, value: 1.3 },
          { day: 46, value: 1.1 },
        ]}
      />,
    );
    const line = container.querySelector('[data-testid="trend-line"]')!;
    expect(line.getAttribute('points')!.trim().split(/\s+/)).toHaveLength(2);
    expect(container.querySelector('[data-testid="baseline"]')).not.toBeNull();
    expect(screen.getByRole('img')).toHaveAccessibleName('Water, latest 1.1 L, baseline 2.4 L');
    expect(screen.getByText('1.1')).toBeInTheDocument();
  });

  test('later days are further right and higher values are further up', () => {
    const { container } = render(
      <TrendChart
        label="Heart rate"
        unit="bpm"
        missionDay={47}
        points={[
          { day: 1, value: 60 },
          { day: 47, value: 70 },
        ]}
      />,
    );
    const [[x1, y1], [x2, y2]] = container
      .querySelector('[data-testid="trend-line"]')!
      .getAttribute('points')!
      .trim()
      .split(/\s+/)
      .map((p) => p.split(',').map(Number));
    expect(x2).toBeGreaterThan(x1);
    expect(y2).toBeLessThan(y1);
    expect(screen.getByRole('img')).toHaveAccessibleName('Heart rate, latest 70 bpm');
  });

  test('with no data says so', () => {
    const { container } = render(<TrendChart label="Water" unit="L" missionDay={1} points={[]} />);
    expect(screen.getByText('No data yet')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="trend-line"]')).toBeNull();
    expect(container.innerHTML).not.toMatch(/NaN/);
    expect(screen.getByRole('img')).toHaveAccessibleName('Water, no data yet');
  });

  test('one reading on day 1, equal to its baseline, draws without NaN', () => {
    const { container } = render(
      <TrendChart label="Mood" unit="1–5" baseline={4} missionDay={1} points={[{ day: 1, value: 4 }]} />,
    );
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    expect(screen.getByRole('img')).toHaveAccessibleName('Mood, latest 4 of 5, baseline 4 of 5');
  });
});

describe('WeekBars', () => {
  test('shows seven days and the total', () => {
    const { container } = render(<WeekBars label="Exercise" unit="h" target={1.5} values={[1.5, 1, 0.5, 1.5, 1, 0, 1]} />);
    expect(container.querySelectorAll('[data-testid="bar"]')).toHaveLength(7);
    expect(screen.getByRole('img')).toHaveAccessibleName('Exercise, 6.5 h over 7 days, target 1.5 h per day');
  });

  test('a bar at the target is full height and an empty day has no height', () => {
    const { container } = render(<WeekBars label="Exercise" unit="h" target={1.5} values={[1.5, 0.75, 0, null, 1.5, 1.5, 1.5]} />);
    const heights = [...container.querySelectorAll('[data-testid="bar"]')].map((b) => Number(b.getAttribute('height')));
    expect(heights[1]).toBeCloseTo(heights[0] / 2);
    expect(heights[2]).toBe(0);
    expect(heights[3]).toBe(0);
    expect(container.querySelectorAll('[data-testid="bar"][data-empty="true"]')).toHaveLength(1);
    expect(screen.getByRole('img')).toHaveAccessibleName('Exercise, 6.8 h over 6 recorded days, target 1.5 h per day');
  });

  test('with no entries says so', () => {
    const { container } = render(<WeekBars label="Exercise" unit="h" target={1.5} values={[null, null, null, null, null, null, null]} />);
    expect(screen.getByText('No data yet')).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/NaN/);
  });
});

describe('SymptomStrip', () => {
  test('marks only the reported days', () => {
    const { container } = render(<SymptomStrip label="Trouble sleeping" reportedDays={[41, 43, 45, 2]} endDay={47} />);
    expect(container.querySelectorAll('[data-testid="cell"]')).toHaveLength(30);
    expect(container.querySelectorAll('[data-testid="cell"][data-on="true"]')).toHaveLength(3); // day 2 is outside the window
    expect(screen.getByRole('img')).toHaveAccessibleName('Trouble sleeping, reported on 3 of 30 days');
  });

  test('the newest day is the last cell', () => {
    const { container } = render(<SymptomStrip label="Headache" reportedDays={[47]} endDay={47} span={7} />);
    const cells = [...container.querySelectorAll('[data-testid="cell"]')];
    expect(cells).toHaveLength(7);
    expect(cells.map((c) => c.getAttribute('data-on'))).toEqual(['false', 'false', 'false', 'false', 'false', 'false', 'true']);
  });

  test('days before the mission began are marked as such', () => {
    const { container } = render(<SymptomStrip label="Motion sickness" reportedDays={[1, 2]} endDay={5} />);
    expect(container.querySelectorAll('[data-testid="cell"][data-before="true"]')).toHaveLength(25);
    expect(container.querySelectorAll('[data-testid="cell"][data-on="true"]')).toHaveLength(2);
  });
});
