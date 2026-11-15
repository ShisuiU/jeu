import type { SaveData } from '../save/schema';
import { heroTotalStats } from './heroStats';
import { maxLevelForRank, powerOf } from './stats';

// Photo d'un héros avant / après une amélioration (cérémonie de progression, v1.107.0).

/** État d'un héros à un instant (avant / après l'amélioration). */
export interface HeroSnap { level: number; cap: number; rank: number; ascension: number; awaken: number; hp: number; atk: number; def: number; spd: number; acc: number; res: number; power: number }

export function snapHero(s: SaveData, uid: string): HeroSnap | null {
  const h = s.heroes.find((x) => x.uid === uid);
  if (!h) return null;
  const t = heroTotalStats(s, h).total;
  return { level: h.level, cap: maxLevelForRank(h.rank), rank: h.rank, ascension: h.ascension, awaken: h.awaken, hp: t.hp, atk: t.atk, def: t.def, spd: t.spd, acc: t.acc, res: t.res, power: powerOf(t) };
}
