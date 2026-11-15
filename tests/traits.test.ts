import { describe, expect, it } from 'vitest';
import { beginTurn, createBattle, performAction } from '../src/game/battle/engine';
import { chooseAction } from '../src/game/battle/ai';
import { HERO_BY_ID } from '../src/data/heroes';
import { ENEMIES } from '../src/data/enemies';
import { ENEMY_TRAITS, GUARD_SHARE, MENDER_HEAL, SUMMON_MAX } from '../src/data/enemyTraits';
import type { BattleEvent, BattleState, UnitSetup } from '../src/game/battle/types';

// Comportements d'ennemis (v1.106.0) : Secours, Garde, Appel.
const hero = (id: string, slot: number, lv = 30): UnitSetup => ({ kind: 'hero', refId: id, slot, level: lv, rank: 4, ascension: 3, heroUid: id, skillLevels: {} });
const foe = (id: string, slot: number, level = 30): UnitSetup => ({ kind: 'enemy', refId: id, slot, level });

/** Joue le combat en gardant tous les événements. */
function play(s: BattleState, maxActions = 400, focus?: string): BattleEvent[] {
  const all: BattleEvent[] = [];
  for (let i = 0; i < maxActions && s.outcome === 'running'; i++) {
    const u = beginTurn(s);
    all.push(...s.events); s.events = [];
    if (!u) break;
    performAction(s, chooseAction(s, u, u.side === 'ally' ? focus : null));
    all.push(...s.events); s.events = [];
  }
  return all;
}

describe('Comportements d’ennemis', () => {
  it('chaque comportement est porté par un ennemi ordinaire qui existe, et les renforts existent', () => {
    for (const [id, t] of Object.entries(ENEMY_TRAITS)) {
      expect(ENEMIES[id], id).toBeTruthy();
      expect(ENEMIES[id].boss, id).toBeFalsy();
      if (t.trait === 'summoner') expect(ENEMIES[t.minion!], t.minion).toBeTruthy();
    }
  });

  it('Secours : soigne une seule fois l’allié qui passe sous 35 % de PV', () => {
    const team = ['torvald', 'brann', 'corvin'].map((id, i) => hero(id, i, 25));
    const s = createBattle(team, [[foe('hollow_knight', 0), foe('hollow_cantor', 1)]], { seed: 4 });
    const cantor = s.units.find((u) => u.refId === 'hollow_cantor')!;
    const knight = s.units.find((u) => u.refId === 'hollow_knight')!;
    expect(cantor.trait).toBe('mender');
    const ev = play(s, 400, knight.id); // les héros s'acharnent sur le chevalier
    const mends = ev.filter((e) => e.kind === 'trait' && e.trait === 'mender');
    expect(mends.length).toBe(1);
    const m = mends[0] as Extract<BattleEvent, { kind: 'trait' }>;
    expect(m.target).not.toBe(cantor.id);
    // le soin suit immédiatement l'annonce, à hauteur de 30 % des PV max (moins ce qui manquait déjà)
    const i = ev.indexOf(m);
    const heal = ev.slice(i + 1).find((e) => e.kind === 'heal' && e.target === m.target) as Extract<BattleEvent, { kind: 'heal' }>;
    const tgt = s.units.find((u) => u.id === m.target)!;
    expect(heal.amount).toBeGreaterThan(0);
    expect(heal.amount).toBeLessThanOrEqual(Math.round(tgt.base.hp * MENDER_HEAL));
  });

  it('Garde : encaisse une part des coups ciblés sur ses alliés, jamais des attaques de zone', () => {
    const team = [hero('torvald', 0)];
    const s = createBattle(team, [[foe('hollow_soldier', 0), foe('hollow_shield', 1)]], { seed: 2 });
    const soldier = s.units.find((u) => u.refId === 'hollow_soldier')!;
    const guard = s.units.find((u) => u.refId === 'hollow_shield')!;
    expect(guard.trait).toBe('guard');
    // Forcer le tour du héros et frapper le soldat d'un coup simple.
    const h = s.units.find((u) => u.side === 'ally')!;
    s.activeId = h.id;
    const basic = HERO_BY_ID.torvald.skills.find((k) => k.slot === 'basic')!;
    const g0 = guard.hp;
    performAction(s, { skillId: basic.id, targetId: soldier.id });
    const onGuard = s.events.filter((e) => e.kind === 'damage' && e.target === guard.id) as Extract<BattleEvent, { kind: 'damage' }>[];
    const onSoldier = s.events.filter((e) => e.kind === 'damage' && e.target === soldier.id) as Extract<BattleEvent, { kind: 'damage' }>[];
    expect(onGuard.length).toBe(onSoldier.length);
    expect(guard.hp).toBeLessThan(g0);
    expect(s.events.some((e) => e.kind === 'trait' && e.trait === 'guard')).toBe(true);
    // part détournée : environ 30 % × 70 % du coup d'origine
    const share = onGuard[0].amount / (onGuard[0].amount / 0.7 + onSoldier[0].amount);
    expect(share).toBeGreaterThan(GUARD_SHARE * 0.7 - 0.05);
    expect(share).toBeLessThan(GUARD_SHARE * 0.7 + 0.05);

    // Attaque de zone : la Garde n'intervient pas.
    const s2 = createBattle([hero('corvin', 0)], [[foe('hollow_soldier', 0), foe('hollow_shield', 1)]], { seed: 2 });
    const aoe = HERO_BY_ID.corvin.skills.find((k) => k.effects.some((e) => e.kind === 'damage' && e.target === 'allEnemies'));
    if (aoe) {
      const h2 = s2.units.find((u) => u.side === 'ally')!; s2.activeId = h2.id; h2.cooldowns[aoe.id] = 0;
      const sol2 = s2.units.find((u) => u.refId === 'hollow_soldier')!, g2 = s2.units.find((u) => u.refId === 'hollow_shield')!;
      performAction(s2, { skillId: aoe.id });
      const n = (id: string) => s2.events.filter((e) => e.kind === 'damage' && e.target === id).length;
      expect(n(g2.id)).toBe(n(sol2.id)); // un coup chacun, rien de détourné
    }
  });

  it('Appel : renfort quand le groupe faiblit, deux fois au plus, à la place d’un allié tombé', () => {
    const team = ['torvald', 'brann', 'corvin', 'elowen', 'aldric'].map((id, i) => hero(id, i, 20));
    const s = createBattle(team, [[foe('rogue_drone', 0, 25), foe('data_wraith', 1, 25), foe('rogue_drone', 2, 25)]], { seed: 7 });
    const ev = play(s);
    const calls = ev.filter((e) => e.kind === 'trait' && e.trait === 'summoner') as Extract<BattleEvent, { kind: 'trait' }>[];
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.length).toBeLessThanOrEqual(SUMMON_MAX);
    const m = s.units.find((u) => u.id === calls[0].target)!;
    expect(m.summoned).toBe(true);
    expect(m.trait).toBeUndefined();
    expect(m.refId).toBe('rogue_drone');
    // jamais plus de 5 unités par camp, places distinctes parmi les vivants
    const foes = s.units.filter((u) => u.side === 'enemy');
    expect(foes.length).toBeLessThanOrEqual(5);
    expect(s.outcome).not.toBe('running');
  });

  it('désactivés pour les boss à score (nombre d’actions limité) et sur demande', () => {
    const w = [[foe('hollow_cantor', 0), foe('hollow_shield', 1), foe('data_wraith', 2)]];
    const t = [hero('torvald', 0)];
    expect(createBattle(t, w, { seed: 1, turnLimit: 30 }).units.some((u) => u.trait)).toBe(false);
    expect(createBattle(t, w, { seed: 1, traits: false }).units.some((u) => u.trait)).toBe(false);
    expect(createBattle(t, w, { seed: 1 }).units.filter((u) => u.trait).length).toBe(3);
  });
});
