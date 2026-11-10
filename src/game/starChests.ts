import type { SaveData } from '../save/schema';
import type { Reward } from '../data/resources';
import type { DifficultyId } from '../data/campaign';
import { CHAPTERS } from '../data/campaign';
import { chapterStars } from './campaign';
import { applyReward } from './rewards';

// COFFRES D'ÉTOILES PAR DIFFICULTÉ (v1.68.14) — chaque difficulté (Normal, Difficile, Expert, Cauchemar) a sa
// propre piste : toutes les étoiles gagnées dans ses 9 chapitres (270 au plus) ouvrent un coffre tous les 30 étoiles.
// Un coffre sur trois contient des Éclats de faille ; tout grandit avec la difficulté.
// Les étoiles déjà gagnées comptent : un joueur avancé récupère tout de suite les coffres qu'il a déjà atteints.
export const STAR_STEP = 30;
export const starSteps = () => Array.from({ length: Math.floor(maxStars() / STAR_STEP) }, (_, i) => (i + 1) * STAR_STEP);
const maxStars = () => CHAPTERS.reduce((a, c) => a + c.stages.length * 3, 0);

const MULT: Record<DifficultyId, number> = { normal: 1, hard: 2, expert: 3, nightmare: 4 };

/** Récompense du coffre `step` (30, 60, … 270) d'une difficulté. */
export function starChestReward(diff: DifficultyId, step: number): Reward {
  const m = MULT[diff];
  const k = Math.round(step / STAR_STEP);
  const last = step >= maxStars();
  if (k % 3 === 0) return { shardEvent: m, crystals: 100 * m, ...(last ? { awakenEssence: 2 * m } : {}) };
  if (k % 3 === 1) return diff === 'normal' ? { shardDim: 3, gold: 5000 } : { shardAeon: m - 1, gold: 5000 * m };
  return { shardAeon: m, crystals: 50 * m };
}

/** Étoiles gagnées dans toute la difficulté. */
export const difficultyStars = (s: SaveData, diff: DifficultyId) => CHAPTERS.reduce((a, c) => a + chapterStars(s, diff, c.n).stars, 0);
const flag = (diff: DifficultyId, step: number) => `sd_${diff}_${step}`;
export const starChestClaimed = (s: SaveData, diff: DifficultyId, step: number) => !!s.flags[flag(diff, step)];

/** Paliers atteints et pas encore récupérés dans cette difficulté. */
export function starChestsReady(s: SaveData, diff: DifficultyId): number[] {
  const stars = difficultyStars(s, diff);
  return starSteps().filter((n) => stars >= n && !starChestClaimed(s, diff, n));
}
export const anyStarChest = (s: SaveData, diff: DifficultyId) => starChestsReady(s, diff).length > 0;

/** Récupère un coffre (mutation). */
export function claimStarChest(s: SaveData, diff: DifficultyId, step: number): Reward | null {
  if (!starChestsReady(s, diff).includes(step)) return null;
  const r = starChestReward(diff, step);
  s.flags[flag(diff, step)] = true;
  applyReward(s, r);
  return r;
}
