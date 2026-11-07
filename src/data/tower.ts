import type { Reward } from './resources';
import type { WaveEnemy } from './campaign';

// TOUR DES ÂGES — 100 étages générés par règles. Gratuit (sans énergie), récompense à la première victoire.
// Étages 1 à 50 : les Effacés du Mur Blanc. Étages 51 à 100 (les Sommets) : les ennemis de toutes les régions,
// de plus en plus puissants, et un boss de chapitre tous les 10 étages. Le défi de fin de jeu.
export const TOWER_FLOORS = 100;
export const SUMMIT_FROM = 51;
const POOL = ['hollow_soldier', 'hollow_archer', 'hollow_shield', 'hollow_cantor', 'rift_hound', 'hollow_knight'];
const SUMMIT_POOL = ['thorn_wisp', 'feral_stalker', 'glass_guard', 'data_wraith', 'sand_reaver', 'bronze_hoplite', 'dune_seer', 'chain_warden', 'pyre_priest',
  'void_weaver', 'fallen_seraph', 'hollow_heir', 'echo_wanderer', 'seam_stalker', 'stitch_golem', 'brine_siren', 'abyss_angler', 'tide_knight'];
const SUMMIT_BOSSES: Record<number, string> = { 60: 'scorpion_king', 70: 'ash_lord', 80: 'dead_constellation', 90: 'weaver_of_ages', 100: 'leviathan_oblivion' };

export function towerLevel(floor: number) { return floor < SUMMIT_FROM ? 1 + floor : Math.min(70, 1 + floor); }
/** Puissance des Sommets : +SUMMIT_STEP par étage au-delà du 50ᵉ. */
export const SUMMIT_STEP = 0.15;
export const towerStatMult = (floor: number) => (floor < SUMMIT_FROM ? 1 : 1 + (floor - 50) * SUMMIT_STEP);

export function towerWaves(floor: number): WaveEnemy[][] {
  if (floor >= SUMMIT_FROM) return summitWaves(floor);
  const lv = towerLevel(floor);
  const pick = (i: number) => POOL[(floor * 7 + i * 3) % POOL.length];
  const size = 3 + Math.min(2, Math.floor(floor / 10));
  const wave = (offset: number, n: number): WaveEnemy[] => Array.from({ length: n }, (_, i) => ({ enemy: pick(i + offset), level: lv, slot: [0, 1, 2, 3, 4][i] }));
  if (floor % 10 === 0) {
    return [wave(0, 3), [{ enemy: 'tower_sentinel', level: lv, slot: 1, hpMult: 1.6 + floor / 50 }, { enemy: pick(1), level: lv, slot: 3 }, { enemy: pick(2), level: lv, slot: 4 }]];
  }
  return floor >= 4 ? [wave(0, size), wave(2, size)] : [wave(0, size)];
}

function summitWaves(floor: number): WaveEnemy[][] {
  const lv = towerLevel(floor); const m = towerStatMult(floor);
  const pick = (i: number) => SUMMIT_POOL[(floor * 7 + i * 5) % SUMMIT_POOL.length];
  const wave = (offset: number): WaveEnemy[] => Array.from({ length: 5 }, (_, i) => ({ enemy: pick(i + offset), level: lv, slot: i, statMult: m }));
  const boss = SUMMIT_BOSSES[floor];
  if (boss) return [wave(0), [{ enemy: boss, level: lv, slot: 1, hpMult: 2 + (floor - 50) / 25, statMult: m }, { enemy: pick(1), level: lv, slot: 3, statMult: m }, { enemy: pick(2), level: lv, slot: 4, statMult: m }]];
  return [wave(0), wave(3)];
}

export function towerReward(floor: number): Reward {
  if (floor >= SUMMIT_FROM) {
    if (floor % 10 === 0) return { crystals: 220 + floor * 5 + (floor === 100 ? 600 : 0), shardAeon: 2, masteryScroll: 5, awakenEssence: 1 };
    if (floor % 5 === 0) return { crystals: 80, skillTome: 2, potionGreater: 2 };
    return { gold: 4000 + floor * 250, crystals: 25 };
  }
  if (floor % 10 === 0) return { crystals: 150 + floor * 5 + (floor === 50 ? 300 : 0), shardAeon: floor >= 30 ? 2 : 1, masteryScroll: 4 };
  if (floor % 5 === 0) return { crystals: 60, skillTome: 1, potionMinor: 3 };
  return { gold: 1500 + floor * 200, crystals: 20 };
}
