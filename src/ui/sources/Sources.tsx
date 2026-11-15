import { CONDITIONS } from '../../content/conditions';
import { INDICATORS } from '../../content/indicators';
import { SYMPTOMS } from '../../content/symptoms';
import { SOURCES } from '../../content/sources';
import { CRITICAL_FACTOR, criticalLimit, EXERCISE_TARGET_PER_DAY, LONG_TERM, THRESHOLDS, type ThresholdRule } from '../../content/thresholds';
import { DEMO_DAY } from '../../domain/demo';
import { formatValue, num } from '../../domain/format';
import { ALL_INDICATORS, type IndicatorId } from '../../domain/types';
import { useApp } from '../../state/store';
import { SourceLink } from '../SourceLink';
import './sources.css';

const percent = (fraction: number) => `${num(fraction * 100)}%`;

/** One threshold rule in words: what is compared, and where caution and warning begin. */
export function describeRule(id: IndicatorId): { compared: string; caution: string; warning: string } {
  const rule: ThresholdRule = THRESHOLDS[id];
  const unit = INDICATORS[id].unit;
  switch (rule.kind) {
    case 'percentAvg3':
      return {
        compared: '3-day average',
        caution: `±${percent(rule.caution)} from baseline`,
        warning: `±${percent(rule.warning)} from baseline`,
      };
    case 'aboveLast':
      return {
        compared: 'Last reading',
        caution: `${formatValue(rule.caution, unit)} above baseline`,
        warning: `${formatValue(rule.warning, unit)} above baseline`,
      };
    case 'belowAvg3':
      return {
        compared: '3-day average',
        caution: `${formatValue(rule.caution, unit)} below baseline`,
        warning: `${formatValue(rule.warning, unit)} below baseline`,
      };
    case 'scaleAvg3':
      return { compared: '3-day average', caution: `${num(rule.caution)} of 5 or lower`, warning: `${num(rule.warning)} of 5 or lower` };
    case 'fractionAvg3':
      return {
        compared: '3-day average',
        caution: `under ${percent(rule.caution)} of baseline`,
        warning: `under ${percent(rule.warning)} of baseline`,
      };
    case 'sumFraction': {
      const target = `${num(EXERCISE_TARGET_PER_DAY * rule.days)} ${unit} target`;
      return {
        compared: `Total of the last ${rule.days} days`,
        caution: `under ${percent(rule.caution)} of the ${target}`,
        warning: `under ${percent(rule.warning)} of the ${target}`,
      };
    }
    case 'belowLast':
      return { compared: 'Last result', caution: `${num(rule.caution)} below baseline`, warning: `${num(rule.warning)} below baseline` };
    case 'aboveLastPercent':
      return {
        compared: 'Last result',
        caution: `${percent(rule.caution)} above baseline`,
        warning: rule.warning === undefined ? 'none' : `${percent(rule.warning)} above baseline`,
      };
    case 'none':
      return { compared: 'Recorded only', caution: 'no limit', warning: 'no limit' };
  }
}

/** The critical limit of one reading in words, or "none". */
export function describeCritical(id: IndicatorId): string {
  const limit = criticalLimit(id);
  const unit = INDICATORS[id].unit;
  if (!limit) return 'none';
  switch (limit.kind) {
    case 'percent':
      return `±${percent(limit.amount)} from baseline`;
    case 'abovePercent':
      return `${percent(limit.amount)} above baseline`;
    case 'above':
      return `${formatValue(limit.amount, unit)} above baseline`;
    case 'below':
      return unit === '1–5' || unit === 'level' ? `${num(limit.amount)} below baseline` : `${formatValue(limit.amount, unit)} below baseline`;
    case 'underFraction':
      return `${percent(limit.amount)} of baseline or less`;
  }
}

const GROUPS: { title: string; prefix: string }[] = [
  { title: 'Overview pages', prefix: 'hub-' },
  { title: 'The five hazards', prefix: 'hazard-' },
  { title: 'Human spaceflight risks', prefix: 'risk-' },
  { title: 'Ongoing research', prefix: 'study-' },
  { title: 'Past research', prefix: 'past-' },
];

function SourceList(p: { ids: string[] }) {
  return (
    <ul className="source-list">
      {p.ids.map((id) => (
        <li key={id}>
          <a href={SOURCES[id].url} target="_blank" rel="noreferrer">
            {SOURCES[id].title}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Where everything comes from, and what is the team's own. */
export function Sources() {
  const { dispatch } = useApp();
  const ids = Object.keys(SOURCES);
  const csa = ids.filter((id) => SOURCES[id].org === 'CSA');

  return (
    <div className="page sources">
      <div className="page-head">
        <h2>Sources</h2>
      </div>
      <p className="sources-lead">
        Every health statement in this app comes from the pages below: the five pages of the challenge’s Resources tab and the NASA and
        CSA pages they link to directly. This app does not diagnose. It shows which system asks for attention, names the conditions
        the source pages describe that the findings match, and passes on what the pages recommend.
      </p>

      <section className="sec" aria-labelledby="src-nasa">
        <h3 id="src-nasa">NASA</h3>
        <div className="source-groups">
          {GROUPS.map((g) => (
            <div key={g.prefix}>
              <h4>{g.title}</h4>
              <SourceList ids={ids.filter((id) => id.startsWith(g.prefix))} />
            </div>
          ))}
        </div>
      </section>

      <section className="sec" aria-labelledby="src-csa">
        <h3 id="src-csa">CSA</h3>
        <div>
          <h4>Canadian Space Agency</h4>
          <SourceList ids={csa} />
        </div>
      </section>

      <section className="sec" aria-labelledby="src-art">
        <h3 id="src-art">Artwork</h3>
        <div>
          <p>
            Skeleton drawing by Mariana Ruiz Villarreal; unlabelled edition and organ drawings by Mikael Häggström. Public domain, via
            Wikimedia Commons.
          </p>
          <p className="hint">
            The right arm of the skeleton is a mirror of the left, and the body outline is made from the skeleton itself. The drawings
            are used for the figure only, never as a source of health information.
          </p>
        </div>
      </section>

      <section className="sec" aria-labelledby="src-limits">
        <h3 id="src-limits">Thresholds</h3>
        <div>
          <p className="notice">These limits are the team's own settings, not NASA values.</p>
          <p className="hint">
            The source pages give no normal ranges or alert thresholds. Every comparison is with the crew member’s own baseline, and a
            missing entry never flags a system.
          </p>
          <table className="limits" aria-label="Daily limits">
            <thead>
              <tr>
                <th scope="col">Indicator</th>
                <th scope="col">Compared</th>
                <th scope="col">Caution</th>
                <th scope="col">Warning</th>
                <th scope="col">Critical reading</th>
              </tr>
            </thead>
            <tbody>
              {ALL_INDICATORS.map((id) => {
                const rule = describeRule(id);
                return (
                  <tr key={id}>
                    <th scope="row">{INDICATORS[id].label}</th>
                    <td>{rule.compared}</td>
                    <td>{rule.caution}</td>
                    <td>{rule.warning}</td>
                    <td>{describeCritical(id)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <table className="limits" aria-label="Long-term checks">
            <thead>
              <tr>
                <th scope="col">Long-term check</th>
                <th scope="col">Condition</th>
                <th scope="col">Result</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Recurring symptom</th>
                <td>
                  The same symptom on {LONG_TERM.recurring.count} of the last {LONG_TERM.recurring.days} days
                </td>
                <td>Caution</td>
              </tr>
              <tr>
                <th scope="row">Persistent symptom</th>
                <td>
                  The same symptom on {LONG_TERM.persistent.count} of the last {LONG_TERM.persistent.days} days
                </td>
                <td>Warning</td>
              </tr>
              <tr>
                <th scope="row">Sustained deviation</th>
                <td>
                  An indicator at caution or worse on {LONG_TERM.sustained.count} of the last {LONG_TERM.sustained.days} days
                </td>
                <td>Warning</td>
              </tr>
              <tr>
                <th scope="row">Trending</th>
                <td>
                  The weekly median (for a 1 to 5 scale, the weekly average) moves further from baseline three weeks running, by at least
                  half the caution limit
                </td>
                <td>Caution</td>
              </tr>
            </tbody>
          </table>

          <p className="hint">
            Two numbers do come from the sources: the exercise target of {num(EXERCISE_TARGET_PER_DAY)} hours per day{' '}
            <SourceLink source="risk-fitness" /> and the expected bone loss of 1% to 1.5% per month <SourceLink source="risk-bone" />.
            Radiation has no limit in the sources, so the dose is recorded and totalled only.
          </p>
        </div>
      </section>

      <section className="sec" aria-labelledby="src-possible">
        <h3 id="src-possible">Possible conditions</h3>
        <div>
          <p>
            When findings match a condition that the source pages describe, the app names it as “Possible”. Where the only thing
            that points to a condition is a habit the pages link to it, such as too little exercise or water, no sign of it was
            measured and the app says “Risk” instead. Either is a match with the sources, not a diagnosis, and the app names nothing
            the pages do not describe.
          </p>
          <table className="limits" aria-label="Possible conditions">
            <thead>
              <tr>
                <th scope="col">Condition</th>
                <th scope="col">What points to it</th>
                <th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              {CONDITIONS.map((c) => {
                const symptoms = c.symptoms.map((id) => SYMPTOMS.find((s) => s.id === id)?.label ?? id);
                const indicators = (c.indicators ?? []).map((i) => `${INDICATORS[i.id].label} ${i.direction === 'either' ? 'out of range' : `${i.direction} its limit`}`);
                const need = c.needs && c.needs > 1 ? `${c.needs} of: ` : '';
                return (
                  <tr key={c.id}>
                    <th scope="row">
                      {c.name}
                      {c.urgent && <> <span className="tag tag-urgent">always reported</span></>}
                      {c.basis === 'risk' && <> <span className="tag">shown as Risk</span></>}
                    </th>
                    <td>{[symptoms.length > 0 ? `${need}${symptoms.join(', ')}` : '', ...indicators].filter(Boolean).join('; ')}</td>
                    <td>
                      <SourceLink source={c.about.source} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sec" aria-labelledby="src-ground">
        <h3 id="src-ground">Ground link</h3>
        <div>
          <p>
            The link to the ground is simulated. A message the app “sends” is written to the log on the Ground link screen; nothing leaves
            this device. The app reports a critical reading once it is confirmed, every system at warning when a check ends, the weekly
            or monthly review when it finds something that keeps coming back, and a day left without its mandatory check-in.
          </p>
          <p className="hint">
            A critical reading is a single reading {CRITICAL_FACTOR} times as far from baseline as its warning limit. The check-in asks to
            measure again or confirm it. This limit, too, is the team’s own setting.
          </p>
        </div>
      </section>

      <section className="sec" aria-labelledby="src-sim">
        <h3 id="src-sim">Simulated data</h3>
        <div>
          <p>
            The demo profile, Crew 03, is simulated. It was not measured on a person. Its {DEMO_DAY} days of history are generated from a
            fixed seed, so the demo is the same every time it is opened; what you enter is added to it and saved in this browser only.
          </p>
          <div className="actions">
            <button type="button" className="btn" onClick={() => dispatch({ type: 'resetDemo' })}>
              Reset demo
            </button>
            <span className="hint">Returns the demo to flight day {DEMO_DAY} and removes what was entered.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
