import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { learnMastery, resetMasteries, masteryScrollsSpent } from '../src/game/masteries';
import { heroTotalStats } from '../src/game/heroStats';
import { heroBonus } from '../src/game/copies';
import { MASTERY_TIERS } from '../src/data/masteries';
import { feedHeroes } from '../src/game/feed';

const rich = () => { const s = createNewSave(1000); s.resources.gold = 1e8; s.resources.masteryScroll = 500; s.resources.crystals = 1e4; const h = s.heroes[0]; h.level = 60; h.rank = 6; return { s, h }; };

describe('maîtrises', () => {
  it('palier par palier, avec un niveau minimum', () => {
    const { s, h } = rich();
    expect(learnMastery(s, h.uid, 'o2').ok).toBe(false);
    expect(learnMastery(s, h.uid, 'o1').ok).toBe(true);
    expect(learnMastery(s, h.uid, 'o2').ok).toBe(true);
    h.level = 35;
    expect(learnMastery(s, h.uid, 'o3').reason).toMatch(/Niveau 40/);
  });

  it('coûte des parchemins et de l’or', () => {
    const { s, h } = rich();
    const sc = s.resources.masteryScroll, g = s.resources.gold;
    learnMastery(s, h.uid, 'd1');
    expect(s.resources.masteryScroll).toBe(sc - MASTERY_TIERS[1].scrolls);
    expect(s.resources.gold).toBe(g - MASTERY_TIERS[1].gold);
    s.resources.masteryScroll = 0;
    expect(learnMastery(s, h.uid, 'd2').reason).toMatch(/Parchemins/);
  });

  it('2 maîtrises ultimes au plus', () => {
    const { s, h } = rich();
    for (const b of ['o', 'd', 's']) for (const t of [1, 2, 3]) expect(learnMastery(s, h.uid, `${b}${t}`).ok).toBe(true);
    expect(learnMastery(s, h.uid, 'o4').ok).toBe(true);
    expect(learnMastery(s, h.uid, 'd4').ok).toBe(true);
    expect(learnMastery(s, h.uid, 's4').reason).toMatch(/ultimes/);
  });

  it('les effets s’ajoutent aux statistiques et aux effets de combat', () => {
    const { s, h } = rich();
    const before = heroTotalStats(s, h).total;
    for (const id of ['o1', 'o2', 'o3', 'o4', 'd1']) learnMastery(s, h.uid, id);
    const after = heroTotalStats(s, h).total;
    expect(after.atk).toBeGreaterThan(before.atk);
    expect(after.hp).toBeGreaterThan(before.hp);
    expect(after.critRate).toBeCloseTo(before.critRate + 5, 1);
    expect(after.critDmg).toBeCloseTo(before.critDmg + 12, 1);
    expect(heroBonus(s, h).lifesteal).toBe(8);
  });

  it('réinitialiser rend les parchemins ; absorber un héros aussi', () => {
    const { s, h } = rich();
    learnMastery(s, h.uid, 's1'); learnMastery(s, h.uid, 's2');
    const spent = masteryScrollsSpent(h);
    const sc = s.resources.masteryScroll;
    expect(resetMasteries(s, h.uid).ok).toBe(true);
    expect(s.resources.masteryScroll).toBe(sc + spent);
    expect(h.masteries).toEqual([]);
    // Un héros absorbé rend ses parchemins.
    const food = { ...h, uid: 'food', heroId: 'garrek', level: 25, masteries: ['o1'], locked: false };
    s.heroes.push(food);
    const target = s.heroes[1] ?? s.heroes[0];
    target.level = 1; target.rank = 6;
    s.teams.forEach((t) => { t.slots = t.slots.map((x) => (x === 'food' ? null : x)); });
    const before = s.resources.masteryScroll;
    expect(feedHeroes(s, target.uid, ['food']).ok).toBe(true);
    expect(s.resources.masteryScroll).toBe(before + MASTERY_TIERS[1].scrolls);
  });
});
