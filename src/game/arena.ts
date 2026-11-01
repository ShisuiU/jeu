import { ARENA, ARENA_NAMES } from '../data/arena';
import { HEROES, HERO_BY_ID } from '../data/heroes';
import { RARITIES } from '../data/rarities';
import { uid } from '../core/ids';
import type { ArenaOpponent, SaveData } from '../save/schema';
import { computeStats, maxLevelForRank, powerOf } from './stats';
import type { Rand } from './gear';
import { heroTotalStats } from './heroStats';

const FRONT_ROLES = ['defender', 'attacker', 'assassin'];

/** Niveau de référence du joueur : moyenne de ses 5 meilleurs héros. */
export function playerLevel(s: SaveData): number {
  const lv = s.heroes.map((h) => h.level).sort((a, b) => b - a).slice(0, 5);
  return Math.max(1, Math.round(lv.reduce((a, v) => a + v, 0) / Math.max(1, lv.length)));
}

/** Puissance de l'équipe active du joueur (avec équipement). */
export function playerTeamPower(s: SaveData): number {
  const team = s.teams.find((t) => t.id === s.activeTeamId) ?? s.teams[0];
  const members = team.slots.map((u) => s.heroes.find((h) => h.uid === u)).filter(Boolean) as SaveData['heroes'];
  const list = members.length ? members : [...s.heroes].sort((a, b) => b.level - a.level).slice(0, 4);
  return list.reduce((a, h) => a + powerOf(heroTotalStats(s, h).total), 0);
}

function teamPower(heroes: { heroId: string; level: number }[]): number {
  return heroes.reduce((a, h) => a + powerOf(computeStats(HERO_BY_ID[h.heroId], { level: h.level, rank: RARITIES[HERO_BY_ID[h.heroId].rarity].startRank, ascension: 0, awaken: 0 })), 0);
}

/** Trois adversaires calibrés sur la puissance du joueur : accessible, équilibré, redoutable. */
export function generateOpponents(s: SaveData, r: Rand): ArenaOpponent[] {
  const target = playerTeamPower(s);
  return ([[0.7, 3], [0.95, 4], [1.15, 5]] as const).map(([ratio, count]) => {
    const pool = [...HEROES];
    const picks: string[] = [];
    while (picks.length < count) picks.push(pool.splice(Math.floor(r() * pool.length), 1)[0].id);
    picks.sort((a, b) => (FRONT_ROLES.includes(HERO_BY_ID[b].role) ? 1 : 0) - (FRONT_ROLES.includes(HERO_BY_ID[a].role) ? 1 : 0));
    // Niveau choisi pour approcher la puissance visée.
    let level = 1;
    for (let lv = 1; lv <= 60; lv++) {
      if (teamPower(picks.map((heroId) => ({ heroId, level: lv }))) > target * ratio) break;
      level = lv;
    }
    const heroes = picks.map((heroId, i) => ({ heroId, level: Math.min(level, maxLevelForRank(RARITIES[HERO_BY_ID[heroId].rarity].startRank + 1)), slot: i }));
    return { id: uid('op_'), name: ARENA_NAMES[Math.floor(r() * ARENA_NAMES.length)], heroes, power: teamPower(heroes) };
  });
}

export function ratingDelta(won: boolean, opponentIndex: number): number {
  return won ? ARENA.winBase + opponentIndex * 6 : -ARENA.lossPenalty;
}
