import type { RarityId } from './types';

export interface RarityDef {
  id: RarityId;
  name: string;
  order: number;
  color: string;
  glow: string;
  /** Multiplicateur appliqué aux statistiques de base. */
  statMult: number;
  /** Rang de départ (le rang détermine le niveau maximum). */
  startRank: number;
  /** Fragments nécessaires pour obtenir le héros via fragments (phase 3). */
  fragmentsToSummon: number;
}

export const RARITIES: Record<RarityId, RarityDef> = {
  common: { id: 'common', name: 'Commun', order: 1, color: '#9aa0a6', glow: '#c9ced3', statMult: 0.82, startRank: 1, fragmentsToSummon: 10 },
  uncommon: { id: 'uncommon', name: 'Peu commun', order: 2, color: '#4fae5b', glow: '#8ee39a', statMult: 0.9, startRank: 2, fragmentsToSummon: 20 },
  rare: { id: 'rare', name: 'Rare', order: 3, color: '#3d8bff', glow: '#8ab8ff', statMult: 1.0, startRank: 3, fragmentsToSummon: 40 },
  epic: { id: 'epic', name: 'Épique', order: 4, color: '#a64dff', glow: '#cf9dff', statMult: 1.14, startRank: 4, fragmentsToSummon: 60 },
  legendary: { id: 'legendary', name: 'Légendaire', order: 5, color: '#ffae2b', glow: '#ffd48a', statMult: 1.32, startRank: 5, fragmentsToSummon: 100 },
  mythic: { id: 'mythic', name: 'Mythique', order: 6, color: '#ff3d6e', glow: '#ff9bb5', statMult: 1.45, startRank: 6, fragmentsToSummon: 160 },
};

export const RARITY_LIST = Object.values(RARITIES).sort((a, b) => a.order - b.order);
