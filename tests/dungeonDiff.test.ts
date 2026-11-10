import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { applyResets } from '../src/game/missions';
import { canStart, resolveMode, applyMode } from '../src/game/modes';
import { dungeonBest, dungeonDiffOpen, dungeonTopDiff } from '../src/game/dungeons';
import { DUNGEON_BY_ID, dungeonLevel } from '../src/data/dungeons';
import { canBackground } from '../src/game/background';

const NOW = Date.parse('2026-11-10T12:00:00Z');
const fresh = () => { const s = createNewSave(NOW); s.time.highWater = NOW; applyResets(s, NOW); return s; };

describe('difficultés des donjons (v1.68.9)', () => {
  it('Difficile s’ouvre à l’étage 10 en Normal, puis Expert à l’étage 10 en Difficile', () => {
    const s = fresh();
    expect(dungeonDiffOpen(s, 'amber', 'hard')).toBe(false);
    expect(canStart(s, { mode: 'dungeon', dungeonId: 'amber', floor: 1, difficulty: 'hard' }).ok).toBe(false);
    s.progress.dungeons.amber = { bestFloor: 10 };
    expect(dungeonDiffOpen(s, 'amber', 'hard')).toBe(true);
    expect(dungeonDiffOpen(s, 'amber', 'expert')).toBe(false);
    expect(dungeonDiffOpen(s, 'forge', 'hard')).toBe(false); // chaque donjon a sa progression
    expect(canStart(s, { mode: 'dungeon', dungeonId: 'amber', floor: 1, difficulty: 'hard' }).ok).toBe(true);
    expect(canStart(s, { mode: 'dungeon', dungeonId: 'amber', floor: 2, difficulty: 'hard' }).ok).toBe(false);
    s.progress.dungeons.amber.best = { hard: 10 };
    expect(dungeonTopDiff(s, 'amber')).toBe('expert');
  });

  it('ennemis plus forts, récompenses multipliées, progression séparée', () => {
    const s = fresh();
    s.progress.dungeons.amber = { bestFloor: 12 };
    const normal = resolveMode(s, { mode: 'dungeon', dungeonId: 'amber', floor: 1 });
    const hard = resolveMode(s, { mode: 'dungeon', dungeonId: 'amber', floor: 1, difficulty: 'hard' });
    expect(dungeonLevel(1, 'hard')).toBe(dungeonLevel(1) + 15);
    expect(Math.max(...hard.waves.flat().map((w) => w.level))).toBeGreaterThan(Math.max(...normal.waves.flat().map((w) => w.level)));
    expect(hard.rewardPreview.gold!).toBeGreaterThan(normal.rewardPreview.gold!);
    expect(hard.title).toMatch(/Difficile/);
    const gold = s.resources.gold;
    const res = applyMode(s, { mode: 'dungeon', dungeonId: 'amber', floor: 1, difficulty: 'hard' }, { won: true, alliesDead: 0, participants: [s.heroes[0].uid] }, NOW);
    expect(s.resources.gold - gold).toBe(res.reward.gold);
    expect(dungeonBest(s, 'amber', 'hard')).toBe(1);
    expect(dungeonBest(s, 'amber')).toBe(12); // le Normal n'est pas touché
  });

  it('les combats en arrière-plan marchent dans chaque difficulté', () => {
    const s = fresh();
    s.progress.dungeons.forge = { bestFloor: 10, best: { hard: 2 } };
    expect(canBackground(s, { mode: 'dungeon', dungeonId: 'forge', floor: 2, difficulty: 'hard' }).ok).toBe(true);
    expect(canBackground(s, { mode: 'dungeon', dungeonId: 'forge', floor: 3, difficulty: 'hard' }).ok).toBe(false);
    expect(DUNGEON_BY_ID.forge.gear).toBeTruthy();
  });
});

describe('étoiles de l’équipement de la Forge (v1.68.11)', () => {
  it('fourchettes par étage et par difficulté', async () => {
    const { forgeStarRange, rollForgeStars } = await import('../src/data/dungeons');
    const { seededRand } = await import('../src/game/gear');
    expect(forgeStarRange(1)).toEqual([1, 2]);
    expect(forgeStarRange(2)).toEqual([1, 2]);
    expect(forgeStarRange(3)).toEqual([1, 3]);
    expect(forgeStarRange(9)).toEqual([1, 3]);
    expect(forgeStarRange(10)).toEqual([3, 4]);
    expect(forgeStarRange(10, 'hard')).toEqual([4, 5]);
    expect(forgeStarRange(10, 'expert')).toEqual([5, 6]);
    expect(forgeStarRange(10, 'nightmare')).toEqual([6, 6]);
    expect(forgeStarRange(1, 'nightmare')).toEqual([4, 5]);
    const r = seededRand(3); const seen = new Map<number, number>();
    for (let i = 0; i < 3000; i++) { const v = rollForgeStars(r, 5); seen.set(v, (seen.get(v) ?? 0) + 1); }
    expect([...seen.keys()].sort()).toEqual([1, 2, 3]);
    expect(seen.get(1)!).toBeGreaterThan(seen.get(3)!); // les petites étoiles sont plus fréquentes
  });
  it('la Forge donne un objet à chaque victoire, avec des étoiles dans la fourchette', () => {
    const s = fresh();
    for (let i = 0; i < 10; i++) {
      const res = applyMode(s, { mode: 'dungeon', dungeonId: 'forge', floor: 1 }, { won: true, alliesDead: 0, participants: [s.heroes[0].uid] }, NOW + i * 1000);
      expect(res.gear).toHaveLength(1);
      expect(res.gear[0].stars).toBeGreaterThanOrEqual(1);
      expect(res.gear[0].stars).toBeLessThanOrEqual(2);
    }
  });
});
