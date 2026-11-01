import type { Reward } from './resources';
import type { WaveEnemy } from './campaign';
import type { GearRarity } from './equipment';

// DONJONS — 4 donjons de 10 étages. Chaque étage : vagues générées à partir d'un modèle, puis le gardien.
export interface DungeonDef {
  id: string;
  name: string;
  description: string;
  boss: string;
  minions: string[];
  /** Récompense par étage (multipliée selon l'étage). */
  reward: (floor: number) => Reward;
  /** Équipement garanti (donjon d'équipement) : table de rareté selon l'étage. */
  gear?: (floor: number) => [GearRarity, number][];
  color: string;
  icon: 'forge' | 'flask' | 'potion' | 'book';
}

export const DUNGEON_FLOORS = 10;

export const DUNGEONS: DungeonDef[] = [
  {
    id: 'forge', name: 'Forge Engloutie', description: 'Équipement garanti et minerai de forge.', boss: 'forge_golem', minions: ['hollow_shield', 'hollow_soldier', 'hollow_archer'],
    reward: (f) => ({ forgeOre: 10 + f * 6, gold: 800 + f * 300 }),
    gear: (f) => [['uncommon', Math.max(0, 50 - f * 6)], ['rare', 40], ['epic', 6 + f * 4], ['legendary', f >= 6 ? f - 4 : 0]],
    color: '#ff9a3c', icon: 'forge',
  },
  {
    id: 'amber', name: 'Grotte d’Ambre', description: 'Élixirs d’expérience et or.', boss: 'amber_wyrm', minions: ['rift_hound', 'hollow_soldier', 'hollow_archer'],
    reward: (f) => ({ xpElixir: 3 + f * 2, gold: 2000 + f * 900 }),
    color: '#ffcf5a', icon: 'flask',
  },
  {
    id: 'alchemy', name: 'Laboratoire Brisé', description: 'Potions d’ascension.', boss: 'rogue_alchemist', minions: ['hollow_cantor', 'rift_hound', 'hollow_soldier'],
    reward: (f) => (f <= 3 ? { potionMinor: 2 + f * 2 } : f <= 7 ? { potionMinor: 4 + f, potionGreater: f - 2 } : { potionGreater: f, potionSupreme: f - 6 }),
    color: '#7fe7ff', icon: 'potion',
  },
  {
    id: 'archive', name: 'Archives Effacées', description: 'Grimoires de compétence et sceaux de rang.', boss: 'mute_archivist', minions: ['hollow_cantor', 'hollow_knight', 'hollow_archer'],
    reward: (f) => ({ skillTome: 1 + Math.floor(f / 2), ...(f % 3 === 0 ? { rankSigil: 1 } : {}), ...(f >= 8 ? { awakenEssence: 1 } : {}) }),
    color: '#c7a0ff', icon: 'book',
  },
];

export const DUNGEON_BY_ID: Record<string, DungeonDef> = Object.fromEntries(DUNGEONS.map((d) => [d.id, d]));

export function dungeonLevel(floor: number) { return 3 + (floor - 1) * 4; }
export function dungeonEnergy(floor: number) { return 6 + Math.floor(floor / 2); }

export function dungeonWaves(d: DungeonDef, floor: number): WaveEnemy[][] {
  const lv = dungeonLevel(floor);
  const m = d.minions;
  return [
    [{ enemy: m[0], level: lv, slot: 0 }, { enemy: m[1], level: lv, slot: 1 }, { enemy: m[2], level: lv, slot: 2 }],
    [{ enemy: d.boss, level: lv + 1, slot: 1, hpMult: 3 + floor * 0.15 }, { enemy: m[(floor + 1) % 3], level: lv, slot: 3 }, { enemy: m[floor % 3], level: lv, slot: 4 }],
  ];
}
