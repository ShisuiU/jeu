import { AFFINITIES } from '../../data/affinities';
import type { SkillDef } from '../../data/types';
import { availableSkills, hpPct, rand, shieldOf, targetKind, validTargets } from './engine';
import { BUFFS, DEBUFFS, type Action, type BattleState, type Unit } from './types';

// IA du combat automatique (et des ennemis). Règles simples mais cohérentes :
//  • résurrection seulement si un allié est tombé ; soins seulement si quelqu'un est blessé ;
//  • boucliers et bonus si utiles ; sinon la compétence la plus puissante disponible ;
//  • ciblage : provocation respectée, affinité favorable, cibles affaiblies, boss en dernier
//    pour les attaques de zone… et un peu d'aléatoire côté ennemi pour éviter la monotonie.

const ORDER: Record<SkillDef['slot'], number> = { ultimate: 0, special: 1, basic: 2, passive: 9 };

function usefulness(s: BattleState, u: Unit, sk: SkillDef): boolean {
  const allies = s.units.filter((x) => x.side === u.side && x.alive);
  const dead = s.units.filter((x) => x.side === u.side && !x.alive);
  const kinds = new Set(sk.effects.map((e) => e.kind));
  if (kinds.has('revive')) return dead.length > 0;
  // Retrait de bonus seul : utile seulement si un ennemi en porte.
  if (kinds.has('dispel') && !kinds.has('damage')) return s.units.some((x) => x.side !== u.side && x.alive && x.statuses.some((st) => BUFFS.includes(st.status)));
  if (kinds.has('damage')) return true;
  if (kinds.has('heal') && !kinds.has('cleanse')) return allies.some((a) => hpPct(a) < 0.7);
  if (kinds.has('heal') && kinds.has('cleanse')) return allies.some((a) => hpPct(a) < 0.75 || a.statuses.some((x) => DEBUFFS.includes(x.status) && x.status !== 'taunt'));
  if (kinds.has('shield') && !kinds.has('status')) return allies.some((a) => shieldOf(a) === 0 && hpPct(a) < 0.95) || allies.length > 0 && s.actionCount < 4;
  return true; // bonus, provocation, jauge de tour…
}

function scoreEnemyTarget(s: BattleState, u: Unit, t: Unit, sk: SkillDef): number {
  let score = 1;
  const strong = AFFINITIES[u.affinity].strongAgainst;
  if (strong === t.affinity) score += 0.6;
  if (AFFINITIES[t.affinity].strongAgainst === u.affinity) score -= 0.4;
  const finisher = u.role === 'assassin' || u.role === 'attacker';
  score += (1 - hpPct(t)) * (finisher ? 1.6 : 0.8);
  if (t.role === 'healer') score += 0.35;
  if (t.slot >= 3 && s.units.some((x) => x.side === t.side && x.alive && x.slot < 3)) score -= 0.25;
  const hasDebuff = sk.effects.some((e) => e.kind === 'status' && DEBUFFS.includes(e.status));
  if (hasDebuff && t.isBoss) score += 0.4;
  // Combos : viser la cible affaiblie qui déclenche le bonus, et achever celles presque à terre.
  for (const e of sk.effects) {
    if (e.kind === 'damage' && e.bonusVs?.some((st) => t.statuses.some((x) => x.status === st))) score += 0.7;
    if (e.kind === 'damage' && e.executeBelow && hpPct(t) < e.executeBelow) score += 0.6;
    if (e.kind === 'dispel' && t.statuses.some((x) => BUFFS.includes(x.status))) score += 0.6;
  }
  if (u.side === 'enemy') score += rand(s) * 0.8;
  return score;
}

export function chooseAction(s: BattleState, u: Unit): Action {
  const skills = availableSkills(u).sort((a, b) => ORDER[a.slot] - ORDER[b.slot]);
  const sk = skills.find((x) => usefulness(s, u, x)) ?? skills[skills.length - 1] ?? u.skills[0];
  const kind = targetKind(sk);
  const targets = validTargets(s, u, sk);
  if (kind === 'none' || targets.length === 0) return { skillId: sk.id };
  if (kind === 'ally') return { skillId: sk.id, targetId: [...targets].sort((a, b) => hpPct(a) - hpPct(b))[0].id };
  const best = [...targets].sort((a, b) => scoreEnemyTarget(s, u, b, sk) - scoreEnemyTarget(s, u, a, sk))[0];
  return { skillId: sk.id, targetId: best.id };
}
