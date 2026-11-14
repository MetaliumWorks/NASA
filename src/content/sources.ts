/**
 * The 51 saved NASA and CSA pages in docs/sources. The key is the file name without
 * its extension; the address is the first line of the file and the title is the
 * page's own heading. Health content elsewhere in src/content points here by key.
 */
export interface Sourced {
  /** What the app shows. */
  text: string;
  /** Key of SOURCES. */
  source: string;
  /** A passage that appears word for word in docs/sources/<source>.txt. */
  quote: string;
}

export interface SourceDef {
  title: string;
  url: string;
  org: 'NASA' | 'CSA';
}

export const SOURCES: Record<string, SourceDef> = {
  'csa-body-infographic': {
    title: 'How does space affect the human body? – Infographic',
    url: 'https://www.asc-csa.gc.ca/eng/multimedia/search/image/8056',
    org: 'CSA',
  },
  'csa-evarm': {
    title: 'Little transistor records radiation levels',
    url: 'https://www.asc-csa.gc.ca/eng/iss/evarm.asp',
    org: 'CSA',
  },
  'csa-mosfet': {
    title: 'MOSFET radiation monitoring system and Matroshka-R',
    url: 'https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/mosfet.asp',
    org: 'CSA',
  },
  'csa-radi-n2': {
    title: 'Radi-N2: Tracking space radiation and its risks',
    url: 'https://www.asc-csa.gc.ca/eng/sciences/radi-n2.asp',
    org: 'CSA',
  },
  'csa-radiation': {
    title: 'Monitoring radiation for astronaut health',
    url: 'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp',
    org: 'CSA',
  },
  'csa-why-science': {
    title: 'Why do we conduct science experiments in space?',
    url: 'https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp',
    org: 'CSA',
  },
  'hazard-distance': {
    title: 'Hazard: Distance From Earth',
    url: 'https://www.nasa.gov/hrp/hazard-distance-from-earth/',
    org: 'NASA',
  },
  'hazard-environment': {
    title: 'Hazard: Hostile/Closed Environments',
    url: 'https://www.nasa.gov/hrp/hazard-hostile-closed-environments/',
    org: 'NASA',
  },
  'hazard-gravity': {
    title: 'Hazard: Gravity Fields',
    url: 'https://www.nasa.gov/hrp/hazard-gravity-fields/',
    org: 'NASA',
  },
  'hazard-isolation': {
    title: 'Hazard: Isolation and Confinement',
    url: 'https://www.nasa.gov/hrp/hazard-isolation-and-confinement/',
    org: 'NASA',
  },
  'hazard-radiation': {
    title: 'Hazard: Space Radiation',
    url: 'https://www.nasa.gov/hrp/hazard-space-radiation/',
    org: 'NASA',
  },
  'hub-hazards': {
    title: '5 Hazards of Human Spaceflight',
    url: 'https://www.nasa.gov/hrp/hazards/',
    org: 'NASA',
  },
  'hub-research': {
    title: 'Ongoing HRP Research in Space',
    url: 'https://www.nasa.gov/hrp/ongoing-hrp-research/',
    org: 'NASA',
  },
  'hub-risks': {
    title: 'Risks of Human Spaceflight',
    url: 'https://www.nasa.gov/hrp/risks/',
    org: 'NASA',
  },
  'past-altered-immunity': {
    title: 'Scientists Probe How Long-Term Spaceflight Alters Immunity',
    url: 'https://www.nasa.gov/missions/station/scientists-probe-how-long-term-spaceflight-alters-immunity/',
    org: 'NASA',
  },
  'past-food-acceptability': {
    title: 'How Does Spaceflight Change Food Appeal?',
    url: 'https://www.nasa.gov/humans-in-space/how-does-spaceflight-change-food-appeal/',
    org: 'NASA',
  },
  'past-food-physiology': {
    title: 'Enhanced Diet May Help Astronauts Adapt to Spaceflight',
    url: 'https://www.nasa.gov/missions/station/enhanced-diet-may-help-astronauts-adapt-to-spaceflight/',
    org: 'NASA',
  },
  'past-space-gardening': {
    title: 'Can Space Gardening Help Astronauts Cope With Isolation?',
    url: 'https://www.nasa.gov/humans-in-space/can-space-gardening-help-astronauts-cope-with-isolation/',
    org: 'NASA',
  },
  'past-spinal-health': {
    title: 'Astronauts’ Spines Under Scrutiny',
    url: 'https://www.nasa.gov/missions/station/astronauts-spines-under-scrutiny/',
    org: 'NASA',
  },
  'risk-behavioral': {
    title: 'Risk of Behavioral Changes and Psychiatric Disorders',
    url: 'https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/',
    org: 'NASA',
  },
  'risk-bone': {
    title: 'Risk of Spaceflight-Induced Bone Changes',
    url: 'https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/',
    org: 'NASA',
  },
  'risk-cardiovascular': {
    title: 'Risk of Cardiovascular Adaptations',
    url: 'https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/',
    org: 'NASA',
  },
  'risk-decompression': {
    title: 'Risk of Decompression Sickness',
    url: 'https://www.nasa.gov/reference/risk-of-decompression-sickness/',
    org: 'NASA',
  },
  'risk-dynamic-loads': {
    title: 'Risk of Injury from Dynamic Loads',
    url: 'https://www.nasa.gov/reference/risk-of-injury-from-dynamic-loads/',
    org: 'NASA',
  },
  'risk-eva': {
    title: 'Risk of Injury and Compromised Performance from Spacewalks',
    url: 'https://www.nasa.gov/reference/risk-of-injury-and-compromised-performance-from-extravehicular-activity-eva/',
    org: 'NASA',
  },
  'risk-fitness': {
    title: 'Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness',
    url: 'https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/',
    org: 'NASA',
  },
  'risk-hypoxia': {
    title: 'Risk of Hypoxia',
    url: 'https://www.nasa.gov/reference/risk-of-hypoxia/',
    org: 'NASA',
  },
  'risk-immune': {
    title: 'Risk of Altered Immune System Responses',
    url: 'https://www.nasa.gov/reference/risk-of-altered-immune-system-responses/',
    org: 'NASA',
  },
  'risk-microorganism': {
    title: 'Risk of Host-Microorganism Interactions',
    url: 'https://www.nasa.gov/reference/risk-of-host-microorganism-interactions/',
    org: 'NASA',
  },
  'risk-nutrition': {
    title: 'Risk of Inadequate Food and Nutrition',
    url: 'https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/',
    org: 'NASA',
  },
  'risk-radiation-cancer': {
    title: 'Risk of Radiation-Induced Cancers',
    url: 'https://www.nasa.gov/reference/risk-of-radiation-induced-cancers/',
    org: 'NASA',
  },
  'risk-sans': {
    title: 'Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS)',
    url: 'https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/',
    org: 'NASA',
  },
  'risk-sensorimotor': {
    title: 'Risk of Altered Sensorimotor and Vestibular Function',
    url: 'https://www.nasa.gov/reference/risk-of-altered-sensorimotor-and-vestibular-function/',
    org: 'NASA',
  },
  'risk-sleep': {
    title: 'Risk from Inadequate Sleep and Irregular Schedules',
    url: 'https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/',
    org: 'NASA',
  },
  'risk-systems-support': {
    title: 'Risk of Inadequate Systems Operations Support',
    url: 'https://www.nasa.gov/reference/risk-of-inadequate-systems-operations-support/',
    org: 'NASA',
  },
  'risk-teamwork': {
    title: 'Risk of Inadequate Teamwork',
    url: 'https://www.nasa.gov/reference/risk-of-inadequate-teamwork/',
    org: 'NASA',
  },
  'study-archer': {
    title: 'ARCHeR',
    url: 'https://www.nasa.gov/reference/archer/',
    org: 'NASA',
  },
  'study-artemis2-standard-measures': {
    title: 'Artemis II Standard Measures',
    url: 'https://www.nasa.gov/reference/artemis-ii-standard-measures/',
    org: 'NASA',
  },
  'study-b-complex': {
    title: 'B-Complex',
    url: 'https://www.nasa.gov/reference/b-complex/',
    org: 'NASA',
  },
  'study-brain-fluid-pressure': {
    title: 'Brain Fluid Pressure',
    url: 'https://www.nasa.gov/reference/brain-fluid-pressure/',
    org: 'NASA',
  },
  'study-cipher': {
    title: 'CIPHER',
    url: 'https://www.nasa.gov/reference/cipher/',
    org: 'NASA',
  },
  'study-immune-biomarkers': {
    title: 'Immune Biomarkers',
    url: 'https://www.nasa.gov/reference/immune-biomarkers/',
    org: 'NASA',
  },
  'study-manual-piloting': {
    title: 'Simulating Manual Piloting for Moon Landings',
    url: 'https://www.nasa.gov/reference/simulating-manual-piloting-for-moon-landings/',
    org: 'NASA',
  },
  'study-occupant-protection': {
    title: 'Spacecraft Occupant Protection',
    url: 'https://www.nasa.gov/reference/spacecraft-occupant-protection/',
    org: 'NASA',
  },
  'study-omics-archive': {
    title: 'Human Research Program Omics Archive',
    url: 'https://www.nasa.gov/reference/omics-archive/',
    org: 'NASA',
  },
  'study-spinal-fluid-biomarkers': {
    title: 'Spinal Fluid Biomarkers',
    url: 'https://www.nasa.gov/reference/spinal-fluid-biomarkers/',
    org: 'NASA',
  },
  'study-standard-measures': {
    title: 'Standard Measures',
    url: 'https://www.nasa.gov/reference/standard-measures/',
    org: 'NASA',
  },
  'study-tempus-pro': {
    title: 'Tempus Pro',
    url: 'https://www.nasa.gov/reference/tempus-pro/',
    org: 'NASA',
  },
  'study-thigh-cuff': {
    title: 'Thigh Cuff',
    url: 'https://www.nasa.gov/reference/thigh-cuff/',
    org: 'NASA',
  },
  'study-venous-haemostasis': {
    title: 'Venous Haemostasis',
    url: 'https://www.nasa.gov/reference/venous-haemostasis/',
    org: 'NASA',
  },
  'study-zero-t2': {
    title: 'Zero T2',
    url: 'https://www.nasa.gov/reference/zero-t2/',
    org: 'NASA',
  },
};
