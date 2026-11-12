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

/** Niveau des ennemis : de 6 (étage 1) à 64 (étage 30). Un peu moins puissants qu'ailleurs : l'équipe est limitée à une famille. */
export const factionLevel = (floor: number) => Math.min(70, 4 + floor * 2);
export const FACTION_STAT_MULT = 0.9;

export function factionWaves(f: FactionId, floor: number): WaveEnemy[][] {
  const d = FACTION_DUNGEONS[f];
  const lv = factionLevel(floor);
  const m = FACTION_STAT_MULT;
  const pick = (i: number) => d.pool[(floor + i) % 3];
  const size = 3 + Math.min(2, Math.floor(floor / 8));
  const wave = (off: number): WaveEnemy[] => Array.from({ length: size }, (_, i) => ({ enemy: pick(i + off), level: lv, slot: i, statMult: m }));
  if (floor % 10 === 0) return [wave(0), [{ enemy: d.boss, level: lv + 1, slot: 1, hpMult: 2 + floor / 15, statMult: m }, { enemy: pick(1), level: lv, slot: 3, statMult: m }, { enemy: pick(2), level: lv, slot: 4, statMult: m }]];
  return floor >= 3 ? [wave(0), wave(1)] : [wave(0)];
}

/** Récompense de la première victoire à chaque étage (les étages 10, 20 et 30 donnent aussi des diamants). */
export function factionReward(floor: number): Reward {
  if (floor % 10 === 0) return { crystals: 100 + floor * 4, awakenEssence: 1, masteryScroll: 2, diamonds: 5 };
  if (floor % 5 === 0) return { crystals: 50, skillTome: 2, potionMinor: 2 };
  return { gold: 2000 + floor * 300, xpElixir: 2 };
}
