import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../state/store';
import { HERO_BY_ID } from '../../data/heroes';
import { AFFINITIES } from '../../data/affinities';
import { BALANCE } from '../../data/balance';
import { playCeremonyBurst, playCeremonyCharge, playStatTick } from '../../audio/battleSfx';
import { Stage25 } from '../fx/stage25';
import { LivingArt } from '../art/LivingArt';
import { HeroArt, heroArtUrl } from '../art/HeroArt';
import { fmt } from './common';
import emblemRank from '../../assets/kit/emblem_rank.webp';
import emblemAscend from '../../assets/kit/emblem_ascend.webp';
import emblemAwaken from '../../assets/kit/emblem_awaken.webp';

/** Emblèmes peints (SpriteCook, v1.107.0) : le sceau de chaque cérémonie, frappé sur la carte du héros. */
const EMBLEM: Record<CeremonyKind, string> = { rank: emblemRank, ascend: emblemAscend, awaken: emblemAwaken };

// CÉRÉMONIE DE PROGRESSION (v1.107.0, phase 3 lot 5) — rang, ascension et éveil ne sont plus un chiffre qui change :
//   1. la charge : l'écran s'assombrit, la lumière converge vers le héros (silhouette) ;
//   2. l'éclat : flash, onde, le héros apparaît vivant, le titre et la nouvelle étoile se posent ;
//   3. le bilan : chaque statistique avant → après, ligne par ligne, puis « Continuer ».
// Toucher pendant l'animation la termine aussitôt ; « Animations réduites » montre directement le bilan.

export type CeremonyKind = 'rank' | 'ascend' | 'awaken';

export { snapHero, type HeroSnap } from '../../game/heroSnap';
import type { HeroSnap } from '../../game/heroSnap';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
const THEME: Record<CeremonyKind, { kicker: string; color: string; glow: string }> = {
  rank: { kicker: 'Nouveau rang', color: '#ffd36b', glow: '#ffae2b' },
  ascend: { kicker: 'Ascension', color: '#9fd8ff', glow: '#5fb4ff' },
  awaken: { kicker: 'Éveil', color: '#d9b8ff', glow: '#a46bff' },
};

export function Ceremony({ kind, heroId, before, after, onDone }: { kind: CeremonyKind; heroId: string; before: HeroSnap; after: HeroSnap; onDone: () => void }) {
  const reduced = !!useGame.getState().save?.settings.reducedMotion;
  const d = HERO_BY_ID[heroId];
  const th = THEME[kind];
  const CHARGE = kind === 'awaken' ? 1500 : 950;
  // phase : 0 charge, 1 éclat, 2 bilan (lignes qui se posent), 3 terminé (bouton actif)
  const [phase, setPhase] = useState(reduced ? 3 : 0);
  const [rows, setRows] = useState(reduced ? 99 : 0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const title = kind === 'rank' ? `Rang ${after.rank}` : kind === 'ascend' ? `Ascension ${ROMAN[after.ascension] ?? after.ascension}` : `Éveil ${ROMAN[after.awaken] ?? after.awaken}`;
  const lines: { label: string; from: string; to: string; gain: string }[] = [];
  const pct = (a: number, b: number) => (a > 0 ? `+${Math.round(((b - a) / a) * 100)} %` : '');
  if (after.cap !== before.cap) lines.push({ label: 'Niveau maximum', from: String(before.cap), to: String(after.cap), gain: `+${after.cap - before.cap}` });
  for (const [k, label] of [['hp', 'PV'], ['atk', 'ATQ'], ['def', 'DÉF']] as const) if (Math.round(after[k]) !== Math.round(before[k])) lines.push({ label, from: fmt(Math.round(before[k])), to: fmt(Math.round(after[k])), gain: pct(before[k], after[k]) });
  if (Math.round(after.spd) !== Math.round(before.spd)) lines.push({ label: 'VIT', from: String(Math.round(before.spd)), to: String(Math.round(after.spd)), gain: `+${Math.round(after.spd - before.spd)}` });
  if (Math.round(after.critDmg) !== Math.round(before.critDmg)) lines.push({ label: 'Dégâts critiques', from: `${Math.round(before.critDmg)} %`, to: `${Math.round(after.critDmg)} %`, gain: `+${Math.round(after.critDmg - before.critDmg)}` });
  lines.push({ label: 'Puissance', from: fmt(before.power), to: fmt(after.power), gain: `+${fmt(after.power - before.power)}` });
  const next = kind === 'rank' ? (after.rank < BALANCE.hero.maxRank ? `Prochain rang au niveau ${after.cap}.` : 'Rang maximum atteint.')
    : kind === 'ascend' ? (after.ascension < BALANCE.hero.maxAscension ? `L’éveil ${after.awaken + 1} est maintenant possible.` : 'Ascension maximale atteinte.')
    : (after.awaken < BALANCE.hero.maxAwaken ? 'Chaque éveil ajoute aussi +2 de vitesse.' : 'Éveil maximal : le héros a atteint sa pleine puissance.');

  // Déroulé.
  useEffect(() => {
    if (reduced) return;
    const at = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
    playCeremonyCharge(kind);
    at(CHARGE, () => { setPhase(1); playCeremonyBurst(kind); });
    at(CHARGE + 900, () => setPhase(2));
    lines.forEach((_, i) => at(CHARGE + 1000 + i * 170, () => { setRows(i + 1); playStatTick(i); }));
    at(CHARGE + 1100 + lines.length * 170, () => setPhase(3));
    return () => timers.current.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Particules : la lumière converge pendant la charge, puis jaillit.
  useEffect(() => {
    const cv = canvas.current; if (!cv || reduced) return;
    const st = new Stage25(cv, () => 1, [th.color, '#ffffff'], 10, { vx: [-0.01, 0.01], vy: [-0.03, -0.008], r: [0.6, 1.6], alpha: [0.2, 0.5] });
    st.start();
    const c = () => { const r = card.current?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height * 0.45 } : { x: window.innerWidth / 2, y: window.innerHeight * 0.35 }; };
    const iv = window.setInterval(() => st.vortex(c(), th.color, 9, 190), 90);
    const t1 = window.setTimeout(() => { clearInterval(iv); const p = c(); st.burst(p, th.color, 70, 0.6); st.burst(p, '#ffffff', 30, 0.45); const r = card.current?.getBoundingClientRect(); st.ring(r ? { x: p.x, y: r.bottom - 6 } : p, th.color, 200, 900); }, CHARGE);
    const t2 = window.setInterval(() => st.embers({ x: c().x, y: c().y + 90 }, th.color, 2, 90, 10), 160);
    return () => { clearInterval(iv); clearTimeout(t1); clearInterval(t2); st.stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const skip = () => { if (phase < 3) { timers.current.forEach(clearTimeout); setPhase(3); setRows(99); } };
  const pips = kind === 'rank' ? { n: after.rank, max: BALANCE.hero.maxRank } : kind === 'ascend' ? { n: after.ascension, max: BALANCE.hero.maxAscension } : { n: after.awaken, max: BALANCE.hero.maxAwaken };

  return (
    <div className={`cer cer-${kind} ph${phase}`} style={{ ['--cc' as string]: th.color, ['--cg' as string]: th.glow }} onClick={skip} role="dialog" aria-label={`${th.kicker} : ${d.name}, ${title}`}>
      <canvas className="cer-fx" ref={canvas} aria-hidden />
      <div className="cer-rays" aria-hidden />
      {kind === 'awaken' && <div className="cele-threads" aria-hidden>{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ ['--a' as string]: `${i * 30}deg`, ['--d' as string]: `${0.2 + (i % 4) * 0.1}s` }} />)}</div>}
      <div className="cer-flash" aria-hidden />
      <div className="cer-card" ref={card}>
        {phase >= 1
          ? <LivingArt src={heroArtUrl(heroId, 'full')} accent={AFFINITIES[d.affinity].color}><HeroArt heroId={heroId} kind="full" position="center 12%" /></LivingArt>
          : <HeroArt heroId={heroId} kind="full" position="center 12%" />}
      </div>
      <img className="cer-emblem" src={EMBLEM[kind]} alt="" aria-hidden draggable={false} />
      <div className="cer-head">
        <div className="cer-kicker">{d.name}</div>
        <div className="cer-title">{title}</div>
        <div className={`cer-pips p-${kind}`} aria-label={`${pips.n} sur ${pips.max}`}>
          {Array.from({ length: pips.max }, (_, i) => <i key={i} className={i < pips.n - 1 ? 'on' : i === pips.n - 1 ? 'on new' : ''} />)}
        </div>
      </div>
      <div className="cer-sheet" onClick={(e) => { if (phase >= 3) e.stopPropagation(); }}>
        {lines.map((l, i) => (
          <div key={l.label} className={`cer-row ${i < rows ? 'in' : ''} ${l.label === 'Puissance' ? 'total' : ''}`}>
            <span>{l.label}</span><span className="cr-from">{l.from}</span><span className="cr-arrow" aria-hidden>›</span><b>{l.to}</b><em>{l.gain}</em>
          </div>
        ))}
        <p className="cer-next">{next}</p>
        <button className="btn cer-ok" disabled={phase < 3} onClick={(e) => { e.stopPropagation(); onDone(); }}>Continuer</button>
      </div>
    </div>
  );
}
