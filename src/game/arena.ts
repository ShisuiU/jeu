import { ARENA, ARENA_NAMES } from '../data/arena';
import { HEROES, HERO_BY_ID } from '../data/heroes';
import { RARITIES } from '../data/rarities';
import { uid } from '../core/ids';
import type { ArenaLogEntry, ArenaOpponent, SaveData } from '../save/schema';
import { computeStats, maxLevelForRank, powerOf } from './stats';
import type { GearBonus, Rand } from './gear';
import { teamSetups } from './campaign';
import { heroTotalStats } from './heroStats';

const FRONT_ROLES = ['defender', 'attacker', 'assassin'];


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

// ARÈNE RÉELLE — chaque joueur connecté publie son équipe de défense (defenses/{uid}) : héros, niveaux,
// rangs, compétences et équipement. Les adversaires « Joueur » sont ces vraies équipes, choisies par puissance.
export interface DefenseHero { refId: string; slot: number; level: number; rank?: number; ascension?: number; awaken?: number; skillLevels?: Record<string, number>; gear?: GearBonus }
export interface ArenaDefense { uid: string; name: string; avatar: string; level: number; power: number; rating: number; team: DefenseHero[]; updatedAt: number }

let defenses: ArenaDefense[] = [];
/** Défenses en ligne chargées par l'écran Arène (pour la session). */
export function setArenaDefenses(list: ArenaDefense[]) { defenses = list.filter((d) => d.power > 0 && d.team?.length && d.team.every((h) => HERO_BY_ID[h.refId])); }
export const arenaDefenses = () => defenses;

/** L'équipe publiée en défense : celle choisie, sinon l'équipe active. */
export function defenseTeam(s: SaveData) {
  return s.teams.find((t) => t.id === s.arena.defenseTeamId) ?? s.teams.find((t) => t.id === s.activeTeamId) ?? s.teams[0];
}
export function defenseDoc(s: SaveData, now: number): Omit<ArenaDefense, 'uid'> {
  const team = defenseTeam(s);
  const heroes = team.slots.map((u) => s.heroes.find((h) => h.uid === u)).filter((h): h is SaveData['heroes'][number] => !!h);
  return {
    name: (s.profile.name || 'Lien').trim().slice(0, 18), avatar: s.profile.avatarHeroId, level: s.profile.level, rating: Math.round(s.arena.rating),
    power: heroes.reduce((a, h) => a + powerOf(heroTotalStats(s, h).total), 0),
    team: teamSetups(s, team).map(({ refId, slot, level, rank, ascension, awaken, skillLevels, gear }) => ({ refId, slot, level, rank, ascension, awaken, skillLevels: skillLevels ?? {}, ...(gear ? { gear } : {}) })),
    updatedAt: now,
  };
}
export function opponentFromDefense(d: ArenaDefense, revenge?: string): ArenaOpponent {
  return {
    id: uid('op_'), name: d.name, avatar: d.avatar, power: d.power, real: true, uid: d.uid, ...(revenge ? { revenge } : {}),
    heroes: d.team.map((h) => ({ heroId: h.refId, level: h.level, slot: h.slot, rank: h.rank, ascension: h.ascension, awaken: h.awaken, skillLevels: h.skillLevels, gear: h.gear })),
  };
}

/**
 * Trois adversaires calibrés sur la puissance du joueur : accessible, équilibré, redoutable.
 * Avec un compte et des joueurs en ligne de puissance proche : leurs vraies équipes de défense.
 * Sinon, un Héritier imaginaire, annoncé comme tel.
 */
export function generateOpponents(s: SaveData, r: Rand, pool: ArenaDefense[] = defenses): ArenaOpponent[] {
  const target = playerTeamPower(s);
  const used = new Set<string>();
  return ([[0.7, 3], [0.95, 4], [1.15, 5]] as const).map(([ratio, count]) => {
    const want = target * ratio;
    const real = pool.filter((p) => !used.has(p.uid) && Math.abs(p.power - want) <= want * 0.35)
      .sort((a, b) => Math.abs(a.power - want) - Math.abs(b.power - want))[0];
    if (real) { used.add(real.uid); return opponentFromDefense(real); }
    const heroPool = [...HEROES];
    const picks: string[] = [];
    while (picks.length < count) picks.push(heroPool.splice(Math.floor(r() * heroPool.length), 1)[0].id);
    picks.sort((a, b) => (FRONT_ROLES.includes(HERO_BY_ID[b].role) ? 1 : 0) - (FRONT_ROLES.includes(HERO_BY_ID[a].role) ? 1 : 0));
    // Niveau choisi pour approcher la puissance visée.
    let level = 1;
    for (let lv = 1; lv <= 60; lv++) {
      if (teamPower(picks.map((heroId) => ({ heroId, level: lv }))) > want) break;
      level = lv;
    }
    const heroes = picks.map((heroId, i) => ({ heroId, level: Math.min(level, maxLevelForRank(RARITIES[HERO_BY_ID[heroId].rarity].startRank + 1)), slot: i }));
    return { id: uid('op_'), name: ARENA_NAMES[Math.floor(r() * ARENA_NAMES.length)], heroes, power: teamPower(heroes) };
  });
}

// Journal de défense : points gagnés ou perdus par la défense, appliqués au classement du défenseur.
export const DEFENSE_LOSS = 6;
export const DEFENSE_WIN = 3;
/** Points que l'attaquant inscrit dans le journal du défenseur. */
export const defensePoints = (attackerWon: boolean) => (attackerWon ? DEFENSE_LOSS : DEFENSE_WIN);

/** Applique au classement les combats de défense pas encore comptés ; garde les 20 derniers. (mutation) */
export function applyDefenseLog(s: SaveData, entries: ArenaLogEntry[]): { won: number; lost: number; delta: number } {
  const fresh = entries.filter((e) => e.at > s.arena.logSeen && !s.arena.log.some((x) => x.id === e.id));
  let delta = 0, won = 0, lost = 0;
  for (const e of fresh) {
    const pts = Math.min(20, Math.max(0, Math.round(e.points)));
    if (e.won) { delta -= pts; lost++; } else { delta += pts; won++; }
  }
  if (fresh.length) {
    s.arena.rating = Math.max(0, s.arena.rating + delta);
    s.arena.logSeen = Math.max(s.arena.logSeen, ...fresh.map((e) => e.at));
    s.arena.log = [...fresh, ...s.arena.log].sort((a, b) => b.at - a.at).slice(0, 20);
  }
  return { won, lost, delta };
}

export function ratingDelta(won: boolean, opponentIndex: number): number {
  return won ? ARENA.winBase + opponentIndex * 6 : -ARENA.lossPenalty;
}
