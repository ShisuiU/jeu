import { normalizeReward, type Reward } from '../data/resources';
import { ACHIEVEMENTS } from '../data/achievements';
import type { SaveData } from '../save/schema';
import { activeMissions, achievementDone, bonusAvailable, claimAchievement, claimBonus, claimMission, missionState, type MissionKind } from './missions';
import { busyHeroes, claimExpedition, condMet, refreshExpeditions, startExpedition, type ExpeditionOffer } from './expeditions';
import { CAMP_MIN_MS, campElapsed, claimCamp } from './camp';
import { collectMine, mineReady } from './buildings';
import { heroTotalStats } from './heroStats';
import { powerOf } from './stats';
import { DAILY_BONUS as DAILY, WEEKLY_BONUS as WEEKLY } from '../data/missions';

// RÉCUPÉRATION GROUPÉE (v1.103.0, phase 3) — la routine quotidienne sans corvée : un geste pour toutes les missions
// terminées (et leur coffre), pour les expéditions revenues (et leur relance avec les meilleurs héros libres), pour le
// Camp et la Mine. Chaque fonction s'appuie sur les fonctions unitaires existantes : mêmes règles, mêmes récompenses.

const add = (a: Reward, b: Reward) => { for (const [k, v] of Object.entries(normalizeReward(b))) a[k as keyof Reward] = (a[k as keyof Reward] ?? 0) + (v as number); return a; };

/** Réclame toutes les missions terminées d'un onglet, puis le coffre s'il s'ouvre. Renvoie le total et le nombre réclamé. */
export function claimAllMissions(s: SaveData, tab: MissionKind | 'progress'): { reward: Reward; count: number } {
  const total: Reward = {}; let count = 0;
  if (tab === 'progress') {
    for (const a of ACHIEVEMENTS) if (!s.achievements.includes(a.id) && achievementDone(s, a.id) && claimAchievement(s, a.id)) { add(total, a.reward); count++; }
    return { reward: total, count };
  }
  for (const m of activeMissions(s, tab)) { const st = missionState(s, tab, m.id); if (st.done && !st.claimed && claimMission(s, tab, m.id)) { add(total, m.reward); count++; } }
  if (bonusAvailable(s, tab) && claimBonus(s, tab)) { add(total, tab === 'daily' ? DAILY : WEEKLY); count++; }
  return { reward: total, count };
}

/** Nombre de missions (et coffre) réclamables d'un onglet. */
export function claimableIn(s: SaveData, tab: MissionKind | 'progress'): number {
  if (tab === 'progress') return ACHIEVEMENTS.filter((a) => !s.achievements.includes(a.id) && achievementDone(s, a.id)).length;
  return activeMissions(s, tab).filter((m) => { const st = missionState(s, tab, m.id); return st.done && !st.claimed; }).length;
}

const power = (s: SaveData, uid: string) => { const h = s.heroes.find((x) => x.uid === uid); return h ? powerOf(heroTotalStats(s, h).total) : 0; };

/** Équipe proposée pour une expédition : le meilleur héros libre qui remplit la condition (bonus +30 %), puis les plus forts. */
export function suggestTeam(s: SaveData, o: ExpeditionOffer, taken: Set<string>): string[] | null {
  const free = s.heroes.filter((h) => !taken.has(h.uid)).sort((a, b) => power(s, b.uid) - power(s, a.uid));
  if (free.length < o.size) return null;
  const pick: string[] = [];
  const fit = free.find((h) => condMet(o.cond, [h.heroId]));
  if (fit) pick.push(fit.uid);
  for (const h of free) { if (pick.length >= o.size) break; if (!pick.includes(h.uid)) pick.push(h.uid); }
  return pick.length === o.size ? pick : null;
}

/** Récupère toutes les expéditions revenues. */
export function claimAllExpeditions(s: SaveData, now: number): { reward: Reward; count: number } {
  const total: Reward = {}; let count = 0;
  for (const run of [...(s.expeditions?.runs ?? [])]) { if (now < run.endsAt) continue; const r = claimExpedition(s, run.offerId, now); if (r.ok && r.reward) { add(total, r.reward); count++; } }
  return { reward: total, count };
}

/** Lance toutes les expéditions du jour encore disponibles, avec l'équipe proposée. Renvoie le nombre lancé. */
export function launchAllExpeditions(s: SaveData, now: number): number {
  const ex = refreshExpeditions(s, now);
  const taken = busyHeroes(s); let n = 0;
  for (const o of ex.offers) {
    if (ex.done.includes(o.id) || ex.runs.some((r) => r.offerId === o.id)) continue;
    const team = suggestTeam(s, o, taken); if (!team) continue;
    if (startExpedition(s, o.id, team, now).ok) { team.forEach((u) => taken.add(u)); n++; }
  }
  return n;
}
/** Expéditions encore lançables aujourd'hui. */
export const launchableExpeditions = (s: SaveData) => (s.expeditions?.offers ?? []).filter((o) => !s.expeditions.done.includes(o.id) && !s.expeditions.runs.some((r) => r.offerId === o.id)).length;

/** Camp + Mine en un geste. */
export function harvestAll(s: SaveData, now: number): { reward: Reward; count: number } {
  const total: Reward = {}; let count = 0;
  if (campElapsed(s, now) >= CAMP_MIN_MS) { const r = claimCamp(s, now); if (r.ok) { add(total, r.reward); count++; } }
  if (mineReady(s, now) >= 1) { const n = collectMine(s, now); if (n > 0) { add(total, { diamonds: n }); count++; } }
  return { reward: total, count };
}
export const harvestReady = (s: SaveData, now: number) => (campElapsed(s, now) >= CAMP_MIN_MS ? 1 : 0) + (mineReady(s, now) >= 1 ? 1 : 0);
