import { BALANCE } from '../data/balance';
import { FACTION_FLOORS, FACTION_ORDER } from '../data/factionDungeon';
import { HERO_BY_ID } from '../data/heroes';
import type { FactionId } from '../data/types';
import type { SaveData, TeamPreset } from '../save/schema';
import { heroTotalStats } from './heroStats';
import { powerOf } from './stats';

const DAY = 86_400_000;
/** Numéro du jour de jeu (le jour commence au renouvellement quotidien, heure locale). */
function dayIndex(now: number): number {
  const d = new Date(now - BALANCE.time.dailyResetHour * 3600_000);
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
}
/** Famille du donjon du jour (et des jours suivants avec offset). */
export const factionOfDay = (now: number, offset = 0): FactionId => FACTION_ORDER[(((dayIndex(now) + offset) % 6) + 6) % 6];
/** Prochain changement de donjon. */
export function nextRotation(now: number): number {
  const R = BALANCE.time.dailyResetHour;
  const d = new Date(now - R * 3600_000);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, R, 0, 0, 0).getTime();
}

export const factionBest = (s: SaveData, f: FactionId) => s.factionDungeon.best[f] ?? 0;
export const factionHeroes = (s: SaveData, f: FactionId) => s.heroes.filter((h) => HERO_BY_ID[h.heroId]?.faction === f);

/** Équipe du donjon d'une famille : celle choisie par le joueur, sinon ses 5 meilleurs héros de la famille. */
export function factionTeam(s: SaveData, f: FactionId): TeamPreset {
  const own = new Set(factionHeroes(s, f).map((h) => h.uid));
  let uids = (s.factionDungeon.teams[f] ?? []).filter((u): u is string => !!u && own.has(u));
  if (!s.factionDungeon.teams[f]) {
    uids = factionHeroes(s, f).sort((a, b) => powerOf(heroTotalStats(s, b).total) - powerOf(heroTotalStats(s, a).total)).slice(0, 5).map((h) => h.uid);
  }
  const slots = Array.from({ length: 5 }, (_, i) => uids[i] ?? null);
  return { id: `faction_${f}`, name: 'Équipe de la famille', slots, leader: uids[0] ?? null };
}
/** Choisit l'équipe d'une famille (mutation) : 5 héros de la famille au plus, le premier est le chef. */
export function setFactionTeam(s: SaveData, f: FactionId, uids: string[]) {
  const own = new Set(factionHeroes(s, f).map((h) => h.uid));
  s.factionDungeon.teams[f] = uids.filter((u) => own.has(u)).slice(0, 5);
}

export function canEnterFaction(s: SaveData, f: FactionId, floor: number, now: number): { ok: boolean; reason?: string } {
  if (f !== factionOfDay(now)) return { ok: false, reason: 'Ce donjon est fermé aujourd’hui : il reviendra dans la rotation.' };
  if (floor !== factionBest(s, f) + 1 || floor > FACTION_FLOORS) return { ok: false, reason: 'Étage indisponible.' };
  if (!factionTeam(s, f).slots.some(Boolean)) return { ok: false, reason: 'Aucun héros de cette famille dans ton équipe.' };
  return { ok: true };
}
