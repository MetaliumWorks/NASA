import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createDemoProfile, emptyProfile } from '../../domain/demo';
import { Header } from '../Header';
import { MapScreen } from '../map/MapScreen';
import { renderApp } from '../test-helpers';
import { Review } from './Review';

const row = (name: string) => within(screen.getByRole('row', { name: new RegExp(`^${name}`) }));

test('the week view shows symptom days, flagged days and long-term labels', () => {
  renderApp(<Review />);
  expect(screen.getByRole('button', { name: 'Week' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText('Flight days 41 to 47')).toBeInTheDocument();
  const brain = row('Brain, mind & sleep');
  expect(brain.getByText('Trouble sleeping · 3 of 7 days')).toBeInTheDocument();
  expect(brain.getByText('recurring')).toBeInTheDocument();
  expect(row('Kidneys').getByText('1 day at warning, 1 at caution')).toBeInTheDocument();
  expect(row('Bones').getByText('2 days at caution')).toBeInTheDocument();
  expect(row('Heart & vessels').getByText('No flagged days')).toBeInTheDocument();
  expect(screen.getAllByRole('row')).toHaveLength(13); // 12 systems and the header row
});

test('each indicator is compared with the period before and the baseline', () => {
  renderApp(<Review />);
  const water = within(row('Kidneys').getByRole('group', { name: 'Water' }));
  expect(water.getByText(/^This week/)).toHaveTextContent(/This week 1\.\d L/);
  expect(water.getByText(/^Week before/)).toHaveTextContent(/Week before 2\.\d L/);
  expect(water.getByText(/^Baseline/)).toHaveTextContent('Baseline 2.4 L');
});

test('the month view looks back 30 days', async () => {
  renderApp(<Review />);
  await userEvent.click(screen.getByRole('button', { name: 'Month' }));
  expect(screen.getByText('Flight days 18 to 47')).toBeInTheDocument();
  expect(row('Brain, mind & sleep').getByText('Trouble sleeping · 3 of 30 days')).toBeInTheDocument();
  expect(within(row('Kidneys').getByRole('group', { name: 'Water' })).getByText(/^Month before/)).toBeInTheDocument();
});

test('an empty profile reviews without numbers going wrong', () => {
  const { container } = renderApp(<Review />, { profile: emptyProfile('New crew', 'station', {}) });
  expect(screen.getByText('Flight day 1')).toBeInTheDocument();
  expect(container.textContent).not.toMatch(/NaN|undefined|Infinity/);
});

test('the day summary announces a review when one is due and opens it', async () => {
  const { store } = renderApp(
    <>
      <Header />
      <MapScreen />
    </>,
  );
  expect(screen.queryByRole('button', { name: /review ready/ })).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'Advance one day' }));
  await userEvent.click(screen.getByRole('button', { name: 'Advance one day' }));
  expect(screen.getByText('Flight day 49 of 180')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Weekly review ready' }));
  expect(store.state.view).toBe('review');
});

test('day 60 brings a monthly review, which opens on the month', () => {
  renderApp(<Review />, { profile: { ...createDemoProfile(), missionDay: 60 } });
  expect(screen.getByRole('button', { name: 'Month' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText('Flight days 31 to 60')).toBeInTheDocument();
});
