import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { snapHero } from '../src/game/heroSnap';
import { awaken, rankUp } from '../src/game/upgrade';
import { BALANCE } from '../src/data/balance';

// Cérémonie de progression (v1.107.0) : le bilan avant → après est pris sur les vraies règles du jeu.
describe('Bilan de la cérémonie', () => {
  it('rang : +10 niveaux maximum, statistiques et puissance en hausse', () => {
    const s = createNewSave(Date.now());
    const h = s.heroes[0];
    h.level = h.rank * BALANCE.hero.levelsPerRank;
    s.resources.rankSigil = 99; s.resources.gold = 1e9;
    const before = snapHero(s, h.uid)!;
    expect(rankUp(s, h.uid).ok).toBe(true);
    const after = snapHero(s, h.uid)!;
    expect(after.rank).toBe(before.rank + 1);
    expect(after.cap - before.cap).toBe(BALANCE.hero.levelsPerRank);
    expect(after.hp).toBeGreaterThan(before.hp);
    expect(after.power).toBeGreaterThan(before.power);
  });
  it('éveil : +2 VIT, ni PRÉ ni RÉS (réservées à l’ascension)', () => {
    const s = createNewSave(Date.now());
    const h = s.heroes[0];
    h.ascension = 3; s.resources.awakenEssence = 999; s.resources.gold = 1e9;
    const before = snapHero(s, h.uid)!;
    expect(awaken(s, h.uid).ok).toBe(true);
    const after = snapHero(s, h.uid)!;
    expect(after.awaken).toBe(before.awaken + 1);
    expect(after.spd - before.spd).toBe(2);
    expect(after.acc).toBe(before.acc); // seule l'ascension donne de la PRÉ
  });
  it('héros inconnu : pas de bilan', () => {
    expect(snapHero(createNewSave(Date.now()), 'nope')).toBeNull();
  });
});
