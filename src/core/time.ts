import { BALANCE } from '../data/balance';

// HORLOGE DE CONFIANCE
// Hors ligne, on ne peut pas vérifier l'heure auprès d'un serveur. On mémorise donc la plus grande heure
// jamais observée (« highWater »). Si l'horloge du téléphone recule, on continue d'utiliser highWater :
// avancer l'heure pour récolter des récompenses puis revenir en arrière ne fait qu'« emprunter »
// sur l'avenir — l'énergie et les récompenses quotidiennes restent gelées jusqu'à ce que le vrai temps rattrape.

export interface TimeState {
  highWater: number;
  lastSeen: number;
  rollbackCount: number;
}

export interface TimeObservation {
  trusted: number;
  rollback: boolean;
  time: TimeState;
}

export function observeTime(t: TimeState, deviceNow: number): TimeObservation {
  const tol = BALANCE.time.rollbackToleranceMs;
  if (deviceNow + tol < t.highWater) {
    return {
      trusted: t.highWater,
      rollback: true,
      time: { ...t, lastSeen: deviceNow, rollbackCount: t.rollbackCount + (t.lastSeen + tol < t.highWater ? 0 : 1) },
    };
  }
  const trusted = Math.max(deviceNow, t.highWater);
  return { trusted, rollback: false, time: { ...t, highWater: trusted, lastSeen: deviceNow } };
}

/** Clé de jour de jeu (AAAA-MM-JJ) en heure locale, avec renouvellement à dailyResetHour. */
export function dayKey(ms: number, resetHour: number = BALANCE.time.dailyResetHour): string {
  const d = new Date(ms - resetHour * 3600 * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Millisecondes avant le prochain renouvellement quotidien. */
export function msUntilReset(ms: number, resetHour: number = BALANCE.time.dailyResetHour): number {
  const d = new Date(ms);
  const next = new Date(d);
  next.setHours(resetHour, 0, 0, 0);
  if (next.getTime() <= ms) next.setDate(next.getDate() + 1);
  return next.getTime() - ms;
}

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')}`;
  if (m > 0) return `${m} min ${String(sec).padStart(2, '0')}`;
  return `${sec} s`;
}

/** Clé de semaine de jeu (lundi de la semaine, au renouvellement quotidien). */
export function weekKey(ms: number, resetHour: number = BALANCE.time.dailyResetHour): string {
  const d = new Date(ms - resetHour * 3600 * 1000);
  const day = (d.getDay() + 6) % 7; // lundi = 0
  d.setDate(d.getDate() - day);
  return dayKey(d.getTime() + resetHour * 3600 * 1000, resetHour);
}

/** Millisecondes avant le prochain lundi (renouvellement hebdomadaire). */
export function msUntilWeekReset(ms: number, resetHour: number = BALANCE.time.dailyResetHour): number {
  let t = msUntilReset(ms, resetHour);
  while (weekKey(ms + t + 1000, resetHour) === weekKey(ms, resetHour)) t += 24 * 3600 * 1000;
  return t;
}
