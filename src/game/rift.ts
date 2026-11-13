import { RIFT_ROOMS, RELICS, RELIC_BY_ID, riftReward, type RiftNodeKind } from '../data/rift';
import { towerWaves } from '../data/tower';
import { HERO_BY_ID } from '../data/heroes';
import { weekKey } from '../core/time';
import type { SaveData } from '../save/schema';
import type { UnitSetup } from './battle/types';
import type { GearBonus } from './gear';
import type { Reward } from '../data/resources';
import { applyReward } from './rewards';

export interface RiftState {
  week: string;
  status: 'idle' | 'run' | 'won' | 'lost';
  room: number;                 // salle en cours (1 à 10)
  nodes: RiftNodeKind[][];      // choix proposés pour chaque salle
  current: RiftNodeKind | null; // choix fait pour la salle en cours
  team: string[];               // héros engagés
  hp: Record<string, number>;   // PV restants (fraction) de chaque héros
  relics: string[];
  altar: string[] | null;       // reliques proposées (à choisir)
  base: number;                 // étage de Tour de référence (difficulté)
  best: number;                 // meilleure salle atteinte cette semaine
}
export const emptyRift = (): RiftState => ({ week: '', status: 'idle', room: 0, nodes: [], current: null, team: [], hp: {}, relics: [], altar: null, base: 5, best: 0 });

/** Générateur pseudo-aléatoire déterministe (même faille pour toute la semaine). */
function seeded(seed: string) { let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }

export function generateNodes(week: string): RiftNodeKind[][] {
  const r = seeded('rift:' + week);
  const out: RiftNodeKind[][] = [];
  for (let room = 1; room <= RIFT_ROOMS; room++) {
    if (room === RIFT_ROOMS) { out.push(['boss']); continue; }
    if (room === 1) { out.push(['fight', 'fight']); continue; }
    const pool: RiftNodeKind[] = room % 3 === 0 ? ['elite', 'altar', 'rest'] : ['fight', 'elite', 'altar', 'fight', 'rest'];
    const n = r() < 0.5 ? 2 : 3; const pick = new Set<RiftNodeKind>();
    while (pick.size < n) pick.add(pool[Math.floor(r() * pool.length)]);
    out.push([...pick]);
  }
  return out;
}

/** Remet la Faille à zéro au changement de semaine (mutation). */
export function syncRift(s: SaveData, now: number): RiftState {
  const wk = weekKey(now);
  if (!s.rift || s.rift.week !== wk) s.rift = { ...emptyRift(), week: wk, nodes: generateNodes(wk) };
  return s.rift;
}

export function startRift(s: SaveData, teamUids: string[], now: number): { ok: boolean; reason?: string } {
  const r = syncRift(s, now);
  if (r.status !== 'idle') return { ok: false, reason: 'Une seule traversée par semaine.' };
  const team = teamUids.filter((u) => s.heroes.some((h) => h.uid === u)).slice(0, 5);
  if (!team.length) return { ok: false, reason: 'Ton équipe est vide.' };
  r.status = 'run'; r.room = 1; r.current = null; r.team = team; r.relics = []; r.altar = null;
  r.hp = Object.fromEntries(team.map((u) => [u, 1]));
  r.base = Math.max(3, Math.min(80, (s.progress.tower?.floor ?? 0) - 8));
  return { ok: true };
}

const offer = (s: SaveData, n = 3) => { const have = new Set(s.rift.relics); const pool = RELICS.filter((x) => !have.has(x.id)); const r = seeded(`${s.rift.week}:${s.rift.room}:${s.rift.relics.length}`); const out: string[] = []; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0].id); return out; };

/** Choisit la route de la salle en cours (mutation). Combat/élite/boss : il reste à combattre. */
export function chooseNode(s: SaveData, i: number): { ok: boolean; reason?: string; fight?: boolean } {
  const r = s.rift; if (r.status !== 'run' || r.current || r.altar) return { ok: false, reason: 'Choix impossible maintenant.' };
  const kind = r.nodes[r.room - 1]?.[i]; if (!kind) return { ok: false, reason: 'Route inconnue.' };
  r.current = kind;
  if (kind === 'rest') { for (const u of r.team) r.hp[u] = r.hp[u] > 0 ? Math.min(1, r.hp[u] + 0.35) : 0.2; advance(s); return { ok: true }; }
  if (kind === 'altar') { r.altar = offer(s); return { ok: true }; }
  return { ok: true, fight: true };
}
export function pickRelic(s: SaveData, id: string): { ok: boolean; reason?: string } {
  const r = s.rift; if (!r.altar?.includes(id)) return { ok: false, reason: 'Relique indisponible.' };
  r.relics.push(id); r.altar = null; if (r.current === 'altar' || r.current === 'elite') advance(s); return { ok: true };
}
function advance(s: SaveData) { const r = s.rift; r.best = Math.max(r.best, r.room); r.current = null; r.room += 1; }

/** Ennemis de la salle en cours, selon la route choisie. */
export function riftWaves(s: SaveData): UnitSetup[][] {
  const r = s.rift; const kind = r.current ?? 'fight';
  let f = kind === 'boss' ? Math.min(100, Math.ceil((r.base + 14) / 10) * 10) : r.base + r.room + (kind === 'elite' ? 6 : 0);
  if (kind !== 'boss' && f % 10 === 0) f -= 1;
  return towerWaves(Math.max(1, Math.min(100, f))).map((w) => w.map((e) => ({ kind: 'enemy' as const, refId: e.enemy, slot: e.slot, level: e.level, hpMult: e.hpMult, statMult: e.statMult })));
}

/** Applique les reliques et les PV restants aux héros engagés (les héros tombés restent au repos). */
export function riftSetups(s: SaveData, allies: UnitSetup[]): UnitSetup[] {
  const r = s.rift;
  return allies.filter((a) => a.heroUid && (r.hp[a.heroUid] ?? 0) > 0).map((a) => {
    const d = HERO_BY_ID[a.refId];
    const g: GearBonus = a.gear ? { ...a.gear, flat: { ...a.gear.flat }, pct: { ...a.gear.pct } } : { flat: {}, pct: { hp: 0, atk: 0, def: 0, spd: 0 }, lifesteal: 0, regen: 0, startTm: 0, sets: [] };
    for (const id of r.relics) {
      const e = RELIC_BY_ID[id]?.effect; if (!e) continue;
      if (e.kind === 'pct') { if ((e.faction && d.faction !== e.faction) || (e.affinity && d.affinity !== e.affinity)) continue; g.pct[e.stat] += e.value; }
      else if (e.kind === 'leech') g.lifesteal += e.value; else if (e.kind === 'regen') g.regen += e.value; else g.startTm += e.value;
    }
    return { ...a, gear: g, hpPct: r.hp[a.heroUid!] };
  });
}

/** Résultat d'un combat de Faille (mutation). */
export function applyRiftBattle(s: SaveData, won: boolean, allyHp: Record<string, number>): { reward: Reward; lines: string[] } {
  const r = s.rift; const kind = r.current ?? 'fight'; const lines: string[] = [];
  for (const u of r.team) if (u in allyHp) r.hp[u] = allyHp[u];
  if (!won) { r.status = 'lost'; r.best = Math.max(r.best, r.room - 1); lines.push(`La faille t’a rejeté à la salle ${r.room}.`); return { reward: {}, lines }; }
  const reward = riftReward(kind, r.room); applyReward(s, reward);
  if (kind === 'boss') { r.status = 'won'; r.best = RIFT_ROOMS; r.current = null; lines.push('Gardien vaincu : la faille est refermée cette semaine !'); }
  else if (kind === 'elite') { r.altar = offer(s); lines.push(`Salle ${r.room} franchie : choisis une relique.`); }
  else { lines.push(`Salle ${r.room} franchie.`); advance(s); }
  return { reward, lines };
}
