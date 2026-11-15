import { useLayoutEffect, useMemo, useRef, type KeyboardEvent, type MouseEvent } from 'react';
import { REGION_ORDER, REGIONS } from '../content/regions';
import { worst } from '../domain/status';
import type { RegionId, Status } from '../domain/types';
import './figure.css';
import { SKELETON_DEFS, SKELETON_MARKUP } from './generated/skeleton';
import { CALLOUTS, HOT_BONES, MARKERS, ORGANS, VIEWBOX, type Callout } from './layout';

export interface BodyFigureProps {
  statuses: Record<RegionId, Status>;
  selected: RegionId | null;
  showOrgans: boolean;
  onSelect(region: RegionId): void;
}

// Bundled with the app: file name -> address.
const ORGAN_URLS = import.meta.glob<string>('./generated/organs/*', { eager: true, query: '?url', import: 'default' });
const organUrl = (file: string) => ORGAN_URLS[`./generated/organs/${file}`];

/**
 * Film-tone filters, carried over from docs/mockups/lightbox-v4.tpl.html: xr re-tones
 * bone, xc is bone at caution, xo an organ, xw an organ at warning, skin grows the
 * skeleton into a soft body outline. xrw (bone at warning) and xoc (organ at caution)
 * complete the set with the same recipe.
 */
const GREY = '<feColorMatrix type="matrix" values="0.30 0.59 0.11 0 0  0.30 0.59 0.11 0 0  0.30 0.59 0.11 0 0  0 0 0 1 0"/>';
const tone = (id: string, r: string, g: string, b: string, box = '') =>
  `<filter id="${id}" color-interpolation-filters="sRGB"${box}>${GREY}<feComponentTransfer>` +
  `<feFuncR type="table" tableValues="${r}"/><feFuncG type="table" tableValues="${g}"/><feFuncB type="table" tableValues="${b}"/>` +
  `</feComponentTransfer></filter>`;
const BONE_BOX = ' x="-5%" y="-5%" width="110%" height="110%"';
const FILTERS =
  tone('xr', '0.05 0.14 0.30 0.58 0.93', '0.09 0.20 0.40 0.70 0.97', '0.15 0.29 0.52 0.84 1.00', BONE_BOX) +
  tone('xc', '0.20 0.48 0.86 1.00 1.00', '0.13 0.34 0.66 0.84 0.93', '0.03 0.06 0.12 0.22 0.42', BONE_BOX) +
  tone('xrw', '0.30 0.62 0.92 1.00 1.00', '0.05 0.13 0.28 0.50 0.82', '0.04 0.09 0.18 0.34 0.66', BONE_BOX) +
  tone('xo', '0.10 0.30 0.56 0.84', '0.16 0.42 0.70 0.92', '0.28 0.58 0.86 1.00') +
  tone('xoc', '0.48 0.86 1.00 1.00', '0.34 0.66 0.84 0.93', '0.06 0.12 0.22 0.42') +
  tone('xw', '0.45 0.86 1.00 1.00', '0.08 0.24 0.46 0.80', '0.05 0.14 0.30 0.64') +
  '<filter id="skin" x="-20" y="-10" width="476" height="862" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">' +
  '<feMorphology in="SourceAlpha" operator="dilate" radius="6"/><feGaussianBlur stdDeviation="7"/>' +
  '<feComponentTransfer result="a"><feFuncA type="linear" slope="16" intercept="-7"/></feComponentTransfer>' +
  '<feMorphology in="a" operator="erode" radius="3"/><feGaussianBlur stdDeviation="3" result="inner"/>' +
  '<feComposite in="a" in2="inner" operator="out" result="rim"/>' +
  '<feFlood flood-color="rgb(96,128,160)" flood-opacity=".5"/><feComposite in2="a" operator="in" result="base"/>' +
  '<feFlood flood-color="rgb(190,214,236)" flood-opacity=".7"/><feComposite in2="rim" operator="in" result="edge"/>' +
  '<feMerge><feMergeNode in="base"/><feMergeNode in="edge"/></feMerge></filter>';
const DEFS = SKELETON_DEFS + FILTERS;

/** The body outline is not a drawing of its own: the skeleton plus these muscle volumes, merged by the skin filter. */
const BODY_VOLUME =
  '<use href="#layer3"/>' +
  '<ellipse cx="203" cy="66" rx="38" ry="50" stroke="none"/>' +
  '<line x1="203" y1="112" x2="203" y2="150" stroke-width="30"/>' +
  '<path d="M186 124 L220 124 L286 162 L120 162 Z" stroke-width="10"/>' +
  '<line x1="281" y1="178" x2="320" y2="306" stroke-width="34"/><line x1="125" y1="178" x2="86" y2="306" stroke-width="34"/>' +
  '<line x1="320" y1="306" x2="350" y2="406" stroke-width="22"/><line x1="86" y1="306" x2="56" y2="406" stroke-width="22"/>' +
  '<ellipse cx="203" cy="216" rx="66" ry="76" stroke="none"/>' +
  '<ellipse cx="203" cy="302" rx="57" ry="60" stroke="none"/>' +
  '<ellipse cx="203" cy="378" rx="72" ry="46" stroke="none"/>' +
  '<path d="M206 404 L274 372 L252 590 L210 590 Z" stroke-width="8"/><path d="M200 404 L132 372 L154 590 L196 590 Z" stroke-width="8"/>' +
  '<path d="M210 590 L252 590 L240 760 L216 760 Z" stroke-width="6"/><path d="M196 590 L154 590 L166 760 L190 760 Z" stroke-width="6"/>' +
  '<ellipse cx="234" cy="654" rx="22" ry="56" stroke="none"/><ellipse cx="172" cy="654" rx="22" ry="56" stroke="none"/>';

const ALL_HOT_IDS = [...new Set(Object.values(HOT_BONES).flat())];
const SPINE_IDS = new Set(HOT_BONES.spine);

/** The status a bone shows: the worst of the regions that light it. */
function boneStatus(id: string, statuses: Record<RegionId, Status>): Status {
  let status: Status = 'nominal';
  for (const region of REGION_ORDER) {
    if (HOT_BONES[region]?.includes(id)) status = worst(status, statuses[region]);
  }
  return status;
}

const [VIEW_X, , VIEW_WIDTH] = VIEWBOX.split(' ').map(Number);
/** Average advance of one character of the 24-unit label face, in drawing units. */
const LABEL_CHAR = 12.6;
const LABEL_LINE = 26;

/** A name too long for the room beside its slot is broken after its ampersand. */
export function calloutLines(name: string, slot: Callout): string[] {
  const x = slot.to[0] + (slot.side === 'right' ? 8 : -8);
  const room = slot.side === 'right' ? VIEW_X + VIEW_WIDTH - x : x - VIEW_X;
  if (name.length * LABEL_CHAR <= room || !name.includes(' & ')) return [name];
  const [first, rest] = name.split(' & ');
  return [`${first} &`, rest];
}

/** One sentence for the whole figure, heaviest status first. */
export function figureLabel(statuses: Record<RegionId, Status>): string {
  const named = (['warning', 'caution'] as const).flatMap((status) =>
    REGION_ORDER.filter((r) => statuses[r] === status).map((r) => `${REGIONS[r].name}: ${status}.`),
  );
  const nominal = REGION_ORDER.filter((r) => statuses[r] === 'nominal').length;
  return ['Body scan.', ...named, `${nominal} ${nominal === 1 ? 'system' : 'systems'} nominal.`].join(' ');
}

export function BodyFigure(props: BodyFigureProps) {
  const { statuses, selected, showOrgans, onSelect } = props;
  const skeleton = useRef<SVGGElement>(null);

  // The skeleton is injected as markup, so the bones that take a status colour are marked by id.
  useLayoutEffect(() => {
    const root = skeleton.current;
    if (!root) return;
    for (const id of ALL_HOT_IDS) {
      const bone = root.querySelector(`[id="${id}"]`);
      if (!bone) continue;
      const status = boneStatus(id, statuses);
      bone.classList.remove('hot-caution', 'hot-warning');
      if (status !== 'nominal') bone.classList.add(`hot-${status}`);
    }
  }, [statuses]);

  const defs = useMemo(() => ({ __html: DEFS }), []);
  const bodyVolume = useMemo(() => ({ __html: BODY_VOLUME }), []);
  const skeletonMarkup = useMemo(() => ({ __html: SKELETON_MARKUP }), []);

  // A system is drawn when organs are on, when it is flagged, or while it is selected.
  const visible = (region: RegionId) => showOrgans || statuses[region] !== 'nominal' || selected === region;
  const shown = ORGANS.filter((o) => visible(o.region));
  // Paint order inside the organ layer: quiet organ art, then the flagged bones again, then
  // flagged organs. A flagged bone must stay readable under muscle or bowel art.
  const quietOrgans = shown.filter((o) => statuses[o.region] === 'nominal');
  const flaggedOrgans = shown.filter((o) => statuses[o.region] !== 'nominal');
  // Flagged bones keep their status colour; the bones of a selected, nominal system are outlined.
  const selectedBones = new Set(selected ? (HOT_BONES[selected] ?? []) : []);
  const hotBones = ALL_HOT_IDS.map((id) => {
    const status = boneStatus(id, statuses);
    return { id, tone: status !== 'nominal' ? status : selectedBones.has(id) ? 'selected' : null };
  }).filter((b) => b.tone !== null);

  const onBoneClick = (e: MouseEvent<SVGGElement>) => {
    const piece = (e.target as Element).closest('#layer3 > *');
    if (!piece) return;
    onSelect(SPINE_IDS.has(piece.id) ? 'spine' : 'bones');
  };

  /** Button behaviour for a drawing; the first drawing of a region is the one in the tab order. */
  const button = (region: RegionId, first: boolean) => ({
    'data-region': region,
    'data-status': statuses[region],
    'data-selected': selected === region ? 'true' : undefined,
    onClick: () => onSelect(region),
    ...(first
      ? {
          role: 'button',
          tabIndex: 0,
          'aria-label': `${REGIONS[region].name}: ${statuses[region]}`,
          'aria-pressed': selected === region,
          onKeyDown: (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(region);
            }
          },
        }
      : { 'aria-hidden': true }),
  });

  const seen = new Set<RegionId>();
  const firstOf = (region: RegionId) => {
    if (seen.has(region)) return false;
    seen.add(region);
    return true;
  };

  const organImage = (o: (typeof ORGANS)[number]) => (
    <image
      key={`${o.file}-${o.x}`}
      className="organ"
      href={organUrl(o.file)}
      // A mirrored drawing is placed at its mirror position and flipped back about the y axis.
      x={o.flip ? -(o.x + o.w) : o.x}
      transform={o.flip ? 'scale(-1 1)' : undefined}
      y={o.y}
      width={o.w}
      height={o.h}
      style={o.clipBottom ? { clipPath: `inset(0 0 ${o.clipBottom * 100}% 0)` } : undefined}
      {...button(o.region, firstOf(o.region))}
    />
  );

  const labelled = REGION_ORDER.filter((r) => CALLOUTS[r] && (statuses[r] !== 'nominal' || selected === r));

  return (
    <div className="figure">
      {/* The drawing: one image with one description. */}
      <svg className="figure-svg" viewBox={VIEWBOX} role="img" aria-label={figureLabel(statuses)}>
        <defs dangerouslySetInnerHTML={defs} />
        <ellipse className="figure-ring" cx="203" cy="420" rx="214" ry="424" />
        <g id="body" fill="#000" stroke="#000" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={bodyVolume} />
        <g id="skel" ref={skeleton} onClick={onBoneClick} dangerouslySetInnerHTML={skeletonMarkup} />
      </svg>

      {/* What can be selected, in the same coordinates, kept outside the image so it stays reachable. */}
      <svg className="figure-svg figure-controls" viewBox={VIEWBOX} role="group" aria-label="Body systems on the figure">
        <ellipse className="figure-ring-hit" cx="203" cy="420" rx="214" ry="424" {...button('radiation', true)} />

        <g data-testid="organs">
          {quietOrgans.map(organImage)}
          {/* The same bones, drawn once more by reference. A copy does not take the film tone of
              the original (the rules that give it are written for the skeleton's own tree), so
              each copy carries its status and is toned in figure.css. */}
          <g data-testid="hot-bones" className="hot-bones" aria-hidden="true">
            {hotBones.map((b) => (
              <use key={b.id} href={`#${b.id}`} className={`hot-${b.tone}`} />
            ))}
          </g>
          {flaggedOrgans.map(organImage)}
        </g>

        <g data-testid="markers">
          {(Object.keys(MARKERS) as RegionId[])
            .filter(visible)
            .flatMap((region) =>
              MARKERS[region]!.map((m, i) => (
                <circle key={`${region}-${i}`} className="marker" cx={m.cx} cy={m.cy} r={m.r} {...button(region, firstOf(region))} />
              )),
            )}
        </g>

        <g className="callouts" aria-hidden="true">
          {labelled.map((region) => {
            const c = CALLOUTS[region]!;
            const right = c.side === 'right';
            const x = c.to[0] + (right ? 8 : -8);
            const lines = calloutLines(REGIONS[region].name, c);
            return (
              <g key={region} className={`callout callout-${statuses[region]}`}>
                <line className="callout-under" x1={c.from[0]} y1={c.from[1]} x2={c.to[0]} y2={c.to[1]} />
                <line className="callout-line" x1={c.from[0]} y1={c.from[1]} x2={c.to[0]} y2={c.to[1]} />
                {lines.map((line, i) => (
                  <text key={line} className="callout-name" x={x} y={c.to[1] - 5 + i * LABEL_LINE} textAnchor={right ? 'start' : 'end'}>
                    {line}
                  </text>
                ))}
                <text
                  className="callout-status"
                  x={x}
                  y={c.to[1] + 20 + (lines.length - 1) * LABEL_LINE}
                  textAnchor={right ? 'start' : 'end'}
                >
                  {statuses[region]}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="figure-side figure-side-r" aria-hidden="true">
        R
      </div>
      <div className="figure-side figure-side-l" aria-hidden="true">
        L
      </div>
    </div>
  );
}
