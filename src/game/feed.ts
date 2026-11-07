import type { HeroInstance, SaveData } from '../save/schema';
import type { RarityId } from '../data/types';
import { HERO_BY_ID } from '../data/heroes';
import { heroXpToNext, addHeroXp } from './progression';
import { maxLevelForRank } from './stats';
import { busyHeroes } from './expeditions';
import { track } from './missions';
import { masteryScrollsSpent } from './masteries';

// ABSORPTION DE HÉROS (comme la taverne des grands jeux du genre) : on sacrifie des héros dont on n'a plus
// besoin pour donner leur expérience à un autre. Valeur = base selon la rareté + 80 % de l'expérience investie.
const BASE_XP: Record<RarityId, number> = { common: 400, uncommon: 700, rare: 1200, epic: 2200, legendary: 4000, mythic: 6000 };
export const FEED_MAX = 6;
const RETURN = 0.8;
const GOLD_PER_LEVEL = 400;

/** Expérience totale investie dans un héros (niveaux passés + barre en cours). */
export function investedXp(h: HeroInstance): number {
  let t = h.xp;
  for (let l = 1; l < h.level; l++) t += heroXpToNext(l);
  return t;
}
export const feedXp = (h: HeroInstance) => Math.round(BASE_XP[HERO_BY_ID[h.heroId].rarity] + RETURN * investedXp(h));
export const feedGold = (h: HeroInstance) => GOLD_PER_LEVEL * Math.max(1, h.level);

/** Pourquoi un héros ne peut pas être absorbé (ou null s'il le peut). */
export function feedBlock(s: SaveData, targetUid: string, h: HeroInstance): string | null {
  if (h.uid === targetUid) return 'C’est le héros à améliorer.';
  if (h.locked) return 'Verrouillé.';
  if (s.teams.some((t) => t.slots.includes(h.uid))) return 'Dans une équipe.';
  if (busyHeroes(s).has(h.uid)) return 'En expédition.';
  if (s.profile.avatarHeroId === h.heroId) return 'Avatar du profil.';
  return null;
}
/** Héros absorbables, les moins précieux d'abord. */
export function feedCandidates(s: SaveData, targetUid: string): HeroInstance[] {
  return s.heroes.filter((h) => !feedBlock(s, targetUid, h)).sort((a, b) => feedXp(a) - feedXp(b));
}

/** Aperçu : expérience, or, et niveau atteint (plafonné par le rang). */
export function feedPreview(s: SaveData, targetUid: string, uids: string[]) {
  const t = s.heroes.find((h) => h.uid === targetUid);
  const food = uids.map((u) => s.heroes.find((h) => h.uid === u)).filter((h): h is HeroInstance => !!h);
  const xp = food.reduce((n, h) => n + feedXp(h), 0);
  const gold = food.reduce((n, h) => n + feedGold(h), 0);
  if (!t) return { xp, gold, from: 1, to: 1, cap: 1, capped: false };
  const sim = { ...t };
  const r = addHeroXp(sim, xp);
  return { xp, gold, from: t.level, to: sim.level, cap: maxLevelForRank(t.rank), capped: r.capped };
}

/** Absorbe les héros choisis (mutation). Leur équipement retourne au sac. */
export function feedHeroes(s: SaveData, targetUid: string, uids: string[]): { ok: boolean; reason?: string; levels?: number } {
  const t = s.heroes.find((h) => h.uid === targetUid);
  if (!t) return { ok: false, reason: 'Héros introuvable.' };
  if (!uids.length) return { ok: false, reason: 'Choisis au moins un héros.' };
  if (uids.length > FEED_MAX) return { ok: false, reason: `${FEED_MAX} héros au plus à la fois.` };
  if (t.level >= maxLevelForRank(t.rank)) return { ok: false, reason: 'Niveau maximal du rang : monte d’abord de rang.' };
  const food = uids.map((u) => s.heroes.find((h) => h.uid === u));
  if (food.some((h) => !h || feedBlock(s, targetUid, h))) return { ok: false, reason: 'Un des héros ne peut pas être absorbé.' };
  const p = feedPreview(s, targetUid, uids);
  if (s.resources.gold < p.gold) return { ok: false, reason: 'Or insuffisant.' };
  s.resources.gold -= p.gold;
  for (const g of s.equipment) if (g.heroUid && uids.includes(g.heroUid)) g.heroUid = null;
  // Les parchemins investis dans les maîtrises des héros absorbés sont rendus.
  for (const h of food) if (h) s.resources.masteryScroll += masteryScrollsSpent(h);
  s.heroes = s.heroes.filter((h) => !uids.includes(h.uid));
  const before = t.level;
  addHeroXp(t, p.xp);
  track(s, 'heroUpgrade');
  return { ok: true, levels: t.level - before };
}
