import { INDICATORS } from '../content/indicators';
import { MISSIONS } from '../content/missions';
import { REGION_ORDER, REGIONS } from '../content/regions';
import { SYMPTOMS } from '../content/symptoms';
import { assessAll } from './assess';
import { entryFor } from './series';
import type { Finding } from './status';
import type { Profile } from './types';

function findingName(f: Finding): string {
  if (f.symptom) return SYMPTOMS.find((s) => s.id === f.symptom)?.label ?? f.symptom;
  if (f.indicator) return INDICATORS[f.indicator].label;
  return 'Finding';
}

/**
 * A short plain-text report for the ground team: the flagged systems, heaviest first,
 * each with what flags it and its other findings. Nothing is sent anywhere.
 */
export function groundReport(p: Profile, day: number): string {
  const mission = MISSIONS[p.mission];
  const lines: string[] = [`Crew health report · ${p.name} · Flight day ${day} of ${mission.days} · ${mission.name}`];
  if (p.simulated) lines.push('SIMULATED DATA');
  if (mission.commsLine) lines.push(`Comms: ${mission.commsLine}`);

  const all = assessAll(p, day);
  const flagged = (['warning', 'caution'] as const).flatMap((status) => REGION_ORDER.filter((r) => all[r].status === status));

  if (flagged.length === 0) lines.push('', 'No system is flagged.');
  for (const region of flagged) {
    const { status, findings } = all[region];
    lines.push('', `[${status.toUpperCase()}] ${REGIONS[region].name}`);
    const line = (f: Finding) => `${findingName(f)}: ${f.reason}${f.label ? ` (${f.label})` : ''}`;
    for (const f of findings.filter((f) => f.status !== 'nominal')) lines.push(`  ! ${line(f)}`);
    for (const f of findings.filter((f) => f.status === 'nominal')) lines.push(`  - ${line(f)}`);
  }

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
