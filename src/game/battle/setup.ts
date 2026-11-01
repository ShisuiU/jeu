import { HERO_BY_ID } from '../../data/heroes';
import { RARITIES } from '../../data/rarities';
import { ENEMIES, enemyStats } from '../../data/enemies';
import type { SkillDef } from '../../data/types';
import { computeStats } from '../stats';
import type { Unit, UnitSetup } from './types';
import { effectiveCooldown } from './skillMods';
import { applyGearBonus } from '../gear';

function initialCooldowns(skills: SkillDef[], levels: Record<string, number>): Record<string, number> {
  // Les ultimes commencent à mi-recharge : pas de déchaînement dès le premier tour.
  return Object.fromEntries(skills.map((s) => [s.id, s.slot === 'ultimate' ? Math.ceil(effectiveCooldown(s, levels[s.id] ?? 1) / 2) : 0]));
}

export function buildUnit(setup: UnitSetup, side: 'ally' | 'enemy', idx: number): Unit {
  if (setup.kind === 'hero') {
    const d = HERO_BY_ID[setup.refId];
    const lv = setup.skillLevels ?? {};
    const raw = computeStats(d, { level: setup.level, rank: setup.rank ?? RARITIES[d.rarity].startRank, ascension: setup.ascension ?? 0, awaken: setup.awaken ?? 0 });
    const base = setup.gear ? applyGearBonus(raw, setup.gear) : raw;
    return {
      id: `${side}${idx}`, side, slot: setup.slot, kind: 'hero', refId: d.id, heroUid: setup.heroUid, name: d.name, level: setup.level,
      affinity: d.affinity, role: d.role, faction: d.faction, isBoss: false, base, hp: base.hp, tm: 0,
      cooldowns: initialCooldowns(d.skills, lv), statuses: [], skills: d.skills, skillLevels: lv, alive: true, flags: setup.gear?.lifesteal ? { leech: setup.gear.lifesteal } : {},
    };
  }
  const e = ENEMIES[setup.refId];
  if (!e) throw new Error(`Ennemi inconnu : ${setup.refId}`);
  const base = enemyStats(e, setup.level, setup.statMult, setup.hpMult);
  return {
    id: `${side}${idx}`, side, slot: setup.slot, kind: 'enemy', refId: e.id, name: e.name, level: setup.level,
    affinity: e.affinity, role: e.role, isBoss: !!e.boss, base, hp: base.hp, tm: 0,
    cooldowns: initialCooldowns(e.skills, {}), statuses: [], skills: e.skills, skillLevels: {}, alive: true, flags: {},
  };
}
