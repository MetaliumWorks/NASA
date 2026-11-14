import { num } from '../../domain/format';
import './charts.css';

const BAR = 17;
const GAP = 5;
const TOP = 4;
const FULL = 40;

/** Seven days as bars, oldest first, against a per-day target drawn as a dashed line. */
export function WeekBars(p: { label: string; values: (number | null)[]; target: number; unit: string }) {
  const recorded = p.values.filter((v): v is number => v !== null);
  const total = recorded.reduce((a, b) => a + b, 0);
  const span = recorded.length === p.values.length ? `${p.values.length} days` : `${recorded.length} recorded days`;
  const name = `${p.label}, ${num(total)} ${p.unit} over ${span}, target ${num(p.target)} ${p.unit} per day`;

  if (recorded.length === 0) {
    return (
      <div className="chart chart-empty" role="img" aria-label={`${p.label}, no data yet`}>
        <span>No data yet</span>
      </div>
    );
  }

  // The target line sits at full height; a day above target is allowed to rise past it.
  const scale = Math.max(p.target, ...recorded);
  const targetY = TOP + FULL * (1 - p.target / scale);
  const width = p.values.length * (BAR + GAP) - GAP;
  const height = TOP + FULL;

  return (
    <svg className="chart bars" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={name}>
      {p.values.map((v, i) => {
        const h = v === null ? 0 : (v / scale) * FULL;
        return (
          <g key={i}>
            {/* A day with nothing done still leaves a mark on the floor. */}
            <rect className="chart-floor" x={i * (BAR + GAP)} y={height - 2} width={BAR} height="2" opacity={v === null ? 0.25 : 1} />
            <rect
              data-testid="bar"
              data-empty={v === null ? 'true' : undefined}
              className="chart-bar"
              x={i * (BAR + GAP)}
              y={height - h}
              width={BAR}
              height={h}
              rx="2"
            />
          </g>
        );
      })}
      <line className="chart-baseline" x1="0" x2={width} y1={targetY} y2={targetY} />
    </svg>
  );
}
