import { assessAll, assessRegion, flagged } from './assess';
import { createDemoProfile } from './demo';
import { longTermFindings } from './longterm';
import { heartRateDays, profile, range, symptomOn, weeklySleep } from './test-helpers';

describe('symptoms that keep coming back', () => {
  test('same symptom on 3 of the last 7 days is recurring', () => {
    const f = longTermFindings(symptomOn([41, 43, 45], 'troubleSleeping'), 'brain', 47);
    expect(f).toEqual([expect.objectContaining({ symptom: 'troubleSleeping', status: 'caution', label: 'recurring' })]);
  });

  test('2 of the last 7 days is not recurring', () => {
    expect(longTermFindings(symptomOn([43, 45], 'troubleSleeping'), 'brain', 47)).toEqual([]);
  });

  test('days before the 7-day window do not count', () => {
    expect(longTermFindings(symptomOn([39, 40, 45], 'troubleSleeping'), 'brain', 47)).toEqual([]);
  });

  test('10 of the last 30 days is persistent', () => {
    const days = [18, 20, 22, 24, 26, 28, 30, 32, 34, 36];
    expect(longTermFindings(symptomOn(days, 'rash'), 'immune', 47)[0]).toMatchObject({
      status: 'warning',
      label: 'persistent',
      reason: 'Reported on 10 of the last 30 days',
    });
  });

  test('9 of the last 30 days is not persistent', () => {
    const days = [18, 20, 22, 24, 26, 28, 30, 32, 34];
    expect(longTermFindings(symptomOn(days, 'rash'), 'immune', 47)).toEqual([]);
  });

  test('a symptom that is both recurring and persistent is reported once, as persistent', () => {
    const f = longTermFindings(symptomOn(range(36, 47), 'rash'), 'immune', 47);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ status: 'warning', label: 'persistent' });
  });

  test('a symptom of another region is not reported here', () => {
    expect(longTermFindings(symptomOn([41, 43, 45], 'troubleSleeping'), 'immune', 47)).toEqual([]);
  });

  test('reasons say how often', () => {
    const f = longTermFindings(symptomOn([41, 43, 45, 46], 'troubleSleeping'), 'brain', 47);
    expect(f[0].reason).toBe('Reported on 4 of the last 7 days');
  });
});

describe('an indicator that stays out of range', () => {
  test('at caution on 15 of the last 30 days is sustained', () => {
    const p = heartRateDays({ high: range(18, 32), normal: range(33, 47) }); // 15 days at 70, 15 at 60; baseline 60
    expect(longTermFindings(p, 'heart', 47)).toContainEqual(
      expect.objectContaining({ indicator: 'heartRate', status: 'warning', label: 'sustained' }),
    );
  });

  test('14 of the last 30 days is not sustained', () => {
    const p = heartRateDays({ high: range(19, 32), normal: range(33, 47) });
    expect(longTermFindings(p, 'heart', 47)).toEqual([]);
  });
});

describe('slow drift', () => {
  test('sleep drifting 7.5, 7.2, 6.95, 6.7 over four weeks is trending', () => {
    const f = longTermFindings(weeklySleep([7.5, 7.2, 6.95, 6.7]), 'brain', 47);
    expect(f).toContainEqual(expect.objectContaining({ indicator: 'sleepHours', status: 'caution', label: 'trending' }));
  });

  test('a drift below the floor is not trending', () => {
    expect(longTermFindings(weeklySleep([7.5, 7.4, 7.3, 7.2]), 'brain', 47)).toEqual([]);
  });

  test('a drift that reverses is not trending', () => {
    expect(longTermFindings(weeklySleep([7.5, 6.9, 7.3, 6.7]), 'brain', 47)).toEqual([]);
  });

  test('moving back toward baseline is not trending', () => {
    expect(longTermFindings(weeklySleep([9.5, 9, 8.5, 8]), 'brain', 47)).toEqual([]);
  });

  test('fewer than 4 values in a week gives no trend', () => {
    const p = weeklySleep([7.5, 7.2, 6.95, 6.7]);
    // Keep only three entries of the newest week.
    const thinned = { ...p, entries: p.entries.filter((e) => e.day <= 43) };
    expect(longTermFindings(thinned, 'brain', 47)).toEqual([]);
  });

  test('a two-sided indicator drifting upward is trending', () => {
    // Heart rate 60, 62, 64, 66 by week: each day inside its daily limit, 10% up in four weeks.
    const rows = [60, 62, 64, 66].flatMap((heartRate, i) => range(20 + i * 7, 26 + i * 7).map((day) => ({ day, heartRate })));
    const f = longTermFindings(profile(rows, { heartRate: 60 }), 'heart', 47);
    expect(f).toEqual([expect.objectContaining({ indicator: 'heartRate', status: 'caution', label: 'trending' })]);
  });

  test('a mood sliding week after week is trending without a baseline', () => {
    const rows = [4.4, 4.1, 3.8, 3.5].flatMap((mood, i) => range(20 + i * 7, 26 + i * 7).map((day) => ({ day, mood })));
    const f = longTermFindings(profile(rows), 'brain', 47);
    expect(f).toContainEqual(expect.objectContaining({ indicator: 'mood', label: 'trending' }));
  });
});

describe('the whole picture', () => {
  test('assessRegion is the worst of daily and long-term', () => {
    const a = assessRegion(symptomOn([41, 43, 45], 'troubleSleeping'), 'brain', 47);
    expect(a.status).toBe('caution');
    expect(a.findings).toContainEqual(expect.objectContaining({ symptom: 'troubleSleeping', label: 'recurring' }));
  });

  test('a long-term warning outranks a daily caution', () => {
    const a = assessRegion(symptomOn([...range(30, 40), 47], 'rash'), 'immune', 47);
    expect(a.findings).toContainEqual(expect.objectContaining({ symptom: 'rash', status: 'caution' }));
    expect(a.status).toBe('warning');
  });

  test('flagged lists warnings before cautions', () => {
    expect(flagged(assessAll(createDemoProfile(), 47)).map((a) => a.region)).toEqual(['kidneys', 'brain', 'bones']);
    expect(flagged(assessAll(profile([]), 47))).toEqual([]);
  });

  test('assessAll covers the 13 regions', () => {
    const all = assessAll(profile([]), 47);
    expect(Object.keys(all)).toHaveLength(13);
    Object.values(all).forEach((a) => expect(a.status).toBe('nominal'));
  });
});
