import type { IndicatorId, RegionId } from '../domain/types';
import type { Sourced } from './sources';

/**
 * Conditions the source pages describe, and the signs that point to each. The app uses
 * them to say "Possible: ..." next to what it found. It is a match with what NASA and CSA
 * describe, never a diagnosis, and nothing here goes beyond the saved pages.
 */
export interface ConditionDef {
  id: string;
  /** The name the sources use. */
  name: string;
  /** The system it belongs to. */
  region: RegionId;
  /** What the source says about it. */
  about: Sourced;
  /** Reported symptoms that point to it (ids of SYMPTOMS, of any system). */
  symptoms: string[];
  /** How many of those symptoms it takes. One, unless said otherwise. */
  needs?: number;
  /** When set, at least one of these must be among the reported symptoms. */
  core?: string[];
  /** An indicator out of its limit in this direction points to it as well. */
  indicators?: { id: IndicatorId; direction: 'above' | 'below' | 'either' }[];
  /** Measurements the app asks for when one of the symptoms is reported. */
  ask: IndicatorId[];
  /** What to do: ids of recommendations of its region. */
  actions: string[];
  /** A match is reported to the ground at once, whatever the status. */
  urgent?: boolean;
}

export const CONDITIONS: ConditionDef[] = [
  // Brain, mind & sleep
  {
    id: 'behavioralChanges',
    name: 'Behavioral changes from isolation',
    region: 'brain',
    about: {
      text: 'The prolonged isolation and confinement that astronauts face in space can increase risks of behavioral issues and psychiatric disorders, such as anxiety and depression.',
      source: 'risk-behavioral',
      quote:
        'The prolonged isolation and confinement that astronauts face in space can increase risks of behavioral issues and psychiatric disorders, such as anxiety and depression.',
    },
    symptoms: ['anxiety', 'lowMood'],
    indicators: [{ id: 'mood', direction: 'below' }],
    ask: ['mood', 'sleepHours'],
    actions: ['journal', 'talkToFamily', 'windowTime'],
  },
  {
    id: 'sleepLoss',
    name: 'Sleep loss',
    region: 'brain',
    about: {
      text: 'Sleep loss, circadian desynchronization, and work overload may lead to decreased performance and adverse health outcomes.',
      source: 'hazard-isolation',
      quote:
        'Sleep loss, circadian desynchronization, and work overload compound this issue and may lead to decreased performance, adverse health outcomes, and compromised mission objectives.',
    },
    symptoms: ['troubleSleeping'],
    indicators: [{ id: 'sleepHours', direction: 'below' }],
    ask: ['sleepHours'],
    actions: ['relaxTime', 'lightCycle'],
  },
  {
    id: 'cognitiveImpairment',
    name: 'Cognitive or performance impairment',
    region: 'brain',
    about: {
      text: 'Space radiation exposure may affect the central nervous system, causing cognitive or performance impairments during missions.',
      source: 'risk-radiation-cancer',
      quote: 'Space radiation exposure may also affect the central nervous system, causing cognitive or performance impairments during missions',
    },
    symptoms: ['troubleConcentrating'],
    indicators: [{ id: 'reactionMs', direction: 'above' }],
    ask: ['reactionMs', 'sleepHours'],
    actions: ['relaxTime'],
  },

  // Eyes
  {
    id: 'sans',
    name: 'Spaceflight associated neuro-ocular syndrome (SANS)',
    region: 'eyes',
    about: {
      text: 'Bodily fluids moving toward the head can lead to optic nerve swelling, folds in the retina and flattening of the back of the eye. This collection of eye and brain changes is called SANS.',
      source: 'risk-sans',
      quote: 'This collection of eye and brain changes is called',
    },
    symptoms: ['blurredVision'],
    indicators: [{ id: 'visionLevel', direction: 'below' }],
    ask: ['visionLevel'],
    actions: ['runVisionCheck'],
  },

  // Inner ear & balance
  {
    id: 'spaceMotionSickness',
    name: 'Space motion sickness',
    region: 'innerEar',
    about: {
      text: 'Altered gravity and shifts between different types of gravity may trigger motion sickness and affect astronauts’ ability to orient themselves.',
      source: 'risk-sensorimotor',
      quote:
        'Altered gravity and shifts between different types of gravity may trigger motion sickness and affect astronauts’ ability to orient themselves.',
    },
    symptoms: ['motionSickness', 'disorientation', 'dizziness'],
    ask: [],
    actions: ['adjustBeforeTasks'],
  },

  // Heart & vessels
  {
    id: 'lowBloodPressure',
    name: 'Low blood pressure',
    region: 'heart',
    about: {
      text: 'Changes to the heart and blood vessels can lead to low blood pressure, which elevates the chances of fainting.',
      source: 'risk-cardiovascular',
      quote: 'low blood pressure which elevates the chances of fainting at landing',
    },
    symptoms: ['lightheaded'],
    indicators: [
      { id: 'bpSystolic', direction: 'below' },
      { id: 'bpDiastolic', direction: 'below' },
    ],
    ask: ['bpSystolic', 'bpDiastolic', 'heartRate'],
    actions: ['fluidsAndCompression'],
  },
  {
    id: 'arrhythmia',
    name: 'Heart arrhythmia',
    region: 'heart',
    about: {
      text: 'Low-gravity conditions and other spaceflight stressors can alter the heart and blood vessels, potentially leading to heart arrhythmias.',
      source: 'risk-cardiovascular',
      quote: 'potentially leading to blood clots, heart arrythmias, cardiovascular disease',
    },
    symptoms: ['irregularHeartbeat'],
    ask: ['heartRate', 'bpSystolic', 'bpDiastolic'],
    actions: ['exerciseAndDiet'],
  },
  {
    id: 'cardiovascularAdaptation',
    name: 'Cardiovascular adaptation',
    region: 'heart',
    about: {
      text: 'Low-gravity conditions and other spaceflight stressors can alter the heart and blood vessels.',
      source: 'risk-cardiovascular',
      quote: 'Low-gravity conditions and other spaceflight stressors can alter the heart and blood vessels',
    },
    symptoms: [],
    indicators: [
      { id: 'heartRate', direction: 'either' },
      { id: 'bpSystolic', direction: 'above' },
      { id: 'bpDiastolic', direction: 'above' },
    ],
    ask: ['heartRate', 'bpSystolic', 'bpDiastolic'],
    actions: ['exerciseAndDiet'],
  },

  // Lungs & oxygen
  {
    id: 'mildHypoxia',
    name: 'Mild hypoxia',
    region: 'lungs',
    about: {
      text: 'Mild hypoxia, if untreated, can cause confusion, headaches, vision impairment, and trouble sleeping.',
      source: 'risk-hypoxia',
      quote: 'Mild hypoxia, if untreated, can cause confusion, headaches, vision impairment, and trouble sleeping.',
    },
    // The four effects the source lists. Two of them, one of which is a headache or confusion.
    symptoms: ['headache', 'confusion', 'blurredVision', 'troubleSleeping'],
    needs: 2,
    core: ['headache', 'confusion'],
    ask: [],
    actions: [],
  },
  {
    id: 'decompressionSickness',
    name: 'Decompression sickness',
    region: 'lungs',
    about: {
      text: 'During decompression sickness, dissolved nitrogen in the bloodstream begins to bubble, which can damage body tissues.',
      source: 'risk-decompression',
      quote:
        'During decompression sickness, dissolved nitrogen in the bloodstream begins to bubble, which can damage body tissues.',
    },
    symptoms: ['painAfterSpacewalk'],
    ask: [],
    actions: ['endSpacewalk'],
    urgent: true,
  },

  // Blood & immunity
  {
    id: 'alteredImmunity',
    name: 'Altered immune response',
    region: 'immune',
    about: {
      text: 'Some astronauts aboard the International Space Station have reported cold sores, rashes, atypical allergies, and infections that can be attributed to immune system alterations.',
      source: 'risk-immune',
      quote:
        'Some astronauts aboard the International Space Station have reported cold sores, rashes, atypical allergies, and infections that can be attributed to immune system alterations.',
    },
    symptoms: ['coldSores', 'rash', 'allergy', 'infection'],
    indicators: [{ id: 'bodyTemp', direction: 'above' }],
    ask: ['bodyTemp'],
    actions: ['collectSample'],
  },

  // Bones, spine, muscles
  {
    id: 'muscleAndBoneLoss',
    name: 'Muscle and bone loss',
    region: 'bones',
    about: {
      text: 'Station crews exercise 1.5 hours per day to maintain their fitness and protect against muscle and bone loss.',
      source: 'risk-fitness',
      quote: 'to maintain their fitness and protect against muscle and bone loss',
    },
    symptoms: [],
    indicators: [{ id: 'exerciseHours', direction: 'below' }],
    ask: ['exerciseHours'],
    actions: ['resistiveExercise', 'dailyExercise'],
  },
  {
    id: 'spineElongation',
    name: 'Spine elongation',
    region: 'spine',
    about: {
      text: 'The spines of astronauts will straighten out and elongate in space.',
      source: 'risk-bone',
      quote: 'the spines of astronauts will straighten out and elongate in space',
    },
    symptoms: [],
    indicators: [{ id: 'heightCm', direction: 'above' }],
    ask: ['heightCm'],
    actions: ['spineExercise'],
  },
  {
    id: 'strengthLoss',
    name: 'Loss of strength',
    region: 'muscles',
    about: {
      text: 'Data from station missions indicates that average losses to strength and aerobic fitness are 10-12% of pre-mission levels.',
      source: 'risk-fitness',
      quote: 'average losses to strength and aerobic fitness are 10-12% of pre-mission levels',
    },
    symptoms: [],
    indicators: [{ id: 'strength', direction: 'below' }],
    ask: ['strength'],
    actions: ['dailyExercise', 'fitnessSelfEvaluation'],
  },

  // Digestion & nutrition
  {
    id: 'menuFatigue',
    name: 'Menu fatigue',
    region: 'digestion',
    about: {
      text: 'Lost appetites could result in astronauts not eating enough food, which may lead to body mass loss, nutritional deficiencies, and other health issues.',
      source: 'past-food-acceptability',
      quote:
        'Lost appetites could result in astronauts not eating enough food, which may lead to body mass loss, nutritional deficiencies, and other health issues.',
    },
    symptoms: ['menuFatigue'],
    indicators: [{ id: 'appetite', direction: 'below' }],
    ask: ['appetite'],
    actions: ['variedMeals'],
  },
  {
    id: 'insulinResistance',
    name: 'Insulin resistance',
    region: 'digestion',
    about: {
      text: 'Astronauts can develop insulin resistance, which may lead to Type 2 diabetes.',
      source: 'csa-body-infographic',
      quote: 'astronauts can develop insulin resistance, which may lead to Type 2 diabetes',
    },
    symptoms: [],
    indicators: [{ id: 'bloodSugar', direction: 'above' }],
    ask: ['bloodSugar'],
    actions: ['balancedDiet'],
  },

  // Kidneys
  {
    id: 'dehydration',
    name: 'Dehydration',
    region: 'kidneys',
    about: {
      text: 'Crews may experience an increased risk of developing kidney stones due to dehydration and increased excretion of calcium from their bones.',
      source: 'hazard-gravity',
      quote:
        'crews may experience an increased risk of developing kidney stones due to dehydration and increased excretion of calcium from their bones',
    },
    symptoms: [],
    indicators: [{ id: 'waterLiters', direction: 'below' }],
    ask: ['waterLiters'],
    actions: ['drinkMore'],
  },
];

export function findCondition(id: string): ConditionDef | undefined {
  return CONDITIONS.find((c) => c.id === id);
}
