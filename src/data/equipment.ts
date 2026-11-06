import type { StatId } from './types';

// ÉQUIPEMENT — 7 emplacements, 6 raretés, 1 à 6 étoiles, niveau +0 à +16, statistique principale,
// jusqu'à 4 secondaires (renforcées aux niveaux 4, 8, 12 et 16), 11 ensembles à 2 ou 4 pièces.
// La RARETÉ fixe le nombre et la force des secondaires ; les ÉTOILES fixent la force de la principale.

export type GearSlot = 'weapon' | 'helmet' | 'armor' | 'gloves' | 'boots' | 'accessory' | 'artifact';
export type GearRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type GearStat = StatId | 'hpPct' | 'atkPct' | 'defPct';
export type SetId = 'vigor' | 'fury' | 'bulwark' | 'swift' | 'focus' | 'keen' | 'leech' | 'savage' | 'resolve' | 'perennial' | 'momentum';

export const SLOTS: { id: GearSlot; name: string; mains: GearStat[] }[] = [
  { id: 'weapon', name: 'Arme', mains: ['atk'] },
  { id: 'helmet', name: 'Casque', mains: ['hp'] },
  { id: 'armor', name: 'Armure', mains: ['def'] },
  { id: 'gloves', name: 'Gants', mains: ['atkPct', 'hpPct', 'defPct', 'critRate', 'critDmg'] },
  { id: 'boots', name: 'Bottes', mains: ['spd', 'atkPct', 'hpPct', 'defPct'] },
  { id: 'accessory', name: 'Accessoire', mains: ['acc', 'res', 'atkPct', 'hpPct', 'defPct'] },
  { id: 'artifact', name: 'Artefact', mains: ['atk', 'hp', 'def', 'atkPct', 'hpPct', 'defPct'] },
];
export const SLOT_BY_ID = Object.fromEntries(SLOTS.map((s) => [s.id, s])) as Record<GearSlot, typeof SLOTS[number]>;

export const GEAR_RARITIES: Record<GearRarity, { name: string; order: number; color: string; subs: number; mult: number; boosted?: number }> = {
  common: { name: 'Commun', order: 1, color: '#9aa0a6', subs: 0, mult: 1 },
  uncommon: { name: 'Peu commun', order: 2, color: '#4fae5b', subs: 1, mult: 1.15 },
  rare: { name: 'Rare', order: 3, color: '#3d8bff', subs: 2, mult: 1.3 },
  epic: { name: 'Épique', order: 4, color: '#a64dff', subs: 3, mult: 1.5 },
  legendary: { name: 'Légendaire', order: 5, color: '#ffae2b', subs: 4, mult: 1.75 },
  /** Mythique : 4 secondaires dès l'obtention, dont une déjà renforcée une fois. */
  mythic: { name: 'Mythique', order: 6, color: '#ff4d6a', subs: 4, mult: 1.95, boosted: 1 },
};

/** Étoiles (1 à 6) : force de la statistique principale. Les anciens objets ont autant d'étoiles que leur rang de rareté. */
export const GEAR_MAX_STARS = 6;
export const STAR_MULT = [0, 1, 1.15, 1.3, 1.5, 1.75, 2.05];

/** Valeur de base de la statistique principale (niveau 0, Commun). Gagne +12 % de cette base par niveau. */
export const MAIN_BASE: Record<GearStat, number> = {
  atk: 22, hp: 260, def: 20, atkPct: 5, hpPct: 5, defPct: 5, spd: 4, critRate: 3, critDmg: 5, acc: 8, res: 8,
};
/** Fourchette d'une statistique secondaire (Commun ; multipliée par la rareté). */
export const SUB_RANGE: Record<GearStat, [number, number]> = {
  atk: [6, 12], hp: [70, 140], def: [5, 10], atkPct: [2, 5], hpPct: [2, 5], defPct: [2, 5], spd: [1, 3], critRate: [1, 3], critDmg: [2, 5], acc: [3, 8], res: [3, 8],
};

export const STAT_NAMES: Record<GearStat, string> = {
  hp: 'PV', atk: 'ATQ', def: 'DÉF', spd: 'VIT', critRate: 'TX CRIT', critDmg: 'DGT CRIT', acc: 'PRÉ', res: 'RÉS',
  hpPct: 'PV %', atkPct: 'ATQ %', defPct: 'DÉF %',
};
export const PCT_STATS: GearStat[] = ['hpPct', 'atkPct', 'defPct', 'critRate', 'critDmg'];

export interface SetDef { id: SetId; name: string; pieces: 2 | 4; description: string; bonus: Partial<Record<GearStat, number>> & { lifesteal?: number; regen?: number; startTm?: number }; color: string }
export const SETS: Record<SetId, SetDef> = {
  vigor: { id: 'vigor', name: 'Vigueur', pieces: 2, description: '+15 % PV', bonus: { hpPct: 15 }, color: '#7bd88f' },
  fury: { id: 'fury', name: 'Fureur', pieces: 2, description: '+15 % ATQ', bonus: { atkPct: 15 }, color: '#ff6b5a' },
  bulwark: { id: 'bulwark', name: 'Rempart', pieces: 2, description: '+15 % DÉF', bonus: { defPct: 15 }, color: '#8fb6ff' },
  keen: { id: 'keen', name: 'Acuité', pieces: 2, description: '+12 % taux critique', bonus: { critRate: 12 }, color: '#ffd36b' },
  focus: { id: 'focus', name: 'Concentration', pieces: 2, description: '+40 précision', bonus: { acc: 40 }, color: '#c7a0ff' },
  swift: { id: 'swift', name: 'Célérité', pieces: 4, description: '+12 % vitesse', bonus: { spd: 12 }, color: '#5fe0ff' },
  leech: { id: 'leech', name: 'Sang-vif', pieces: 4, description: 'Vol de vie de 15 % des dégâts', bonus: { lifesteal: 15 }, color: '#ff4d7a' },
  savage: { id: 'savage', name: 'Massacre', pieces: 2, description: '+20 % dégâts critiques', bonus: { critDmg: 20 }, color: '#ff9a3c' },
  resolve: { id: 'resolve', name: 'Résolution', pieces: 2, description: '+40 résistance', bonus: { res: 40 }, color: '#9fe0c0' },
  perennial: { id: 'perennial', name: 'Pérennité', pieces: 4, description: 'Rend 3 % des PV max au début de chaque tour', bonus: { regen: 3 }, color: '#5fd39a' },
  momentum: { id: 'momentum', name: 'Élan', pieces: 4, description: 'Commence le combat avec 30 % de jauge de tour', bonus: { startTm: 30 }, color: '#ffe066' },
};
export const SET_LIST = Object.values(SETS);

export const GEAR_MAX_LEVEL = 16;
export const GEAR_INVENTORY_CAP = 300;

/** Coût d'amélioration niveau L → L+1. */
export function gearUpgradeCost(rarity: GearRarity, level: number): { gold: number; forgeOre: number } {
  const o = GEAR_RARITIES[rarity].order;
  return { gold: Math.round(300 * (level + 1) * (0.6 + o * 0.4)), forgeOre: Math.ceil((level + 1) * (1 + o * 0.5)) };
}

/** Ressources rendues au démantèlement. */
export function gearDismantleValue(rarity: GearRarity, level: number): { gold: number; forgeOre: number } {
  const o = GEAR_RARITIES[rarity].order;
  return { gold: 200 * o + level * 150, forgeOre: o * 2 + Math.floor(level * 1.5) };
}

/** Table de butin de la campagne : rareté de l'objet selon le niveau. */
export function campaignGearTable(stageIndex: number, boss: boolean): [GearRarity, number][] {
  if (boss) return [['rare', 55], ['epic', 38], ['legendary', 7]];
  const t = stageIndex / 10;
  return [['common', Math.max(5, 55 - 50 * t)], ['uncommon', 35], ['rare', 8 + 25 * t], ['epic', 2 + 6 * t]];
}
