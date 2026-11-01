import { CHAPTERS, STAGE_BY_ID, type DialogueLine, type DifficultyId, type WaveEnemy } from '../data/campaign';
import { DUNGEON_BY_ID, DUNGEON_FLOORS, dungeonEnergy, dungeonWaves } from '../data/dungeons';
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
import { activeEvents, dungeonBonus } from './events';
import { track } from './missions';
import { generateOpponents, ratingDelta } from './arena';

// MODES DE JEU — un seul écran de combat, plusieurs modes décrits ici :
// préparation (ennemis, coût, aperçu des récompenses) et application du résultat.

export type BattleSpec =
  | { mode: 'campaign'; stageId: string; difficulty: DifficultyId }
  | { mode: 'dungeon'; dungeonId: string; floor: number }
  | { mode: 'tower'; floor: number }
  | { mode: 'worldboss'; tier: string }
  | { mode: 'arena'; opponentId: string }
  | { mode: 'challenge'; eventId: string };

export type CostKind = 'energy' | 'key' | 'ticket' | 'free';

export interface ModeInfo {
  title: string;
  subtitle: string;
  region: 'valcrest';
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
  waves.map((w) => w.map((e) => ({ kind: 'enemy' as const, refId: e.enemy, slot: e.slot, level: e.level + levelAdd, hpMult: e.hpMult, statMult })));

function scaleReward(r: Reward, m: number): Reward {
  const o: Reward = {};
  for (const [k, v] of Object.entries(r)) o[k as keyof Reward] = Math.max(1, Math.round((v ?? 0) * m));
  return o;
}

export function resolveMode(s: SaveData, spec: BattleSpec): ModeInfo {
  switch (spec.mode) {
    case 'campaign': {
      const st = STAGE_BY_ID[spec.stageId];
      const first = stageProgress(s, spec.difficulty, st.id).clears === 0;
      const { heroes: _h, ...fc } = st.firstClear;
      void _h;
      return {
        title: `${st.id} · ${st.name}`, subtitle: `Chapitre ${st.chapter}`, region: 'valcrest', waves: stageWaves(st, spec.difficulty),
        cost: { kind: 'energy', amount: stageEnergy(st, spec.difficulty) }, before: first && spec.difficulty === 'normal' ? st.before : undefined,
        after: first && spec.difficulty === 'normal' ? st.after : undefined, rewardPreview: first ? fc : st.repeat, rewardLabel: first ? 'Première victoire' : 'Récompenses',
        notes: [`+${st.heroXp} XP par héros`, '★★★ si aucun héros n’est mis K.O.'], firstTime: first,
      };
    }
    case 'dungeon': {
      const d = DUNGEON_BY_ID[spec.dungeonId];
      const bonus = dungeonBonus(s.time.highWater);
      return {
        title: `${d.name} · Étage ${spec.floor}`, subtitle: d.description, region: 'valcrest', waves: toSetups(dungeonWaves(d, spec.floor)),
        cost: { kind: 'energy', amount: dungeonEnergy(spec.floor) }, rewardPreview: scaleReward(d.reward(spec.floor), bonus), rewardLabel: bonus > 1 ? `Récompenses (bonus d’événement ×${bonus})` : 'Récompenses',
        notes: [d.gear ? 'Équipement garanti à chaque victoire' : '', `Étage suivant débloqué en cas de victoire`].filter(Boolean), firstTime: (s.progress.dungeons[d.id]?.bestFloor ?? 0) < spec.floor,
      };
    }
    case 'tower':
      return {
        title: `Tour des Âges · Étage ${spec.floor}`, subtitle: spec.floor % 10 === 0 ? 'Étage gardé par une Sentinelle' : 'Ascension', region: 'valcrest', waves: toSetups(towerWaves(spec.floor)),
        cost: { kind: 'free', amount: 0 }, rewardPreview: towerReward(spec.floor), rewardLabel: 'Récompense de l’étage', notes: ['Sans énergie', 'Une victoire = étage suivant'], firstTime: true,
      };
    case 'worldboss': {
      const t = BOSS_TIERS.find((x) => x.id === spec.tier)!;
      return {
        title: `${WORLD_BOSS.name} · ${t.name}`, subtitle: `Combat limité à ${WORLD_BOSS.turnLimit} actions`, region: 'valcrest',
        waves: [[{ kind: 'enemy', refId: WORLD_BOSS.enemy, slot: 1, level: t.level, hpMult: t.hpMult }]], turnLimit: WORLD_BOSS.turnLimit,
        cost: { kind: 'key', amount: 1 }, rewardPreview: t.reward, rewardLabel: 'Récompense maximale (100 % des PV)',
        notes: [`Paliers de dégâts : ${DAMAGE_CHESTS.join(' / ')} %`, `Meilleur score : ${Math.round(s.worldBoss.best[t.id] ?? 0)} %`], firstTime: false,
      };
    }
    case 'arena': {
      const i = s.arena.opponents.findIndex((o) => o.id === spec.opponentId);
      const o = s.arena.opponents[i];
      return {
        title: `Arène · ${o?.name ?? '?'}`, subtitle: `Classement ${s.arena.rating}`, region: 'valcrest',
        waves: [(o?.heroes ?? []).map((h) => ({ kind: 'hero' as const, refId: h.heroId, slot: h.slot, level: h.level }))],
        cost: { kind: 'ticket', amount: 1 }, rewardPreview: arenaTier(s.arena.rating).reward, rewardLabel: 'Récompense de victoire',
        notes: [`Victoire : +${ratingDelta(true, Math.max(0, i))} points · Défaite : ${ratingDelta(false, 0)}`], firstTime: false,
      };
    }
    case 'challenge': {
      const e = activeEvents(s.time.highWater).find((x) => x.id === spec.eventId);
      const c = e?.challenge;
      return {
        title: c?.name ?? 'Défi', subtitle: e?.name ?? '', region: 'valcrest', waves: c ? toSetups(c.waves) : [[]],
        cost: { kind: 'free', amount: 0 }, rewardPreview: c?.reward ?? {}, rewardLabel: 'Récompense unique', notes: [c?.description ?? ''], firstTime: true,
      };
    }
  }
}

/** Le combat peut-il commencer ? */
export function canStart(s: SaveData, spec: BattleSpec): { ok: boolean; reason?: string } {
  switch (spec.mode) {
    case 'campaign': return isStageUnlocked(s, spec.difficulty, STAGE_BY_ID[spec.stageId]) ? { ok: true } : { ok: false, reason: 'Niveau verrouillé.' };
    case 'dungeon': return spec.floor <= Math.min(DUNGEON_FLOORS, (s.progress.dungeons[spec.dungeonId]?.bestFloor ?? 0) + 1) ? { ok: true } : { ok: false, reason: 'Terminez l’étage précédent.' };
    case 'tower': return spec.floor === s.progress.tower.floor + 1 && spec.floor <= TOWER_FLOORS ? { ok: true } : { ok: false, reason: 'Étage indisponible.' };
    case 'worldboss': return s.worldBoss.keysUsed < WORLD_BOSS.keysPerDay ? { ok: true } : { ok: false, reason: 'Plus de clés aujourd’hui.' };
    case 'arena': return s.arena.ticketsUsed >= ARENA.ticketsPerDay ? { ok: false, reason: 'Plus de tickets aujourd’hui.' } : s.arena.opponents.some((o) => o.id === spec.opponentId) ? { ok: true } : { ok: false, reason: 'Adversaire introuvable.' };
    case 'challenge': {
      const e = activeEvents(s.time.highWater).find((x) => x.id === spec.eventId);
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
  if (info.cost.kind === 'energy' && !payEnergy(s, info.cost.amount, now)) return { ok: false, reason: 'Énergie insuffisante.' };
  if (info.cost.kind === 'key') s.worldBoss.keysUsed += 1;
  if (info.cost.kind === 'ticket') s.arena.ticketsUsed += 1;
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
      const res = empty(o.won);
      res.accountLevelsGained = addAccountXp(s, dungeonEnergy(spec.floor) * (o.won ? 10 : 3));
      if (!o.won) { s.stats.battlesLost++; return res; }
      s.stats.battlesWon++; track(s, 'battleWin'); track(s, 'dungeonWin');
      const prog = (s.progress.dungeons[d.id] ??= { bestFloor: 0 });
      res.firstClear = spec.floor > prog.bestFloor;
      prog.bestFloor = Math.max(prog.bestFloor, spec.floor);
      res.reward = scaleReward(d.reward(spec.floor), dungeonBonus(now));
      applyReward(s, res.reward);
      if (d.gear && s.equipment.length < GEAR_INVENTORY_CAP) {
        const g: GearItem = generateGear(r, pickWeighted(r, d.gear(spec.floor).filter(([, w]) => w > 0)), now);
        s.equipment.push(g); res.gear.push(g);
      }
      res.heroXp = heroXpFor(s, o.participants, 80 + spec.floor * 30);
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

    case 'worldboss': {
      const t = BOSS_TIERS.find((x) => x.id === spec.tier)!;
      const res = empty(true);
      track(s, 'worldBoss');
      const dealt = o.bossDamage?.dealt ?? 0;
      const pct = Math.min(100, (dealt / Math.max(1, o.bossDamage?.max ?? 1)) * 100);
      const chests = DAMAGE_CHESTS.filter((c) => pct >= c).length;
      res.damage = { dealt, pct, chests };
      s.worldBoss.best[t.id] = Math.max(s.worldBoss.best[t.id] ?? 0, pct);
      if (chests > 0) { res.reward = scaleReward(t.reward, chests / DAMAGE_CHESTS.length); applyReward(s, res.reward); }
      res.won = chests > 0;
      res.lines.push(`Dégâts : ${Math.round(dealt).toLocaleString('fr-FR')} (${pct.toFixed(1)} % des PV) · ${chests}/${DAMAGE_CHESTS.length} paliers`);
      return res;
    }

    case 'arena': {
      const i = s.arena.opponents.findIndex((x) => x.id === spec.opponentId);
      const res = empty(o.won);
      track(s, 'arenaFight');
      const delta = ratingDelta(o.won, Math.max(0, i));
      s.arena.rating = Math.max(0, s.arena.rating + delta);
      res.rating = { delta, rating: s.arena.rating };
      if (o.won) {
        s.arena.wins++; track(s, 'arenaWin'); track(s, 'battleWin');
        res.reward = arenaTier(s.arena.rating).reward;
        applyReward(s, res.reward);
      } else s.arena.losses++;
      s.arena.opponents = generateOpponents(s, r);
      res.lines.push(`Classement : ${s.arena.rating} (${delta > 0 ? '+' : ''}${delta}) · Ligue ${arenaTier(s.arena.rating).name}`);
      return res;
    }

    case 'challenge': {
      const e = activeEvents(now).find((x) => x.id === spec.eventId);
      const res = empty(o.won);
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
  return null;
}
