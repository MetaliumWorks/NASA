import { ALL_INDICATORS, DAILY_STEPS, type DayEntry, type IndicatorId, type Profile } from './types';

type Row = { day: number; symptoms?: string[] } & Partial<Record<IndicatorId, number>>;

/** A station profile on mission day 47 built from one row per day. */
export function profile(rows: Row[], baseline: Profile['baseline'] = {}): Profile {
  const entries: DayEntry[] = rows.map((row) => {
    const values: DayEntry['values'] = {};
    for (const id of ALL_INDICATORS) {
      const v = row[id];
      if (typeof v === 'number') values[id] = v;
    }
    return { day: row.day, values, symptoms: row.symptoms ?? [], stepsDone: [...DAILY_STEPS] };
  });
  return { name: 'Test crew', simulated: false, mission: 'station', missionDay: 47, baseline, entries, plan: [] };
}

/** Both ends included. */
export function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

export function withSymptoms(day: number, ids: string[]): Profile {
  return profile([{ day, symptoms: ids }]);
}

export function symptomOn(days: number[], id: string): Profile {
  return profile(days.map((day) => ({ day, symptoms: [id] })));
}

/** Heart rate 70 on the `high` days and 60 on the `normal` days, baseline 60. */
export function heartRateDays(d: { high: number[]; normal: number[] }): Profile {
  const rows: Row[] = [
    ...d.high.map((day) => ({ day, heartRate: 70 })),
    ...d.normal.map((day) => ({ day, heartRate: 60 })),
  ].sort((a, b) => a.day - b.day);
  return profile(rows, { heartRate: 60 });
}

/** Four weeks of sleep, oldest first, one value per day on days 20 to 47; baseline 7.5 h. */
export function weeklySleep(weeklyValues: [number, number, number, number]): Profile {
  const rows: Row[] = [];
  weeklyValues.forEach((value, i) => {
    const start = 20 + i * 7;
    for (const day of range(start, start + 6)) rows.push({ day, sleepHours: value });
  });
  return profile(rows, { sleepHours: 7.5 });
}

/** The four weekly indicators recorded once, on `day`; the mission is at `today`. */
export function profileWithWeeklyOn(day: number, today: number): Profile {
  const p = profile([{ day, strength: 4, heightCm: 178, reactionMs: 280, visionLevel: 6 }], {
    strength: 4,
    heightCm: 178,
    reactionMs: 280,
    visionLevel: 6,
  });
  return { ...p, missionDay: today };
}
