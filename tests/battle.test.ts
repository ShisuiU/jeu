import { describe, expect, it } from 'vitest';
import { createBattle, beginTurn, performAction, unitById, validTargets, availableSkills, eff } from '../src/game/battle/engine';
import { runToEnd } from '../src/game/battle/simulate';
import { chooseAction } from '../src/game/battle/ai';
import { parseUpgrade, skillMods } from '../src/game/battle/skillMods';
import type { UnitSetup } from '../src/game/battle/types';
import { HEROES, HERO_BY_ID } from '../src/data/heroes';
import { ENEMIES } from '../src/data/enemies';

const hero = (refId: string, slot: number, level = 1): UnitSetup => ({ kind: 'hero', refId, slot, level, heroUid: refId });
const foe = (refId: string, slot: number, level = 1, hpMult?: number): UnitSetup => ({ kind: 'enemy', refId, slot, level, hpMult });

describe('données de compétences', () => {
  it('toutes les améliorations sont reconnues par le moteur', () => {
    for (const h of HEROES) for (const s of h.skills) for (const u of s.upgrades) expect(parseUpgrade(u), `${s.id}: ${u}`).not.toBeNull();
  });
  it('les niveaux de compétence s’accumulent', () => {
    const sk = HERO_BY_ID.idris.skills[0];
    expect(skillMods(sk, 1).dmg).toBe(0);
    expect(skillMods(sk, 4).dmg).toBeCloseTo(0.15);
  });
  it('tous les ennemis ont une attaque de base', () => {
    for (const e of Object.values(ENEMIES)) expect(e.skills.some((s) => s.slot === 'basic')).toBe(true);
  });
});

describe('moteur de combat', () => {
  it('la plus rapide agit en premier', () => {
    const s = createBattle([hero('kaedra', 0)], [[foe('hollow_shield', 0)]], { seed: 1 });
    const u = beginTurn(s)!;
    expect(u.refId).toBe('kaedra');
  });

  it('les dégâts réduisent les PV et un combat se termine', () => {
    const s = createBattle([hero('brann', 0)], [[foe('hollow_soldier', 0)]], { seed: 7 });
    const u = beginTurn(s)!;
    const target = s.units.find((x) => x.side === 'enemy')!;
    const before = target.hp;
    performAction(s, { skillId: u.skills[0].id, targetId: target.id });
    if (u.side === 'ally') expect(target.hp).toBeLessThan(before);
    runToEnd(s);
    expect(['won', 'lost']).toContain(s.outcome);
  });

  it('déterministe avec la même graine', () => {
    const mk = () => runToEnd(createBattle([hero('brann', 0), hero('elowen', 3)], [[foe('hollow_soldier', 0), foe('rift_hound', 1)]], { seed: 42 }));
    const a = mk(), b = mk();
    expect(a.actionCount).toBe(b.actionCount);
    expect(a.units.map((u) => u.hp)).toEqual(b.units.map((u) => u.hp));
  });

  it('vagues successives', () => {
    const s = runToEnd(createBattle([hero('idris', 0, 30)], [[foe('hollow_soldier', 0)], [foe('hollow_soldier', 0)], [foe('hollow_soldier', 0)]], { seed: 3 }));
    expect(s.outcome).toBe('won');
    expect(s.wave).toBe(3);
  });

  it('provocation : la cible est imposée', () => {
    const s = createBattle([hero('brann', 0), hero('corvin', 1)], [[foe('hollow_knight', 0), foe('hollow_soldier', 1)]], { seed: 5 });
    const knight = s.units.find((u) => u.refId === 'hollow_knight')!;
    const brann = s.units.find((u) => u.refId === 'brann')!;
    brann.statuses.push({ uid: 99, status: 'taunt', turns: 1, value: 0, sourceId: knight.id, appliedAt: -1 });
    expect(validTargets(s, brann, brann.skills[0]).map((u) => u.id)).toEqual([knight.id]);
  });

  it('étourdissement : le tour est sauté', () => {
    const s = createBattle([hero('brann', 0)], [[foe('hollow_soldier', 0)]], { seed: 9 });
    const brann = unitById(s, 'ally0');
    brann.statuses.push({ uid: 1, status: 'stun', turns: 1, value: 0, sourceId: 'x', appliedAt: -1 });
    brann.tm = 999; s.units.find((u) => u.side === 'enemy')!.tm = 0;
    beginTurn(s);
    expect(s.events.some((e) => e.kind === 'skip' && e.target === 'ally0')).toBe(true);
    expect(brann.statuses.some((x) => x.status === 'stun')).toBe(false);
  });

  it('bonus d’attaque et recharge', () => {
    const s = createBattle([hero('brann', 0)], [[foe('hollow_shield', 0, 1, 50)]], { seed: 11 });
    const brann = unitById(s, 'ally0');
    brann.tm = 999;
    beginTurn(s);
    const atk = eff(s, brann, 'atk');
    performAction(s, { skillId: 'brann_2' });
    expect(eff(s, brann, 'atk')).toBeGreaterThan(atk);
    expect(brann.cooldowns.brann_2).toBe(3);
    expect(availableSkills(brann).map((x) => x.id)).toEqual(['brann_1']);
  });

  it('résurrection de Séraphine', () => {
    const s = createBattle([hero('seraphine', 3), hero('brann', 0)], [[foe('hollow_shield', 0, 1, 50)]], { seed: 13 });
    const brann = unitById(s, 'ally1');
    brann.alive = false; brann.hp = 0;
    const sera = unitById(s, 'ally0');
    sera.cooldowns.seraphine_3 = 0;
    sera.tm = 999;
    const u = beginTurn(s)!;
    expect(u.id).toBe('ally0');
    expect(chooseAction(s, u).skillId).toBe('seraphine_3');
    performAction(s, chooseAction(s, u));
    expect(brann.alive).toBe(true);
    expect(brann.hp).toBeGreaterThan(0);
  });

  it('passif de Varkhaal : survit une fois', () => {
    const s = createBattle([hero('varkhaal', 0)], [[foe('hollow_soldier', 0, 40)]], { seed: 2 });
    runToEnd(s);
    const v = unitById(s, 'ally0');
    expect(v.flags.undyingUsed).toBe(1);
  });

  it('le boss est immunisé à l’étourdissement', () => {
    const s = createBattle([hero('azhar', 0, 1)], [[foe('herald', 0, 1, 10)]], { seed: 4 });
    for (let i = 0; i < 40 && s.outcome === 'running'; i++) {
      const u = beginTurn(s); if (!u) break;
      performAction(s, chooseAction(s, u));
    }
    const boss = s.units.find((u) => u.refId === 'herald')!;
    expect(boss.statuses.some((x) => x.status === 'stun')).toBe(false);
  });
});
