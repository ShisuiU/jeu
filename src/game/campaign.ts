import { CHAPTERS, DIFFICULTIES, progressKey, STAGE_BY_ID, type DifficultyId, type StageDef } from '../data/campaign';
import type { Reward } from '../data/resources';
import { HERO_BY_ID } from '../data/heroes';
import type { SaveData, TeamPreset } from '../save/schema';
import { createHeroInstance } from '../save/schema';
import type { UnitSetup } from './battle/types';
import { spendEnergy } from './energy';
import { applyReward } from './rewards';
import { addAccountXp, addHeroXp } from './progression';

export function stageProgress(s: SaveData, diff: DifficultyId, stageId: string) {
  return s.progress.campaign[progressKey(diff, stageId)] ?? { stars: 0, clears: 0 };
}

export function isStageUnlocked(s: SaveData, diff: DifficultyId, stage: StageDef): boolean {
  if (!DIFFICULTIES[diff].available) return false;
  const chapter = CHAPTERS.find((c) => c.n === stage.chapter)!;
  const i = chapter.stages.indexOf(stage);
  if (i > 0) return stageProgress(s, diff, chapter.stages[i - 1].id).clears > 0;
  if (stage.chapter === 1) return true;
  const prev = CHAPTERS.find((c) => c.n === stage.chapter - 1);
  return !!prev && stageProgress(s, diff, prev.stages[prev.stages.length - 1].id).clears > 0;
}

export function chapterStars(s: SaveData, diff: DifficultyId, chapter: number): { stars: number; max: number } {
  const c = CHAPTERS.find((x) => x.n === chapter)!;
  return { stars: c.stages.reduce((a, st) => a + stageProgress(s, diff, st.id).stars, 0), max: c.stages.length * 3 };
}

export function teamSetups(s: SaveData, team: TeamPreset): UnitSetup[] {
  const out: UnitSetup[] = [];
  team.slots.forEach((uid, slot) => {
    const h = uid ? s.heroes.find((x) => x.uid === uid) : undefined;
    if (!h) return;
    out.push({ kind: 'hero', refId: h.heroId, slot, level: h.level, rank: h.rank, ascension: h.ascension, awaken: h.awaken, skillLevels: h.skillLevels, heroUid: h.uid });
  });
  return out;
}

export function stageWaves(stage: StageDef, diff: DifficultyId): UnitSetup[][] {
  const d = DIFFICULTIES[diff];
  return stage.waves.map((w) => w.map((e) => ({ kind: 'enemy', refId: e.enemy, slot: e.slot, level: e.level + d.levelAdd, statMult: d.statMult, hpMult: e.hpMult })));
}

/** Dépense l'énergie d'un niveau. Retourne false si impossible. (mutation) */
export function payStage(s: SaveData, stage: StageDef, now: number): boolean {
  const e = spendEnergy(s.energy, stage.energy, now);
  if (!e) return false;
  s.energy = e;
  return true;
}

export function starsFor(alliesDead: number): number {
  return alliesDead === 0 ? 3 : alliesDead === 1 ? 2 : 1;
}

export interface BattleResult {
  won: boolean;
  stars: number;
  firstClear: boolean;
  reward: Reward;
  newHeroes: string[];
  heroXp: { uid: string; heroId: string; xp: number; levelsGained: number; capped: boolean; level: number }[];
  accountLevelsGained: number;
}

/** Applique l'issue d'un combat de campagne à la sauvegarde (mutation). */
export function applyStageResult(s: SaveData, stageId: string, diff: DifficultyId, won: boolean, alliesDead: number, participantUids: string[], now: number): BattleResult {
  const stage = STAGE_BY_ID[stageId];
  const key = progressKey(diff, stageId);
  const prog = s.progress.campaign[key] ?? { stars: 0, clears: 0 };
  const result: BattleResult = { won, stars: 0, firstClear: false, reward: {}, newHeroes: [], heroXp: [], accountLevelsGained: 0 };
  result.accountLevelsGained = addAccountXp(s, stage.energy * (won ? 10 : 3));
  if (!won) { s.stats.battlesLost += 1; return result; }

  s.stats.battlesWon += 1;
  const stars = starsFor(alliesDead);
  result.stars = stars;
  result.firstClear = prog.clears === 0;
  const mult = DIFFICULTIES[diff].rewardMult;
  const { heroes, ...base } = result.firstClear ? stage.firstClear : { ...stage.repeat, heroes: undefined };
  const reward: Reward = {};
  for (const [k, v] of Object.entries(base)) reward[k as keyof Reward] = Math.round((v ?? 0) * mult);
  applyReward(s, reward);
  result.reward = reward;
  for (const id of heroes ?? []) {
    if (!HERO_BY_ID[id]) continue;
    if (s.heroes.some((h) => h.heroId === id)) s.heroFragments[id] = (s.heroFragments[id] ?? 0) + 20;
    else { s.heroes.push(createHeroInstance(id, now)); result.newHeroes.push(id); }
  }
  s.progress.campaign[key] = { stars: Math.max(prog.stars, stars), clears: prog.clears + 1 };

  const xp = Math.round(stage.heroXp * mult);
  for (const uid of participantUids) {
    const h = s.heroes.find((x) => x.uid === uid);
    if (!h) continue;
    const r = addHeroXp(h, xp);
    result.heroXp.push({ uid, heroId: h.heroId, xp, levelsGained: r.gained, capped: r.capped, level: h.level });
  }
  return result;
}
