import { conditionLead } from '../content/conditions';
import { INDICATORS } from '../content/indicators';
import { MISSIONS } from '../content/missions';
import { REGION_ORDER, REGIONS } from '../content/regions';
import { SOURCES } from '../content/sources';
import { SYMPTOMS } from '../content/symptoms';
import { assessAll } from './assess';
import { matchConditions, matchesFor, type ConditionMatch } from './possible';
import { entryFor } from './series';
import type { Assessment, Finding } from './status';
import type { Profile, RegionId } from './types';

/** Said wherever a possible condition is named. */
export const NOT_A_DIAGNOSIS =
  '"Possible" names a condition the source pages describe that these findings match. "Risk" names one the pages link to a habit that is off; no sign of it was measured. Neither is a diagnosis.';

export function findingName(f: Finding): string {
  if (f.symptom) return SYMPTOMS.find((s) => s.id === f.symptom)?.label ?? f.symptom;
  if (f.indicator) return INDICATORS[f.indicator].label;
  return 'Finding';
}

/** The first lines of anything written for the ground: whose it is, where the mission stands, and whether it is simulated. */
export function reportHeader(p: Profile, day: number, title: string): string[] {
  const mission = MISSIONS[p.mission];
  const lines = [`${title} · ${p.name} · Flight day ${day} of ${mission.days} · ${mission.name}`];
  if (p.simulated) lines.push('SIMULATED DATA');
  if (mission.commsLine) lines.push(`Comms: ${mission.commsLine}`);
  return lines;
}

/**
 * One flagged system as text: what flags it, its other findings, and the conditions
 * from the sources that the findings point to.
 */
export function regionBlock(region: RegionId, assessment: Assessment, matches: ConditionMatch[]): string[] {
  const { status, findings } = assessment;
  const lines = [`[${status.toUpperCase()}] ${REGIONS[region].name}`];
  const line = (f: Finding) => `${findingName(f)}: ${f.reason}${f.label ? ` (${f.label})` : ''}`;
  for (const f of findings.filter((f) => f.status !== 'nominal')) lines.push(`  ! ${line(f)}`);
  for (const f of findings.filter((f) => f.status === 'nominal')) lines.push(`  - ${line(f)}`);
  for (const m of matchesFor(matches, region)) {
    const source = SOURCES[m.condition.about.source];
    lines.push(`  ${conditionLead(m.condition)}: ${m.condition.name} (${source.org}: ${source.title})`);
  }
  return lines;
}

/**
 * A short plain-text report for the ground team: the flagged systems, heaviest first,
 * each with what flags it, its other findings and the possible conditions.
 */
export function groundReport(p: Profile, day: number): string {
  const lines = reportHeader(p, day, 'Crew health report');

  const all = assessAll(p, day);
  const matches = matchConditions(p, day, all);
  const flagged = (['warning', 'caution'] as const).flatMap((status) => REGION_ORDER.filter((r) => all[r].status === status));

  if (flagged.length === 0) lines.push('', 'No system is flagged.');
  for (const region of flagged) lines.push('', ...regionBlock(region, all[region], matches));
  if (flagged.length > 0) lines.push('', NOT_A_DIAGNOSIS);

  const other = entryFor(p, day)?.otherDiscomfort;
  if (other) lines.push('', `Other discomfort: ${other}`);

  const nominal = REGION_ORDER.length - flagged.length;
  lines.push('', `${nominal} ${nominal === 1 ? 'system' : 'systems'} nominal.`);
  return lines.join('\n');
}

/** A file name for the downloaded report, safe on any system. */
export function reportFileName(p: Profile): string {
  const crew = p.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `crew-health-report-${crew ? `${crew}-` : ''}day-${String(p.missionDay).padStart(3, '0')}.txt`;
}
