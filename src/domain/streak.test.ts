import { stepsDoneToday, streak } from './streak';
import { profile } from './test-helpers';
import type { Profile } from './types';

const days = (...ds: number[]) => profile(ds.map((day) => ({ day })));

function withToday(p: Profile, stepsDone: Profile['entries'][number]['stepsDone']): Profile {
  return { ...p, entries: [...p.entries, { day: 47, values: {}, symptoms: [], stepsDone }] };
}

test('streak counts back from yesterday when today is incomplete', () => {
  expect(streak(withToday(days(44, 45, 46), ['vitals']))).toBe(3);
  expect(streak(days(44, 45, 46))).toBe(3);
});

test('a completed today counts', () => {
  expect(streak(days(44, 45, 46, 47))).toBe(4);
});

test('a gap breaks the streak', () => {
  expect(streak(days(43, 45, 46))).toBe(2);
});

test('an incomplete day in the middle breaks the streak', () => {
  const p = days(44, 46);
  p.entries.push({ day: 45, values: {}, symptoms: [], stepsDone: ['vitals', 'sleepMood'] });
  expect(streak(p)).toBe(1);
});

test('no entries means no streak', () => {
  expect(streak(days())).toBe(0);
  expect(streak(withToday(days(), ['vitals']))).toBe(0);
});

test('stepsDoneToday counts each daily step once', () => {
  expect(stepsDoneToday(days(46))).toBe(0);
  expect(stepsDoneToday(withToday(days(), ['vitals', 'vitals', 'intake']))).toBe(2);
  expect(stepsDoneToday(days(47))).toBe(5);
});
