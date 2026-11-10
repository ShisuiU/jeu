import { BALANCE } from '../data/balance';
import { dungeonBest } from './dungeons';
import { HERO_BY_ID } from '../data/heroes';
import { SLOTS } from '../data/equipment';
import type { Reward } from '../data/resources';
import type { GearItem, SaveData } from '../save/schema';
import { createBattle } from './battle/engine';
import { runToEnd } from './battle/simulate';
import { stageProgress, teamSetups } from './campaign';
import { addEnergy } from './energy';
import { applyGearBonus, gearBonus } from './gear';
import { heroTotalStats } from './heroStats';
import { applyMode, payMode, resolveMode, type BattleSpec } from './modes';
import { computeStats, powerOf } from './stats';

// CONFORT DE JEU — balayage, recharge d'énergie, équipement automatique, équipe recommandée.

// ─── Balayage : rejouer instantanément un combat déjà maîtrisé ───
export function canSweep(s: SaveData, spec: BattleSpec): { ok: boolean; reason?: string } {
  if (spec.mode === 'campaign') return stageProgress(s, spec.difficulty, spec.stageId).stars >= 3 ? { ok: true } : { ok: false, reason: 'Obtiens 3 étoiles pour débloquer le balayage.' };
  if (spec.mode === 'dungeon') return dungeonBest(s, spec.dungeonId, spec.difficulty ?? 'normal') >= spec.floor ? { ok: true } : { ok: false, reason: 'Termine cet étage une première fois.' };
  return { ok: false, reason: 'Balayage indisponible pour ce mode.' };
}

export interface SweepSummary { runs: number; wins: number; reward: Reward; gear: GearItem[]; levelUps: { heroId: string; to: number }[]; stopReason?: string }

/** Joue `count` combats en accéléré (résultats réels du moteur, mêmes coûts et récompenses). Mutation. */
export function sweep(s: SaveData, spec: BattleSpec, teamId: string, count: number, now: number, seed = now): SweepSummary {
  const out: SweepSummary = { runs: 0, wins: 0, reward: {}, gear: [], levelUps: [] };
  const c = canSweep(s, spec);
  if (!c.ok) { out.stopReason = c.reason; return out; }
  const team = s.teams.find((t) => t.id === teamId) ?? s.teams[0];
  const levels0 = Object.fromEntries(s.heroes.map((h) => [h.uid, h.level]));
  for (let i = 0; i < count; i++) {
    const paid = payMode(s, spec, now);
    if (!paid.ok) { out.stopReason = paid.reason; break; }
    const info = resolveMode(s, spec);
    const allies = teamSetups(s, team);
    const b = runToEnd(createBattle(allies, info.waves, { seed: seed + i * 7919, leaderUid: team.leader, turnLimit: info.turnLimit }));
    const res = applyMode(s, spec, { won: b.outcome === 'won', alliesDead: b.units.filter((u) => u.side === 'ally' && !u.alive).length, participants: allies.map((a) => a.heroUid!) }, now);
    out.runs++;
    if (res.won) out.wins++;
    for (const r of [res.reward, res.loot]) for (const [k, v] of Object.entries(r)) out.reward[k as keyof Reward] = (out.reward[k as keyof Reward] ?? 0) + (v ?? 0);
    out.gear.push(...res.gear);
  }
  for (const h of s.heroes) if (levels0[h.uid] !== undefined && h.level > levels0[h.uid]) out.levelUps.push({ heroId: h.heroId, to: h.level });
  return out;
}

// ─── Recharge d'énergie ───
export function refillCost(s: SaveData): number | null {
  return BALANCE.energyRefill.costs[s.shop.energyRefills] ?? null;
}
export function refillEnergy(s: SaveData): { ok: boolean; reason?: string } {
  const cost = refillCost(s);
  if (cost === null) return { ok: false, reason: 'Plus de recharges aujourd’hui.' };
  if (s.resources.crystals < cost) return { ok: false, reason: 'Cristaux insuffisants.' };
  s.resources.crystals -= cost;
  s.shop.energyRefills += 1;
  s.energy = addEnergy(s.energy, BALANCE.energyRefill.amount);
  return { ok: true };
}

// ─── Équipement automatique ───
/** Équipe, emplacement par emplacement, l'objet libre qui augmente le plus la puissance du héros. Ne prend jamais l'équipement d'un autre héros. */
export function autoEquip(s: SaveData, heroUid: string): number {
  const h = s.heroes.find((x) => x.uid === heroUid);
  if (!h) return 0;
  const base = computeStats(HERO_BY_ID[h.heroId], h);
  let changed = 0;
  for (const slot of SLOTS) {
    const worn = s.equipment.filter((g) => g.heroUid === heroUid);
    const current = worn.find((g) => g.slot === slot.id);
    const others = worn.filter((g) => g.slot !== slot.id);
    const score = (g?: GearItem) => powerOf(applyGearBonus(base, gearBonus(g ? [...others, g] : others)));
    let best = current;
    let bestScore = score(current);
    for (const g of s.equipment) {
      if (g.slot !== slot.id || g.heroUid) continue;
      const sc = score(g);
      if (sc > bestScore) { best = g; bestScore = sc; }
    }
    if (best && best !== current) {
      if (current) current.heroUid = null;
      best.heroUid = heroUid;
      changed++;
    }
  }
  return changed;
}

// ─── Équipe recommandée ───
/** Défenseur et meilleurs attaquants devant, soigneur et soutien derrière ; chef = meilleure aura d'équipe. */
export function recommendTeam(s: SaveData): { slots: (string | null)[]; leader: string | null } {
  const ranked = s.heroes.map((h) => ({ h, d: HERO_BY_ID[h.heroId], p: powerOf(heroTotalStats(s, h).total) })).sort((a, b) => b.p - a.p);
  const take = (pred: (x: typeof ranked[number]) => boolean) => { const i = ranked.findIndex(pred); return i >= 0 ? ranked.splice(i, 1)[0] : undefined; };
  const front: (typeof ranked[number] | undefined)[] = [];
  const back: (typeof ranked[number] | undefined)[] = [];
  front.push(take((x) => x.d.role === 'defender'));
  back.push(take((x) => x.d.role === 'healer'));
  front.push(take((x) => ['attacker', 'assassin', 'controller'].includes(x.d.role)));
  front.push(take((x) => ['attacker', 'assassin', 'controller'].includes(x.d.role)));
  back.push(take((x) => ['support', 'healer', 'controller'].includes(x.d.role)));
  const fill = (arr: typeof front, n: number) => { for (let i = 0; i < n; i++) if (!arr[i]) arr[i] = take(() => true); };
  fill(front, 3); fill(back, 2);
  const slots = [...front, ...back].map((x) => x?.h.uid ?? null);
  const chosen = [...front, ...back].filter(Boolean) as typeof ranked;
  const leader = chosen.filter((x) => x.d.leaderSkill?.scope === 'all').sort((a, b) => b.p - a.p)[0] ?? chosen[0];
  return { slots, leader: leader?.h.uid ?? null };
}
