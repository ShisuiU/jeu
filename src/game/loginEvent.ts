import type { SaveData } from '../save/schema';
import { createHeroInstance } from '../save/schema';
import { HERO_BY_ID } from '../data/heroes';
import { dayKey } from '../core/time';
import { activeEvents, eventProgress, loginState } from './events';
import { applyReward } from './rewards';
import { addCopy } from './copies';

/** Réclame le cadeau de connexion du jour (mutation). Le héros du dernier jour rejoint l'équipe (ou devient un doublon). */
export function claimLoginDay(s: SaveData, eventId: string, now: number): { ok: boolean; day?: number; hero?: string; duplicate?: boolean } {
  const e = activeEvents(now).find((x) => x.id === eventId);
  if (!e?.login || !loginState(s, e, now).ready) return { ok: false };
  const p = eventProgress(s, e.id);
  const i = (p.login ??= []).length;
  const d = e.login.days[i];
  p.login.push(dayKey(now));
  applyReward(s, d.reward);
  if (d.hero && HERO_BY_ID[d.hero]) {
    const owned = s.heroes.some((h) => h.heroId === d.hero);
    if (owned) addCopy(s, d.hero); else s.heroes.push(createHeroInstance(d.hero, now));
    return { ok: true, day: i + 1, hero: d.hero, duplicate: owned };
  }
  return { ok: true, day: i + 1 };
}
