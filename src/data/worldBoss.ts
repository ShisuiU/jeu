import type { Reward } from './resources';

// BOSS MONDIAL — le Colosse de Bronze. On ne cherche pas à le vaincre : chaque combat dure un nombre
// limité de tours, et la récompense est la part de la récompense maximale égale à la part des PV infligée
// (v1.114.0 : 37 % des PV = 37 % de la récompense). 3 clés par jour.
export const WORLD_BOSS = { enemy: 'bronze_colossus', name: 'Le Colosse de Bronze', keysPerDay: 3, turnLimit: 45 };

export interface BossTier { id: string; name: string; level: number; hpMult: number; reward: Reward }
export const BOSS_TIERS: BossTier[] = [
  { id: 'normal', name: 'Normal', level: 8, hpMult: 80, reward: { gold: 6000, forgeOre: 20, crystals: 15 } },
  { id: 'hard', name: 'Difficile', level: 22, hpMult: 90, reward: { gold: 12000, forgeOre: 40, crystals: 25, potionMinor: 4, masteryScroll: 1 } },
  { id: 'expert', name: 'Expert', level: 38, hpMult: 100, reward: { gold: 20000, forgeOre: 60, crystals: 40, potionMinor: 9, skillTome: 2, masteryScroll: 2 } },
  { id: 'nightmare', name: 'Cauchemar', level: 55, hpMult: 110, reward: { gold: 35000, forgeOre: 90, crystals: 60, potionMinor: 18, shardAeon: 1, masteryScroll: 3 } },
];

/** Repères affichés sur la barre de progression (en % des PV). La récompense, elle, est proportionnelle aux dégâts (v1.114.0) ;
 *  PV doublés à la même version (retour du joueur : boss trop facile, récompense maximale à chaque clé). */
export const DAMAGE_CHESTS = [5, 15, 30, 50, 75, 100];

/** Part de la récompense maximale gagnée pour `pct` % des PV infligés (0 à 100). Les objets rares arrondis à 0 ne sont pas donnés. */
export function bossShare(r: Reward, pct: number, bonus = 1): Reward {
  const f = Math.max(0, Math.min(100, pct)) / 100 * bonus;
  const o: Reward = {};
  for (const [k, v] of Object.entries(r)) { const n = Math.round((v ?? 0) * f); if (n > 0) o[k as keyof Reward] = n; }
  return o;
}
