// BÂTIMENTS (v1.78.0) — réglages de la Mine de diamants et du Terrain d'entraînement.

/** Mine : diamants par heure selon le niveau, et prix (en diamants) pour passer au niveau suivant. */
export const MINE = {
  rate: [0, 1, 2, 3] as const, // index = niveau
  upgradeCost: { 2: 120, 3: 300 } as Record<number, number>,
  maxLevel: 3,
  /** La production s'arrête quand la réserve contient 24 h de production : il faut passer récolter. */
  capHours: 24,
};

/** Terrain d'entraînement : 1 place gratuite, 2 places à ouvrir avec des diamants. */
export const TRAINING = {
  slots: 3,
  slotCost: [0, 100, 250] as const, // index = place (0 gratuite)
  /** Expérience gagnée par heure, la même quel que soit le niveau du héros (v1.113.0, retour du joueur : à 3 % du niveau suivant,
   *  un héros de niveau 1 ne gagnait que 4 XP/h). 500 XP/h, un peu plus qu'un élixir (400 XP) par heure et par place. */
  xpPerHour: 500,
};
