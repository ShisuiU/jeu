// MAÎTRISES — petit arbre de talents par héros : 3 branches de 4 paliers.
// Un palier demande le précédent de la même branche et un niveau de héros minimum.
// Les maîtrises ultimes (palier 4) sont limitées à 2 par héros : il faut choisir.

export type MasteryBranch = 'offense' | 'defense' | 'support';
export interface MasteryEffect {
  pct?: Partial<Record<'hp' | 'atk' | 'def' | 'spd', number>>;
  flat?: Partial<Record<'spd' | 'critRate' | 'critDmg' | 'acc' | 'res', number>>;
  lifesteal?: number;
  regen?: number;
  startTm?: number;
}
export interface MasteryDef { id: string; branch: MasteryBranch; tier: 1 | 2 | 3 | 4; name: string; text: string; effect: MasteryEffect }

export const MASTERY_BRANCHES: { id: MasteryBranch; name: string; color: string }[] = [
  { id: 'offense', name: 'Offensive', color: '#ff6a5a' },
  { id: 'defense', name: 'Défensive', color: '#5aa0ff' },
  { id: 'support', name: 'Soutien', color: '#6fe08a' },
];

export const MASTERIES: MasteryDef[] = [
  { id: 'o1', branch: 'offense', tier: 1, name: 'Tranchant', text: 'ATQ +5 %', effect: { pct: { atk: 5 } } },
  { id: 'o2', branch: 'offense', tier: 2, name: 'Œil vif', text: 'Chances de critique +5 %', effect: { flat: { critRate: 5 } } },
  { id: 'o3', branch: 'offense', tier: 3, name: 'Coup fatal', text: 'Dégâts critiques +12 %', effect: { flat: { critDmg: 12 } } },
  { id: 'o4', branch: 'offense', tier: 4, name: 'Soif de sang', text: 'Récupère 8 % des dégâts infligés', effect: { lifesteal: 8 } },
  { id: 'd1', branch: 'defense', tier: 1, name: 'Endurance', text: 'PV +5 %', effect: { pct: { hp: 5 } } },
  { id: 'd2', branch: 'defense', tier: 2, name: 'Cuirasse', text: 'DÉF +6 %', effect: { pct: { def: 6 } } },
  { id: 'd3', branch: 'defense', tier: 3, name: 'Volonté', text: 'RÉS +15', effect: { flat: { res: 15 } } },
  { id: 'd4', branch: 'defense', tier: 4, name: 'Second souffle', text: 'Rend 2 % des PV max à chaque tour', effect: { regen: 2 } },
  { id: 's1', branch: 'support', tier: 1, name: 'Agilité', text: 'VIT +4', effect: { flat: { spd: 4 } } },
  { id: 's2', branch: 'support', tier: 2, name: 'Précision', text: 'PRÉ +15', effect: { flat: { acc: 15 } } },
  { id: 's3', branch: 'support', tier: 3, name: 'Vigilance', text: 'PV +3 % et DÉF +3 %', effect: { pct: { hp: 3, def: 3 } } },
  { id: 's4', branch: 'support', tier: 4, name: 'Initiative', text: 'Commence le combat avec 15 % de jauge', effect: { startTm: 15 } },
];
export const MASTERY_BY_ID: Record<string, MasteryDef> = Object.fromEntries(MASTERIES.map((m) => [m.id, m]));

/** Coût et niveau de héros requis par palier. */
export const MASTERY_TIERS: Record<1 | 2 | 3 | 4, { scrolls: number; gold: number; minLevel: number }> = {
  1: { scrolls: 2, gold: 10000, minLevel: 20 },
  2: { scrolls: 4, gold: 25000, minLevel: 30 },
  3: { scrolls: 6, gold: 50000, minLevel: 40 },
  4: { scrolls: 10, gold: 100000, minLevel: 50 },
};
export const MAX_ULTIMATES = 2;
/** Réinitialiser les maîtrises d'un héros : rend les parchemins (pas l'or). */
/** Réinitialiser les maîtrises d'un héros (v1.102.0 : en or, les cristaux n'existent plus). */
export const MASTERY_RESET_GOLD = 50000;
