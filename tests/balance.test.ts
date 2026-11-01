import { describe, expect, it } from 'vitest';
import { createBattle } from '../src/game/battle/engine';
import { runToEnd } from '../src/game/battle/simulate';
import { CHAPTERS } from '../src/data/campaign';
import { stageWaves, starsFor } from '../src/game/campaign';
import type { UnitSetup } from '../src/game/battle/types';
import { RARITIES } from '../src/data/rarities';
import { HERO_BY_ID } from '../src/data/heroes';

// Équilibrage du chapitre 1 avec l'équipe de départ, vérifié par simulation automatique.
const team = (lv: (id: string) => number, ids = ['torvald', 'brann', 'corvin', 'elowen']): UnitSetup[] =>
  ids.map((id, i) => ({ kind: 'hero', refId: id, slot: [0, 1, 2, 3, 4][i], level: Math.min(lv(id), RARITIES[HERO_BY_ID[id].rarity].startRank * 10), heroUid: id }));

function winRate(stageIdx: number, level: number, n = 120, ids?: string[]) {
  const st = CHAPTERS[0].stages[stageIdx];
  let wins = 0, stars = 0;
  for (let seed = 1; seed <= n; seed++) {
    const b = runToEnd(createBattle(team(() => level, ids), stageWaves(st, 'normal'), { seed, leaderUid: 'torvald' }));
    if (b.outcome === 'won') { wins++; stars += starsFor(b.units.filter((u) => u.side === 'ally' && !u.alive).length); }
  }
  return { rate: wins / n, stars: wins ? stars / wins : 0 };
}

export const LEVEL_PLAN = [1, 1, 2, 2, 3, 3, 4, 4, 5, 6];

describe('équilibrage du chapitre 1', () => {
  it('rapport', () => {
    const rows: string[] = [];
    CHAPTERS[0].stages.forEach((st, i) => {
      const under = winRate(i, Math.max(1, LEVEL_PLAN[i] - 1));
      const at = winRate(i, LEVEL_PLAN[i]);
      rows.push(`${st.id} niv.${LEVEL_PLAN[i]}: ${(at.rate * 100).toFixed(0)}% (${at.stars.toFixed(1)}★) | niv.${Math.max(1, LEVEL_PLAN[i] - 1)}: ${(under.rate * 100).toFixed(0)}%`);
    });
    rows.push(`boss niv.8: ${(winRate(9, 8).rate * 100).toFixed(0)}%`);
    console.log(rows.join('\n'));
  });
  it('1-1 est gagnable au niveau 1', () => {
    expect(winRate(0, 1).rate).toBeGreaterThan(0.9);
  });
  it('le boss demande de la progression', () => {
    expect(winRate(9, 3).rate).toBeLessThan(0.3);
    expect(winRate(9, 8).rate).toBeGreaterThan(0.6);
  });
});
