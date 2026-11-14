import type { RoleId } from './types';

// VOIES (v1.96.0, phase 2) — au niveau 60, chaque héros choisit une voie parmi deux, propre à son rôle.
// Le même héros peut ainsi servir deux équipes différentes. Premier choix gratuit, changement contre de l'or.
export interface SpecDef { name: string; text: string; pct?: Partial<Record<'hp' | 'atk' | 'def' | 'spd', number>>; lifesteal?: number; regen?: number; startTm?: number }
export const SPEC_CHANGE_GOLD = 50000;
export const SPECS: Record<RoleId, { a: SpecDef; b: SpecDef }> = {
  defender: { a: { name: 'Rempart', text: '+20 % DÉF, récupère 4 % de ses PV à chaque tour.', pct: { def: 0.2 }, regen: 4 }, b: { name: 'Briseur', text: '+18 % ATQ, +6 % VIT.', pct: { atk: 0.18, spd: 0.06 } } },
  attacker: { a: { name: 'Lame', text: '+18 % ATQ, 8 % de vol de vie.', pct: { atk: 0.18 }, lifesteal: 0.08 }, b: { name: 'Tempête', text: '+10 % ATQ, +10 % VIT.', pct: { atk: 0.1, spd: 0.1 } } },
  assassin: { a: { name: 'Ombre', text: '+12 % VIT, commence avec 20 % de jauge de tour.', pct: { spd: 0.12 }, startTm: 20 }, b: { name: 'Bourreau', text: '+20 % ATQ.', pct: { atk: 0.2 } } },
  healer: { a: { name: 'Source', text: '+20 % PV, récupère 3 % de ses PV à chaque tour.', pct: { hp: 0.2 }, regen: 3 }, b: { name: 'Aurore', text: '+12 % ATQ, commence avec 20 % de jauge de tour.', pct: { atk: 0.12 }, startTm: 20 } },
  support: { a: { name: 'Tisseur', text: '+10 % VIT, commence avec 15 % de jauge de tour.', pct: { spd: 0.1 }, startTm: 15 }, b: { name: 'Bastion', text: '+20 % DÉF, +12 % PV.', pct: { def: 0.2, hp: 0.12 } } },
  controller: { a: { name: 'Arcane', text: '+16 % ATQ.', pct: { atk: 0.16 } }, b: { name: 'Entrave', text: '+10 % VIT, +10 % PV.', pct: { spd: 0.1, hp: 0.1 } } },
};
