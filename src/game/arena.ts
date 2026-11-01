import { ARENA, ARENA_NAMES } from '../data/arena';
import { HEROES, HERO_BY_ID } from '../data/heroes';
import { RARITIES } from '../data/rarities';
import { uid } from '../core/ids';
import type { ArenaOpponent, SaveData } from '../save/schema';
import { computeStats, maxLevelForRank, powerOf } from './stats';
import type { Rand } from './gear';

const FRONT_ROLES = ['defender', 'attacker', 'assassin'];

/** Niveau de référence du joueur : moyenne de ses 5 meilleurs héros. */
export function playerLevel(s: SaveData): number {
  const lv = s.heroes.map((h) => h.level).sort((a, b) => b - a).slice(0, 5);
  return Math.max(1, Math.round(lv.reduce((a, v) => a + v, 0) / Math.max(1, lv.length)));
}

export function generateOpponents(s: SaveData, r: Rand): ArenaOpponent[] {
  const base = playerLevel(s);
  return [-3, 0, 3].map((off) => {
    const count = 4 + (r() < 0.5 ? 1 : 0);
    const pool = [...HEROES];
    const picks: string[] = [];
    while (picks.length < count) picks.push(pool.splice(Math.floor(r() * pool.length), 1)[0].id);
    // Placement : rôles robustes devant, soutiens derrière.
    picks.sort((a, b) => (FRONT_ROLES.includes(HERO_BY_ID[b].role) ? 1 : 0) - (FRONT_ROLES.includes(HERO_BY_ID[a].role) ? 1 : 0));
    const heroes = picks.map((heroId, i) => {
      const cap = maxLevelForRank(RARITIES[HERO_BY_ID[heroId].rarity].startRank + 1);
      return { heroId, level: Math.max(1, Math.min(cap, base + off)), slot: i };
    });
    const power = heroes.reduce((a, h) => a + powerOf(computeStats(HERO_BY_ID[h.heroId], { level: h.level, rank: RARITIES[HERO_BY_ID[h.heroId].rarity].startRank, ascension: 0, awaken: 0 })), 0);
    return { id: uid('op_'), name: ARENA_NAMES[Math.floor(r() * ARENA_NAMES.length)], heroes, power };
  });
}

export function ratingDelta(won: boolean, opponentIndex: number): number {
  return won ? ARENA.winBase + opponentIndex * 6 : -ARENA.lossPenalty;
}
