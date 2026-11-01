import type { AffinityId, RoleId, SkillDef, StatId, Stats } from './types';
import { ROLES } from './roles';
import { BALANCE } from './balance';

// Les Effacés : serviteurs du Néant Silencieux, êtres de toutes les époques vidés de leur nom.
// Même structure de compétences que les héros : le moteur de combat les traite de la même façon.

export interface EnemyDef {
  id: string;
  name: string;
  role: RoleId;
  affinity: AffinityId;
  /** Multiplicateur de puissance par rapport au gabarit du rôle. */
  mult: number;
  baseSpd: number;
  bias?: Partial<Record<StatId, number>>;
  skills: SkillDef[];
  boss?: boolean;
  look: string;
  palette: [string, string];
  /** Forme de la silhouette provisoire. */
  shape: 'soldier' | 'archer' | 'shield' | 'cantor' | 'hound' | 'knight' | 'herald' | 'golem' | 'wyrm' | 'alchemist' | 'archivist' | 'sentinel' | 'colossus';
}

const s = (id: string, name: string, slot: SkillDef['slot'], cooldown: number, description: string, effects: SkillDef['effects']): SkillDef =>
  ({ id, name, slot, cooldown, description, effects, upgrades: [] });

export const ENEMIES: Record<string, EnemyDef> = {
  hollow_soldier: {
    id: 'hollow_soldier', name: 'Soldat Effacé', role: 'attacker', affinity: 'telluric', mult: 0.62, baseSpd: 96, shape: 'soldier',
    look: 'Fantassin de Valcrest dont le visage n’est plus qu’une surface lisse et grise ; armure rouillée, fissures violettes.', palette: ['#5a5560', '#b98cff'],
    skills: [
      s('hs_1', 'Lame grise', 'basic', 0, 'Frappe un ennemi.', [{ kind: 'damage', target: 'enemy', mult: 3.0 }]),
      s('hs_2', 'Assaut silencieux', 'special', 3, 'Frappe deux fois.', [{ kind: 'damage', target: 'enemy', mult: 1.8, hits: 2 }]),
    ],
  },
  hollow_archer: {
    id: 'hollow_archer', name: 'Archer sans visage', role: 'attacker', affinity: 'lunar', mult: 0.58, baseSpd: 100, shape: 'archer',
    look: 'Archer encapuchonné aux mains grises, arc tendu d’une corde de lumière violette.', palette: ['#4a5060', '#8fb6ff'],
    skills: [
      s('ha_1', 'Trait de cendre', 'basic', 0, 'Tire sur un ennemi.', [{ kind: 'damage', target: 'enemy', mult: 3.0 }]),
      s('ha_2', 'Volée muette', 'special', 4, 'Attaque tous les ennemis.', [{ kind: 'damage', target: 'allEnemies', mult: 1.2 }]),
    ],
  },
  hollow_shield: {
    id: 'hollow_shield', name: 'Porte-bouclier Effacé', role: 'defender', affinity: 'solar', mult: 0.66, baseSpd: 90, shape: 'shield',
    look: 'Colosse gris portant un pavois fendu d’où suinte une lumière violette.', palette: ['#5e5348', '#ffb35c'],
    skills: [
      s('hsh_1', 'Coup de pavois', 'basic', 0, 'Frappe un ennemi (DÉF).', [{ kind: 'damage', target: 'enemy', mult: 1.5, scaling: 'def' }]),
      s('hsh_2', 'Mur gris', 'special', 4, 'Bouclier sur tous les alliés.', [{ kind: 'shield', target: 'allAllies', pctMaxHp: 0.12, turns: 2 }]),
    ],
  },
  hollow_cantor: {
    id: 'hollow_cantor', name: 'Chantre Muet', role: 'healer', affinity: 'void', mult: 0.6, baseSpd: 102, shape: 'cantor',
    look: 'Prêtre en robe déchirée, bouche cousue de fils de lumière ; son chant silencieux referme les plaies.', palette: ['#4b4458', '#d6b8ff'],
    skills: [
      s('hc_1', 'Murmure creux', 'basic', 0, 'Frappe un ennemi.', [{ kind: 'damage', target: 'enemy', mult: 2.4 }]),
      s('hc_2', 'Hymne du vide', 'special', 3, 'Soigne tous les alliés de 15 %.', [{ kind: 'heal', target: 'allAllies', pctMaxHp: 0.15 }]),
    ],
  },
  rift_hound: {
    id: 'rift_hound', name: 'Molosse de faille', role: 'assassin', affinity: 'void', mult: 0.58, baseSpd: 112, shape: 'hound',
    look: 'Grand chien maigre fait de fumée grise et d’éclats de cristal, yeux violets.', palette: ['#3a3446', '#c48cff'],
    skills: [
      s('rh_1', 'Crocs', 'basic', 0, 'Mord deux fois.', [{ kind: 'damage', target: 'enemy', mult: 1.6, hits: 2 }]),
      s('rh_2', 'Morsure du Néant', 'special', 3, 'Frappe et empoisonne (50 %).', [{ kind: 'damage', target: 'enemy', mult: 3.2 }, { kind: 'status', target: 'enemy', status: 'poison', chance: 0.5, turns: 2 }]),
    ],
  },
  hollow_knight: {
    id: 'hollow_knight', name: 'Chevalier Effacé', role: 'defender', affinity: 'lunar', mult: 0.85, baseSpd: 94, shape: 'knight',
    look: 'Ancien chevalier du Mur Blanc, armure intacte mais heaume vide d’où s’échappe une brume violette.', palette: ['#6a6f7a', '#a98cff'],
    skills: [
      s('hk_1', 'Estoc vide', 'basic', 0, 'Frappe (DÉF), 20 % d’étourdir.', [{ kind: 'damage', target: 'enemy', mult: 1.7, scaling: 'def' }, { kind: 'status', target: 'enemy', status: 'stun', chance: 0.2, turns: 1 }]),
      s('hk_2', 'Serment oublié', 'special', 4, 'Provoque tous les ennemis 1 tour.', [{ kind: 'status', target: 'allEnemies', status: 'taunt', chance: 0.9, turns: 1 }]),
    ],
  },
  herald: {
    id: 'herald', name: 'Le Héraut Effacé', role: 'controller', affinity: 'void', mult: 0.9, baseSpd: 100, boss: true, shape: 'herald',
    bias: { hp: 1.2 },
    look: 'Silhouette immense en tabard de héraut de Valcrest décoloré, sans visage, couronnée d’un halo de fissures ; porte une cloche de bronze dont le glas efface les sons.', palette: ['#7a6a8a', '#e3d0ff'],
    skills: [
      s('he_1', 'Glas', 'basic', 0, 'Frappe un ennemi et réduit sa DÉF (30 %, 2 tours).', [{ kind: 'damage', target: 'enemy', mult: 3.0 }, { kind: 'status', target: 'enemy', status: 'defDown', chance: 0.3, turns: 2, value: 0.3 }]),
      s('he_2', 'Silence de cendre', 'special', 3, 'Attaque tous les ennemis, 30 % d’étourdir.', [{ kind: 'damage', target: 'allEnemies', mult: 1.6 }, { kind: 'status', target: 'allEnemies', status: 'stun', chance: 0.3, turns: 1 }]),
      s('he_3', 'Effacement', 'ultimate', 5, 'Énormes dégâts à tous et réduit leur ATQ (2 tours).', [{ kind: 'damage', target: 'allEnemies', mult: 2.5 }, { kind: 'status', target: 'allEnemies', status: 'atkDown', chance: 0.6, turns: 2, value: 0.25 }]),
    ],
  },
  // ─── Gardiens des donjons ───
  forge_golem: {
    id: 'forge_golem', name: 'Gardien de la Forge', role: 'defender', affinity: 'telluric', mult: 0.95, baseSpd: 88, boss: true, shape: 'golem',
    bias: { hp: 1.3, def: 1.2 },
    look: 'Golem de bronze et d’enclumes, cœur de forge incandescent, marteaux à la place des mains.', palette: ['#6b4a2a', '#ff9a3c'],
    skills: [
      s('fg_1', 'Marteau d’enclume', 'basic', 0, 'Frappe (DÉF) et réduit la DÉF (40 %).', [{ kind: 'damage', target: 'enemy', mult: 1.8, scaling: 'def' }, { kind: 'status', target: 'enemy', status: 'defDown', chance: 0.4, turns: 2, value: 0.3 }]),
      s('fg_2', 'Coulée de bronze', 'special', 3, 'Attaque tous les ennemis et les brûle (35 %).', [{ kind: 'damage', target: 'allEnemies', mult: 1.0, scaling: 'def' }, { kind: 'status', target: 'allEnemies', status: 'burn', chance: 0.35, turns: 2 }]),
      s('fg_3', 'Trempe', 'ultimate', 5, 'Bouclier de 25 % et DÉF +50 % sur lui-même.', [{ kind: 'shield', target: 'self', pctMaxHp: 0.25, turns: 2 }, { kind: 'status', target: 'self', status: 'defUp', chance: 1, turns: 2, value: 0.5 }]),
    ],
  },
  amber_wyrm: {
    id: 'amber_wyrm', name: 'Wyrm d’ambre', role: 'attacker', affinity: 'solar', mult: 0.9, baseSpd: 104, boss: true, shape: 'wyrm',
    bias: { hp: 1.2 },
    look: 'Serpent ailé aux écailles d’ambre translucide, gorge pleine d’élixir doré.', palette: ['#6b4a10', '#ffcf5a'],
    skills: [
      s('aw_1', 'Croc d’ambre', 'basic', 0, 'Frappe un ennemi.', [{ kind: 'damage', target: 'enemy', mult: 3.4 }]),
      s('aw_2', 'Souffle doré', 'special', 3, 'Attaque tous les ennemis et les brûle (40 %).', [{ kind: 'damage', target: 'allEnemies', mult: 1.6 }, { kind: 'status', target: 'allEnemies', status: 'burn', chance: 0.4, turns: 2 }]),
    ],
  },
  rogue_alchemist: {
    id: 'rogue_alchemist', name: 'Alchimiste dévoyé', role: 'controller', affinity: 'lunar', mult: 0.9, baseSpd: 106, boss: true, shape: 'alchemist',
    bias: { hp: 1.2 },
    look: 'Savant de l’Ordre du Prisme rongé par ses propres potions, fioles bouillonnantes à la ceinture.', palette: ['#203a4a', '#7fe7ff'],
    skills: [
      s('ra_1', 'Fiole corrosive', 'basic', 0, 'Frappe et empoisonne (50 %).', [{ kind: 'damage', target: 'enemy', mult: 2.8 }, { kind: 'status', target: 'enemy', status: 'poison', chance: 0.5, turns: 2 }]),
      s('ra_2', 'Brume gelante', 'special', 4, 'Attaque tous les ennemis, 30 % de gel.', [{ kind: 'damage', target: 'allEnemies', mult: 1.4 }, { kind: 'status', target: 'allEnemies', status: 'freeze', chance: 0.3, turns: 1 }]),
      s('ra_3', 'Élixir interdit', 'ultimate', 5, 'Soigne ses alliés de 25 %.', [{ kind: 'heal', target: 'allAllies', pctMaxHp: 0.25 }]),
    ],
  },
  mute_archivist: {
    id: 'mute_archivist', name: 'Archiviste Muet', role: 'controller', affinity: 'void', mult: 0.9, baseSpd: 102, boss: true, shape: 'archivist',
    bias: { hp: 1.2 },
    look: 'Gardien d’une bibliothèque effacée, pages vierges tourbillonnant autour de lui.', palette: ['#3a3050', '#d6b8ff'],
    skills: [
      s('ma_1', 'Page blanche', 'basic', 0, 'Frappe et réduit l’ATQ (40 %).', [{ kind: 'damage', target: 'enemy', mult: 2.9 }, { kind: 'status', target: 'enemy', status: 'atkDown', chance: 0.4, turns: 2, value: 0.25 }]),
      s('ma_2', 'Oubli', 'special', 3, 'Vide la jauge de tour de tous les ennemis (25 %) et les étourdit (25 %).', [{ kind: 'damage', target: 'allEnemies', mult: 1.3 }, { kind: 'turnMeter', target: 'allEnemies', delta: -0.25 }, { kind: 'status', target: 'allEnemies', status: 'stun', chance: 0.25, turns: 1 }]),
    ],
  },
  tower_sentinel: {
    id: 'tower_sentinel', name: 'Sentinelle de la Tour', role: 'defender', affinity: 'void', mult: 1.0, baseSpd: 98, boss: true, shape: 'sentinel',
    bias: { hp: 1.4 },
    look: 'Statue de cristal noir animée, gardienne d’un étage de la Tour des Âges.', palette: ['#2a2a3a', '#b98cff'],
    skills: [
      s('ts_1', 'Lame de cristal', 'basic', 0, 'Frappe, 25 % d’étourdir.', [{ kind: 'damage', target: 'enemy', mult: 3.0 }, { kind: 'status', target: 'enemy', status: 'stun', chance: 0.25, turns: 1 }]),
      s('ts_2', 'Écho des âges', 'special', 3, 'Attaque tous les ennemis et réduit leur VIT (40 %).', [{ kind: 'damage', target: 'allEnemies', mult: 1.5 }, { kind: 'status', target: 'allEnemies', status: 'spdDown', chance: 0.4, turns: 2, value: 0.25 }]),
      s('ts_3', 'Rempart des âges', 'ultimate', 5, 'Bouclier de 20 % sur tous ses alliés.', [{ kind: 'shield', target: 'allAllies', pctMaxHp: 0.2, turns: 2 }]),
    ],
  },
  // ─── Boss mondial ───
  bronze_colossus: {
    id: 'bronze_colossus', name: 'Le Colosse de Bronze', role: 'controller', affinity: 'void', mult: 1.0, baseSpd: 95, boss: true, shape: 'colossus',
    look: 'Statue de guerre de la cité d’Ur-Akkar, haute comme une tour, réveillée par la Fracture ; ses fissures laissent passer un soleil noir.', palette: ['#5a3a18', '#ffcc66'],
    skills: [
      s('bc_1', 'Poing de bronze', 'basic', 0, 'Frappe et réduit la DÉF (40 %).', [{ kind: 'damage', target: 'enemy', mult: 3.0 }, { kind: 'status', target: 'enemy', status: 'defDown', chance: 0.4, turns: 2, value: 0.3 }]),
      s('bc_2', 'Séisme', 'special', 3, 'Attaque tous les ennemis, 30 % d’étourdir.', [{ kind: 'damage', target: 'allEnemies', mult: 1.6 }, { kind: 'status', target: 'allEnemies', status: 'stun', chance: 0.3, turns: 1 }]),
      s('bc_3', 'Soleil noir', 'ultimate', 4, 'Énormes dégâts à tous et brûlure (60 %).', [{ kind: 'damage', target: 'allEnemies', mult: 2.4 }, { kind: 'status', target: 'allEnemies', status: 'burn', chance: 0.6, turns: 2 }]),
    ],
  },
};

/** Statistiques d'un ennemi à un niveau donné (même formule de croissance que les héros). */
export function enemyStats(def: EnemyDef, level: number, statMult = 1, hpMult = 1): Stats {
  const t = ROLES[def.role].template;
  const g = def.mult * statMult * (1 + BALANCE.hero.growthPerLevel * (level - 1));
  const b = (k: StatId) => def.bias?.[k] ?? 1;
  return {
    hp: Math.round(t.hp * b('hp') * g * hpMult),
    atk: Math.round(t.atk * b('atk') * g),
    def: Math.round(t.def * b('def') * g),
    spd: def.baseSpd,
    critRate: t.critRate,
    critDmg: t.critDmg,
    acc: t.acc + level * 2,
    res: t.res + level * 2,
  };
}
