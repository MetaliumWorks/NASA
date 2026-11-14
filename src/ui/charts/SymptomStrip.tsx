import './charts.css';

/**
 * One cell per day, oldest first; a day on which the symptom was reported is filled.
 * Days before the mission began are shown fainter.
 */
export function SymptomStrip(p: { label: string; reportedDays: number[]; endDay: number; span?: number }) {
  const span = p.span ?? 30;
  const reported = new Set(p.reportedDays);
  const days = Array.from({ length: span }, (_, i) => p.endDay - span + 1 + i);
  const count = days.filter((d) => reported.has(d)).length;

  return (
    <div className="chart strip" role="img" aria-label={`${p.label}, reported on ${count} of ${span} days`}>
      {days.map((day) => (
        <span
          key={day}
          data-testid="cell"
          data-on={reported.has(day) ? 'true' : 'false'}
          data-before={day < 1 ? 'true' : undefined}
          className="strip-cell"
        />
      ))}
    </div>
  );
}
