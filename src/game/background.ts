import type { GearItem, SaveData } from '../save/schema';
import type { Reward } from '../data/resources';
import { BALANCE } from '../data/balance';
import { createBattle } from './battle/engine';
import { runToEnd } from './battle/simulate';
import { stageProgress, teamSetups } from './campaign';
import { applyMode, canStart, payMode, resolveMode, type BattleSpec } from './modes';

// COMBATS EN ARRIÈRE-PLAN — on lance une série de combats déjà gagnés une fois (campagne ou étage de donjon) ;
// ils se jouent tout seuls, un toutes les 30 secondes, pendant qu'on fait autre chose dans le jeu… et même jeu fermé
// (ceux qui auraient dû se jouer sont rattrapés au retour). Vrais combats du moteur, mêmes coûts, mêmes récompenses.
// S'il manque de l'énergie, la série attend qu'elle revienne. Elle peut s'arrêter à la première défaite.

export const BG_RUN_MS = 30_000;
export const BG_MAX = 50;
/** Au plus tant de combats rattrapés d'un coup (le reste suit aux secondes suivantes). */
const CATCH_UP = 30;

export interface BgRun {
  spec: BattleSpec;
  teamId: string;
  total: number;
  done: number;
  wins: number;
  stopOnLoss: boolean;
  startedAt: number;
  nextAt: number;
  /** En attente d'énergie (la série reprend toute seule). */
  waiting: boolean;
  reward: Reward;
  gear: GearItem[];
  /** Fin de la série : terminée, arrêtée par une défaite, par le joueur… */
  endedReason?: string;
}

export const bgActive = (s: SaveData) => !!s.bgRun && !s.bgRun.endedReason;

/** Peut-on lancer ce combat en arrière-plan ? */
export function canBackground(s: SaveData, spec: BattleSpec): { ok: boolean; reason?: string } {
  if (bgActive(s)) return { ok: false, reason: 'Une série tourne déjà en arrière-plan.' };
  if (spec.mode === 'campaign') {
    if ((stageProgress(s, spec.difficulty, spec.stageId).clears ?? 0) < 1) return { ok: false, reason: 'Gagne ce niveau une première fois.' };
  } else if (spec.mode === 'dungeon') {
    if ((s.progress.dungeons[spec.dungeonId]?.bestFloor ?? 0) < spec.floor) return { ok: false, reason: 'Termine cet étage une première fois.' };
  } else return { ok: false, reason: 'Indisponible pour ce mode.' };
  return canStart(s, spec).ok ? { ok: true } : canStart(s, spec);
}

/** Lance une série (mutation). Le premier combat se joue tout de suite. */
export function startBackground(s: SaveData, spec: BattleSpec, teamId: string, total: number, stopOnLoss: boolean, now: number): { ok: boolean; reason?: string } {
  const c = canBackground(s, spec);
  if (!c.ok) return c;
  const n = Math.max(1, Math.min(BG_MAX, Math.floor(total)));
  s.bgRun = { spec, teamId, total: n, done: 0, wins: 0, stopOnLoss, startedAt: now, nextAt: now, waiting: false, reward: {}, gear: [] };
  stepBackground(s, now);
  return { ok: true };
}

/** Joue les combats dont l'heure est venue (mutation). Renvoie le nombre de combats joués. */
export function stepBackground(s: SaveData, now: number, seed = now): number {
  const r = s.bgRun;
  if (!r || r.endedReason) return 0;
  let played = 0;
  while (!r.endedReason && r.done < r.total && now >= r.nextAt && played < CATCH_UP) {
    const team = s.teams.find((t) => t.id === r.teamId) ?? s.teams[0];
    const allies = teamSetups(s, team);
    if (!allies.length) { r.endedReason = 'L’équipe est vide.'; break; }
    const paid = payMode(s, r.spec, now);
    if (!paid.ok) {
      if (/énergie/i.test(paid.reason ?? '')) { r.waiting = true; r.nextAt = now + BALANCE.energy.regenMs; break; }
      r.endedReason = paid.reason ?? 'Combat impossible.'; break;
    }
    r.waiting = false;
    const info = resolveMode(s, r.spec);
    const b = runToEnd(createBattle(allies, info.waves, { seed: seed + r.done * 7919, leaderUid: team.leader, turnLimit: info.turnLimit }));
    const res = applyMode(s, r.spec, { won: b.outcome === 'won', alliesDead: b.units.filter((u) => u.side === 'ally' && !u.alive).length, participants: allies.map((a) => a.heroUid!) }, now);
    r.done++; played++;
    if (res.won) r.wins++;
    for (const part of [res.reward, res.loot]) for (const [k, v] of Object.entries(part)) r.reward[k as keyof Reward] = (r.reward[k as keyof Reward] ?? 0) + (v ?? 0);
    r.gear.push(...res.gear);
    // Un combat toutes les 30 s ; au retour dans le jeu, les combats en retard se rattrapent (énergie permettant).
    r.nextAt += BG_RUN_MS;
    if (!res.won && r.stopOnLoss) r.endedReason = 'Arrêtée après une défaite.';
  }
  if (!r.endedReason && r.done >= r.total) r.endedReason = 'Série terminée.';
  return played;
}

export function stopBackground(s: SaveData) {
  if (s.bgRun && !s.bgRun.endedReason) s.bgRun.endedReason = 'Arrêtée.';
}
/** Ferme le résumé d'une série finie. */
export function clearBackground(s: SaveData) {
  if (s.bgRun?.endedReason) s.bgRun = null;
}
