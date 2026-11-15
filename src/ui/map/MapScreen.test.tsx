import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SOURCES } from '../../content/sources';
import { emptyProfile } from '../../domain/demo';
import { ORGANS } from '../../figure/layout';
import type { AppState } from '../../state/store';
import { Header } from '../Header';
import { renderApp } from '../test-helpers';
import { MapScreen } from './MapScreen';

const renderMap = (initial?: Partial<AppState>) =>
  renderApp(
    <>
      <Header />
      <MapScreen />
    </>,
    initial,
  );
const panel = (name: string) => within(screen.getByRole('region', { name }));
const index = () => within(screen.getByRole('navigation', { name: 'Body systems' }));

describe('header', () => {
  test('carries the demo context on screen', () => {
    renderMap();
    for (const t of ['Simulated data', 'Flight day 47 of 180', 'Check-in 5 of 5', 'Streak 13 d']) {
      expect(screen.getByText(t)).toBeInTheDocument();
    }
    expect(screen.getByRole('heading', { level: 1, name: 'Crew Health' })).toBeInTheDocument();
  });

  test('Advance one day moves the mission on and stops at its last day', async () => {
    const { store } = renderMap();
    await userEvent.click(screen.getByRole('button', { name: 'Advance one day' }));
    expect(screen.getByText('Flight day 48 of 180')).toBeInTheDocument();
    expect(screen.getByText('Check-in 0 of 5')).toBeInTheDocument();
    expect(store.state.profile.missionDay).toBe(48);
  });

  test('the last day of the mission cannot be advanced', () => {
    renderMap({ profile: { ...emptyProfile('A', 'moon', {}), missionDay: 30 } });
    expect(screen.getByRole('button', { name: 'Advance one day' })).toBeDisabled();
  });
});

describe('day summary', () => {
  test('with nothing selected the panel summarises the day', () => {
    renderMap();
    const summary = panel('Today');
    expect(summary.getByText('3 systems need attention')).toBeInTheDocument();
    expect(summary.getByRole('button', { name: /Kidneys.*Warning/ })).toBeInTheDocument();
    expect(summary.getByRole('button', { name: /Bones.*Caution/ })).toBeInTheDocument();
    expect(summary.getByRole('button', { name: /Brain, mind & sleep.*Caution/ })).toBeInTheDocument();
    expect(summary.getByText(/5 of 5 steps/)).toBeInTheDocument();
  });

  test('a flagged system opens from the summary', async () => {
    renderMap();
    await userEvent.click(panel('Today').getByRole('button', { name: /Kidneys/ }));
    expect(screen.getByRole('heading', { name: 'Kidneys' })).toBeInTheDocument();
  });

  test('a quiet day says all systems are nominal', () => {
    renderMap({ profile: emptyProfile('New crew', 'station', {}) });
    expect(screen.getByText('All 12 systems nominal')).toBeInTheDocument();
  });
});

describe('region panel', () => {
  test('selecting Bones shows findings, a sourced impression and tickable recommendations', async () => {
    const { store } = renderMap({ selectedRegion: 'bones' });
    const bones = panel('Bones');
    expect(bones.getByRole('heading', { name: 'Bones' })).toBeInTheDocument();
    expect(bones.getByRole('heading', { name: 'Bones' }).parentElement).toHaveTextContent('Caution');
    expect(bones.getByText('6.5 of 10.5 h over the last 7 days')).toBeInTheDocument();
    expect(bones.getByText('62% of target')).toBeInTheDocument();
    expect(bones.getByRole('img', { name: 'Exercise, 6.5 h over 7 days, target 1.5 h per day' })).toBeInTheDocument();
    expect(bones.getByText('Expected density loss by day 47').closest('div')).toHaveTextContent('1.6–2.4%');
    expect(bones.getByText('Caused by: Gravity fields')).toBeInTheDocument();
    expect(bones.getAllByRole('link').some((a) => a.getAttribute('href') === SOURCES['risk-bone'].url)).toBe(true);
    bones.getAllByRole('link').forEach((a) => expect(a).toHaveAttribute('target', '_blank'));

    const boxes = bones.getAllByRole('checkbox');
    expect(bones.getByRole('button', { name: 'Nothing selected' })).toBeDisabled();
    await userEvent.click(boxes[0]);
    await userEvent.click(boxes[1]);
    const add = bones.getByRole('button', { name: "Add 2 to today's plan" });
    expect(add).toBeEnabled();
    await userEvent.click(add);
    expect(store.state.profile.plan).toEqual([
      { day: 47, recommendationId: 'resistiveExercise', done: false },
      { day: 47, recommendationId: 'dailyExercise', done: false },
    ]);
    expect(bones.getByRole('button', { name: 'Nothing selected' })).toBeDisabled();
    expect(bones.getAllByText('In today’s plan')).toHaveLength(2);
  });

  test('with no recommendation ticked the button is disabled', () => {
    renderMap({ selectedRegion: 'muscles' });
    const muscles = panel('Muscles');
    expect(muscles.getByRole('button', { name: 'Nothing selected' })).toBeDisabled();
    expect(muscles.queryByRole('checkbox', { name: /ground report/ })).toBeNull(); // not flagged
    expect(muscles.getByRole('heading', { name: 'Muscles' }).parentElement).toHaveTextContent('Nominal');
  });

  test('a long-term flag explains itself and pre-ticks the ground report', () => {
    renderMap({ selectedRegion: 'brain' });
    const brain = panel('Brain, mind & sleep');
    expect(brain.getByText('Reported on 3 of the last 7 days')).toBeInTheDocument();
    expect(brain.getByText('recurring')).toBeInTheDocument();
    expect(brain.getByRole('checkbox', { name: /Add to the next ground report/ })).toBeChecked();
    expect(brain.getByRole('button', { name: "Add 1 to today's plan" })).toBeEnabled();
    expect(brain.getByRole('img', { name: 'Trouble sleeping, reported on 3 of 30 days' })).toBeInTheDocument();
    expect(brain.getByText('Caused by: Isolation & confinement, Space radiation')).toBeInTheDocument();
  });

  test('a flagged region without a long-term finding lists the ground report unticked', () => {
    renderMap({ selectedRegion: 'kidneys' });
    expect(panel('Kidneys').getByRole('checkbox', { name: /Add to the next ground report/ })).not.toBeChecked();
  });

  test('a region without a sourced function line shows none', () => {
    renderMap({ selectedRegion: 'kidneys' });
    expect(screen.queryByText(/^What it does/)).toBeNull();
  });

  test('a region with a sourced function line shows it with its source', () => {
    renderMap({ selectedRegion: 'spine' });
    const line = panel('Spine').getByText(/^What it does/).closest('p')!;
    expect(line).toHaveTextContent('structural support for vital organs');
    expect(within(line).getByRole('link')).toHaveAttribute('href', SOURCES['past-spinal-health'].url);
  });

  test('every impression and every recommendation carries a source link', () => {
    renderMap({ selectedRegion: 'heart' });
    const heart = panel('Heart & vessels');
    const hrefs = heart.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs.filter((h) => h === SOURCES['risk-cardiovascular'].url).length).toBeGreaterThanOrEqual(3);
    expect(hrefs).toContain(SOURCES['csa-body-infographic'].url);
  });

  test('exercise is shown under Muscles for information only', () => {
    renderMap({ selectedRegion: 'muscles' });
    const muscles = panel('Muscles');
    expect(muscles.getByText('Exercise')).toBeInTheDocument();
    expect(muscles.getByText(/Decides the status of Bones/)).toBeInTheDocument();
  });

  test('radiation shows the total logged dose instead of a status', () => {
    renderMap({ selectedRegion: 'radiation' });
    const radiation = panel('Radiation');
    const total = radiation.getByText('Total logged dose').closest('p')!;
    expect(total).toHaveTextContent(/\d+(\.\d)? mSv/);
    expect(radiation.queryByText('Nominal')).toBeNull();
    expect(radiation.getByText('Recorded only. The sources give no limit.')).toBeInTheDocument();
  });

  test('says at the point of use that the limits are the team’s own, and leads to them', async () => {
    const { store } = renderMap({ selectedRegion: 'kidneys' });
    const kidneys = panel('Kidneys');
    expect(kidneys.getByText('The limits behind a status are the team’s own settings, not NASA values.')).toBeInTheDocument();
    await userEvent.click(kidneys.getByRole('button', { name: 'See all limits' }));
    expect(store.state.view).toBe('sources');
  });

  test('radiation, which has no limit, does not mention limits', () => {
    renderMap({ selectedRegion: 'radiation' });
    expect(panel('Radiation').queryByText(/team’s own settings/)).toBeNull();
  });

  test('Back to today returns to the summary', async () => {
    renderMap({ selectedRegion: 'kidneys' });
    await userEvent.click(screen.getByRole('button', { name: 'Back to today' }));
    expect(screen.getByText('3 systems need attention')).toBeInTheDocument();
  });
});

describe('system index and figure', () => {
  test('the system index lists all 12 and selects on click', async () => {
    renderMap();
    expect(index().getAllByRole('button')).toHaveLength(12);
    expect(index().getByRole('button', { name: 'Kidneys Warning' })).toBeInTheDocument();
    expect(index().getByRole('button', { name: 'Eyes Nominal' })).toBeInTheDocument();
    await userEvent.click(index().getByRole('button', { name: /Kidneys/ }));
    expect(screen.getByRole('heading', { name: 'Kidneys' })).toBeInTheDocument();
    expect(index().getByRole('button', { name: /Kidneys/ })).toHaveAttribute('aria-pressed', 'true');
  });

  test('the figure shows the three flagged systems of the demo', () => {
    renderMap();
    expect(screen.getByRole('img', { name: /^Body scan\./ })).toHaveAccessibleName(
      'Body scan. Kidneys: warning. Brain, mind & sleep: caution. Bones: caution. 9 systems nominal.',
    );
    expect(screen.getByText('3 flagged')).toBeInTheDocument();
  });

  test('clicking an organ on the figure opens its panel', async () => {
    const { container } = renderMap();
    await userEvent.click(container.querySelector('image[data-region="kidneys"]')!);
    expect(screen.getByRole('heading', { name: 'Kidneys' })).toBeInTheDocument();
  });

  test('Show organs reveals every organ and is remembered', async () => {
    const { container, store } = renderMap();
    expect(container.querySelectorAll('image[data-region]').length).toBeLessThan(ORGANS.length);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Show organs' }));
    expect(container.querySelectorAll('image[data-region]')).toHaveLength(ORGANS.length);
    expect(store.state.showOrgans).toBe(true);
  });
});

describe('an empty profile on day 1', () => {
  test('renders without numbers going wrong', () => {
    const { container } = renderMap({ profile: emptyProfile('New crew', 'station', {}), selectedRegion: 'heart' });
    expect(screen.getByText('Flight day 1 of 180')).toBeInTheDocument();
    expect(screen.getAllByText('No data yet').length).toBeGreaterThan(0);
    expect(screen.getAllByText('due').length).toBe(3);
    expect(container.textContent).not.toMatch(/NaN|undefined|Infinity/);
    expect(screen.queryByText('Simulated data')).toBeNull();
    expect(screen.getByText('Streak 0 d')).toBeInTheDocument();
  });

  test('every region opens without numbers going wrong', async () => {
    const { container } = renderMap({ profile: emptyProfile('New crew', 'station', {}) });
    for (const button of index().getAllByRole('button')) {
      await userEvent.click(button);
      expect(container.textContent).not.toMatch(/NaN|undefined|Infinity/);
    }
  });
});

describe('doctor-like additions', () => {
  test('a flagged system names the condition its findings match, with its source and what points to it', () => {
    renderMap({ selectedRegion: 'kidneys' });
    const kidneys = panel('Kidneys');
    expect(kidneys.getByText('Risk: Dehydration.')).toBeInTheDocument();
    expect(kidneys.getByText('Points to it: Water: 3-day average 1.3 L, 53% of baseline.')).toBeInTheDocument();
    expect(kidneys.getByText(/Neither is a diagnosis/)).toBeInTheDocument();
  });

  test('a nominal system names no condition', () => {
    renderMap({ selectedRegion: 'heart' });
    expect(panel('Heart & vessels').queryByText(/^Possible:/)).toBeNull();
  });

  test('the day summary shows what was reported to the ground today and leads to the symptom check', async () => {
    const { store } = renderMap();
    const summary = panel('Today');
    expect(summary.getByText('Urgent: Kidneys')).toBeInTheDocument();
    await userEvent.click(summary.getByRole('button', { name: 'Start a symptom check' }));
    expect(store.state.view).toBe('check');
  });

  test('a day with nothing reported says so', () => {
    renderMap({ profile: emptyProfile('New crew', 'station', {}) });
    expect(screen.getByText('Nothing was reported to the ground today.')).toBeInTheDocument();
  });
});
