import { SOURCES } from '../content/sources';

/** The page a health text comes from, as a link that opens in a new tab. */
export function SourceLink(p: { source: string }) {
  const s = SOURCES[p.source];
  if (!s) return null;
  return (
    <a className="source" href={s.url} target="_blank" rel="noreferrer">
      {s.org}, {s.title}
    </a>
  );
}
