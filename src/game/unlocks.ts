import type { SaveData } from '../save/schema';
import { progressKey } from '../data/campaign';

// DÉBLOCAGE PROGRESSIF — comme dans les jeux du genre, les modes s'ouvrent au fil de la campagne :
// le joueur découvre une chose à la fois au lieu d'avoir tout le jeu devant lui dès la première minute.
export type Feature = 'expeditions' | 'events' | 'market' | 'dungeons' | 'worldboss' | 'arena' | 'tower';

/** Niveau de campagne (mode normal) à terminer pour ouvrir chaque mode. */
export const UNLOCK_AT: Record<Feature, string> = {
  expeditions: '1-3',
  events: '1-3',
  market: '1-6',
  dungeons: '1-5',
  worldboss: '1-8',
  arena: '1-10',
  tower: '2-3',
};

export const isUnlocked = (s: SaveData, f: Feature) => (s.progress.campaign[progressKey('normal', UNLOCK_AT[f])]?.clears ?? 0) > 0;
export const unlockText = (f: Feature) => `Après le niveau ${UNLOCK_AT[f]}`;
/** Ordre d'ouverture (chapitre puis niveau). */
export const unlockOrder = (f: Feature) => { const [c, i] = UNLOCK_AT[f].split('-').map(Number); return c * 100 + i; };
