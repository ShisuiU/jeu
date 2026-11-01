import type { Reward } from './resources';

// MISSIONS — objectifs journaliers et hebdomadaires suivis par compteurs (game/missions.ts → track()).
export type TrackKey =
  | 'login' | 'battleWin' | 'campaignWin' | 'dungeonWin' | 'towerWin' | 'arenaFight' | 'arenaWin' | 'worldBoss'
  | 'energySpent' | 'summon' | 'gearUpgrade' | 'heroUpgrade' | 'challengeWin';

export interface MissionDef { id: string; key: TrackKey; target: number; title: string; reward: Reward }

export const DAILY_MISSIONS: MissionDef[] = [
  { id: 'd_login', key: 'login', target: 1, title: 'Se connecter', reward: { gold: 3000 } },
  { id: 'd_win5', key: 'battleWin', target: 5, title: 'Remporter 5 combats', reward: { xpElixir: 3, gold: 3000 } },
  { id: 'd_energy', key: 'energySpent', target: 60, title: 'Dépenser 60 énergie', reward: { crystals: 30 } },
  { id: 'd_dungeon', key: 'dungeonWin', target: 2, title: 'Vaincre 2 étages de donjon', reward: { forgeOre: 20, potionMinor: 2 } },
  { id: 'd_summon', key: 'summon', target: 1, title: 'Invoquer 1 héros', reward: { gold: 5000 } },
  { id: 'd_forge', key: 'gearUpgrade', target: 2, title: 'Améliorer 2 fois un équipement', reward: { forgeOre: 15 } },
  { id: 'd_arena', key: 'arenaFight', target: 2, title: 'Combattre 2 fois dans l’arène', reward: { crystals: 20 } },
];
export const DAILY_BONUS: Reward = { crystals: 80, shardDim: 2 };

export const WEEKLY_MISSIONS: MissionDef[] = [
  { id: 'w_win', key: 'battleWin', target: 40, title: 'Remporter 40 combats', reward: { crystals: 150, skillTome: 2 } },
  { id: 'w_dungeon', key: 'dungeonWin', target: 12, title: 'Vaincre 12 étages de donjon', reward: { potionGreater: 3, forgeOre: 60 } },
  { id: 'w_energy', key: 'energySpent', target: 600, title: 'Dépenser 600 énergie', reward: { shardAeon: 1 } },
  { id: 'w_summon', key: 'summon', target: 10, title: 'Invoquer 10 héros', reward: { crystals: 120 } },
  { id: 'w_boss', key: 'worldBoss', target: 6, title: 'Affronter 6 fois le boss mondial', reward: { rankSigil: 2 } },
  { id: 'w_arena', key: 'arenaWin', target: 10, title: 'Gagner 10 combats d’arène', reward: { crystals: 100, shardDim: 3 } },
  { id: 'w_upgrade', key: 'heroUpgrade', target: 5, title: 'Améliorer 5 fois un héros (rang, ascension, compétence)', reward: { awakenEssence: 2 } },
];
export const WEEKLY_BONUS: Reward = { shardAeon: 2, crystals: 200 };
