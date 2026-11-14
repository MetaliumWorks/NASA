import { useEffect, useMemo, useRef, useState } from 'react';
import { MISSIONS } from '../../content/missions';
import { REGION_ORDER } from '../../content/regions';
import { assessAll } from '../../domain/assess';
import type { RegionId, Status } from '../../domain/types';
import { BodyFigure } from '../../figure/BodyFigure';
import { Stars } from '../../figure/Stars';
import { useApp } from '../../state/store';
import { DaySummary } from './DaySummary';
import './map.css';
import { RegionPanel } from './RegionPanel';
import { SystemIndex } from './SystemIndex';

/** Home: the scan figure on the left, the selected region (or today's summary) on the right. */
export function MapScreen() {
  const { state, dispatch } = useApp();
  const { profile, selectedRegion, showOrgans } = state;
  const day = profile.missionDay;

  const all = useMemo(() => assessAll(profile, day), [profile, day]);
  const statuses = useMemo(
    () => Object.fromEntries(REGION_ORDER.map((r) => [r, all[r].status])) as Record<RegionId, Status>,
    [all],
  );
  const flaggedCount = REGION_ORDER.filter((r) => statuses[r] !== 'nominal').length;

  // The star field covers the whole screen and is redrawn only when the size changes.
  const stage = useRef<HTMLDivElement>(null);
  const plate = useRef<HTMLElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0, plate: 0 });
  useEffect(() => {
    const el = stage.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight, plate: plate.current?.clientWidth ?? el.clientWidth });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, []);

  // A newly opened region starts at its top, wherever the last one was scrolled to.
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 0;
  }, [selectedRegion]);

  let baseline = 'No baseline yet';
  if (profile.simulated) baseline = 'Baseline L-30';
  else if (Object.keys(profile.baseline).length > 0) baseline = 'Baseline set before flight';
  const radiationLogged = profile.entries.some((e) => e.values.radiationDose !== undefined);

  return (
    <div className="map" ref={stage}>
      {size.width > 0 && <Stars width={size.width} height={size.height} dimFromX={size.plate} />}

      <section className="plate" ref={plate} aria-label="Body map">
        <BodyFigure
          statuses={statuses}
          selected={selectedRegion}
          showOrgans={showOrgans}
          onSelect={(region) => dispatch({ type: 'select', region })}
        />
        <label className="toggle">
          <input type="checkbox" checked={showOrgans} onChange={() => dispatch({ type: 'toggleOrgans' })} />
          Show organs
        </label>
        <div className="ov ov-bl mono">
          {profile.name}
          {profile.simulated ? ' · simulated' : ''}
          <br />
          Flight day {String(day).padStart(3, '0')} / {MISSIONS[profile.mission].days}
          <br />
          {baseline}
        </div>
        <div className="ov ov-br mono">
          {REGION_ORDER.length} systems
          <br />
          <span>{flaggedCount} flagged</span>
          <br />
          {radiationLogged ? 'Radiation logged' : 'Radiation not logged'}
        </div>
      </section>

      <div className="read">
        <div className="read-scroll" ref={scroller}>
          {selectedRegion ? (
            <RegionPanel key={`${selectedRegion}-${day}`} region={selectedRegion} assessment={all[selectedRegion]} />
          ) : (
            <DaySummary all={all} />
          )}
        </div>
        <SystemIndex statuses={statuses} />
      </div>
    </div>
  );
}
