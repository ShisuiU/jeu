import { MARKET_POOL, MARKET_REFRESH_COSTS, MARKET_SLOTS, MARKET_BY_ID, type MarketPrice } from '../data/market';
import { GEAR_INVENTORY_CAP } from '../data/equipment';
import type { Reward } from '../data/resources';
import type { GearItem, SaveData } from '../save/schema';
import { dayKey } from '../core/time';
import { applyReward } from './rewards';
import { campaignStars, seededRand, generateGear, type Rand } from './gear';
import { currentChapter } from './modes';

export interface MarketOffer { id: string; reward?: Reward; gear?: GearItem; price: MarketPrice; bought: boolean }
export interface MarketState { day: string; refreshes: number; offers: MarketOffer[] }

const hash = (str: string) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/** Tire les offres du jour (sans doublon), déterministe pour un joueur, un jour et un renouvellement donnés. */
export function rollOffers(s: SaveData, day: string, refresh: number, now: number): MarketOffer[] {
  const r: Rand = seededRand(hash(`${s.createdAt}|${day}|${refresh}`));
  const chap = currentChapter(s);
  let pool = MARKET_POOL.filter((o) => (o.minChapter ?? 1) <= chap);
  const out: MarketOffer[] = [];
  while (out.length < MARKET_SLOTS && pool.length) {
    const total = pool.reduce((n, o) => n + o.weight, 0);
    let x = r() * total;
    const def = pool.find((o) => (x -= o.weight) < 0) ?? pool[pool.length - 1];
    pool = pool.filter((o) => o !== def);
    const gear = def.gear ? { ...generateGear(r, def.gear, now, undefined, undefined, Math.min(6, campaignStars(r, chap, true))), heroUid: null } : undefined;
    out.push({ id: def.id, reward: def.reward, gear, price: def.price, bought: false });
  }
  return out;
}

/** Le marché du jour (créé ou renouvelé au changement de jour). Mutation. */
export function ensureMarket(s: SaveData, now: number): MarketState {
  const day = dayKey(now);
  const cur = s.shop.market;
  if (cur && cur.day === day && cur.offers.length) return cur;
  s.shop.market = { day, refreshes: 0, offers: rollOffers(s, day, 0, now) };
  return s.shop.market;
}

export const refreshCost = (m: MarketState) => MARKET_REFRESH_COSTS[m.refreshes] ?? null;

export function refreshMarket(s: SaveData, now: number): { ok: boolean; reason?: string } {
  const m = ensureMarket(s, now);
  const cost = refreshCost(m);
  if (cost == null) return { ok: false, reason: 'Plus de renouvellement aujourd’hui.' };
  if (s.resources.crystals < cost) return { ok: false, reason: 'Cristaux insuffisants.' };
  s.resources.crystals -= cost;
  m.refreshes += 1;
  m.offers = rollOffers(s, m.day, m.refreshes, now);
  return { ok: true };
}

export function buyOffer(s: SaveData, index: number, now: number): { ok: boolean; reason?: string } {
  const m = ensureMarket(s, now);
  const o = m.offers[index];
  if (!o || !MARKET_BY_ID[o.id]) return { ok: false, reason: 'Offre introuvable.' };
  if (o.bought) return { ok: false, reason: 'Déjà acheté.' };
  if (s.resources[o.price.resource] < o.price.amount) return { ok: false, reason: o.price.resource === 'gold' ? 'Or insuffisant.' : 'Cristaux insuffisants.' };
  if (o.gear && s.equipment.length >= GEAR_INVENTORY_CAP) return { ok: false, reason: 'Sac d’équipement plein : démantèle des objets à la Forge.' };
  s.resources[o.price.resource] -= o.price.amount;
  o.bought = true;
  if (o.reward) applyReward(s, o.reward);
  if (o.gear) s.equipment.push({ ...o.gear, heroUid: null });
  return { ok: true };
}
