import { CONDITIONS, type ConditionDef } from '../content/conditions';
import { INDICATORS } from '../content/indicators';
import { REGION_ORDER } from '../content/regions';
import { SYMPTOMS } from '../content/symptoms';
import { THRESHOLDS } from '../content/thresholds';
import { entryFor, mean, recent } from './series';
import { worst, type Assessment, type Finding } from './status';
import { ALL_INDICATORS, type IndicatorId, type Profile, type RegionId, type Status } from './types';

/** A condition from the sources that today's findings point to. A match, not a diagnosis. */
export interface ConditionMatch {
  condition: ConditionDef;
  /** The heaviest of the findings behind it. */
  status: Status;
  /** Reported to the ground at once. */
  urgent: boolean;
  /** What points to it, in words. */
  signs: string[];
  /** The systems whose findings point to it, its own first. */
  regions: RegionId[];
}

const symptomLabel = (id: string) => SYMPTOMS.find((s) => s.id === id)?.label ?? id;
const symptomRegion = (id: string) => SYMPTOMS.find((s) => s.id === id)?.region;

/** Which side of its baseline a flagged indicator is on. Every rule but one flags a single side. */
function sideOf(p: Profile, finding: Finding, day: number): 'above' | 'below' | undefined {
  if (finding.direction) return finding.direction;
  const id = finding.indicator as IndicatorId;
  switch (THRESHOLDS[id].kind) {
    case 'aboveLast':
    case 'aboveLastPercent':
      return 'above';
    case 'percentAvg3': {
      const avg = mean(recent(p, id, day, 3));
      const base = p.baseline[id];
      if (avg === null || typeof base !== 'number') return undefined;
      return avg >= base ? 'above' : 'below';
    }
    case 'none':
      return undefined;
    default:
      return 'below';
  }
}

/**
 * The conditions that the assessment of `day` points to, heaviest first. A symptom counts
 * when it was reported today or keeps coming back; an indicator counts when it is out of
 * its limit on the side the condition names.
 */
export function matchConditions(p: Profile, day: number, all: Record<RegionId, Assessment>): ConditionMatch[] {
  const today = new Set(entryFor(p, day)?.symptoms ?? []);
  const findings = REGION_ORDER.flatMap((r) => all[r].findings);
  const flaggedSymptom = (id: string) => findings.filter((f) => f.symptom === id && f.status !== 'nominal');
  const active = (id: string) => today.has(id) || flaggedSymptom(id).length > 0;

  const matches: ConditionMatch[] = [];
  for (const condition of CONDITIONS) {
    const symptoms = condition.symptoms.filter(active);
    const bySymptoms =
      symptoms.length >= (condition.needs ?? 1) && symptoms.length > 0 && (!condition.core || condition.core.some(active));

    const byIndicator = (condition.indicators ?? []).flatMap((spec) =>
      findings.filter(
        (f) => f.indicator === spec.id && f.status !== 'nominal' && (spec.direction === 'either' || sideOf(p, f, day) === spec.direction),
      ),
    );
    if (!bySymptoms && byIndicator.length === 0) continue;

    const behind = [...(bySymptoms ? symptoms.flatMap(flaggedSymptom) : []), ...byIndicator];
    const status = behind.reduce<Status>((s, f) => worst(s, f.status), 'caution');
    const regions = new Set<RegionId>([condition.region]);
    if (bySymptoms) for (const id of symptoms) regions.add(symptomRegion(id) as RegionId);
    for (const f of byIndicator) regions.add(INDICATORS[f.indicator as IndicatorId].region);

    // One line per sign: an indicator flagged twice (today and long-term) is named once.
    const indicatorSigns = [...new Set(byIndicator.map((f) => f.indicator as IndicatorId))].map((id) => {
      const first = byIndicator.find((f) => f.indicator === id) as Finding;
      return `${INDICATORS[id].label}: ${first.reason}`;
    });

    matches.push({
      condition,
      status,
      urgent: condition.urgent === true || status === 'warning',
      signs: [...(bySymptoms ? symptoms.map(symptomLabel) : []), ...indicatorSigns],
      regions: [...regions],
    });
  }
  return [...matches.filter((m) => m.status === 'warning'), ...matches.filter((m) => m.status !== 'warning')];
}

/** The matches that concern one system: the condition is its own, or one of its findings points to it. */
export function matchesFor(matches: ConditionMatch[], region: RegionId): ConditionMatch[] {
  return matches.filter((m) => m.regions.includes(region));
}

/**
 * What the app asks next when these symptoms are reported: the other signs of the
 * conditions they may belong to, and the measurements that help tell.
 */
export function followUp(symptomIds: string[]): { conditions: ConditionDef[]; alsoAsk: string[]; measure: IndicatorId[] } {
  const reported = new Set(symptomIds);
  const conditions = CONDITIONS.filter((c) => c.symptoms.some((s) => reported.has(s)));
  const related = new Set(conditions.flatMap((c) => c.symptoms).filter((s) => !reported.has(s)));
  const wanted = new Set(conditions.flatMap((c) => c.ask));
  return {
    conditions,
    alsoAsk: SYMPTOMS.filter((s) => related.has(s.id)).map((s) => s.id),
    measure: ALL_INDICATORS.filter((id) => wanted.has(id)),
  };
}
