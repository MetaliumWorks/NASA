import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SOURCES } from '../../content/sources';
import { Header } from '../Header';
import { MapScreen } from '../map/MapScreen';
import { renderApp } from '../test-helpers';
import { MissionSetup } from './MissionSetup';

const renderSetup = (initial = {}) =>
  renderApp(
    <>
      <Header />
      <MissionSetup />
    </>,
    { view: 'setup', ...initial },
  );
const option = (name: string) => within(screen.getByRole('radio', { name: new RegExp(`^${name}`) }).closest('label')!);
const choose = (name: string) => userEvent.click(screen.getByRole('radio', { name: new RegExp(`^${name}`) }));

test('the three missions are offered and the current one is chosen', () => {
  renderSetup();
  expect(screen.getAllByRole('radio')).toHaveLength(3);
  expect(screen.getByRole('radio', { name: /^Station/ })).toBeChecked();
  expect(option('Station').getByText('180 days')).toBeInTheDocument();
  expect(option('Station').getByText('Real-time support from the ground')).toBeInTheDocument();
  expect(option('Mars').getByText('1095 days')).toBeInTheDocument();
});

test('choosing Mars changes the counter and shows the delay', async () => {
  const { store } = renderSetup();
  await choose('Mars');
  expect(screen.getByText('Flight day 47 of 1095')).toBeInTheDocument();
  expect(option('Mars').getByText('Up to 20 minutes one way')).toBeInTheDocument();
  expect(store.state.profile.mission).toBe('mars');
  expect(within(screen.getByRole('banner')).getByRole('button', { name: 'Mission: Mars' })).toBeInTheDocument();
});

test('choosing Moon clamps day 47 to 30 and shows no comms line', async () => {
  const { store } = renderSetup();
  await choose('Moon');
  expect(screen.getByText('Flight day 30 of 30')).toBeInTheDocument();
  expect(store.state.profile).toMatchObject({ mission: 'moon', missionDay: 30 });
  expect(option('Moon').queryByText(/support|minutes/)).toBeNull();
  expect(option('Moon').getByText(/give no figure/)).toBeInTheDocument();
});

test("Moon duration is marked as the team's setting", () => {
  renderSetup();
  expect(screen.getByText(/30 days \(team setting\)/)).toBeInTheDocument();
  expect(screen.queryByText(/180 days \(team setting\)/)).toBeNull();
});

test('each mission names the hazards it emphasises, and sourced figures link to their page', () => {
  renderSetup();
  expect(option('Station').getByText('Gravity fields, Isolation & confinement')).toBeInTheDocument();
  expect(option('Mars').getByText(/Space radiation, Isolation & confinement, Distance from Earth, Gravity fields, Hostile\/closed environments/)).toBeInTheDocument();
  const marsLinks = option('Mars')
    .getAllByRole('link')
    .map((a) => a.getAttribute('href'));
  expect(marsLinks).toContain(SOURCES['hazard-distance'].url);
});

test('the mission button in the header opens this screen', async () => {
  const { store } = renderApp(
    <>
      <Header />
      <MapScreen />
    </>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Mission: Station' }));
  expect(store.state.view).toBe('setup');
});

test('a region whose hazard the mission emphasises says so', async () => {
  renderApp(<MapScreen />, { selectedRegion: 'bones' }); // gravity: emphasised on the station
  expect(screen.getByText('Emphasised on this mission')).toBeInTheDocument();
});

test('a region whose hazard the mission does not emphasise carries no note', () => {
  renderApp(<MapScreen />, { selectedRegion: 'lungs' }); // hostile/closed environments: not on the station list
  expect(screen.queryByText('Emphasised on this mission')).toBeNull();
});
