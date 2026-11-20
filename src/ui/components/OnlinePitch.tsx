import type { ReactNode } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { HeroArt } from '../art/HeroArt';
import { EnemyArt } from '../art/EnemyArt';
import { powerOf } from '../../game/stats';
import { heroTotalStats } from '../../game/heroStats';

// PRÉSENTATION D'UN MODE EN LIGNE (v1.119.0) — Clan et Amis sans compte : au lieu d'une ligne perdue dans un écran vide,
// un bandeau avec les héros du joueur, ce que le mode apporte, puis la connexion.
export function OnlinePitch({ title, enemy, perks, foot }: {
  title: string;
  enemy?: string;
  perks: { icon: ReactNode; title: string; text: string }[];
  foot?: string;
}) {
  const save = useGame((s) => s.save)!;
  const push = useUI((s) => s.push);
  const best = save.heroes.map((h) => ({ h, p: powerOf(heroTotalStats(save, h).total) })).sort((a, b) => b.p - a.p).slice(0, 3).map((x) => x.h);
  return (
    <div className="op">
      <div className={`op-hero ${enemy ? 'has-enemy' : ''}`} aria-hidden>
        {enemy && <div className="op-enemy"><EnemyArt enemyId={enemy} /></div>}
        <div className="op-team">
          {best.map((h, i) => <div key={h.uid} className={`op-h op-h${i}`}><HeroArt heroId={h.heroId} /></div>)}
        </div>
        <h2 className="op-title">{title}</h2>
      </div>
      <ul className="op-perks">
        {perks.map((p) => (
          <li key={p.title}><span className="op-ic">{p.icon}</span><span><b>{p.title}</b><small>{p.text}</small></span></li>
        ))}
      </ul>
      <button className="btn block" onClick={() => push({ name: 'saves' })}>Se connecter ou créer un compte</button>
      <p className="faint op-foot">{foot ?? 'Gratuit. Ta partie est aussi sauvegardée en ligne.'}</p>
    </div>
  );
}
