import { describe, expect, it } from 'vitest';
import { createNewSave, createHeroInstance } from '../src/save/schema';
import { HEROES } from '../src/data/heroes';
import { claimCollection, collectionClaimable, collectionPct, nextCollectionStep, ownedCount } from '../src/game/collection';
import { heroBonus } from '../src/game/copies';

describe('Paliers de collection', () => {
  it('10 héros différents : palier récupérable, bonus permanent pour tous', () => {
    const s = createNewSave(0);
    expect(collectionClaimable(s)).toEqual([]);
    const owned = new Set(s.heroes.map((h) => h.heroId));
    for (const d of HEROES) { if (ownedCount(s) >= 10) break; if (!owned.has(d.id)) s.heroes.push(createHeroInstance(d.id, 0)); }
    expect(collectionClaimable(s)).toEqual([10]);
    const before = heroBonus(s, s.heroes[0]).pct.atk;
    const epic = s.resources.shardEpic;
    expect(claimCollection(s)).toEqual([10]);
    expect(collectionPct(s)).toBe(1);
    expect(heroBonus(s, s.heroes[0]).pct.atk).toBe(before + 1);
    expect(s.resources.shardEpic).toBeGreaterThan(epic);
    expect(collectionClaimable(s)).toEqual([]);
    expect(nextCollectionStep(s)).toBe(15);
  });
});
