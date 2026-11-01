import type { Reward } from './resources';

// BOSS MONDIAL — le Colosse de Bronze. On ne cherche pas à le vaincre : chaque combat dure un nombre
// limité de tours, et les récompenses dépendent des dégâts infligés. 3 clés par jour.
export const WORLD_BOSS = { enemy: 'bronze_colossus', name: 'Le Colosse de Bronze', keysPerDay: 3, turnLimit: 45 };

export interface BossTier { id: string; name: string; level: number; hpMult: number; reward: Reward }
export const BOSS_TIERS: BossTier[] = [
  { id: 'normal', name: 'Normal', level: 8, hpMult: 40, reward: { gold: 6000, forgeOre: 20, crystals: 30 } },
  { id: 'hard', name: 'Difficile', level: 22, hpMult: 45, reward: { gold: 12000, forgeOre: 40, crystals: 60, potionMinor: 4 } },
  { id: 'expert', name: 'Expert', level: 38, hpMult: 50, reward: { gold: 20000, forgeOre: 60, crystals: 100, potionGreater: 3, skillTome: 2 } },
  { id: 'nightmare', name: 'Cauchemar', level: 55, hpMult: 55, reward: { gold: 35000, forgeOre: 90, crystals: 160, potionSupreme: 3, shardAeon: 1 } },
];

/** Paliers de dégâts (en % des PV du boss) : chaque palier atteint donne une part de la récompense du niveau. */
export const DAMAGE_CHESTS = [5, 15, 30, 50, 75, 100];
