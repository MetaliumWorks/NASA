import { INDICATORS } from '../content/indicators';
import { REGION_ORDER, REGIONS } from '../content/regions';
import { SYMPTOMS } from '../content/symptoms';
import { assessAll } from './assess';
import { criticalReading, type CriticalReading } from './critical';
import { formatValue } from './format';
import { matchConditions } from './possible';
import { NOT_A_DIAGNOSIS, regionBlock, reportHeader } from './report';
import { periodReview, periodWindow, reviewDue } from './review';
import { entryFor } from './series';
import { ALL_INDICATORS, DAILY_STEPS, type GroundMessage, type GroundOrigin, type IndicatorId, type Profile, type RegionId } from './types';

/**
 * The link to the ground is simulated: a message is written into the profile's outbox and
 * nothing leaves the device. These functions decide what is worth a message.
 */

export const outbox = (p: Profile): GroundMessage[] => p.outbox ?? [];
export const sentOn = (p: Profile, day: number): GroundMessage[] => outbox(p).filter((m) => m.day === day);

export function dayComplete(p: Profile, day: number): boolean {
  const entry = entryFor(p, day);
  return !!entry && DAILY_STEPS.every((step) => entry.stepsDone.includes(step));
}

const names = (regions: RegionId[]) => regions.map((r) => REGIONS[r].name).join(', ');
const nextId = (messages: GroundMessage[]) => `g${messages.length + 1}`;

/** The readings of `day` that are critical, in indicator order. */
export function criticalReadings(p: Profile, day: number, only?: IndicatorId[]): CriticalReading[] {
  const values = entryFor(p, day)?.values ?? {};
  return ALL_INDICATORS.filter((id) => !only || only.includes(id)).flatMap((id) => {
    const value = values[id];
    const reading = typeof value === 'number' ? criticalReading(p, id, value) : null;
    return reading ? [reading] : [];
  });
}

function composeCritical(p: Profile, day: number, origin: GroundOrigin, readings: CriticalReading[], id: string): GroundMessage {
  const labels = readings.map((r) => INDICATORS[r.indicator].label);
  const lines = reportHeader(p, day, 'Critical reading');
  lines.push('', 'Measured again or confirmed by the crew member:');
  for (const r of readings) {
    const unit = INDICATORS[r.indicator].unit;
    lines.push(`  ! ${INDICATORS[r.indicator].label}: ${r.reason} (baseline ${formatValue(r.baseline, unit)})`);
  }
  return {
    id,
    day,
    kind: 'critical',
    origin,
    subject: `Critical reading: ${labels.join(', ')}`,
    body: lines.join('\n'),
    regions: [...new Set(readings.map((r) => INDICATORS[r.indicator].region))],
    indicators: readings.map((r) => r.indicator),
  };
}

function composeUrgent(p: Profile, day: number, origin: GroundOrigin, regions: RegionId[], id: string): GroundMessage {
  const all = assessAll(p, day);
  const matches = matchConditions(p, day, all);
  const lines = reportHeader(p, day, 'Urgent health alert');
  for (const region of regions) lines.push('', ...regionBlock(region, all[region], matches));
  lines.push('', NOT_A_DIAGNOSIS);
  const other = entryFor(p, day)?.otherDiscomfort;
  if (other) lines.push('', `Other discomfort: ${other}`);
  return { id, day, kind: 'urgent', origin, subject: `Urgent: ${names(regions)}`, body: lines.join('\n'), regions };
}

/** The weekly or monthly review as a message, when it found something that keeps coming back. Otherwise null. */
function composeReview(p: Profile, day: number, id: string): GroundMessage | null {
  const period = reviewDue(day);
  if (!period) return null;
  const rows = periodReview(p, period, day).filter((row) => row.flags.length > 0);
  if (rows.length === 0) return null;

  const all = assessAll(p, day);
  const matches = matchConditions(p, day, all);
  const window = periodWindow(period, day);
  const title = period === 'month' ? 'Monthly review' : 'Weekly review';
  const lines = reportHeader(p, day, title);
  lines.push(`Flight days ${window.from} to ${window.to}`);
  for (const row of rows) {
    lines.push('', ...regionBlock(row.region, all[row.region], matches));
    for (const [symptom, n] of Object.entries(row.symptomDays)) {
      const label = SYMPTOMS.find((s) => s.id === symptom)?.label ?? symptom;
      lines.push(`  ${label}: reported on ${n} of ${window.days} days`);
    }
    const { caution, warning } = row.flaggedDays;
    lines.push(`  Days flagged in the period: ${warning} at warning, ${caution} at caution`);
  }
  lines.push('', NOT_A_DIAGNOSIS);
  const regions = rows.map((row) => row.region);
  return { id, day, kind: 'review', origin: 'checkin', subject: `${title}: ${names(regions)}`, body: lines.join('\n'), regions };
}

/** A day that ended without its daily check-in, reported when the next day begins. */
export function composeMissed(p: Profile, missedDay: number, id: string): GroundMessage {
  const lines = reportHeader(p, missedDay + 1, 'Missed check-in');
  const done = entryFor(p, missedDay)?.stepsDone.length ?? 0;
  lines.push('', `The daily check-in of flight day ${missedDay} was not completed (${done} of ${DAILY_STEPS.length} steps).`);
  return {
    id,
    day: missedDay + 1,
    kind: 'missed',
    origin: 'system',
    subject: `Missed check-in: flight day ${missedDay}`,
    body: lines.join('\n'),
    regions: [],
  };
}

export interface AlertEvent {
  /** What just happened: a step of the daily check-in, a symptom check, or the weekly check-in. */
  origin: GroundOrigin;
  /** Readings that were far from baseline and have just been confirmed. */
  critical?: IndicatorId[];
  /** The daily check-in has just been completed by this event. */
  completed?: boolean;
}

/**
 * The profile after an event, with whatever that event calls for added to the outbox:
 * - a confirmed critical reading, at once;
 * - every system at warning that was not yet reported today (the daily check-in reports
 *   once it is complete; a symptom check and the weekly check-in report at once);
 * - the weekly or monthly review, when the check-in that completes its day is done and
 *   the review found something that keeps coming back.
 */
export function withAlerts(p: Profile, event: AlertEvent): Profile {
  const day = p.missionDay;
  const messages = [...outbox(p)];
  const today = () => messages.filter((m) => m.day === day);

  const reported = new Set(today().flatMap((m) => m.indicators ?? []));
  const readings = criticalReadings(p, day, event.critical ?? []).filter((r) => !reported.has(r.indicator));
  if (readings.length > 0) messages.push(composeCritical(p, day, event.origin, readings, nextId(messages)));

  if (event.origin !== 'checkin' || event.completed || dayComplete(p, day)) {
    const all = assessAll(p, day);
    const covered = new Set(
      today()
        .filter((m) => m.kind === 'urgent' || m.kind === 'critical')
        .flatMap((m) => m.regions),
    );
    const regions = REGION_ORDER.filter((r) => all[r].status === 'warning' && !covered.has(r));
    if (regions.length > 0) messages.push(composeUrgent(p, day, event.origin, regions, nextId(messages)));
  }

  if (event.completed && !today().some((m) => m.kind === 'review')) {
    const review = composeReview(p, day, nextId(messages));
    if (review) messages.push(review);
  }

  return messages.length === outbox(p).length ? p : { ...p, outbox: messages };
}

/**
 * What the outbox of a history would hold had every day been lived through the app: used
 * to give the demo a ground log that follows from its own data.
 */
export function replayOutbox(p: Profile): GroundMessage[] {
  let sim: Profile = { ...p, outbox: [] };
  for (let day = 1; day <= p.missionDay; day++) {
    if (dayComplete(p, day)) {
      const critical = criticalReadings(p, day).map((r) => r.indicator);
      sim = withAlerts({ ...sim, missionDay: day }, { origin: 'checkin', completed: true, critical });
    } else if (day < p.missionDay) {
      const messages = outbox(sim);
      sim = { ...sim, outbox: [...messages, composeMissed(p, day, nextId(messages))] };
    }
  }
  return outbox(sim);
}
