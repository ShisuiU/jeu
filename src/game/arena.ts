import { ARENA, ARENA_NAMES, ARENA_TIERS, arenaTier } from '../data/arena';
import { HEROES, HERO_BY_ID } from '../data/heroes';
import { RARITIES } from '../data/rarities';
import { uid } from '../core/ids';
import type { ArenaLogEntry, ArenaOpponent, SaveData } from '../save/schema';
import { computeStats, maxLevelForRank, powerOf } from './stats';
import { applyGearBonus, type GearBonus, type Rand } from './gear';
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
// rangs, compétences et équipement. Les adversaires « Joueur » sont ces vraies équipes, choisies DANS LA MÊME LIGUE
// (Bronze, Argent, Or, Platine, Diamant) que le joueur (v1.68.13).
export interface DefenseHero { refId: string; slot: number; level: number; rank?: number; ascension?: number; awaken?: number; skillLevels?: Record<string, number>; gear?: GearBonus }
export interface ArenaDefense { uid: string; name: string; avatar: string; level: number; power: number; rating: number; team: DefenseHero[]; updatedAt: number }

let defenses: ArenaDefense[] = [];
/** Défenses en ligne chargées par l'écran Arène (pour la session). Les défenses invraisemblables sont écartées. */
export function setArenaDefenses(list: ArenaDefense[]) { defenses = list.filter((d) => d.power > 0 && d.team?.length && d.team.every((h) => HERO_BY_ID[h.refId]) && plausibleDefense(d)); }

/** Puissance réelle d'une défense, recalculée à partir de son équipe (niveaux, rangs, équipement). */
export function defenseRealPower(d: ArenaDefense): number {
  return d.team.reduce((a, h) => {
    const def = HERO_BY_ID[h.refId];
    const raw = computeStats(def, { level: h.level, rank: h.rank ?? RARITIES[def.rarity].startRank, ascension: h.ascension ?? 0, awaken: h.awaken ?? 0 });
    return a + powerOf(h.gear ? applyGearBonus(raw, h.gear) : raw);
  }, 0);
}
/**
 * Anti-triche : une défense trafiquée (niveaux impossibles, équipement gonflé, puissance annoncée fausse)
 * n'est pas proposée comme adversaire.
 */
export function plausibleDefense(d: ArenaDefense): boolean {
  if (d.team.length > 5) return false;
  for (const h of d.team) {
    if (h.level < 1 || h.level > 60 || (h.rank ?? 1) > 6 || (h.ascension ?? 0) > 6 || (h.awaken ?? 0) > 5) return false;
    const g = h.gear;
    // Bonus en % (équipement, ensembles, liens, maîtrises, collection) : au plus ~250 % au maximum réel ; 400 % = impossible.
    if (g && (Object.values(g.pct ?? {}).some((v) => v > 400) || (g.lifesteal ?? 0) > 60 || (g.regen ?? 0) > 20 || (g.startTm ?? 0) > 60)) return false;
  }
  const real = defenseRealPower(d);
  return real <= 150000 && real <= d.power * 1.25 + 500;
}
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

/** Bornes de classement de la ligue d'un joueur : [minimum, maximum exclu] (pas de maximum pour la dernière). */
export function leagueBounds(rating: number): [number, number | null] {
  const t = arenaTier(rating);
  const i = ARENA_TIERS.findIndex((x) => x.id === t.id);
  return [t.min, ARENA_TIERS[i + 1]?.min ?? null];
}
export const sameLeague = (a: number, b: number) => arenaTier(a).id === arenaTier(b).id;

/**
 * Trois adversaires : accessible, équilibré, redoutable.
 * Avec un compte : de vrais joueurs DE LA MÊME LIGUE (quelle que soit leur puissance), choisis au plus près de
 * 70 %, 95 % et 115 % de ta puissance, puis rangés du plus faible au plus fort.
 * S'il n'y en a pas assez : des Héritiers imaginaires calibrés sur ta puissance, annoncés comme tels.
 */
export function generateOpponents(s: SaveData, r: Rand, pool: ArenaDefense[] = defenses): ArenaOpponent[] {
  const target = playerTeamPower(s);
  const used = new Set<string>();
  const league = pool.filter((p) => sameLeague(p.rating ?? ARENA.startRating, s.arena.rating));
  const out = ([[0.7, 3], [0.95, 4], [1.15, 5]] as const).map(([ratio, count]) => {
    const want = target * ratio;
    const real = league.filter((p) => !used.has(p.uid))
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
    return { id: uid('op_'), name: ARENA_NAMES[Math.floor(r() * ARENA_NAMES.length)], heroes, power: teamPower(heroes) } as ArenaOpponent;
  });
  // Du plus faible au plus fort : « Accessible », « Équilibré », « Redoutable » restent vrais.
  return out.sort((a, b) => a.power - b.power);
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

// ACTUALISER LES ADVERSAIRES (v1.68.13) — une fois gratuitement par jour, ensuite 20 cristaux.
export const refreshCost = (s: SaveData) => ((s.arena.refreshes ?? 0) < ARENA.freeRefreshes ? 0 : ARENA.refreshCost);
/** Nouveaux adversaires (mutation). La vengeance en cours est gardée. */
export function refreshOpponents(s: SaveData, r: Rand): { ok: boolean; reason?: string; cost: number } {
  const cost = refreshCost(s);
  if (s.resources.crystals < cost) return { ok: false, reason: 'Cristaux insuffisants.', cost };
  s.resources.crystals -= cost;
  s.arena.refreshes = (s.arena.refreshes ?? 0) + 1;
  s.arena.opponents = [...generateOpponents(s, r), ...s.arena.opponents.filter((o) => o.revenge)];
  return { ok: true, cost };
}
