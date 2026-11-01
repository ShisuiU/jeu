import { BALANCE } from '../data/balance';
import { HERO_BY_ID, STARTER_HEROES } from '../data/heroes';
import { RARITIES } from '../data/rarities';
import type { ResourceId } from '../data/resources';
import { RESOURCE_LIST } from '../data/resources';
import { uid } from '../core/ids';
import type { TimeState } from '../core/time';
import type { EnergyState } from '../game/energy';

/** Version actuelle du format de sauvegarde. Toute modification de structure ⇒ +1 et une migration. */
export const SAVE_VERSION = 1;

export interface HeroInstance {
  uid: string;
  heroId: string;
  level: number;
  xp: number;
  rank: number;
  ascension: number;
  awaken: number;
  skillLevels: Record<string, number>;
  equipment: Partial<Record<string, string>>; // slot → uid d'équipement (phase 3)
  locked: boolean;
  obtainedAt: number;
}

export interface TeamPreset {
  id: string;
  name: string;
  slots: (string | null)[]; // uid de héros, 5 emplacements (position = formation)
  leader: string | null;
}

export interface Settings {
  sound: boolean;
  volume: number; // 0..1
  reducedMotion: boolean;
  battleSpeed: 1 | 2 | 3;
  autoBattleDefault: boolean;
}

export interface SaveData {
  version: number;
  saveId: string;
  createdAt: number;
  updatedAt: number;
  revision: number;
  profile: { name: string; level: number; xp: number; avatarHeroId: string };
  resources: Record<ResourceId, number>;
  heroFragments: Record<string, number>;
  energy: EnergyState;
  time: TimeState;
  heroes: HeroInstance[];
  teams: TeamPreset[];
  activeTeamId: string;
  daily: { lastLoginDay: string | null; cycleIndex: number; totalLogins: number };
  progress: {
    campaign: Record<string, { stars: number; clears: number }>;
    dungeons: Record<string, { bestFloor: number }>;
    tower: { floor: number };
  };
  stats: { battlesWon: number; battlesLost: number; summons: number };
  settings: Settings;
  flags: Record<string, boolean>;
}

export function createHeroInstance(heroId: string, now: number): HeroInstance {
  const def = HERO_BY_ID[heroId];
  if (!def) throw new Error(`Héros inconnu : ${heroId}`);
  return {
    uid: uid('h_'),
    heroId,
    level: 1,
    xp: 0,
    rank: RARITIES[def.rarity].startRank,
    ascension: 0,
    awaken: 0,
    skillLevels: Object.fromEntries(def.skills.map((s) => [s.id, 1])),
    equipment: {},
    locked: false,
    obtainedAt: now,
  };
}

export function emptyResources(): Record<ResourceId, number> {
  return Object.fromEntries(RESOURCE_LIST.map((r) => [r.id, 0])) as Record<ResourceId, number>;
}

export function createNewSave(now: number = Date.now()): SaveData {
  const heroes = STARTER_HEROES.map((id) => createHeroInstance(id, now));
  const resources = emptyResources();
  for (const [k, v] of Object.entries(BALANCE.starter)) resources[k as ResourceId] = v;
  const teamId = 't_main';
  return {
    version: SAVE_VERSION,
    saveId: uid('s_'),
    createdAt: now,
    updatedAt: now,
    revision: 0,
    profile: { name: 'Héritier', level: 1, xp: 0, avatarHeroId: STARTER_HEROES[0] },
    resources,
    heroFragments: {},
    energy: { current: BALANCE.energy.max, lastTick: now },
    time: { highWater: now, lastSeen: now, rollbackCount: 0 },
    heroes,
    teams: [
      { id: teamId, name: 'Équipe principale', slots: [...heroes.map((h) => h.uid), null], leader: heroes[0].uid },
      { id: 't_2', name: 'Équipe 2', slots: [null, null, null, null, null], leader: null },
      { id: 't_3', name: 'Équipe 3', slots: [null, null, null, null, null], leader: null },
    ],
    activeTeamId: teamId,
    daily: { lastLoginDay: null, cycleIndex: 0, totalLogins: 0 },
    progress: { campaign: {}, dungeons: {}, tower: { floor: 0 } },
    stats: { battlesWon: 0, battlesLost: 0, summons: 0 },
    settings: { sound: true, volume: 0.6, reducedMotion: false, battleSpeed: 1, autoBattleDefault: false },
    flags: {},
  };
}
