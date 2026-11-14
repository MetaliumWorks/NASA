/** One decimal at most, without a trailing ".0". */
export function num(v: number): string {
  return Number(v.toFixed(1)).toString();
}

/** A value with its unit, worded for the kind of scale: "2.5 of 5", "level 6", "1.1 L". */
export function formatValue(v: number, unit: string): string {
  if (unit === '1–5') return `${num(v)} of 5`;
  if (unit === 'level') return `level ${num(v)}`;
  return `${num(v)} ${unit}`;
}

/** A signed difference: "+1.3 L", "−0.4 h", "±0 bpm". Uses a real minus sign. */
export function formatDelta(diff: number, unit: string): string {
  const shown = num(Math.abs(diff));
  const sign = shown === '0' ? '±' : diff > 0 ? '+' : '−';
  if (unit === '1–5' || unit === 'level') return `${sign}${shown}`;
  return `${sign}${shown} ${unit}`;
}
