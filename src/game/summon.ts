import { BANNER_BY_ID, DUPLICATE_FRAGMENTS, type BannerDef } from '../data/summons';
import { HEROES, HERO_BY_ID } from '../data/heroes';
import { RARITIES } from '../data/rarities';
import type { RarityId } from '../data/types';
import { createHeroInstance, type SaveData } from '../save/schema';
import { pickWeighted, type Rand } from './gear';
import { track } from './missions';
import { bannerAvailable } from './events';

export interface SummonResult { heroId: string; rarity: RarityId; duplicate: boolean; fragments: number; guaranteed: boolean }

const ord = (r: RarityId) => RARITIES[r].order;

function ratesAtLeast(b: BannerDef, min: RarityId): [RarityId, number][] {
  return (Object.entries(b.rates) as [RarityId, number][]).filter(([r]) => ord(r) >= ord(min));
}

export function rollRarity(r: Rand, b: BannerDef, pityCount: number): { rarity: RarityId; guaranteed: boolean } {
  if (b.pity && pityCount + 1 >= b.pity.every) return { rarity: pickWeighted(r, ratesAtLeast(b, b.pity.rarity)), guaranteed: true };
  return { rarity: pickWeighted(r, Object.entries(b.rates) as [RarityId, number][]), guaranteed: false };
}

export function pickHero(r: Rand, rarity: RarityId, b: BannerDef): string {
  if (b.featured && HERO_BY_ID[b.featured.heroId]?.rarity === rarity && r() < b.featured.share) return b.featured.heroId;
  const pool = HEROES.filter((h) => h.rarity === rarity);
  return pool[Math.floor(r() * pool.length)].id;
}

export function canAfford(s: SaveData, bannerId: string, count: number): boolean {
  const b = BANNER_BY_ID[bannerId];
  return !!b && s.resources[b.cost.resource] >= b.cost.amount * count;
}

/** Invoque `count` héros (mutation). Les héros déjà possédés deviennent des fragments. */
export function summon(s: SaveData, bannerId: string, count: 1 | 10, r: Rand, now: number): { ok: boolean; reason?: string; results: SummonResult[] } {
  const b = BANNER_BY_ID[bannerId];
  if (!b) return { ok: false, reason: 'Invocation inconnue.', results: [] };
  if (!bannerAvailable(b.id, s.time.highWater)) return { ok: false, reason: 'Cette invocation n’est pas ouverte actuellement.', results: [] };
  if (!canAfford(s, bannerId, count)) return { ok: false, reason: 'Ressources insuffisantes.', results: [] };
  s.resources[b.cost.resource] -= b.cost.amount * count;

  const rolls: { rarity: RarityId; guaranteed: boolean }[] = [];
  let pity = s.summons.pity[b.id] ?? 0;
  for (let i = 0; i < count; i++) {
    let roll = rollRarity(r, b, pity);
    // Garantie de l'invocation ×10 sur le dernier tirage.
    if (count === 10 && i === 9 && b.multiGuarantee && !rolls.some((x) => ord(x.rarity) >= ord(b.multiGuarantee!)) && ord(roll.rarity) < ord(b.multiGuarantee)) {
      roll = { rarity: pickWeighted(r, ratesAtLeast(b, b.multiGuarantee)), guaranteed: true };
    }
    if (b.pity && ord(roll.rarity) >= ord(b.pity.rarity)) pity = 0; else pity += 1;
    rolls.push(roll);
  }
  s.summons.pity[b.id] = pity;

  const results: SummonResult[] = rolls.map(({ rarity, guaranteed }) => {
    const heroId = pickHero(r, rarity, b);
    const owned = s.heroes.some((h) => h.heroId === heroId);
    let fragments = 0;
    if (owned) {
      fragments = DUPLICATE_FRAGMENTS[rarity];
      s.heroFragments[heroId] = (s.heroFragments[heroId] ?? 0) + fragments;
    } else {
      s.heroes.push(createHeroInstance(heroId, now));
    }
    s.summons.history.unshift({ heroId, banner: b.id, at: now, duplicate: owned });
    return { heroId, rarity, duplicate: owned, fragments, guaranteed };
  });
  s.summons.history = s.summons.history.slice(0, 50);
  s.summons.total += count;
  s.stats.summons += count;
  track(s, 'summon', count);
  return { ok: true, results };
}

/** Obtient un héros non possédé en dépensant ses fragments. */
export function summonWithFragments(s: SaveData, heroId: string, now: number): boolean {
  const d = HERO_BY_ID[heroId];
  if (!d || s.heroes.some((h) => h.heroId === heroId)) return false;
  const need = RARITIES[d.rarity].fragmentsToSummon;
  if ((s.heroFragments[heroId] ?? 0) < need) return false;
  s.heroFragments[heroId] -= need;
  s.heroes.push(createHeroInstance(heroId, now));
  return true;
}
