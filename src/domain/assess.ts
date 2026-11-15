import { REGION_ORDER } from '../content/regions';
import { longTermFindings } from './longterm';
import { assessDaily, worst, type Assessment } from './status';
import type { Profile, RegionId, Status } from './types';

/** A region's status: the worst of today's findings and the long-term ones. */
export function assessRegion(p: Profile, region: RegionId, day: number): Assessment {
  const findings = [...assessDaily(p, region, day).findings, ...longTermFindings(p, region, day)];
  return { region, status: findings.reduce<Status>((s, f) => worst(s, f.status), 'nominal'), findings };
}

export function assessAll(p: Profile, day: number): Record<RegionId, Assessment> {
  const out = {} as Record<RegionId, Assessment>;
  for (const region of REGION_ORDER) out[region] = assessRegion(p, region, day);
  return out;
}

/** Regions that are not nominal: warnings first, then cautions, each in display order. */
export function flagged(all: Record<RegionId, Assessment>): Assessment[] {
  return (['warning', 'caution'] as const).flatMap((status) => REGION_ORDER.map((r) => all[r]).filter((a) => a.status === status));
}

/**
 * The flagged regions with the ones that were just asked about first. A symptom check is
 * a question about one thing: its answer leads, and whatever else is flagged follows.
 */
export function flaggedFirst(all: Record<RegionId, Assessment>, first: RegionId[]): Assessment[] {
  const list = flagged(all);
  return [...list.filter((a) => first.includes(a.region)), ...list.filter((a) => !first.includes(a.region))];
}
