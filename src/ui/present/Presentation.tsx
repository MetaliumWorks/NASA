// Tanıtım modu: the Turkish video plays one part at a time over the app; between parts the app is live and the
// team presents that feature. → / PageDown / Space plays the next part, Esc leaves. Turkish only, by design.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { RegionId } from '../../domain/types';
import { useApp, type View } from '../../state/store';
import './present.css';

export interface Part {
  /** Seconds into tanitim.mp4. */
  start: number;
  end: number;
  /** What the app shows when the part ends. */
  view: View;
  region?: RegionId | null;
  name: string;
  /** Stay on the last frame until the next press. */
  hold?: boolean;
}

export const PARTS: Part[] = [
  { start: 0, end: 15.5, view: 'map', region: null, name: 'Giriş ve vücut haritası' },
  { start: 15.5, end: 20.5, view: 'checkin', name: 'Günlük kontrol' },
  { start: 20.5, end: 24.5, view: 'checkin', name: 'Kritik değer' },
  { start: 24.5, end: 30, view: 'check', name: 'Belirti kontrolü' },
  { start: 30, end: 34.5, view: 'review', name: 'İnceleme' },
  { start: 34.5, end: 39.5, view: 'map', region: 'kidneys', name: 'Öneriler' },
  { start: 39.5, end: 44, view: 'report', name: 'Yer bağlantısı' },
  { start: 44, end: 48.5, view: 'setup', name: 'Görev' },
  { start: 48.5, end: 51.1, view: 'sources', name: 'Kaynaklar' },
  // the closing card stays on screen until the next press, then the app comes back
  { start: 51.1, end: 58, view: 'map', region: null, name: 'Kapanış', hold: true },
];

const VIDEO = './tanitim.mp4';
const typing = () => !!document.activeElement?.closest('input, textarea, select');

/** The header button and, once started, the video layer and the small control bar. */
export function Presentation() {
  const { dispatch } = useApp();
  const video = useRef<HTMLVideoElement>(null);
  const [on, setOn] = useState(false);
  const [next, setNext] = useState(0);
  const [playing, setPlaying] = useState<number | null>(null);
  const [held, setHeld] = useState<number | null>(null);

  const finish = useCallback(
    (i: number) => {
      const v = video.current;
      v?.pause();
      const part = PARTS[i];
      if (part.region !== undefined) dispatch({ type: 'select', region: part.region });
      dispatch({ type: 'view', view: part.view });
      setPlaying(null);
      setNext(i + 1);
    },
    [dispatch],
  );

  const play = useCallback((i: number) => {
    const v = video.current;
    if (!v || i >= PARTS.length) return;
    v.currentTime = PARTS[i].start;
    setPlaying(i);
    void v.play()?.catch(() => undefined);
  }, []);

  // stop exactly at the end of the part
  useEffect(() => {
    if (playing == null) return;
    let raf = 0;
    const tick = () => {
      const v = video.current;
      const part = PARTS[playing];
      if (v && (v.currentTime >= part.end - 0.04 || v.ended)) {
        if (part.hold) {
          v.pause();
          setHeld(playing);
          setPlaying(null);
        } else finish(playing);
      } else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, finish]);

  const stop = useCallback(() => {
    video.current?.pause();
    setOn(false);
    setPlaying(null);
    setHeld(null);
    setNext(0);
  }, []);

  useEffect(() => {
    if (!on) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return stop();
      const forward = e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !typing());
      if (!forward) return;
      e.preventDefault();
      if (playing != null) {
        if (PARTS[playing].hold) {
          const v = video.current;
          if (v) v.currentTime = PARTS[playing].end - 0.05;
          v?.pause();
          setHeld(playing);
          setPlaying(null);
        } else finish(playing);
      } else if (held != null) {
        setHeld(null);
        finish(held);
      } else play(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [on, playing, held, next, play, finish, stop]);

  return (
    <>
      <button
        type="button"
        className="btn btn-quiet"
        data-no-translate
        onClick={() => {
          setOn(true);
          play(0);
        }}
      >
        Tanıtım modu
      </button>
      <div className={'present' + (on ? ' is-on' : '')} data-no-translate>
        <div className={'present-video' + (playing != null || held != null ? ' is-playing' : '')} aria-hidden={playing == null && held == null}>
          <video ref={video} src={VIDEO} preload="auto" playsInline muted />
        </div>
        {on && playing == null && held == null && (
          <div className="present-bar" role="region" aria-label="Tanıtım modu">
            <span className="mono">
              Tanıtım · {Math.min(next, PARTS.length)}/{PARTS.length}
            </span>
            {next < PARTS.length ? (
              <button type="button" className="btn" onClick={() => play(next)}>
                Sonraki: {PARTS[next].name} ▶
              </button>
            ) : (
              <span>Tanıtım bitti</span>
            )}
            <button type="button" className="btn btn-quiet" onClick={stop}>
              Çık (Esc)
            </button>
          </div>
        )}
      </div>
    </>
  );
}
