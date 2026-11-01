import type { Reward } from './resources';
import type { WaveEnemy } from './campaign';

// TOUR DES ÂGES — 50 étages générés par règles. Gratuit (sans énergie), récompense à la première victoire.
export const TOWER_FLOORS = 50;
const POOL = ['hollow_soldier', 'hollow_archer', 'hollow_shield', 'hollow_cantor', 'rift_hound', 'hollow_knight'];

export function towerLevel(floor: number) { return 2 + Math.round(floor * 1.15); }

export function towerWaves(floor: number): WaveEnemy[][] {
  const lv = towerLevel(floor);
  const pick = (i: number) => POOL[(floor * 7 + i * 3) % POOL.length];
  if (floor % 10 === 0) {
    return [[{ enemy: 'tower_sentinel', level: lv + 2, slot: 1, hpMult: 3 + floor / 10 }, { enemy: pick(1), level: lv, slot: 3 }, { enemy: pick(2), level: lv, slot: 4 }]];
  }
  const size = 2 + Math.min(3, Math.floor(floor / 8));
  return [Array.from({ length: size }, (_, i) => ({ enemy: pick(i), level: lv, slot: [0, 1, 2, 3, 4][i] }))];
}

export function towerReward(floor: number): Reward {
  if (floor % 10 === 0) return { crystals: 150 + floor * 5, shardAeon: floor >= 30 ? 2 : 1, ...(floor === 50 ? { shardPrimal: 1 } : {}) };
  if (floor % 5 === 0) return { crystals: 60, skillTome: 1, potionMinor: 3 };
  return { gold: 1500 + floor * 200, crystals: 20 };
}
