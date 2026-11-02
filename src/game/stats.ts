import { BALANCE } from '../data/balance';
import { RARITIES } from '../data/rarities';
import { ROLES } from '../data/roles';
import type { HeroDef, StatId, Stats } from '../data/types';

export interface HeroProgress {
  level: number;
  rank: number;
  ascension: number;
  awaken: number;
}

export const STAT_LABELS: Record<StatId, { short: string; long: string; pct?: boolean }> = {
  hp: { short: 'PV', long: 'Points de vie' },
  atk: { short: 'ATQ', long: 'Attaque' },
  def: { short: 'DÉF', long: 'Défense' },
  spd: { short: 'VIT', long: 'Vitesse' },
  critRate: { short: 'CRIT', long: 'Taux critique', pct: true },
  critDmg: { short: 'CRIT DMG', long: 'Dégâts critiques', pct: true },
  acc: { short: 'PRÉ', long: 'Précision' },
  res: { short: 'RÉS', long: 'Résistance' },
};

export const STAT_ORDER: StatId[] = ['hp', 'atk', 'def', 'spd', 'critRate', 'critDmg', 'acc', 'res'];

export function maxLevelForRank(rank: number): number {
  return rank * BALANCE.hero.levelsPerRank;
}

/** Calcule les statistiques d'un héros (hors équipement, qui s'ajoutera en phase 3). */
export function computeStats(def: HeroDef, p: HeroProgress): Stats {
  const role = ROLES[def.role].template;
  const rarity = RARITIES[def.rarity];
  const B = BALANCE.hero;
  const scaling =
    rarity.statMult *
    (1 + B.growthPerLevel * (p.level - 1)) *
    (1 + B.rankBonus * Math.max(0, p.rank - rarity.startRank)) *
    (1 + B.ascensionBonus * p.ascension) *
    (1 + B.awakenBonus * p.awaken);
  const bias = (s: StatId) => def.bias?.[s] ?? 1;
  return {
    hp: Math.round(role.hp * bias('hp') * scaling),
    atk: Math.round(role.atk * bias('atk') * scaling),
    def: Math.round(role.def * bias('def') * scaling),
    spd: Math.round(def.baseSpd + p.ascension * 2 + p.awaken * 2),
    critRate: role.critRate + p.ascension,
    critDmg: role.critDmg + p.awaken * 5,
    acc: Math.round(role.acc * bias('acc') + p.ascension * 3),
    res: Math.round(role.res * bias('res') + p.ascension * 3),
  };
}

/** Puissance globale (pour trier et comparer) — pondération simple. */
export function powerOf(s: Stats): number {
  return Math.round(s.hp * 0.12 + s.atk * 1.6 + s.def * 1.2 + s.spd * 4 + s.critRate * 6 + s.critDmg * 2 + s.acc * 1.5 + s.res * 1.5);
}
