import { CHAPTERS, DIFFICULTIES, STAGE_BY_ID, type DialogueLine, type DifficultyId, type WaveEnemy } from '../data/campaign';
import { GUILD_BOSS, GUILD_TIERS } from '../data/guild';
import { addPending, triesLeft, useTry } from './guild';
import { DUNGEON_BY_ID, DUNGEON_FLOORS, DUNGEON_GEAR_BONUS, dungeonEnergy, dungeonRewardMult, dungeonWaves, forgeStarRange, rollForgeStars } from '../data/dungeons';
import { dungeonBest, dungeonFloorCheck, setDungeonBest } from './dungeons';
import { TOWER_FLOORS, towerReward, towerWaves } from '../data/tower';
import { BOSS_TIERS, DAMAGE_CHESTS, WORLD_BOSS } from '../data/worldBoss';
import { ARENA, arenaTier } from '../data/arena';
import type { Reward } from '../data/resources';
import { GEAR_INVENTORY_CAP } from '../data/equipment';
import type { GearItem, SaveData } from '../save/schema';
import type { UnitSetup } from './battle/types';
import { applyStageResult, payEnergy, stageEnergy, stageProgress, stageWaves, isStageUnlocked, type BattleResult } from './campaign';
import { applyReward } from './rewards';
import { addAccountXp, addHeroXp } from './progression';
import { generateGear, pickWeighted, seededRand } from './gear';
import { activeEvents, dungeonBonus, eventBonus, eventProgress, trialsDone } from './events';
import { CYCLE_THEMES } from '../data/eventCycle';
import { track } from './missions';
import { generateOpponents, ratingDelta } from './arena';

// MODES DE JEU — un seul écran de combat, plusieurs modes décrits ici :
// préparation (ennemis, coût, aperçu des récompenses) et application du résultat.

export type BattleSpec =
  | { mode: 'campaign'; stageId: string; difficulty: DifficultyId }
  | { mode: 'dungeon'; dungeonId: string; floor: number; difficulty?: DifficultyId }
  | { mode: 'tower'; floor: number }
  | { mode: 'worldboss'; tier: string }
  | { mode: 'arena'; opponentId: string }
  | { mode: 'guildboss' }
  | { mode: 'challenge'; eventId: string; trial?: number };

export type CostKind = 'energy' | 'key' | 'ticket' | 'try' | 'free';

export interface ModeInfo {
  title: string;
  subtitle: string;
  region: string;
  waves: UnitSetup[][];
  cost: { kind: CostKind; amount: number };
  before?: DialogueLine[];
  after?: DialogueLine[];
  turnLimit?: number;
  rewardPreview: Reward;
  rewardLabel: string;
  notes: string[];
  firstTime: boolean;
}

export interface ModeResult extends BattleResult {
  damage?: { dealt: number; pct: number; chests: number };
  rating?: { delta: number; rating: number };
  lines: string[];
}

const toSetups = (waves: WaveEnemy[][], levelAdd = 0, statMult = 1): UnitSetup[][] =>
  waves.map((w) => w.map((e) => ({ kind: 'enemy' as const, refId: e.enemy, slot: e.slot, level: e.level + levelAdd, hpMult: e.hpMult, statMult: statMult * (e.statMult ?? 1) })));

export function scaleReward(r: Reward, m: number): Reward {
  const o: Reward = {};
  for (const [k, v] of Object.entries(r)) o[k as keyof Reward] = Math.max(1, Math.round((v ?? 0) * m));
  return o;
}

/** Chapitre où en est le joueur (premier niveau débloqué le plus avancé, mode normal). */
export function currentChapter(s: SaveData): number {
  return ([...CHAPTERS].reverse().find((c) => isStageUnlocked(s, 'normal', c.stages[0])) ?? CHAPTERS[0]).n;
}

/** Ajustement par thème (certains gardiens sont plus redoutables), calibré par simulation. */
const TRIAL_ADJ: Record<string, number> = { tide: 0.9, tourney: 1.15, forge: 1.05, hunt: 1.05, pilgrim: 1, seams: 0.85 };

/** Combat d'épreuve d'un événement de la semaine : ennemis du thème, calés sur les niveaux 3, 6 et 9
 *  du chapitre de référence (fixé au premier combat d'épreuve, pour ne pas changer en cours de semaine). */
export function trialSetup(s: SaveData, eventId: string, i: number): { waves: WaveEnemy[][]; statMult: number; chapter: number; heroXp: number } | null {
  const e = activeEvents(s.time.highWater).find((x) => x.id === eventId);
  const t = e?.cycle && CYCLE_THEMES.find((x) => x.id === e.cycle!.theme);
  if (!e || !t || i < 0 || i > 2) return null;
  const chapter = s.events[e.id]?.chap ?? currentChapter(s);
  const stages = CHAPTERS[chapter - 1].stages;
  // Niveaux des ennemis : niveaux 3, 6 et 10 du chapitre ; puissance : niveaux 3, 6 et 9 (sans l'ajustement propre au boss).
  const ref = stages[[2, 5, 8][i]];
  const lv = Math.max(...stages[[2, 5, 9][i]].waves.flat().map((w) => w.level));
  const [a, b, d] = t.foes;
  const W = (enemy: string, level: number, slot: number, hpMult?: number): WaveEnemy => ({ enemy, level, slot, hpMult });
  const waves = [
    [[W(a, lv, 0), W(b, lv, 1), W(a, lv, 2)], [W(b, lv, 0), W(d, lv, 3), W(a, lv, 2)]],
    [[W(a, lv, 0), W(b, lv, 1), W(d, lv, 3)], [W(b, lv, 0), W(a, lv, 1), W(b, lv, 2), W(d, lv, 4)]],
    [[W(a, lv, 0), W(b, lv, 1), W(a, lv, 2), W(d, lv, 3)], [W(t.guardian, lv + 1, 1, 4 + chapter * 0.1), W(d, lv, 3), W(b, lv, 4)]],
  ][i];
  // Dernier combat : un peu adouci (gardien renforcé) ; au chapitre 8, les héros plafonnent au niveau 60.
  return { waves, statMult: (ref.statMult ?? 1) * TRIAL_ADJ[t.id] * (i === 2 ? (chapter >= 8 ? 0.68 : 0.8) : 1), chapter, heroXp: ref.heroXp };
}

export function resolveMode(s: SaveData, spec: BattleSpec): ModeInfo {
  switch (spec.mode) {
    case 'campaign': {
      const st = STAGE_BY_ID[spec.stageId];
      const first = stageProgress(s, spec.difficulty, st.id).clears === 0;
      const { heroes: _h, ...fc } = st.firstClear;
      void _h;
      return {
        title: `${st.id} · ${st.name}`, subtitle: `Chapitre ${st.chapter} · ${CHAPTERS.find((c) => c.n === st.chapter)!.name}`, region: CHAPTERS.find((c) => c.n === st.chapter)!.backdrop, waves: stageWaves(st, spec.difficulty),
        cost: { kind: 'energy', amount: stageEnergy(st, spec.difficulty) }, before: first && spec.difficulty === 'normal' ? st.before : undefined,
        after: first && spec.difficulty === 'normal' ? st.after : undefined, rewardPreview: first ? fc : st.repeat, rewardLabel: first ? 'Première victoire' : 'Récompenses',
        notes: [`+${st.heroXp} XP par héros`, '★★★ si aucun héros n’est mis K.O.'], firstTime: first,
      };
    }
    case 'dungeon': {
      const d = DUNGEON_BY_ID[spec.dungeonId];
      const diff = spec.difficulty ?? 'normal';
      const bonus = dungeonBonus(s.time.highWater) * dungeonRewardMult(diff);
      return {
        title: `${d.name} · Étage ${spec.floor}${diff !== 'normal' ? ` · ${DIFFICULTIES[diff].name}` : ''}`, subtitle: d.description, region: d.region ?? 'valcrest', waves: toSetups(dungeonWaves(d, spec.floor, diff)),
        cost: { kind: 'energy', amount: dungeonEnergy(spec.floor, diff) }, rewardPreview: scaleReward(d.reward(spec.floor), bonus), rewardLabel: dungeonBonus(s.time.highWater) > 1 ? `Récompenses (bonus d’événement ×${dungeonBonus(s.time.highWater)})` : diff !== 'normal' ? `Récompenses (${DIFFICULTIES[diff].name} ×${dungeonRewardMult(diff)})` : 'Récompenses',
        notes: [d.gear ? (() => { const [lo, hi] = forgeStarRange(spec.floor, diff); return `Équipement garanti : ${lo === hi ? lo : `${lo} à ${hi}`} étoiles`; })() : ''].filter(Boolean), firstTime: dungeonBest(s, d.id, diff) < spec.floor,
      };
    }
    case 'tower':
      return {
        title: `Tour des Âges · Étage ${spec.floor}`, subtitle: spec.floor % 10 === 0 ? (spec.floor > 50 ? 'Étage gardé par un boss de chapitre' : 'Étage gardé par une Sentinelle') : spec.floor > 50 ? 'Les Sommets' : 'Ascension', region: 'heart', waves: toSetups(towerWaves(spec.floor)),
        cost: { kind: 'free', amount: 0 }, rewardPreview: towerReward(spec.floor), rewardLabel: 'Récompense de l’étage', notes: ['Sans énergie'], firstTime: true,
      };
    case 'worldboss': {
      const t = BOSS_TIERS.find((x) => x.id === spec.tier)!;
      return {
        title: `${WORLD_BOSS.name} · ${t.name}`, subtitle: `Combat limité à ${WORLD_BOSS.turnLimit} actions`, region: 'akkar',
        waves: [[{ kind: 'enemy', refId: WORLD_BOSS.enemy, slot: 1, level: t.level, hpMult: t.hpMult }]], turnLimit: WORLD_BOSS.turnLimit,
        cost: { kind: 'key', amount: 1 }, rewardPreview: scaleReward(t.reward, eventBonus(s.time.highWater, 'worldBoss')), rewardLabel: eventBonus(s.time.highWater, 'worldBoss') > 1 ? 'Récompense maximale (bonus d’événement)' : 'Récompense maximale (100 % des PV)',
        notes: [`Paliers de dégâts : ${DAMAGE_CHESTS.join(' / ')} %`, `Meilleur score : ${Math.round(s.worldBoss.best[t.id] ?? 0)} %`], firstTime: false,
      };
    }
    case 'guildboss':
      return {
        title: `Boss de clan · ${GUILD_BOSS.name}`, subtitle: `${s.guild.name || 'Ton clan'} · ${GUILD_BOSS.turnLimit} actions`, region: 'astral',
        waves: [[{ kind: 'enemy', refId: GUILD_BOSS.enemy, slot: 1, level: GUILD_BOSS.level, hpMult: GUILD_BOSS.hpMult }]], turnLimit: GUILD_BOSS.turnLimit,
        cost: { kind: 'try', amount: 1 }, rewardPreview: GUILD_TIERS[0].reward, rewardLabel: 'Premier palier du clan (chaque palier atteint donne une récompense)',
        notes: [`Tes dégâts s’ajoutent à ceux de ton clan`, `${triesLeft(s, s.time.highWater)}/${GUILD_BOSS.triesPerDay} essais aujourd’hui`], firstTime: false,
      };
    case 'arena': {
      const i = s.arena.opponents.findIndex((o) => o.id === spec.opponentId);
      const o = s.arena.opponents[i];
      return {
        title: `Arène · ${o?.name ?? '?'}`, subtitle: o?.revenge ? 'Vengeance' : o?.real ? 'Défense d’un vrai joueur' : `Classement ${s.arena.rating}`, region: 'valcrest',
        // Vrai joueur : son équipe complète (rangs, ascension, éveil, compétences, équipement).
        waves: [(o?.heroes ?? []).map((h) => ({ kind: 'hero' as const, refId: h.heroId, slot: h.slot, level: h.level, rank: h.rank, ascension: h.ascension, awaken: h.awaken, skillLevels: h.skillLevels, gear: h.gear }))],
        cost: { kind: 'ticket', amount: 1 }, rewardPreview: arenaTier(s.arena.rating).season, rewardLabel: `Fin de saison en ligue ${arenaTier(s.arena.rating).name} (rien à chaque victoire)`,
        notes: [`Victoire : +${Math.round(ratingDelta(true, Math.max(0, i)) * eventBonus(s.time.highWater, 'arena'))} points · Défaite : ${ratingDelta(false, 0)}`], firstTime: false,
      };
    }
    case 'challenge': {
      const e = activeEvents(s.time.highWater).find((x) => x.id === spec.eventId);
      if (e?.cycle && spec.trial != null) {
        const tr = e.cycle.trials[spec.trial];
        const set = trialSetup(s, e.id, spec.trial);
        return {
          title: `${tr?.name ?? 'Épreuve'}`, subtitle: `${e.name} · épreuve ${spec.trial + 1}/3`, region: e.cycle.region,
          waves: set ? toSetups(set.waves, 0, set.statMult) : [[]],
          cost: { kind: 'free', amount: 0 }, rewardPreview: tr?.reward ?? {}, rewardLabel: `Récompense · +${tr?.points ?? 0} points`,
          notes: set ? [`Difficulté du chapitre ${set.chapter}`] : [], firstTime: true,
        };
      }
      const c = e?.challenge;
      return {
        title: c?.name ?? 'Défi', subtitle: e?.name ?? '', region: 'ash', waves: c ? toSetups(c.waves) : [[]],
        cost: { kind: 'free', amount: 0 }, rewardPreview: c?.reward ?? {}, rewardLabel: 'Récompense unique', notes: [c?.description ?? ''], firstTime: true,
      };
    }
  }
}

/** Le combat peut-il commencer ? */
export function canStart(s: SaveData, spec: BattleSpec): { ok: boolean; reason?: string } {
  switch (spec.mode) {
    case 'campaign': return isStageUnlocked(s, spec.difficulty, STAGE_BY_ID[spec.stageId]) ? { ok: true } : { ok: false, reason: 'Niveau verrouillé.' };
    case 'dungeon': return dungeonFloorCheck(s, spec.dungeonId, spec.difficulty ?? 'normal', spec.floor);
    case 'tower': return spec.floor === s.progress.tower.floor + 1 && spec.floor <= TOWER_FLOORS ? { ok: true } : { ok: false, reason: 'Étage indisponible.' };
    case 'worldboss': return s.worldBoss.keysUsed < WORLD_BOSS.keysPerDay ? { ok: true } : { ok: false, reason: 'Plus de clés aujourd’hui.' };
    case 'guildboss': return !s.guild.id ? { ok: false, reason: 'Rejoins d’abord un clan.' } : triesLeft(s, s.time.highWater) > 0 ? { ok: true } : { ok: false, reason: 'Plus d’essais aujourd’hui.' };
    case 'arena': return s.arena.ticketsUsed >= ARENA.ticketsPerDay ? { ok: false, reason: 'Plus de tickets aujourd’hui.' } : s.arena.opponents.some((o) => o.id === spec.opponentId) ? { ok: true } : { ok: false, reason: 'Adversaire introuvable.' };
    case 'challenge': {
      const e = activeEvents(s.time.highWater).find((x) => x.id === spec.eventId);
      if (e?.cycle && spec.trial != null) {
        const done = trialsDone(s, e);
        return spec.trial === done && done < e.cycle.trials.length ? { ok: true } : { ok: false, reason: spec.trial < done ? 'Épreuve déjà réussie.' : 'Réussis l’épreuve précédente.' };
      }
      if (!e?.challenge) return { ok: false, reason: 'Événement terminé.' };
      return s.events[e.id]?.challengeDone ? { ok: false, reason: 'Défi déjà réussi.' } : { ok: true };
    }
  }
}

/** Paie le coût d'entrée (mutation). */
export function payMode(s: SaveData, spec: BattleSpec, now: number): { ok: boolean; reason?: string } {
  const c = canStart(s, spec);
  if (!c.ok) return c;
  const info = resolveMode(s, spec);
  if (spec.mode === 'challenge' && spec.trial != null) { const p = eventProgress(s, spec.eventId); p.chap ??= currentChapter(s); }
  if (info.cost.kind === 'energy' && !payEnergy(s, info.cost.amount, now)) return { ok: false, reason: 'Énergie insuffisante.' };
  if (info.cost.kind === 'key') s.worldBoss.keysUsed += 1;
  if (info.cost.kind === 'ticket') s.arena.ticketsUsed += 1;
  if (info.cost.kind === 'try') useTry(s, now);
  return { ok: true };
}

export interface Outcome { won: boolean; alliesDead: number; participants: string[]; bossDamage?: { dealt: number; max: number } }

function heroXpFor(s: SaveData, uids: string[], xp: number) {
  return uids.map((uid) => {
    const h = s.heroes.find((x) => x.uid === uid)!;
    const r = addHeroXp(h, xp);
    return { uid, heroId: h.heroId, xp, levelsGained: r.gained, capped: r.capped, level: h.level };
  });
}

const empty = (won: boolean): ModeResult => ({ won, stars: 0, firstClear: false, reward: {}, newHeroes: [], gear: [], loot: {}, heroXp: [], accountLevelsGained: 0, lines: [] });

/** Applique le résultat d'un combat selon le mode (mutation). */
export function applyMode(s: SaveData, spec: BattleSpec, o: Outcome, now: number): ModeResult {
  const r = seededRand(now ^ s.revision);
  switch (spec.mode) {
    case 'campaign':
      return { ...applyStageResult(s, spec.stageId, spec.difficulty, o.won, o.alliesDead, o.participants, now), lines: [] };

    case 'dungeon': {
      const d = DUNGEON_BY_ID[spec.dungeonId];
      const diff = spec.difficulty ?? 'normal';
      const res = empty(o.won);
      res.accountXp = dungeonEnergy(spec.floor, diff) * (o.won ? 10 : 3);
      res.accountLevelsGained = addAccountXp(s, res.accountXp);
      if (!o.won) { s.stats.battlesLost++; return res; }
      s.stats.battlesWon++; track(s, 'battleWin'); track(s, 'dungeonWin');
      res.firstClear = spec.floor > dungeonBest(s, d.id, diff);
      setDungeonBest(s, d.id, diff, spec.floor);
      res.reward = scaleReward(d.reward(spec.floor), dungeonBonus(now) * dungeonRewardMult(diff));
      applyReward(s, res.reward);
      if (d.gear && s.equipment.length < GEAR_INVENTORY_CAP) {
        const gf = Math.min(DUNGEON_FLOORS, spec.floor + DUNGEON_GEAR_BONUS[diff]);
        // Chaque donjon d'équipement ne donne que ses propres ensembles (v1.71.0).
        const set = d.sets?.length ? d.sets[Math.floor(r() * d.sets.length)] : undefined;
        const g: GearItem = generateGear(r, pickWeighted(r, d.gear(gf).filter(([, w]) => w > 0)), now, undefined, set, rollForgeStars(r, spec.floor, diff));
        s.equipment.push(g); res.gear.push(g);
      }
      res.heroXp = heroXpFor(s, o.participants, Math.round((80 + spec.floor * 30) * dungeonRewardMult(diff)));
      res.stars = 0;
      return res;
    }

    case 'tower': {
      const res = empty(o.won);
      if (!o.won) { s.stats.battlesLost++; return res; }
      s.stats.battlesWon++; track(s, 'battleWin'); track(s, 'towerWin');
      s.progress.tower.floor = Math.max(s.progress.tower.floor, spec.floor);
      res.firstClear = true;
      res.reward = towerReward(spec.floor);
      applyReward(s, res.reward);
      res.lines.push(`Étage ${spec.floor} conquis !`);
      return res;
    }

    case 'guildboss': {
      const res = empty(true);
      const dealt = Math.round(o.bossDamage?.dealt ?? 0);
      addPending(s, dealt, now);
      res.damage = { dealt, pct: Math.min(100, (dealt / Math.max(1, o.bossDamage?.max ?? 1)) * 100), chests: 0 };
      res.won = dealt > 0;
      res.lines.push(`Dégâts : ${dealt.toLocaleString('fr-FR')} · ajoutés aux dégâts du clan`);
      return res;
    }
    case 'worldboss': {
      const t = BOSS_TIERS.find((x) => x.id === spec.tier)!;
      const res = empty(true);
      track(s, 'worldBoss');
      const dealt = o.bossDamage?.dealt ?? 0;
      const pct = Math.min(100, (dealt / Math.max(1, o.bossDamage?.max ?? 1)) * 100);
      const chests = DAMAGE_CHESTS.filter((c) => pct >= c).length;
      res.damage = { dealt, pct, chests };
      s.worldBoss.best[t.id] = Math.max(s.worldBoss.best[t.id] ?? 0, pct);
      if (chests > 0) { res.reward = scaleReward(t.reward, (chests / DAMAGE_CHESTS.length) * eventBonus(now, 'worldBoss')); applyReward(s, res.reward); }
      res.won = chests > 0;
      res.lines.push(`Dégâts : ${Math.round(dealt).toLocaleString('fr-FR')} (${pct.toFixed(1)} % des PV) · ${chests}/${DAMAGE_CHESTS.length} paliers`);
      return res;
    }

    case 'arena': {
      const i = s.arena.opponents.findIndex((x) => x.id === spec.opponentId);
      const foe = s.arena.opponents[i];
      const res = empty(o.won);
      track(s, 'arenaFight');
      s.arena.seasonFights = (s.arena.seasonFights ?? 0) + 1;
      // Vengeance : une seule fois par combat du journal, points d'un adversaire « équilibré ».
      if (foe?.revenge && !s.arena.revenged.includes(foe.revenge)) s.arena.revenged = [foe.revenge, ...s.arena.revenged].slice(0, 40);
      // Événement « Tournoi » : plus de points pour chaque victoire (les récompenses arrivent en fin de saison).
      const base = ratingDelta(o.won, Math.min(2, Math.max(0, foe?.revenge ? 1 : i)));
      const delta = o.won ? Math.round(base * eventBonus(now, 'arena')) : base;
      s.arena.rating = Math.max(0, s.arena.rating + delta);
      res.rating = { delta, rating: s.arena.rating };
      if (o.won) {
        s.arena.wins++; track(s, 'arenaWin'); track(s, 'battleWin');
      } else s.arena.losses++;
      s.arena.opponents = generateOpponents(s, r);
      res.lines.push(`Classement : ${s.arena.rating} (${delta > 0 ? '+' : ''}${delta}) · Ligue ${arenaTier(s.arena.rating).name}`);
      return res;
    }

    case 'challenge': {
      const e = activeEvents(now).find((x) => x.id === spec.eventId);
      const res = empty(o.won);
      if (o.won && e?.cycle && spec.trial != null) {
        const tr = e.cycle.trials[spec.trial];
        const p = eventProgress(s, e.id);
        if (!tr || spec.trial !== (p.trials ?? 0)) return res;
        const set = trialSetup(s, e.id, spec.trial);
        s.stats.battlesWon++; track(s, 'battleWin'); track(s, 'challengeWin');
        p.trials = spec.trial + 1;
        res.firstClear = true; res.reward = tr.reward; applyReward(s, res.reward);
        res.heroXp = heroXpFor(s, o.participants, set?.heroXp ?? 300);
        res.lines.push(`+${tr.points} points d’événement`);
        return res;
      }
      if (!o.won) s.stats.battlesLost++;
      if (!o.won || !e?.challenge) return res;
      track(s, 'battleWin'); track(s, 'challengeWin');
      const p = (s.events[e.id] ??= { counters: {}, claimed: [], challengeDone: false });
      if (!p.challengeDone) { p.challengeDone = true; res.firstClear = true; res.reward = e.challenge.reward; applyReward(s, res.reward); }
      return res;
    }
  }
}

/** Combat suivant logique après une victoire (étage/niveau suivant). */
export function nextSpec(s: SaveData, spec: BattleSpec): BattleSpec | null {
  if (spec.mode === 'campaign') {
    const st = STAGE_BY_ID[spec.stageId];
    const ch = CHAPTERS.find((c) => c.n === st.chapter)!;
    const n = ch.stages[ch.stages.indexOf(st) + 1];
    return n ? { ...spec, stageId: n.id } : null;
  }
  if (spec.mode === 'dungeon') return spec.floor < DUNGEON_FLOORS ? { ...spec, floor: spec.floor + 1 } : null;
  if (spec.mode === 'tower') return s.progress.tower.floor < TOWER_FLOORS ? { mode: 'tower', floor: s.progress.tower.floor + 1 } : null;
  if (spec.mode === 'challenge' && spec.trial != null && spec.trial < 2) { const n = { ...spec, trial: spec.trial + 1 }; return canStart(s, n).ok ? n : null; }
  return null;
}
