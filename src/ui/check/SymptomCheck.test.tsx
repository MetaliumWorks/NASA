import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { emptyProfile } from '../../domain/demo';
import { halfDoneState, renderApp, todayEntry } from '../test-helpers';
import { SymptomCheck } from './SymptomCheck';

const tick = (name: string | RegExp) => userEvent.click(screen.getByRole('checkbox', { name }));
const press = (name: string) => userEvent.click(screen.getByRole('button', { name }));
const result = () => within(screen.getByRole('region', { name: 'What the check found' }));

test('nothing reported, nothing to continue with', () => {
  renderApp(<SymptomCheck />);
  expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
});

test('feeling faint: the app asks for blood pressure and heart rate, then says what it finds', async () => {
  const { store } = renderApp(<SymptomCheck />);
  await tick('Lightheaded or faint');
  await press('Continue');
  expect(screen.getByRole('heading', { name: 'The app asks' })).toBeInTheDocument();
  expect(screen.getByText('You reported: Lightheaded or faint.')).toBeInTheDocument();

  // The measurements are required.
  await press('See what the app finds');
  expect(screen.getAllByText('The app asks for this measurement')).toHaveLength(3);

  await userEvent.type(screen.getByLabelText(/^Heart rate/), '70');
  await userEvent.type(screen.getByLabelText(/systolic/), '98');
  await userEvent.type(screen.getByLabelText(/diastolic/), '62');
  await press('See what the app finds');

  expect(result().getByText('Possible: Low blood pressure.')).toBeInTheDocument();
  expect(result().getByText(/Before landing, drink lots of fluids/)).toBeInTheDocument();
  expect(todayEntry(store.state).symptoms).toEqual(['troubleSleeping', 'lightheaded']);
  expect(todayEntry(store.state).values).toMatchObject({ heartRate: 70, bpSystolic: 98, bpDiastolic: 62 });
  expect(store.state.profile.checks).toEqual([{ day: 47, symptoms: ['lightheaded'], values: { heartRate: 70, bpSystolic: 98, bpDiastolic: 62 } }]);
});

test('a headache: the app asks about the other effects of mild hypoxia', async () => {
  const { store } = renderApp(<SymptomCheck />);
  await tick('Headache');
  await press('Continue');
  const also = within(screen.getByRole('region', { name: 'Do you also notice any of these?' }));
  expect(also.getAllByRole('checkbox').map((c) => c.closest('label')?.textContent)).toEqual(['Trouble sleeping', 'Blurred vision', 'Confusion']);
  expect(also.getByText(/same conditions in the sources: Mild hypoxia/)).toBeInTheDocument();
  await userEvent.click(also.getByRole('checkbox', { name: 'Confusion' }));
  await press('See what the app finds');
  expect(result().getByText('Possible: Mild hypoxia.')).toBeInTheDocument();
  expect(result().getByText('Urgent: Lungs & oxygen')).toBeInTheDocument(); // two symptoms in one system: a warning
  expect(todayEntry(store.state).symptoms).toEqual(['troubleSleeping', 'headache', 'confusion']);
});

test('ticking a follow-up sign brings the measurement that goes with it', async () => {
  renderApp(<SymptomCheck />);
  await tick('Headache');
  await press('Continue');
  expect(screen.queryByRole('region', { name: 'Measure now' })).toBeNull();
  await tick('Blurred vision');
  expect(within(screen.getByRole('region', { name: 'Measure now' })).getByRole('button', { name: 'Run the vision test' })).toBeInTheDocument();
});

test('pain after a spacewalk needs no question: it is reported at once', async () => {
  const { store } = renderApp(<SymptomCheck />);
  await tick(/Pain after a spacewalk/);
  await press('Continue');
  expect(result().getByText('Possible: Decompression sickness.')).toBeInTheDocument();
  expect(result().getByText('Urgent: Lungs & oxygen')).toBeInTheDocument();
  expect(result().getByText(/end it safely but rapidly/)).toBeInTheDocument();
  expect(store.state.profile.outbox?.at(-1)).toMatchObject({ kind: 'urgent', origin: 'check', regions: ['lungs'] });
});

test('a reading far from baseline is asked about here too, and reported when confirmed', async () => {
  const { store } = renderApp(<SymptomCheck />);
  await tick('Rash');
  await press('Continue');
  await userEvent.type(screen.getByLabelText(/^Body temperature/), '39,4');
  await press('See what the app finds');
  expect(screen.getByText(/39.4 °C is far from your baseline of 36.7 °C/)).toBeInTheDocument();
  expect(store.state.profile.checks).toBeUndefined();
  await tick('Confirm body temperature: this reading is correct');
  await press('See what the app finds');
  expect(result().getByText('Critical reading: Body temperature')).toBeInTheDocument();
  expect(result().getByText('Possible: Altered immune response.')).toBeInTheDocument();
  expect(todayEntry(store.state).critical).toEqual(['bodyTemp']);
});

test('free text alone is a check: kept in the log, nothing to measure', async () => {
  const { store } = renderApp(<SymptomCheck />);
  await userEvent.type(screen.getByLabelText('Anything else?'), 'Sore wrist');
  await press('Continue');
  expect(screen.getByRole('region', { name: 'What the check found' })).toBeInTheDocument();
  expect(todayEntry(store.state).otherDiscomfort).toBe('Sore wrist');
});

test('the vision test can be run from the check and its result is saved', async () => {
  const { store } = renderApp(<SymptomCheck random={() => 0} />);
  await tick('Blurred vision');
  await press('Continue');
  fireEvent.click(screen.getByRole('button', { name: 'Run the vision test' }));
  fireEvent.click(screen.getByRole('button', { name: 'Start' }));
  for (let i = 0; i < 6; i++) fireEvent.keyDown(window, { key: 'ArrowRight' }); // three levels right
  act(() => {
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    fireEvent.keyDown(window, { key: 'ArrowUp' });
  });
  await press('See what the app finds');
  expect(todayEntry(store.state).values.visionLevel).toBe(3);
  expect(result().getByText('Possible: Spaceflight associated neuro-ocular syndrome (SANS).')).toBeInTheDocument();
});

test('earlier checks of the day are listed, and another can be started', async () => {
  renderApp(<SymptomCheck />);
  await tick('Motion sickness');
  await press('Continue'); // asks about disorientation and dizziness
  await press('See what the app finds');
  await press('Start another check');
  expect(screen.getByText('Check 1: Motion sickness')).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: 'Motion sickness' })).not.toBeChecked();
});

test('while the daily check-in is still due, the check leads back to it', async () => {
  const { store } = renderApp(<SymptomCheck />, { ...halfDoneState, view: 'check' });
  await userEvent.type(screen.getByLabelText('Anything else?'), 'Sore wrist');
  await press('Continue');
  await press('Back to the daily check-in');
  expect(store.state.view).toBe('checkin');
  expect(todayEntry(store.state).stepsDone).toHaveLength(3); // a check is not a step of the check-in
});

test('on an empty profile the check works without a baseline', async () => {
  const { container } = renderApp(<SymptomCheck />, { profile: emptyProfile('New crew', 'station', {}), view: 'check' });
  await tick('Rash');
  await press('Continue');
  await userEvent.type(screen.getByLabelText(/^Body temperature/), '37');
  await press('See what the app finds');
  expect(result().getByText('Possible: Altered immune response.')).toBeInTheDocument();
  expect(container.textContent).not.toMatch(/NaN|undefined|Infinity/);
});
