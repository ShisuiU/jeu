import { useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { Screen, Panel } from '../components/common';
import { Icon, ResourceIcon } from '../art/Icons';
import { RESOURCES } from '../../data/resources';
import { WHEEL, spinWheel, wheelReady } from '../../game/wheel';
import { formatDuration, msUntilReset } from '../../core/time';
import { RewardView } from '../components/RewardView';
import { play } from '../../audio/sfx';

// ROUE QUOTIDIENNE — un tour gratuit par jour. La case gagnée est tirée (et donnée) au moment du toucher,
// puis la roue tourne jusqu'à elle.
const N = WHEEL.length;
const SEG = 360 / N;

function SlotIcon({ id, size }: { id: string; size: number }) {
  const w = WHEEL.find((x) => x.id === id)!;
  const k = Object.keys(w.reward)[0];
  if (k === 'energy') return <Icon.energy size={size} />;
  const d = RESOURCES[k as keyof typeof RESOURCES];
  return <ResourceIcon icon={d.icon} color={d.color} size={size} res={k} />;
}

export function Wheel() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState<number | null>(null);
  const ready = wheelReady(save, now);

  const spin = () => {
    if (!ready || spinning) return;
    let r: ReturnType<typeof spinWheel> = null;
    mutate((d) => { r = spinWheel(d, Date.now()); });
    if (!r) { toast('Tour du jour déjà joué.'); return; }
    const { index } = r as { index: number };
    // Case i centrée en haut : rotation = −(i × SEG + SEG/2), plus 5 tours complets.
    setAngle(5 * 360 + (360 - (index * SEG + SEG / 2)));
    setSpinning(true);
    play('tap');
    window.setTimeout(() => { setSpinning(false); setWon(index); play('claim'); }, 3600);
  };

  const lastIdx = won ?? (save.wheel?.last ? WHEEL.findIndex((w) => w.id === save.wheel!.last) : -1);
  return (
    <Screen title="Roue quotidienne">
      <div className="wheel-wrap">
        <div className="wheel-pin" aria-hidden />
        <svg className="wheel" viewBox="-110 -110 220 220" style={{ transform: `rotate(${angle}deg)`, transition: spinning ? 'transform 3.5s cubic-bezier(.15,.85,.2,1)' : 'none' }} aria-hidden>
          {WHEEL.map((w, i) => {
            const a0 = ((i * SEG - 90) * Math.PI) / 180, a1 = (((i + 1) * SEG - 90) * Math.PI) / 180;
            const p = (a: number, r: number) => `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
            return <path key={w.id} d={`M0 0 L${p(a0, 100)} A100 100 0 0 1 ${p(a1, 100)} Z`} fill={w.color} stroke="#d9a441" strokeWidth="1.2" />;
          })}
          <circle r="100" fill="none" stroke="#d9a441" strokeWidth="3" />
          <circle r="16" fill="#1a1420" stroke="#d9a441" strokeWidth="2" />
        </svg>
        {/* Icônes et libellés posés par-dessus (tournent avec la roue). */}
        <div className="wheel-labels" style={{ transform: `rotate(${angle}deg)`, transition: spinning ? 'transform 3.5s cubic-bezier(.15,.85,.2,1)' : 'none' }}>
          {WHEEL.map((w, i) => (
            <div key={w.id} className={`wl ${w.id === 'faille' ? 'rare' : ''}`} style={{ transform: `rotate(${i * SEG + SEG / 2}deg)` }}>
              <SlotIcon id={w.id} size={24} />
              <span>{w.label}</span>
            </div>
          ))}
        </div>
      </div>
      <button className="btn block" disabled={!ready || spinning} onClick={spin} style={{ marginTop: 16 }}>
        {spinning ? 'La roue tourne…' : ready ? 'Tourner (gratuit)' : `Prochain tour dans ${formatDuration(msUntilReset(now))}`}
      </button>
      {!spinning && lastIdx >= 0 && !ready && (
        <Panel title={won !== null ? 'Gagné !' : 'Gain du jour'}>
          <RewardView reward={WHEEL[lastIdx].reward} />
        </Panel>
      )}
      <p className="faint" style={{ textAlign: 'center' }}>Un tour gratuit par jour. Cases : énergie (5, 10, 30 ou 50), or, cristaux, élixirs, et une case rare avec un <b style={{ color: '#ff3d6e' }}>Éclat de faille</b>.</p>
    </Screen>
  );
}
