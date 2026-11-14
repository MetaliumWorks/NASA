import type { RegionId } from '../domain/types';

/** Coordinate space of the skeleton drawing, widened for the callouts and the radiation ring. */
export const VIEWBOX = '-161.9 -28 729.7 926.2';

export interface OrganArt {
  /** File in src/figure/generated/organs, written by scripts/prepare-figure.mjs. */
  file: string;
  region: RegionId;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Fraction of the image hidden from the bottom (the kidney drawing continues below the kidneys). */
  clipBottom?: number;
  /** Mirrored left to right: the same drawing serves the other side of the body. */
  flip?: boolean;
}

/** Placement of each organ drawing in skeleton coordinates. Order is paint order. */
export const ORGANS: OrganArt[] = [
  // Muscles first, so the organs of the trunk are drawn over the tops of the thighs.
  { file: 'thigh.png', region: 'muscles', x: 128, y: 372, w: 72, h: 220 },
  { file: 'thigh.png', region: 'muscles', x: 206, y: 372, w: 72, h: 220, flip: true },
  { file: 'leg.png', region: 'muscles', x: 150, y: 590, w: 46, h: 175 },
  { file: 'leg.png', region: 'muscles', x: 210, y: 590, w: 46, h: 175, flip: true },
  { file: 'brain.gif', region: 'brain', x: 170, y: 24, w: 66, h: 58 },
  { file: 'lymph-neck.gif', region: 'immune', x: 170.4, y: 104.4, w: 69.1, h: 51.2 },
  { file: 'lungs.png', region: 'lungs', x: 144, y: 143, w: 119, h: 107 },
  { file: 'heart.png', region: 'heart', x: 177, y: 142, w: 59, h: 94 },
  { file: 'lymph-axilla.gif', region: 'immune', x: 106.6, y: 183.5, w: 56.5, h: 73.4 },
  { file: 'lymph-axilla.gif', region: 'immune', x: 242.9, y: 183.5, w: 56.5, h: 73.4, flip: true },
  { file: 'liver.png', region: 'digestion', x: 147.5, y: 235, w: 100, h: 70.5 },
  { file: 'stomach.png', region: 'digestion', x: 167, y: 233, w: 100, h: 83 },
  { file: 'spleen.gif', region: 'immune', x: 219.7, y: 241.9, w: 42.3, h: 45.1 },
  { file: 'intestines.gif', region: 'digestion', x: 140, y: 290, w: 126, h: 114 },
  { file: 'kidneys.png', region: 'kidneys', x: 150.6, y: 265.5, w: 108.4, h: 155, clipBottom: 0.61 },
];

/** Bones that take the status colour of a region. Ids are those of the skeleton drawing. */
export const HOT_BONES: Partial<Record<RegionId, string[]>> = {
  bones: [
    'LumbarVertebrae',
    'ThoracicVertebrae',
    'Sacrum',
    'Coccyx',
    'PelvicGirdle',
    'FemurLeft',
    'g3760',
    'path481',
    'path499',
    'g447',
  ],
  spine: ['CervicalVertebrae', 'ThoracicVertebrae', 'LumbarVertebrae', 'Sacrum', 'Coccyx'],
};

/** Regions with no organ in the drawing set are shown as simple lit markers. */
export const MARKERS: Partial<Record<RegionId, { cx: number; cy: number; r: number }[]>> = {
  eyes: [
    { cx: 189, cy: 74, r: 6.5 },
    { cx: 217, cy: 74, r: 6.5 },
  ],
  innerEar: [
    { cx: 173, cy: 84, r: 4 },
    { cx: 233, cy: 84, r: 4 },
  ],
};

export interface Callout {
  from: [number, number];
  to: [number, number];
  side: 'left' | 'right';
}

/** Label slot of each region: a leader line from the body to the name and status. */
export const CALLOUTS: Partial<Record<RegionId, Callout>> = {
  brain: { from: [203, 48], to: [262, 44], side: 'right' },
  innerEar: { from: [233, 84], to: [262, 100], side: 'right' },
  heart: { from: [215, 225], to: [350, 215], side: 'right' },
  kidneys: { from: [252, 289], to: [350, 289], side: 'right' },
  digestion: { from: [240, 340], to: [350, 350], side: 'right' },
  muscles: { from: [250, 480], to: [300, 540], side: 'right' },
  eyes: { from: [189, 74], to: [144, 74], side: 'left' },
  immune: { from: [180, 130], to: [140, 130], side: 'left' },
  lungs: { from: [160, 215], to: [62, 215], side: 'left' },
  spine: { from: [195, 300], to: [50, 300], side: 'left' },
  bones: { from: [150, 540], to: [106, 540], side: 'left' },
};
