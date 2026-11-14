import { assessDaily, expectedBoneLoss, indicatorStatus, symptomFindings, worst } from './status';
import { profile, withSymptoms } from './test-helpers';
import type { IndicatorId, Status } from './types';

/** Status of one indicator when the last days up to day 47 hold the given values. */
function st(id: IndicatorId, baseline: number | undefined, values: number[]): Status {
  const first = 47 - values.length + 1;
  const rows = values.map((value, i) => ({ day: first + i, [id]: value }));
  return indicatorStatus(profile(rows, { [id]: baseline }), id, 47).status;
}

const three = (v: number) => [v, v, v];
const seven = (v: number) => [v, v, v, v, v, v, v];

describe('limits against the personal baseline', () => {
  test.each([
    [three(66), 'nominal'],
    [three(70), 'caution'],
    [three(76), 'warning'],
    [three(50), 'caution'],
  ])('heart rate %j with baseline 60 is %s', (values, expected) => {
    expect(st('heartRate', 60, values)).toBe(expected);
  });

  test.each([
    [three(133), 'caution'],
    [three(145), 'warning'],
  ])('systolic pressure %j with baseline 120 is %s', (values, expected) => {
    expect(st('bpSystolic', 120, values)).toBe(expected);
  });

  test.each([
    [three(80), 'nominal'],
    [three(84), 'caution'],
    [three(60), 'warning'],
  ])('diastolic pressure %j with baseline 76 is %s', (values, expected) => {
    expect(st('bpDiastolic', 76, values)).toBe(expected);
  });

  test.each([
    [three(104), 'caution'],
    [three(118), 'warning'],
  ])('blood sugar %j with baseline 90 is %s', (values, expected) => {
    expect(st('bloodSugar', 90, values)).toBe(expected);
  });

  test.each([
    [37.1, 'nominal'],
    [37.2, 'caution'],
    [37.7, 'warning'],
    [35.9, 'nominal'],
  ])('body temperature %f with baseline 36.7 is %s', (last, expected) => {
    expect(st('bodyTemp', 36.7, [36.7, 36.7, last])).toBe(expected);
  });

  test.each([
    [three(6.6), 'nominal'],
    [three(6.5), 'caution'],
    [three(5.5), 'warning'],
    [three(9), 'nominal'],
  ])('sleep %j with baseline 7.5 is %s', (values, expected) => {
    expect(st('sleepHours', 7.5, values)).toBe(expected);
  });

  test.each([
    [[3, 3, 2], 'nominal'],
    [[2, 3, 2.5], 'caution'],
    [[1, 2, 1.5], 'warning'],
  ])('mood %j is %s', (values, expected) => {
    expect(st('mood', 4, values)).toBe(expected);
    expect(st('appetite', undefined, values)).toBe(expected);
  });

  test.each([
    [three(1.92), 'nominal'],
    [three(1.9), 'caution'],
    [three(1.4), 'warning'],
  ])('water %j with baseline 2.4 is %s', (values, expected) => {
    expect(st('waterLiters', 2.4, values)).toBe(expected);
  });

  test.each([
    [seven(1.2), 'nominal'], // 8.4 h, exactly 80% of 10.5
    [[1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.1], 'caution'], // 8.3 h
    [[1, 1, 1, 1, 1, 0.2, 0], 'warning'], // 5.2 h
  ])('exercise %j over 7 days is %s', (values, expected) => {
    expect(st('exerciseHours', undefined, values)).toBe(expected);
  });

  test.each([
    [4, 'nominal'],
    [3, 'caution'],
    [2, 'warning'],
  ])('strength %i with baseline 4 is %s', (last, expected) => {
    expect(st('strength', 4, [last])).toBe(expected);
  });

  test.each([
    [183, 'nominal'],
    [183.5, 'caution'],
    [195, 'caution'], // height has no warning level
  ])('height %f with baseline 178 is %s', (last, expected) => {
    expect(st('heightCm', 178, [last])).toBe(expected);
  });

  test.each([
    [300, 'nominal'],
    [322, 'caution'],
    [364, 'warning'],
    [200, 'nominal'],
  ])('reaction time %i ms with baseline 280 is %s', (last, expected) => {
    expect(st('reactionMs', 280, [last])).toBe(expected);
  });

  test.each([
    [6, 'nominal'],
    [5, 'caution'],
    [4, 'warning'],
  ])('vision level %i with baseline 6 is %s', (last, expected) => {
    expect(st('visionLevel', 6, [last])).toBe(expected);
  });

  test('radiation never takes a status and is never due', () => {
    const f = indicatorStatus(profile([{ day: 47, radiationDose: 900 }]), 'radiationDose', 47);
    expect(f).toMatchObject({ status: 'nominal', due: false, value: 900 });
    expect(indicatorStatus(profile([]), 'radiationDose', 47)).toMatchObject({ status: 'nominal', due: false });
  });
});

describe('missing data', () => {
  test('no values means due, not flagged', () => {
    const f = indicatorStatus(profile([], { heartRate: 60 }), 'heartRate', 10);
    expect(f).toMatchObject({ indicator: 'heartRate', status: 'nominal', due: true, value: null });
  });

  test('missing or zero baseline never produces NaN', () => {
    for (const base of [undefined, 0]) {
      for (const id of ['heartRate', 'bodyTemp', 'sleepHours', 'waterLiters', 'strength', 'heightCm'] as IndicatorId[]) {
        const f = indicatorStatus(profile([{ day: 10, [id]: 70 }], { [id]: base }), id, 10);
        expect(f.due, id).toBe(true);
        expect(f.status, id).toBe('nominal');
        expect(f.reason, id).not.toMatch(/NaN|Infinity|undefined/);
      }
    }
  });

  test('scales and the exercise total need no baseline', () => {
    expect(indicatorStatus(profile([{ day: 47, mood: 1 }]), 'mood', 47)).toMatchObject({ status: 'warning', due: false });
    expect(indicatorStatus(profile([{ day: 47, exerciseHours: 0 }]), 'exerciseHours', 47)).toMatchObject({
      status: 'warning',
      due: false,
    });
  });

  test('a skipped week does not leak old values into today', () => {
    const p = profile(
      [
        { day: 30, heartRate: 90 },
        { day: 31, heartRate: 90 },
        { day: 32, heartRate: 90 },
      ],
      { heartRate: 60 },
    );
    expect(indicatorStatus(p, 'heartRate', 47).due).toBe(true);
    expect(indicatorStatus(p, 'heartRate', 47).status).toBe('nominal');
  });

  test('days without an exercise entry are not counted as zero hours', () => {
    // Five recorded days on target; two days with no entry at all.
    const rows = [41, 42, 43, 44, 45].map((day) => ({ day, exerciseHours: 1.5 }));
    expect(indicatorStatus(profile(rows), 'exerciseHours', 47).status).toBe('nominal');
  });

  test('a weekly measurement stays valid for its week and is due after it', () => {
    const base = { visionLevel: 6 };
    expect(indicatorStatus(profile([{ day: 42, visionLevel: 5 }], base), 'visionLevel', 47)).toMatchObject({
      status: 'caution',
      due: false,
    });
    expect(indicatorStatus(profile([{ day: 40, visionLevel: 5 }], base), 'visionLevel', 47)).toMatchObject({
      status: 'nominal',
      due: true,
    });
  });
});

describe('reasons', () => {
  test('say what was compared', () => {
    const p = profile(
      [45, 46, 47].map((day) => ({ day, heartRate: 70 })),
      { heartRate: 60 },
    );
    expect(indicatorStatus(p, 'heartRate', 47).reason).toBe('3-day average 70 bpm, 16.7% above baseline');
  });

  test('the exercise total names hours and target', () => {
    const rows = [1.5, 1, 0.5, 1.5, 1, 0, 1].map((exerciseHours, i) => ({ day: 40 + i, exerciseHours }));
    const f = indicatorStatus(profile(rows), 'exerciseHours', 47);
    expect(f.value).toBeCloseTo(6.5);
    expect(f.reason).toBe('6.5 of 10.5 h over the last 7 days');
  });
});

describe('symptoms', () => {
  test('one is caution, two are warning, an urgent one is warning', () => {
    expect(assessDaily(withSymptoms(47, ['headache']), 'lungs', 47).status).toBe('caution');
    expect(assessDaily(withSymptoms(47, ['headache', 'confusion']), 'lungs', 47).status).toBe('warning');
    expect(assessDaily(withSymptoms(47, ['painAfterSpacewalk']), 'lungs', 47).status).toBe('warning');
  });

  test("yesterday's symptom does not flag today", () => {
    expect(assessDaily(withSymptoms(46, ['headache']), 'lungs', 47).status).toBe('nominal');
  });

  test('a symptom only counts for its own region', () => {
    const p = withSymptoms(47, ['headache', 'rash']);
    expect(assessDaily(p, 'lungs', 47).status).toBe('caution');
    expect(assessDaily(p, 'immune', 47).status).toBe('caution');
    expect(assessDaily(p, 'heart', 47).status).toBe('nominal');
    expect(symptomFindings(p, 'lungs', 47).map((f) => f.symptom)).toEqual(['headache']);
  });

  test('an unknown symptom id is ignored', () => {
    expect(assessDaily(withSymptoms(47, ['notASymptom']), 'lungs', 47).status).toBe('nominal');
  });
});

describe('regions', () => {
  test('region takes its worst finding', () => {
    const rows = [45, 46, 47].map((day) => ({ day, heartRate: 70, bpSystolic: 145, bpDiastolic: 76 }));
    const a = assessDaily(profile(rows, { heartRate: 60, bpSystolic: 120, bpDiastolic: 76 }), 'heart', 47);
    expect(a.status).toBe('warning');
    expect(a.findings.map((f) => [f.indicator, f.status])).toEqual([
      ['heartRate', 'caution'],
      ['bpSystolic', 'warning'],
      ['bpDiastolic', 'nominal'],
    ]);
  });

  test('exercise decides Bones, not Muscles', () => {
    const rows = [41, 42, 43, 44, 45, 46, 47].map((day) => ({ day, exerciseHours: 0 }));
    const p = profile(rows);
    expect(assessDaily(p, 'bones', 47).status).toBe('warning');
    expect(assessDaily(p, 'muscles', 47).status).toBe('nominal');
  });

  test('worst orders nominal, caution, warning', () => {
    expect(worst('nominal', 'caution')).toBe('caution');
    expect(worst('warning', 'caution')).toBe('warning');
    expect(worst('nominal', 'nominal')).toBe('nominal');
  });

  test('expected bone loss follows 1% to 1.5% per 30 days', () => {
    expect(expectedBoneLoss(30)).toEqual({ min: 1, max: 1.5 });
    expect(expectedBoneLoss(47).min).toBeCloseTo(1.567, 3);
    expect(expectedBoneLoss(47).max).toBeCloseTo(2.35, 3);
  });
});
