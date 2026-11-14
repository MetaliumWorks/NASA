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

describe('a new profile', () => {
  const form = () => within(screen.getByRole('form', { name: 'Start a new profile' }));
  const start = () => userEvent.click(form().getByRole('button', { name: 'Start profile' }));

  test('starts on day 1 with its baselines and without the simulated tag', async () => {
    const { store } = renderSetup();
    await userEvent.type(form().getByLabelText('Name'), 'Ada');
    await userEvent.type(form().getByLabelText(/^Heart rate/), '58');
    await userEvent.type(form().getByLabelText(/^Body temperature/), '36,6');
    await userEvent.type(form().getByLabelText(/^Mood/), '4');
    await start();
    expect(screen.getByText('Flight day 1 of 180')).toBeInTheDocument();
    expect(screen.queryByText('Simulated data')).toBeNull();
    expect(store.state.profile).toEqual({
      name: 'Ada',
      simulated: false,
      mission: 'station',
      missionDay: 1,
      baseline: { heartRate: 58, bodyTemp: 36.6, mood: 4 },
      entries: [],
      plan: [],
    });
    expect(store.state.view).toBe('map');
  });

  test('can start on another mission', async () => {
    const { store } = renderSetup();
    await userEvent.type(form().getByLabelText('Name'), 'Ada');
    await userEvent.selectOptions(form().getByLabelText('Mission'), 'Mars');
    await start();
    expect(screen.getByText('Flight day 1 of 1095')).toBeInTheDocument();
    expect(store.state.profile.mission).toBe('mars');
  });

  test('an invalid baseline blocks the save and explains', async () => {
    const { store } = renderSetup();
    await userEvent.type(form().getByLabelText('Name'), 'Ada');
    await userEvent.type(form().getByLabelText(/^Heart rate/), '400');
    await userEvent.type(form().getByLabelText(/^Sleep/), 'eight');
    await start();
    expect(form().getByText('Enter a value between 30 and 220')).toBeInTheDocument();
    expect(form().getByText('Enter a number')).toBeInTheDocument();
    expect(form().getByLabelText(/^Heart rate/)).toHaveFocus();
    expect(store.state.profile.name).toBe('Crew 03');
    expect(screen.getByText('Simulated data')).toBeInTheDocument();
  });

  test('a name is required', async () => {
    const { store } = renderSetup();
    await userEvent.type(form().getByLabelText('Name'), '   ');
    await start();
    expect(form().getByText('Enter a name')).toBeInTheDocument();
    expect(store.state.profile.name).toBe('Crew 03');
  });

  test('offers a baseline for every indicator that is compared with one', () => {
    renderSetup();
    for (const label of ['Heart rate', 'Blood pressure, systolic', 'Blood pressure, diastolic', 'Blood sugar', 'Body temperature', 'Sleep', 'Mood', 'Water', 'Appetite', 'Strength self-rating', 'Height', 'Reaction time', 'Vision level']) {
      expect(form().getByLabelText(new RegExp(`^${label}`))).toBeInTheDocument();
    }
    expect(form().queryByLabelText(/^Exercise/)).toBeNull();
    expect(form().queryByLabelText(/^Radiation dose/)).toBeNull();
  });

  test('replacing a real profile that has entries asks first', async () => {
    const real = { name: 'Ada', simulated: false, mission: 'station' as const, missionDay: 3, baseline: {}, plan: [], entries: [{ day: 1, values: { heartRate: 60 }, symptoms: [], stepsDone: [] }] };
    const { store } = renderSetup({ profile: real });
    await userEvent.type(form().getByLabelText('Name'), 'Grace');
    await start();
    expect(form().getByText(/Tick the box to replace/)).toBeInTheDocument();
    expect(store.state.profile.name).toBe('Ada');
    await userEvent.click(form().getByRole('checkbox', { name: /Replace Ada/ }));
    await start();
    expect(store.state.profile.name).toBe('Grace');
  });

  test('Reset demo always returns to the demo profile', async () => {
    const real = { name: 'Ada', simulated: false, mission: 'mars' as const, missionDay: 3, baseline: {}, plan: [], entries: [] };
    const { store } = renderSetup({ profile: real });
    await userEvent.click(screen.getByRole('button', { name: 'Reset demo' }));
    expect(store.state.profile.name).toBe('Crew 03');
    expect(store.state.profile.simulated).toBe(true);
    expect(screen.getByText('Simulated data')).toBeInTheDocument();
  });
});
