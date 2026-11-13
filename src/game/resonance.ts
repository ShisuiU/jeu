import type { SaveData } from '../save/schema';
import { maxLevelForRank } from './stats';

// RÉSONANCE (v1.87.0, audit E-4) — tous les héros prennent automatiquement le niveau de ton 5ᵉ meilleur héros,
// dans la limite de leur rang. Ainsi un héros invoqué est jouable tout de suite : l'or et les élixirs servent
// à pousser tes 5 meilleurs ; les rangs, l'ascension, l'éveil et les compétences restent propres à chaque héros.
export const RESONANCE_SIZE = 5;

/** Niveau de résonance : le niveau du 5ᵉ meilleur héros (0 tant qu'on n'en a pas 5). */
export function resonanceLevel(s: SaveData): number {
  if (s.heroes.length < RESONANCE_SIZE) return 0;
  const lv = s.heroes.map((h) => h.level).sort((a, b) => b - a);
  return lv[RESONANCE_SIZE - 1];
}

/** Monte les héros en dessous du niveau de résonance (mutation). Renvoie le nombre de héros relevés. */
export function applyResonance(s: SaveData): number {
  const r = resonanceLevel(s);
  if (r <= 1) return 0;
  let n = 0;
  for (const h of s.heroes) {
    const target = Math.min(r, maxLevelForRank(h.rank));
    if (h.level < target) { h.level = target; h.xp = 0; n++; }
  }
  return n;
}
