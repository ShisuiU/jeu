import type { StatusId } from '../../data/types';
import { STATUS_INFO } from '../../game/battle/types';

// SYMBOLES DES EFFETS DE COMBAT — un dessin par effet, lisible même à 10 px.
// Hausses et baisses de stats : le symbole de la stat (épée, bouclier, éclair) + une flèche ▲ ou ▼ dans le coin.

const SWORD = <path d="M15 2.5h6.5V9L10 20.5 3.5 14z" />;
const GUARD = <path d="M12 2.5 4.5 5.5v5.5c0 5 3.3 8.6 7.5 10.5 4.2-1.9 7.5-5.5 7.5-10.5V5.5z" />;
const BOLT = <path d="M13.5 1.5 4.5 13.5h6l-1.5 9 9.5-12.5h-6.2z" />;

const UP = <path d="M18 23v-7.5M14.6 18.6 18 15l3.4 3.6" stroke="#fff" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
const DOWN = <path d="M18 14.5V22M14.6 18.9 18 22.5l3.4-3.6" stroke="#fff" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
// Petit disque sombre sous la flèche : elle reste lisible sur le dessin.
const BADGE = <circle cx="18" cy="18.8" r="5.6" fill="rgba(10,8,14,0.85)" />;

const GLYPH: Record<StatusId, JSX.Element> = {
  poison: <><path d="M12 2.5c3.3 4.6 6.5 7.6 6.5 11.6a6.5 6.5 0 0 1-13 0c0-4 3.2-7 6.5-11.6z" /><circle cx="10" cy="14.5" r="1.6" fill="rgba(10,8,14,0.75)" /><circle cx="14.2" cy="14.5" r="1.6" fill="rgba(10,8,14,0.75)" /><path d="M10.2 18h3.8" stroke="rgba(10,8,14,0.75)" strokeWidth={1.4} /></>,
  burn: <path d="M12 1.8c1 3.8 5.5 6 5.5 11.2A5.5 5.5 0 0 1 12 21.5 5.8 5.8 0 0 1 6.2 15.7c0-2.6 1.2-4.2 2.6-5.5.1 1.8.8 3 2 3.6-.5-4.3.3-8.3 1.2-12z" />,
  freeze: <g stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" fill="none"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7" /><path d="m9.5 3.8 2.5 2.4 2.5-2.4M9.5 20.2l2.5-2.4 2.5 2.4" /></g>,
  stun: <><path d="m12 1.5 2.3 5.2 5.6-1.3-3.3 4.7 4 4-5.6.6.4 5.7-3.4-4.4-3.4 4.4.4-5.7-5.6-.6 4-4L4.1 5.4l5.6 1.3z" /><circle cx="12" cy="11.4" r="2.6" fill="rgba(10,8,14,0.7)" /></>,
  atkUp: <>{SWORD}{BADGE}{UP}</>,
  atkDown: <>{SWORD}{BADGE}{DOWN}</>,
  defUp: <>{GUARD}{BADGE}{UP}</>,
  defDown: <>{GUARD}{BADGE}{DOWN}</>,
  spdUp: <>{BOLT}{BADGE}{UP}</>,
  spdDown: <>{BOLT}{BADGE}{DOWN}</>,
  taunt: <g fill="none" stroke="currentColor" strokeWidth={2.2}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.6" /><path d="M12 1v4M12 19v4M1 12h4M19 12h4" strokeLinecap="round" /></g>,
  shield: <><path d="M12 2 4 5.2v6c0 5.2 3.4 9 8 11 4.6-2 8-5.8 8-11v-6z" /><path d="M12 5.2v14" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} /></>,
  regen: <><path d="M12 21s-8-5-8-11.2A4.6 4.6 0 0 1 12 6.8a4.6 4.6 0 0 1 8 3c0 6.2-8 11.2-8 11.2z" /><path d="M12 9.5v7M8.5 13h7" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" /></>,
  revive: <><path d="M12 2.5a4.2 4.2 0 0 1 0 8.4 4.2 4.2 0 0 1 0-8.4zm0 2.6a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z" fillRule="evenodd" /><path d="M4.5 11.5h15v2.8h-15zM10.6 13h2.8v9h-2.8z" /></>,
};

/** Symbole d'un effet de combat, dans la couleur de l'effet. */
export function StatusIcon({ id, size = 12 }: { id: StatusId; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="st-ico" style={{ color: STATUS_INFO[id].color, fill: 'currentColor', flex: 'none' }} aria-hidden>
      {GLYPH[id]}
    </svg>
  );
}
