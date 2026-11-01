import type { AffinityId } from './types';

export interface AffinityDef {
  id: AffinityId;
  name: string;
  color: string;
  description: string;
  /** Affinité contre laquelle celle-ci est avantagée. */
  strongAgainst: AffinityId | null;
}

// Cycle : Solaire > Tellurique > Lunaire > Solaire. Le Néant est neutre.
export const AFFINITIES: Record<AffinityId, AffinityDef> = {
  solar: { id: 'solar', name: 'Solaire', color: '#ffb547', description: 'Le feu et la lumière du Cœur d’Aeon.', strongAgainst: 'telluric' },
  telluric: { id: 'telluric', name: 'Tellurique', color: '#7fbf4d', description: 'La force de la terre, de la pierre et du métal.', strongAgainst: 'lunar' },
  lunar: { id: 'lunar', name: 'Lunaire', color: '#6fa8ff', description: 'Le froid, les marées et l’ombre.', strongAgainst: 'solar' },
  void: { id: 'void', name: 'Néant', color: '#b07cff', description: 'L’énergie de la Fracture elle-même. Ni avantage, ni faiblesse.', strongAgainst: null },
};

/** Modificateur appliqué aux dégâts selon les affinités (utilisé par le moteur de combat). */
export function affinityModifier(attacker: AffinityId, defender: AffinityId): number {
  if (AFFINITIES[attacker].strongAgainst === defender) return 1.3;
  if (AFFINITIES[defender].strongAgainst === attacker) return 0.8;
  return 1;
}
