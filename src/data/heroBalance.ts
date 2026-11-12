import type { HeroDef, RarityId, RoleId, SkillDef, SkillEffect } from './types';
import { ROLES } from './roles';

// RÉÉQUILIBRAGE DES HÉROS (v1.75.0)
// Chaque compétence offensive reçoit une « enveloppe de puissance » selon le rôle du héros, le type de
// compétence (base, spéciale, ultime), sa recharge et la rareté. Une compétence trop forte est ramenée
// au plafond, une trop faible remonte au plancher ; entre les deux, rien ne change (l'identité du héros
// est gardée). La vitesse de base reste aussi dans une fourchette propre au rôle et à la rareté.

type Slot = 'basic' | 'special' | 'ultimate';
const RARITY_ORDER: Record<RarityId, number> = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6 };
/** Les raretés hautes ont des compétences un peu plus fortes : +4 % par cran à partir de Rare. */
export const rarityFactor = (r: RarityId) => 1 + 0.04 * (RARITY_ORDER[r] - 3);
/** Recharge de référence de chaque type de compétence. */
const REF_CD: Record<Slot, number> = { basic: 0, special: 3, ultimate: 5 };
/** Puissance de référence (rareté Rare, recharge de référence), par rôle et type de compétence. */
export const SKILL_BUDGET: Partial<Record<RoleId, Partial<Record<Slot, number>>>> = {
  attacker: { basic: 3.37, special: 5.45, ultimate: 6.92 },
  assassin: { basic: 3.37, special: 4.99, ultimate: 6.42 },
  controller: { basic: 2.79, special: 5.08, ultimate: 6.73 },
  healer: { basic: 2.2 },
  support: { basic: 2.5, ultimate: 5.63 },
};
/** Fourchette tolérée autour de l'enveloppe. */
export const BAND = { low: 0.82, high: 1.12 };

const TARGET_WEIGHT: Partial<Record<SkillEffect['target'], number>> = { enemy: 1, randomEnemies: 1, allEnemies: 3, self: 1 };

/** Puissance offensive d'une compétence (dégâts basés sur l'ATQ uniquement). */
export function skillPower(sk: SkillDef): number {
  let t = 0;
  for (const e of sk.effects) {
    if (e.kind !== 'damage' || (e.scaling && e.scaling !== 'atk')) continue;
    let m = e.mult * (e.hits ?? 1) * (TARGET_WEIGHT[e.target] ?? 1) * (1 + 0.5 * (e.ignoreDefPct ?? 0));
    if (e.bonusVs?.length) m *= 1 + 0.2 * (e.bonusPct ?? 0.5);
    if (e.executeBelow) m *= 1.08;
    t += m;
  }
  return t;
}

/** Puissance ramenée à la rareté Rare et à la recharge de référence, divisée par l'enveloppe du rôle (1 = pile dans la norme). */
export function skillRatio(h: HeroDef, sk: SkillDef): number | null {
  if (sk.slot === 'passive') return null;
  const budget = SKILL_BUDGET[h.role]?.[sk.slot];
  const p = skillPower(sk);
  if (!budget || p <= 0) return null;
  return (p * (sk.cooldown + 1)) / (REF_CD[sk.slot] + 1) / rarityFactor(h.rarity) / budget;
}

const round05 = (x: number) => Math.round(x * 20) / 20;

function balanceSkill(h: HeroDef, sk: SkillDef): SkillDef {
  const r = skillRatio(h, sk);
  if (r === null || (r >= BAND.low && r <= BAND.high)) return sk;
  const k = (r > BAND.high ? BAND.high : BAND.low) / r;
  return { ...sk, effects: sk.effects.map((e) => (e.kind === 'damage' && (!e.scaling || e.scaling === 'atk') ? { ...e, mult: Math.max(0.1, round05(e.mult * k)) } : e)) };
}

/** Fourchette de vitesse de base : jusqu'à 8 sous le gabarit du rôle, jusqu'à 2 + rang de rareté au-dessus. */
export function speedRange(h: HeroDef): [number, number] {
  const tpl = ROLES[h.role].template.spd;
  return [tpl - 8, tpl + 2 + RARITY_ORDER[h.rarity]];
}

export function balanceHero(h: HeroDef): HeroDef {
  const [lo, hi] = speedRange(h);
  return { ...h, baseSpd: Math.min(hi, Math.max(lo, h.baseSpd)), skills: h.skills.map((sk) => balanceSkill(h, sk)) };
}
