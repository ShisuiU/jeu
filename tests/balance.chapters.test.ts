import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../src/data/campaign';
import { createBattle } from '../src/game/battle/engine';
import { runToEnd } from '../src/game/battle/simulate';
import { stageWaves } from '../src/game/campaign';
import type { UnitSetup } from '../src/game/battle/types';
import { HERO_BY_ID } from '../src/data/heroes';

const TEAMS: Record<number, string[]> = {
  2: ['aldric', 'brann', 'corvin', 'elowen', 'torvald'],
  3: ['aldric', 'ysolde', 'corvin', 'elowen', 'maelis'],
  4: ['aldric', 'ysolde', 'kaedra', 'orin', 'maelis'],
  5: ['aldric', 'ysolde', 'kaedra', 'orin', 'tamsin'],
  6: ['varkhaal', 'ysolde', 'nerissa', 'orin', 'tamsin'],
  7: ['varkhaal', 'ysolde', 'nerissa', 'orin', 'caelum'],
};
function team(n: number, lv: number): UnitSetup[] {
  return TEAMS[n].map((id, i) => {
    const asc = Math.max(0, Math.min(6, Math.floor(lv / 10)));
    return { kind: 'hero', refId: id, slot: [0, 1, 2, 3, 4][i], level: lv, rank: Math.max(Math.ceil(lv / 10), 1), ascension: asc, heroUid: id, skillLevels: Object.fromEntries(HERO_BY_ID[id].skills.map((s) => [s.id, 2])) };
  });
}
describe('équilibrage des chapitres 2 à 7 (simulation)', () => {
  const rate = (n: number, i: number, off: number, seeds = 14) => {
    const st = CHAPTERS[n - 1].stages[i - 1];
    const elv = Math.max(...st.waves.flat().map((e) => e.level));
    let w = 0;
    for (let seed = 1; seed <= seeds; seed++) if (runToEnd(createBattle(team(n, Math.min(60, elv + off)), stageWaves(st, 'normal'), { seed, leaderUid: TEAMS[n][0] })).outcome === 'won') w++;
    return w / seeds;
  };
  for (let n = 2; n <= 7; n++) {
    it(`chapitre ${n} : le boss se bat au niveau des ennemis, pas avant`, () => {
      expect(rate(n, 10, 0)).toBeGreaterThanOrEqual(0.3);
      expect(rate(n, 10, -8)).toBeLessThan(0.5);
      expect(rate(n, 5, -8)).toBeLessThan(0.8);
    });
  }
});
