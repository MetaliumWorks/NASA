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
  /** Readings of this day that were far from baseline and confirmed as measured. */
  critical?: IndicatorId[];
}

/** A symptom check made outside the daily check-in: what was reported and what was measured for it. */
export interface SpotCheck {
  day: number;
  symptoms: string[];
  values: Partial<Record<IndicatorId, number>>;
  note?: string;
}

/**
 * Why a message went to the ground: a confirmed critical reading, a system at warning,
 * a weekly or monthly review that found something, or a daily check-in that was not done.
 */
export type GroundKind = 'critical' | 'urgent' | 'review' | 'missed';
export type GroundOrigin = 'checkin' | 'check' | 'weekly' | 'system';

/** One message in the simulated link to the ground. Nothing leaves the device. */
export interface GroundMessage {
  id: string;
  /** Mission day it was sent on. */
  day: number;
  kind: GroundKind;
  origin: GroundOrigin;
  subject: string;
  body: string;
  /** The systems it covers, so the same system is not reported twice in a day. */
  regions: RegionId[];
  /** For a critical reading: the indicators it covers. */
  indicators?: IndicatorId[];
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
  /** Messages sent over the simulated ground link, oldest first. Absent means none. */
  outbox?: GroundMessage[];
  /** Symptom checks made outside the daily check-in, oldest first. Absent means none. */
  checks?: SpotCheck[];
}
