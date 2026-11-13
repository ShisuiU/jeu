import { describe, expect, it } from 'vitest';
import { createHeroInstance, createNewSave } from '../src/save/schema';
import { HEROES } from '../src/data/heroes';
import { applyResonance, resonanceLevel } from '../src/game/resonance';
import { RARITIES } from '../src/data/rarities';
import { BALANCE } from '../src/data/balance';
import { computeStats, powerOf } from '../src/game/stats';

describe('Résonance (v1.87.0)', () => {
  it('les héros prennent le niveau du 5ᵉ meilleur, dans la limite de leur rang', () => {
    const t = Date.now(); const s = createNewSave(t);
    s.heroes = HEROES.slice(0, 7).map((h) => createHeroInstance(h.id, t));
    s.heroes.forEach((h, i) => { h.rank = 6; h.level = [60, 58, 55, 50, 45, 3, 1][i]; });
    s.heroes[6].rank = 1; // rang 1 : niveau 10 au plus
    expect(resonanceLevel(s)).toBe(45);
    expect(applyResonance(s)).toBe(2);
    expect(s.heroes[5].level).toBe(45);
    expect(s.heroes[6].level).toBe(10);
    expect(s.heroes[0].level).toBe(60);
  });
  it('moins de 5 héros : pas de résonance', () => {
    const t = Date.now(); const s = createNewSave(t);
    s.heroes = s.heroes.slice(0, 4);
    expect(resonanceLevel(s)).toBe(0);
    expect(applyResonance(s)).toBe(0);
  });
});

describe('Écart de rareté (v1.87.0)', () => {
  it('au maximum, un légendaire vaut environ 1,35 à 1,45 commun', () => {
    const med = (r: string) => { const a = HEROES.filter((h) => h.rarity === r).map((h) => powerOf(computeStats(h, { level: 60, rank: 6, ascension: 6, awaken: 0 } as never))).sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
    const ratio = med('legendary') / med('common');
    expect(ratio).toBeGreaterThan(1.27);
    expect(ratio).toBeLessThan(1.5);
    expect(BALANCE.hero.rankBonus).toBeLessThan(0.06);
    expect(RARITIES.mythic.statMult).toBeGreaterThan(RARITIES.legendary.statMult);
  });
});

describe('Potion d’ascension unique (v1.88.0)', () => {
  it('les anciennes potions sont converties (majeure = 3, suprême = 6)', async () => {
    const { migrateSave } = await import('../src/save/migrations');
    const old = JSON.parse(JSON.stringify(createNewSave(Date.now())));
    old.resources.potionMinor = 5; old.resources.potionGreater = 2; old.resources.potionSupreme = 1;
    const m = migrateSave(old) as unknown as { resources: Record<string, number> };
    expect(m.resources.potionMinor).toBe(5 + 6 + 6);
    expect(m.resources.potionGreater).toBeUndefined();
    expect(m.resources.potionSupreme).toBeUndefined();
    expect(BALANCE.upgrades.ascension.every((a) => a.potion === 'potionMinor')).toBe(true);
  });
});
