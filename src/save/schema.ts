import type { ExpeditionState } from '../game/expeditions';
import { BALANCE } from '../data/balance';
import { HERO_BY_ID, STARTER_HEROES } from '../data/heroes';
import { RARITIES } from '../data/rarities';
import type { ResourceId } from '../data/resources';
import { RESOURCE_LIST } from '../data/resources';
import { uid } from '../core/ids';
import type { TimeState } from '../core/time';
import type { EnergyState } from '../game/energy';
import type { GearRarity, GearSlot, GearStat, SetId } from '../data/equipment';

/** Version actuelle du format de sauvegarde. Toute modification de structure ⇒ +1 et une migration. */
export const SAVE_VERSION = 6;

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
  /** Maîtrises apprises (identifiants), voir data/masteries.ts. */
  masteries?: string[];
}

export interface GearItem {
  uid: string;
  slot: GearSlot;
  rarity: GearRarity;
  /** Étoiles (1 à 6) : force de la statistique principale. */
  stars: number;
  set: SetId;
  level: number;
  main: GearStat;
  subs: { stat: GearStat; value: number; rolls: number }[];
  heroUid: string | null;
  locked: boolean;
  obtainedAt: number;
}

export interface SummonState {
  /** Invocations depuis la dernière obtention garantie, par bannière. */
  pity: Record<string, number>;
  total: number;
  history: { heroId: string; banner: string; at: number; duplicate: boolean }[];
}

export interface MissionProgress { counters: Record<string, number>; claimed: string[]; bonus: boolean }

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
  music: boolean;
  musicVolume: number;
  /** Visuel : « v2 » (grimoire, par défaut) ou « classic » (l'ancien, inchangé). */
  /** Apparaître dans les classements en ligne (compte requis). */
  showInRanks: boolean;
}

export interface SaveData {
  version: number;
  saveId: string;
  createdAt: number;
  updatedAt: number;
  revision: number;
  profile: { name: string; level: number; xp: number; avatarHeroId: string };
  resources: Record<ResourceId, number>;
  /** Doublons d'invocation : copies d'un héros possédé, à utiliser (éveil, lien de famille, lien d'affinité). */
  heroCopies: Record<string, number>;
  /** Niveaux des liens (0 à 10) : chaque niveau donne +1 % PV, ATQ et DÉF aux héros concernés. */
  bonds: { faction: Record<string, number>; affinity: Record<string, number> };
  energy: EnergyState;
  time: TimeState;
  heroes: HeroInstance[];
  equipment: GearItem[];
  summons: SummonState;
  teams: TeamPreset[];
  activeTeamId: string;
  daily: { lastLoginDay: string | null; cycleIndex: number; totalLogins: number };
  progress: {
    campaign: Record<string, { stars: number; clears: number }>;
    dungeons: Record<string, { bestFloor: number; best?: Partial<Record<'hard' | 'expert' | 'nightmare', number>> }>;
    tower: { floor: number };
  };
  stats: { battlesWon: number; battlesLost: number; summons: number };
  settings: Settings;
  flags: Record<string, boolean>;
  /** Réinitialisations périodiques (clés de jour/semaine de l'horloge de confiance). */
  resets: { day: string; week: string };
  missions: { daily: MissionProgress; weekly: MissionProgress };
  achievements: string[];
  arena: { rating: number; wins: number; losses: number; ticketsUsed: number; opponents: ArenaOpponent[];
    /** Actualisations des adversaires aujourd'hui (la première est gratuite). */
    refreshes?: number;
    /** Saison d'Arène en cours (clé de semaine), combats joués cette saison, récompense de la saison passée à récupérer. */
    season?: string; seasonFights?: number; seasonReward?: { season: string; tier: string; rating: number; reward: Partial<Record<string, number>> } | null;
    /** Équipe publiée en défense (par défaut : l'équipe active). */ defenseTeamId: string;
    /** Journal de défense déjà compté dans le classement (date du dernier combat appliqué). */ logSeen: number;
    log: ArenaLogEntry[]; revenged: string[] };
  worldBoss: { keysUsed: number; best: Record<string, number> };
  events: Record<string, {
    counters: Record<string, number>; claimed: string[]; challengeDone: boolean;
    /** Événement de la semaine : combats d'épreuve gagnés, paliers réclamés, chapitre de référence. */
    trials?: number; tiers?: number[]; chap?: number;
    /** Événement de connexion : jours de jeu réclamés (clés de jour). */
    login?: string[];
  }>;
  /** Clan : identifiant (vide = aucune), essais du boss du jour, dégâts pas encore envoyés, paliers récupérés. */
  guild: { id: string; name: string; day: string; tries: number; week: string; pending: number; claimed: number[] };
  /** Joueurs bloqués (leurs messages et leurs équipes ne s'affichent plus). */
  blocked: { uid: string; name: string }[];
  /** Amis : cadeaux reçus aujourd'hui, amis dont le héros a déjà été emprunté aujourd'hui. */
  friends: { day: string; claims: number; borrowed: string[] };
  /** Camp des Héritiers : début de l'accumulation du butin d'absence. */
  camp: { since: number };
  shop: { energyRefills: number; market?: { day: string; refreshes: number; offers: { id: string; reward?: Partial<Record<string, number>>; gear?: GearItem; price: { resource: 'gold' | 'crystals'; amount: number }; bought: boolean }[] } };
  /** Expéditions (héros envoyés en mission, retour en temps réel). */
  expeditions: ExpeditionState;
  /** Roue quotidienne (v1.68.18) : jour du dernier tour et case gagnée. */
  wheel?: { day: string; last: string };
  /** Série de combats en arrière-plan (v1.68.5) : en cours, ou résumé à fermer. */
  bgRun?: import('../game/background').BgRun | null;
}

export interface ArenaOpponent {
  id: string;
  name: string;
  /** Héros adverses. Pour un vrai joueur : son équipe complète (rangs, ascension, compétences, équipement). */
  heroes: { heroId: string; level: number; slot: number; rank?: number; ascension?: number; awaken?: number; skillLevels?: Record<string, number>; gear?: import('../game/gear').GearBonus }[];
  power: number;
  /** Équipe de défense d'un vrai joueur (son compte : uid). Sinon : Héritier imaginaire. */
  real?: boolean;
  uid?: string;
  avatar?: string;
  /** Vengeance : rejoue contre quelqu'un qui a battu ta défense. */
  revenge?: string;
}

/** Combat reçu par ta défense d'Arène (journal en ligne, copié sur l'appareil). */
export interface ArenaLogEntry { id: string; attacker: string; name: string; avatar: string; power: number; won: boolean; points: number; at: number }

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
    heroCopies: {},
    bonds: { faction: {}, affinity: {} },
    energy: { current: BALANCE.energy.max, lastTick: now },
    time: { highWater: now, lastSeen: now, rollbackCount: 0 },
    heroes,
    equipment: [],
    summons: { pity: {}, total: 0, history: [] },
    teams: [
      { id: teamId, name: 'Équipe principale', slots: [...heroes.map((h) => h.uid), null], leader: heroes[0].uid },
      { id: 't_2', name: 'Équipe 2', slots: [null, null, null, null, null], leader: null },
      { id: 't_3', name: 'Équipe 3', slots: [null, null, null, null, null], leader: null },
    ],
    activeTeamId: teamId,
    daily: { lastLoginDay: null, cycleIndex: 0, totalLogins: 0 },
    progress: { campaign: {}, dungeons: {}, tower: { floor: 0 } },
    stats: { battlesWon: 0, battlesLost: 0, summons: 0 },
    settings: { sound: true, volume: 0.6, reducedMotion: false, battleSpeed: 1, autoBattleDefault: false, music: true, musicVolume: 0.35, showInRanks: true },
    flags: {},
    resets: { day: '', week: '' },
    missions: { daily: { counters: {}, claimed: [], bonus: false }, weekly: { counters: {}, claimed: [], bonus: false } },
    achievements: [],
    arena: { rating: 1000, wins: 0, losses: 0, ticketsUsed: 0, opponents: [], defenseTeamId: '', logSeen: 0, log: [], revenged: [] },
    worldBoss: { keysUsed: 0, best: {} },
    events: {},
    guild: { id: '', name: '', day: '', tries: 0, week: '', pending: 0, claimed: [] },
    blocked: [],
    friends: { day: '', claims: 0, borrowed: [] },
    camp: { since: now },
    shop: { energyRefills: 0 },
    expeditions: { day: '', offers: [], runs: [], done: [] },
  };
}
