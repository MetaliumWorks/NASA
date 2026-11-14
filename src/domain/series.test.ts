import { entryFor, mean, recent, valuesFor } from './series';
import { profile } from './test-helpers';

const p = profile([
  { day: 40, heartRate: 60 },
  { day: 45, heartRate: 70 },
  { day: 46, heartRate: 72 },
  { day: 47, heartRate: 74 },
]);

test('recent returns the newest n values', () => {
  expect(recent(p, 'heartRate', 47, 3)).toEqual([70, 72, 74]);
});

test('recent drops stale values', () => {
  // day 40 is older than 47 - (4 + 1) = 42
  expect(recent(p, 'heartRate', 47, 4)).toEqual([70, 72, 74]);
});

test('recent ignores later days', () => {
  expect(recent(p, 'heartRate', 45, 3)).toEqual([70]);
});

test('recent ignores days that have no value for the indicator', () => {
  const q = profile([{ day: 46, heartRate: 70 }, { day: 47, mood: 4 }]);
  expect(recent(q, 'heartRate', 47, 3)).toEqual([70]);
});

test('valuesFor returns day and value pairs in day order', () => {
  expect(valuesFor(p, 'heartRate', 45, 46)).toEqual([
    { day: 45, value: 70 },
    { day: 46, value: 72 },
  ]);
});

test('mean of nothing is null', () => {
  expect(mean([])).toBeNull();
});

test('mean averages the values', () => {
  expect(mean([1, 2, 3])).toBe(2);
});

test('entryFor finds the entry of a day', () => {
  expect(entryFor(p, 46)?.values.heartRate).toBe(72);
  expect(entryFor(p, 41)).toBeUndefined();
});
