import { SPECS, SPEC_CHANGE_GOLD } from '../data/specs';
import { HERO_BY_ID } from '../data/heroes';
import type { HeroInstance, SaveData } from '../save/schema';
import type { GearBonus } from './gear';

export const specOf = (h: HeroInstance) => (h.spec ? SPECS[HERO_BY_ID[h.heroId].role][h.spec] : null);
export const canSpec = (h: HeroInstance) => h.level >= 60;

/** Choisit la voie d'un héros (mutation) : niveau 60 requis ; premier choix gratuit, changement contre de l'or. */
export function chooseSpec(s: SaveData, uid: string, which: 'a' | 'b'): { ok: boolean; reason?: string } {
  const h = s.heroes.find((x) => x.uid === uid); if (!h) return { ok: false, reason: 'Héros introuvable.' };
  if (!canSpec(h)) return { ok: false, reason: 'La voie s’ouvre au niveau 60.' };
  if (h.spec === which) return { ok: false, reason: 'Voie déjà choisie.' };
  if (h.spec) { if (s.resources.gold < SPEC_CHANGE_GOLD) return { ok: false, reason: `Il faut ${SPEC_CHANGE_GOLD} or pour changer de voie.` }; s.resources.gold -= SPEC_CHANGE_GOLD; }
  h.spec = which;
  return { ok: true };
}

/** Ajoute le bonus de la voie au bonus d'un héros. */
export function addSpecBonus(b: GearBonus, h: HeroInstance): GearBonus {
  const sp = specOf(h); if (!sp) return b;
  const pct = { ...b.pct };
  for (const [k, v] of Object.entries(sp.pct ?? {})) pct[k as keyof typeof pct] += v ?? 0;
  return { ...b, pct, lifesteal: b.lifesteal + (sp.lifesteal ?? 0), regen: b.regen + (sp.regen ?? 0), startTm: b.startTm + (sp.startTm ?? 0) };
}
