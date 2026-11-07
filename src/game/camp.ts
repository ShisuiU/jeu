import type { SaveData } from '../save/schema';
import type { Reward } from '../data/resources';
import { CHAPTERS } from '../data/campaign';
import { progressKey } from '../data/campaign';
import { applyReward } from './rewards';

// CAMP DES HÉRITIERS — le butin qui s'accumule pendant l'absence (comme les coffres « AFK » du genre).
// Les héros restés au camp ramènent de l'or, des élixirs, du minerai et quelques cristaux, selon l'avancée
// dans la campagne. Plafond : 12 heures ; on récupère quand on veut (au moins 10 minutes).
export const CAMP_MAX_HOURS = 12;
export const CAMP_MIN_MS = 10 * 60 * 1000;
const H = 3600 * 1000;

/** Niveaux de campagne (normal) terminés : 0 à 90. */
export function campProgress(s: SaveData): number {
  return CHAPTERS.flatMap((c) => c.stages).filter((st) => (s.progress.campaign[progressKey('normal', st.id)]?.clears ?? 0) > 0).length;
}

/** Butin par heure. */
export function campRates(s: SaveData): Required<Pick<Reward, 'gold' | 'xpElixir' | 'forgeOre' | 'crystals'>> {
  const n = campProgress(s);
  return { gold: 300 + 45 * n, xpElixir: 0.2 + 0.015 * n, forgeOre: 0.5 + n / 30, crystals: 1 + n / 45 };
}

const since = (s: SaveData) => s.camp?.since ?? s.createdAt;
export const campElapsed = (s: SaveData, now: number) => Math.max(0, Math.min(CAMP_MAX_HOURS * H, now - since(s)));
export const campMsToFull = (s: SaveData, now: number) => CAMP_MAX_HOURS * H - campElapsed(s, now);

/** Butin accumulé (arrondi à l'unité inférieure). */
export function campLoot(s: SaveData, now: number): Reward {
  const h = campElapsed(s, now) / H;
  const r = campRates(s);
  const out: Reward = {};
  for (const k of Object.keys(r) as (keyof typeof r)[]) { const v = Math.floor(r[k] * h); if (v > 0) out[k] = v; }
  return out;
}

export function claimCamp(s: SaveData, now: number): { ok: true; reward: Reward } | { ok: false; reason: string } {
  if (campElapsed(s, now) < CAMP_MIN_MS) return { ok: false, reason: 'Le butin se prépare : reviens dans quelques minutes.' };
  const reward = campLoot(s, now);
  applyReward(s, reward);
  s.camp = { since: now };
  return { ok: true, reward };
}
