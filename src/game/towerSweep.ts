import type { SaveData } from '../save/schema';
import type { Reward } from '../data/resources';
import { SUMMIT_FROM, towerLevel, towerReward } from '../data/tower';
import { applyReward } from './rewards';
import { track } from './missions';

// TOUR — montée rapide : les étages bien en dessous du niveau de l'équipe se gravissent d'un coup, avec leurs
// récompenses (un joueur qui ouvre la Tour tard n'a pas à refaire des dizaines de combats sans enjeu).
export const SWEEP_MARGIN = 10;

/** Niveau de référence : moyenne des 4 héros les plus hauts. */
function refLevel(s: SaveData): number {
  const lv = s.heroes.map((h) => h.level).sort((a, b) => b - a).slice(0, 4);
  return lv.length ? lv.reduce((a, b) => a + b, 0) / lv.length : 1;
}

/** Dernier étage gravissable d'un coup (0 = aucun) : ennemis 10 niveaux sous l'équipe, jamais les Sommets. */
export function towerSweepMax(s: SaveData): number {
  const ref = refLevel(s);
  let f = 0;
  for (let floor = 1; floor < SUMMIT_FROM; floor++) if (towerLevel(floor) <= ref - SWEEP_MARGIN) f = floor;
  return f > s.progress.tower.floor ? f : 0;
}

/** Gravit les étages d'un coup ; renvoie le nombre d'étages et le butin total. */
export function sweepTower(s: SaveData): { floors: number; reward: Reward } {
  const to = towerSweepMax(s);
  const from = s.progress.tower.floor;
  const total: Record<string, number> = {};
  if (!to) return { floors: 0, reward: {} };
  for (let f = from + 1; f <= to; f++) {
    const r = towerReward(f);
    applyReward(s, r);
    for (const [k, v] of Object.entries(r)) if (typeof v === 'number') total[k] = (total[k] ?? 0) + v;
    track(s, 'towerWin');
  }
  s.progress.tower.floor = to;
  return { floors: to - from, reward: total as Reward };
}
