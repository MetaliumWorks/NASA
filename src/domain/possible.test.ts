import { assessAll } from './assess';
import { followUp, matchConditions, matchesFor } from './possible';
import { profile, range, symptomOn, withSymptoms } from './test-helpers';
import type { Profile } from './types';

const match = (p: Profile, day = 47) => matchConditions(p, day, assessAll(p, day));
const ids = (p: Profile, day = 47) => match(p, day).map((m) => m.condition.id);

describe('from symptoms', () => {
  test('a symptom reported today points to the condition the source ties it to', () => {
    expect(ids(withSymptoms(47, ['motionSickness']))).toEqual(['spaceMotionSickness']);
    expect(ids(withSymptoms(47, ['lightheaded']))).toEqual(['lowBloodPressure']);
    expect(ids(withSymptoms(47, ['rash']))).toEqual(['alteredImmunity']);
    expect(ids(withSymptoms(47, ['blurredVision']))).toEqual(['sans']);
  });

  test('the match says what points to it and how heavy it is', () => {
    const [m] = match(withSymptoms(47, ['motionSickness', 'dizziness']));
    expect(m).toMatchObject({ status: 'warning', urgent: true, signs: ['Motion sickness', 'Dizziness'], regions: ['innerEar'] });
    const [one] = match(withSymptoms(47, ['motionSickness']));
    expect(one).toMatchObject({ status: 'caution', urgent: false, signs: ['Motion sickness'] });
  });

  test('mild hypoxia takes two of its effects, one of them a headache or confusion', () => {
    expect(ids(withSymptoms(47, ['headache']))).toEqual([]);
    expect(ids(withSymptoms(47, ['headache', 'confusion']))).toEqual(['mildHypoxia']);
    expect(ids(withSymptoms(47, ['headache', 'troubleSleeping']))).toEqual(['sleepLoss', 'mildHypoxia']);
    // Blurred vision with trouble sleeping has neither a headache nor confusion.
    expect(ids(withSymptoms(47, ['blurredVision', 'troubleSleeping']))).toEqual(['sleepLoss', 'sans']);
  });

  test('a condition can draw on the symptoms of several systems', () => {
    const [hypoxia] = match(withSymptoms(47, ['headache', 'blurredVision'])).filter((m) => m.condition.id === 'mildHypoxia');
    expect(hypoxia.regions.sort()).toEqual(['eyes', 'lungs']);
    expect(hypoxia.signs).toEqual(['Headache', 'Blurred vision']);
  });

  test('pain after a spacewalk is decompression sickness and urgent', () => {
    const [m] = match(withSymptoms(47, ['painAfterSpacewalk']));
    expect(m).toMatchObject({ status: 'warning', urgent: true });
    expect(m.condition.id).toBe('decompressionSickness');
  });

  test('yesterday’s symptom points to nothing today', () => {
    expect(ids(withSymptoms(46, ['rash']))).toEqual([]);
  });

  test('a symptom that keeps coming back still points to its condition on a day it is not reported', () => {
    const p = symptomOn([41, 43, 45], 'troubleSleeping');
    expect(ids(p)).toEqual(['sleepLoss']);
    expect(match(p)[0]).toMatchObject({ status: 'caution', signs: ['Trouble sleeping'] });
  });
});

describe('from indicators', () => {
  const days = (values: Record<string, number>) => profile(range(45, 47).map((day) => ({ day, ...values })), { heartRate: 62, bpSystolic: 118, bpDiastolic: 76, bloodSugar: 90, bodyTemp: 36.7, waterLiters: 2.4, sleepHours: 7.5 });

  test('low water points to dehydration', () => {
    const [m] = match(days({ waterLiters: 1.2 }));
    expect(m.condition.id).toBe('dehydration');
    expect(m).toMatchObject({ status: 'warning', urgent: true, signs: ['Water: 3-day average 1.2 L, 50% of baseline'] });
  });

  test('blood pressure below baseline is low blood pressure; above it, cardiovascular adaptation', () => {
    expect(ids(days({ bpSystolic: 100 }))).toEqual(['lowBloodPressure']);
    expect(ids(days({ bpSystolic: 136 }))).toEqual(['cardiovascularAdaptation']);
  });

  test('blood sugar above baseline points to insulin resistance; below it, to nothing the sources describe', () => {
    expect(ids(days({ bloodSugar: 110 }))).toEqual(['insulinResistance']);
    expect(ids(days({ bloodSugar: 70 }))).toEqual([]);
  });

  test('a raised temperature points to an altered immune response', () => {
    expect(ids(days({ bodyTemp: 37.4 }))).toEqual(['alteredImmunity']);
  });

  test('nothing out of range, nothing possible', () => {
    expect(ids(days({ heartRate: 62, bpSystolic: 118, waterLiters: 2.4 }))).toEqual([]);
    expect(ids(profile([]))).toEqual([]);
  });

  test('a symptom and a measurement of the same condition make one match', () => {
    const p = days({ bpSystolic: 100 });
    p.entries[2].symptoms = ['lightheaded'];
    const m = match(p);
    expect(m.map((x) => x.condition.id)).toEqual(['lowBloodPressure']);
    expect(m[0].signs).toEqual(['Lightheaded or faint', 'Blood pressure, systolic: 3-day average 100 mmHg, 15.3% below baseline']);
  });
});

test('warnings are listed before cautions', () => {
  const p = withSymptoms(47, ['rash', 'motionSickness', 'dizziness']);
  expect(match(p).map((m) => [m.condition.id, m.status])).toEqual([
    ['spaceMotionSickness', 'warning'],
    ['alteredImmunity', 'caution'],
  ]);
});

test('matchesFor gives a system the conditions its findings point to', () => {
  const m = match(withSymptoms(47, ['headache', 'blurredVision']));
  expect(matchesFor(m, 'lungs').map((x) => x.condition.id)).toEqual(['mildHypoxia']);
  expect(matchesFor(m, 'eyes').map((x) => x.condition.id).sort()).toEqual(['mildHypoxia', 'sans']);
  expect(matchesFor(m, 'heart')).toEqual([]);
});

describe('what the app asks next', () => {
  test('feeling faint: it wants blood pressure and heart rate', () => {
    expect(followUp(['lightheaded'])).toMatchObject({ measure: ['heartRate', 'bpSystolic', 'bpDiastolic'], alsoAsk: [] });
  });

  test('a headache: it asks about the other effects of mild hypoxia', () => {
    const f = followUp(['headache']);
    expect(f.alsoAsk).toEqual(['troubleSleeping', 'blurredVision', 'confusion']);
    expect(f.measure).toEqual([]);
    expect(f.conditions.map((c) => c.id)).toEqual(['mildHypoxia']);
  });

  test('blurred vision: it wants the vision test', () => {
    expect(followUp(['blurredVision']).measure).toEqual(['visionLevel']);
  });

  test('a rash: it wants the temperature and asks about the other immune signs', () => {
    const f = followUp(['rash']);
    expect(f.measure).toEqual(['bodyTemp']);
    expect(f.alsoAsk).toEqual(['coldSores', 'allergy', 'infection']);
  });

  test('motion sickness needs no measurement', () => {
    expect(followUp(['motionSickness'])).toMatchObject({ measure: [], alsoAsk: ['disorientation', 'dizziness'] });
  });

  test('nothing reported, nothing asked', () => {
    expect(followUp([])).toEqual({ conditions: [], alsoAsk: [], measure: [] });
  });
});
