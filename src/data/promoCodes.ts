import type { Reward } from './resources';

// CODES PROMO (v1.77.0) — chaque code n'est utilisable qu'une fois par partie.
// Les codes ne sont pas écrits en clair : seule leur empreinte est stockée (voir promoHash).
// Pour en ajouter un : calculer promoHash('MONCODE') et l'ajouter ici avec sa récompense (et une date de fin si besoin).
export interface PromoCode { hash: string; label: string; reward: Reward; until?: string }

/** Empreinte d'un code (FNV-1a 32 bits sur le code normalisé : majuscules, sans espaces). */
export function promoHash(raw: string): string {
  const code = normalizePromo(raw);
  let h = 0x811c9dc5;
  for (let i = 0; i < code.length; i++) { h ^= code.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}
export const normalizePromo = (raw: string) => raw.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export const PROMO_CODES: PromoCode[] = [
  { hash: '9lindf', label: 'Bienvenue dans Aeonfall', reward: { crystals: 300, gold: 50000, shardAeon: 2 } },
  { hash: '1rjzjf', label: 'Cadeau de la Fracture', reward: { shardDim: 10, xpElixir: 10, energy: 60 } },
];
