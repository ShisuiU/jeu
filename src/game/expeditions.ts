import type { SaveData } from '../save/schema';
import { cleanReward, type Reward } from '../data/resources';
import type { AffinityId, FactionId, RoleId } from '../data/types';
import { HERO_BY_ID } from '../data/heroes';
import { AFFINITIES } from '../data/affinities';
import { ROLES } from '../data/roles';
import { FACTIONS } from '../data/factions';
import { dayKey } from '../core/time';
import { seededRand } from './gear';
import { powerOf } from './stats';
import { heroTotalStats } from './heroStats';
import { applyReward } from './rewards';
import { track } from './missions';
import { eventBonus } from './events';

// EXPÉDITIONS — le Lien envoie des héros à travers les failles. Ils reviennent après un temps
// réel (même jeu fermé) avec du butin. 4 expéditions proposées par jour ; bonus si la condition
// (affinité, rôle ou famille) est remplie et selon la puissance de l'équipe envoyée.

export interface ExpeditionOffer {
  id: string; place: string; region: string; art: string; minutes: number; size: number;
  cond: { kind: 'affinity' | 'role' | 'faction'; id: string };
  reqPower: number; base: Reward;
}
export interface ExpeditionRun { offerId: string; heroUids: string[]; startAt: number; endsAt: number; offer: ExpeditionOffer }
export interface ExpeditionState { day: string; offers: ExpeditionOffer[]; runs: ExpeditionRun[]; done: string[] }

export const EXPEDITION_SLOTS = 4;

const PLACES: { place: string; region: string; art: string; focus: Reward }[] = [
  { place: 'Les ruines de Valcrest', region: 'valcrest', art: 'herald', focus: { gold: 2200, xpElixir: 1.2 } },
  { place: 'Les sylves murmurantes', region: 'sylvaran', art: 'mother_tree', focus: { xpElixir: 2, potionMinor: 1 } },
  { place: 'Les tours du Prisme', region: 'prism', art: 'mother_ai', focus: { forgeOre: 14, skillTome: 0.12 } },
  { place: 'Les sables d’Akkar', region: 'akkar', art: 'scorpion_king', focus: { gold: 2600, rankSigil: 0.15 } },
  { place: 'Les forges de Cendre', region: 'ash', art: 'ash_lord', focus: { forgeOre: 18, awakenEssence: 0.05 } },
  { place: 'L’Observatoire', region: 'astral', art: 'dead_constellation', focus: { crystals: 8, potionMinor: 0.75 } },
  { place: 'Les Marches recousues', region: 'seams', art: 'weaver_of_ages', focus: { shardDim: 0.35, crystals: 5 } },
  { place: 'Le Rivage gris', region: 'abyss', art: 'brine_siren', focus: { masteryScroll: 0.12, crystals: 4 } },
];
const DURATIONS = [60, 240, 480, 720];
const DUR_MULT = [1, 3, 5.5, 7.5];

const hash = (str: string) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const heroPower = (s: SaveData, uid: string) => { const h = s.heroes.find((x) => x.uid === uid); return h ? powerOf(heroTotalStats(s, h).total) : 0; };

/** Les 4 propositions du jour (déterministes : même jour, mêmes offres). */
export function generateOffers(s: SaveData, day: string): ExpeditionOffer[] {
  const r = seededRand(hash(s.saveId + day));
  const pick = <T,>(l: T[]) => l[Math.floor(r() * l.length)];
  // Puissance de référence : moyenne des 3 meilleurs héros (atteignable avec ses meilleurs héros).
  const top = s.heroes.map((h) => heroPower(s, h.uid)).sort((a, b) => b - a).slice(0, 3);
  const ref = top.length ? top.reduce((a, b) => a + b, 0) / top.length : 1000;
  const places = [...PLACES].sort(() => r() - 0.5).slice(0, EXPEDITION_SLOTS);
  return places.map((p, i) => {
    const d = Math.min(DURATIONS.length - 1, i === 0 ? 0 : Math.floor(r() * DURATIONS.length));
    const size = d === 0 ? 1 : 1 + Math.floor(r() * 3);
    const kind = pick(['affinity', 'role', 'faction'] as const);
    const id = kind === 'affinity' ? pick(Object.keys(AFFINITIES)) : kind === 'role' ? pick(Object.keys(ROLES)) : pick(Object.keys(FACTIONS));
    const base: Reward = {};
    for (const [k, v] of Object.entries(p.focus)) base[k as keyof Reward] = (v as number) * DUR_MULT[d] * (0.8 + size * 0.2);
    return { id: `${day}-${i}`, place: p.place, region: p.region, art: p.art, minutes: DURATIONS[d], size, cond: { kind, id }, reqPower: Math.round(ref * size * (0.75 + d * 0.08)), base };
  });
}

/** Met à jour les offres du jour (les expéditions en cours continuent). */
export function refreshExpeditions(s: SaveData, now: number): ExpeditionState {
  const day = dayKey(now);
  const ex = (s.expeditions ??= { day: '', offers: [], runs: [], done: [] });
  if (ex.day !== day) { ex.day = day; ex.offers = generateOffers(s, day); ex.done = []; }
  return ex;
}

export function condLabel(c: ExpeditionOffer['cond']): string {
  if (c.kind === 'affinity') return AFFINITIES[c.id as AffinityId].name;
  if (c.kind === 'role') return ROLES[c.id as RoleId].name;
  return FACTIONS[c.id as FactionId].short;
}
export function condMet(c: ExpeditionOffer['cond'], heroIds: string[]): boolean {
  return heroIds.some((id) => { const d = HERO_BY_ID[id]; return c.kind === 'affinity' ? d.affinity === c.id : c.kind === 'role' ? d.role === c.id : d.faction === c.id; });
}

/** Butin estimé pour une équipe : condition +30 %, puissance ×0,6 à ×1,3. */
export function expeditionLoot(s: SaveData, o: ExpeditionOffer, heroUids: string[]): { reward: Reward; ratio: number; bonus: boolean } {
  const power = heroUids.reduce((a, u) => a + heroPower(s, u), 0);
  const ratio = Math.max(0.6, Math.min(1.3, power / Math.max(1, o.reqPower)));
  const bonus = condMet(o.cond, heroUids.map((u) => s.heroes.find((h) => h.uid === u)!.heroId));
  const reward: Reward = {};
  const ev = eventBonus(s.time.highWater, 'expedition');
  for (const [k, v] of Object.entries(cleanReward(o.base))) {
    const n = (v as number) * ratio * (bonus ? 1.3 : 1) * ev;
    const whole = Math.floor(n);
    // Partie décimale tirée au sort de façon déterministe (les petites ressources rares tombent parfois).
    const frac = n - whole;
    const extra = (hash(o.id + k + heroUids.join()) % 1000) / 1000 < frac ? 1 : 0;
    if (whole + extra > 0) reward[k as keyof Reward] = whole + extra;
  }
  return { reward, ratio, bonus };
}

export const busyHeroes = (s: SaveData) => new Set((s.expeditions?.runs ?? []).flatMap((r) => r.heroUids));

export function startExpedition(s: SaveData, offerId: string, heroUids: string[], now: number): { ok: boolean; reason?: string } {
  const ex = refreshExpeditions(s, now);
  const o = ex.offers.find((x) => x.id === offerId);
  if (!o) return { ok: false, reason: 'Expédition introuvable.' };
  if (ex.done.includes(offerId) || ex.runs.some((r) => r.offerId === offerId)) return { ok: false, reason: 'Expédition déjà lancée aujourd’hui.' };
  if (heroUids.length !== o.size) return { ok: false, reason: `Choisis ${o.size} héros.` };
  const busy = busyHeroes(s);
  if (heroUids.some((u) => busy.has(u) || !s.heroes.some((h) => h.uid === u))) return { ok: false, reason: 'Un héros est déjà en expédition.' };
  ex.runs.push({ offerId, heroUids: [...heroUids], startAt: now, endsAt: now + o.minutes * 60_000, offer: o });
  return { ok: true };
}

export function recallExpedition(s: SaveData, offerId: string) {
  const ex = s.expeditions; if (!ex) return;
  ex.runs = ex.runs.filter((r) => r.offerId !== offerId);
}

export function claimExpedition(s: SaveData, offerId: string, now: number): { ok: boolean; reward?: Reward; reason?: string } {
  const ex = s.expeditions; if (!ex) return { ok: false };
  const run = ex.runs.find((r) => r.offerId === offerId);
  if (!run) return { ok: false, reason: 'Aucune expédition.' };
  if (now < run.endsAt) return { ok: false, reason: 'Pas encore de retour.' };
  const { reward } = expeditionLoot(s, run.offer, run.heroUids);
  applyReward(s, reward);
  ex.runs = ex.runs.filter((r) => r !== run);
  if (!ex.done.includes(offerId) && ex.offers.some((o) => o.id === offerId)) ex.done.push(offerId);
  track(s, 'expedition');
  return { ok: true, reward };
}

export const finishedExpeditions = (s: SaveData, now: number) => (s.expeditions?.runs ?? []).filter((r) => now >= r.endsAt).length;
