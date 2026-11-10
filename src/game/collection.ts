import type { SaveData } from '../save/schema';
import type { Reward } from '../data/resources';
import { applyReward } from './rewards';

// COLLECTION — un objectif de long terme : chaque palier de héros différents possédés donne des cristaux, des
// éclats d'Aeon et un bonus permanent de +1 % PV, ATQ et DÉF à TOUS les héros (jusqu'à +9 % avec les 50).
export const COLLECTION_STEPS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];
export const COLLECTION_PCT = 1;
export const collectionReward = (n: number): Reward => ({ crystals: 100 + n * 10, shardAeon: n >= 30 ? 3 : n >= 20 ? 2 : 1 });
const flag = (n: number) => `col_${n}`;

export const ownedCount = (s: SaveData) => new Set(s.heroes.map((h) => h.heroId)).size;
/** Bonus permanent (en %) des paliers déjà récupérés. */
export const collectionPct = (s: SaveData) => COLLECTION_STEPS.filter((n) => s.flags[flag(n)]).length * COLLECTION_PCT;
/** Paliers atteints mais pas encore récupérés. */
export const collectionClaimable = (s: SaveData) => COLLECTION_STEPS.filter((n) => ownedCount(s) >= n && !s.flags[flag(n)]);
/** Prochain palier pas encore atteint (undefined = collection complète). */
export const nextCollectionStep = (s: SaveData) => COLLECTION_STEPS.find((n) => !s.flags[flag(n)]);

export function claimCollection(s: SaveData): number[] {
  const got = collectionClaimable(s);
  for (const n of got) { s.flags[flag(n)] = true; applyReward(s, collectionReward(n)); }
  return got;
}
