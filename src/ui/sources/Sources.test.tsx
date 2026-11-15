import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CONDITIONS } from '../../content/conditions';
import { INDICATORS } from '../../content/indicators';
import { SOURCES } from '../../content/sources';
import { createDemoProfile } from '../../domain/demo';
import { ALL_INDICATORS } from '../../domain/types';
import { renderApp } from '../test-helpers';
import { Sources } from './Sources';

test('every source is listed with its link', () => {
  renderApp(<Sources />);
  expect(Object.keys(SOURCES)).toHaveLength(51);
  Object.values(SOURCES).forEach((s) => {
    const link = screen.getByRole('link', { name: s.title });
    expect(link).toHaveAttribute('href', s.url);
    expect(link).toHaveAttribute('target', '_blank');
  });
});

test('sources are grouped under NASA and CSA', () => {
  renderApp(<Sources />);
  const nasa = within(screen.getByRole('region', { name: /^NASA/ }));
  const csa = within(screen.getByRole('region', { name: /^CSA/ }));
  expect(nasa.getAllByRole('link')).toHaveLength(Object.values(SOURCES).filter((s) => s.org === 'NASA').length);
  expect(csa.getAllByRole('link')).toHaveLength(Object.values(SOURCES).filter((s) => s.org === 'CSA').length);
  expect(csa.getByRole('link', { name: SOURCES['csa-radiation'].title })).toBeInTheDocument();
});

test("thresholds are declared as the team's own", () => {
  renderApp(<Sources />);
  expect(screen.getByText("These limits are the team's own settings, not NASA values.")).toBeInTheDocument();
});

test('artwork is credited', () => {
  renderApp(<Sources />);
  expect(
    screen.getByText(
      'Skeleton drawing by Mariana Ruiz Villarreal; unlabelled edition and organ drawings by Mikael Häggström. Public domain, via Wikimedia Commons.',
    ),
  ).toBeInTheDocument();
});

test('threshold table reads from the settings', () => {
  renderApp(<Sources />);
  const table = within(screen.getByRole('table', { name: 'Daily limits' }));
  expect(table.getByRole('row', { name: /Heart rate.*15%.*25%/ })).toBeInTheDocument();
  expect(table.getByRole('row', { name: /Body temperature.*0\.5 °C.*1 °C/ })).toBeInTheDocument();
  expect(table.getByRole('row', { name: /Sleep.*1 h below.*2 h below/ })).toBeInTheDocument();
  expect(table.getByRole('row', { name: /Water.*80%.*60%/ })).toBeInTheDocument();
  expect(table.getByRole('row', { name: /Exercise.*80%.*50%.*10\.5 h/ })).toBeInTheDocument();
  expect(table.getByRole('row', { name: /Height.*3%.*none/ })).toBeInTheDocument();
  expect(table.getByRole('row', { name: /Radiation dose.*no limit/i })).toBeInTheDocument();
  // one row per indicator, plus the header row
  expect(table.getAllByRole('row')).toHaveLength(ALL_INDICATORS.length + 1);
  ALL_INDICATORS.forEach((id) => expect(table.getByRole('rowheader', { name: INDICATORS[id].label })).toBeInTheDocument());
});

test('long-term checks are listed with their windows', () => {
  renderApp(<Sources />);
  const table = within(screen.getByRole('table', { name: 'Long-term checks' }));
  expect(table.getByRole('row', { name: /recurring.*3 of the last 7 days.*Caution/i })).toBeInTheDocument();
  expect(table.getByRole('row', { name: /persistent.*10 of the last 30 days.*Warning/i })).toBeInTheDocument();
  expect(table.getByRole('row', { name: /sustained.*15 of the last 30 days.*Warning/i })).toBeInTheDocument();
  expect(table.getByRole('row', { name: /trending.*Caution/i })).toBeInTheDocument();
});

test('simulated data is explained and the demo can be reset', async () => {
  const changed = { ...createDemoProfile(), missionDay: 60 };
  const { store } = renderApp(<Sources />, { profile: changed, view: 'sources' });
  expect(screen.getByRole('heading', { name: 'Simulated data' })).toBeInTheDocument();
  expect(screen.getByText(/not measured on a person/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Reset demo' }));
  expect(store.state.profile).toEqual(createDemoProfile());
  expect(store.state.view).toBe('map');
});

test('the app says it does not diagnose', () => {
  renderApp(<Sources />);
  expect(screen.getByText(/does not diagnose/)).toBeInTheDocument();
});

test('critical limits are listed beside the others, twice as far as the warning', () => {
  renderApp(<Sources />);
  const table = within(screen.getByRole('table', { name: 'Daily limits' }));
  expect(table.getByRole('row', { name: /Heart rate.*±25% from baseline.*±50% from baseline/ })).toBeInTheDocument();
  expect(table.getByRole('row', { name: /Body temperature.*2 °C above baseline$/ })).toBeInTheDocument();
  expect(table.getByRole('row', { name: /Water.*20% of baseline or less/ })).toBeInTheDocument();
  expect(table.getByRole('row', { name: /Mood.*none$/ })).toBeInTheDocument();
});

test('every possible condition is listed with its signs and source, and declared not a diagnosis', () => {
  renderApp(<Sources />);
  const table = within(screen.getByRole('table', { name: 'Possible conditions' }));
  expect(table.getAllByRole('row')).toHaveLength(CONDITIONS.length + 1);
  expect(table.getByRole('row', { name: /Mild hypoxia.*2 of: Headache, Confusion, Blurred vision, Trouble sleeping/ })).toBeInTheDocument();
  expect(table.getByRole('row', { name: /Dehydration.*Water below its limit/ })).toBeInTheDocument();
  expect(table.getByRole('row', { name: /Decompression sickness.*always reported/ })).toBeInTheDocument();
  expect(screen.getByText(/Either is a match with the sources, not a diagnosis/)).toBeInTheDocument();
  expect(screen.getAllByText('shown as Risk')).toHaveLength(2);
});

test('the ground link is declared simulated', () => {
  renderApp(<Sources />);
  expect(screen.getByText(/The link to the ground is simulated/)).toBeInTheDocument();
});
