import type { TrackKey } from '../data/missions';
import type { Route } from '../state/ui';
import type { SaveData } from '../save/schema';
import { isUnlocked, unlockText, type Feature } from './unlocks';

// « Y ALLER » — chaque objectif (mission, événement) mène directement à l'écran où on l'accomplit.
const GO: Partial<Record<TrackKey, { route: Route; feature?: Feature }>> = {
  battleWin: { route: { name: 'campaign' } },
  campaignWin: { route: { name: 'campaign' } },
  energySpent: { route: { name: 'campaign' } },
  dungeonWin: { route: { name: 'dungeons' }, feature: 'dungeons' },
  towerWin: { route: { name: 'tower' }, feature: 'tower' },
  arenaFight: { route: { name: 'arena' }, feature: 'arena' },
  arenaWin: { route: { name: 'arena' }, feature: 'arena' },
  worldBoss: { route: { name: 'worldboss' }, feature: 'worldboss' },
  summon: { route: { name: 'summon' } },
  gearUpgrade: { route: { name: 'gear' } },
  heroUpgrade: { route: { name: 'sanctuary' } },
  challengeWin: { route: { name: 'events' }, feature: 'events' },
  expedition: { route: { name: 'expeditions' }, feature: 'expeditions' },
};

/** Destination d'un objectif : l'écran, ou la raison pour laquelle il est encore fermé. */
export function goFor(s: SaveData, key: TrackKey): { route: Route } | { locked: string } | null {
  const g = GO[key];
  if (!g) return null;
  if (g.feature && !isUnlocked(s, g.feature)) return { locked: unlockText(g.feature) };
  return { route: g.route };
}
