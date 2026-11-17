import { BANNER_BY_ID, type BannerDef } from '../data/summons';
import { HEROES, HERO_BY_ID } from '../data/heroes';
import { RARITIES } from '../data/rarities';
import type { RarityId } from '../data/types';
import { createHeroInstance, type SaveData } from '../save/schema';
import { pickWeighted, type Rand } from './gear';
import { track } from './missions';
import { bannerAvailable } from './events';
import { weekKey } from '../core/time';
import { addCopy } from './copies';

/** `duplicate` : héros déjà possédé, transformé en copie (doublon). */
export interface SummonResult { heroId: string; rarity: RarityId; duplicate: boolean; guaranteed: boolean }

const ord = (r: RarityId) => RARITIES[r].order;

function ratesAtLeast(b: BannerDef, min: RarityId): [RarityId, number][] {
  return (Object.entries(b.rates) as [RarityId, number][]).filter(([r]) => ord(r) >= ord(min));
}

export function rollRarity(r: Rand, b: BannerDef, pityCount: number): { rarity: RarityId; guaranteed: boolean } {
  if (b.pity && pityCount + 1 >= b.pity.every) return { rarity: pickWeighted(r, ratesAtLeast(b, b.pity.rarity)), guaranteed: true };
  return { rarity: pickWeighted(r, Object.entries(b.rates) as [RarityId, number][]), guaranteed: false };
}

/** Héros en vedette d'une bannière à la date `now` : fixe, ou un nouveau chaque semaine (renouvellement du lundi) si la bannière a une rotation. */
export function featuredHero(b: BannerDef, now: number): string | undefined {
  const f = b.featured;
  if (!f) return undefined;
  const list = (f.rotation ?? []).filter((id) => HERO_BY_ID[id]);
  if (!list.length) return f.heroId;
  const monday = new Date(`${weekKey(now)}T12:00:00`).getTime(); // midi : à l'abri des changements d'heure
  const week = Math.round(monday / (7 * 86_400_000));
  return list[((week % list.length) + list.length) % list.length];
}

export function pickHero(r: Rand, rarity: RarityId, b: BannerDef, now: number = Date.now()): string {
  const star = featuredHero(b, now);
  if (b.featured && star && HERO_BY_ID[star]?.rarity === rarity && r() < b.featured.share) return star;
  // Les héros exclusifs (événements) ne sortent jamais à l'invocation.
  const pool = HEROES.filter((h) => h.rarity === rarity && !h.exclusive);
  return pool[Math.floor(r() * pool.length)].id;
}

export function canAfford(s: SaveData, bannerId: string, count: number): boolean {
  const b = BANNER_BY_ID[bannerId];
  return !!b && s.resources[b.cost.resource] >= b.cost.amount * count;
}

/** Invoque `count` héros (mutation). Les héros déjà possédés deviennent des copies (doublons). */
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
    const heroId = pickHero(r, rarity, b, now);
    const owned = s.heroes.some((h) => h.heroId === heroId);
    if (owned) addCopy(s, heroId);
    else {
      s.heroes.push(createHeroInstance(heroId, now));
    }
    s.summons.history.unshift({ heroId, banner: b.id, at: now, duplicate: owned });
    return { heroId, rarity, duplicate: owned, guaranteed };
  });
  s.summons.history = s.summons.history.slice(0, 50);
  s.summons.total += count;
  s.stats.summons += count;
  track(s, 'summon', count);
  return { ok: true, results };
}

