import type { SaveData } from '../save/schema';
import { BALANCE } from '../data/balance';
import { energyMax, regenEnergy } from './energy';
import { campMsToFull } from './camp';
import { isUnlocked } from './unlocks';

// NOTIFICATIONS — quand le camp sera plein et quand l'énergie sera au maximum (0 = rien à annoncer).
// Ces heures sont envoyées au serveur quand le joueur quitte le jeu ; il prévient le téléphone le moment venu.
export interface PushTimes { campAt: number; energyAt: number }
export interface PushPrefs { camp: boolean; energy: boolean; gifts: boolean }
export const DEFAULT_PREFS: PushPrefs = { camp: true, energy: true, gifts: true };

export function pushTimes(s: SaveData, now: number): PushTimes {
  const max = energyMax(s.profile.level);
  const e = regenEnergy(s.energy, now, max);
  const energyAt = e.current >= max ? 0 : e.lastTick + (max - e.current) * BALANCE.energy.regenMs;
  const toFull = isUnlocked(s, 'camp') ? campMsToFull(s, now) : 0;
  return { campAt: toFull > 0 ? now + toFull : 0, energyAt: energyAt > now ? energyAt : 0 };
}

/** Prochaine notification à envoyer (0 = aucune), selon les choix du joueur. */
export function nextDue(t: PushTimes, p: PushPrefs): number {
  const xs = [p.camp ? t.campAt : 0, p.energy ? t.energyAt : 0].filter((x) => x > 0);
  return xs.length ? Math.min(...xs) : 0;
}

/** Heures calmes (22 h – 8 h, heure du joueur) : pas de notification la nuit. `tz` = getTimezoneOffset(). */
export function isQuiet(now: number, tz: number): boolean {
  const h = new Date(now - tz * 60_000).getUTCHours();
  return h >= 22 || h < 8;
}
