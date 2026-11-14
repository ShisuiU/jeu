import type { HeroDef, RarityId, RoleId, SkillDef, SkillEffect, StatId } from './types';
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

// ─── Auras de chef (v1.75.1) ───
// Une aura s'applique aux statistiques complètes (équipement compris) : elle doit rester modeste.
// Budget selon la rareté, exprimé en « % de PV pour toute l'équipe » ; chaque statistique a un poids
// (la vitesse vaut deux fois plus cher, la précision ou la résistance moins) et une aura limitée à une
// famille ou une affinité peut monter plus haut, puisqu'elle touche moins de héros.
export const AURA_BUDGET: Record<RarityId, number> = { common: 6, uncommon: 8, rare: 10, epic: 12, legendary: 14, mythic: 16 };
export const AURA_WEIGHT: Record<StatId, number> = { hp: 1, def: 1, atk: 1.2, spd: 2, critRate: 1.2, critDmg: 0.5, acc: 0.6, res: 0.6 };
export const AURA_SCOPED = 0.6;

/** Plafond (en fraction, 0,12 = 12 %) de l'aura de chef d'un héros. */
export function auraCap(h: HeroDef): number {
  const ls = h.leaderSkill;
  if (!ls) return 0;
  return Math.floor(AURA_BUDGET[h.rarity] / (AURA_WEIGHT[ls.stat] * (ls.scope === 'all' ? 1 : AURA_SCOPED))) / 100;
}

function balanceLeader(h: HeroDef): HeroDef['leaderSkill'] {
  const ls = h.leaderSkill;
  if (!ls) return ls;
  const cap = auraCap(h);
  if (ls.pct <= cap + 1e-9) return ls;
  const n = Math.round(cap * 100);
  const description = /^\+\d+\s?%?\s?/.test(ls.description) ? ls.description.replace(/^\+\d+\s?%?\s?/, `+${n} % `) : `+${n} % ${ls.description}`;
  return { ...ls, pct: cap, description };
}

/** Ajustements ciblés (v1.96.0) : héros nettement au-dessus de leur rareté en simulation (Tour, 89 héros). */
export const OUTLIER_ADJ: Record<string, number> = {};

/** Retouches de kit (v1.96.0) : leur force vient de soins, boucliers et bonus d'équipe en % des PV, pas de leurs stats.
 *  Simulation avant retouche (étage de Tour, médiane de leur rareté 61-62) : Solenne 66, Corentin 65, Vael'Shira 64. */
type Eff = SkillDef['effects'][number];
const tweak = (sk: SkillDef, f: (e: Eff) => Eff, cd?: number, description?: string): SkillDef => ({ ...sk, cooldown: cd ?? sk.cooldown, effects: sk.effects.map(f), description: description ?? sk.description });
export const KIT_ADJ: Record<string, (sk: SkillDef) => SkillDef> = {
  solenne: (sk) => sk.slot === 'special' ? tweak(sk, (e) => (e.kind === 'heal' ? { ...e, pctMaxHp: 0.18 } : e), 4, 'Soigne tous les alliés de 18 %, retire leurs malus et augmente leur DÉF de 30 %.')
    : sk.slot === 'ultimate' ? tweak(sk, (e) => (e.kind === 'revive' ? { ...e, pctMaxHp: 0.3 } : e.kind === 'shield' ? { ...e, pctMaxHp: 0.12 } : e), undefined, 'Ressuscite tous les alliés tombés avec 30 % de PV, bouclier de 12 % pour toute l’équipe.') : sk,
  corentin: (sk) => sk.slot === 'special' ? tweak(sk, (e) => (e.kind === 'shield' ? { ...e, pctMaxHp: 0.08 } : e.kind === 'status' && e.status === 'defUp' ? { ...e, value: 0.2 } : e), undefined, 'Provoque tous les ennemis pendant 2 tours, augmente la DÉF de tous les alliés de 20 % et leur donne un bouclier de 8 % de ses PV max.')
    : sk.slot === 'ultimate' ? tweak(sk, (e) => (e.kind === 'status' && e.status === 'freeze' ? { ...e, chance: 0.3 } : e), undefined, 'Attaque tous les ennemis (dégâts basés sur la DÉF). 30 % de chances de les geler 1 tour. Se soigne de 15 %.') : sk,
  vaelshira: (sk) => sk.slot === 'special' ? tweak(sk, (e) => (e.kind === 'status' && e.status === 'atkUp' ? { ...e, value: 0.35 } : e.kind === 'status' && e.status === 'spdUp' ? { ...e, value: 0.2 } : e), undefined, 'Augmente l’ATQ (+35 %) et la vitesse (+20 %) de tous les alliés pendant 2 tours.') : sk,
};

export function balanceHero(h: HeroDef): HeroDef {
  const [lo, hi] = speedRange(h);
  const k = OUTLIER_ADJ[h.id];
  const bias = k ? { ...h.bias, hp: (h.bias?.hp ?? 1) * k, atk: (h.bias?.atk ?? 1) * k, def: (h.bias?.def ?? 1) * k } : h.bias;
  return { ...h, bias, baseSpd: Math.min(hi, Math.max(lo, h.baseSpd)), skills: h.skills.map((sk) => (KIT_ADJ[h.id] ?? ((x: SkillDef) => x))(balanceSkill(h, sk))), leaderSkill: balanceLeader(h) };
}
