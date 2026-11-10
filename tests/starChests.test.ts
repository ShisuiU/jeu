import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { CHAPTERS } from '../src/data/campaign';
import { anyStarChest, claimStarChest, starChestReward, starChestsReady } from '../src/game/starChests';

describe('coffres d’étoiles de la campagne (v1.68.12)', () => {
  it('paliers 10, 20, 30 par chapitre et par difficulté, récupérables une fois', () => {
    const s = createNewSave(0);
    const ch1 = CHAPTERS[0];
    for (const st of ch1.stages.slice(0, 4)) s.progress.campaign[`normal:${st.id}`] = { stars: 3, clears: 1 }; // 12 étoiles
    expect(starChestsReady(s, 'normal', 1)).toEqual([10]);
    expect(starChestsReady(s, 'hard', 1)).toEqual([]);
    expect(anyStarChest(s, 'normal')).toBe(true);
    const dim = s.resources.shardDim;
    expect(claimStarChest(s, 'normal', 1, 10)).toEqual(starChestReward('normal', 10));
    expect(s.resources.shardDim).toBe(dim + 3);
    expect(claimStarChest(s, 'normal', 1, 10)).toBeNull();
    expect(claimStarChest(s, 'normal', 1, 20)).toBeNull();
    expect(anyStarChest(s, 'normal')).toBe(false);
  });
  it('les étoiles déjà gagnées comptent, et les difficultés hautes donnent des Éclats de faille', () => {
    const s = createNewSave(0);
    for (const st of CHAPTERS[0].stages) s.progress.campaign[`hard:${st.id}`] = { stars: 3, clears: 1 };
    expect(starChestsReady(s, 'hard', 1)).toEqual([10, 20, 30]);
    const ev = s.resources.shardEvent;
    for (const n of [10, 20, 30]) claimStarChest(s, 'hard', 1, n);
    expect(s.resources.shardEvent).toBe(ev + 3);
    expect(starChestReward('nightmare', 30).shardEvent!).toBeGreaterThan(starChestReward('normal', 30).shardEvent!);
  });
});
