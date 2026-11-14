import type { AffinityId, FactionId, RoleId, SkillDef, Stats, StatusId } from '../../data/types';

export type Side = 'ally' | 'enemy';

export interface StatusInst {
  uid: number;
  status: StatusId;
  turns: number;
  value: number;
  sourceId: string;
  /** Numéro d'action lors de l'application : un effet posé pendant le tour de sa cible ne décompte pas ce tour-là. */
  appliedAt: number;
}

export interface Unit {
  id: string;
  side: Side;
  /** 0-2 : première ligne, 3-4 : seconde ligne. */
  slot: number;
  kind: 'hero' | 'enemy';
  refId: string;
  heroUid?: string;
  name: string;
  level: number;
  affinity: AffinityId;
  role: RoleId;
  faction?: FactionId;
  isBoss: boolean;
  base: Stats;
  hp: number;
  tm: number;
  cooldowns: Record<string, number>;
  statuses: StatusInst[];
  skills: SkillDef[];
  skillLevels: Record<string, number>;
  alive: boolean;
  flags: Record<string, number>;
}

export type BattleEvent =
  | { kind: 'turn'; source: string }
  | { kind: 'skill'; source: string; skillId: string; name: string; targets: string[] }
  | { kind: 'damage'; source: string; target: string; amount: number; crit: boolean; strong: boolean; weak: boolean; absorbed: number; combo?: boolean }
  | { kind: 'dot'; target: string; amount: number; status: StatusId }
  | { kind: 'heal'; target: string; amount: number }
  | { kind: 'shield'; target: string; amount: number }
  | { kind: 'status'; target: string; status: StatusId; turns: number }
  | { kind: 'resist'; target: string; status?: StatusId; immune?: boolean }
  | { kind: 'cleanse'; target: string }
  | { kind: 'dispel'; target: string }
  | { kind: 'tm'; target: string; delta: number }
  | { kind: 'skip'; target: string; status: StatusId }
  | { kind: 'death'; target: string }
  | { kind: 'revive'; target: string }
  | { kind: 'undying'; target: string }
  | { kind: 'extraTurn'; target: string }
  | { kind: 'wave'; wave: number }
  | { kind: 'rage'; target: string }
  | { kind: 'fracture'; target: string }
  | { kind: 'phase'; target: string; act?: 3; power?: import('../../data/bossActs').Act3Power }
  | { kind: 'couture'; id: string; a: string; b: string }
  | { kind: 'carapace'; target: string; charges: number; broken?: boolean; reformed?: boolean }
  | { kind: 'lien'; power: LienPower };

/** Pouvoir du Lien : le joueur (le Lien) agit lui-même quand la jauge commune de l'équipe est pleine. */
export type LienPower = 'heal' | 'strike' | 'guard';
export const LIEN_MAX = 100;
/** Le Lien agit au plus deux fois par combat. */
export const LIEN_USES = 2;

export interface UnitSetup {
  kind: 'hero' | 'enemy';
  refId: string;
  slot: number;
  level: number;
  rank?: number;
  ascension?: number;
  awaken?: number;
  skillLevels?: Record<string, number>;
  heroUid?: string;
  /** Multiplicateurs spécifiques (boss, difficulté). */
  hpMult?: number;
  statMult?: number;
  /** Bonus d'équipement (héros). */
  gear?: import('../gear').GearBonus;
  /** PV de départ (fraction), pour les Failles où les PV sont conservés d'un combat à l'autre. */
  hpPct?: number;
}

export interface BattleState {
  rng: number;
  /** Couture d'époque (v1.94.0) : paire de héros d'époques différentes, déclenchée une fois au 3ᵉ tour de l'équipe. */
  couture?: { id: string; a: string; b: string; acts: number; done: boolean };
  units: Unit[];
  pendingWaves: UnitSetup[][];
  wave: number;
  totalWaves: number;
  actionCount: number;
  activeId: string | null;
  extraTurn: string | null;
  outcome: 'running' | 'won' | 'lost' | 'timeout';
  /** Nombre maximal d'actions (boss mondial). */
  turnLimit?: number;
  events: BattleEvent[];
  statusSeq: number;
  /** Synergies d'équipe actives (côté joueur). */
  synergy: { ash: boolean; sylvaran: boolean; astral: boolean; akkar: boolean };
  enemyLevelMult: number;
  /** Jauge du Lien (0 à LIEN_MAX ; −1 = désactivée) : se remplit à chaque action d'un héros et à chaque ennemi vaincu. */
  lien: number;
  /** Pouvoirs du Lien déjà utilisés dans ce combat. */
  lienUsed: number;
  /** Mécaniques de boss (Fureur, Carapace) : campagne, donjons, tour, arène — pas les boss à score (mondial, clan). */
  mechanics: boolean;
}

export interface Action {
  skillId: string;
  targetId?: string;
}

export const DEBUFFS: StatusId[] = ['poison', 'burn', 'freeze', 'stun', 'defDown', 'atkDown', 'spdDown', 'taunt'];
export const BUFFS: StatusId[] = ['atkUp', 'defUp', 'spdUp', 'shield', 'regen'];

export const STATUS_INFO: Record<StatusId, { name: string; short: string; color: string; debuff: boolean }> = {
  poison: { name: 'Poison', short: 'PSN', color: '#7bd84f', debuff: true },
  burn: { name: 'Brûlure', short: 'BRL', color: '#ff7a2f', debuff: true },
  freeze: { name: 'Gel', short: 'GEL', color: '#8fdcff', debuff: true },
  stun: { name: 'Étourdi', short: 'ÉTO', color: '#ffe14d', debuff: true },
  defDown: { name: 'DÉF réduite', short: 'DÉF▼', color: '#ff6b6b', debuff: true },
  atkDown: { name: 'ATQ réduite', short: 'ATQ▼', color: '#ff6b6b', debuff: true },
  spdDown: { name: 'VIT réduite', short: 'VIT▼', color: '#ff6b6b', debuff: true },
  taunt: { name: 'Provoqué', short: 'PRV', color: '#ff9b3d', debuff: true },
  atkUp: { name: 'ATQ augmentée', short: 'ATQ▲', color: '#6fe39a', debuff: false },
  defUp: { name: 'DÉF augmentée', short: 'DÉF▲', color: '#6fe39a', debuff: false },
  spdUp: { name: 'VIT augmentée', short: 'VIT▲', color: '#6fe39a', debuff: false },
  shield: { name: 'Bouclier', short: 'BCL', color: '#9fd0ff', debuff: false },
  regen: { name: 'Régénération', short: 'RÉG', color: '#7bd88f', debuff: false },
  revive: { name: 'Résurrection', short: 'RÉS', color: '#ffd36b', debuff: false },
};
