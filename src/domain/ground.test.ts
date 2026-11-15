import { composeMissed, criticalReadings, dayComplete, outbox, replayOutbox, sentOn, withAlerts } from './ground';
import { profile, range, symptomOn, withSymptoms } from './test-helpers';
import { DAILY_STEPS, type Profile } from './types';

const base = { heartRate: 62, bpSystolic: 118, bpDiastolic: 76, bodyTemp: 36.7, waterLiters: 2.4, sleepHours: 7.5 };
/** Three days of low water: Kidneys at warning on day 47. */
const dry = () => profile(range(45, 47).map((day) => ({ day, waterLiters: 1.2, heartRate: 62 })), base);
const subjects = (p: Profile) => outbox(p).map((m) => m.subject);

describe('after the daily check-in', () => {
  test('a system at warning is reported once the check-in is complete', () => {
    const p = withAlerts(dry(), { origin: 'checkin', completed: true });
    expect(subjects(p)).toEqual(['Urgent: Kidneys']);
    const [m] = outbox(p);
    expect(m).toMatchObject({ id: 'g1', day: 47, kind: 'urgent', origin: 'checkin', regions: ['kidneys'] });
    expect(m.body.split('\n')).toEqual([
      'Urgent health alert · Test crew · Flight day 47 of 180 · Station',
      'Comms: Real-time support from the ground',
      '',
      '[WARNING] Kidneys',
      '  ! Water: 3-day average 1.2 L, 50% of baseline',
      '  Risk: Dehydration (NASA: Hazard: Gravity Fields)',
      '',
      '"Possible" names a condition the source pages describe that these findings match. "Risk" names one the pages link to a habit that is off; no sign of it was measured. Neither is a diagnosis.',
    ]);
  });

  test('a step saved before the check-in is complete reports nothing yet', () => {
    const p = dry();
    p.entries[2].stepsDone = ['vitals', 'intake'];
    expect(outbox(withAlerts(p, { origin: 'checkin' }))).toEqual([]);
  });

  test('cautions are told to the crew member, not sent', () => {
    const p = withSymptoms(47, ['rash']);
    expect(outbox(withAlerts(p, { origin: 'checkin', completed: true }))).toEqual([]);
  });

  test('simulated data is declared in the message', () => {
    const p = withAlerts({ ...dry(), simulated: true }, { origin: 'checkin', completed: true });
    expect(outbox(p)[0].body.split('\n')[1]).toBe('SIMULATED DATA');
  });

  test('Mars carries the one-way delay and the Moon no comms line', () => {
    const mars = withAlerts({ ...dry(), mission: 'mars' }, { origin: 'checkin', completed: true });
    expect(outbox(mars)[0].body).toContain('Comms: Up to 20 minutes one way');
    const moon = withAlerts({ ...dry(), mission: 'moon', missionDay: 47 }, { origin: 'checkin', completed: true });
    expect(outbox(moon)[0].body).not.toContain('Comms:');
  });

  test('the same system is not reported twice on the same day', () => {
    const once = withAlerts(dry(), { origin: 'checkin', completed: true });
    const twice = withAlerts(once, { origin: 'checkin' });
    expect(twice).toBe(once);
    expect(outbox(withAlerts(once, { origin: 'check' }))).toHaveLength(1);
  });

  test('a new warning later the same day is reported on its own', () => {
    const morning = withAlerts(dry(), { origin: 'checkin', completed: true });
    morning.entries[2] = { ...morning.entries[2], symptoms: ['painAfterSpacewalk'] };
    const later = withAlerts(morning, { origin: 'check' });
    expect(subjects(later)).toEqual(['Urgent: Kidneys', 'Urgent: Lungs & oxygen']);
    expect(outbox(later)[1]).toMatchObject({ id: 'g2', origin: 'check', regions: ['lungs'] });
    expect(outbox(later)[1].body).toContain('  Possible: Decompression sickness (NASA: Risk of Decompression Sickness)');
  });

  test('the next day reports again while the warning lasts', () => {
    const day47 = withAlerts(dry(), { origin: 'checkin', completed: true });
    const day48: Profile = {
      ...day47,
      missionDay: 48,
      entries: [...day47.entries, { day: 48, values: { waterLiters: 1.2 }, symptoms: [], stepsDone: [...DAILY_STEPS] }],
    };
    const p = withAlerts(day48, { origin: 'checkin', completed: true });
    expect(outbox(p).map((m) => [m.day, m.subject])).toEqual([
      [47, 'Urgent: Kidneys'],
      [48, 'Urgent: Kidneys'],
    ]);
    expect(sentOn(p, 48)).toHaveLength(1);
  });
});

describe('critical readings', () => {
  const spike = () => profile([{ day: 46, heartRate: 62 }, { day: 47, heartRate: 140, bodyTemp: 39.1 }], base);

  test('criticalReadings finds the readings of the day that are far from baseline', () => {
    expect(criticalReadings(spike(), 47).map((r) => r.indicator)).toEqual(['heartRate', 'bodyTemp']);
    expect(criticalReadings(spike(), 46)).toEqual([]);
    expect(criticalReadings(spike(), 47, ['bodyTemp']).map((r) => r.indicator)).toEqual(['bodyTemp']);
  });

  test('a confirmed critical reading is reported at once, before the check-in is complete', () => {
    const p = spike();
    p.entries[1].stepsDone = ['vitals'];
    const sent = withAlerts(p, { origin: 'checkin', critical: ['heartRate', 'bodyTemp'] });
    expect(subjects(sent)).toEqual(['Critical reading: Heart rate, Body temperature']);
    expect(outbox(sent)[0]).toMatchObject({ kind: 'critical', regions: ['heart', 'immune'], indicators: ['heartRate', 'bodyTemp'] });
    expect(outbox(sent)[0].body.split('\n').slice(-3)).toEqual([
      'Measured again or confirmed by the crew member:',
      '  ! Heart rate: Critical reading 140 bpm, 125.8% above baseline (baseline 62 bpm)',
      '  ! Body temperature: Critical reading 39.1 °C, 2.4 °C above baseline (baseline 36.7 °C)',
    ]);
  });

  test('its system is then not reported again when the check-in completes', () => {
    const p = spike();
    p.entries[1].stepsDone = ['vitals'];
    const afterVitals = withAlerts(p, { origin: 'checkin', critical: ['heartRate', 'bodyTemp'] });
    afterVitals.entries[1] = { ...afterVitals.entries[1], stepsDone: [...DAILY_STEPS] };
    const done = withAlerts(afterVitals, { origin: 'checkin', completed: true });
    expect(subjects(done)).toEqual(['Critical reading: Heart rate, Body temperature']);
  });

  test('a reading that is not critical is not reported as one', () => {
    const p = profile([{ day: 47, heartRate: 70 }], base);
    expect(outbox(withAlerts(p, { origin: 'check', critical: ['heartRate'] }))).toEqual([]);
  });
});

describe('weekly and monthly review', () => {
  /** Trouble sleeping on three of the seven days up to the review day. */
  const recurring = (reviewDay: number) => {
    const p = symptomOn([reviewDay - 6, reviewDay - 4, reviewDay - 2], 'troubleSleeping');
    p.entries.push({ day: reviewDay, values: {}, symptoms: [], stepsDone: [...DAILY_STEPS] });
    return { ...p, missionDay: reviewDay };
  };

  test('on a review day, something that keeps coming back is reported when the check-in completes', () => {
    const p = withAlerts(recurring(49), { origin: 'checkin', completed: true });
    expect(subjects(p)).toEqual(['Weekly review: Brain, mind & sleep']);
    const lines = outbox(p)[0].body.split('\n');
    expect(lines[0]).toBe('Weekly review · Test crew · Flight day 49 of 180 · Station');
    expect(lines).toContain('Flight days 43 to 49');
    expect(lines).toContain('  ! Trouble sleeping: Reported on 3 of the last 7 days (recurring)');
    expect(lines).toContain('  Possible: Sleep loss (NASA: Hazard: Isolation and Confinement)');
    expect(lines).toContain('  Trouble sleeping: reported on 3 of 7 days');
    expect(outbox(p)[0]).toMatchObject({ kind: 'review', regions: ['brain'] });
  });

  test('the same finding on a day that is not a review day is not sent', () => {
    expect(outbox(withAlerts(recurring(48), { origin: 'checkin', completed: true }))).toEqual([]);
  });

  test('a review that finds nothing sends nothing', () => {
    const quiet = { ...profile([{ day: 49 }]), missionDay: 49 };
    expect(outbox(withAlerts(quiet, { origin: 'checkin', completed: true }))).toEqual([]);
  });

  test('day 30 sends a monthly review', () => {
    const days = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28];
    const p = { ...symptomOn(days, 'rash'), missionDay: 30 };
    p.entries.push({ day: 30, values: {}, symptoms: [], stepsDone: [...DAILY_STEPS] });
    const sent = withAlerts(p, { origin: 'checkin', completed: true });
    // Ten days of a rash is a warning (persistent), so the alert goes out as well as the review.
    expect(subjects(sent)).toEqual(['Urgent: Blood & immunity', 'Monthly review: Blood & immunity']);
    expect(outbox(sent)[1].body).toContain('Flight days 1 to 30');
  });

  test('the review is sent once', () => {
    const once = withAlerts(recurring(49), { origin: 'checkin', completed: true });
    expect(withAlerts(once, { origin: 'checkin', completed: true })).toBe(once);
  });
});

describe('a day without its check-in', () => {
  test('is reported when the next day begins', () => {
    const p = profile([{ day: 46 }]);
    p.entries.push({ day: 47, values: {}, symptoms: [], stepsDone: ['vitals', 'sleepMood'] });
    const m = composeMissed(p, 47, 'g1');
    expect(m).toMatchObject({ day: 48, kind: 'missed', origin: 'system', subject: 'Missed check-in: flight day 47', regions: [] });
    expect(m.body).toContain('The daily check-in of flight day 47 was not completed (2 of 5 steps).');
    expect(dayComplete(p, 46)).toBe(true);
    expect(dayComplete(p, 47)).toBe(false);
    expect(dayComplete(p, 45)).toBe(false);
  });
});

describe('replaying a history', () => {
  test('gives the messages the days would have produced, in order', () => {
    const rows = [
      ...range(1, 4).map((day) => ({ day, waterLiters: 2.4 })),
      // day 5 has no entry
      ...range(6, 8).map((day) => ({ day, waterLiters: 1.2 })),
    ];
    const p = { ...profile(rows, base), missionDay: 8 };
    // Day 7 averages (2.4, 1.2, 1.2): 67% of baseline, a caution. Day 8 is the first warning.
    expect(replayOutbox(p).map((m) => [m.id, m.day, m.subject])).toEqual([
      ['g1', 6, 'Missed check-in: flight day 5'],
      ['g2', 8, 'Urgent: Kidneys'],
    ]);
  });

  test('today is not reported as missed while it is still going on', () => {
    const p = { ...profile([{ day: 1 }, { day: 2 }]), missionDay: 3 };
    expect(replayOutbox(p)).toEqual([]);
  });

  test('is deterministic and leaves the profile untouched', () => {
    const p = { ...profile(range(1, 8).map((day) => ({ day, waterLiters: 1.2 })), base), missionDay: 8 };
    const before = JSON.stringify(p);
    expect(replayOutbox(p)).toEqual(replayOutbox(p));
    expect(JSON.stringify(p)).toBe(before);
  });
});
