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
import stoneUrl from '../../assets/theme/stone.webp';

// ROUE QUOTIDIENNE — une roue de fortune ancienne : secteurs de pierre peinte, cerclage d'or gravé et clouté,
// rayons d'or terminés par des gemmes, cristal d'Aeon au moyeu et griffe dorée en guise d'aiguille.
// La case gagnée est tirée (et donnée) au toucher, puis la roue tourne jusqu'à elle.
const N = WHEEL.length;
const SEG = 360 / N;
const rad = (d: number) => ((d - 90) * Math.PI) / 180;
const pt = (d: number, r: number) => `${(Math.cos(rad(d)) * r).toFixed(2)} ${(Math.sin(rad(d)) * r).toFixed(2)}`;

function SlotIcon({ id, size }: { id: string; size: number }) {
  const w = WHEEL.find((x) => x.id === id)!;
  const k = Object.keys(w.reward)[0];
  if (k === 'energy') return <Icon.energy size={size} />;
  const d = RESOURCES[k as keyof typeof RESOURCES];
  return <ResourceIcon icon={d.icon} color={d.color} size={size} res={k} />;
}

function WheelArt() {
  return (
    <svg className="wheel" viewBox="-120 -120 240 240" aria-hidden>
      <defs>
        <pattern id="wh-stone" patternUnits="userSpaceOnUse" width="120" height="120"><image href={stoneUrl} width="120" height="120" preserveAspectRatio="xMidYMid slice" /></pattern>
        <radialGradient id="wh-shade" cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse"><stop offset="0.15" stopColor="#000" stopOpacity="0.55" /><stop offset="0.75" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.45" /></radialGradient>
        <linearGradient id="wh-gold" x1="0" y1="-1" x2="0" y2="1"><stop offset="0" stopColor="#fff0bf" /><stop offset="0.35" stopColor="#d9a441" /><stop offset="0.7" stopColor="#8a5a1c" /><stop offset="1" stopColor="#e8c06a" /></linearGradient>
        <radialGradient id="wh-crystal" cx="0" cy="-4" r="16" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#e8fbff" /><stop offset="0.5" stopColor="#5fd8ff" /><stop offset="1" stopColor="#0d3f52" /></radialGradient>
      </defs>
      {/* Secteurs : pierre teintée de la couleur de la récompense. */}
      {WHEEL.map((w, i) => {
        const a0 = i * SEG, a1 = (i + 1) * SEG;
        const d = `M0 0 L${pt(a0, 100)} A100 100 0 0 1 ${pt(a1, 100)} Z`;
        return (
          <g key={w.id}>
            <path d={d} fill="url(#wh-stone)" />
            <path d={d} fill={w.color} opacity={0.72} style={{ mixBlendMode: 'multiply' }} />
            <path d={d} fill={w.color} opacity={0.35} />
            {w.id === 'faille' && <path d={d} fill="#ff3d6e" opacity={0.18} />}
          </g>
        );
      })}
      <circle r="100" fill="url(#wh-shade)" />
      {/* Rayons d'or entre les secteurs. */}
      {WHEEL.map((_, i) => <line key={i} x1="0" y1="0" x2={pt(i * SEG, 100).split(' ')[0]} y2={pt(i * SEG, 100).split(' ')[1]} stroke="url(#wh-gold)" strokeWidth="2.2" />)}
      {/* Cerclage : anneau d'or épais, gravure intérieure, clous et gemmes au bout des rayons. */}
      <circle r="106" fill="none" stroke="#2a1a0c" strokeWidth="16" />
      <circle r="106" fill="none" stroke="url(#wh-gold)" strokeWidth="11" />
      <circle r="100.5" fill="none" stroke="#5a3a12" strokeWidth="1.5" />
      <circle r="111.5" fill="none" stroke="#5a3a12" strokeWidth="1.2" />
      {Array.from({ length: N * 3 }, (_, k) => {
        const [x, y] = pt((k * SEG) / 3 + SEG / 6, 106).split(' ').map(Number);
        return <circle key={k} cx={x} cy={y} r="1.6" fill="#fff3c4" stroke="#6b4416" strokeWidth="0.6" />;
      })}
      {WHEEL.map((_, i) => {
        const [x, y] = pt(i * SEG, 106).split(' ').map(Number);
        return <g key={i} transform={`translate(${x} ${y}) rotate(${i * SEG})`}><path d="M0 -4.6 3.4 0 0 4.6 -3.4 0Z" fill="#b8243e" stroke="#ffe2a3" strokeWidth="0.8" /></g>;
      })}
      {/* Moyeu : couronne d'or et cristal d'Aeon. */}
      <circle r="21" fill="#1a1208" stroke="url(#wh-gold)" strokeWidth="4" />
      {Array.from({ length: 8 }, (_, k) => { const [x, y] = pt(k * 45, 21).split(' ').map(Number); return <circle key={k} cx={x} cy={y} r="1.4" fill="#fff3c4" />; })}
      <path d="M0 -14 9 -3 5 11 -5 11 -9 -3Z" fill="url(#wh-crystal)" stroke="#bff3ff" strokeWidth="0.8" />
      <path d="M0 -14 0 11M-9 -3 9 -3" stroke="#e8fbff" strokeWidth="0.6" opacity="0.7" />
    </svg>
  );
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
    // Case i centrée sous la griffe : rotation = −(i × SEG + SEG/2), plus 6 tours complets.
    setAngle(6 * 360 + (360 - (index * SEG + SEG / 2)));
    setSpinning(true);
    play('tap');
    window.setTimeout(() => { setSpinning(false); setWon(index); play('claim'); }, 4100);
  };

  const lastIdx = won ?? (save.wheel?.last ? WHEEL.findIndex((w) => w.id === save.wheel!.last) : -1);
  const turn = { transform: `rotate(${angle}deg)`, transition: spinning ? 'transform 4s cubic-bezier(.12,.86,.18,1)' : 'none' };
  return (
    <Screen title="Roue quotidienne">
      <div className={`wheel-wrap ${spinning ? 'spinning' : ''}`}>
        <div className="wheel-halo" aria-hidden />
        <div className="wheel-rot" style={turn}>
          <WheelArt />
          <div className="wheel-labels">
            {WHEEL.map((w, i) => (
              <div key={w.id} className={`wl ${w.id === 'faille' ? 'rare' : ''} ${!spinning && lastIdx === i && !ready ? 'won' : ''}`} style={{ transform: `rotate(${i * SEG + SEG / 2}deg)` }}>
                <SlotIcon id={w.id} size={22} />
                <span>{w.short}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Griffe d'or qui désigne la case. */}
        <svg className="wheel-pin" viewBox="0 0 40 52" aria-hidden>
          <defs><linearGradient id="wp-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff0bf" /><stop offset="0.5" stopColor="#d9a441" /><stop offset="1" stopColor="#7a4a14" /></linearGradient></defs>
          <path d="M20 50 6 18C3 10 9 2 20 2s17 8 14 16Z" fill="url(#wp-g)" stroke="#3a2208" strokeWidth="1.5" />
          <circle cx="20" cy="15" r="6" fill="#b8243e" stroke="#ffe2a3" strokeWidth="1.2" />
          <circle cx="18" cy="13" r="1.8" fill="#ffd0dc" />
        </svg>
      </div>
      <button className="btn block" disabled={!ready || spinning} onClick={spin} style={{ marginTop: 16 }}>
        {spinning ? 'La roue tourne…' : ready ? 'Tourner (gratuit)' : `Prochain tour dans ${formatDuration(msUntilReset(now))}`}
      </button>
      {!spinning && lastIdx >= 0 && !ready && (
        <Panel title={won !== null ? 'Gagné !' : 'Gain du jour'}>
          <RewardView reward={WHEEL[lastIdx].reward} />
        </Panel>
      )}
      <p className="faint" style={{ textAlign: 'center' }}>Un tour gratuit par jour. Énergie (5, 10, 30, 50), élixirs (1, 3, 5, 10), or, cristaux, et une case rare : un <b style={{ color: '#ff3d6e' }}>Éclat de faille</b>.</p>
    </Screen>
  );
}
