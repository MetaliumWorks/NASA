import type { HazardId, MissionId } from '../domain/types';

export interface MissionDef {
  name: string;
  days: number;
  /** Shown as the communications line; null when the sources give no figure. */
  commsLine: string | null;
  /** Hazards emphasised on this mission. */
  hazards: HazardId[];
  /** True when the duration is the team's setting rather than a figure from the sources. */
  teamSetDuration?: boolean;
  /** Source pages (keys of SOURCES) behind the duration and the comms line. */
  basis?: { duration?: string; comms?: string };
}

export const MISSIONS: Record<MissionId, MissionDef> = {
  station: {
    name: 'Station',
    days: 180,
    commsLine: 'Real-time support from the ground',
    hazards: ['gravity', 'isolation'],
    // "four-to-six-month missions"; station crews "can virtually talk with family and medical professionals"
    basis: { duration: 'risk-bone', comms: 'risk-behavioral' },
  },
  moon: {
    name: 'Moon',
    days: 30,
    commsLine: null,
    hazards: ['gravity', 'radiation', 'distance'],
    teamSetDuration: true,
  },
  mars: {
    name: 'Mars',
    days: 1095,
    commsLine: 'Up to 20 minutes one way',
    hazards: ['radiation', 'isolation', 'distance', 'gravity', 'environment'],
    // "roughly three years"; "a communication delay of up to 20 minutes one way"
    basis: { duration: 'hazard-distance', comms: 'hazard-distance' },
  },
};
