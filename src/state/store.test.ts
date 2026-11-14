import { createDemoProfile, emptyProfile } from '../domain/demo';
import { halfDone } from '../domain/test-helpers';
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
    const half: AppState = { ...base, profile: halfDone(base.profile) };
    const s = reducer(half, { type: 'saveWeekly', values: { reactionMs: 290, visionLevel: 6 } });
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

  test('a shorter mission does not forget the day that was reached', () => {
    const onMoon = reducer(base, { type: 'setMission', mission: 'moon' });
    expect(onMoon.profile.missionDay).toBe(30);
    expect(reducer(onMoon, { type: 'setMission', mission: 'station' }).profile.missionDay).toBe(47);
    expect(reducer(onMoon, { type: 'setMission', mission: 'mars' }).profile.missionDay).toBe(47);
  });

  test('days advanced after a mission change still count', () => {
    let s: AppState = { ...base, profile: { ...base.profile, missionDay: 28 } };
    s = reducer(s, { type: 'setMission', mission: 'moon' });
    s = reducer(s, { type: 'advanceDay' });
    expect(s.profile.missionDay).toBe(29);
    expect(reducer(s, { type: 'setMission', mission: 'station' }).profile.missionDay).toBe(29);
  });

  test('the reached day survives a save and a load', () => {
    const onMoon = reducer(base, { type: 'setMission', mission: 'moon' });
    const storage = fakeStorage();
    saveState(storage, onMoon);
    const loaded = loadState(storage);
    expect(loaded.profile.missionDay).toBe(30);
    expect(reducer(loaded, { type: 'setMission', mission: 'station' }).profile.missionDay).toBe(47);
  });

  test('a damaged reached day in storage is dropped, not fatal', () => {
    const raw = JSON.stringify({ ...base, profile: { ...base.profile, reachedDay: 'x' } });
    const loaded = loadState(fakeStorage(raw));
    expect(loaded.profile.missionDay).toBe(47);
    expect(loaded.profile.reachedDay).toBeUndefined();
    expect(loaded.profile.name).toBe(base.profile.name);
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

describe('ground link', () => {
  const half: AppState = { ...base, profile: halfDone(base.profile) };
  const subjects = (s: AppState) => (s.profile.outbox ?? []).map((m) => `${m.day} ${m.subject}`);
  const before = subjects(half);

  test('the half-done day has sent nothing yet', () => {
    expect(before).toEqual(['7 Weekly review: Inner ear & balance', '35 Missed check-in: flight day 34']);
  });

  test('completing the daily check-in reports the systems at warning', () => {
    let s = reducer(half, { type: 'saveStep', step: 'intake', values: { waterLiters: 1.1, appetite: 4, exerciseHours: 1 } });
    expect(subjects(s)).toEqual(before); // four of five steps: nothing yet
    s = reducer(s, { type: 'saveStep', step: 'radiation', values: { radiationDose: 0.5 } });
    expect(subjects(s)).toEqual([...before, '47 Urgent: Kidneys']);
    expect(s.profile.outbox?.at(-1)).toMatchObject({ id: 'g3', origin: 'checkin', kind: 'urgent' });
  });

  test('a check-in that ends with cautions only sends nothing', () => {
    let s = reducer(half, { type: 'saveStep', step: 'intake', values: { waterLiters: 2.4, appetite: 4, exerciseHours: 1 } });
    s = reducer(s, { type: 'saveStep', step: 'radiation', values: { radiationDose: 0.5 } });
    expect(subjects(s)).toEqual(before);
  });

  test('saving a finished step again does not report the same system twice', () => {
    const again = reducer(base, { type: 'saveStep', step: 'intake', values: { waterLiters: 1.1, appetite: 4, exerciseHours: 1 } });
    expect(subjects(again)).toEqual(subjects(base));
  });

  test('a confirmed critical reading is stored on the day and reported at once', () => {
    const s = reducer(half, {
      type: 'saveStep',
      step: 'vitals',
      values: { heartRate: 140, bpSystolic: 118, bpDiastolic: 76, bloodSugar: 90, bodyTemp: 36.7 },
      critical: ['heartRate'],
    });
    expect(today(s).critical).toEqual(['heartRate']);
    expect(subjects(s)).toEqual([...before, '47 Critical reading: Heart rate']);
    // Saving the step again with a normal reading withdraws the confirmation, not the message.
    const fixed = reducer(s, { type: 'saveStep', step: 'vitals', values: { heartRate: 62, bpSystolic: 118, bpDiastolic: 76, bloodSugar: 90, bodyTemp: 36.7 } });
    expect(today(fixed).critical).toBeUndefined();
    expect(subjects(fixed)).toEqual(subjects(s));
  });

  test('a symptom check adds to the day and reports an urgent finding at once', () => {
    const s = reducer(half, { type: 'saveCheck', symptoms: ['painAfterSpacewalk'], values: {}, note: ' Left knee ' });
    expect(today(s).symptoms).toEqual(['painAfterSpacewalk']);
    expect(today(s).otherDiscomfort).toBe('Left knee');
    expect(today(s).stepsDone).toEqual(['vitals', 'sleepMood', 'symptoms']); // not a step of the check-in
    expect(s.profile.checks).toEqual([{ day: 47, symptoms: ['painAfterSpacewalk'], values: {}, note: 'Left knee' }]);
    expect(subjects(s)).toEqual([...before, '47 Urgent: Lungs & oxygen']);
    expect(s.profile.outbox?.at(-1)?.origin).toBe('check');
  });

  test('a symptom check keeps what the day already holds and replaces a reading with the newer one', () => {
    let s = reducer(base, { type: 'saveCheck', symptoms: ['lightheaded'], values: { bpSystolic: 110, bpDiastolic: 70, heartRate: 66 } });
    expect(today(s).symptoms).toEqual(['troubleSleeping', 'lightheaded']);
    expect(today(s).values).toMatchObject({ bpSystolic: 110, bpDiastolic: 70, heartRate: 66 });
    expect(today(s).values.bodyTemp).toBeDefined();
    s = reducer(s, { type: 'saveCheck', symptoms: ['lightheaded'], values: {}, note: 'again after lunch' });
    expect(today(s).symptoms).toEqual(['troubleSleeping', 'lightheaded']);
    expect(s.profile.checks).toHaveLength(2);
  });

  test('the weekly check-in reports a result at warning', () => {
    const s = reducer(base, { type: 'saveWeekly', values: { visionLevel: 3 } });
    expect(subjects(s).at(-1)).toBe('47 Urgent: Eyes');
    expect(s.profile.outbox?.at(-1)?.origin).toBe('weekly');
  });

  test('a day left without its check-in is reported when the next begins', () => {
    const s = reducer(half, { type: 'advanceDay' });
    expect(subjects(s)).toEqual([...before, '48 Missed check-in: flight day 47']);
    expect(reducer(base, { type: 'advanceDay' }).profile.outbox).toEqual(base.profile.outbox); // day 47 was done
  });

  test('the last day of the mission is not reported as missed by pressing again', () => {
    const last: AppState = { ...half, profile: { ...half.profile, missionDay: 180 } };
    expect(reducer(last, { type: 'advanceDay' }).profile.outbox).toEqual(last.profile.outbox);
  });

  test('a new profile starts with an empty log', () => {
    const s = reducer(base, { type: 'newProfile', name: 'Ada', mission: 'station', baseline: {} });
    expect(s.profile.outbox).toBeUndefined();
    expect(s.profile.checks).toBeUndefined();
  });

  test('the log and the symptom checks survive a reload; entries of the wrong shape are dropped', () => {
    const storage = fakeStorage();
    const s = reducer(base, { type: 'saveCheck', symptoms: ['rash'], values: { bodyTemp: 36.9 } });
    saveState(storage, s);
    expect(loadState(storage)).toEqual(s);

    const raw = JSON.parse(storage.map.get(STORAGE_KEY)!);
    raw.profile.outbox = [raw.profile.outbox[0], { id: 5 }, 'x', null];
    raw.profile.checks = ['x', { day: 47, symptoms: [], values: {} }];
    const loaded = loadState(fakeStorage(JSON.stringify(raw)));
    expect(loaded.profile.outbox).toHaveLength(1);
    expect(loaded.profile.checks).toEqual([{ day: 47, symptoms: [], values: {} }]);

    raw.profile.outbox = 'nope';
    delete raw.profile.checks;
    const cleaned = loadState(fakeStorage(JSON.stringify(raw)));
    expect(cleaned.profile.outbox).toBeUndefined();
    expect(cleaned.profile.name).toBe('Crew 03');
  });
});
