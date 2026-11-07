import { describe, expect, it } from 'vitest';
import { createBattle, performAction } from '../src/game/battle/engine';
import type { BattleState, Unit, UnitSetup } from '../src/game/battle/types';

// Combos, achèvements et retrait de bonus (v1.41) : la cible affaiblie encaisse plus.
const hero = (refId: string, slot = 0): UnitSetup => ({ kind: 'hero', refId, slot, level: 30, heroUid: refId });
const foe = (refId: string, slot = 0): UnitSetup => ({ kind: 'enemy', refId, slot, level: 30, hpMult: 50 });

/** Fait agir `actorRef` avec sa compétence n° `skill` sur l'ennemi, en contrôlant la graine. */
function strike(actorRef: string, skill: number, prep: (s: BattleState, foe: Unit) => void, seed = 3) {
  const s = createBattle([hero(actorRef)], [[foe('hollow_soldier')]], { seed });
  const me = s.units.find((u) => u.side === 'ally')!;
  const target = s.units.find((u) => u.side === 'enemy')!;
  prep(s, target);
  me.cooldowns = {};
  s.activeId = me.id;
  s.events = [];
  const before = target.hp;
  performAction(s, { skillId: me.skills[skill].id, targetId: target.id });
  return { dealt: before - target.hp, s, target };
}
const poison = (s: BattleState, t: Unit) => t.statuses.push({ uid: 999, status: 'poison', turns: 3, value: 0, sourceId: 'x', appliedAt: s.actionCount + 99 });

describe('combos', () => {
  it('le stylet de Corvin frappe plus fort une cible empoisonnée', () => {
    const plain = strike('corvin', 1, () => {});
    const combo = strike('corvin', 1, poison);
    expect(combo.dealt).toBeGreaterThan(plain.dealt * 1.3);
    expect(combo.s.events.some((e) => e.kind === 'damage' && e.combo)).toBe(true);
  });
  it('achèvement de Brann sous 30 % de PV', () => {
    const full = strike('brann', 0, () => {});
    const low = strike('brann', 0, (_s, t) => { t.hp = Math.round(t.base.hp * 0.2); });
    expect(low.dealt).toBeGreaterThan(full.dealt * 1.3);
  });
  it('Isel retire les bonus ennemis', () => {
    const r = strike('isel', 0, (s, t) => { t.statuses.push({ uid: 998, status: 'atkUp', turns: 3, value: 0.5, sourceId: t.id, appliedAt: s.actionCount }); });
    expect(r.target.statuses.some((x) => x.status === 'atkUp')).toBe(false);
    expect(r.s.events.some((e) => e.kind === 'dispel')).toBe(true);
  });
  it('Torvald provoque la cible choisie', () => {
    const r = strike('torvald', 1, () => {});
    expect(r.target.statuses.some((x) => x.status === 'taunt') || r.s.events.some((e) => e.kind === 'resist')).toBe(true);
  });
});
