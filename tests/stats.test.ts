import { HERO_LINES } from '../src/data/heroLines';
import { describe, expect, it } from 'vitest';
import { HEROES, HERO_BY_ID } from '../src/data/heroes';
import { computeStats, maxLevelForRank, powerOf } from '../src/game/stats';
import { RARITIES } from '../src/data/rarities';
import { FACTIONS } from '../src/data/factions';

const ART = Object.keys(import.meta.glob('../src/assets/heroes/*/*.webp'));
const hasArt = (id: string, kind: string) => ART.includes(`../src/assets/heroes/${id}/${kind}.webp`);

describe('données des héros', () => {
  it('88 héros aux identifiants uniques et cohérents', () => {
    expect(HEROES).toHaveLength(88);
    expect(new Set(HEROES.map((h) => h.id)).size).toBe(HEROES.length);
    const skillIds = HEROES.flatMap((h) => h.skills.map((s) => s.id));
    expect(new Set(skillIds).size).toBe(skillIds.length);
    for (const h of HEROES) {
      expect(FACTIONS[h.faction]).toBeTruthy();
      expect(h.skills.some((s) => s.slot === 'basic')).toBe(true);
    }
  });
  it('chaque héros a son illustration (portrait et en pied) et ses répliques', () => {
    for (const h of HEROES) {
      expect(hasArt(h.id, 'portrait'), h.id).toBe(true);
      expect(hasArt(h.id, 'full'), h.id).toBe(true);
      expect((HERO_LINES[h.id] ?? []).length, h.id).toBeGreaterThanOrEqual(3);
    }
  });
  it('les raretés basses sont plus nombreuses que les hautes (invocations équilibrées)', () => {
    const pool = HEROES.filter((h) => !h.exclusive);
    const n = (r: string[]) => pool.filter((h) => r.includes(h.rarity)).length;
    expect(n(['common', 'uncommon'])).toBeGreaterThanOrEqual(n(['epic', 'legendary', 'mythic']));
    expect(n(['common'])).toBeGreaterThanOrEqual(10);
    expect(n(['uncommon'])).toBeGreaterThanOrEqual(10);
    expect(n(['rare'])).toBeGreaterThanOrEqual(10);
  });
  it('les six raretés et six factions sont représentées', () => {
    expect(new Set(HEROES.map((h) => h.rarity)).size).toBe(6);
    expect(new Set(HEROES.map((h) => h.faction)).size).toBe(6);
    expect(new Set(HEROES.map((h) => h.role)).size).toBe(6);
  });
});

describe('statistiques', () => {
  const p = (level: number, rank: number, ascension = 0, awaken = 0) => ({ level, rank, ascension, awaken });
  it('augmentent avec le niveau, le rang, l’ascension et l’éveil', () => {
    const d = HERO_BY_ID.aldric;
    const r = RARITIES[d.rarity].startRank;
    const base = computeStats(d, p(1, r));
    expect(computeStats(d, p(20, r)).hp).toBeGreaterThan(base.hp);
    expect(computeStats(d, p(1, r + 1)).atk).toBeGreaterThan(base.atk);
    expect(computeStats(d, p(1, r, 2)).def).toBeGreaterThan(base.def);
    expect(computeStats(d, p(1, r, 0, 1)).critDmg).toBeGreaterThan(base.critDmg);
  });
  it('la rareté pèse sur la puissance à progression égale', () => {
    const lv = (id: string) => powerOf(computeStats(HERO_BY_ID[id], p(30, 6)));
    expect(lv('azhar')).toBeGreaterThan(lv('kaedra'));
    expect(lv('kaedra')).toBeGreaterThan(lv('brann'));
  });
  it('niveau max par rang', () => {
    expect(maxLevelForRank(1)).toBe(10);
    expect(maxLevelForRank(6)).toBe(60);
  });
});
