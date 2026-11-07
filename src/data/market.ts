import type { Reward } from './resources';
import type { GearRarity } from './equipment';

// MARCHÉ — 6 offres qui changent chaque jour (et à la demande, contre quelques cristaux).
// Surtout payées en or (l'or s'accumule vite) ; quelques offres rares en cristaux.

export type MarketPrice = { resource: 'gold' | 'crystals'; amount: number };
export interface MarketOfferDef {
  id: string;
  /** Ressources reçues, ou un équipement de cette rareté (généré à l'apparition de l'offre). */
  reward?: Reward;
  gear?: GearRarity;
  price: MarketPrice;
  /** Fréquence relative d'apparition. */
  weight: number;
  /** Chapitre de campagne atteint minimum pour voir l'offre. */
  minChapter?: number;
}

export const MARKET_SLOTS = 6;
/** Prix (cristaux) des renouvellements manuels, par jour. */
export const MARKET_REFRESH_COSTS = [20, 40, 80];

export const MARKET_POOL: MarketOfferDef[] = [
  { id: 'dim1', reward: { shardDim: 1 }, price: { resource: 'gold', amount: 12000 }, weight: 6 },
  { id: 'dim3', reward: { shardDim: 3 }, price: { resource: 'gold', amount: 33000 }, weight: 3 },
  { id: 'aeon_c', reward: { shardAeon: 1 }, price: { resource: 'crystals', amount: 180 }, weight: 3 },
  { id: 'aeon_g', reward: { shardAeon: 1 }, price: { resource: 'gold', amount: 150000 }, weight: 1, minChapter: 3 },
  { id: 'elixir', reward: { xpElixir: 6 }, price: { resource: 'gold', amount: 9000 }, weight: 6 },
  { id: 'tome', reward: { skillTome: 1 }, price: { resource: 'gold', amount: 22000 }, weight: 4 },
  { id: 'sigil', reward: { rankSigil: 1 }, price: { resource: 'gold', amount: 35000 }, weight: 3 },
  { id: 'pminor', reward: { potionMinor: 4 }, price: { resource: 'gold', amount: 12000 }, weight: 4 },
  { id: 'pgreater', reward: { potionGreater: 2 }, price: { resource: 'gold', amount: 30000 }, weight: 3, minChapter: 3 },
  { id: 'psupreme', reward: { potionSupreme: 1 }, price: { resource: 'gold', amount: 55000 }, weight: 2, minChapter: 5 },
  { id: 'ore', reward: { forgeOre: 40 }, price: { resource: 'gold', amount: 10000 }, weight: 5 },
  { id: 'essence', reward: { awakenEssence: 1 }, price: { resource: 'crystals', amount: 90 }, weight: 2, minChapter: 2 },
  { id: 'g_rare', gear: 'rare', price: { resource: 'gold', amount: 18000 }, weight: 4 },
  { id: 'g_epic', gear: 'epic', price: { resource: 'gold', amount: 45000 }, weight: 3, minChapter: 2 },
  { id: 'g_leg', gear: 'legendary', price: { resource: 'gold', amount: 110000 }, weight: 1, minChapter: 4 },
  { id: 'g_leg_c', gear: 'legendary', price: { resource: 'crystals', amount: 250 }, weight: 1, minChapter: 4 },
];

export const MARKET_BY_ID: Record<string, MarketOfferDef> = Object.fromEntries(MARKET_POOL.map((o) => [o.id, o]));
