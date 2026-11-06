import { describe, expect, it } from 'vitest';
import { createNewSave, SAVE_VERSION, type HeroInstance } from '../src/save/schema';
import { migrateSave } from '../src/save/migrations';
import { FEED_MAX, feedBlock, feedCandidates, feedHeroes, feedPreview, feedXp } from '../src/game/feed';
import { generateGear, seededRand } from '../src/game/gear';
import { maxLevelForRank } from '../src/game/stats';

const setup = () => {
  const s = createNewSave(1000);
  s.resources.gold = 1e7;
  const extra = (heroId: string, i: number): HeroInstance => ({ ...s.heroes[0], uid: `food${i}`, heroId, level: 1, xp: 0, locked: false });
  s.heroes.push(extra('garrek', 1), extra('nyra', 2), extra('osric', 3));
  const target = s.heroes[0];
  return { s, target };
};

describe('absorption de héros (Sanctuaire)', () => {
  it('donne de l’expérience, retire les héros, rend leur équipement', () => {
    const { s, target } = setup();
    const g = generateGear(seededRand(1), 'rare', 1, 'weapon', 'fury', 3); g.heroUid = 'food1'; s.equipment.push(g);
    const p = feedPreview(s, target.uid, ['food1', 'food2']);
    expect(p.xp).toBe(feedXp(s.heroes.find((h) => h.uid === 'food1')!) + feedXp(s.heroes.find((h) => h.uid === 'food2')!));
    const gold = s.resources.gold;
    const r = feedHeroes(s, target.uid, ['food1', 'food2']);
    expect(r.ok).toBe(true);
    expect(s.heroes.some((h) => h.uid === 'food1' || h.uid === 'food2')).toBe(false);
    expect(s.equipment.find((x) => x.uid === g.uid)!.heroUid).toBeNull();
    expect(s.resources.gold).toBe(gold - p.gold);
    expect(target.level).toBe(p.to);
    expect(target.level).toBeGreaterThan(1);
  });

  it('un héros monté rend la plus grande partie de son expérience', () => {
    const { s } = setup();
    const h = s.heroes.find((x) => x.uid === 'food3')!;
    const low = feedXp(h);
    h.level = 20;
    expect(feedXp(h)).toBeGreaterThan(low * 5);
  });

  it('protège le héros visé, les verrouillés, les équipes et l’avatar', () => {
    const { s, target } = setup();
    const food = s.heroes.find((x) => x.uid === 'food1')!;
    expect(feedBlock(s, target.uid, target)).toBeTruthy();
    food.locked = true; expect(feedBlock(s, target.uid, food)).toBeTruthy(); food.locked = false;
    s.teams[0].slots[4] = food.uid; expect(feedBlock(s, target.uid, food)).toBeTruthy(); s.teams[0].slots[4] = null;
    s.profile.avatarHeroId = food.heroId; expect(feedBlock(s, target.uid, food)).toBeTruthy();
    expect(feedCandidates(s, target.uid).some((h) => h.uid === food.uid)).toBe(false);
    expect(feedHeroes(s, target.uid, [food.uid]).ok).toBe(false);
  });

  it('refuse au niveau maximal du rang, sans or, ou au-delà de 6 héros', () => {
    const { s, target } = setup();
    expect(feedHeroes(s, target.uid, Array.from({ length: FEED_MAX + 1 }, (_, i) => `x${i}`)).ok).toBe(false);
    s.resources.gold = 0;
    expect(feedHeroes(s, target.uid, ['food1']).reason).toMatch(/Or/);
    s.resources.gold = 1e7;
    target.level = maxLevelForRank(target.rank);
    expect(feedHeroes(s, target.uid, ['food1']).ok).toBe(false);
    expect(s.heroes.some((h) => h.uid === 'food1')).toBe(true);
  });

  it('migration v6 : les éclats primordiaux deviennent des cristaux', () => {
    const old = createNewSave(1000) as unknown as { version: number; resources: Record<string, number> };
    old.version = 5; old.resources.shardPrimal = 3; old.resources.crystals = 100;
    const s = migrateSave(old);
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.resources.crystals).toBe(1000);
    expect(s.resources.shardPrimal).toBe(0);
  });
});
