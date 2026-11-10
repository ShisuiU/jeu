import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { CHAPTERS } from '../src/data/campaign';
import { anyStarChest, claimStarChest, difficultyStars, starChestReward, starChestsReady, starSteps } from '../src/game/starChests';

const fill = (s: ReturnType<typeof createNewSave>, diff: string, chapters: number) => {
  for (const c of CHAPTERS.slice(0, chapters)) for (const st of c.stages) s.progress.campaign[`${diff}:${st.id}`] = { stars: 3, clears: 1 };
};

describe('coffres d’étoiles par difficulté (v1.68.14)', () => {
  it('une piste par difficulté : un coffre tous les 30 étoiles, sur toutes les étoiles de la difficulté', () => {
    expect(starSteps()).toEqual([30, 60, 90, 120, 150, 180, 210, 240, 270]);
    const s = createNewSave(0);
    fill(s, 'normal', 2); // 2 chapitres = 60 étoiles
    expect(difficultyStars(s, 'normal')).toBe(60);
    expect(starChestsReady(s, 'normal')).toEqual([30, 60]);
    expect(starChestsReady(s, 'hard')).toEqual([]);
    const dim = s.resources.shardDim;
    expect(claimStarChest(s, 'normal', 30)).toEqual(starChestReward('normal', 30));
    expect(s.resources.shardDim).toBe(dim + 3);
    expect(claimStarChest(s, 'normal', 30)).toBeNull();
    expect(claimStarChest(s, 'normal', 90)).toBeNull();
    claimStarChest(s, 'normal', 60);
    expect(anyStarChest(s, 'normal')).toBe(false);
  });
  it('un coffre sur trois donne des Éclats de faille, de plus en plus avec la difficulté', () => {
    const s = createNewSave(0);
    fill(s, 'hard', 9);
    expect(starChestsReady(s, 'hard')).toHaveLength(9);
    const ev = s.resources.shardEvent;
    for (const n of starSteps()) claimStarChest(s, 'hard', n);
    expect(s.resources.shardEvent).toBe(ev + 3 * 2);
    expect(starChestReward('nightmare', 90).shardEvent!).toBeGreaterThan(starChestReward('normal', 90).shardEvent!);
    expect(starChestReward('expert', 270).awakenEssence).toBe(6);
  });
});
