import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SYMPTOMS } from '../../content/symptoms';
import { createDemoProfile, emptyProfile } from '../../domain/demo';
import { reducer, type AppState } from '../../state/store';
import { demoState, renderApp } from '../test-helpers';
import { SymptomLog } from './SymptomLog';

test('the log shows the last 30 days and can go back to the early cluster', async () => {
  renderApp(<SymptomLog />);
  expect(screen.getByText('Flight days 18 to 47')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /Trouble sleeping, reported on 3 of 30 days/ })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /Motion sickness, reported on 0 of 30 days/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Later' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Earlier' }));
  expect(screen.getByText('Flight days 1 to 17')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /Motion sickness, reported on 4 of 30 days/ })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /Trouble sleeping, reported on 0 of 30 days/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Earlier' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Later' }));
  expect(screen.getByText('Flight days 18 to 47')).toBeInTheDocument();
});

test('every symptom has a row, grouped by its system', () => {
  renderApp(<SymptomLog />);
  expect(screen.getAllByRole('img')).toHaveLength(SYMPTOMS.length);
  const brain = within(screen.getByRole('group', { name: 'Brain, mind & sleep' }));
  expect(brain.getAllByRole('img')).toHaveLength(4);
  expect(brain.getByText('3 days')).toBeInTheDocument();
});

test('free-text discomforts are listed with their day', () => {
  const state: AppState = reducer(demoState, { type: 'saveStep', step: 'symptoms', values: {}, symptoms: [], otherDiscomfort: 'Sore wrist' });
  renderApp(<SymptomLog />, state);
  const other = within(screen.getByRole('region', { name: 'Other discomforts' }));
  expect(other.getByText('Day 47 · Sore wrist')).toBeInTheDocument();
});

test('without free-text entries the list says so', () => {
  renderApp(<SymptomLog />);
  expect(within(screen.getByRole('region', { name: 'Other discomforts' })).getByText('Nothing written yet.')).toBeInTheDocument();
});

test('older free-text entries stay in the list, newest first', () => {
  const profile = createDemoProfile();
  profile.entries = profile.entries.map((e) => (e.day === 12 ? { ...e, otherDiscomfort: 'Dry eyes' } : e.day === 40 ? { ...e, otherDiscomfort: 'Stiff neck' } : e));
  renderApp(<SymptomLog />, { profile });
  const items = within(screen.getByRole('region', { name: 'Other discomforts' })).getAllByRole('listitem');
  expect(items.map((li) => li.textContent)).toEqual(['Day 40 · Stiff neck', 'Day 12 · Dry eyes']);
});

test('on day 1 the log has one window and nothing to page through', () => {
  renderApp(<SymptomLog />, { profile: emptyProfile('New crew', 'station', {}) });
  expect(screen.getByText('Flight day 1')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Earlier' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Later' })).toBeDisabled();
});
