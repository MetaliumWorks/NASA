import { createDemoProfile, emptyProfile } from '../domain/demo';
import { entryFor } from '../domain/series';
import { loadState, reducer, saveState, STORAGE_KEY, type AppState } from './store';

const base: AppState = { profile: createDemoProfile(), view: 'map', selectedRegion: null, showOrgans: false };
const today = (s: AppState) => entryFor(s.profile, s.profile.missionDay)!;

function fakeStorage(initial?: string) {
  const map = new Map<string, string>();
  if (initial !== undefined) map.set(STORAGE_KEY, initial);
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    map,
  };
}

describe('saved state', () => {
  test('corrupt storage falls back to the demo', () => {
    const broken = [
      null,
      '',
      '{not json',
      '[]',
      'null',
      '42',
      '{"profile":{"entries":"x"}}',
      '{"profile":{"name":"A","mission":"venus","missionDay":3,"baseline":{},"entries":[],"plan":[]}}',
      '{"profile":{"name":"A","mission":"mars","missionDay":"3","baseline":{},"entries":[],"plan":[]}}',
      '{"profile":{"name":"A","mission":"mars","missionDay":3,"baseline":{},"entries":[{"day":1}],"plan":[]}}',
    ];
    for (const raw of broken) {
      const s = loadState({ getItem: () => raw });
      expect(s, String(raw)).toEqual({ profile: createDemoProfile(), view: 'map', selectedRegion: null, showOrgans: false });
    }
  });

  test('storage that throws falls back to the demo', () => {
    const s = loadState({
      getItem: () => {
        throw new Error('blocked');
      },
    });
    expect(s.profile).toEqual(createDemoProfile());
    expect(() =>
      saveState(
        {
          setItem: () => {
            throw new Error('full');
          },
        },
        base,
      ),
    ).not.toThrow();
  });

  test('saveState then loadState round-trips', () => {
    const storage = fakeStorage();
    let s = reducer(base, { type: 'saveStep', step: 'intake', values: { waterLiters: 2.2 } });
    s = reducer(s, { type: 'select', region: 'kidneys' });
    s = reducer(s, { type: 'toggleOrgans' });
    s = reducer(s, { type: 'planAdd', ids: ['drinkMore'] });
    saveState(storage, s);
    expect(storage.map.has(STORAGE_KEY)).toBe(true);
    expect(loadState(storage)).toEqual(s);
  });

  test('an unknown view or region in storage is replaced, the profile is kept', () => {
    const p = emptyProfile('A', 'mars', { heartRate: 60 });
    const raw = JSON.stringify({ profile: p, view: 'nowhere', selectedRegion: 'tail', showOrgans: 'yes' });
    expect(loadState(fakeStorage(raw))).toEqual({ profile: p, view: 'map', selectedRegion: null, showOrgans: false });
  });

  test('a stored day beyond the mission length is pulled back', () => {
    const p = { ...emptyProfile('A', 'moon', {}), missionDay: 400 };
    expect(loadState(fakeStorage(JSON.stringify({ ...base, profile: p }))).profile.missionDay).toBe(30);
  });
});

describe('check-in', () => {
  test('saving the same step twice keeps one entry and one step mark', () => {
    let s = reducer(base, { type: 'saveStep', step: 'intake', values: { waterLiters: 2 } });
    s = reducer(s, { type: 'saveStep', step: 'intake', values: { waterLiters: 2.2 } });
    const entries = s.profile.entries.filter((e) => e.day === 47);
    expect(entries).toHaveLength(1);
    expect(entries[0].values.waterLiters).toBe(2.2);
    expect(entries[0].stepsDone.filter((x) => x === 'intake')).toHaveLength(1);
    expect(entries[0].values.heartRate).toBeDefined(); // earlier steps keep their values
  });

  test('a field left empty on a second save is removed, other steps are untouched', () => {
    let s = reducer(base, { type: 'saveStep', step: 'intake', values: { waterLiters: 2, appetite: 4, exerciseHours: 1.5 } });
    s = reducer(s, { type: 'saveStep', step: 'intake', values: { waterLiters: 2 } });
    expect(today(s).values.appetite).toBeUndefined();
    expect(today(s).values.exerciseHours).toBeUndefined();
    expect(today(s).values.waterLiters).toBe(2);
    expect(today(s).values.mood).toBeDefined();
  });

  test('saving a step on a day without an entry creates it', () => {
    const fresh: AppState = { ...base, profile: emptyProfile('A', 'station', {}) };
    const s = reducer(fresh, { type: 'saveStep', step: 'vitals', values: { heartRate: 61 } });
    expect(s.profile.entries).toEqual([{ day: 1, values: { heartRate: 61 }, symptoms: [], stepsDone: ['vitals'] }]);
  });

  test('symptoms, free text and the journal are stored on today and can be cleared', () => {
    let s = reducer(base, { type: 'saveStep', step: 'symptoms', values: {}, symptoms: ['headache'], otherDiscomfort: '  Sore wrist ' });
    s = reducer(s, { type: 'saveStep', step: 'sleepMood', values: { sleepHours: 7, mood: 4 }, journal: 'Quiet day.' });
    expect(today(s)).toMatchObject({ symptoms: ['headache'], otherDiscomfort: 'Sore wrist', journal: 'Quiet day.' });
    s = reducer(s, { type: 'saveStep', step: 'symptoms', values: {}, symptoms: [], otherDiscomfort: '' });
    expect(today(s).symptoms).toEqual([]);
    expect(today(s).otherDiscomfort).toBeUndefined();
    expect(today(s).journal).toBe('Quiet day.');
  });

  test('earlier days are never changed by a save', () => {
    const s = reducer(base, { type: 'saveStep', step: 'symptoms', values: {}, symptoms: ['headache'] });
    expect(s.profile.entries.filter((e) => e.day < 47)).toEqual(base.profile.entries.filter((e) => e.day < 47));
  });

  test('weekly results are merged into today without marking a daily step', () => {
    const s = reducer(base, { type: 'saveWeekly', values: { reactionMs: 290, visionLevel: 6 } });
    expect(today(s).values).toMatchObject({ reactionMs: 290, visionLevel: 6 });
    expect(today(s).values.heartRate).toBeDefined();
    expect(today(s).stepsDone).toEqual(['vitals', 'sleepMood', 'symptoms']);
  });

  test('the reducer does not mutate the state it is given', () => {
    const before = JSON.stringify(base);
    reducer(base, { type: 'saveStep', step: 'intake', values: { waterLiters: 2 } });
    reducer(base, { type: 'planAdd', ids: ['drinkMore'] });
    reducer(base, { type: 'advanceDay' });
    expect(JSON.stringify(base)).toBe(before);
  });
});

describe('mission day', () => {
  test('advanceDay moves one day on', () => {
    expect(reducer(base, { type: 'advanceDay' }).profile.missionDay).toBe(48);
  });

  test('advanceDay stops at the mission length', () => {
    const last: AppState = { ...base, profile: { ...base.profile, missionDay: 180 } };
    expect(reducer(last, { type: 'advanceDay' }).profile.missionDay).toBe(180);
  });

  test('setMission changes the mission and pulls the day back inside it', () => {
    expect(reducer(base, { type: 'setMission', mission: 'mars' }).profile).toMatchObject({ mission: 'mars', missionDay: 47 });
    expect(reducer(base, { type: 'setMission', mission: 'moon' }).profile).toMatchObject({ mission: 'moon', missionDay: 30 });
  });

  test('resetDemo restores the starting profile and view', () => {
    let s = reducer(base, { type: 'saveStep', step: 'intake', values: { waterLiters: 2 } });
    s = reducer(s, { type: 'advanceDay' });
    s = reducer(s, { type: 'view', view: 'sources' });
    s = reducer(s, { type: 'select', region: 'bones' });
    expect(reducer(s, { type: 'resetDemo' })).toEqual(base);
  });

  test('newProfile starts a real profile on day 1', () => {
    const s = reducer({ ...base, selectedRegion: 'bones', view: 'setup' }, { type: 'newProfile', name: 'Ada', mission: 'moon', baseline: { heartRate: 58 } });
    expect(s.profile).toEqual(emptyProfile('Ada', 'moon', { heartRate: 58 }));
    expect(s).toMatchObject({ view: 'map', selectedRegion: null });
  });
});

describe("today's plan", () => {
  test('planAdd does not duplicate', () => {
    let s = reducer(base, { type: 'planAdd', ids: ['dailyExercise', 'drinkToPlan'] });
    s = reducer(s, { type: 'planAdd', ids: ['dailyExercise', 'drinkMore', 'drinkMore'] });
    expect(s.profile.plan).toEqual([
      { day: 47, recommendationId: 'dailyExercise', done: false },
      { day: 47, recommendationId: 'drinkToPlan', done: false },
      { day: 47, recommendationId: 'drinkMore', done: false },
    ]);
  });

  test('planToggle flips only today’s item', () => {
    let s = reducer(base, { type: 'planAdd', ids: ['dailyExercise'] });
    s = reducer(s, { type: 'advanceDay' });
    s = reducer(s, { type: 'planAdd', ids: ['dailyExercise'] });
    s = reducer(s, { type: 'planToggle', id: 'dailyExercise' });
    expect(s.profile.plan).toEqual([
      { day: 47, recommendationId: 'dailyExercise', done: false },
      { day: 48, recommendationId: 'dailyExercise', done: true },
    ]);
    expect(reducer(s, { type: 'planToggle', id: 'dailyExercise' }).profile.plan[1].done).toBe(false);
  });
});

describe('navigation', () => {
  test('view, select and toggleOrgans change only their own field', () => {
    expect(reducer(base, { type: 'view', view: 'checkin' })).toEqual({ ...base, view: 'checkin' });
    expect(reducer(base, { type: 'select', region: 'heart' })).toEqual({ ...base, selectedRegion: 'heart' });
    expect(reducer(base, { type: 'toggleOrgans' })).toEqual({ ...base, showOrgans: true });
  });
});
