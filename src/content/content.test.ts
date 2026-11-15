import { readFileSync, readdirSync } from 'node:fs';
import { ALL_INDICATORS, type IndicatorId } from '../domain/types';
import { CONDITIONS } from './conditions';
import { HAZARDS } from './hazards';
import { INDICATORS } from './indicators';
import { REGION_ORDER, REGIONS } from './regions';
import { SOURCES, type Sourced } from './sources';
import { SYMPTOMS } from './symptoms';

const norm = (s: string) =>
  s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
const file = (id: string) => norm(readFileSync(`docs/sources/${id}.txt`, 'utf8'));

const allSourced: Sourced[] = [
  ...REGION_ORDER.flatMap((id) => [
    ...REGIONS[id].impression,
    ...(REGIONS[id].function ? [REGIONS[id].function as Sourced] : []),
    ...REGIONS[id].recommendations.flatMap((r) => (r.basis ? [r.basis] : [])),
  ]),
  ...ALL_INDICATORS.map((id) => INDICATORS[id].why),
  ...SYMPTOMS.map((s) => s.basis),
  ...CONDITIONS.map((c) => c.about),
];

test('SOURCES covers every saved page', () => {
  const saved = readdirSync('docs/sources').map((f) => f.replace('.txt', ''));
  expect(Object.keys(SOURCES).sort()).toEqual(saved.sort());
});

test('every source address matches the saved page', () => {
  for (const [id, s] of Object.entries(SOURCES)) {
    const first = readFileSync(`docs/sources/${id}.txt`, 'utf8').split(/\r?\n/)[0];
    expect(first, id).toBe(`SOURCE: ${s.url}`);
  }
});

test('source titles are unique', () => {
  const titles = Object.values(SOURCES).map((s) => s.title);
  expect(new Set(titles).size).toBe(titles.length);
});

test('every health text names a known source', () => {
  expect(allSourced.length).toBeGreaterThan(60);
  allSourced.forEach((s) => expect(SOURCES[s.source], s.text).toBeDefined());
});

test('every quote appears verbatim in its source page', () => {
  allSourced.forEach((s) => expect(file(s.source).includes(norm(s.quote)), `${s.source}: ${s.quote}`).toBe(true));
});

test('quotes are real sentences, not fragments', () => {
  allSourced.forEach((s) => expect(norm(s.quote).length, s.quote).toBeGreaterThanOrEqual(20));
});

test('all 13 regions exist with an impression and a ground-report item', () => {
  expect(REGION_ORDER).toHaveLength(13);
  REGION_ORDER.forEach((id) => {
    expect(REGIONS[id].id).toBe(id);
    expect(REGIONS[id].impression.length).toBeGreaterThanOrEqual(1);
    expect(REGIONS[id].impression.length).toBeLessThanOrEqual(3);
    const report = REGIONS[id].recommendations.filter((r) => r.kind === 'groundReport');
    expect(report).toHaveLength(1);
    expect(report[0].id).toBe(`groundReport-${id}`);
  });
});

test('only the ground-report item may lack a basis', () => {
  REGION_ORDER.flatMap((id) => REGIONS[id].recommendations).forEach((r) =>
    expect(r.basis === null, r.id).toBe(r.kind === 'groundReport'),
  );
});

test('the six indicators named by the challenge are present', () => {
  (['bpSystolic', 'heartRate', 'bloodSugar', 'bodyTemp', 'sleepHours', 'mood'] as IndicatorId[]).forEach((id) =>
    expect(INDICATORS[id]).toBeDefined(),
  );
});

test('each indicator is owned by exactly one region', () => {
  ALL_INDICATORS.forEach((id) => {
    const owners = REGION_ORDER.filter((r) => REGIONS[r].indicators.includes(id));
    expect(owners, id).toEqual([INDICATORS[id].region]);
  });
});

test('exercise decides Bones and is only shown under Muscles', () => {
  expect(INDICATORS.exerciseHours.region).toBe('bones');
  expect(REGIONS.muscles.related).toEqual(['exerciseHours']);
  expect(REGIONS.muscles.indicators).toEqual(['strength']);
});

test('each symptom belongs to a real region and ids are unique', () => {
  SYMPTOMS.forEach((s) => expect(REGIONS[s.region], s.id).toBeDefined());
  expect(new Set(SYMPTOMS.map((s) => s.id)).size).toBe(SYMPTOMS.length);
});

test('only pain after a spacewalk is marked urgent', () => {
  expect(SYMPTOMS.filter((s) => s.urgent).map((s) => s.id)).toEqual(['painAfterSpacewalk']);
});

test('the five hazards point at their own source pages', () => {
  expect(Object.keys(HAZARDS).sort()).toEqual(['distance', 'environment', 'gravity', 'isolation', 'radiation']);
  Object.values(HAZARDS).forEach((h) => expect(SOURCES[h.source], h.name).toBeDefined());
});

test('region hazards are known hazards', () => {
  REGION_ORDER.forEach((id) => {
    expect(REGIONS[id].hazards.length).toBeGreaterThanOrEqual(1);
    REGIONS[id].hazards.forEach((h) => expect(HAZARDS[h], `${id}:${h}`).toBeDefined());
  });
});

test('weekly indicators are the four from the spec', () => {
  const weekly = ALL_INDICATORS.filter((id) => INDICATORS[id].cadence === 'weekly');
  expect(weekly.sort()).toEqual(['heightCm', 'reactionMs', 'strength', 'visionLevel']);
});

test('recommendation ids are unique within a region and shared objects are reused', () => {
  REGION_ORDER.forEach((id) => {
    const ids = REGIONS[id].recommendations.map((r) => r.id);
    expect(new Set(ids).size, id).toBe(ids.length);
  });
  const inBones = REGIONS.bones.recommendations.find((r) => r.id === 'dailyExercise');
  const inMuscles = REGIONS.muscles.recommendations.find((r) => r.id === 'dailyExercise');
  expect(inBones).toBeDefined();
  expect(inBones).toBe(inMuscles);
});

describe('possible conditions', () => {
  const symptomIds = new Set(SYMPTOMS.map((s) => s.id));

  test('ids are unique and each condition belongs to a real region', () => {
    expect(new Set(CONDITIONS.map((c) => c.id)).size).toBe(CONDITIONS.length);
    CONDITIONS.forEach((c) => expect(REGIONS[c.region], c.id).toBeDefined());
  });

  test('every sign is a real symptom or indicator', () => {
    for (const c of CONDITIONS) {
      c.symptoms.forEach((s) => expect(symptomIds.has(s), `${c.id}: ${s}`).toBe(true));
      (c.core ?? []).forEach((s) => expect(c.symptoms, `${c.id}: ${s}`).toContain(s));
      (c.indicators ?? []).forEach((i) => expect(INDICATORS[i.id], `${c.id}: ${i.id}`).toBeDefined());
      c.ask.forEach((id) => expect(INDICATORS[id], `${c.id}: ${id}`).toBeDefined());
      expect(c.symptoms.length + (c.indicators ?? []).length, c.id).toBeGreaterThan(0);
      expect(c.needs ?? 1, c.id).toBeLessThanOrEqual(Math.max(1, c.symptoms.length));
    }
  });

  test('every action is a recommendation of the condition’s own region', () => {
    for (const c of CONDITIONS) {
      const ids = REGIONS[c.region].recommendations.map((r) => r.id);
      c.actions.forEach((a) => expect(ids, `${c.id}: ${a}`).toContain(a));
    }
  });

  test('every symptom is a sign of at least one condition', () => {
    SYMPTOMS.forEach((s) => expect(CONDITIONS.some((c) => c.symptoms.includes(s.id)), s.id).toBe(true));
  });

  test('every indicator with a limit points to a condition when it is out of range', () => {
    const covered = new Set(CONDITIONS.flatMap((c) => (c.indicators ?? []).map((i) => i.id)));
    ALL_INDICATORS.filter((id) => id !== 'radiationDose').forEach((id) => expect(covered.has(id), id).toBe(true));
  });

  test('the name of each condition is found in its source page', () => {
    // The name is the source's own wording, give or take capitals and a plural.
    const words: Record<string, string> = {
      behavioralChanges: 'behavioral issues',
      sleepLoss: 'Sleep loss',
      cognitiveImpairment: 'cognitive or performance impairments',
      sans: 'neuro-ocular syndrome',
      spaceMotionSickness: 'motion sickness',
      lowBloodPressure: 'low blood pressure',
      arrhythmia: 'heart arrythmias',
      cardiovascularAdaptation: 'Cardiovascular Adaptations',
      mildHypoxia: 'Mild hypoxia',
      decompressionSickness: 'decompression sickness',
      alteredImmunity: 'Altered Immune System Responses',
      muscleAndBoneLoss: 'muscle and bone loss',
      spineElongation: 'elongate',
      strengthLoss: 'losses to strength',
      menuFatigue: 'menu fatigue',
      insulinResistance: 'insulin resistance',
      dehydration: 'dehydration',
    };
    expect(Object.keys(words).sort()).toEqual(CONDITIONS.map((c) => c.id).sort());
    for (const c of CONDITIONS) expect(file(c.about.source).includes(words[c.id]), `${c.id}: ${words[c.id]}`).toBe(true);
  });

  test('only decompression sickness is urgent on its own', () => {
    expect(CONDITIONS.filter((c) => c.urgent).map((c) => c.id)).toEqual(['decompressionSickness']);
  });
});

test('the mouth is built from what the sources say and nothing about teeth is claimed', () => {
  expect(SYMPTOMS.filter((s) => s.region === 'mouth').map((s) => s.id)).toEqual(['coldSores']);
  const text = JSON.stringify(REGIONS.mouth).toLowerCase();
  for (const word of ['tooth', 'teeth', 'gum', 'dental']) expect(text.includes(word), word).toBe(false);
});
