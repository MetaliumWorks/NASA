import { assessAll } from './assess';
import { createDemoProfile, emptyProfile } from './demo';
import { recent } from './series';
import { stepsDoneToday, streak } from './streak';
import { ALL_INDICATORS, DAILY_STEPS, type RegionId } from './types';
import { INDICATORS } from '../content/indicators';
import { SYMPTOMS } from '../content/symptoms';

const demo = createDemoProfile();

test('demo is deterministic', () => {
  expect(createDemoProfile()).toEqual(demo);
});

test('demo is a simulated station crew on flight day 47', () => {
  expect(demo).toMatchObject({ name: 'Crew 03', simulated: true, mission: 'station', missionDay: 47, plan: [] });
});

test('demo tells the spec story and nothing else', () => {
  const a = assessAll(demo, 47);
  expect(a.kidneys.status).toBe('warning');
  expect(a.bones.status).toBe('caution');
  expect(a.brain.status).toBe('caution');
  expect(a.brain.findings).toContainEqual(expect.objectContaining({ symptom: 'troubleSleeping', label: 'recurring' }));
  (['eyes', 'innerEar', 'heart', 'lungs', 'immune', 'spine', 'muscles', 'digestion', 'radiation'] as RegionId[]).forEach((r) =>
    expect(a[r].status, r).toBe('nominal'),
  );
});

test('the only findings that flag are the three of the story', () => {
  const flagging = Object.values(assessAll(demo, 47))
    .flatMap((a) => a.findings.map((f) => ({ region: a.region, what: f.indicator ?? f.symptom, status: f.status, label: f.label })))
    .filter((f) => f.status !== 'nominal');
  expect(flagging).toEqual([
    { region: 'brain', what: 'troubleSleeping', status: 'caution', label: 'recurring' },
    { region: 'bones', what: 'exerciseHours', status: 'caution', label: undefined },
    { region: 'kidneys', what: 'waterLiters', status: 'warning', label: undefined },
  ]);
});

test('nothing was flagged before the story begins', () => {
  // Through day 40 every region is nominal, so the charts show a quiet mission and a recent change.
  for (const day of [10, 20, 30, 40]) {
    Object.values(assessAll(demo, day)).forEach((a) => expect(a.status, `${a.region} on day ${day}`).toBe('nominal'));
  }
});

test('demo matches the mockup numbers', () => {
  expect(recent(demo, 'exerciseHours', 47, 7)).toEqual([1.5, 1.0, 0.5, 1.5, 1.0, 0, 1.0]);
  expect(recent(demo, 'exerciseHours', 47, 7).reduce((x, y) => x + y, 0)).toBeCloseTo(6.5);
  expect(recent(demo, 'waterLiters', 47, 3)).toEqual([1.4, 1.3, 1.1]);
  expect(streak(demo)).toBe(12);
  expect(stepsDoneToday(demo)).toBe(3);
});

test('days 1 to 46 are complete except day 34, and today has three steps', () => {
  const days = demo.entries.map((e) => e.day);
  expect(days).toEqual([...Array(47).keys()].map((i) => i + 1).filter((d) => d !== 34));
  demo.entries.filter((e) => e.day < 47).forEach((e) => expect(e.stepsDone, `day ${e.day}`).toEqual(DAILY_STEPS));
  expect(demo.entries.at(-1)).toMatchObject({ day: 47, stepsDone: ['vitals', 'sleepMood', 'symptoms'], symptoms: [] });
});

test("today's unfinished steps hold no values yet", () => {
  const today = demo.entries.at(-1)!;
  for (const id of ALL_INDICATORS) {
    const step = INDICATORS[id].step;
    if (step === 'intake' || step === 'radiation' || step === 'weekly') expect(today.values[id], id).toBeUndefined();
    else expect(today.values[id], id).toBeTypeOf('number');
  }
});

test('the early motion-sickness cluster is in the log but not flagged', () => {
  expect(demo.entries.filter((e) => e.symptoms.includes('motionSickness')).map((e) => e.day)).toEqual([1, 2, 3, 4]);
  expect(demo.entries.filter((e) => e.symptoms.includes('troubleSleeping')).map((e) => e.day)).toEqual([41, 43, 45]);
});

test('weekly measurements are recorded every seven days', () => {
  const weekly = demo.entries.filter((e) => e.values.visionLevel !== undefined).map((e) => e.day);
  expect(weekly).toEqual([7, 14, 21, 28, 35, 42]);
});

test('every recorded value is inside its input range and every symptom is known', () => {
  const known = new Set(SYMPTOMS.map((s) => s.id));
  for (const e of demo.entries) {
    for (const id of ALL_INDICATORS) {
      const v = e.values[id];
      if (v === undefined) continue;
      expect(v, `${id} on day ${e.day}`).toBeGreaterThanOrEqual(INDICATORS[id].min);
      expect(v, `${id} on day ${e.day}`).toBeLessThanOrEqual(INDICATORS[id].max);
    }
    e.symptoms.forEach((s) => expect(known.has(s), s).toBe(true));
  }
});

test('an empty profile starts on day 1 with nothing recorded and is not simulated', () => {
  const p = emptyProfile('New crew', 'mars', { heartRate: 58 });
  expect(p).toEqual({ name: 'New crew', simulated: false, mission: 'mars', missionDay: 1, baseline: { heartRate: 58 }, entries: [], plan: [] });
  Object.values(assessAll(p, 1)).forEach((a) => expect(a.status).toBe('nominal'));
});
