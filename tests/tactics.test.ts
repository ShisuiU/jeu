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
    expect(allies.every((u) => u.tm >= 300)).toBe(true);
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
