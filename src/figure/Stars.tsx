import { useEffect, useRef } from 'react';
import { seededRandom } from '../domain/random';

const SEED = 20261114;
/** 190 stars on the 1160 x 660 mockup stage. */
const DENSITY = 190 / (1160 * 660);
// Mostly white-blue; a few warm, orange or blue ones.
const TINTS: [number, number, number][] = [
  [226, 236, 255],
  [226, 236, 255],
  [226, 236, 255],
  [226, 236, 255],
  [226, 236, 255],
  [226, 236, 255],
  [255, 244, 214],
  [255, 244, 214],
  [255, 214, 170],
  [170, 200, 255],
  [255, 196, 184],
];

function draw(ctx: CanvasRenderingContext2D, width: number, height: number, dimFromX: number) {
  const random = seededRandom(SEED);
  const count = Math.round(width * height * DENSITY);
  for (let i = 0; i < count; i++) {
    const px = random() * width;
    const py = random() * height;
    const big = Math.pow(random(), 3);
    const r = 0.45 + big * 1.25;
    let alpha = 0.22 + random() * 0.55 + big * 0.2;
    const [red, green, blue] = TINTS[Math.floor(random() * TINTS.length)];
    const behindText = px > dimFromX;
    if (behindText) alpha *= 0.32;
    if (big > 0.55 && !behindText) {
      const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 5);
      glow.addColorStop(0, `rgba(${red},${green},${blue},0.22)`);
      glow.addColorStop(1, `rgba(${red},${green},${blue},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, r * 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = `rgba(${red},${green},${blue},${Math.min(alpha, 0.95).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * A still, sparse star field, the same on every load. Stars right of `dimFromX` sit
 * behind text and are drawn fainter.
 */
export function Stars(props: { width: number; height: number; dimFromX: number }) {
  const { width, height, dimFromX } = props;
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || width <= 0 || height <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    draw(ctx, width, height, dimFromX);
  }, [width, height, dimFromX]);

  return <canvas ref={ref} className="stars" aria-hidden="true" style={{ width, height }} />;
}
