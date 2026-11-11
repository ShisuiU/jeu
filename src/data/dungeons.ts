import type { Reward } from './resources';
import { BALANCE } from './balance';
import { DIFFICULTIES, DIFFICULTY_ORDER, type DifficultyId, type WaveEnemy } from './campaign';
import type { GearRarity, SetId } from './equipment';

// DONJONS — 7 donjons de 15 étages : 4 d'équipement (un par famille d'ensembles, v1.71.0) et 3 de ressources. Chaque étage : vagues générées à partir d'un modèle, puis le gardien.
export interface DungeonDef {
  id: string;
  name: string;
  description: string;
  boss: string;
  minions: string[];
  /** Récompense par étage (multipliée selon l'étage). */
  reward: (floor: number) => Reward;
  /** Équipement garanti (donjon d'équipement) : table de rareté selon l'étage. */
  gear?: (floor: number) => [GearRarity, number][];
  /** Ensembles que ce donjon d'équipement peut donner (v1.71.0). */
  sets?: SetId[];
  /** Décor de combat (région). */
  region?: string;
  color: string;
  icon: 'forge' | 'flask' | 'potion' | 'book';
}

export const DUNGEON_FLOORS = 15;

/** Rareté de l'équipement des donjons d'équipement selon l'étage (meilleure avec la difficulté, voir DUNGEON_GEAR_BONUS). */
const GEAR_TABLE = (f: number): [GearRarity, number][] => [['uncommon', Math.max(0, 50 - f * 6)], ['rare', 40], ['epic', 6 + f * 4], ['legendary', f >= 6 ? f - 4 : 0], ['mythic', f >= 9 ? (f - 8) * 0.8 : 0]];

export const DUNGEONS: DungeonDef[] = [
  // ─── Donjons d'équipement (v1.71.0) : chacun donne un objet garanti à chaque victoire, dans SES ensembles. ───
  {
    id: 'warforge', name: 'Forge de Guerre', description: 'Équipement d’attaque : Fureur, Acuité, Massacre.', boss: 'war_smith', minions: ['ash_imp', 'chain_warden', 'pyre_priest'],
    reward: (f) => ({ forgeOre: 10 + f * 6, gold: 800 + f * 300 }), gear: GEAR_TABLE, sets: ['fury', 'keen', 'savage'], region: 'ash',
    color: '#ff6b3c', icon: 'forge',
  },
  {
    id: 'bastion', name: 'Bastion Englouti', description: 'Équipement de défense : Vigueur, Rempart, Résolution.', boss: 'drowned_bulwark', minions: ['tide_knight', 'drowned_sentinel', 'brine_siren'],
    reward: (f) => ({ forgeOre: 10 + f * 6, gold: 800 + f * 300 }), gear: GEAR_TABLE, sets: ['vigor', 'bulwark', 'resolve'], region: 'abyss',
    color: '#8fb6ff', icon: 'forge',
  },
  {
    id: 'gale', name: 'Galerie des Vents', description: 'Équipement de vitesse : Célérité, Élan, Concentration.', boss: 'storm_matriarch', minions: ['star_husk', 'fallen_seraph', 'rogue_drone'],
    reward: (f) => ({ forgeOre: 10 + f * 6, gold: 800 + f * 300 }), gear: GEAR_TABLE, sets: ['swift', 'momentum', 'focus'], region: 'astral',
    color: '#5fe0ff', icon: 'forge',
  },
  {
    id: 'briar', name: 'Jardin Vermeil', description: 'Équipement de survie : Sang-vif, Pérennité.', boss: 'briar_queen', minions: ['thorn_wisp', 'rot_treant', 'feral_stalker'],
    reward: (f) => ({ forgeOre: 10 + f * 6, gold: 800 + f * 300 }), gear: GEAR_TABLE, sets: ['leech', 'perennial'], region: 'sylvaran',
    color: '#ff4d7a', icon: 'forge',
  },
  {
    id: 'amber', name: 'Grotte d’Ambre', description: 'Élixirs d’expérience et or.', boss: 'amber_wyrm', minions: ['rift_hound', 'hollow_soldier', 'hollow_archer'],
    reward: (f) => ({ xpElixir: 3 + f * 2, gold: 2000 + f * 900 }),
    color: '#ffcf5a', icon: 'flask', region: 'akkar',
  },
  {
    id: 'alchemy', name: 'Laboratoire Brisé', description: 'Potions d’ascension.', boss: 'rogue_alchemist', minions: ['hollow_cantor', 'rift_hound', 'hollow_soldier'],
    reward: (f) => (f <= 3 ? { potionMinor: 2 + f * 2 } : f <= 7 ? { potionMinor: 4 + f, potionGreater: f - 2 } : { potionGreater: Math.min(f, 10), potionSupreme: f - 6 }),
    color: '#7fe7ff', icon: 'potion', region: 'prism',
  },
  {
    id: 'archive', name: 'Archives Effacées', description: 'Grimoires de compétence et sceaux de rang.', boss: 'mute_archivist', minions: ['hollow_cantor', 'hollow_knight', 'hollow_archer'],
    reward: (f) => ({ skillTome: 1 + Math.floor(f / 2), ...(f % 3 === 0 ? { rankSigil: 1 } : {}), ...(f >= 8 ? { awakenEssence: f >= 12 ? 2 : 1 } : {}) }),
    color: '#c7a0ff', icon: 'book', region: 'astral',
  },
];

export const DUNGEON_BY_ID: Record<string, DungeonDef> = Object.fromEntries(DUNGEONS.map((d) => [d.id, d]));

// DIFFICULTÉS (v1.68.9, revues en v1.70.1) — Normal, Difficile, Expert, Cauchemar. Une difficulté s'ouvre quand la
// précédente est TERMINÉE (étage 15), et elle reprend là où l'autre s'arrêtait : l'étage 1 en Difficile est déjà un peu
// plus dur que l'étage 15 en Normal, et ainsi de suite. Récompenses multipliées, meilleur équipement à la Forge.
export const DUNGEON_DIFF_OPEN = 15;
/** Étages « gagnés » pour la table d'équipement et les étoiles : plus la difficulté est haute, meilleur est l'objet. */
export const DUNGEON_GEAR_BONUS: Record<DifficultyId, number> = { normal: 0, hard: 3, expert: 6, nightmare: 9 };
export const dungeonRewardMult = (diff: DifficultyId = 'normal') => DIFFICULTIES[diff].rewardMult;

/** Étoiles de l'équipement des donjons d'équipement (v1.68.11) : étages 1-2 → 1 à 2 ★, 3-9 → 1 à 3 ★, 10 et plus → 3 à 4 ★ ;
 *  chaque difficulté décale la fourchette vers le haut (Difficile +1, Expert +2, Cauchemar +3), sans dépasser 6 ★. */
const STAR_SHIFT: Record<DifficultyId, number> = { normal: 0, hard: 1, expert: 2, nightmare: 3 };
export function forgeStarRange(floor: number, diff: DifficultyId = 'normal'): [number, number] {
  const [lo, hi] = floor <= 2 ? [1, 2] : floor <= 9 ? [1, 3] : [3, 4];
  const k = STAR_SHIFT[diff];
  return [Math.min(6, lo + k), Math.min(6, hi + k)];
}
/** Tirage dans la fourchette : les petites étoiles sont les plus fréquentes (1-3 ★ : 50 % / 33 % / 17 %). */
export function rollForgeStars(r: () => number, floor: number, diff: DifficultyId = 'normal'): number {
  const [lo, hi] = forgeStarRange(floor, diff);
  const ks = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  const ws = ks.map((_, i) => ks.length - i);
  let x = r() * ws.reduce((a, w) => a + w, 0);
  for (let i = 0; i < ks.length; i++) { x -= ws[i]; if (x < 0) return ks[i]; }
  return hi;
}

export const DUNGEON_STEP = 0.55;
export const dungeonStatMult = (floor: number) => (floor <= 10 ? 1 : 1 + (floor - 10) * DUNGEON_STEP);
/** Niveau des ennemis : Normal 2 → 58 ; au-delà, on monte jusqu'au niveau 70 (le plafond) et c'est la puissance qui grimpe. */
export function dungeonLevel(floor: number, diff: DifficultyId = 'normal') {
  const i = DIFFICULTY_ORDER.indexOf(diff);
  return i <= 0 ? 2 + (floor - 1) * 4 : Math.min(70, 58 + i * 2 + floor - 1);
}
/** Force des ennemis (niveau × puissance, 1 = un ennemi niveau 1) au premier et au dernier étage de chaque difficulté.
 *  Normal finit vers 19,8 ; Difficile 21 → 33 ; Expert 34 → 50 ; Cauchemar 52 → 80 (pour les équipes très bien équipées). */
const DIFF_FORCE: Record<Exclude<DifficultyId, 'normal'>, [number, number]> = { hard: [21, 33], expert: [34, 50], nightmare: [52, 80] };
const growth = (lv: number) => 1 + BALANCE.hero.growthPerLevel * (lv - 1);
/** Multiplicateur de puissance des ennemis d'un étage. */
export function dungeonPower(floor: number, diff: DifficultyId = 'normal') {
  if (diff === 'normal') return dungeonStatMult(floor);
  const [a, b] = DIFF_FORCE[diff];
  const force = a * Math.pow(b / a, (floor - 1) / (DUNGEON_FLOORS - 1));
  return Math.round((force / growth(dungeonLevel(floor, diff))) * 100) / 100;
}
/** Force d'un étage comparée à l'étage 1 en Normal (pour l'affichage). */
export const dungeonForce = (floor: number, diff: DifficultyId = 'normal') => growth(dungeonLevel(floor, diff)) * dungeonPower(floor, diff);
export function dungeonEnergy(floor: number, diff: DifficultyId = 'normal') { return 6 + Math.floor(floor / 2) + DIFFICULTY_ORDER.indexOf(diff); }

export function dungeonWaves(d: DungeonDef, floor: number, diff: DifficultyId = 'normal'): WaveEnemy[][] {
  const lv = dungeonLevel(floor, diff);
  const m = d.minions;
  // Étages 11 à 15 (fin de jeu) et difficultés supérieures : ennemis renforcés.
  const statMult = dungeonPower(floor, diff);
  return [
    [{ enemy: m[0], level: lv, slot: 0, statMult }, { enemy: m[1], level: lv, slot: 1, statMult }, { enemy: m[2], level: lv, slot: 2, statMult }],
    [{ enemy: d.boss, level: lv + 1, slot: 1, hpMult: 3 + floor * 0.15, statMult }, { enemy: m[(floor + 1) % 3], level: lv, slot: 3, statMult }, { enemy: m[floor % 3], level: lv, slot: 4, statMult }],
  ];
}
