import { nextRandom } from '../core/rng';
import { uid } from '../core/ids';
import {
  GEAR_MAX_LEVEL, GEAR_MAX_STARS, GEAR_RARITIES, MAIN_BASE, SET_LIST, SETS, SLOTS, SLOT_BY_ID, STAR_MULT, SUB_RANGE,
  campaignGearTable, gearUpgradeCost, gearDismantleValue, type GearRarity, type GearSlot, type GearStat, type SetId,
} from '../data/equipment';
import type { Stats } from '../data/types';
import type { GearItem, SaveData } from '../save/schema';
import { track } from './missions';

export type Rand = () => number;
export function seededRand(seed: number): Rand {
  let st = seed >>> 0;
  return () => { const [v, n] = nextRandom(st); st = n; return v; };
}

function pick<T>(r: Rand, list: T[]): T { return list[Math.floor(r() * list.length)]; }
export function pickWeighted<T>(r: Rand, table: [T, number][]): T {
  const total = table.reduce((a, [, w]) => a + w, 0);
  let x = r() * total;
  for (const [v, w] of table) { if ((x -= w) < 0) return v; }
  return table[table.length - 1][0];
}

function rollSub(r: Rand, stat: GearStat, rarity: GearRarity): number {
  const [lo, hi] = SUB_RANGE[stat];
  const v = (lo + r() * (hi - lo)) * GEAR_RARITIES[rarity].mult;
  return stat === 'hp' || stat === 'atk' || stat === 'def' || stat === 'acc' || stat === 'res' ? Math.round(v) : Math.round(v * 10) / 10;
}

const SUB_POOL: GearStat[] = ['hp', 'atk', 'def', 'hpPct', 'atkPct', 'defPct', 'spd', 'critRate', 'critDmg', 'acc', 'res'];

/** Étoiles par défaut quand la source n'en impose pas : autant que le rang de rareté. */
export const defaultStars = (rarity: GearRarity) => Math.min(GEAR_MAX_STARS, GEAR_RARITIES[rarity].order);
const clampStars = (n: number) => Math.max(1, Math.min(GEAR_MAX_STARS, Math.round(n)));

export function generateGear(r: Rand, rarity: GearRarity, now: number, slot?: GearSlot, set?: SetId, stars?: number): GearItem {
  const s = slot ?? pick(r, SLOTS).id;
  const main = pick(r, SLOT_BY_ID[s].mains);
  const subs: GearItem['subs'] = [];
  const pool = SUB_POOL.filter((x) => x !== main);
  while (subs.length < GEAR_RARITIES[rarity].subs) {
    const st = pick(r, pool.filter((x) => !subs.some((y) => y.stat === x)));
    subs.push({ stat: st, value: rollSub(r, st, rarity), rolls: 1 });
  }
  // Mythique : une secondaire déjà renforcée.
  for (let i = 0; i < (GEAR_RARITIES[rarity].boosted ?? 0) && subs.length; i++) {
    const sub = pick(r, subs);
    sub.value = Math.round((sub.value + rollSub(r, sub.stat, rarity)) * 10) / 10;
    sub.rolls += 1;
  }
  return { uid: uid('g_'), slot: s, rarity, stars: clampStars(stars ?? defaultStars(rarity)), set: set ?? pick(r, SET_LIST).id, level: 0, main, subs, heroUid: null, locked: false, obtainedAt: now };
}

/** Statistique principale : base × étoiles × niveau (+12 % de la base par niveau). */
export function mainValue(g: Pick<GearItem, 'main' | 'rarity' | 'level'> & { stars?: number }): number {
  const v = MAIN_BASE[g.main] * STAR_MULT[clampStars(g.stars ?? defaultStars(g.rarity))] * (1 + 0.12 * g.level);
  return g.main === 'hp' || g.main === 'atk' || g.main === 'def' || g.main === 'acc' || g.main === 'res' ? Math.round(v) : Math.round(v * 10) / 10;
}

/** Améliore un équipement d'un niveau (mutation). Aux niveaux 4, 8, 12 et 16 : nouvelle stat secondaire ou renforcement. */
export function upgradeGear(s: SaveData, gearUid: string, r: Rand): { ok: boolean; reason?: string; boosted?: GearStat } {
  const g = s.equipment.find((x) => x.uid === gearUid);
  if (!g) return { ok: false, reason: 'Équipement introuvable.' };
  if (g.level >= GEAR_MAX_LEVEL) return { ok: false, reason: 'Niveau maximum atteint.' };
  const cost = gearUpgradeCost(g.rarity, g.level);
  if (s.resources.gold < cost.gold) return { ok: false, reason: 'Or insuffisant.' };
  if (s.resources.forgeOre < cost.forgeOre) return { ok: false, reason: 'Minerai de forge insuffisant.' };
  s.resources.gold -= cost.gold;
  s.resources.forgeOre -= cost.forgeOre;
  g.level += 1;
  track(s, 'gearUpgrade');
  let boosted: GearStat | undefined;
  if (g.level % 4 === 0) {
    if (g.subs.length < 4) {
      const pool = SUB_POOL.filter((x) => x !== g.main && !g.subs.some((y) => y.stat === x));
      const st = pick(r, pool);
      g.subs.push({ stat: st, value: rollSub(r, st, g.rarity), rolls: 1 });
      boosted = st;
    } else {
      const sub = pick(r, g.subs);
      sub.value = Math.round((sub.value + rollSub(r, sub.stat, g.rarity)) * 10) / 10;
      sub.rolls += 1;
      boosted = sub.stat;
    }
  }
  return { ok: true, boosted };
}

export function dismantleGear(s: SaveData, gearUid: string): { gold: number; forgeOre: number } | null {
  const g = s.equipment.find((x) => x.uid === gearUid);
  if (!g || g.locked || g.heroUid) return null;
  const v = gearDismantleValue(g.rarity, g.level);
  s.resources.gold += v.gold;
  s.resources.forgeOre += v.forgeOre;
  s.equipment = s.equipment.filter((x) => x.uid !== gearUid);
  return v;
}

export function equipGear(s: SaveData, gearUid: string, heroUid: string): boolean {
  const g = s.equipment.find((x) => x.uid === gearUid);
  if (!g || !s.heroes.some((h) => h.uid === heroUid)) return false;
  for (const o of s.equipment) if (o.heroUid === heroUid && o.slot === g.slot) o.heroUid = null;
  g.heroUid = heroUid;
  return true;
}

export function unequipGear(s: SaveData, gearUid: string) {
  const g = s.equipment.find((x) => x.uid === gearUid);
  if (g) g.heroUid = null;
}

export interface GearBonus {
  flat: Partial<Stats>;
  pct: { hp: number; atk: number; def: number; spd: number };
  lifesteal: number;
  /** Ensembles à effet : soin par tour (% PV max) et jauge de tour de départ (%). */
  regen: number;
  startTm: number;
  sets: { id: SetId; count: number; active: number }[];
}

/** Total des bonus d'équipement (stats principales, secondaires et ensembles) d'un héros. */
export function gearBonus(items: GearItem[]): GearBonus {
  const b: GearBonus = { flat: {}, pct: { hp: 0, atk: 0, def: 0, spd: 0 }, lifesteal: 0, regen: 0, startTm: 0, sets: [] };
  const add = (stat: GearStat, v: number) => {
    if (stat === 'hpPct') b.pct.hp += v;
    else if (stat === 'atkPct') b.pct.atk += v;
    else if (stat === 'defPct') b.pct.def += v;
    else b.flat[stat] = (b.flat[stat] ?? 0) + v;
  };
  const counts: Partial<Record<SetId, number>> = {};
  for (const g of items) {
    add(g.main, mainValue(g));
    for (const sub of g.subs) add(sub.stat, sub.value);
    counts[g.set] = (counts[g.set] ?? 0) + 1;
  }
  for (const [id, count] of Object.entries(counts) as [SetId, number][]) {
    const def = SETS[id];
    const active = Math.floor(count / def.pieces);
    b.sets.push({ id, count, active });
    for (let i = 0; i < active; i++) {
      for (const [k, v] of Object.entries(def.bonus)) {
        if (k === 'lifesteal') b.lifesteal += v as number;
        else if (k === 'regen') b.regen += v as number;
        else if (k === 'startTm') b.startTm += v as number;
        else if (k === 'spd') b.pct.spd += v as number;
        else add(k as GearStat, v as number);
      }
    }
  }
  return b;
}

export function applyGearBonus(base: Stats, b: GearBonus): Stats {
  const f = (k: keyof Stats) => b.flat[k] ?? 0;
  return {
    hp: Math.round(base.hp * (1 + b.pct.hp / 100) + f('hp')),
    atk: Math.round(base.atk * (1 + b.pct.atk / 100) + f('atk')),
    def: Math.round(base.def * (1 + b.pct.def / 100) + f('def')),
    spd: Math.round(base.spd * (1 + b.pct.spd / 100) + f('spd')),
    critRate: Math.min(100, Math.round((base.critRate + f('critRate')) * 10) / 10),
    critDmg: Math.round((base.critDmg + f('critDmg')) * 10) / 10,
    acc: Math.round(base.acc + f('acc')),
    res: Math.round(base.res + f('res')),
  };
}

/** Étoiles du butin de campagne : selon le chapitre (+1 pour un boss, parfois +1 de chance). */
export function campaignStars(r: Rand, chapter: number, boss: boolean): number {
  return clampStars(1 + Math.floor((chapter - 1) * 0.6) + (boss ? 1 : 0) + (r() < 0.25 ? 1 : 0));
}
/** Étoiles du butin de donjon : selon l'étage (6★ possibles au 10e). */
export function dungeonStars(r: Rand, floor: number): number {
  return clampStars(1 + Math.ceil(floor / 2.5) + (r() < 0.2 ? 1 : 0));
}

export function rollCampaignGear(r: Rand, stageIndex: number, boss: boolean, now: number, chapter = 1): GearItem {
  return generateGear(r, pickWeighted(r, campaignGearTable(stageIndex, boss)), now, undefined, undefined, campaignStars(r, chapter, boss));
}
