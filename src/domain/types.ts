export type Status = 'nominal' | 'caution' | 'warning';

export type RegionId =
  | 'brain'
  | 'eyes'
  | 'innerEar'
  | 'heart'
  | 'lungs'
  | 'immune'
  | 'bones'
  | 'spine'
  | 'muscles'
  | 'digestion'
  | 'kidneys'
  | 'radiation';

export type HazardId = 'radiation' | 'isolation' | 'distance' | 'gravity' | 'environment';

export type MissionId = 'station' | 'moon' | 'mars';

export const ALL_INDICATORS = [
  'heartRate',
  'bpSystolic',
  'bpDiastolic',
  'bloodSugar',
  'bodyTemp',
  'sleepHours',
  'mood',
  'exerciseHours',
  'waterLiters',
  'appetite',
  'radiationDose',
  'strength',
  'heightCm',
  'reactionMs',
  'visionLevel',
] as const;

export type IndicatorId = (typeof ALL_INDICATORS)[number];

export type CheckInStep = 'vitals' | 'sleepMood' | 'symptoms' | 'intake' | 'radiation';

export const DAILY_STEPS: CheckInStep[] = ['vitals', 'sleepMood', 'symptoms', 'intake', 'radiation'];

export interface DayEntry {
  day: number;
  values: Partial<Record<IndicatorId, number>>;
  symptoms: string[];
  otherDiscomfort?: string;
  journal?: string;
  stepsDone: CheckInStep[];
}

export interface PlanItem {
  day: number;
  recommendationId: string;
  done: boolean;
}

export interface Profile {
  name: string;
  simulated: boolean;
  mission: MissionId;
  missionDay: number;
  /**
   * The furthest day this profile has reached. A shorter mission shows fewer days, but
   * choosing a longer one again returns to this day. Absent means `missionDay`.
   */
  reachedDay?: number;
  baseline: Partial<Record<IndicatorId, number>>;
  entries: DayEntry[];
  plan: PlanItem[];
}
