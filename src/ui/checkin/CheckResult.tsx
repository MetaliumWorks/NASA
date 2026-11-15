import { Fragment } from "react";
import { INDICATORS } from "../../content/indicators";
import { MISSIONS } from "../../content/missions";
import { conditionLead } from "../../content/conditions";
import { REGIONS } from "../../content/regions";
import { assessAll, flaggedFirst } from "../../domain/assess";
import { sentOn } from "../../domain/ground";
import {
  matchConditions,
  matchesFor,
  type ConditionMatch,
} from "../../domain/possible";
import { findingName, NOT_A_DIAGNOSIS } from "../../domain/report";
import type { RegionId } from "../../domain/types";
import { useApp } from "../../state/store";
import { SourceLink } from "../SourceLink";
import { StatusGlyph } from "../StatusGlyph";

/**
 * What a check found, said plainly: the systems that need attention, the conditions from
 * the sources that the findings match, what to do, and what was reported to the ground.
 */
export function CheckResult(p: {
  title: string;
  doneLabel: string;
  onDone(): void;
  asked?: RegionId[];
}) {
  const { state, dispatch } = useApp();
  const { profile } = state;
  const day = profile.missionDay;
  const all = assessAll(profile, day);
  const matches = matchConditions(profile, day, all);
  const asked = p.asked ?? [];
  const attention = flaggedFirst(all, asked);
  const firstOther = attention.findIndex((a) => !asked.includes(a.region));
  const splitAt = asked.length > 0 && firstOther > 0 ? firstOther : -1;
  const sent = sentOn(profile, day);
  const comms = MISSIONS[profile.mission].commsLine;

  const flaggedRegions = attention.map((a) => a.region);
  const home = (m: ConditionMatch) =>
    flaggedRegions.includes(m.condition.region)
      ? m.condition.region
      : flaggedRegions.find((r) => m.regions.includes(r));

  let lead = "Nothing needs attention. All systems are nominal.";
  if (attention.length === 1) lead = "1 system needs attention";
  if (attention.length > 1) lead = `${attention.length} systems need attention`;

  return (
    <section className="result" aria-labelledby="result-title">
      <h3 id="result-title">{p.title}</h3>
      <p className="lead">{lead}</p>

      <div className="result-sent" role="status">
        {sent.length > 0 ? (
          <>
            <h4>Reported to the ground today</h4>
            <ul>
              {sent.map((m) => (
                <li key={m.id}>
                  <span className={`tag tag-${m.kind}`}>{m.kind}</span>{" "}
                  {m.subject}
                </li>
              ))}
            </ul>
            <p className="hint">
              Simulated link: the message is in the ground log and nothing
              leaves this device.
              {comms ? ` Comms on this mission: ${comms}.` : ""}
            </p>
          </>
        ) : (
          <p className="hint">
            Nothing was reported to the ground: no system is at warning and no
            reading was critical. Cautions are told to you here and go into the
            next weekly review.
          </p>
        )}
      </div>

      {attention.length > 0 && (
        <ul className="result-list">
          {attention.map((a, index) => {
            const region = REGIONS[a.region];
            // Each condition is named once: under its own system, or the first flagged one that points to it.
            const possible = matchesFor(matches, a.region).filter(
              (m) => home(m) === a.region,
            );
            const actions = possible.flatMap((m) =>
              m.condition.actions.map((id) =>
                REGIONS[m.condition.region].recommendations.find(
                  (r) => r.id === id,
                ),
              ),
            );
            const toDo = [
              ...new Set(
                actions.filter((r) => r !== undefined).map((r) => r.text),
              ),
            ];
            return (
              <Fragment key={a.region}>
                {index === splitAt && (
                  <li className="result-also">Also needs attention today</li>
                )}
                <li className="result-item" data-status={a.status}>
                  <div className="result-head">
                    <b>{region.name}</b> <StatusGlyph status={a.status} label />
                    <button
                      type="button"
                      className="btn btn-quiet"
                      onClick={() => {
                        dispatch({ type: "select", region: a.region });
                        dispatch({ type: "view", view: "map" });
                      }}
                    >
                      Open {region.name}
                    </button>
                  </div>
                  {a.findings
                    .filter((f) => f.status !== "nominal")
                    .map((f, i) => (
                      <p key={i} className="result-finding">
                        {f.indicator
                          ? INDICATORS[f.indicator].label
                          : findingName(f)}
                        : {f.reason}
                      </p>
                    ))}
                  {possible.map((m) => (
                    <p key={m.condition.id} className="result-possible">
                      <span className="what">
                        {conditionLead(m.condition)}: {m.condition.name}.
                      </span>{" "}
                      {m.condition.about.text}{" "}
                      <SourceLink source={m.condition.about.source} />
                    </p>
                  ))}
                  {toDo.length > 0 && (
                    <p className="result-do">What to do: {toDo.join(" ")}</p>
                  )}
                </li>
              </Fragment>
            );
          })}
        </ul>
      )}
      {attention.length > 0 && <p className="hint">{NOT_A_DIAGNOSIS}</p>}

      <div className="actions">
        <button type="button" className="btn" onClick={p.onDone}>
          {p.doneLabel}
        </button>
        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => dispatch({ type: "view", view: "report" })}
        >
          Open ground link
        </button>
      </div>
    </section>
  );
}
