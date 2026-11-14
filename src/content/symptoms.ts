import type { RegionId } from '../domain/types';
import type { Sourced } from './sources';

export interface SymptomDef {
  id: string;
  label: string;
  region: RegionId;
  /** One report alone is a warning. */
  urgent?: boolean;
  /** Where the source pages name this symptom. */
  basis: Sourced;
}

export const SYMPTOMS: SymptomDef[] = [
  // Brain, mind & sleep
  {
    id: 'anxiety',
    label: 'Anxiety',
    region: 'brain',
    basis: {
      text: 'Prolonged isolation and confinement can increase risks of behavioral issues and psychiatric disorders, such as anxiety and depression.',
      source: 'risk-behavioral',
      quote: 'can increase risks of behavioral issues and psychiatric disorders, such as anxiety and depression',
    },
  },
  {
    id: 'lowMood',
    label: 'Low mood',
    region: 'brain',
    basis: {
      text: 'Isolation and confinement may impact a crew member’s sleep, morale, and decision making.',
      source: 'risk-behavioral',
      quote: 'These factors may impact a crew member’s sleep, morale, and decision making',
    },
  },
  {
    id: 'troubleSleeping',
    label: 'Trouble sleeping',
    region: 'brain',
    basis: {
      text: 'Astronauts witness 16 sunrises and sunsets per day aboard the space station, which can disrupt their sleep-wake cycle.',
      source: 'risk-sleep',
      quote:
        'Astronauts witness 16 sunrises and sunsets per day aboard the space station, which can disrupt their sleep-wake cycle.',
    },
  },
  {
    id: 'troubleConcentrating',
    label: 'Trouble concentrating',
    region: 'brain',
    basis: {
      text: 'Radiation exposure can alter cognitive function and prompt behavioral changes.',
      source: 'hazard-radiation',
      quote:
        'Radiation exposure increases cancer risk, damages the central nervous system, can alter cognitive function, reduce motor function, and prompt behavioral changes.',
    },
  },

  // Eyes
  {
    id: 'blurredVision',
    label: 'Blurred vision',
    region: 'eyes',
    basis: {
      text: 'Water and other fluids in the body shift upward to the head, which may put pressure on the eyes and cause vision problems.',
      source: 'hazard-gravity',
      quote:
        'Water and other fluids in the body shift upward to the head, which may put pressure on the eyes and cause vision problems.',
    },
  },

  // Inner ear & balance
  {
    id: 'motionSickness',
    label: 'Motion sickness',
    region: 'innerEar',
    basis: {
      text: 'The majority of astronauts experience motion sickness during spaceflight.',
      source: 'risk-sensorimotor',
      quote: 'The majority of astronauts experience motion sickness during spaceflight.',
    },
  },
  {
    id: 'disorientation',
    label: 'Disorientation',
    region: 'innerEar',
    basis: {
      text: 'Altered gravity and shifts between different types of gravity may affect astronauts’ ability to orient themselves.',
      source: 'risk-sensorimotor',
      quote:
        'Altered gravity and shifts between different types of gravity may trigger motion sickness and affect astronauts’ ability to orient themselves.',
    },
  },
  {
    id: 'dizziness',
    label: 'Dizziness',
    region: 'innerEar',
    basis: {
      text: 'Floating weightlessly within a spacecraft can lead to dizziness.',
      source: 'hazard-gravity',
      quote: 'Floating weightlessly within a spacecraft can lead to dizziness, bone and muscle loss, vision issues, and more.',
    },
  },

  // Heart & vessels
  {
    id: 'lightheaded',
    label: 'Lightheaded or faint',
    region: 'heart',
    basis: {
      text: 'When shifting from weightlessness to gravity, astronauts may even experience lightheadedness and fainting.',
      source: 'hazard-gravity',
      quote: 'When shifting from weightlessness to gravity, astronauts may even experience lightheadedness and fainting.',
    },
  },
  {
    id: 'irregularHeartbeat',
    label: 'Irregular heartbeat',
    region: 'heart',
    basis: {
      text: 'Changes to the heart and blood vessels can potentially lead to heart arrhythmias.',
      source: 'risk-cardiovascular',
      quote: 'potentially leading to blood clots, heart arrythmias, cardiovascular disease',
    },
  },

  // Lungs & oxygen
  {
    id: 'headache',
    label: 'Headache',
    region: 'lungs',
    basis: {
      text: 'Mild hypoxia, if untreated, can cause confusion, headaches, vision impairment, and trouble sleeping.',
      source: 'risk-hypoxia',
      quote: 'Mild hypoxia, if untreated, can cause confusion, headaches, vision impairment, and trouble sleeping.',
    },
  },
  {
    id: 'confusion',
    label: 'Confusion',
    region: 'lungs',
    basis: {
      text: 'Mild hypoxia, a condition that occurs when oxygen levels in body tissues become lower than normal, can cause confusion.',
      source: 'risk-hypoxia',
      quote: 'a condition that occurs when oxygen levels in body tissues become lower than normal',
    },
  },
  {
    id: 'painAfterSpacewalk',
    label: 'Pain after a spacewalk',
    region: 'lungs',
    urgent: true,
    basis: {
      text: 'Decompression sickness, which can cause severe pain in divers on Earth, can also occur when an astronaut moves from a spacecraft to a lower-pressure spacesuit for spacewalks.',
      source: 'risk-decompression',
      quote:
        'In space, this same phenomenon can occur when an astronaut moves from a spacecraft to a lower-pressure spacesuit for spacewalks.',
    },
  },

  // Blood & immunity
  {
    id: 'coldSores',
    label: 'Cold sores',
    region: 'immune',
    basis: {
      text: 'Space stressors may awaken dormant viruses in astronauts’ bodies, like those that cause cold sores and shingles.',
      source: 'risk-immune',
      quote: 'awaken dormant viruses in astronauts’ bodies, like those that cause cold sores and shingles',
    },
  },
  {
    id: 'rash',
    label: 'Rash',
    region: 'immune',
    basis: {
      text: 'Some astronauts aboard the International Space Station have reported rashes that can be attributed to immune system alterations.',
      source: 'risk-immune',
      quote:
        'have reported cold sores, rashes, atypical allergies, and infections that can be attributed to immune system alterations',
    },
  },
  {
    id: 'allergy',
    label: 'Allergy',
    region: 'immune',
    basis: {
      text: 'Space stressors may trigger allergic reactions.',
      source: 'risk-immune',
      quote: 'Such space stressors may also trigger allergic reactions',
    },
  },
  {
    id: 'infection',
    label: 'Infection',
    region: 'immune',
    basis: {
      text: 'Shifts in immunity may lead to an increased incidence of infections.',
      source: 'risk-immune',
      quote: 'shifts in immunity may lead to an increased incidence of infections',
    },
  },

  // Digestion & nutrition
  {
    id: 'menuFatigue',
    label: 'Menu fatigue',
    region: 'digestion',
    basis: {
      text: 'Meals need to be acceptable, safe, nutritious and varied enough to avoid menu fatigue.',
      source: 'risk-nutrition',
      quote: 'varied enough to avoid menu fatigue',
    },
  },
];
