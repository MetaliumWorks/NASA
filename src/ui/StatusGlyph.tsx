import type { Status } from '../domain/types';

export const STATUS_WORD: Record<Status, string> = { nominal: 'Nominal', caution: 'Caution', warning: 'Warning' };

/**
 * Status as a shape: ring for nominal, triangle for caution, square for warning. The
 * word is always there too, visible with `label` and for screen readers without it,
 * so a status is never told by colour alone.
 */
export function StatusGlyph(props: { status: Status; label?: boolean; size?: number }) {
  const { status, label = false, size = 12 } = props;
  return (
    <span className={`glyph glyph-${status}`}>
      <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        {status === 'nominal' && <circle cx="6" cy="6" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.5" />}
        {status === 'caution' && <path d="M6 1 L11.5 11 L.5 11 Z" fill="currentColor" />}
        {status === 'warning' && <rect x="1" y="1" width="10" height="10" rx="1.5" fill="currentColor" />}
      </svg>
      <span className={label ? 'glyph-word' : 'visually-hidden'}>{STATUS_WORD[status]}</span>
    </span>
  );
}
