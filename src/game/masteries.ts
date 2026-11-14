import { MASTERIES, MASTERY_BY_ID, MASTERY_RESET_GOLD, MASTERY_TIERS, MAX_ULTIMATES, type MasteryDef } from '../data/masteries';
import type { HeroInstance, SaveData } from '../save/schema';
import type { GearBonus } from './gear';
import { track } from './missions';

export const heroMasteries = (h: HeroInstance) => h.masteries ?? [];

/** Pourquoi une maîtrise ne peut pas être apprise (null si elle le peut). */
export function masteryBlock(s: SaveData, h: HeroInstance, m: MasteryDef): string | null {
  const have = heroMasteries(h);
  if (have.includes(m.id)) return 'Déjà apprise.';
  const t = MASTERY_TIERS[m.tier];
  if (h.level < t.minLevel) return `Niveau ${t.minLevel} requis.`;
  if (m.tier > 1 && !have.includes(`${m.id[0]}${m.tier - 1}`)) return 'Apprends d’abord le palier précédent.';
  if (m.tier === 4 && have.filter((x) => MASTERY_BY_ID[x]?.tier === 4).length >= MAX_ULTIMATES) return `${MAX_ULTIMATES} maîtrises ultimes au plus.`;
  if (s.resources.masteryScroll < t.scrolls) return 'Parchemins insuffisants.';
  if (s.resources.gold < t.gold) return 'Or insuffisant.';
  return null;
}

export function learnMastery(s: SaveData, heroUid: string, id: string): { ok: boolean; reason?: string } {
  const h = s.heroes.find((x) => x.uid === heroUid); const m = MASTERY_BY_ID[id];
  if (!h || !m) return { ok: false, reason: 'Introuvable.' };
  const why = masteryBlock(s, h, m);
  if (why) return { ok: false, reason: why };
  const t = MASTERY_TIERS[m.tier];
  s.resources.masteryScroll -= t.scrolls; s.resources.gold -= t.gold;
  h.masteries = [...heroMasteries(h), id];
  track(s, 'heroUpgrade');
  return { ok: true };
}

/** Parchemins investis dans les maîtrises d'un héros. */
export const masteryScrollsSpent = (h: HeroInstance) => heroMasteries(h).reduce((n, id) => n + (MASTERY_BY_ID[id] ? MASTERY_TIERS[MASTERY_BY_ID[id].tier].scrolls : 0), 0);

export function resetMasteries(s: SaveData, heroUid: string): { ok: boolean; reason?: string; scrolls?: number } {
  const h = s.heroes.find((x) => x.uid === heroUid);
  if (!h || !heroMasteries(h).length) return { ok: false, reason: 'Aucune maîtrise à réinitialiser.' };
  if (s.resources.gold < MASTERY_RESET_GOLD) return { ok: false, reason: 'Or insuffisant.' };
  const scrolls = masteryScrollsSpent(h);
  s.resources.gold -= MASTERY_RESET_GOLD;
  s.resources.masteryScroll += scrolls;
  h.masteries = [];
  return { ok: true, scrolls };
}

/** Ajoute les effets des maîtrises d'un héros aux bonus (équipement, liens). */
export function addMasteryBonus(b: GearBonus, h: HeroInstance): GearBonus {
  const ids = heroMasteries(h);
  if (!ids.length) return b;
  const out: GearBonus = { ...b, flat: { ...b.flat }, pct: { ...b.pct } };
  for (const id of ids) {
    const e = MASTERY_BY_ID[id]?.effect; if (!e) continue;
    for (const [k, v] of Object.entries(e.pct ?? {})) out.pct[k as keyof GearBonus['pct']] += v ?? 0;
    for (const [k, v] of Object.entries(e.flat ?? {})) out.flat[k as keyof GearBonus['flat']] = (out.flat[k as keyof GearBonus['flat']] ?? 0) + (v ?? 0);
    out.lifesteal += e.lifesteal ?? 0; out.regen += e.regen ?? 0; out.startTm += e.startTm ?? 0;
  }
  return out;
}

/** Une maîtrise peut être apprise sur ce héros (pour les pastilles). */
export const canLearnAny = (s: SaveData, h: HeroInstance) => MASTERIES.some((m) => !masteryBlock(s, h, m));
