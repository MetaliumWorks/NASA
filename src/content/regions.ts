import type { HazardId, IndicatorId, RegionId } from '../domain/types';
import type { Sourced } from './sources';

export interface Recommendation {
  id: string;
  /** What the astronaut ticks. */
  text: string;
  /** The source passage the recommendation rests on; null only for the ground-report item. */
  basis: Sourced | null;
  kind?: 'groundReport';
}

export interface RegionDef {
  id: RegionId;
  name: string;
  hazards: HazardId[];
  /** Indicators that decide this region's status. */
  indicators: IndicatorId[];
  /** Indicators shown under Findings for information; they do not change the status. */
  related?: IndicatorId[];
  /** What happens to this part of the body in space. */
  impression: Sourced[];
  /** What the organ does. Present only where a source page says so. */
  function?: Sourced;
  recommendations: Recommendation[];
}

/** Spec section 6 order. */
export const REGION_ORDER: RegionId[] = [
  'brain',
  'eyes',
  'innerEar',
  'mouth',
  'heart',
  'lungs',
  'immune',
  'bones',
  'spine',
  'muscles',
  'digestion',
  'kidneys',
  'radiation',
];

const groundReport = (region: RegionId): Recommendation => ({
  id: `groundReport-${region}`,
  text: 'Add to the next ground report',
  basis: null,
  kind: 'groundReport',
});

/** Shared by Bones and Muscles: one object, so it lands in the plan once. */
const dailyExercise: Recommendation = {
  id: 'dailyExercise',
  text: 'Do 1.5 h of resistance and aerobic exercise.',
  basis: {
    text: 'Station crews perform resistance training and aerobic exercises for 1.5 hours per day to maintain their fitness and protect against muscle and bone loss.',
    source: 'risk-fitness',
    quote:
      'astronauts on the International Space Station perform resistance training and aerobic exercises for 1.5 hours per day to maintain their fitness and protect against muscle and bone loss',
  },
};

/** A recommendation by its id, whichever region lists it. */
export function findRecommendation(id: string): Recommendation | undefined {
  for (const region of REGION_ORDER) {
    const found = REGIONS[region].recommendations.find((r) => r.id === id);
    if (found) return found;
  }
  return undefined;
}

export const REGIONS: Record<RegionId, RegionDef> = {
  brain: {
    id: 'brain',
    name: 'Brain, mind & sleep',
    hazards: ['isolation', 'radiation'],
    indicators: ['mood', 'sleepHours', 'reactionMs'],
    impression: [
      {
        text: 'The prolonged isolation and confinement that astronauts face in space can increase risks of behavioral issues and psychiatric disorders, such as anxiety and depression.',
        source: 'risk-behavioral',
        quote:
          'The prolonged isolation and confinement that astronauts face in space can increase risks of behavioral issues and psychiatric disorders, such as anxiety and depression.',
      },
      {
        text: 'Work overload, irregular light-dark cycles and sleep-pattern disruptions take a toll on the human body and can lead to short- and long-term health consequences.',
        source: 'risk-sleep',
        quote:
          'These stressors take a toll on the human body and can lead to short- and long-term health consequences that can affect mission success.',
      },
      {
        text: 'Sleep loss, circadian desynchronization, and work overload compound the isolation and may lead to decreased performance and adverse health outcomes.',
        source: 'hazard-isolation',
        quote:
          'Sleep loss, circadian desynchronization, and work overload compound this issue and may lead to decreased performance, adverse health outcomes, and compromised mission objectives.',
      },
    ],
    recommendations: [
      {
        id: 'journal',
        text: 'Write in your journal today.',
        basis: {
          text: 'To improve mental health, NASA encourages astronauts to explore self-care options including keeping a regular journal.',
          source: 'risk-behavioral',
          quote: 'NASA encourages astronauts to explore self-care options including keeping a regular journal',
        },
      },
      {
        id: 'talkToFamily',
        text: 'Talk with family or a medical professional.',
        basis: {
          text: 'Crew members aboard the International Space Station can virtually talk with family and medical professionals for support.',
          source: 'risk-behavioral',
          quote:
            'Crew members aboard the International Space Station can virtually talk with family and medical professionals for support',
        },
      },
      {
        id: 'windowTime',
        text: 'Spend some time at a window.',
        basis: {
          text: 'A spacecraft’s windows can boost the mental health of astronauts because they reduce monotony and the sense of confinement.',
          source: 'risk-behavioral',
          quote:
            'A spacecraft’s windows can boost the mental health of astronauts because they reduce monotony and the sense of confinement while in space.',
        },
      },
      {
        id: 'relaxTime',
        text: 'Keep your designated time for relaxation and self-care.',
        basis: {
          text: 'Astronauts are given designated times for relaxation and self-care as part of their routine to help prevent burnout.',
          source: 'risk-sleep',
          quote:
            'Astronauts are also given designated times for relaxation and self-care as part of their routine to help prevent burnout.',
        },
      },
      {
        id: 'lightCycle',
        text: 'Keep to the cabin’s light-dark cycle before sleep.',
        basis: {
          text: 'On the station, LEDs simulate Earth’s light-dark cycle to help astronauts sleep better.',
          source: 'risk-sleep',
          quote: 'simulate Earth’s light-dark cycle to help astronauts sleep better',
        },
      },
      groundReport('brain'),
    ],
  },

  eyes: {
    id: 'eyes',
    name: 'Eyes',
    hazards: ['gravity'],
    indicators: ['visionLevel'],
    impression: [
      {
        text: 'Chronic weightlessness can cause bodily fluids such as blood and cerebrospinal fluid to move toward the head, which can lead to optic nerve swelling, folds in the retina, flattening of the back of the eye, and swelling in the brain.',
        source: 'risk-sans',
        quote:
          'Chronic weightlessness can cause bodily fluids such as blood and cerebrospinal fluid to move toward the head, which can lead to optic nerve swelling, folds in the retina, flattening of the back of the eye, and swelling in the brain.',
      },
      {
        text: 'Approximately 70 percent of astronauts aboard the International Space Station experience some swelling in the back of their eyes.',
        source: 'risk-sans',
        quote:
          'Approximately 70 percent of astronauts aboard the International Space Station experience some swelling in the back of their eyes.',
      },
    ],
    recommendations: [
      {
        id: 'runVisionCheck',
        text: 'Run the vision check.',
        basis: {
          text: 'Astronauts take vision tests to help researchers evaluate how long-term spaceflight alters the structure and function of the eyes.',
          source: 'study-cipher',
          quote:
            'Participating astronauts will take vision tests to help researchers evaluate how long-term spaceflight alters the structure and function of the eyes.',
        },
      },
      groundReport('eyes'),
    ],
  },

  innerEar: {
    id: 'innerEar',
    name: 'Inner ear & balance',
    hazards: ['gravity'],
    indicators: [],
    impression: [
      {
        text: 'Altered gravity and shifts between different types of gravity may trigger motion sickness and affect astronauts’ ability to orient themselves.',
        source: 'risk-sensorimotor',
        quote:
          'Altered gravity and shifts between different types of gravity may trigger motion sickness and affect astronauts’ ability to orient themselves.',
      },
      {
        text: 'Switching from one gravity field to another affects spatial orientation, head-eye and hand-eye coordination, balance, and locomotion.',
        source: 'hazard-gravity',
        quote:
          'The transition affects spatial orientation, head-eye and hand-eye coordination, balance, and locomotion, with some crew members experiencing space motion sickness.',
      },
    ],
    function: {
      text: 'These organs are involved with orientation and balance.',
      source: 'study-cipher',
      quote: 'the organs involved with orientation and balance',
    },
    recommendations: [
      {
        id: 'adjustBeforeTasks',
        text: 'Give yourself time to adjust before mission-critical tasks.',
        basis: {
          text: 'Astronauts may need time to adjust to new gravity fields before they conduct mission-critical tasks.',
          source: 'hazard-gravity',
          quote:
            'Astronauts may also need time to adjust to new gravity fields after landing on the Moon or Mars before they conduct mission-critical tasks.',
        },
      },
      groundReport('innerEar'),
    ],
  },

  // The source pages say nothing about teeth or gums. What they do say about the mouth is here:
  // cold sores from reawakened viruses, and saliva as the sample that shows them.
  mouth: {
    id: 'mouth',
    name: 'Mouth',
    hazards: ['environment', 'radiation'],
    indicators: [],
    impression: [
      {
        text: 'Space stressors may awaken dormant viruses in astronauts’ bodies, like those that cause cold sores and shingles.',
        source: 'risk-immune',
        quote: 'awaken dormant viruses in astronauts’ bodies, like those that cause cold sores and shingles',
      },
      {
        text: 'Viruses, if reactivated, can be found in saliva and urine samples.',
        source: 'past-altered-immunity',
        quote: 'Viruses, if reactivated, can be found in saliva and urine samples.',
      },
      {
        text: 'NASA’s Standard Measures study uses saliva to measure the function of the immune system.',
        source: 'study-standard-measures',
        quote: 'saliva to measure the function of the immune system',
      },
    ],
    recommendations: [
      {
        id: 'salivaSample',
        text: 'Provide your saliva sample.',
        basis: {
          text: 'In the Immune Biomarkers study, saliva is collected during the mission as well as before and after it.',
          source: 'study-immune-biomarkers',
          quote: 'saliva will be collected during the mission as well',
        },
      },
      groundReport('mouth'),
    ],
  },

  heart: {
    id: 'heart',
    name: 'Heart & vessels',
    hazards: ['gravity'],
    indicators: ['heartRate', 'bpSystolic', 'bpDiastolic'],
    impression: [
      {
        text: 'Low-gravity conditions and other spaceflight stressors can alter the heart and blood vessels, potentially leading to blood clots, heart arrhythmias, cardiovascular disease, and low blood pressure which elevates the chances of fainting at landing.',
        source: 'risk-cardiovascular',
        quote: 'Low-gravity conditions and other spaceflight stressors can alter the heart and blood vessels',
      },
      {
        text: 'Blood vessels stiffen and age faster in space.',
        source: 'csa-body-infographic',
        quote: 'Blood vessels stiffen and age faster',
      },
    ],
    recommendations: [
      {
        id: 'exerciseAndDiet',
        text: 'Keep up regular exercise and a healthy diet.',
        basis: {
          text: 'Regular exercise and healthy diets help crews maintain cardiovascular fitness.',
          source: 'risk-cardiovascular',
          quote: 'Regular exercise and healthy diets help crews maintain cardiovascular fitness.',
        },
      },
      {
        id: 'fluidsAndCompression',
        text: 'Before landing, drink lots of fluids and wear lower-body compression garments.',
        basis: {
          text: 'Lower-body compression garments and drinking lots of fluids prior to landing can help to prevent low blood pressure.',
          source: 'risk-cardiovascular',
          quote:
            'Lower-body compression garments and drinking lots of fluids prior to landing can help to prevent low blood pressure.',
        },
      },
      groundReport('heart'),
    ],
  },

  lungs: {
    id: 'lungs',
    name: 'Lungs & oxygen',
    hazards: ['environment'],
    indicators: [],
    impression: [
      {
        text: 'Mild hypoxia is a condition that occurs when oxygen levels in body tissues become lower than normal. If untreated, it can cause confusion, headaches, vision impairment, and trouble sleeping.',
        source: 'risk-hypoxia',
        quote: 'Mild hypoxia, if untreated, can cause confusion, headaches, vision impairment, and trouble sleeping.',
      },
      {
        text: 'During decompression sickness, dissolved nitrogen in the bloodstream begins to bubble, which can damage body tissues.',
        source: 'risk-decompression',
        quote:
          'During decompression sickness, dissolved nitrogen in the bloodstream begins to bubble, which can damage body tissues.',
      },
    ],
    recommendations: [
      {
        id: 'endSpacewalk',
        text: 'With symptoms on a spacewalk, end it safely but rapidly and return to the pressurized spacecraft.',
        basis: {
          text: 'When experiencing decompression sickness symptoms, astronauts should safely but rapidly end their spacewalk and return to the pressurized environment of their spacecraft.',
          source: 'risk-decompression',
          quote:
            'when experiencing decompression sickness symptoms, astronauts should safely but rapidly end their spacewalk and return to the pressurized environment of their spacecraft',
        },
      },
      {
        id: 'prebreathe',
        text: 'Follow the prebreathe protocol before a spacewalk.',
        basis: {
          text: 'Prebreathe protocols expose crew members to high levels of oxygen before spacewalks, to help remove nitrogen from the body and mitigate the risk of decompression sickness.',
          source: 'risk-eva',
          quote:
            'primarily to help remove nitrogen from the body and mitigate the risk of decompression sickness',
        },
      },
      groundReport('lungs'),
    ],
  },

  immune: {
    id: 'immune',
    name: 'Blood & immunity',
    hazards: ['environment', 'radiation'],
    indicators: ['bodyTemp'],
    impression: [
      {
        text: 'Radiation, microgravity, poor sleep and other spaceflight stressors can alter the immune system of astronauts.',
        source: 'risk-immune',
        quote: 'Radiation, microgravity, poor sleep and other spaceflight stressors can alter the immune system of astronauts.',
      },
      {
        text: 'Stress hormone levels can elevate and the immune system can alter, which could lead to increased susceptibility to allergies or other illnesses.',
        source: 'hazard-environment',
        quote:
          'Stress hormone levels can elevate and the immune system can alter, which could lead to increased susceptibility to allergies or other illnesses.',
      },
      {
        text: 'Blood cell production in the bone marrow is affected. Low white blood cell count leaves the body vulnerable to infection.',
        source: 'csa-body-infographic',
        quote: 'Low white blood cell count leaves the body vulnerable to infection',
      },
    ],
    function: {
      text: 'The immune system is a network of hormones, cells, and organs that protects our bodies from microbes and other pathogens that can make us ill.',
      source: 'past-altered-immunity',
      quote:
        'The immune system is a network of hormones, cells, and organs that protects our bodies from microbes and other pathogens that can make us ill.',
    },
    recommendations: [
      {
        id: 'collectSample',
        text: 'Provide your scheduled blood, saliva or urine sample.',
        basis: {
          text: 'To better understand what may trigger reactivation of latent viruses, one area of research involves monitoring blood, saliva, and urine samples.',
          source: 'risk-immune',
          quote:
            'To better understand what may trigger reactivation of latent viruses, one area of research involves monitoring blood, saliva, and urine samples.',
        },
      },
      groundReport('immune'),
    ],
  },

  bones: {
    id: 'bones',
    name: 'Bones',
    hazards: ['gravity'],
    indicators: ['exerciseHours'],
    impression: [
      {
        text: 'On average, bones lose between 1% and 1.5% of their density each month during four-to-six-month missions.',
        source: 'risk-bone',
        quote: 'on average, bones lose between 1% and 1.5% of their density each month during four-to-six-month missions',
      },
      {
        text: 'This rate of bone loss can make crew members susceptible to fractures and to premature osteoporosis.',
        source: 'risk-bone',
        quote: 'This rate of bone loss can make crew members susceptible to fractures and to premature osteoporosis',
      },
    ],
    function: {
      text: 'Weight-bearing bones like the spine and hips support the human body.',
      source: 'risk-bone',
      quote: 'weight-bearing bones like the spine and hips don’t need to be as strong to support the human body',
    },
    recommendations: [
      {
        id: 'resistiveExercise',
        text: 'Do your resistive exercise session.',
        basis: {
          text: 'Routine bone scans track the degree to which resistive exercise is helping to keep bones strong in microgravity.',
          source: 'risk-bone',
          quote: 'the degree to which resistive exercise is helping to keep bones strong in microgravity',
        },
      },
      dailyExercise,
      {
        id: 'drinkToPlan',
        text: 'Drink to plan. Calcium leaving bone raises kidney-stone risk.',
        basis: {
          text: 'Crews may experience an increased risk of developing kidney stones due to dehydration and increased excretion of calcium from their bones.',
          source: 'hazard-gravity',
          quote:
            'increased risk of developing kidney stones due to dehydration and increased excretion of calcium from their bones',
        },
      },
      groundReport('bones'),
    ],
  },

  spine: {
    id: 'spine',
    name: 'Spine',
    hazards: ['gravity'],
    indicators: ['heightCm'],
    impression: [
      {
        text: 'The spines of astronauts will straighten out and elongate in space. Consequently, the height of crew members can increase as much as 3%.',
        source: 'risk-bone',
        quote: 'the spines of astronauts will straighten out and elongate in space',
      },
      {
        text: 'Spinal health is integral to postural control and facilitating the core trunk movements required for all activities on mission.',
        source: 'past-spinal-health',
        quote:
          'Spinal health is integral to postural control and facilitating the core trunk movements required for all activities on mission',
      },
    ],
    function: {
      text: 'The network of bones and muscles in the spinal column provides structural support for vital organs, including the brain, heart, and lungs.',
      source: 'past-spinal-health',
      quote: 'This network provides structural support for vital organs, including the brain, heart, and lungs.',
    },
    recommendations: [
      {
        id: 'spineExercise',
        text: 'Do resistive exercises to counter bone and muscle loss.',
        basis: {
          text: 'Scientists and engineers will brainstorm strategies, such as specific resistive exercises, to counter bone and muscle loss in space.',
          source: 'past-spinal-health',
          quote: 'to counter bone and muscle loss in space',
        },
      },
      groundReport('spine'),
    ],
  },

  muscles: {
    id: 'muscles',
    name: 'Muscles',
    hazards: ['gravity'],
    indicators: ['strength'],
    related: ['exerciseHours'],
    impression: [
      {
        text: 'Living in microgravity can weaken the bones, muscles, and cardiopulmonary systems of astronauts, making it difficult for them to carry out critical mission tasks while also increasing the risk of injury.',
        source: 'risk-fitness',
        quote:
          'Living in microgravity can weaken the bones, muscles, and cardiopulmonary systems of astronauts, making it difficult for them to carry out critical mission tasks while also increasing the risk of injury.',
      },
      {
        text: 'Data from International Space Station missions indicates that average losses to strength and aerobic fitness are 10-12% of pre-mission levels.',
        source: 'risk-fitness',
        quote:
          'data from International Space Station missions indicates that average losses to strength and aerobic fitness are 10-12% of pre-mission levels',
      },
    ],
    recommendations: [
      dailyExercise,
      {
        id: 'fitnessSelfEvaluation',
        text: 'Complete your fitness self-evaluation.',
        basis: {
          text: 'Crew members undergo periodic fitness self-evaluations to help researchers monitor their health and fitness and to optimize their training regimen.',
          source: 'risk-fitness',
          quote:
            'Crew members also undergo periodic fitness self-evaluations to help researchers monitor their health and fitness',
        },
      },
      groundReport('muscles'),
    ],
  },

  digestion: {
    id: 'digestion',
    name: 'Digestion & nutrition',
    hazards: ['distance', 'environment'],
    indicators: ['appetite', 'bloodSugar'],
    impression: [
      {
        text: 'Keeping astronauts’ bodies and minds healthy during space flight requires adequate nutrition. Meals need to be acceptable, safe, nutritious and varied enough to avoid menu fatigue.',
        source: 'risk-nutrition',
        quote:
          'Scientists need to ensure meals are acceptable, safe, nutritious, long-lasting, easy to prepare, and varied enough to avoid menu fatigue.',
      },
      {
        text: 'On longer journeys deeper into space, “menu fatigue” can have serious consequences.',
        source: 'hazard-distance',
        quote: 'On longer journeys deeper into space, "menu fatigue" can have serious consequences.',
      },
      {
        text: 'Astronauts can develop insulin resistance, which may lead to Type 2 diabetes.',
        source: 'csa-body-infographic',
        quote: 'astronauts can develop insulin resistance, which may lead to Type 2 diabetes',
      },
    ],
    recommendations: [
      {
        id: 'variedMeals',
        text: 'Vary your meals today to avoid menu fatigue.',
        basis: {
          text: 'Meals need to be varied enough to avoid menu fatigue.',
          source: 'risk-nutrition',
          quote: 'varied enough to avoid menu fatigue',
        },
      },
      {
        id: 'balancedDiet',
        text: 'Keep to a healthy diet.',
        basis: {
          text: 'Regular exercise and healthy diets help crews maintain cardiovascular fitness.',
          source: 'risk-cardiovascular',
          quote: 'Regular exercise and healthy diets help crews maintain cardiovascular fitness.',
        },
      },
      groundReport('digestion'),
    ],
  },

  kidneys: {
    id: 'kidneys',
    name: 'Kidneys',
    hazards: ['gravity'],
    indicators: ['waterLiters'],
    impression: [
      {
        text: 'If preventive measures are not implemented, crews may experience an increased risk of developing kidney stones due to dehydration and increased excretion of calcium from their bones.',
        source: 'hazard-gravity',
        quote:
          'If preventive measures are not implemented, crews may experience an increased risk of developing kidney stones due to dehydration and increased excretion of calcium from their bones.',
      },
    ],
    recommendations: [
      {
        id: 'drinkMore',
        text: 'Drink more water today.',
        basis: {
          text: 'Crews may experience an increased risk of developing kidney stones due to dehydration.',
          source: 'hazard-gravity',
          quote: 'an increased risk of developing kidney stones due to dehydration',
        },
      },
      groundReport('kidneys'),
    ],
  },

  radiation: {
    id: 'radiation',
    name: 'Radiation',
    hazards: ['radiation'],
    indicators: ['radiationDose'],
    impression: [
      {
        text: 'Astronauts are exposed to higher levels of radiation in space than on Earth, which can lead to the development of certain cancers.',
        source: 'risk-radiation-cancer',
        quote:
          'Astronauts are exposed to higher levels of radiation in space than on Earth, which can lead to the development of certain cancers.',
      },
      {
        text: 'Radiation exposure increases cancer risk, damages the central nervous system, can alter cognitive function, reduce motor function, and prompt behavioral changes.',
        source: 'hazard-radiation',
        quote:
          'Radiation exposure increases cancer risk, damages the central nervous system, can alter cognitive function, reduce motor function, and prompt behavioral changes.',
      },
      {
        text: 'Neutron radiation, which contributes to about 30% of total radiation on the ISS, is especially harmful because it can cause serious biological damage.',
        source: 'csa-radiation',
        quote:
          'Neutron radiation, which contributes to about 30% of total radiation on the ISS, is especially harmful because it can cause serious biological damage',
      },
    ],
    recommendations: [
      {
        id: 'logDosimeter',
        text: 'Log today’s dosimeter reading.',
        basis: {
          text: 'Various instruments that measure radiation exposure are in place aboard the International Space Station.',
          source: 'risk-radiation-cancer',
          quote: 'various instruments that measure radiation exposure are in place aboard the International Space Station',
        },
      },
      groundReport('radiation'),
    ],
  },
};
