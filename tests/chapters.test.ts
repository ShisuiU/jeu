import { describe, expect, it } from 'vitest';
import { CHAPTERS, STAGE_BY_ID } from '../src/data/campaign';
import { ENEMIES } from '../src/data/enemies';
import { HERO_BY_ID } from '../src/data/heroes';
import { createNewSave } from '../src/save/schema';
import { isStageUnlocked, applyStageResult } from '../src/game/campaign';

describe('chapitres', () => {
  it('9 chapitres de 10 niveaux, identifiants uniques', () => {
    expect(CHAPTERS).toHaveLength(9);
    const ids = CHAPTERS.flatMap((c) => c.stages.map((s) => s.id));
    expect(ids).toHaveLength(90);
    expect(new Set(ids).size).toBe(90);
    for (const c of CHAPTERS) expect(c.stages[9].boss).toBe(true);
  });
  it('tous les ennemis, orateurs et héros récompensés existent', () => {
    for (const c of CHAPTERS) for (const st of c.stages) {
      for (const w of st.waves) for (const e of w) expect(ENEMIES[e.enemy], `${st.id} ${e.enemy}`).toBeTruthy();
      for (const l of [...(st.before ?? []), ...(st.after ?? [])]) expect(l.speaker === 'narrator' || l.speaker === 'player' || !!HERO_BY_ID[l.speaker] || !!ENEMIES[l.speaker], `${st.id} ${l.speaker}`).toBe(true);
      for (const h of st.firstClear.heroes ?? []) expect(HERO_BY_ID[h]).toBeTruthy();
    }
  });
  it('les niveaux d’ennemis progressent de chapitre en chapitre', () => {
    const maxLv = (n: number) => Math.max(...CHAPTERS[n - 1].stages.flatMap((s) => s.waves.flat().map((e) => e.level)));
    for (let n = 2; n <= 8; n++) expect(maxLv(n)).toBeGreaterThan(maxLv(n - 1));
    expect(maxLv(7)).toBeLessThanOrEqual(60);
  });
  it('le chapitre 2 s’ouvre après le boss du chapitre 1 et le boss du 2 donne Ysolde', () => {
    const s = createNewSave(1);
    expect(isStageUnlocked(s, 'normal', STAGE_BY_ID['2-1'])).toBe(false);
    s.progress.campaign['normal:1-10'] = { stars: 3, clears: 1 };
    expect(isStageUnlocked(s, 'normal', STAGE_BY_ID['2-1'])).toBe(true);
    const r = applyStageResult(s, '2-10', 'normal', true, 0, [s.heroes[0].uid], 1000);
    expect(r.newHeroes).toEqual(['ysolde']);
  });
  it('chapitre 8 : Liran rejoint au niveau 5, Ondine au boss', () => {
    const s = createNewSave(1);
    expect(applyStageResult(s, '8-5', 'normal', true, 0, [s.heroes[0].uid], 1000).newHeroes).toEqual(['liran']);
    expect(applyStageResult(s, '8-10', 'normal', true, 0, [s.heroes[0].uid], 1000).newHeroes).toEqual(['ondine']);
  });
});

it('la campagne n’offre aucun héros Mythique (v1.70.0)', async () => {
  const { CHAPTERS } = await import('../src/data/campaign');
  const { HERO_BY_ID } = await import('../src/data/heroes');
  const given = CHAPTERS.flatMap((c) => c.stages).flatMap((st) => st.firstClear.heroes ?? []);
  expect(given.length).toBeGreaterThan(5);
  expect(given.filter((id) => HERO_BY_ID[id].rarity === 'mythic')).toEqual([]);
  expect(CHAPTERS[6].stages[9].firstClear.shardEvent).toBe(3);
});
