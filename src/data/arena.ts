import type { Reward } from './resources';

// ARÈNE — combats contre des équipes contrôlées par l'ordinateur. L'architecture (équipes décrites par des
// données, moteur déterministe) permettra plus tard d'affronter les équipes défensives d'autres joueurs.
export const ARENA = { ticketsPerDay: 5, startRating: 1000, winBase: 18, lossPenalty: 10 };

export const ARENA_TIERS = [
  { id: 'bronze', name: 'Bronze', min: 0, color: '#c08a5a', reward: { gold: 1500, crystals: 10 } as Reward },
  { id: 'silver', name: 'Argent', min: 1150, color: '#c9ced3', reward: { gold: 2500, crystals: 15 } as Reward },
  { id: 'gold', name: 'Or', min: 1350, color: '#ffcf5a', reward: { gold: 4000, crystals: 25 } as Reward },
  { id: 'platinum', name: 'Platine', min: 1600, color: '#7fe7ff', reward: { gold: 6000, crystals: 35, shardDim: 1 } as Reward },
  { id: 'diamond', name: 'Diamant', min: 1900, color: '#c7a0ff', reward: { gold: 9000, crystals: 50, shardAeon: 1 } as Reward },
];

export const ARENA_NAMES = ['Vespera', 'Kaël le Gris', 'Ordre de Myrrhe', 'Les Veilleurs', 'Dame Ysolde', 'Le Clan Rouge', 'Orvan', 'Sœurs d’Astre', 'Tamsin', 'Hadrik', 'Les Sans-Nom', 'Liora'];

export function arenaTier(rating: number) {
  return [...ARENA_TIERS].reverse().find((t) => rating >= t.min)!;
}
