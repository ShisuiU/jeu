import { dayKey } from '../core/time';
import { DAILY_REWARDS } from '../data/dailyRewards';
import type { SaveData } from '../save/schema';
import { applyReward } from './rewards';
import { track } from './missions';

export function canClaimDaily(s: SaveData, trustedNow: number): boolean {
  return s.daily.lastLoginDay !== dayKey(trustedNow);
}

export function currentDailyReward(s: SaveData) {
  return DAILY_REWARDS[s.daily.cycleIndex % DAILY_REWARDS.length];
}

/** Réclame la récompense du jour. Retourne la récompense ou null si déjà réclamée aujourd'hui. */
export function claimDaily(s: SaveData, trustedNow: number) {
  if (!canClaimDaily(s, trustedNow)) return null;
  const def = currentDailyReward(s);
  applyReward(s, def.reward);
  s.daily.lastLoginDay = dayKey(trustedNow);
  s.daily.cycleIndex = (s.daily.cycleIndex + 1) % DAILY_REWARDS.length;
  s.daily.totalLogins += 1;
  track(s, 'login');
  return def;
}
