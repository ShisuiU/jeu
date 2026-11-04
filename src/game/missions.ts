import { DAILY_BONUS, DAILY_MISSIONS, WEEKLY_BONUS, WEEKLY_MISSIONS, type TrackKey } from '../data/missions';
import { ACHIEVEMENTS } from '../data/achievements';
import { dayKey, weekKey } from '../core/time';
import type { SaveData } from '../save/schema';
import { applyReward } from './rewards';
import { activeEvents, milestoneState } from './events';

/** Remet à zéro missions, clés de boss et tickets d'arène au changement de jour/semaine (mutation). */
export function applyResets(s: SaveData, now: number): boolean {
  const d = dayKey(now), w = weekKey(now);
  let changed = false;
  if (s.resets.day !== d) {
    s.resets.day = d;
    s.missions.daily = { counters: {}, claimed: [], bonus: false };
    s.worldBoss.keysUsed = 0;
    s.arena.ticketsUsed = 0;
    s.shop.energyRefills = 0;
    changed = true;
  }
  if (s.resets.week !== w) {
    s.resets.week = w;
    s.missions.weekly = { counters: {}, claimed: [], bonus: false };
    changed = true;
  }
  return changed;
}

/** Enregistre une action du joueur pour les missions et les objectifs d'événement (mutation). */
export function track(s: SaveData, key: TrackKey, n = 1) {
  const now = s.time.highWater;
  applyResets(s, now);
  for (const m of [s.missions.daily, s.missions.weekly]) m.counters[key] = (m.counters[key] ?? 0) + n;
  for (const e of activeEvents(now)) {
    const p = (s.events[e.id] ??= { counters: {}, claimed: [], challengeDone: false });
    p.counters[key] = (p.counters[key] ?? 0) + n;
  }
}

export type MissionKind = 'daily' | 'weekly';
const DEFS = { daily: DAILY_MISSIONS, weekly: WEEKLY_MISSIONS };
const BONUS = { daily: DAILY_BONUS, weekly: WEEKLY_BONUS };

export function missionState(s: SaveData, kind: MissionKind, id: string) {
  const def = DEFS[kind].find((m) => m.id === id)!;
  const p = s.missions[kind];
  const value = Math.min(def.target, p.counters[def.key] ?? 0);
  return { def, value, done: value >= def.target, claimed: p.claimed.includes(id) };
}

export function claimMission(s: SaveData, kind: MissionKind, id: string): boolean {
  const st = missionState(s, kind, id);
  if (!st.done || st.claimed) return false;
  s.missions[kind].claimed.push(id);
  applyReward(s, st.def.reward);
  return true;
}

export function bonusAvailable(s: SaveData, kind: MissionKind): boolean {
  return !s.missions[kind].bonus && DEFS[kind].every((m) => s.missions[kind].claimed.includes(m.id));
}
export function claimBonus(s: SaveData, kind: MissionKind): boolean {
  if (!bonusAvailable(s, kind)) return false;
  s.missions[kind].bonus = true;
  applyReward(s, BONUS[kind]);
  return true;
}

export function claimableCount(s: SaveData): number {
  let n = 0;
  for (const kind of ['daily', 'weekly'] as MissionKind[]) {
    n += DEFS[kind].filter((m) => { const st = missionState(s, kind, m.id); return st.done && !st.claimed; }).length;
    if (bonusAvailable(s, kind)) n++;
  }
  n += ACHIEVEMENTS.filter((a) => achievementDone(s, a.id) && !s.achievements.includes(a.id)).length;
  return n;
}

export function achievementDone(s: SaveData, id: string): boolean {
  const a = ACHIEVEMENTS.find((x) => x.id === id)!;
  const [v, t] = a.progress(s);
  return v >= t;
}
export function claimAchievement(s: SaveData, id: string): boolean {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a || s.achievements.includes(id) || !achievementDone(s, id)) return false;
  s.achievements.push(id);
  applyReward(s, a.reward);
  return true;
}

export function eventTaskState(s: SaveData, eventId: string, taskId: string) {
  const e = activeEvents(s.time.highWater).find((x) => x.id === eventId);
  const t = e?.tasks?.find((x) => x.id === taskId);
  if (!t) return null;
  const p = s.events[eventId];
  const value = Math.min(t.target, p?.counters[t.key] ?? 0);
  return { def: t, value, done: value >= t.target, claimed: !!p?.claimed.includes(taskId) };
}
export function claimEventTask(s: SaveData, eventId: string, taskId: string): boolean {
  const st = eventTaskState(s, eventId, taskId);
  if (!st || !st.done || st.claimed) return false;
  s.events[eventId].claimed.push(taskId);
  applyReward(s, st.def.reward);
  return true;
}

/** Nombre de récompenses à réclamer par onglet (journalières, hebdomadaires, progression). */
export function claimableByTab(s: SaveData): { daily: number; weekly: number; progress: number } {
  const per = (kind: MissionKind) => DEFS[kind].filter((m) => { const st = missionState(s, kind, m.id); return st.done && !st.claimed; }).length + (bonusAvailable(s, kind) ? 1 : 0);
  return { daily: per('daily'), weekly: per('weekly'), progress: ACHIEVEMENTS.filter((a) => achievementDone(s, a.id) && !s.achievements.includes(a.id)).length };
}

/** Récompenses d'événement à réclamer (objectifs accomplis et paliers de points atteints). */
export function eventClaimable(s: SaveData, now: number, eventId?: string): number {
  let n = 0;
  for (const e of activeEvents(now)) {
    if (eventId && e.id !== eventId) continue;
    n += (e.tasks ?? []).filter((t) => { const st = eventTaskState(s, e.id, t.id); return st?.done && !st.claimed; }).length;
    n += (e.cycle?.milestones ?? []).filter((_, i) => milestoneState(s, e, i)?.ready).length;
  }
  return n;
}
