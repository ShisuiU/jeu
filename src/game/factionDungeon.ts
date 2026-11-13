import { BALANCE } from '../data/balance';
import { FACTION_FLOORS, FACTION_ORDER, FACTION_STAR_MILESTONES } from '../data/factionDungeon';
import { applyReward } from './rewards';
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
  if (floor < 1 || floor > factionBest(s, f) + 1 || floor > FACTION_FLOORS) return { ok: false, reason: 'Étage indisponible.' };
  if (!factionTeam(s, f).slots.some(Boolean)) return { ok: false, reason: 'Aucun héros de cette famille dans ton équipe.' };
  return { ok: true };
}

// ─── Étoiles (v1.83.0) ───
/** Étoiles d'un étage (les étages conquis avant les étoiles en comptent 1, à améliorer en les rejouant). */
export function floorStars(s: SaveData, f: FactionId, floor: number): number {
  const v = s.factionDungeon.stars?.[f]?.[floor - 1];
  return v ?? (floor <= factionBest(s, f) ? 1 : 0);
}
export const familyStars = (s: SaveData, f: FactionId) => Array.from({ length: FACTION_FLOORS }, (_, i) => floorStars(s, f, i + 1)).reduce((a, b) => a + b, 0);
export const totalFactionStars = (s: SaveData) => FACTION_ORDER.reduce((a, f) => a + familyStars(s, f), 0);
/** Note les étoiles d'un étage (garde la meilleure). Renvoie vrai si elles ont progressé. */
export function recordFloorStars(s: SaveData, f: FactionId, floor: number, stars: number): boolean {
  const prev = floorStars(s, f, floor);
  const arr = (s.factionDungeon.stars[f] ??= []);
  while (arr.length < floor) arr.push(arr.length < factionBest(s, f) ? 1 : 0);
  arr[floor - 1] = Math.max(prev, stars);
  return stars > prev;
}
export const milestoneClaimed = (s: SaveData, i: number) => s.factionDungeon.claimed.includes(FACTION_STAR_MILESTONES[i].stars);
/** Paliers atteints et pas encore réclamés. */
export const claimableMilestones = (s: SaveData) => { const t = totalFactionStars(s); return FACTION_STAR_MILESTONES.map((_m, i) => i).filter((i) => FACTION_STAR_MILESTONES[i].stars <= t && !milestoneClaimed(s, i)); };
export function claimFactionMilestone(s: SaveData, i: number): { ok: boolean; reason?: string } {
  const m = FACTION_STAR_MILESTONES[i];
  if (!m) return { ok: false, reason: 'Palier inconnu.' };
  if (milestoneClaimed(s, i)) return { ok: false, reason: 'Déjà réclamé.' };
  if (totalFactionStars(s) < m.stars) return { ok: false, reason: `Il faut ${m.stars} étoiles.` };
  applyReward(s, m.reward);
  s.factionDungeon.claimed.push(m.stars);
  return { ok: true };
}
