import type { HazardId } from '../domain/types';

/** NASA's five hazards of human spaceflight, each with its own page in SOURCES. */
export const HAZARDS: Record<HazardId, { name: string; source: string }> = {
  radiation: { name: 'Space radiation', source: 'hazard-radiation' },
  isolation: { name: 'Isolation & confinement', source: 'hazard-isolation' },
  distance: { name: 'Distance from Earth', source: 'hazard-distance' },
  gravity: { name: 'Gravity fields', source: 'hazard-gravity' },
  environment: { name: 'Hostile/closed environments', source: 'hazard-environment' },
};
