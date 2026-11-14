import { formatValue, num } from '../../domain/format';
import './charts.css';

const W = 300;
const H = 64;
const PAD = { left: 4, right: 40, top: 8, bottom: 14 };

/** One indicator across the mission so far, with the personal baseline as a dashed line. */
export function TrendChart(p: {
  label: string;
  unit: string;
  points: { day: number; value: number }[];
  baseline?: number;
  missionDay: number;
}) {
  const points = [...p.points].sort((a, b) => a.day - b.day);
  const last = points.at(-1);
  const hasBaseline = typeof p.baseline === 'number' && Number.isFinite(p.baseline);

  let name = `${p.label}, no data yet`;
  if (last) {
    name = `${p.label}, latest ${formatValue(last.value, p.unit)}`;
    if (hasBaseline) name += `, baseline ${formatValue(p.baseline as number, p.unit)}`;
  }

  if (!last) {
    return (
      <div className="chart chart-empty" role="img" aria-label={name}>
        <span>No data yet</span>
      </div>
    );
  }

  const values = points.map((pt) => pt.value);
  if (hasBaseline) values.push(p.baseline as number);
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (hi - lo < 1e-9) {
    // A flat series still needs a band to sit in.
    lo -= 1;
    hi += 1;
  }
  const margin = (hi - lo) * 0.12;
  lo -= margin;
  hi += margin;

  const lastDay = Math.max(p.missionDay, last.day, 2);
  const x = (day: number) => PAD.left + ((day - 1) / (lastDay - 1)) * (W - PAD.left - PAD.right);
  const y = (value: number) => PAD.top + (1 - (value - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom);
  const at = (pt: { day: number; value: number }) => `${x(pt.day).toFixed(1)},${y(pt.value).toFixed(1)}`;

  return (
    <svg className="chart trend" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={name}>
      {hasBaseline && (
        <line
          data-testid="baseline"
          className="chart-baseline"
          x1={PAD.left}
          x2={W - PAD.right}
          y1={y(p.baseline as number)}
          y2={y(p.baseline as number)}
        />
      )}
      <polyline data-testid="trend-line" className="chart-line" points={points.map(at).join(' ')} />
      <circle className="chart-dot" cx={x(last.day)} cy={y(last.value)} r="2.6" />
      <text className="chart-value" x={x(last.day) + 7} y={y(last.value) + 4}>
        {num(last.value)}
      </text>
      <text className="chart-axis" x={PAD.left} y={H - 2}>
        day 1
      </text>
      <text className="chart-axis" x={W - PAD.right} y={H - 2} textAnchor="end">
        day {lastDay}
      </text>
    </svg>
  );
}
