import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { INDICATORS } from '../../content/indicators';
import { SOURCES } from '../../content/sources';
import { SYMPTOMS } from '../../content/symptoms';
import { emptyProfile } from '../../domain/demo';
import type { CheckInStep } from '../../domain/types';
import type { AppState } from '../../state/store';
import { renderApp, todayEntry } from '../test-helpers';
import { CheckIn } from './CheckIn';

const STEP_NAME: Record<CheckInStep, RegExp> = {
  vitals: /Vitals/,
  sleepMood: /Sleep & mood/,
  symptoms: /Symptoms/,
  intake: /Nutrition & exercise/,
  radiation: /Radiation/,
};

async function renderCheckIn(options: { step?: CheckInStep; initial?: Partial<AppState> } = {}) {
  const result = renderApp(<CheckIn />, { view: 'checkin', ...options.initial });
  if (options.step) {
    await userEvent.click(within(screen.getByRole('list', { name: 'Steps' })).getByRole('button', { name: STEP_NAME[options.step] }));
  }
  return result;
}
const save = () => userEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
async function retype(label: RegExp, text: string) {
  const field = screen.getByLabelText(label);
  await userEvent.clear(field);
  if (text) await userEvent.type(field, text);
}

test('opens on the first step that is not done yet', async () => {
  await renderCheckIn();
  expect(screen.getByRole('heading', { name: 'Nutrition & exercise' })).toBeInTheDocument();
  expect(screen.getByLabelText(/Water/)).toHaveValue('');
});

test('a comma decimal is accepted and saved', async () => {
  const { store } = await renderCheckIn({ step: 'vitals' });
  await retype(/Body temperature/, '36,8');
  await save();
  expect(todayEntry(store.state).values.bodyTemp).toBe(36.8);
  expect(screen.getByRole('heading', { name: 'Sleep & mood' })).toBeInTheDocument();
});

test('an invalid value blocks the save and explains', async () => {
  const { store } = await renderCheckIn({ step: 'vitals' });
  const before = todayEntry(store.state).values.heartRate;
  await retype(/Heart rate/, '400');
  await retype(/Blood sugar/, '95');
  await save();
  expect(screen.getByText('Enter a value between 30 and 220')).toBeInTheDocument();
  expect(screen.getByLabelText(/Heart rate/)).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByLabelText(/Heart rate/)).toHaveFocus();
  expect(todayEntry(store.state).values.heartRate).toBe(before);
  expect(todayEntry(store.state).values.bloodSugar).not.toBe(95); // nothing of the step is saved
  expect(screen.getByRole('heading', { name: 'Vitals' })).toBeInTheDocument();
});

test('text that is not a number is refused, and fixing it lets the step save', async () => {
  const { store } = await renderCheckIn({ step: 'vitals' });
  await retype(/Heart rate/, 'abc');
  await save();
  expect(screen.getByText('Enter a number')).toBeInTheDocument();
  await retype(/Heart rate/, '64');
  await save();
  expect(screen.queryByText('Enter a number')).toBeNull();
  expect(todayEntry(store.state).values.heartRate).toBe(64);
});

test('an empty field is skipped, not an error', async () => {
  const { store } = await renderCheckIn({ step: 'vitals' });
  await retype(/Blood sugar/, '');
  await save();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(todayEntry(store.state).values.bloodSugar).toBeUndefined();
  expect(todayEntry(store.state).values.heartRate).toBeDefined();
});

test('every field explains why it is tracked, with its source', async () => {
  await renderCheckIn({ step: 'vitals' });
  for (const id of ['heartRate', 'bpSystolic', 'bpDiastolic', 'bodyTemp', 'bloodSugar'] as const) {
    const def = INDICATORS[id];
    const row = screen.getByLabelText(new RegExp(`^${def.label}`)).closest('.field') as HTMLElement;
    expect(within(row).getByText(def.why.text)).toBeInTheDocument();
    expect(within(row).getByText(def.howTo)).toBeInTheDocument();
    expect(within(row).getByRole('link')).toHaveAttribute('href', SOURCES[def.why.source].url);
  }
});

test('scales are picked, not typed', async () => {
  const { store } = await renderCheckIn({ step: 'sleepMood' });
  const mood = within(screen.getByRole('radiogroup', { name: /Mood/ }));
  expect(mood.getAllByRole('radio')).toHaveLength(5);
  await userEvent.click(mood.getByRole('radio', { name: '2' }));
  await userEvent.type(screen.getByLabelText('Journal note'), 'Slept badly.');
  await save();
  expect(todayEntry(store.state)).toMatchObject({ journal: 'Slept badly.' });
  expect(todayEntry(store.state).values.mood).toBe(2);
});

test('symptoms are grouped by system and each names its source', async () => {
  await renderCheckIn({ step: 'symptoms' });
  const lungs = within(screen.getByRole('group', { name: 'Lungs & oxygen' }));
  expect(lungs.getAllByRole('checkbox')).toHaveLength(3);
  expect(lungs.getByRole('checkbox', { name: /Pain after a spacewalk/ })).toBeInTheDocument();
  expect(screen.getAllByRole('checkbox')).toHaveLength(SYMPTOMS.length);
  expect(lungs.getAllByRole('link').length).toBe(3);
});

test('symptoms and a free-text discomfort are stored for today', async () => {
  const { store } = await renderCheckIn({ step: 'symptoms' });
  await userEvent.click(screen.getByRole('checkbox', { name: 'Headache' }));
  await userEvent.type(screen.getByLabelText('Anything else?'), 'Sore wrist');
  await save();
  expect(todayEntry(store.state)).toMatchObject({ symptoms: ['headache'], otherDiscomfort: 'Sore wrist' });
});

test('finishing the fifth step returns to the map and completes the day', async () => {
  const { store } = await renderCheckIn();
  await retype(/Water/, '2,4');
  await userEvent.click(within(screen.getByRole('radiogroup', { name: /Appetite/ })).getByRole('radio', { name: '4' }));
  await retype(/Exercise/, '1.5');
  await save();
  expect(screen.getByRole('heading', { name: 'Radiation' })).toBeInTheDocument();
  await retype(/Radiation dose/, '0,5');
  await save();
  expect(todayEntry(store.state).stepsDone).toHaveLength(5);
  expect(todayEntry(store.state).values).toMatchObject({ waterLiters: 2.4, appetite: 4, exerciseHours: 1.5, radiationDose: 0.5 });
  expect(store.state.view).toBe('map');
});

test('reopening a finished step shows what was entered', async () => {
  const { store } = await renderCheckIn({ step: 'vitals' });
  const values = todayEntry(store.state).values;
  expect(screen.getByLabelText(/Heart rate/)).toHaveValue(String(values.heartRate));
  expect(screen.getByLabelText(/Body temperature/)).toHaveValue(String(values.bodyTemp));
  expect(within(screen.getByRole('list', { name: 'Steps' })).getAllByText('done')).toHaveLength(3);
});

test('Back goes to the step before without saving', async () => {
  const { store } = await renderCheckIn();
  await retype(/Water/, '9');
  await userEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(screen.getByRole('heading', { name: 'Symptoms' })).toBeInTheDocument();
  expect(todayEntry(store.state).values.waterLiters).toBeUndefined();
});

test('a first day with no entry starts at Vitals and saves into day 1', async () => {
  const { store } = await renderCheckIn({ initial: { profile: emptyProfile('New crew', 'station', {}) } });
  expect(screen.getByRole('heading', { name: 'Vitals' })).toBeInTheDocument();
  await retype(/Heart rate/, '61');
  await save();
  expect(store.state.profile.entries).toEqual([{ day: 1, values: { heartRate: 61 }, symptoms: [], stepsDone: ['vitals'] }]);
});
