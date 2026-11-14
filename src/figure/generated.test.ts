import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { REGIONS } from '../content/regions';
import { SKELETON_DEFS, SKELETON_MARKUP } from './generated/skeleton';
import { CALLOUTS, HOT_BONES, MARKERS, ORGANS } from './layout';

const DIR = 'src/figure/generated/organs';

test('skeleton has a mirrored right arm and no crossed forearm', () => {
  expect(SKELETON_MARKUP).toContain('id="ArmRightMirrored"');
  expect(SKELETON_MARKUP).toContain('id="HandLeft-m"');
  for (const gone of ['HumerusRight', 'UlnaRight', 'RadiusRight', 'HandRight', 'g1753']) {
    expect(SKELETON_MARKUP).not.toContain(`id="${gone}"`);
  }
});

test('the left arm is still there', () => {
  for (const kept of ['HumerusLeft', 'RadiusLeft', 'UlnaLeft', 'HandLeft']) expect(SKELETON_MARKUP).toContain(`id="${kept}"`);
});

test('editor metadata is stripped', () => {
  expect(SKELETON_MARKUP).not.toMatch(/sodipodi:|inkscape:|xml:space|xmlns/);
  expect(SKELETON_DEFS).not.toMatch(/sodipodi:|inkscape:|xml:space|xmlns/);
});

test('ids are unique, so a bone can be found by its id', () => {
  const ids = [...SKELETON_MARKUP.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  expect(ids.length).toBeGreaterThan(500);
  expect(new Set(ids).size).toBe(ids.length);
});

test('every hot bone id exists in the drawing', () => {
  Object.values(HOT_BONES)
    .flat()
    .forEach((id) => expect(SKELETON_MARKUP, id).toContain(`id="${id}"`));
});

test('gradients referenced by the bones are included', () => {
  expect(SKELETON_DEFS).toMatch(/<(linear|radial)Gradient/);
  const used = new Set([...SKELETON_MARKUP.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]));
  expect(used.size).toBeGreaterThan(0);
  used.forEach((id) => expect(SKELETON_DEFS, id).toContain(`id="${id}"`));
});

test('every organ file is an image of the kind its name says', () => {
  ORGANS.forEach((o) => {
    const bytes = readFileSync(`${DIR}/${o.file}`);
    if (o.file.endsWith('.png')) expect(bytes.subarray(1, 4).toString(), o.file).toBe('PNG');
    else if (o.file.endsWith('.gif')) expect(bytes.subarray(0, 3).toString(), o.file).toBe('GIF');
    else throw new Error(`unexpected organ file type: ${o.file}`);
  });
});

test('blood & immunity and muscles have drawings of their own', () => {
  expect(ORGANS.filter((o) => o.region === 'immune').map((o) => o.file)).toEqual(['lymph-neck.gif', 'lymph-axilla.gif', 'lymph-axilla.gif', 'spleen.gif']);
  expect(ORGANS.filter((o) => o.region === 'muscles').map((o) => o.file)).toEqual(['thigh.png', 'thigh.png', 'leg.png', 'leg.png']);
});

test('a drawing used on both sides of the body is mirrored on one of them', () => {
  for (const file of ['thigh.png', 'leg.png', 'lymph-axilla.gif']) {
    const pair = ORGANS.filter((o) => o.file === file);
    expect(pair, file).toHaveLength(2);
    expect(pair.filter((o) => o.flip), file).toHaveLength(1);
    // The pair sits symmetrically about the midline of the skeleton (x = 203).
    const centres = pair.map((o) => o.x + o.w / 2);
    expect((centres[0] + centres[1]) / 2, file).toBeCloseTo(203, 0);
  }
});

test('no organ file is left over or missing', () => {
  expect(readdirSync(DIR).sort()).toEqual([...new Set(ORGANS.map((o) => o.file))].sort());
  ORGANS.forEach((o) => expect(existsSync(`${DIR}/${o.file}`), o.file).toBe(true));
});

test('organs, markers and callouts belong to real regions', () => {
  ORGANS.forEach((o) => expect(REGIONS[o.region], o.file).toBeDefined());
  [...Object.keys(HOT_BONES), ...Object.keys(MARKERS), ...Object.keys(CALLOUTS)].forEach((r) =>
    expect(REGIONS[r as keyof typeof REGIONS], r).toBeDefined(),
  );
});

test('every region except radiation has a callout slot', () => {
  const withSlot = Object.keys(CALLOUTS).sort();
  expect(withSlot).toEqual(Object.keys(REGIONS).filter((r) => r !== 'radiation').sort());
});

test('callout labels in the same column are at least 55 units apart', () => {
  for (const side of ['left', 'right'] as const) {
    const ys = Object.values(CALLOUTS)
      .filter((c) => c.side === side)
      .map((c) => c.to[1])
      .sort((a, b) => a - b);
    for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1], `${side} ${ys[i - 1]} → ${ys[i]}`).toBeGreaterThanOrEqual(55);
  }
});
