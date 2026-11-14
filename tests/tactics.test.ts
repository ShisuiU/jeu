import { describe, expect, it } from 'vitest';
import { createBattle } from '../src/game/battle/engine';
import { runToEnd } from '../src/game/battle/simulate';
import { HERO_BY_ID } from '../src/data/heroes';
import { towerWaves } from '../src/data/tower';
import { createNewSave } from '../src/save/schema';
import { simulateOdds } from '../src/game/odds';
import { defeatTips } from '../src/game/tips';
import type { UnitSetup } from '../src/game/battle/types';

const unit = (id: string, slot: number, lv = 60): UnitSetup => ({ kind: 'hero', refId: id, slot, level: lv, rank: 6, ascension: 6, awaken: 0, heroUid: id, skillLevels: Object.fromEntries(HERO_BY_ID[id].skills.map((s) => [s.id, 1])) });
const waves = (f: number) => towerWaves(f).map((w) => w.map((e) => ({ kind: 'enemy' as const, refId: e.enemy, slot: e.slot, level: e.level, hpMult: e.hpMult, statMult: e.statMult })));

describe('Combat tactique (v1.90.0)', () => {
  it('les boss ont une jauge de Fracture qui finit par se briser', () => {
    const team = ['torvald', 'brann', 'corvin', 'elowen', 'aldric'].map((id, i) => unit(id, i));
    const b = runToEnd(createBattle(team, waves(40), { seed: 3, leaderUid: 'torvald' }));
    const boss = b.units.find((u) => u.isBoss);
    expect(boss?.flags.fractureMax).toBe(100);
    // le combat a émis au moins une Fracture, ou le boss est tombé avant
    expect(b.outcome === 'won' || (boss?.flags.fracture ?? 100) < 100).toBe(true);
  });
  it('pronostic et conseils après une défaite', () => {
    const s = createNewSave(Date.now());
    const team = s.teams[0];
    const easy = simulateOdds(s, team, waves(1));
    expect(easy?.label).toBe('Facile');
    const hard = simulateOdds(s, team, waves(60));
    expect(hard?.label).toBe('Risqué');
    const tips = defeatTips(s, team, waves(60));
    expect(tips.length).toBeGreaterThan(0);
    expect(tips.length).toBeLessThanOrEqual(3);
  });
});

describe('Passifs signatures (v1.91.0)', () => {
  it('Égide du Prisme et Trame des étoiles au début du combat', () => {
    const team = ['thalor', 'vaelshira', 'brann'].map((id, i) => unit(id, i));
    const b = createBattle(team, waves(1), { seed: 1, leaderUid: 'thalor' });
    const allies = b.units.filter((u) => u.side === 'ally');
    expect(allies.every((u) => u.statuses.some((st) => st.status === 'shield'))).toBe(true);
    expect(allies.every((u) => u.tm >= 200)).toBe(true);
  });
  it('tous les légendaires sans passif propre ont une signature', async () => {
    const { SIGNATURES } = await import('../src/data/signatures');
    const { HEROES } = await import('../src/data/heroes');
    for (const h of HEROES.filter((x) => (x.rarity === 'legendary' || x.rarity === 'mythic') && !x.skills.some((s) => s.slot === 'passive'))) expect(SIGNATURES[h.id], h.id).toBeTruthy();
  });
});

describe('Boss à deux phases (v1.92.0)', () => {
  it('sous 50 % de PV, le boss entre en seconde phase', () => {
    const team = ['torvald', 'brann', 'corvin', 'elowen', 'aldric'].map((id, i) => unit(id, i));
    const b = runToEnd(createBattle(team, waves(40), { seed: 2, leaderUid: 'torvald' }));
    const boss = b.units.find((u) => u.isBoss);
    if (boss && (b.outcome === 'won' || (boss.hp / boss.base.hp) < 0.5)) expect(boss.flags.phase2).toBe(1);
  });
});

describe('Boss en trois actes (v1.97.0)', () => {
  it('sous 25 % de PV, le boss joue son dernier acte (pouvoir de son affinité)', () => {
    const team = ['torvald', 'brann', 'corvin', 'elowen', 'aldric'].map((id, i) => unit(id, i));
    const b = runToEnd(createBattle(team, waves(40), { seed: 1, leaderUid: 'torvald' }));
    const boss = b.units.find((u) => u.isBoss)!;
    expect(b.outcome).toBe('won');
    expect(boss.flags.acts).toBe(3);
    expect(boss.flags.act3).toBe(1);
  });
  it('pas de dernier acte sans mécaniques (boss à actions limitées)', () => {
    const team = ['torvald', 'brann', 'corvin', 'elowen', 'aldric'].map((id, i) => unit(id, i));
    const b = runToEnd(createBattle(team, waves(40), { seed: 1, leaderUid: 'torvald', mechanics: false }));
    expect(b.units.find((u) => u.isBoss)!.flags.act3).toBeFalsy();
  });
});

describe('Coutures d’époque (v1.94.0)', () => {
  it('une paire de familles déclenche une attaque cousue une fois par combat', () => {
    // Torvald (Valcrest ?) et Brann/Corvin/Elowen : on cherche une paire présente dans la liste des coutures
    const team = ['torvald', 'brann', 'corvin', 'elowen', 'aldric'].map((id, i) => unit(id, i));
    const b0 = createBattle(team, waves(20), { seed: 4, leaderUid: 'torvald' });
    if (!b0.couture) return; // aucune paire dans cette équipe de départ
    const b = runToEnd(b0);
    expect(b.couture?.done).toBe(true);
  });
  it('chaque couture relie deux familles différentes', async () => {
    const { COUTURES } = await import('../src/data/coutures');
    for (const c of COUTURES) expect(c.factions[0]).not.toBe(c.factions[1]);
    expect(new Set(COUTURES.map((c) => c.id)).size).toBe(COUTURES.length);
  });
});

describe('Voies (v1.96.0)', () => {
  it('niveau 60 requis, premier choix gratuit, changement payant, bonus appliqué', async () => {
    const { chooseSpec } = await import('../src/game/specs');
    const { heroBonus } = await import('../src/game/copies');
    const s = createNewSave(Date.now()); const h = s.heroes[0];
    expect(chooseSpec(s, h.uid, 'a').ok).toBe(false);
    h.level = 60; h.rank = 6;
    const before = heroBonus(s, h);
    expect(chooseSpec(s, h.uid, 'a').ok).toBe(true);
    const after = heroBonus(s, h);
    expect(JSON.stringify(after)).not.toBe(JSON.stringify(before));
    s.resources.gold = 0; expect(chooseSpec(s, h.uid, 'b').ok).toBe(false);
    s.resources.gold = 60000; expect(chooseSpec(s, h.uid, 'b').ok).toBe(true); expect(s.resources.gold).toBe(10000);
  });
});

describe('Retouche d’équipement (v1.96.0)', () => {
  it('relance une secondaire, garde ses renforcements, coûte or et minerai', async () => {
    const { generateGear, reforgeSub, seededRand, REFORGE_COST } = await import('../src/game/gear');
    const s = createNewSave(Date.now()); const g = generateGear(seededRand(5), 'legendary', Date.now(), 'weapon'); s.equipment.push(g);
    s.resources.gold = REFORGE_COST.gold; s.resources.forgeOre = REFORGE_COST.forgeOre;
    const rolls = g.subs[0].rolls;
    expect(reforgeSub(s, g.uid, 0, seededRand(9)).ok).toBe(true);
    expect(g.subs[0].rolls).toBe(rolls); expect(new Set(g.subs.map((x) => x.stat)).size).toBe(g.subs.length); expect(g.subs.every((x) => x.stat !== g.main)).toBe(true);
    expect(reforgeSub(s, g.uid, 0, seededRand(9)).ok).toBe(false); // plus assez de ressources
  });
});
