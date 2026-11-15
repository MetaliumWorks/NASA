import { REGION_ORDER, REGIONS } from '../../content/regions';
import type { RegionId, Status } from '../../domain/types';
import { useApp } from '../../state/store';
import { StatusGlyph } from '../StatusGlyph';

/** Every system with its status. The way to any region by keyboard. */
export function SystemIndex(p: { statuses: Record<RegionId, Status> }) {
  const { state, dispatch } = useApp();
  return (
    <nav className="index" aria-label="Body systems">
      {REGION_ORDER.map((region) => {
        const selected = state.selectedRegion === region;
        return (
          <button
            key={region}
            type="button"
            className="index-item"
            data-status={p.statuses[region]}
            aria-pressed={selected}
            onClick={() => dispatch({ type: 'select', region: selected ? null : region })}
          >
            <span>{REGIONS[region].name}</span> <StatusGlyph status={p.statuses[region]} size={11} />
          </button>
        );
      })}
    </nav>
  );
}
