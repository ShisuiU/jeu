import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { awakenCheck } from '../src/game/upgrade';
import { sweepTower, towerSweepMax } from '../src/game/towerSweep';
import { ghostRanks } from '../src/game/ranks';
import { BANNER_BY_ID } from '../src/data/summons';
import { DAILY_BONUS } from '../src/data/missions';

describe('Équilibrage v1.60', () => {
  it('éveil sans doublon : possible avec plus d’essence', () => {
    const s = createNewSave(0);
    const h = s.heroes[0];
    const c = awakenCheck(s, h);
    expect(c.cost.copies).toBeUndefined();
    expect(c.cost.awakenEssence).toBe(2 + 6);
    s.heroCopies[h.heroId] = 1;
    const d = awakenCheck(s, h);
    expect(d.cost.copies).toBe(1);
    expect(d.cost.awakenEssence).toBe(2);
  });
  it('Tour : montée rapide des étages bien en dessous de l’équipe, avec leurs récompenses', () => {
    const s = createNewSave(0);
    expect(towerSweepMax(s)).toBe(0);
    for (const h of s.heroes) h.level = 40;
    const max = towerSweepMax(s);
    expect(max).toBe(29); // ennemis niv. 30 = 40 − 10
    const before = s.resources.crystals;
    const r = sweepTower(s);
    expect(r.floors).toBe(29);
    expect(s.progress.tower.floor).toBe(29);
    expect(s.resources.crystals).toBeGreaterThan(before);
    expect(towerSweepMax(s)).toBe(0);
  });
  it('classement complété jusqu’à 10, jamais au-delà', () => {
    expect(ghostRanks('arena', 2)).toHaveLength(8);
    expect(ghostRanks('arena', 12)).toHaveLength(0);
    expect(ghostRanks('tower', 0).every((g) => g.uid.startsWith('ghost:') && g.tower > 0)).toBe(true);
  });
  it('plus de cristaux ; légendaire garanti au 40e appel épique (v1.66.4)', () => {
    expect(BANNER_BY_ID.epic.pity!.every).toBe(40);
    expect(DAILY_BONUS.crystals).toBe(150);
  });
});

describe('Invocations v1.66.4', () => {
  it('l’invocation épique ne garantit plus un Épique à chaque appel, mais un sur dix', () => {
    const b = BANNER_BY_ID.epic;
    expect(b.rates.rare).toBeGreaterThan(40);
    expect((b.rates.epic ?? 0) + (b.rates.legendary ?? 0) + (b.rates.mythic ?? 0)).toBeLessThan(55);
    expect(b.multiGuarantee).toBe('epic');
    expect(Object.values(b.rates).reduce((a, x) => a + (x ?? 0), 0)).toBeCloseTo(100, 5);
  });
});
