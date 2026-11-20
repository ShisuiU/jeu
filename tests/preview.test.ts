import { describe, expect, it } from 'vitest';
import { beginTurn, createBattle, performAction, previewAction, validTargets } from '../src/game/battle/engine';
import { HERO_BY_ID } from '../src/data/heroes';
import { towerWaves } from '../src/data/tower';
import type { UnitSetup } from '../src/game/battle/types';

const unit = (id: string, slot: number, lv = 50): UnitSetup => ({ kind: 'hero', refId: id, slot, level: lv, rank: 4, ascension: 3, awaken: 0, heroUid: id, skillLevels: Object.fromEntries(HERO_BY_ID[id].skills.map((s) => [s.id, 1])) });
const waves = (f: number) => towerWaves(f).map((w) => w.map((e) => ({ kind: 'enemy' as const, refId: e.enemy, slot: e.slot, level: e.level, hpMult: e.hpMult, statMult: e.statMult })));

describe('Prévisualisation tactique (v1.120.0)', () => {
  it('estime les PV perdus sans toucher au combat, et l’estimation est proche du résultat réel', () => {
    const team = ['torvald', 'brann', 'corvin', 'elowen', 'aldric'].map((id, i) => unit(id, i));
    const s = createBattle(team, waves(20), { seed: 7, leaderUid: 'torvald' });
    let actor = beginTurn(s);
    let guard = 0;
    while (actor && actor.side !== 'ally' && guard++ < 20) { performAction(s, { skillId: actor.skills[0].id }); actor = beginTurn(s); }
    expect(actor?.side).toBe('ally');
    const sk = actor!.skills.find((k) => k.slot === 'basic')!;
    const target = validTargets(s, actor!, sk)[0];
    const snap = JSON.stringify({ units: s.units.map((u) => [u.id, u.hp]), rng: s.rng });
    const p = previewAction(s, { skillId: sk.id, targetId: target.id });
    expect(JSON.stringify({ units: s.units.map((u) => [u.id, u.hp]), rng: s.rng })).toBe(snap); // rien n'a bougé
    expect(p[target.id]?.loss).toBeGreaterThan(0);
    const hp0 = target.hp;
    performAction(s, { skillId: sk.id, targetId: target.id });
    const real = hp0 - Math.max(0, target.hp);
    expect(real).toBeGreaterThan(p[target.id].loss * 0.5);
    expect(real).toBeLessThan(p[target.id].loss * 2.2);
  });
});
