import type { Reward } from './resources';
import type { SaveData } from '../save/schema';
import { CHAPTERS, progressKey } from './campaign';

// RÉCOMPENSES DE PROGRESSION — objectifs à long terme, une seule fois chacun.
export interface AchievementDef { id: string; title: string; reward: Reward; progress: (s: SaveData) => [number, number] }

const chapterClears = (s: SaveData, diff: string, n = 1) => CHAPTERS[n - 1].stages.filter((st) => (s.progress.campaign[progressKey(diff as 'normal', st.id)]?.clears ?? 0) > 0).length;
const chapterStars = (s: SaveData) => CHAPTERS[0].stages.reduce((a, st) => a + (s.progress.campaign[progressKey('normal', st.id)]?.stars ?? 0), 0);
const bestDungeon = (s: SaveData) => Math.max(0, ...Object.values(s.progress.dungeons).map((d) => d.bestFloor));

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'a_ch1', title: 'Terminer le chapitre 1 (Normal)', reward: { crystals: 200, shardAeon: 1 }, progress: (s) => [chapterClears(s, 'normal'), 10] },
  { id: 'a_ch1_3s', title: '30 étoiles au chapitre 1', reward: { crystals: 300, shardAeon: 1 }, progress: (s) => [chapterStars(s), 30] },
  { id: 'a_ch1_hard', title: 'Terminer le chapitre 1 (Difficile)', reward: { shardAeon: 2, potionGreater: 5 }, progress: (s) => [chapterClears(s, 'hard'), 10] },
  { id: 'a_ch1_expert', title: 'Terminer le chapitre 1 (Expert)', reward: { crystals: 300 }, progress: (s) => [chapterClears(s, 'expert'), 10] },
  { id: 'a_ch1_night', title: 'Terminer le chapitre 1 (Cauchemar)', reward: { crystals: 600 }, progress: (s) => [chapterClears(s, 'nightmare'), 10] },
  { id: 'a_heroes8', title: 'Posséder 8 héros', reward: { crystals: 150 }, progress: (s) => [s.heroes.length, 8] },
  { id: 'a_heroes12', title: 'Posséder 12 héros', reward: { shardAeon: 1 }, progress: (s) => [s.heroes.length, 12] },
  { id: 'a_heroes15', title: 'Posséder 15 héros', reward: { crystals: 300 }, progress: (s) => [s.heroes.length, 15] },
  { id: 'a_heroes21', title: 'Posséder 21 héros', reward: { crystals: 600 }, progress: (s) => [s.heroes.length, 21] },
  { id: 'a_heroes23', title: 'Posséder 23 héros', reward: { crystals: 900 }, progress: (s) => [s.heroes.length, 23] },
  { id: 'a_heroes32', title: 'Posséder 32 héros', reward: { crystals: 1200, shardAeon: 3 }, progress: (s) => [s.heroes.length, 32] },
  ...[2, 3, 4, 5, 6, 7, 8, 9].map((n): AchievementDef => ({
    id: `a_ch${n}`, title: `Terminer le chapitre ${n} (Normal)`,
    reward: n >= 7 ? { crystals: 1100 } : { crystals: 200 + n * 50, shardAeon: 1 },
    progress: (s) => [chapterClears(s, 'normal', n), 10],
  })),
  { id: 'a_lvl5', title: 'Niveau de compte 5', reward: { gold: 20000 }, progress: (s) => [s.profile.level, 5] },
  { id: 'a_lvl10', title: 'Niveau de compte 10', reward: { crystals: 250 }, progress: (s) => [s.profile.level, 10] },
  { id: 'a_lvl20', title: 'Niveau de compte 20', reward: { shardAeon: 2 }, progress: (s) => [s.profile.level, 20] },
  { id: 'a_tower10', title: 'Tour des Âges : étage 10', reward: { crystals: 200 }, progress: (s) => [s.progress.tower.floor, 10] },
  { id: 'a_tower25', title: 'Tour des Âges : étage 25', reward: { shardAeon: 2 }, progress: (s) => [s.progress.tower.floor, 25] },
  { id: 'a_tower50', title: 'Tour des Âges : étage 50', reward: { crystals: 300 }, progress: (s) => [s.progress.tower.floor, 50] },
  { id: 'a_tower75', title: 'Tour des Âges : étage 75', reward: { crystals: 500, masteryScroll: 4 }, progress: (s) => [s.progress.tower.floor, 75] },
  { id: 'a_tower100', title: 'Tour des Âges : sommet', reward: { crystals: 1000, shardAeon: 5 }, progress: (s) => [s.progress.tower.floor, 100] },
  { id: 'a_dungeon5', title: 'Étage 5 d’un donjon', reward: { potionGreater: 3 }, progress: (s) => [bestDungeon(s), 5] },
  { id: 'a_dungeon10', title: 'Étage 10 d’un donjon', reward: { potionSupreme: 3 }, progress: (s) => [bestDungeon(s), 10] },
  { id: 'a_dungeon15', title: 'Étage 15 d’un donjon', reward: { potionSupreme: 5, awakenEssence: 1 }, progress: (s) => [bestDungeon(s), 15] },
  { id: 'a_summon50', title: '50 invocations', reward: { crystals: 300 }, progress: (s) => [s.summons.total, 50] },
  { id: 'a_gear10', title: 'Un équipement +10', reward: { forgeOre: 150 }, progress: (s) => [Math.max(0, ...s.equipment.map((g) => g.level)), 10] },
  { id: 'a_arena_gold', title: 'Atteindre la ligue Or de l’arène', reward: { crystals: 250 }, progress: (s) => [s.arena.rating, 1350] },
];
