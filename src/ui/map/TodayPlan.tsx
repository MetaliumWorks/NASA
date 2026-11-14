import { findRecommendation, REGION_ORDER, REGIONS } from '../../content/regions';
import { useApp } from '../../state/store';
import { Checkbox } from '../Checkbox';

/** The words of a plan item. A ground-report item says which system it is about. */
export function planText(id: string): string {
  const recommendation = findRecommendation(id);
  if (!recommendation) return id;
  if (recommendation.kind === 'groundReport') {
    const region = REGION_ORDER.find((r) => id === `groundReport-${r}`);
    if (region) return `Add ${REGIONS[region].name} to the next ground report`;
  }
  return recommendation.text;
}

/** What the crew member decided to do today, as a list to tick off. Each day starts empty. */
export function TodayPlan() {
  const { state, dispatch } = useApp();
  const day = state.profile.missionDay;
  const items = state.profile.plan.filter((i) => i.day === day);
  const done = items.filter((i) => i.done).length;

  return (
    <section className="sec" aria-labelledby="plan-title">
      <h3 id="plan-title">Today’s plan</h3>
      <div>
        {items.length === 0 ? (
          <p className="hint">Nothing planned yet. Open a flagged system and tick what you will do.</p>
        ) : (
          <>
            <ul className="todo">
              {items.map((item) => (
                <li key={item.recommendationId}>
                  <Checkbox checked={item.done} onChange={() => dispatch({ type: 'planToggle', id: item.recommendationId })}>
                    {planText(item.recommendationId)}
                  </Checkbox>
                </li>
              ))}
            </ul>
            <p className="plan-count mono">
              {done} of {items.length} done
            </p>
          </>
        )}
      </div>
    </section>
  );
}
