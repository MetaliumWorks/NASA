import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(path, 'utf8');
const global = read('src/styles/global.css');
const tokens = read('src/styles/tokens.css');

function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return cssFiles(path);
    return path.endsWith('.css') ? [path] : [];
  });
}

describe('reduced motion', () => {
  const block = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/.exec(global)?.[1] ?? '';

  test('turns every animation and transition off', () => {
    expect(block).toMatch(/animation:\s*none\s*!important/);
    expect(block).toMatch(/transition:\s*none\s*!important/);
  });

  test('covers pseudo-elements, which draw the checkbox tick', () => {
    expect(block).toMatch(/\*::before/);
    expect(block).toMatch(/\*::after/);
  });

  test('the app has only the three motions of the mockup', () => {
    const all = cssFiles('src').map(read).join('\n');
    const keyframes = [...all.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]);
    expect(keyframes).toEqual(['throb']); // the slow glow of a part at warning
    const durations = new Set([...all.matchAll(/transition:[^;]*?(\d*\.?\d+)s/g)].map((m) => Number(m[1])));
    // hover on a drawing 0.16 s, tick 0.14 s, fill of a box or choice 0.12 s
    expect([...durations].sort()).toEqual([0.12, 0.14, 0.16]);
    expect(all).toMatch(/animation:\s*throb 2\.6s/);
  });
});

describe('contrast', () => {
  const token = (name: string): [number, number, number] => {
    const m = new RegExp(`--${name}:\\s*oklch\\(([\\d.]+) ([\\d.]+) ([\\d.]+)\\)`).exec(tokens);
    if (!m) throw new Error(`token --${name} not found`);
    return [Number(m[1]), Number(m[2]), Number(m[3])];
  };

  /** Relative luminance of an OKLCH colour (OKLab to linear sRGB, clipped to the gamut). */
  function luminance([L, C, h]: [number, number, number]): number {
    const a = C * Math.cos((h * Math.PI) / 180);
    const b = C * Math.sin((h * Math.PI) / 180);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const clip = (x: number) => Math.min(1, Math.max(0, x));
    const red = clip(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
    const green = clip(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
    const blue = clip(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  }
  const ratio = (x: [number, number, number], y: [number, number, number]) => {
    const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p);
    return (hi + 0.05) / (lo + 0.05);
  };

  test('white on black is 21:1, so the arithmetic is right', () => {
    expect(ratio([1, 0, 0], [0, 0, 0])).toBeCloseTo(21, 1);
  });

  test.each(['text', 'muted', 'bone', 'caution', 'warning'])('--%s is at least 4.5:1 on both surfaces', (name) => {
    expect(ratio(token(name), token('plate'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(token(name), token('bg'))).toBeGreaterThanOrEqual(4.5);
  });

  test('text stays readable on the lightest part of the plate', () => {
    const glow: [number, number, number] = [0.3, 0.032, 236]; // centre of the plate's highlight, before its 75% opacity
    for (const name of ['text', 'muted', 'caution', 'warning']) expect(ratio(token(name), glow), name).toBeGreaterThanOrEqual(4.5);
  });

  test('button text is readable on the button', () => {
    expect(ratio(token('dark'), token('bone'))).toBeGreaterThanOrEqual(4.5);
  });

  test('the edge of a control is at least 3:1 on both surfaces', () => {
    expect(ratio(token('control'), token('plate'))).toBeGreaterThanOrEqual(3);
    expect(ratio(token('control'), token('bg'))).toBeGreaterThanOrEqual(3);
  });
});
