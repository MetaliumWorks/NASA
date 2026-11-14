import { useMemo, useRef, useState } from 'react';
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

  return (
    <div className="page">
      <div className="page-head">
        <h2>Ground report</h2>
        <span className="panel-meta mono">Flight day {profile.missionDay}</span>
      </div>
      <p className="hint">
        A summary of the flagged systems for the ground team, built from today’s findings. Nothing is sent from this app: copy the text
        or download it, and pass it on through your own channel.
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
