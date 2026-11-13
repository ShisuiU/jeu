import type { Reward } from './resources';

// CLANS — jusqu'à 30 joueurs. Une discussion, et un boss de clan chaque semaine : les dégâts de tous
// les membres s'additionnent, chaque palier atteint par le clan donne une récompense à chaque membre
// qui a attaqué au moins une fois dans la semaine.
export const GUILD_MAX = 30;
export const GUILD_NAME_MIN = 3;
export const GUILD_NAME_MAX = 20;
export const GUILD_DESC_MAX = 120;
export const CHAT_MAX = 200;

export const GUILD_BOSS = { enemy: 'dead_constellation', name: 'La Constellation morte', level: 60, hpMult: 2000, turnLimit: 40, triesPerDay: 2 };

/** Paliers de dégâts cumulés du clan (semaine). */
export const GUILD_TIERS: { dmg: number; reward: Reward }[] = [
  { dmg: 250_000, reward: { gold: 15000, crystals: 40 } },
  { dmg: 1_000_000, reward: { gold: 25000, crystals: 60, forgeOre: 40 } },
  { dmg: 3_000_000, reward: { crystals: 80, potionMinor: 9, masteryScroll: 2 } },
  { dmg: 6_000_000, reward: { crystals: 100, skillTome: 3, masteryScroll: 3 } },
  { dmg: 10_000_000, reward: { crystals: 150, shardAeon: 1, awakenEssence: 1 } },
  { dmg: 15_000_000, reward: { crystals: 200, shardAeon: 2, masteryScroll: 5 } },
];
