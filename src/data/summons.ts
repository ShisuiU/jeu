import type { RarityId } from './types';
import type { ResourceId } from './resources';

// INVOCATIONS — taux affichés au joueur et garanties (« pitié ») pilotées par les données.
// Un héros déjà possédé est converti en fragments (voir DUPLICATE_FRAGMENTS).

export interface BannerDef {
  id: string;
  name: string;
  subtitle: string;
  cost: { resource: ResourceId; amount: number };
  rates: Partial<Record<RarityId, number>>; // en %
  /** Garantie : au plus tard toutes les `every` invocations, un héros de rareté >= `rarity`. */
  pity?: { rarity: RarityId; every: number };
  /** Une invocation ×10 contient au moins un héros de cette rareté. */
  multiGuarantee?: RarityId;
  /** Héros mis en avant (bannière d'événement) : part des tirages de sa rareté qui lui reviennent. */
  featured?: { heroId: string; share: number };
  color: string;
  glow: string;
}

export const BANNERS: BannerDef[] = [
  {
    id: 'standard', name: 'Invocation standard', subtitle: 'Éclats ternes : héros Communs à Rares.',
    cost: { resource: 'shardDim', amount: 1 },
    rates: { common: 60, uncommon: 32, rare: 8 },
    color: '#8d949c', glow: '#c9ced3',
  },
  {
    id: 'aeon', name: 'Invocation rare', subtitle: 'Éclats d’Aeon : Rare garanti, Légendaire possible.',
    cost: { resource: 'shardAeon', amount: 1 },
    rates: { rare: 80.5, epic: 17, legendary: 2.3, mythic: 0.2 },
    pity: { rarity: 'legendary', every: 60 },
    multiGuarantee: 'epic',
    color: '#3d8bff', glow: '#8ab8ff',
  },
  {
    id: 'epic', name: 'Invocation épique', subtitle: 'Cristaux d’Aeon : Épique garanti.',
    cost: { resource: 'crystals', amount: 300 },
    rates: { epic: 86, legendary: 12.5, mythic: 1.5 },
    pity: { rarity: 'legendary', every: 20 },
    color: '#a64dff', glow: '#cf9dff',
  },
  {
    id: 'primal', name: 'Invocation légendaire', subtitle: 'Éclats primordiaux : Légendaire garanti.',
    cost: { resource: 'shardPrimal', amount: 1 },
    rates: { legendary: 92, mythic: 8 },
    pity: { rarity: 'mythic', every: 12 },
    color: '#ffae2b', glow: '#ffd48a',
  },
  {
    id: 'event_ash', name: 'Faille de Cendre', subtitle: 'Événement : Mère Sulfura plus fréquente.',
    cost: { resource: 'shardEvent', amount: 1 },
    rates: { rare: 70, epic: 22, legendary: 7, mythic: 1 },
    pity: { rarity: 'legendary', every: 40 },
    featured: { heroId: 'sulfura', share: 0.5 },
    color: '#ff3d6e', glow: '#ff9bb5',
  },
];

export const BANNER_BY_ID: Record<string, BannerDef> = Object.fromEntries(BANNERS.map((b) => [b.id, b]));

/** Fragments reçus quand on invoque un héros déjà possédé. */
export const DUPLICATE_FRAGMENTS: Record<RarityId, number> = { common: 4, uncommon: 6, rare: 10, epic: 16, legendary: 25, mythic: 40 };

/** Cadeau unique de lancement pour découvrir la bannière d'événement. */
export const EVENT_WELCOME_GIFT = { flag: 'gift_event_ash', reward: { shardEvent: 10 } } as const;
