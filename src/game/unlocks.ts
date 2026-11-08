import type { SaveData } from '../save/schema';
import { progressKey } from '../data/campaign';

// DÉBLOCAGE PROGRESSIF — comme dans les jeux du genre, les modes s'ouvrent au fil de la campagne :
// le joueur découvre une chose à la fois au lieu d'avoir tout le jeu devant lui dès la première minute.
export type Feature = 'guild' | 'camp' | 'expeditions' | 'events' | 'market' | 'dungeons' | 'worldboss' | 'arena' | 'tower';

/** Niveau de campagne (mode normal) à terminer pour ouvrir chaque mode.
 *  Étalé sur les chapitres 1 à 4 : un nouveau mode tous les 4 ou 5 niveaux, jamais deux d'un coup. */
export const UNLOCK_AT: Record<Feature, string> = {
  camp: '1-4',
  events: '1-8',
  dungeons: '2-2',
  market: '2-6',
  expeditions: '2-10',
  arena: '3-4',
  tower: '3-8',
  worldboss: '4-3',
  guild: '4-7',
};

/** Ouvert si le niveau requis est terminé, ou si le mode était déjà ouvert (et annoncé) avant ce nouvel ordre :
 *  un joueur ne perd jamais l'accès à un mode qu'il a déjà découvert. */
export const isUnlocked = (s: SaveData, f: Feature) => (s.progress.campaign[progressKey('normal', UNLOCK_AT[f])]?.clears ?? 0) > 0 || !!s.flags[`unl_${f}`];
export const unlockText = (f: Feature) => `Après le niveau ${UNLOCK_AT[f]}`;
/** Ordre d'ouverture (chapitre puis niveau). */
export const unlockOrder = (f: Feature) => { const [c, i] = UNLOCK_AT[f].split('-').map(Number); return c * 100 + i; };
