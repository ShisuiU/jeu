import { HERO_BY_ID } from '../data/heroes';
import type { Stats } from '../data/types';
import type { HeroInstance, SaveData } from '../save/schema';
import { applyGearBonus, type GearBonus } from './gear';
import { computeStats } from './stats';
import { heroBonus } from './copies';

export function heroGear(s: SaveData, heroUid: string) {
  return s.equipment.filter((g) => g.heroUid === heroUid);
}

/** Statistiques complètes d'un héros possédé (progression + équipement). */
export function heroTotalStats(s: SaveData, h: HeroInstance): { base: Stats; total: Stats; bonus: GearBonus } {
  const base = computeStats(HERO_BY_ID[h.heroId], h);
  const bonus = heroBonus(s, h);
  return { base, total: applyGearBonus(base, bonus), bonus };
}
