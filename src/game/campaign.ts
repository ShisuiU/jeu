import { CHAPTERS, DIFFICULTIES, DIFFICULTY_ORDER, progressKey, STAGE_BY_ID, type DifficultyId, type StageDef } from '../data/campaign';
import { track } from './missions';
import type { Reward } from '../data/resources';
import { HERO_BY_ID } from '../data/heroes';
import type { SaveData, TeamPreset } from '../save/schema';
import { createHeroInstance } from '../save/schema';
import type { UnitSetup } from './battle/types';
import { energyMax, spendEnergy } from './energy';
import { applyReward } from './rewards';
import { addAccountXp, addHeroXp } from './progression';
import { seededRand, pickWeighted } from './gear';
import { eventBonus } from './events';
import { addCopy, heroBonus } from './copies';
import type { GearItem } from '../save/schema';

/** Butin bonus d'une victoire de campagne (un tirage). Les donjons (phase 4) en donneront davantage. */
export const CAMPAIGN_LOOT: { resource: keyof Reward; amount: number; weight: number }[] = [
  { resource: 'xpElixir', amount: 2, weight: 30 },
  { resource: 'forgeOre', amount: 12, weight: 25 },
  { resource: 'potionMinor', amount: 2, weight: 20 },
  { resource: 'skillTome', amount: 1, weight: 9 },
  { resource: 'potionGreater', amount: 1, weight: 7 },
  { resource: 'rankSigil', amount: 1, weight: 6 },
  { resource: 'awakenEssence', amount: 1, weight: 3 },
];

export function stageProgress(s: SaveData, diff: DifficultyId, stageId: string) {
  return s.progress.campaign[progressKey(diff, stageId)] ?? { stars: 0, clears: 0 };
}

export function isStageUnlocked(s: SaveData, diff: DifficultyId, stage: StageDef): boolean {
  if (!DIFFICULTIES[diff].available) return false;
  const chapter = CHAPTERS.find((c) => c.n === stage.chapter)!;
  const i = chapter.stages.indexOf(stage);
  if (i > 0) return stageProgress(s, diff, chapter.stages[i - 1].id).clears > 0;
  const di = DIFFICULTY_ORDER.indexOf(diff);
  if (di > 0) {
    // Une difficulté s'ouvre quand le même chapitre est terminé dans la difficulté précédente.
    const prevDiff = DIFFICULTY_ORDER[di - 1];
    if (stageProgress(s, prevDiff, chapter.stages[chapter.stages.length - 1].id).clears === 0) return false;
  }
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
    const gear = heroBonus(s, h);
    out.push({ kind: 'hero', refId: h.heroId, slot, level: h.level, rank: h.rank, ascension: h.ascension, awaken: h.awaken, skillLevels: h.skillLevels, heroUid: h.uid, gear });
  });
  return out;
}

export function stageWaves(stage: StageDef, diff: DifficultyId): UnitSetup[][] {
  const d = DIFFICULTIES[diff];
  // Plafond de niveau 70 : les difficultés élevées des derniers chapitres restent exigeantes grâce au multiplicateur de stats.
  return stage.waves.map((w) => w.map((e) => ({ kind: 'enemy', refId: e.enemy, slot: e.slot, level: Math.min(70, e.level + d.levelAdd), statMult: d.statMult * (stage.statMult ?? 1), hpMult: e.hpMult })));
}

/** Dépense l'énergie d'un niveau. Retourne false si impossible. (mutation) */
export function stageEnergy(stage: StageDef, diff: DifficultyId = 'normal'): number {
  return stage.energy + DIFFICULTY_ORDER.indexOf(diff);
}

export function payEnergy(s: SaveData, amount: number, now: number): boolean {
  const e = spendEnergy(s.energy, amount, now, energyMax(s.profile.level));
  if (!e) return false;
  s.energy = e;
  track(s, 'energySpent', amount);
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
  gear: GearItem[];
  loot: Reward;
  heroXp: { uid: string; heroId: string; xp: number; levelsGained: number; capped: boolean; level: number }[];
  accountLevelsGained: number;
  /** Expérience de compte gagnée (récap de fin de combat). */
  accountXp?: number;
}

/** Applique l'issue d'un combat de campagne à la sauvegarde (mutation). */
export function applyStageResult(s: SaveData, stageId: string, diff: DifficultyId, won: boolean, alliesDead: number, participantUids: string[], now: number): BattleResult {
  const stage = STAGE_BY_ID[stageId];
  const key = progressKey(diff, stageId);
  const prog = s.progress.campaign[key] ?? { stars: 0, clears: 0 };
  const result: BattleResult = { won, stars: 0, firstClear: false, reward: {}, newHeroes: [], gear: [], loot: {}, heroXp: [], accountLevelsGained: 0 };
  result.accountXp = stageEnergy(stage, diff) * (won ? 10 : 3);
  result.accountLevelsGained = addAccountXp(s, result.accountXp);
  if (!won) { s.stats.battlesLost += 1; return result; }

  s.stats.battlesWon += 1;
  track(s, 'battleWin');
  track(s, 'campaignWin');
  const stars = starsFor(alliesDead);
  result.stars = stars;
  result.firstClear = prog.clears === 0;
  const mult = DIFFICULTIES[diff].rewardMult;
  const { heroes, ...base } = result.firstClear ? stage.firstClear : { ...stage.repeat, heroes: undefined };
  const reward: Reward = {};
  const goldEv = eventBonus(now, 'campaignGold');
  for (const [k, v] of Object.entries(base)) reward[k as keyof Reward] = Math.round((v ?? 0) * mult * (k === 'gold' ? goldEv : 1));
  applyReward(s, reward);
  result.reward = reward;
  for (const id of heroes ?? []) {
    if (!HERO_BY_ID[id]) continue;
    if (s.heroes.some((h) => h.heroId === id)) addCopy(s, id);
    else { s.heroes.push(createHeroInstance(id, now)); result.newHeroes.push(id); }
  }
  s.progress.campaign[key] = { stars: Math.max(prog.stars, stars), clears: prog.clears + 1 };

  // Butin aléatoire : matériaux d'amélioration. L'équipement ne vient plus que de la Forge Engloutie (v1.68.11).
  const r = seededRand(now ^ (prog.clears * 7919) ^ stage.index);
  // Chapitre 1 : seulement ce qui sert tout de suite (les potions d'ascension ne servent qu'au niveau 10).
  const table = stage.chapter === 1 ? CAMPAIGN_LOOT.filter((l) => !['potionMinor', 'potionGreater', 'rankSigil', 'awakenEssence'].includes(l.resource)) : CAMPAIGN_LOOT;
  const [lootKey, lootAmount] = pickWeighted(r, table.map((l) => [[l.resource, l.amount] as [keyof Reward, number], l.weight]));
  result.loot = { [lootKey]: Math.round(lootAmount * mult) };
  applyReward(s, result.loot);

  const xp = Math.round(stage.heroXp * mult * eventBonus(now, 'campaignXp'));
  for (const uid of participantUids) {
    const h = s.heroes.find((x) => x.uid === uid);
    if (!h) continue;
    const r = addHeroXp(h, xp);
    result.heroXp.push({ uid, heroId: h.heroId, xp, levelsGained: r.gained, capped: r.capped, level: h.level });
  }
  return result;
}
