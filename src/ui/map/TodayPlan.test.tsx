import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { findRecommendation, REGION_ORDER, REGIONS } from '../../content/regions';
import { reducer } from '../../state/store';
import { Header } from '../Header';
import { demoState, renderApp } from '../test-helpers';
import { MapScreen } from './MapScreen';
import { planText, TodayPlan } from './TodayPlan';

const EMPTY = 'Nothing planned yet. Open a flagged system and tick what you will do.';
const renderMap = (initial = {}) =>
  renderApp(
    <>
      <Header />
      <MapScreen />
    </>,
    initial,
  );
const plan = () => within(screen.getByRole('region', { name: 'Today’s plan' }));

test('every recommendation can be found by its id', () => {
  for (const region of REGION_ORDER) {
    for (const r of REGIONS[region].recommendations) expect(findRecommendation(r.id), r.id).toBeDefined();
  }
  expect(findRecommendation('dailyExercise')).toBe(REGIONS.bones.recommendations.find((r) => r.id === 'dailyExercise'));
  expect(findRecommendation('nope')).toBeUndefined();
});

test('a ground-report item names its system in the plan', () => {
  expect(planText('groundReport-kidneys')).toBe('Add Kidneys to the next ground report');
  expect(planText('dailyExercise')).toBe('Do 1.5 h of resistance and aerobic exercise.');
  expect(planText('nope')).toBe('nope');
});

test('an empty plan says how to fill it', () => {
  renderApp(<TodayPlan />);
  expect(screen.getByText(EMPTY)).toBeInTheDocument();
});

test("ticked recommendations appear in today's plan and can be completed", async () => {
  const { store } = renderMap({ selectedRegion: 'bones' });
  const bones = within(screen.getByRole('region', { name: 'Bones' }));
  const boxes = bones.getAllByRole('checkbox');
  await userEvent.click(boxes[1]);
  await userEvent.click(boxes[2]);
  await userEvent.click(bones.getByRole('button', { name: "Add 2 to today's plan" }));
  await userEvent.click(screen.getByRole('button', { name: 'Back to today' }));

  expect(plan().getAllByRole('checkbox')).toHaveLength(2);
  const exercise = plan().getByRole('checkbox', { name: 'Do 1.5 h of resistance and aerobic exercise.' });
  expect(exercise).not.toBeChecked();
  await userEvent.click(exercise);
  expect(exercise).toBeChecked();
  expect(store.state.profile.plan).toEqual([
    { day: 47, recommendationId: 'dailyExercise', done: true },
    { day: 47, recommendationId: 'drinkToPlan', done: false },
  ]);
  expect(plan().getByText('1 of 2 done')).toBeInTheDocument();
});

test("yesterday's plan is not shown after advancing a day", async () => {
  const planned = reducer(demoState, { type: 'planAdd', ids: ['dailyExercise', 'groundReport-kidneys'] });
  renderMap(planned);
  expect(plan().getByRole('checkbox', { name: 'Add Kidneys to the next ground report' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Advance one day' }));
  expect(plan().getByText(EMPTY)).toBeInTheDocument();
  expect(plan().queryByRole('checkbox')).toBeNull();
});
