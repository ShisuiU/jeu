import type { SaveData } from '../save/schema';
import type { Reward } from '../data/resources';
import type { DifficultyId } from '../data/campaign';
import { CHAPTERS } from '../data/campaign';
import { chapterStars } from './campaign';
import { applyReward } from './rewards';

// COFFRES D'ÉTOILES (v1.68.12) — dans chaque chapitre et chaque difficulté, trois paliers d'étoiles (10, 20, 30)
// ouvrent un coffre : éclats d'invocation (dont les Éclats de faille), plus généreux à mesure que la difficulté monte.
// Les étoiles déjà gagnées comptent : un joueur avancé peut récupérer tout de suite les coffres de ses chapitres.
export const STAR_STEPS = [10, 20, 30] as const;

const TABLE: Record<DifficultyId, [Reward, Reward, Reward]> = {
  normal: [{ shardDim: 3, gold: 5000 }, { shardAeon: 1, crystals: 50 }, { shardEvent: 1, crystals: 100 }],
  hard: [{ shardAeon: 1, gold: 10000 }, { shardEvent: 1, crystals: 80 }, { shardEvent: 2, crystals: 150 }],
  expert: [{ shardAeon: 2, gold: 20000 }, { shardEvent: 2, crystals: 100 }, { shardEvent: 3, crystals: 200, awakenEssence: 1 }],
  nightmare: [{ shardAeon: 3, gold: 40000 }, { shardEvent: 3, crystals: 150 }, { shardEvent: 4, crystals: 300, awakenEssence: 2 }],
};

export const starChestReward = (diff: DifficultyId, step: number): Reward => TABLE[diff][STAR_STEPS.indexOf(step as 10 | 20 | 30)];
const flag = (diff: DifficultyId, chapter: number, step: number) => `sc_${diff}_${chapter}_${step}`;
export const starChestClaimed = (s: SaveData, diff: DifficultyId, chapter: number, step: number) => !!s.flags[flag(diff, chapter, step)];

/** Paliers atteints et pas encore récupérés dans ce chapitre. */
export function starChestsReady(s: SaveData, diff: DifficultyId, chapter: number): number[] {
  const { stars } = chapterStars(s, diff, chapter);
  return STAR_STEPS.filter((n) => stars >= n && !starChestClaimed(s, diff, chapter, n));
}
/** Y a-t-il un coffre à récupérer quelque part dans cette difficulté ? */
export const anyStarChest = (s: SaveData, diff: DifficultyId) => CHAPTERS.some((c) => starChestsReady(s, diff, c.n).length > 0);

/** Récupère un coffre (mutation). */
export function claimStarChest(s: SaveData, diff: DifficultyId, chapter: number, step: number): Reward | null {
  if (!starChestsReady(s, diff, chapter).includes(step)) return null;
  const r = starChestReward(diff, step);
  s.flags[flag(diff, chapter, step)] = true;
  applyReward(s, r);
  return r;
}
