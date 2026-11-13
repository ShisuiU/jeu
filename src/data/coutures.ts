import type { FactionId } from './types';

// COUTURES D'ÉPOQUE (v1.94.0, audit — idée signature) — le Monde Cousu mêle des époques. Deux héros de familles
// différentes dans la même équipe peuvent déclencher, une fois par combat (au 3ᵉ tour de l'équipe), une attaque
// cousue qui marie leurs deux mondes. Chaque couture découverte s'inscrit au Codex.
export type CoutureBonus = 'defDown' | 'burn' | 'stun' | 'atkUp' | 'big' | 'heal' | 'shield' | 'spdDown';
export interface Couture { id: string; name: string; factions: [FactionId, FactionId]; text: string; bonus: CoutureBonus }

export const COUTURES: Couture[] = [
  { id: 'quantum_steel', name: 'Acier quantique', factions: ['valcrest', 'prism'], text: 'Lames de chevalier et calcul du Prisme : frappe tous les ennemis et réduit leur DÉF.', bonus: 'defDown' },
  { id: 'ember_roots', name: 'Racines de braise', factions: ['ash', 'sylvaran'], text: 'Les racines s’embrasent sous les ennemis : frappe et brûle toute la ligne.', bonus: 'burn' },
  { id: 'star_sand', name: 'Sable d’étoiles', factions: ['astral', 'akkar'], text: 'Une tempête de sable stellaire : frappe et étourdit les ennemis (sauf les boss).', bonus: 'stun' },
  { id: 'ardent_oath', name: 'Serment ardent', factions: ['valcrest', 'ash'], text: 'Le serment brûle dans les cœurs : frappe et donne +ATQ à l’équipe.', bonus: 'atkUp' },
  { id: 'celestial_calc', name: 'Calcul céleste', factions: ['prism', 'astral'], text: 'Une constellation calculée au millième : une frappe bien plus forte.', bonus: 'big' },
  { id: 'oasis', name: 'Oasis', factions: ['sylvaran', 'akkar'], text: 'Une oasis surgit du sable : frappe et soigne l’équipe.', bonus: 'heal' },
  { id: 'bulwark_grove', name: 'Bosquet-rempart', factions: ['valcrest', 'sylvaran'], text: 'Un rempart de troncs vivants : frappe et protège l’équipe d’un bouclier.', bonus: 'shield' },
  { id: 'plasma_forge', name: 'Forge-plasma', factions: ['prism', 'ash'], text: 'Le plasma coule comme du métal : frappe, brûle et ralentit.', bonus: 'spdDown' },
  { id: 'eclipse_dunes', name: 'Dunes d’éclipse', factions: ['akkar', 'ash'], text: 'Le désert s’embrase sous une éclipse : frappe et brûle.', bonus: 'burn' },
  { id: 'astral_rampart', name: 'Rempart astral', factions: ['valcrest', 'astral'], text: 'La lumière des étoiles sur les boucliers : frappe et protège l’équipe.', bonus: 'shield' },
];
export const COUTURE_BY_ID: Record<string, Couture> = Object.fromEntries(COUTURES.map((c) => [c.id, c]));
