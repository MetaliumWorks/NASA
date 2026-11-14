import type { ReactNode } from 'react';

/** A labelled tick box in the film style. The whole label is the click target. */
export function Checkbox(p: { checked: boolean; onChange(v: boolean): void; children: ReactNode; disabled?: boolean }) {
  return (
    <label className="check">
      <input type="checkbox" checked={p.checked} disabled={p.disabled} onChange={(e) => p.onChange(e.target.checked)} />
      <span>{p.children}</span>
    </label>
  );
}
