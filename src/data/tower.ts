import type { Reward } from './resources';
import type { WaveEnemy } from './campaign';

// TOUR DES ÂGES — 50 étages générés par règles. Gratuit (sans énergie), récompense à la première victoire.
export const TOWER_FLOORS = 50;
const POOL = ['hollow_soldier', 'hollow_archer', 'hollow_shield', 'hollow_cantor', 'rift_hound', 'hollow_knight'];

export function towerLevel(floor: number) { return 1 + floor; }

export function towerWaves(floor: number): WaveEnemy[][] {
  const lv = towerLevel(floor);
  const pick = (i: number) => POOL[(floor * 7 + i * 3) % POOL.length];
  const size = 3 + Math.min(2, Math.floor(floor / 10));
  const wave = (offset: number, n: number): WaveEnemy[] => Array.from({ length: n }, (_, i) => ({ enemy: pick(i + offset), level: lv, slot: [0, 1, 2, 3, 4][i] }));
  if (floor % 10 === 0) {
    return [wave(0, 3), [{ enemy: 'tower_sentinel', level: lv, slot: 1, hpMult: 1.6 + floor / 50 }, { enemy: pick(1), level: lv, slot: 3 }, { enemy: pick(2), level: lv, slot: 4 }]];
  }
  return floor >= 4 ? [wave(0, size), wave(2, size)] : [wave(0, size)];
}

export function towerReward(floor: number): Reward {
  if (floor % 10 === 0) return { crystals: 150 + floor * 5 + (floor === 50 ? 300 : 0), shardAeon: floor >= 30 ? 2 : 1 };
  if (floor % 5 === 0) return { crystals: 60, skillTome: 1, potionMinor: 3 };
  return { gold: 1500 + floor * 200, crystals: 20 };
}
