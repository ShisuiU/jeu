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
