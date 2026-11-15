import { useMemo, useRef, useState } from 'react';
import { MISSIONS } from '../../content/missions';
import { outbox } from '../../domain/ground';
import { groundReport, reportFileName } from '../../domain/report';
import { useApp } from '../../state/store';
import './report.css';

/** The report for the ground team as text to copy or download. Nothing is sent from here. */
export function GroundReport() {
  const { state } = useApp();
  const { profile } = state;
  const text = useMemo(() => groundReport(profile, profile.missionDay), [profile]);
  const box = useRef<HTMLTextAreaElement>(null);
  const [status, setStatus] = useState('');

  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error('no clipboard');
      await navigator.clipboard.writeText(text);
      setStatus('Copied');
    } catch {
      // No clipboard access (an old browser, or a page not served securely): select the text instead.
      box.current?.focus();
      box.current?.select();
      setStatus('Text selected. Press Ctrl+C to copy.');
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = reportFileName(profile);
    link.click();
    URL.revokeObjectURL(url);
    setStatus('Downloaded');
  };

  const sent = [...outbox(profile)].reverse();
  const comms = MISSIONS[profile.mission].commsLine;

  return (
    <div className="page">
      <div className="page-head">
        <h2>Ground link</h2>
        <span className="panel-meta mono">Flight day {profile.missionDay}</span>
      </div>
      <p className="notice-sim">
        <span className="tag tag-simulated">Simulated link</span> Messages are written to this log. Nothing leaves this device.
        {comms ? ` Comms on this mission: ${comms}.` : ''}
      </p>

      <section className="sec" aria-labelledby="sent-title">
        <h3 id="sent-title">Sent to ground</h3>
        <div>
          <p className="hint">
            The app reports on its own: a confirmed critical reading at once, every system at warning when a check ends, the weekly or
            monthly review when it finds something that keeps coming back, and a day left without its check-in.
          </p>
          {sent.length === 0 ? (
            <p>Nothing has been sent yet.</p>
          ) : (
            <ul className="sent-list">
              {sent.map((m) => (
                <li key={m.id}>
                  <details>
                    <summary>
                      <span className="mono sent-day">Day {m.day}</span> <span className={`tag tag-${m.kind}`}>{m.kind}</span>{' '}
                      <span className="sent-subject">{m.subject}</span>
                    </summary>
                    <pre className="sent-body">{m.body}</pre>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <h3 className="report-title">Full report</h3>
      <p className="hint">
        Every flagged system as of today, to copy or download and pass on through your own channel.
      </p>

      <textarea ref={box} className="report-text" aria-label="Report text" readOnly rows={Math.min(26, text.split('\n').length + 1)} value={text} />

      <div className="actions">
        <button type="button" className="btn" onClick={copy}>
          Copy
        </button>
        <button type="button" className="btn btn-quiet report-download" onClick={download}>
          Download .txt
        </button>
        <span className="report-status" role="status">
          {status}
        </span>
      </div>
    </div>
  );
}
