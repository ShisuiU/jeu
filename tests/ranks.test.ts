import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { rankEntry } from '../src/game/ranks';

describe('classements : données publiées', () => {
  it('pseudo, avatar et scores seulement', () => {
    const s = createNewSave(1000);
    s.profile.name = '  Un nom beaucoup trop long pour le classement  ';
    s.arena.rating = 1432.6; s.progress.tower.floor = 17; s.worldBoss.best = { normal: 50000, hard: 81234.4 };
    const e = rankEntry(s);
    expect(Object.keys(e).sort()).toEqual(['arena', 'avatar', 'boss', 'level', 'name', 'power', 'tower', 'updatedAt']);
    expect(e.name.length).toBeLessThanOrEqual(18);
    expect(e).toMatchObject({ arena: 1433, tower: 17, boss: 81234 });
    expect(e.power).toBeGreaterThan(0);
  });
});
