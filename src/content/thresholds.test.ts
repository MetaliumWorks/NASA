import { ALL_INDICATORS } from '../domain/types';
import { MISSIONS } from './missions';
import { EXERCISE_TARGET_PER_DAY, LONG_TERM, THRESHOLDS } from './thresholds';

test('every indicator has a rule', () => {
  expect(Object.keys(THRESHOLDS).sort()).toEqual([...ALL_INDICATORS].sort());
});

test('weekly exercise target is 10.5 h', () => {
  expect(EXERCISE_TARGET_PER_DAY * 7).toBe(10.5);
});

test('heart rate flags at 15% and 25% from baseline', () => {
  expect(THRESHOLDS.heartRate).toEqual({ kind: 'percentAvg3', caution: 0.15, warning: 0.25, trendMin: 0.075 });
});

test('radiation has no status rule', () => {
  expect(THRESHOLDS.radiationDose).toEqual({ kind: 'none' });
});

test('long-term windows follow the spec', () => {
  expect(LONG_TERM.recurring).toEqual({ days: 7, count: 3 });
  expect(LONG_TERM.persistent).toEqual({ days: 30, count: 10 });
  expect(LONG_TERM.sustained).toEqual({ days: 30, count: 15 });
});

test('missions carry the durations and comms lines from the spec', () => {
  expect(MISSIONS.station).toMatchObject({ days: 180, commsLine: 'Real-time support from the ground' });
  expect(MISSIONS.moon).toMatchObject({ days: 30, commsLine: null });
  expect(MISSIONS.mars).toMatchObject({ days: 1095, commsLine: 'Up to 20 minutes one way' });
});
