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
}

export const MISSIONS: Record<MissionId, MissionDef> = {
  station: {
    name: 'Station',
    days: 180,
    commsLine: 'Real-time support from the ground',
    hazards: ['gravity', 'isolation'],
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
  },
};
