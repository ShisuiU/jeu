import { useEffect, useRef, useState } from 'react';
import { fmt } from './common';

// COMPTEUR VIVANT — la valeur défile jusqu'au nouveau nombre ; un gain fait briller le compteur et s'envoler « +N ».
// La dernière valeur montrée est gardée : un gain obtenu ailleurs (Camp, combat…) défile au retour sur l'Accueil.
let seq = 0;
const LAST: Record<string, number> = {};
export function Counter({ id, value, format = fmt }: { id: string; value: number; format?: (n: number) => string }) {
  const start = LAST[id] ?? value;
  const [shown, setShown] = useState(start);
  const [fly, setFly] = useState<{ id: number; text: string; up: boolean } | null>(null);
  const prev = useRef(start);
  useEffect(() => {
    const from = prev.current; const to = value; prev.current = value; LAST[id] = value;
    if (from === to) return;
    const reduced = !!document.querySelector('.reduced-motion');
    const diff = to - from;
    if (Math.abs(diff) >= 1) setFly({ id: ++seq, text: `${diff > 0 ? '+' : '−'}${format(Math.abs(diff))}`, up: diff > 0 });
    if (reduced) { setShown(to); return; }
    const t0 = performance.now(); const dur = 600;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(from + diff * e));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, format, id]);
  useEffect(() => { if (!fly) return; const t = setTimeout(() => setFly(null), 1100); return () => clearTimeout(t); }, [fly]);
  return (
    <span className={`counter ${fly ? (fly.up ? 'gain' : 'loss') : ''}`}>
      {format(shown)}
      {fly && <span key={fly.id} className={`counter-fly ${fly.up ? 'up' : 'down'}`}>{fly.text}</span>}
    </span>
  );
}
