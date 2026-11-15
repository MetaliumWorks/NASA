import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Shell } from '../App';
import { emptyProfile } from '../domain/demo';
import { halfDoneState, renderApp } from './test-helpers';

const tabs = () => within(screen.getByRole('navigation', { name: 'Screens' }));

test('with today’s check-in done, the app opens on the body map and every screen is open', () => {
  renderApp(<Shell />);
  expect(screen.getByRole('region', { name: 'Body map' })).toBeInTheDocument();
  tabs()
    .getAllByRole('button')
    .forEach((tab) => expect(tab).toBeEnabled());
});

test('a new day locks the app on the check-in until it is done', async () => {
  const { store } = renderApp(<Shell />);
  await userEvent.click(screen.getByRole('button', { name: 'Advance one day' }));
  expect(screen.getByRole('heading', { name: 'Daily check-in' })).toBeInTheDocument();
  expect(screen.getByText('The daily check-in is required.')).toBeInTheDocument();
  expect(store.state.view).toBe('map'); // the map was asked for; the check-in is shown instead
  for (const name of ['Body map', 'Review', 'Symptom log', 'Ground link', 'Sources']) expect(tabs().getByRole('button', { name })).toBeDisabled();
  for (const name of ['Check-in', 'Symptom check']) expect(tabs().getByRole('button', { name })).toBeEnabled();
  expect(tabs().getByRole('button', { name: 'Check-in' })).toHaveAttribute('aria-current', 'page');
});

test('the weekly part waits for the daily one', () => {
  renderApp(<Shell />, halfDoneState);
  expect(screen.getByRole('button', { name: /^Weekly/ })).toBeDisabled();
});

test('while locked, the symptom check and the mission screen stay open', async () => {
  renderApp(<Shell />, halfDoneState);
  await userEvent.click(screen.getByRole('button', { name: 'Start a symptom check' }));
  expect(screen.getByRole('heading', { name: 'Symptom check' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Mission: Station' }));
  expect(screen.getByRole('heading', { name: 'Mission' })).toBeInTheDocument();
});

test('finishing the check-in shows what it found, then unlocks the app', async () => {
  const { store } = renderApp(<Shell />, { ...halfDoneState, view: 'map' });
  expect(screen.getByRole('heading', { name: 'Nutrition & exercise' })).toBeInTheDocument();
  for (let i = 0; i < 2; i++) {
    await userEvent.click(screen.getByRole('button', { name: 'Fill with simulated readings' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
  }
  expect(screen.getByRole('region', { name: 'What today’s check-in found' })).toBeInTheDocument();
  expect(tabs().getByRole('button', { name: 'Body map' })).toBeEnabled();
  await userEvent.click(screen.getByRole('button', { name: 'Go to body map' }));
  expect(screen.getByRole('region', { name: 'Body map' })).toBeInTheDocument();
  expect(store.state.view).toBe('map');
});

test('a whole simulated day can be checked in with five fills', async () => {
  const { store } = renderApp(<Shell />);
  await userEvent.click(screen.getByRole('button', { name: 'Advance one day' }));
  for (let i = 0; i < 5; i++) {
    await userEvent.click(screen.getByRole('button', { name: 'Fill with simulated readings' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
  }
  expect(screen.getByRole('region', { name: 'What today’s check-in found' })).toBeInTheDocument();
  expect(store.state.profile.entries.at(-1)).toMatchObject({ day: 48, symptoms: [] });
  expect(store.state.profile.entries.at(-1)?.stepsDone).toHaveLength(5);
});

test('a new profile starts locked on its first check-in', () => {
  renderApp(<Shell />, { profile: emptyProfile('New crew', 'station', {}), view: 'map' });
  expect(screen.getByRole('heading', { name: 'Daily check-in' })).toBeInTheDocument();
  expect(tabs().getByRole('button', { name: 'Body map' })).toBeDisabled();
});

test('Advance one day stays available while locked, and the missed day is reported', async () => {
  const { store } = renderApp(<Shell />, halfDoneState);
  await userEvent.click(screen.getByRole('button', { name: 'Advance one day' }));
  expect(screen.getByText('Flight day 48 of 180')).toBeInTheDocument();
  expect(store.state.profile.outbox?.at(-1)?.subject).toBe('Missed check-in: flight day 47');
});
