import { BALANCE } from '../data/balance';
import { HERO_BY_ID } from '../data/heroes';
import type { ResourceId } from '../data/resources';
import type { HeroInstance, SaveData } from '../save/schema';
import { addHeroXp, heroXpToNext } from './progression';
import { maxLevelForRank } from './stats';
import { track } from './missions';

// AMÉLIORATION DES HÉROS — chaque action vérifie ses conditions et ses coûts, puis modifie la sauvegarde.
// Tous les coûts viennent de data/balance.ts.

export type Cost = Partial<Record<ResourceId, number>> & { fragments?: number };
export interface Check { ok: boolean; reason?: string; cost: Cost }

const U = BALANCE.upgrades;
const find = (s: SaveData, uid: string) => s.heroes.find((h) => h.uid === uid);

function affordable(s: SaveData, h: HeroInstance, cost: Cost): string | undefined {
  for (const [k, v] of Object.entries(cost)) {
    if (!v) continue;
    if (k === 'fragments') { if ((s.heroFragments[h.heroId] ?? 0) < v) return 'Fragments insuffisants.'; }
    else if ((s.resources[k as ResourceId] ?? 0) < v) return 'Ressources insuffisantes.';
  }
  return undefined;
}

function pay(s: SaveData, h: HeroInstance, cost: Cost) {
  for (const [k, v] of Object.entries(cost)) {
    if (!v) continue;
    if (k === 'fragments') s.heroFragments[h.heroId] -= v;
    else s.resources[k as ResourceId] -= v;
  }
}

// ─── Élixirs d'expérience ───
/** Nombre d'élixirs utiles pour atteindre le niveau maximum du rang. */
export function elixirsToCap(h: HeroInstance): number {
  const cap = maxLevelForRank(h.rank);
  if (h.level >= cap) return 0;
  let need = heroXpToNext(h.level) - h.xp;
  for (let l = h.level + 1; l < cap; l++) need += heroXpToNext(l);
  return Math.ceil(need / U.elixirXp);
}

export function useElixirs(s: SaveData, heroUid: string, count: number): { used: number; levels: number; reason?: string } {
  const h = find(s, heroUid);
  if (!h) return { used: 0, levels: 0, reason: 'Héros introuvable.' };
  const start = h.level;
  let used = 0;
  while (used < count && h.level < maxLevelForRank(h.rank)) {
    const gold = U.elixirGoldPerLevel * h.level;
    if (s.resources.xpElixir < 1) return { used, levels: h.level - start, reason: 'Plus d’élixirs.' };
    if (s.resources.gold < gold) return { used, levels: h.level - start, reason: 'Or insuffisant.' };
    s.resources.xpElixir -= 1;
    s.resources.gold -= gold;
    addHeroXp(h, U.elixirXp);
    used++;
  }
  return { used, levels: h.level - start, reason: used === 0 ? 'Niveau maximum du rang atteint.' : undefined };
}

// ─── Rang ───
export function rankUpCheck(s: SaveData, h: HeroInstance): Check {
  const cost: Cost = { rankSigil: h.rank, gold: U.rankGold * h.rank };
  if (h.rank >= BALANCE.hero.maxRank) return { ok: false, reason: 'Rang maximum.', cost };
  if (h.level < maxLevelForRank(h.rank)) return { ok: false, reason: `Atteignez le niveau ${maxLevelForRank(h.rank)}.`, cost };
  const r = affordable(s, h, cost);
  return { ok: !r, reason: r, cost };
}
export function rankUp(s: SaveData, heroUid: string): Check {
  const h = find(s, heroUid)!;
  const c = rankUpCheck(s, h);
  if (c.ok) { pay(s, h, c.cost); h.rank += 1; track(s, 'heroUpgrade'); }
  return c;
}

// ─── Ascension ───
export function ascendCheck(s: SaveData, h: HeroInstance): Check {
  const step = U.ascension[h.ascension];
  if (!step) return { ok: false, reason: 'Ascension maximale.', cost: {} };
  const cost: Cost = { [step.potion]: step.amount, gold: step.gold };
  if (h.level < step.minLevel) return { ok: false, reason: `Niveau ${step.minLevel} requis.`, cost };
  const r = affordable(s, h, cost);
  return { ok: !r, reason: r, cost };
}
export function ascend(s: SaveData, heroUid: string): Check {
  const h = find(s, heroUid)!;
  const c = ascendCheck(s, h);
  if (c.ok) { pay(s, h, c.cost); h.ascension += 1; track(s, 'heroUpgrade'); }
  return c;
}

// ─── Éveil ───
export function awakenCheck(s: SaveData, h: HeroInstance): Check {
  const n = h.awaken + 1;
  const cost: Cost = { fragments: U.awaken.fragmentsBase * n, awakenEssence: U.awaken.essenceBase * n, gold: U.awaken.gold * n };
  if (h.awaken >= BALANCE.hero.maxAwaken) return { ok: false, reason: 'Éveil maximal.', cost };
  if (h.ascension < h.awaken + 2) return { ok: false, reason: `Ascension ${h.awaken + 2} requise.`, cost };
  const r = affordable(s, h, cost);
  return { ok: !r, reason: r, cost };
}
export function awaken(s: SaveData, heroUid: string): Check {
  const h = find(s, heroUid)!;
  const c = awakenCheck(s, h);
  if (c.ok) { pay(s, h, c.cost); h.awaken += 1; track(s, 'heroUpgrade'); }
  return c;
}

// ─── Compétences ───
export function skillCheck(s: SaveData, h: HeroInstance, skillId: string): Check {
  const sk = HERO_BY_ID[h.heroId].skills.find((x) => x.id === skillId);
  const lv = h.skillLevels[skillId] ?? 1;
  const cost: Cost = { skillTome: lv, gold: U.skillGold * lv };
  if (!sk || lv >= sk.upgrades.length + 1) return { ok: false, reason: 'Niveau maximum.', cost };
  const r = affordable(s, h, cost);
  return { ok: !r, reason: r, cost };
}
export function upgradeSkill(s: SaveData, heroUid: string, skillId: string): Check {
  const h = find(s, heroUid)!;
  const c = skillCheck(s, h, skillId);
  if (c.ok) { pay(s, h, c.cost); h.skillLevels[skillId] = (h.skillLevels[skillId] ?? 1) + 1; track(s, 'heroUpgrade'); }
  return c;
}

/** Une amélioration « marquante » (rang, ascension, éveil, compétence) est-elle possible tout de suite ? */
export function canImprove(s: SaveData, h: HeroInstance): boolean {
  if (rankUpCheck(s, h).ok || ascendCheck(s, h).ok || awakenCheck(s, h).ok) return true;
  const d = HERO_BY_ID[h.heroId];
  return !!d && d.skills.some((sk) => skillCheck(s, h, sk.id).ok);
}
