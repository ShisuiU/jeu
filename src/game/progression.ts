import { maxLevelForRank } from './stats';
import type { HeroInstance, SaveData } from '../save/schema';
import { energyMax } from './energy';

/** Expérience nécessaire pour passer du niveau L au niveau L+1. */
export function heroXpToNext(level: number): number {
  return Math.round(80 + 40 * level + 6 * level * level);
}

/** Ajoute de l'expérience à un héros (mutation). Au niveau maximum du rang, l'expérience excédentaire est perdue. */
export function addHeroXp(h: HeroInstance, amount: number): { gained: number; capped: boolean } {
  const cap = maxLevelForRank(h.rank);
  const start = h.level;
  if (h.level >= cap) { h.xp = 0; return { gained: 0, capped: true }; }
  h.xp += amount;
  while (h.level < cap && h.xp >= heroXpToNext(h.level)) {
    h.xp -= heroXpToNext(h.level);
    h.level += 1;
  }
  if (h.level >= cap) h.xp = 0;
  return { gained: h.level - start, capped: h.level >= cap };
}

/** Expérience de compte pour passer au niveau suivant (v1.70.1 : bien plus lente). Chaque énergie dépensée en donne 10 ;
 *  une barre d'énergie pleine suffit pour ~2 niveaux au tout début, puis il en faut de plus en plus : ~2 barres au
 *  niveau 10, 3 au niveau 20, 4 au niveau 30, 6 au niveau 50. Avant, une barre rechargée donnait plus d'un niveau,
 *  qui la rechargeait à nouveau : on montait en boucle. */
export function accountXpToNext(level: number): number {
  return 200 + 250 * level + 10 * level * level;
}

/** Expérience de compte (gagnée en dépensant de l'énergie). Chaque niveau donne de l'or et de l'énergie. */
export function addAccountXp(s: SaveData, amount: number): number {
  let ups = 0;
  s.profile.xp += amount;
  while (s.profile.xp >= accountXpToNext(s.profile.level)) {
    s.profile.xp -= accountXpToNext(s.profile.level);
    s.profile.level += 1;
    ups += 1;
    s.resources.gold += 2000;
    // Nouveau niveau de compte : maximum d'énergie relevé, et énergie rechargée jusqu'au nouveau maximum
    // (un surplus au-delà, venu des récompenses, est gardé).
    const m = energyMax(s.profile.level);
    if (s.energy.current < m) s.energy = { ...s.energy, current: m };
  }
  return ups;
}
