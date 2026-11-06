import { BUNDLED_EVENTS, type GameEvent } from '../data/events';
import { BANNER_BY_ID } from '../data/summons';
import { BALANCE } from '../data/balance';
import { CYCLE_EPOCH, CYCLE_THEMES, TRIAL_POINTS, TRIAL_REWARDS, cycleMilestones, type EventBonusKind } from '../data/eventCycle';
import type { SaveData } from '../save/schema';
import { applyReward } from './rewards';
import { dayKey } from '../core/time';

// Registre des événements : liste intégrée, remplacée par public/events.json quand il est disponible.
let events: GameEvent[] = BUNDLED_EVENTS;
const LS_KEY = 'aeonfall.events';

function valid(e: unknown): e is GameEvent {
  const x = e as GameEvent;
  return !!x && typeof x.id === 'string' && typeof x.name === 'string' && !isNaN(Date.parse(x.start)) && !isNaN(Date.parse(x.end));
}

export function setEvents(list: GameEvent[]) { events = list.filter(valid); }
export function getEvents() { return events; }
export function activeEvents(now: number): GameEvent[] {
  const list = events.filter((e) => Date.parse(e.start) <= now && now <= Date.parse(e.end));
  const w = weeklyEvent(now);
  return w ? [w, ...list] : list;
}
export function dungeonBonus(now: number): number {
  return Math.max(eventBonus(now, 'dungeon'), activeEvents(now).reduce((m, e) => Math.max(m, e.dungeonBonus ?? 1), 1));
}

// ── Événement de la semaine ────────────────────────────────────────────────────────────────
const DAY = 24 * 3600 * 1000;
/** Début (lundi, heure de renouvellement) et numéro de la semaine contenant `now`. */
export function cycleWeek(now: number): { index: number; start: number; end: number } {
  const R = BALANCE.time.dailyResetHour;
  const d = new Date(now - R * 3600 * 1000);
  const back = (d.getDay() + 6) % 7;
  const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - back, R, 0, 0, 0);
  const next = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 7, R, 0, 0, 0);
  const index = Math.round((Date.UTC(mon.getFullYear(), mon.getMonth(), mon.getDate()) - Date.UTC(CYCLE_EPOCH.y, CYCLE_EPOCH.m, CYCLE_EPOCH.d)) / (7 * DAY));
  return { index, start: mon.getTime(), end: next.getTime() - 1000 };
}
export const themeOfWeek = (index: number) => CYCLE_THEMES[((index % CYCLE_THEMES.length) + CYCLE_THEMES.length) % CYCLE_THEMES.length];

const weekCache = new Map<number, GameEvent>();
function buildWeekly(index: number, start: number, end: number): GameEvent {
  const t = themeOfWeek(index);
  return {
    id: `wk${index}-${t.id}`, name: t.name, description: t.tagline, color: t.color,
    start: new Date(start).toISOString(), end: new Date(end).toISOString(),
    tasks: t.tasks.map((x, i) => ({ id: `t${i + 1}`, key: x.key, target: x.target, title: x.title, reward: x.reward, points: x.points })),
    cycle: {
      theme: t.id, tagline: t.tagline, region: t.region, art: t.art, bonus: t.bonus,
      trials: t.trialNames.map((name, i) => ({ id: `r${i + 1}`, name, points: TRIAL_POINTS[i], reward: TRIAL_REWARDS[i] })),
      milestones: cycleMilestones(t),
    },
  };
}
/** L'événement de la semaine en cours (null avant le début du calendrier). */
export function weeklyEvent(now: number): GameEvent | null {
  const w = cycleWeek(now);
  if (w.index < 0) return null;
  let e = weekCache.get(w.index);
  if (!e) { e = buildWeekly(w.index, w.start, w.end); weekCache.set(w.index, e); }
  return e;
}
/** Thème et date de début de l'événement suivant. */
export function nextWeekly(now: number) {
  const w = cycleWeek(now);
  return { theme: themeOfWeek(w.index + 1), start: w.end + 1000 };
}

/** Multiplicateur des bonus d'événement en cours (1 si aucun). */
export function eventBonus(now: number, kind: EventBonusKind): number {
  return activeEvents(now).reduce((m, e) => (e.cycle?.bonus.kind === kind ? Math.max(m, e.cycle.bonus.mult) : m), 1);
}

export type EventProgress = SaveData['events'][string];
export const eventProgress = (s: SaveData, id: string): EventProgress => (s.events[id] ??= { counters: {}, claimed: [], challengeDone: false });

/** Points d'événement : objectifs réclamés + combats d'épreuve gagnés. */
export function eventPoints(s: SaveData, e: GameEvent): number {
  const p = s.events[e.id];
  if (!p) return 0;
  const tasks = (e.tasks ?? []).filter((t) => p.claimed.includes(t.id)).reduce((n, t) => n + (t.points ?? 0), 0);
  const trials = (e.cycle?.trials ?? []).slice(0, p.trials ?? 0).reduce((n, t) => n + t.points, 0);
  return tasks + trials;
}
export function milestoneState(s: SaveData, e: GameEvent, i: number) {
  const m = e.cycle?.milestones[i];
  if (!m) return null;
  const claimed = !!s.events[e.id]?.tiers?.includes(i);
  return { ...m, claimed, ready: !claimed && eventPoints(s, e) >= m.points };
}
/** Réclame un palier de points (mutation). */
export function claimMilestone(s: SaveData, eventId: string, i: number, now: number): boolean {
  const e = activeEvents(now).find((x) => x.id === eventId);
  const st = e && milestoneState(s, e, i);
  if (!e || !st?.ready) return false;
  (eventProgress(s, e.id).tiers ??= []).push(i);
  applyReward(s, st.reward);
  return true;
}
export const trialsDone = (s: SaveData, e: GameEvent) => s.events[e.id]?.trials ?? 0;

// ── Événement de connexion ─────────────────────────────────────────────────────────────────
/** Jours réclamés, et si le cadeau du jour est disponible (un par jour de jeu, horloge de confiance). */
export function loginState(s: SaveData, e: GameEvent, now: number) {
  const days = e.login?.days ?? [];
  const got = s.events[e.id]?.login ?? [];
  const today = dayKey(now);
  return { total: days.length, claimed: got.length, today: got.includes(today), ready: !!days.length && got.length < days.length && !got.includes(today) };
}

/** Une bannière « vedette » n'est ouverte que pendant un événement qui la liste. */
export function bannerAvailable(id: string, now: number): boolean {
  const b = BANNER_BY_ID[id];
  if (!b) return false;
  if (!b.featured) return true;
  return activeEvents(now).some((e) => e.banners?.includes(id));
}

/** Charge les événements : d'abord le dernier fichier mémorisé, puis le réseau (sans cache). */
export async function loadEvents(baseUrl: string): Promise<'network' | 'cache' | 'bundled'> {
  let source: 'network' | 'cache' | 'bundled' = 'bundled';
  try {
    const cached = localStorage.getItem(LS_KEY);
    if (cached) { const list = JSON.parse(cached); if (Array.isArray(list)) { setEvents(list); source = 'cache'; } }
  } catch { /* */ }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return source;
  try {
    const res = await fetch(`${baseUrl}events.json?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.events;
      if (Array.isArray(list)) {
        setEvents(list);
        try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch { /* */ }
        source = 'network';
      }
    }
  } catch { /* hors ligne */ }
  return source;
}
