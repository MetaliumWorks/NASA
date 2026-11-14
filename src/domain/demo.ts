import { replayOutbox } from './ground';
import { seededRandom } from './random';
import { DAILY_STEPS, type DayEntry, type MissionId, type Profile } from './types';

/** Every opening of the demo is the same: the history is generated from this seed. */
export const DEMO_SEED = 20261114;
export const DEMO_DAY = 47;

export const DEMO_BASELINE: Profile['baseline'] = {
  heartRate: 62,
  bpSystolic: 118,
  bpDiastolic: 76,
  bloodSugar: 90,
  bodyTemp: 36.7,
  sleepHours: 7.5,
  mood: 4,
  waterLiters: 2.4,
  appetite: 4,
  strength: 4,
  heightCm: 178,
  reactionMs: 280,
  visionLevel: 6,
};

// The story (spec section 10). Everything else stays close to baseline. Today's check-in is
// done, so the demo opens on the body map; the last week of the story ends today.
const SKIPPED_DAY = 34;
const EXERCISE_BEHIND: Record<number, number> = { 41: 1.5, 42: 1.0, 43: 0.5, 44: 1.5, 45: 1.0, 46: 0, 47: 1.0 };
const WATER_LOW: Record<number, number> = { 45: 1.4, 46: 1.3, 47: 1.1 };
const TROUBLE_SLEEPING = [43, 45, 47];
const MOTION_SICKNESS = [1, 2, 3, 4];

const round = (x: number, digits: number) => Number(x.toFixed(digits));

/**
 * The simulated crew member: 47 days into a 180-day station mission. Exercise is
 * behind (Bones: caution), water is low (Kidneys: warning) and trouble sleeping was
 * reported on 3 of the last 7 days (Brain, mind & sleep: caution, recurring). The ground
 * log holds what those 47 days would have sent.
 */
export function createDemoProfile(): Profile {
  const random = seededRandom(DEMO_SEED);
  const around = (centre: number, spread: number) => centre + (random() * 2 - 1) * spread;
  const scale = (centre: number) => {
    const u = random();
    return u < 0.12 ? centre - 1 : u > 0.88 ? centre + 1 : centre;
  };

  const entries: DayEntry[] = [];
  for (let day = 1; day <= DEMO_DAY; day++) {
    // Draw the same numbers for every day, so one day's special case does not shift the rest.
    const drawn = {
      heartRate: round(around(62, 2), 0),
      bpSystolic: round(around(118, 3), 0),
      bpDiastolic: round(around(76, 2), 0),
      bloodSugar: round(around(90, 4), 0),
      bodyTemp: round(around(36.7, 0.2), 1),
      sleepHours: round(around(7.5, 0.3), 1),
      mood: scale(4),
      waterLiters: round(around(2.4, 0.2), 1),
      appetite: scale(4),
      radiationDose: round(around(0.5, 0.06), 2),
      reactionMs: round(around(280, 12), 0),
    };
    if (day === SKIPPED_DAY) continue;

    const symptoms: string[] = [];
    if (MOTION_SICKNESS.includes(day)) symptoms.push('motionSickness');
    if (TROUBLE_SLEEPING.includes(day)) symptoms.push('troubleSleeping');

    const vitalsAndSleep: DayEntry['values'] = {
      heartRate: drawn.heartRate,
      bpSystolic: drawn.bpSystolic,
      bpDiastolic: drawn.bpDiastolic,
      bloodSugar: drawn.bloodSugar,
      bodyTemp: drawn.bodyTemp,
      sleepHours: TROUBLE_SLEEPING.includes(day) ? round(drawn.sleepHours - 0.4, 1) : drawn.sleepHours,
      mood: drawn.mood,
    };

    const values: DayEntry['values'] = {
      ...vitalsAndSleep,
      waterLiters: WATER_LOW[day] ?? drawn.waterLiters,
      appetite: drawn.appetite,
      exerciseHours: EXERCISE_BEHIND[day] ?? 1.5,
      radiationDose: drawn.radiationDose,
    };
    if (day % 7 === 0) {
      values.strength = 4;
      values.heightCm = round(178 + Math.min(2.2, day * 0.05), 1);
      values.reactionMs = drawn.reactionMs;
      values.visionLevel = 6;
    }
    entries.push({ day, values, symptoms, stepsDone: [...DAILY_STEPS] });
  }

  const profile: Profile = {
    name: 'Crew 03',
    simulated: true,
    mission: 'station',
    missionDay: DEMO_DAY,
    baseline: { ...DEMO_BASELINE },
    entries,
    plan: [],
  };
  return { ...profile, outbox: replayOutbox(profile) };
}

/** A real profile on its first day: nothing recorded yet. */
export function emptyProfile(name: string, mission: MissionId, baseline: Profile['baseline']): Profile {
  return { name, simulated: false, mission, missionDay: 1, baseline, entries: [], plan: [] };
}
