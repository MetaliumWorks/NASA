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

/** Regions that are not nominal, in display order. */
export function flagged(all: Record<RegionId, Assessment>): Assessment[] {
  return REGION_ORDER.map((r) => all[r]).filter((a) => a.status !== 'nominal');
}
