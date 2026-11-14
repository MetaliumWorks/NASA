import { INDICATORS } from '../content/indicators';
import type { IndicatorId } from './types';

/**
 * A typed number. A comma is accepted as the decimal mark ("36,8"), since that is what
 * a Turkish keyboard gives. Anything that is not one plain number is null.
 */
export function parseNumber(text: string): number | null {
  const t = text.trim().replace('−', '-');
  if (!/^[+-]?(\d+([.,]\d*)?|[.,]\d+)$/.test(t)) return null;
  const value = Number(t.replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

/** A typed value for one indicator: the number, or what to tell the person. */
export function validateValue(id: IndicatorId, text: string): { value: number } | { error: string } {
  const value = parseNumber(text);
  if (value === null) return { error: 'Enter a number' };
  const { min, max } = INDICATORS[id];
  if (value < min || value > max) return { error: `Enter a value between ${min} and ${max}` };
  return { value };
}
