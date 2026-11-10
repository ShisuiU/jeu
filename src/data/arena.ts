import type { Reward } from './resources';

// ARÈNE — combats contre des équipes contrôlées par l'ordinateur. L'architecture (équipes décrites par des
// données, moteur déterministe) permettra plus tard d'affronter les équipes défensives d'autres joueurs.
export const ARENA = { seasonKeep: 0.5, ticketsPerDay: 5, startRating: 1000, winBase: 18, lossPenalty: 10, freeRefreshes: 1, refreshCost: 20 };

export const ARENA_TIERS = [
  // `season` : récompense de fin de saison (une semaine) selon la ligue atteinte. Plus de récompense à chaque victoire (v1.68.15).
  { id: 'bronze', name: 'Bronze', min: 0, color: '#c08a5a', season: { gold: 10000, crystals: 50, shardDim: 3 } as Reward },
  { id: 'silver', name: 'Argent', min: 1150, color: '#c9ced3', season: { gold: 20000, crystals: 100, shardAeon: 1 } as Reward },
  { id: 'gold', name: 'Or', min: 1350, color: '#ffcf5a', season: { gold: 35000, crystals: 180, shardAeon: 2 } as Reward },
  { id: 'platinum', name: 'Platine', min: 1600, color: '#7fe7ff', season: { gold: 50000, crystals: 260, shardAeon: 3, shardEvent: 1 } as Reward },
  { id: 'diamond', name: 'Diamant', min: 1900, color: '#c7a0ff', season: { gold: 80000, crystals: 400, shardAeon: 5, shardEvent: 2 } as Reward },
];

// Héritiers imaginaires (sans compte ou sans joueur en ligne de puissance proche). Aucun nom de héros du jeu.
export const ARENA_NAMES = ['Vesprine', 'Kaël le Gris', 'Ordre de Myrrhe', 'Les Veilleurs', 'Dame Ombreline', 'Le Clan Rouge', 'Orvan', 'Sœurs d’Astre', 'Hadrik', 'Les Sans-Nom', 'Liora',
  'Maître Ancel', 'La Garde Cendrée', 'Ysmé la Lente', 'Corbeau-Sel', 'Les Fils du Gué', 'Thibalt', 'Nuée d’Opale', 'Brisemont', 'Sixte', 'Les Lanternes', 'Aube-Grise'];

export function arenaTier(rating: number) {
  return [...ARENA_TIERS].reverse().find((t) => rating >= t.min)!;
}
