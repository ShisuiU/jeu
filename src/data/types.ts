// Types centraux du contenu du jeu. Tout le contenu (héros, factions, ressources…) est piloté par les données :
// ajouter un héros = ajouter une entrée dans data/heroes.ts, sans toucher au moteur.

export type RarityId = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type RoleId = 'attacker' | 'defender' | 'support' | 'healer' | 'controller' | 'assassin';
export type AffinityId = 'solar' | 'lunar' | 'telluric' | 'void';
export type FactionId = 'valcrest' | 'prism' | 'ash' | 'sylvaran' | 'astral' | 'akkar';

export type StatId = 'hp' | 'atk' | 'def' | 'spd' | 'critRate' | 'critDmg' | 'acc' | 'res';
export type Stats = Record<StatId, number>;

export type StatusId =
  | 'poison' | 'burn' | 'freeze' | 'stun'
  | 'defDown' | 'atkDown' | 'atkUp' | 'defUp' | 'spdUp' | 'spdDown'
  | 'shield' | 'regen' | 'taunt' | 'revive';

export type TargetId = 'enemy' | 'allEnemies' | 'self' | 'ally' | 'allAllies' | 'lowestAlly' | 'randomEnemies';

/** Effet élémentaire d'une compétence. Le moteur de combat (phase 2) interprète ces effets. */
export type SkillEffect =
  | { kind: 'damage'; target: TargetId; mult: number; scaling?: 'atk' | 'def' | 'hp'; hits?: number; ignoreDefPct?: number; lifestealPct?: number }
  | { kind: 'status'; target: TargetId; status: StatusId; chance: number; turns: number; value?: number }
  | { kind: 'heal'; target: TargetId; pctMaxHp: number }
  | { kind: 'shield'; target: TargetId; pctMaxHp: number; turns: number }
  | { kind: 'cleanse'; target: TargetId }
  | { kind: 'turnMeter'; target: TargetId; delta: number }
  | { kind: 'revive'; target: TargetId; pctMaxHp: number };

export interface SkillDef {
  id: string;
  name: string;
  slot: 'basic' | 'special' | 'ultimate' | 'passive';
  cooldown: number; // en tours, 0 = utilisable à chaque tour
  description: string;
  effects: SkillEffect[];
  /** Bonus par niveau de compétence (livres de compétences) : descriptions courtes. */
  upgrades: string[];
  vfx?: string; // identifiant d'effet visuel (phase 2/5)
}

export interface HeroDef {
  id: string;
  name: string;
  title: string;
  faction: FactionId;
  rarity: RarityId;
  role: RoleId;
  affinity: AffinityId;
  /** Multiplicateurs appliqués au gabarit du rôle (1 = neutre). */
  bias?: Partial<Record<StatId, number>>;
  baseSpd: number;
  skills: SkillDef[];
  leaderSkill?: { description: string; stat: StatId; pct: number; scope: 'all' | FactionId | AffinityId };
  lore: string;
  quote: string;
  /** Description visuelle : sert de cahier des charges pour les illustrations et de prompt de génération. */
  look: string;
  palette: [string, string, string];
}

export interface FactionDef {
  id: FactionId;
  name: string;
  short: string;
  motto: string;
  description: string;
  ambiance: string;
  colors: { primary: string; secondary: string; glow: string };
  synergy: string;
}
