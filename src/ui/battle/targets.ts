import type { SkillDef } from '../../data/types';
import type { BattleState, Unit } from '../../game/battle/types';

// Extrait de Battle.tsx (v1.98.0).
/** Cibles prévues d'une compétence, pour lancer l'animation avant le calcul (sans tirage aléatoire). */
export function previewTargets(s: BattleState, actor: Unit, sk: SkillDef, targetId?: string): Unit[] {
  const main = sk.effects.find((e) => e.kind === 'damage') ?? sk.effects.find((e) => e.kind === 'heal' || e.kind === 'shield' || e.kind === 'revive') ?? sk.effects[0];
  if (!main) return [actor];
  const foes = s.units.filter((u) => u.alive && u.side !== actor.side);
  const friends = s.units.filter((u) => u.alive && u.side === actor.side);
  const picked = targetId ? s.units.find((u) => u.id === targetId && u.alive) : undefined;
  switch (main.target) {
    case 'enemy': return [picked && picked.side !== actor.side ? picked : foes[0]].filter(Boolean) as Unit[];
    case 'allEnemies': return foes;
    case 'randomEnemies': return foes.slice(0, 1);
    case 'ally': return [picked && picked.side === actor.side ? picked : actor];
    case 'allAllies': return friends;
    case 'lowestAlly': return [...friends].sort((a, b) => a.hp / a.base.hp - b.hp / b.base.hp).slice(0, 1);
    default: return [actor];
  }
}
