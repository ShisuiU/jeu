import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { applyResets } from '../src/game/missions';
import { canStart, resolveMode, applyMode } from '../src/game/modes';
import { dungeonBest, dungeonDiffOpen, dungeonTopDiff } from '../src/game/dungeons';
import { DUNGEON_BY_ID, DUNGEON_FLOORS, dungeonForce, dungeonLevel } from '../src/data/dungeons';
import { DIFFICULTY_ORDER } from '../src/data/campaign';
import { canBackground } from '../src/game/background';

const NOW = Date.parse('2026-11-10T12:00:00Z');
const fresh = () => { const s = createNewSave(NOW); s.time.highWater = NOW; applyResets(s, NOW); return s; };

describe('difficultés des donjons (v1.68.9)', () => {
  it('Difficile s’ouvre quand le Normal est terminé (étage 15), puis Expert quand Difficile est terminé', () => {
    const s = fresh();
    expect(dungeonDiffOpen(s, 'amber', 'hard')).toBe(false);
    expect(canStart(s, { mode: 'dungeon', dungeonId: 'amber', floor: 1, difficulty: 'hard' }).ok).toBe(false);
    s.progress.dungeons.amber = { bestFloor: 14 };
    expect(dungeonDiffOpen(s, 'amber', 'hard')).toBe(false);
    s.progress.dungeons.amber = { bestFloor: 15 };
    expect(dungeonDiffOpen(s, 'amber', 'hard')).toBe(true);
    expect(dungeonDiffOpen(s, 'amber', 'expert')).toBe(false);
    expect(dungeonDiffOpen(s, 'warforge', 'hard')).toBe(false); // chaque donjon a sa progression
    expect(canStart(s, { mode: 'dungeon', dungeonId: 'amber', floor: 1, difficulty: 'hard' }).ok).toBe(true);
    expect(canStart(s, { mode: 'dungeon', dungeonId: 'amber', floor: 2, difficulty: 'hard' }).ok).toBe(false);
    s.progress.dungeons.amber.best = { hard: 10 };
    expect(dungeonTopDiff(s, 'amber')).toBe('hard');
    s.progress.dungeons.amber.best = { hard: 15 };
    expect(dungeonTopDiff(s, 'amber')).toBe('expert');
  });

  it('ennemis plus forts, récompenses multipliées, progression séparée', () => {
    const s = fresh();
    s.progress.dungeons.amber = { bestFloor: 15 };
    const normal = resolveMode(s, { mode: 'dungeon', dungeonId: 'amber', floor: 1 });
    const hard = resolveMode(s, { mode: 'dungeon', dungeonId: 'amber', floor: 1, difficulty: 'hard' });
    expect(dungeonLevel(1, 'hard')).toBeGreaterThan(dungeonLevel(DUNGEON_FLOORS));
    expect(Math.max(...hard.waves.flat().map((w) => w.level))).toBeGreaterThan(Math.max(...normal.waves.flat().map((w) => w.level)));
    expect(hard.rewardPreview.gold!).toBeGreaterThan(normal.rewardPreview.gold!);
    expect(hard.title).toMatch(/Difficile/);
    const gold = s.resources.gold;
    const res = applyMode(s, { mode: 'dungeon', dungeonId: 'amber', floor: 1, difficulty: 'hard' }, { won: true, alliesDead: 0, participants: [s.heroes[0].uid] }, NOW);
    expect(s.resources.gold - gold).toBe(res.reward.gold);
    expect(dungeonBest(s, 'amber', 'hard')).toBe(1);
    expect(dungeonBest(s, 'amber')).toBe(15); // le Normal n'est pas touché
  });

  it('chaque difficulté reprend là où la précédente s’arrête (v1.70.1)', () => {
    for (let i = 1; i < DIFFICULTY_ORDER.length; i++) {
      const prev = DIFFICULTY_ORDER[i - 1], d = DIFFICULTY_ORDER[i];
      expect(dungeonForce(1, d), d).toBeGreaterThan(dungeonForce(DUNGEON_FLOORS, prev));
      for (let f = 2; f <= DUNGEON_FLOORS; f++) expect(dungeonForce(f, d)).toBeGreaterThan(dungeonForce(f - 1, d));
    }
  });

  it('les combats en arrière-plan marchent dans chaque difficulté', () => {
    const s = fresh();
    s.progress.dungeons.warforge = { bestFloor: 15, best: { hard: 2 } };
    expect(canBackground(s, { mode: 'dungeon', dungeonId: 'warforge', floor: 2, difficulty: 'hard' }).ok).toBe(true);
    expect(canBackground(s, { mode: 'dungeon', dungeonId: 'warforge', floor: 3, difficulty: 'hard' }).ok).toBe(false);
    expect(DUNGEON_BY_ID.warforge.gear).toBeTruthy();
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
      const res = applyMode(s, { mode: 'dungeon', dungeonId: 'warforge', floor: 1 }, { won: true, alliesDead: 0, participants: [s.heroes[0].uid] }, NOW + i * 1000);
      expect(res.gear).toHaveLength(1);
      expect(res.gear[0].stars).toBeGreaterThanOrEqual(1);
      expect(res.gear[0].stars).toBeLessThanOrEqual(2);
    }
  });
});

describe('4 donjons d’équipement (v1.71.0)', () => {
  it('chaque donjon ne donne que ses propres ensembles, et tous les ensembles sont couverts une fois', async () => {
    const { DUNGEONS } = await import('../src/data/dungeons');
    const { SET_LIST } = await import('../src/data/equipment');
    const gearDungeons = DUNGEONS.filter((d) => d.sets);
    expect(gearDungeons.map((d) => d.id)).toEqual(['warforge', 'bastion', 'gale', 'briar']);
    expect(DUNGEONS.some((d) => d.id === 'forge')).toBe(false);
    const all = gearDungeons.flatMap((d) => d.sets!);
    expect([...all].sort()).toEqual(SET_LIST.map((x) => x.id).sort());
    for (const d of gearDungeons) {
      const s = fresh();
      for (let i = 0; i < 25; i++) {
        const res = applyMode(s, { mode: 'dungeon', dungeonId: d.id, floor: 1 }, { won: true, alliesDead: 0, participants: [s.heroes[0].uid] }, NOW + i * 977);
        expect(res.gear).toHaveLength(1);
        expect(d.sets, d.id).toContain(res.gear[0].set);
      }
    }
  });
  it('l’ancienne Forge Engloutie disparaît des sauvegardes', async () => {
    const { migrateSave } = await import('../src/save/migrations');
    const s = fresh();
    (s.progress.dungeons as Record<string, unknown>).forge = { bestFloor: 15, best: { hard: 4 } };
    s.progress.dungeons.amber = { bestFloor: 3 };
    s.bgRun = { spec: { mode: 'dungeon', dungeonId: 'forge', floor: 2 }, teamId: s.teams[0].id, total: 5, done: 1, wins: 1, stopOnLoss: false, startedAt: NOW, nextAt: NOW, waiting: false, reward: {}, gear: [] };
    const m = migrateSave(JSON.parse(JSON.stringify(s)));
    expect(m.progress.dungeons.forge).toBeUndefined();
    expect(m.progress.dungeons.amber.bestFloor).toBe(3);
    expect(m.bgRun).toBeNull();
    expect(canStart(m, { mode: 'dungeon', dungeonId: 'forge', floor: 1 }).ok).toBe(false);
  });
});
