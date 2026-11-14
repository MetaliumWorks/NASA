import { criticalReading } from './critical';
import { indicatorStatus } from './status';
import { profile } from './test-helpers';
import type { IndicatorId } from './types';

const base = { heartRate: 62, bpSystolic: 118, bpDiastolic: 76, bloodSugar: 90, bodyTemp: 36.7, sleepHours: 7.5, waterLiters: 2.4, reactionMs: 280, visionLevel: 6 };
const p = profile([], base);
const critical = (id: IndicatorId, value: number) => criticalReading(p, id, value) !== null;

test.each([
  ['heartRate', 92, false], // +48%
  ['heartRate', 93, true], // +50%
  ['heartRate', 31, true], // -50%
  ['heartRate', 32, false],
  ['bpSystolic', 165, false],
  ['bpSystolic', 166, true], // +40.7%
  ['bpSystolic', 70, true], // -40.7%
  ['bpDiastolic', 107, true],
  ['bloodSugar', 144, true], // +60%
  ['bloodSugar', 143, false],
  ['bloodSugar', 36, true], // -60%
  ['bodyTemp', 38.6, false],
  ['bodyTemp', 38.7, true], // +2.0
  ['bodyTemp', 34, false], // only a high temperature has a limit
  ['sleepHours', 3.6, false],
  ['sleepHours', 3.5, true], // 4 h less
  ['sleepHours', 12, false],
  ['waterLiters', 0.5, false],
  ['waterLiters', 0.48, true], // 20% of baseline
  ['waterLiters', 0, true],
  ['reactionMs', 448, true], // 60% slower
  ['reactionMs', 447, false],
  ['visionLevel', 2, true], // 4 levels below
  ['visionLevel', 3, false],
] as [IndicatorId, number, boolean][])('%s %f critical: %s', (id, value, expected) => {
  expect(critical(id, value)).toBe(expected);
});

test('the reason says how far from baseline, in the unit of the limit', () => {
  expect(criticalReading(p, 'heartRate', 140)).toMatchObject({
    indicator: 'heartRate',
    value: 140,
    baseline: 62,
    direction: 'above',
    reason: 'Critical reading 140 bpm, 125.8% above baseline',
  });
  expect(criticalReading(p, 'bodyTemp', 39.2)?.reason).toBe('Critical reading 39.2 °C, 2.5 °C above baseline');
  expect(criticalReading(p, 'sleepHours', 2)?.reason).toBe('Critical reading 2 h, 5.5 h below baseline');
  expect(criticalReading(p, 'waterLiters', 0.3)?.reason).toBe('Critical reading 0.3 L, 87.5% below baseline');
});

test('without a baseline, and for indicators with no critical limit, nothing is critical', () => {
  expect(criticalReading(profile([]), 'heartRate', 200)).toBeNull();
  expect(criticalReading(profile([], { heartRate: 0 }), 'heartRate', 200)).toBeNull();
  expect(criticalReading(profile([], { mood: 4 }), 'mood', 1)).toBeNull();
  expect(criticalReading(p, 'radiationDose', 900)).toBeNull();
  expect(criticalReading(p, 'exerciseHours', 0)).toBeNull();
});

describe('in the status of the day', () => {
  test('one critical reading is a warning on its own day, whatever the average says', () => {
    const rows = [
      { day: 45, heartRate: 62 },
      { day: 46, heartRate: 62 },
      { day: 47, heartRate: 96 }, // the 3-day average is 73.3, 18% above: only a caution
    ];
    const f = indicatorStatus(profile(rows, base), 'heartRate', 47);
    expect(f).toMatchObject({ status: 'warning', critical: true, value: 96, direction: 'above', due: false });
    expect(f.reason).toBe('Critical reading 96 bpm, 54.8% above baseline');
  });

  test('yesterday’s critical reading is judged by the average today', () => {
    const rows = [
      { day: 45, heartRate: 62 },
      { day: 46, heartRate: 96 },
      { day: 47, heartRate: 62 },
    ];
    const f = indicatorStatus(profile(rows, base), 'heartRate', 47);
    expect(f.critical).toBeUndefined();
    expect(f.status).toBe('caution');
  });

  test('a flagged indicator says which side of baseline it is on', () => {
    const high = profile([45, 46, 47].map((day) => ({ day, heartRate: 72, bpSystolic: 100, waterLiters: 1.2 })), base);
    expect(indicatorStatus(high, 'heartRate', 47).direction).toBe('above');
    expect(indicatorStatus(high, 'bpSystolic', 47).direction).toBe('below');
    expect(indicatorStatus(high, 'waterLiters', 47).direction).toBe('below');
    const quiet = profile([{ day: 47, heartRate: 62 }], base);
    expect(indicatorStatus(quiet, 'heartRate', 47).direction).toBeUndefined();
  });
});
