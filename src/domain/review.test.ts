import { createDemoProfile } from './demo';
import { periodReview, periodWindow, reviewDue } from './review';
import { profile, range, symptomOn } from './test-helpers';

test.each([
  [7, 'week'],
  [14, 'week'],
  [30, 'month'],
  [210, 'month'],
  [47, null],
  [0, null],
  [1, null],
])('reviewDue(%i) is %j', (day, expected) => {
  expect(reviewDue(day)).toBe(expected);
});

test('a period covers its last 7 or 30 days and never starts before day 1', () => {
  expect(periodWindow('week', 47)).toEqual({ from: 41, to: 47, days: 7 });
  expect(periodWindow('month', 47)).toEqual({ from: 18, to: 47, days: 30 });
  expect(periodWindow('month', 12)).toEqual({ from: 1, to: 12, days: 12 });
});

test('the review has one row per region, in display order', () => {
  const rows = periodReview(createDemoProfile(), 'week', 47);
  expect(rows.map((r) => r.region)).toEqual([
    'brain',
    'eyes',
    'innerEar',
    'heart',
    'lungs',
    'immune',
    'bones',
    'spine',
    'muscles',
    'digestion',
    'kidneys',
    'radiation',
  ]);
});

test('weekly review counts symptom days and compares with the week before', () => {
  const row = periodReview(createDemoProfile(), 'week', 47).find((r) => r.region === 'brain')!;
  expect(row.symptomDays.troubleSleeping).toBe(3);
  expect(row.symptomDays).toEqual({ troubleSleeping: 3 });
  expect(row.flags).toContainEqual(expect.objectContaining({ label: 'recurring' }));
  const sleep = row.indicators.find((i) => i.id === 'sleepHours')!;
  expect(sleep).toMatchObject({ baseline: 7.5 });
  expect(sleep.mean).toBeGreaterThan(6.5);
  expect(sleep.mean).toBeLessThan(sleep.previousMean!); // three short nights this week
});

test('period means use only the days of their own period', () => {
  const rows = [
    ...range(34, 40).map((day) => ({ day, heartRate: 60 })),
    ...range(41, 47).map((day) => ({ day, heartRate: 70 })),
  ];
  const heart = periodReview(profile(rows, { heartRate: 62 }), 'week', 47).find((r) => r.region === 'heart')!;
  expect(heart.indicators.find((i) => i.id === 'heartRate')).toEqual({ id: 'heartRate', mean: 70, previousMean: 60, baseline: 62 });
  expect(heart.indicators.find((i) => i.id === 'bpSystolic')).toEqual({ id: 'bpSystolic', mean: null, previousMean: null, baseline: undefined });
});

test('monthly review still sees the early motion-sickness cluster only inside its window', () => {
  const demo = createDemoProfile();
  expect(periodReview(demo, 'month', 30).find((r) => r.region === 'innerEar')!.symptomDays.motionSickness).toBe(4);
  expect(periodReview(demo, 'month', 47).find((r) => r.region === 'innerEar')!.symptomDays.motionSickness ?? 0).toBe(0);
});

test('flaggedDays counts each day once at its worst status', () => {
  // Day 46: one symptom (caution). Day 47: two symptoms (warning).
  const p = profile([
    { day: 46, symptoms: ['headache'] },
    { day: 47, symptoms: ['headache', 'confusion'] },
  ]);
  const lungs = periodReview(p, 'week', 47).find((r) => r.region === 'lungs')!;
  expect(lungs.flaggedDays).toEqual({ caution: 1, warning: 1 });
  for (const row of periodReview(createDemoProfile(), 'week', 47)) {
    expect(row.flaggedDays.caution + row.flaggedDays.warning).toBeLessThanOrEqual(7);
  }
});

test('the demo week shows when each system was flagged', () => {
  const rows = periodReview(createDemoProfile(), 'week', 47);
  const of = (region: string) => rows.find((r) => r.region === region)!.flaggedDays;
  expect(of('kidneys')).toEqual({ caution: 1, warning: 1 }); // water falls on day 45; caution on 46, warning on 47
  expect(of('bones')).toEqual({ caution: 2, warning: 0 });
  expect(of('heart')).toEqual({ caution: 0, warning: 0 });
});

test('a long-running symptom shows as persistent in the monthly review', () => {
  const row = periodReview(symptomOn(range(30, 41), 'rash'), 'month', 47).find((r) => r.region === 'immune')!;
  expect(row.symptomDays.rash).toBe(12);
  expect(row.flags).toEqual([expect.objectContaining({ symptom: 'rash', label: 'persistent' })]);
});
