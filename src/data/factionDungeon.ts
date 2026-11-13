import type { FactionId } from './types';
import type { Reward } from './resources';
import type { WaveEnemy } from './campaign';

// DONJON DES FAMILLES (v1.79.0) — chaque jour, le donjon d'une famille de héros : seuls ses héros peuvent y entrer.
// Il change au renouvellement quotidien et revient tous les 6 jours ; la progression de chaque famille est gardée.
export const FACTION_ORDER: FactionId[] = ['valcrest', 'prism', 'ash', 'sylvaran', 'astral', 'akkar'];
export const FACTION_FLOORS = 30;

/** Nom du donjon et ennemis de la région de chaque famille (le boss garde les étages 10, 20 et 30). */
export const FACTION_DUNGEONS: Record<FactionId, { name: string; region: string; pool: [string, string, string]; boss: string }> = {
  valcrest: { name: 'Bastion du Serment', region: 'valcrest', pool: ['hollow_soldier', 'hollow_shield', 'hollow_archer'], boss: 'tower_sentinel' },
  prism: { name: 'Spire des Calculs', region: 'prism', pool: ['rogue_drone', 'glass_guard', 'data_wraith'], boss: 'mother_ai' },
  ash: { name: 'Fosse des Braises', region: 'ash', pool: ['ash_imp', 'chain_warden', 'pyre_priest'], boss: 'ash_lord' },
  sylvaran: { name: 'Racines Profondes', region: 'sylvaran', pool: ['rot_treant', 'feral_stalker', 'thorn_wisp'], boss: 'mother_tree' },
  astral: { name: 'Observatoire Éteint', region: 'astral', pool: ['star_husk', 'void_weaver', 'fallen_seraph'], boss: 'dead_constellation' },
  akkar: { name: 'Arène des Dunes', region: 'akkar', pool: ['sand_reaver', 'bronze_hoplite', 'dune_seer'], boss: 'scorpion_king' },
};

/** Niveau des ennemis : de 12 (étage 1) à 70 (étage 29 et plus). */
export const factionLevel = (floor: number) => Math.min(70, 10 + floor * 2);
/** v1.83.0 : le donjon était bien trop facile. La puissance des ennemis grimpe de FACTION_STEP par étage
 *  (étage 10 : ×2,8, étage 20 : ×4,8, étage 30 : ×6,8) ; l'étage 30 demande une famille au sommet, bien équipée. */
export const FACTION_STEP = 0.2;
export const factionStatMult = (floor: number) => 1 + (floor - 1) * FACTION_STEP;

export function factionWaves(f: FactionId, floor: number): WaveEnemy[][] {
  const d = FACTION_DUNGEONS[f];
  const lv = factionLevel(floor);
  const m = factionStatMult(floor);
  const pick = (i: number) => d.pool[(floor + i) % 3];
  const size = 3 + Math.min(2, Math.floor(floor / 8));
  const wave = (off: number): WaveEnemy[] => Array.from({ length: size }, (_, i) => ({ enemy: pick(i + off), level: lv, slot: i, statMult: m }));
  if (floor % 10 === 0) return [wave(0), [{ enemy: d.boss, level: Math.min(70, lv + 1), slot: 1, hpMult: 2.5 + floor / 10, statMult: m }, { enemy: pick(1), level: lv, slot: 3, statMult: m }, { enemy: pick(2), level: lv, slot: 4, statMult: m }]];
  return floor >= 3 ? [wave(0), wave(1)] : [wave(0)];
}

/** Récompense de la première victoire à chaque étage (les étages 10, 20 et 30 donnent aussi des diamants). */
export function factionReward(floor: number): Reward {
  if (floor % 10 === 0) return { crystals: 100 + floor * 4, awakenEssence: 1, masteryScroll: 2, diamonds: 5 };
  if (floor % 5 === 0) return { crystals: 50, skillTome: 2, potionMinor: 2 };
  return { gold: 2000 + floor * 300, xpElixir: 2 };
}

// ─── Étoiles des familles (v1.83.0) ───
// Chaque étage gagné donne 1 à 3 étoiles (3 : aucun héros KO, 2 : un KO, 1 : plus). Un étage conquis peut être
// rejoué pour améliorer ses étoiles. Le total des étoiles des 6 familles débloque des paliers de récompenses.
export const FACTION_MAX_STARS = FACTION_ORDER.length * FACTION_FLOORS * 3; // 540
export const FACTION_STAR_MILESTONES: { stars: number; reward: Reward }[] = [
  { stars: 30, reward: { gold: 20000, crystals: 100 } },
  { stars: 60, reward: { diamonds: 10, skillTome: 3 } },
  { stars: 100, reward: { shardEpic: 1, masteryScroll: 3 } },
  { stars: 150, reward: { diamonds: 20, awakenEssence: 1 } },
  { stars: 200, reward: { shardAeon: 1, shardEpic: 1 } },
  { stars: 260, reward: { diamonds: 30, masteryScroll: 5 } },
  { stars: 320, reward: { awakenEssence: 2, shardEpic: 1, crystals: 200 } },
  { stars: 380, reward: { shardAeon: 2, diamonds: 40 } },
  { stars: 440, reward: { diamonds: 50, masteryScroll: 8 } },
  { stars: 500, reward: { shardAeon: 3, awakenEssence: 2 } },
  { stars: 540, reward: { diamonds: 100, shardAeon: 5 } },
];
