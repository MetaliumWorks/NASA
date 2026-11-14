import type { CheckInStep, IndicatorId, RegionId } from '../domain/types';
import type { Sourced } from './sources';

export interface IndicatorDef {
  id: IndicatorId;
  label: string;
  unit: string;
  cadence: 'daily' | 'weekly';
  /** The check-in step that asks for it. */
  step: CheckInStep | 'weekly';
  /** The one region whose status this indicator decides. */
  region: RegionId;
  /** Accepted input range. These are entry limits, not health limits. */
  min: number;
  max: number;
  /** Why it is tracked, from the source pages. */
  why: Sourced;
  /** How to enter it. An interface instruction, not a health claim. */
  howTo: string;
}

export const INDICATORS: Record<IndicatorId, IndicatorDef> = {
  heartRate: {
    id: 'heartRate',
    label: 'Heart rate',
    unit: 'bpm',
    cadence: 'daily',
    step: 'vitals',
    region: 'heart',
    min: 30,
    max: 220,
    why: {
      text: 'Low-gravity conditions and other spaceflight stressors can alter the heart and blood vessels, potentially leading to heart arrhythmias and cardiovascular disease.',
      source: 'risk-cardiovascular',
      quote: 'Low-gravity conditions and other spaceflight stressors can alter the heart and blood vessels',
    },
    howTo: 'Enter your resting pulse in beats per minute.',
  },
  bpSystolic: {
    id: 'bpSystolic',
    label: 'Blood pressure, systolic',
    unit: 'mmHg',
    cadence: 'daily',
    step: 'vitals',
    region: 'heart',
    min: 60,
    max: 250,
    why: {
      text: 'Changes to the heart and blood vessels can lead to low blood pressure, which elevates the chances of fainting at landing.',
      source: 'risk-cardiovascular',
      quote: 'low blood pressure which elevates the chances of fainting at landing',
    },
    howTo: 'Enter the upper number of your reading.',
  },
  bpDiastolic: {
    id: 'bpDiastolic',
    label: 'Blood pressure, diastolic',
    unit: 'mmHg',
    cadence: 'daily',
    step: 'vitals',
    region: 'heart',
    min: 30,
    max: 150,
    why: {
      text: 'In space, the heart and blood vessels can change.',
      source: 'risk-cardiovascular',
      quote: 'In space, the heart and blood vessels can change',
    },
    howTo: 'Enter the lower number of the same reading.',
  },
  bloodSugar: {
    id: 'bloodSugar',
    label: 'Blood sugar',
    unit: 'mg/dL',
    cadence: 'daily',
    step: 'vitals',
    region: 'digestion',
    min: 20,
    max: 600,
    why: {
      text: 'Astronauts can develop insulin resistance, which may lead to Type 2 diabetes.',
      source: 'csa-body-infographic',
      quote: 'astronauts can develop insulin resistance, which may lead to Type 2 diabetes',
    },
    howTo: 'Enter the reading from the glucose meter in mg/dL.',
  },
  bodyTemp: {
    id: 'bodyTemp',
    label: 'Body temperature',
    unit: '°C',
    cadence: 'daily',
    step: 'vitals',
    region: 'immune',
    min: 30,
    max: 43,
    why: {
      text: 'Spaceflight stressors can alter the immune system, and shifts in immunity may lead to an increased incidence of infections.',
      source: 'risk-immune',
      quote: 'shifts in immunity may lead to an increased incidence of infections',
    },
    howTo: 'Enter the thermometer reading in °C. A comma or a point both work.',
  },
  sleepHours: {
    id: 'sleepHours',
    label: 'Sleep',
    unit: 'h',
    cadence: 'daily',
    step: 'sleepMood',
    region: 'brain',
    min: 0,
    max: 24,
    why: {
      text: 'Astronauts are exposed to numerous stressors during spaceflight, such as work overload, irregular light-dark cycles, and sleep-pattern disruptions.',
      source: 'risk-sleep',
      quote:
        'Astronauts are exposed to numerous stressors during spaceflight, such as work overload, irregular light-dark cycles, and sleep-pattern disruptions.',
    },
    howTo: 'Enter how many hours you slept in your last sleep period.',
  },
  mood: {
    id: 'mood',
    label: 'Mood',
    unit: '1–5',
    cadence: 'daily',
    step: 'sleepMood',
    region: 'brain',
    min: 1,
    max: 5,
    why: {
      text: 'Prolonged isolation and confinement can increase risks of behavioral issues and psychiatric disorders, such as anxiety and depression.',
      source: 'risk-behavioral',
      quote:
        'The prolonged isolation and confinement that astronauts face in space can increase risks of behavioral issues and psychiatric disorders, such as anxiety and depression.',
    },
    howTo: 'Rate your mood today from 1 (very low) to 5 (very good).',
  },
  exerciseHours: {
    id: 'exerciseHours',
    label: 'Exercise',
    unit: 'h',
    cadence: 'daily',
    step: 'intake',
    region: 'bones',
    min: 0,
    max: 8,
    why: {
      text: 'Station crews perform resistance training and aerobic exercises for 1.5 hours per day, six to seven days a week, to protect against muscle and bone loss.',
      source: 'risk-fitness',
      quote:
        'Six to seven days a week, astronauts on the International Space Station perform resistance training and aerobic exercises for 1.5 hours per day to maintain their fitness and protect against muscle and bone loss.',
    },
    howTo: 'Enter the hours of resistance and aerobic exercise you did today.',
  },
  waterLiters: {
    id: 'waterLiters',
    label: 'Water',
    unit: 'L',
    cadence: 'daily',
    step: 'intake',
    region: 'kidneys',
    min: 0,
    max: 10,
    why: {
      text: 'Without preventive measures, crews may experience an increased risk of developing kidney stones due to dehydration and increased excretion of calcium from their bones.',
      source: 'hazard-gravity',
      quote:
        'crews may experience an increased risk of developing kidney stones due to dehydration and increased excretion of calcium from their bones',
    },
    howTo: 'Enter how many litres of water and other drinks you had today.',
  },
  appetite: {
    id: 'appetite',
    label: 'Appetite',
    unit: '1–5',
    cadence: 'daily',
    step: 'intake',
    region: 'digestion',
    min: 1,
    max: 5,
    why: {
      text: 'Keeping astronauts’ bodies and minds healthy during space flight requires adequate nutrition.',
      source: 'risk-nutrition',
      quote: 'Keeping astronauts’ bodies and minds healthy during space flight requires adequate nutrition.',
    },
    howTo: 'Rate your appetite today from 1 (none) to 5 (strong).',
  },
  radiationDose: {
    id: 'radiationDose',
    label: 'Radiation dose',
    unit: 'mSv',
    cadence: 'daily',
    step: 'radiation',
    region: 'radiation',
    min: 0,
    max: 1000,
    why: {
      text: 'Astronauts are exposed to higher levels of radiation in space than on Earth, which can lead to the development of certain cancers.',
      source: 'risk-radiation-cancer',
      quote:
        'Astronauts are exposed to higher levels of radiation in space than on Earth, which can lead to the development of certain cancers.',
    },
    howTo: 'Enter today’s reading from your personal dosimeter in mSv.',
  },
  strength: {
    id: 'strength',
    label: 'Strength self-rating',
    unit: '1–5',
    cadence: 'weekly',
    step: 'weekly',
    region: 'muscles',
    min: 1,
    max: 5,
    why: {
      text: 'Crew members undergo periodic fitness self-evaluations to help researchers monitor their health and fitness.',
      source: 'risk-fitness',
      quote: 'Crew members also undergo periodic fitness self-evaluations to help researchers monitor their health and fitness',
    },
    howTo: 'Rate your overall strength this week from 1 (much weaker) to 5 (strong).',
  },
  heightCm: {
    id: 'heightCm',
    label: 'Height',
    unit: 'cm',
    cadence: 'weekly',
    step: 'weekly',
    region: 'spine',
    min: 100,
    max: 230,
    why: {
      text: 'The spines of astronauts straighten out and elongate in space, so the height of crew members can increase as much as 3%.',
      source: 'risk-bone',
      quote: 'the height of crew members can increase as much as 3% in space',
    },
    howTo: 'Measure your height and enter it in centimetres.',
  },
  reactionMs: {
    id: 'reactionMs',
    label: 'Reaction time',
    unit: 'ms',
    cadence: 'weekly',
    step: 'weekly',
    region: 'brain',
    min: 100,
    max: 2000,
    why: {
      text: 'NASA’s Standard Measures study uses cognition tests to examine brain function.',
      source: 'study-standard-measures',
      quote: 'cognition tests to examine brain function',
    },
    howTo: 'Run the reaction test; the result is your median time in milliseconds.',
  },
  visionLevel: {
    id: 'visionLevel',
    label: 'Vision level',
    unit: 'level',
    cadence: 'weekly',
    step: 'weekly',
    region: 'eyes',
    min: 0,
    max: 8,
    why: {
      text: 'Astronauts take vision tests to help researchers evaluate how long-term spaceflight alters the structure and function of the eyes.',
      source: 'study-cipher',
      quote:
        'Participating astronauts will take vision tests to help researchers evaluate how long-term spaceflight alters the structure and function of the eyes.',
    },
    howTo: 'Run the vision test; the result is the smallest size you read correctly.',
  },
};
