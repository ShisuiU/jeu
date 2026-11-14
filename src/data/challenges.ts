import type { HeroDef } from './types';
import type { Reward } from './resources';

// DÉFIS À CONTRAINTES (v1.97.0, phase 2 lot 3) — rejouer un combat déjà gagné avec une règle imposée sur l'équipe,
// pour une récompense unique. Aucune nouvelle monnaie, aucun nouveau menu : les défis vivent dans la Tour
// (un défi par étage multiple de 5 déjà conquis) et dans les Failles (un serment par semaine, à prendre au départ).
export type ChallengeId = 'noHealer' | 'fourMax' | 'noLegend' | 'noDefender' | 'twoAffinities';

export const CHALLENGES: Record<ChallengeId, { name: string; text: string; check: (team: HeroDef[]) => string | null }> = {
  noHealer: { name: 'Sans soigneur', text: 'Aucun héros de rôle Soigneur.', check: (t) => (t.some((h) => h.role === 'healer') ? 'Retire tes soigneurs de l’équipe.' : null) },
  fourMax: { name: 'À quatre', text: 'Quatre héros au plus.', check: (t) => (t.length > 4 ? 'Quatre héros au plus : retires-en un.' : null) },
  noLegend: { name: 'Sans légende', text: 'Aucun héros Légendaire ou Mythique.', check: (t) => (t.some((h) => h.rarity === 'legendary' || h.rarity === 'mythic') ? 'Retire tes héros Légendaires et Mythiques.' : null) },
  noDefender: { name: 'Sans rempart', text: 'Aucun héros de rôle Défenseur.', check: (t) => (t.some((h) => h.role === 'defender') ? 'Retire tes défenseurs de l’équipe.' : null) },
  twoAffinities: { name: 'Deux affinités', text: 'Deux affinités différentes au plus dans l’équipe.', check: (t) => (new Set(t.map((h) => h.affinity)).size > 2 ? 'Garde au plus deux affinités différentes.' : null) },
};
const ORDER: ChallengeId[] = ['noHealer', 'fourMax', 'noLegend', 'noDefender', 'twoAffinities'];

/** Vérifie une équipe : null si elle respecte la règle, sinon la raison. */
export const checkChallenge = (id: ChallengeId, team: HeroDef[]): string | null => (team.length ? CHALLENGES[id].check(team) : 'Ton équipe est vide.');

// Tour : un défi par étage multiple de 5 (20 défis), règle tournante.
export const TOWER_CHALLENGE_STEP = 5;
export const isTowerChallengeFloor = (f: number) => f > 0 && f % TOWER_CHALLENGE_STEP === 0;
export const towerChallengeOf = (f: number): ChallengeId => ORDER[(f / TOWER_CHALLENGE_STEP - 1) % ORDER.length];
export const towerChallengeReward = (f: number): Reward => (f % 20 === 0 ? { crystals: 60 + f, awakenEssence: 1 } : { crystals: 40 + f });

// Failles : un serment par semaine (même règle pour tout le monde), bonus sur la victoire contre le Gardien.
export const riftOathOf = (week: string): ChallengeId => { let h = 0; for (const c of week) h = (h * 31 + c.charCodeAt(0)) >>> 0; return ORDER[h % ORDER.length]; };
export const RIFT_OATH_BONUS: Reward = { crystals: 120, awakenEssence: 1 };
