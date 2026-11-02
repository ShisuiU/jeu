import type { AffinityId, RoleId, SkillDef, SkillEffect, StatId } from './types';
import type { EnemyDef } from './enemies';

// ENNEMIS DES CHAPITRES 2 À 7 — un trio par région + un boss.
type Shape = EnemyDef['shape'];
const sk = (id: string, name: string, slot: SkillDef['slot'], cooldown: number, description: string, effects: SkillEffect[]): SkillDef => ({ id, name, slot, cooldown, description, effects, upgrades: [] });
const e = (id: string, name: string, role: RoleId, affinity: AffinityId, mult: number, baseSpd: number, shape: Shape, palette: [string, string], look: string, skills: SkillDef[], opts: { boss?: boolean; bias?: Partial<Record<StatId, number>> } = {}): EnemyDef =>
  ({ id, name, role, affinity, mult, baseSpd, shape, palette, look, skills, ...opts });

const D = (mult: number, target: 'enemy' | 'allEnemies' = 'enemy', extra: Partial<Extract<SkillEffect, { kind: 'damage' }>> = {}): SkillEffect => ({ kind: 'damage', target, mult, ...extra });
const ST = (status: Extract<SkillEffect, { kind: 'status' }>['status'], chance: number, turns: number, target: Extract<SkillEffect, { kind: 'status' }>['target'] = 'enemy', value?: number): SkillEffect => ({ kind: 'status', target, status, chance, turns, value });

export const REGION_ENEMIES: Record<string, EnemyDef> = {
  // ─── Chapitre 2 : Sylves de Sylvaran ───
  rot_treant: e('rot_treant', 'Sylve pourrissante', 'defender', 'telluric', 0.7, 88, 'golem', ['#2a3a1e', '#a6d65a'], 'Arbre ambulant à l’écorce noircie, sève violette suintant de ses fissures.',
    [sk('rt_1', 'Branche lourde', 'basic', 0, 'Frappe (DÉF).', [D(1.6, 'enemy', { scaling: 'def' })]), sk('rt_2', 'Écorce', 'special', 4, 'Bouclier sur ses alliés.', [{ kind: 'shield', target: 'allAllies', pctMaxHp: 0.12, turns: 2 }])]),
  thorn_wisp: e('thorn_wisp', 'Feu follet d’épines', 'controller', 'lunar', 0.6, 108, 'alchemist', ['#1e3a2a', '#d8f29a'], 'Lueur flottante entourée d’une couronne de ronces.',
    [sk('tw_1', 'Piqûre', 'basic', 0, 'Frappe et empoisonne (35 %).', [D(2.6), ST('poison', 0.35, 2)]), sk('tw_2', 'Ronces', 'special', 4, 'Ralentit tous les ennemis (40 %).', [D(1.1, 'allEnemies'), ST('spdDown', 0.4, 2, 'allEnemies', 0.3)])]),
  feral_stalker: e('feral_stalker', 'Traqueur sauvage', 'assassin', 'telluric', 0.6, 114, 'hound', ['#2a2418', '#c8a060'], 'Grand loup aux yeux vides, pelage mêlé de lierre et de cristal.',
    [sk('fs_1', 'Crocs', 'basic', 0, 'Mord deux fois.', [D(1.6, 'enemy', { hits: 2 })]), sk('fs_2', 'Bond', 'special', 3, 'Frappe et réduit la DÉF (50 %).', [ST('defDown', 0.5, 2, 'enemy', 0.3), D(3.2)])]),
  mother_tree: e('mother_tree', 'L’Arbre-Mère corrompu', 'controller', 'telluric', 0.95, 96, 'tree', ['#1e2a14', '#c9f25a'], 'Arbre millénaire dont le tronc s’est ouvert sur une faille ; ses racines étouffent la forêt.',
    [sk('mt_1', 'Racine étrangleuse', 'basic', 0, 'Frappe, 30 % d’étourdir.', [D(3.0), ST('stun', 0.3, 1)]), sk('mt_2', 'Spores', 'special', 3, 'Empoisonne tous les ennemis (60 %).', [D(1.4, 'allEnemies'), ST('poison', 0.6, 2, 'allEnemies')]), sk('mt_3', 'Sève noire', 'ultimate', 5, 'Se soigne de 20 % et soigne ses alliés.', [{ kind: 'heal', target: 'allAllies', pctMaxHp: 0.2 }])], { boss: true, bias: { hp: 1.2 } }),

  // ─── Chapitre 3 : Citadelle du Prisme ───
  rogue_drone: e('rogue_drone', 'Drone dévoyé', 'attacker', 'solar', 0.6, 110, 'sentinel', ['#1e2a34', '#7fe7ff'], 'Drone de combat triangulaire, lentille rouge à la place de l’œil cyan.',
    [sk('rd_1', 'Rayon', 'basic', 0, 'Frappe un ennemi.', [D(3.0)]), sk('rd_2', 'Salve', 'special', 3, 'Attaque tous les ennemis.', [D(1.3, 'allEnemies')])]),
  glass_guard: e('glass_guard', 'Garde de verre', 'defender', 'lunar', 0.72, 90, 'knight', ['#2a3a44', '#b8f6ff'], 'Soldat du Prisme figé dans une armure de verre fêlée.',
    [sk('gg_1', 'Bouclier réfracté', 'basic', 0, 'Frappe (DÉF), 20 % d’étourdir.', [D(1.6, 'enemy', { scaling: 'def' }), ST('stun', 0.2, 1)]), sk('gg_2', 'Prisme', 'special', 4, 'Provoque tous les ennemis.', [ST('taunt', 0.85, 1, 'allEnemies')])]),
  data_wraith: e('data_wraith', 'Spectre de données', 'controller', 'void', 0.6, 106, 'archivist', ['#141e2a', '#9fd0ff'], 'Silhouette faite de lignes de code effacées.',
    [sk('dw_1', 'Corruption', 'basic', 0, 'Frappe, réduit l’ATQ (40 %).', [D(2.7), ST('atkDown', 0.4, 2, 'enemy', 0.25)]), sk('dw_2', 'Effacement de mémoire', 'special', 4, 'Vide la jauge de tour des ennemis (20 %).', [D(1.1, 'allEnemies'), { kind: 'turnMeter', target: 'allEnemies', delta: -0.2 }])]),
  mother_ai: e('mother_ai', 'MÈRE-PRISME', 'controller', 'void', 0.95, 104, 'sentinel', ['#0f2a3a', '#7fe7ff'], 'L’intelligence centrale de la Citadelle, un cœur de cristal suspendu dans une cage de lumière.',
    [sk('ma2_1', 'Calcul', 'basic', 0, 'Frappe et réduit la DÉF (40 %).', [D(3.0), ST('defDown', 0.4, 2, 'enemy', 0.3)]), sk('ma2_2', 'Grille gelante', 'special', 3, 'Attaque tous les ennemis, 35 % de gel.', [D(1.5, 'allEnemies'), ST('freeze', 0.35, 1, 'allEnemies')]), sk('ma2_3', 'Protocole Zéro', 'ultimate', 5, 'Énormes dégâts à tous.', [D(2.6, 'allEnemies')])], { boss: true, bias: { hp: 1.2 } }),

  // ─── Chapitre 4 : Terres Dévastées d’Akkar ───
  sand_reaver: e('sand_reaver', 'Pillard effacé', 'attacker', 'solar', 0.62, 102, 'soldier', ['#4a2a14', '#e3a457'], 'Guerrier des dunes au visage lisse, hache de bronze ébréchée.',
    [sk('sr_1', 'Hache', 'basic', 0, 'Frappe un ennemi.', [D(3.2)]), sk('sr_2', 'Tourbillon', 'special', 3, 'Attaque tous les ennemis et les brûle (30 %).', [D(1.3, 'allEnemies'), ST('burn', 0.3, 2, 'allEnemies')])]),
  bronze_hoplite: e('bronze_hoplite', 'Hoplite de bronze', 'defender', 'telluric', 0.74, 90, 'shield', ['#5a4020', '#ffcf7a'], 'Soldat antique d’Ur-Akkar, bouclier rond frappé du soleil éclipsé.',
    [sk('bh_1', 'Lance', 'basic', 0, 'Frappe (DÉF).', [D(1.7, 'enemy', { scaling: 'def' })]), sk('bh_2', 'Phalange', 'special', 4, 'DÉF +40 % pour ses alliés.', [ST('defUp', 1, 2, 'allAllies', 0.4)])]),
  dune_seer: e('dune_seer', 'Voyante des dunes', 'healer', 'lunar', 0.6, 104, 'cantor', ['#3a2a3a', '#ffd59a'], 'Prêtresse voilée dont les yeux ne reflètent que du sable.',
    [sk('ds_1', 'Mirage', 'basic', 0, 'Frappe un ennemi.', [D(2.5)]), sk('ds_2', 'Oasis', 'special', 3, 'Soigne ses alliés de 18 %.', [{ kind: 'heal', target: 'allAllies', pctMaxHp: 0.18 }])]),
  scorpion_king: e('scorpion_king', 'Le Roi-Scorpion d’Ur', 'assassin', 'solar', 0.95, 108, 'wyrm', ['#4a2410', '#ff9a3c'], 'Ancien général d’Azhar fusionné avec un scorpion de bronze géant par la Fracture.',
    [sk('sk_1', 'Dard', 'basic', 0, 'Frappe et empoisonne (50 %).', [D(3.2), ST('poison', 0.5, 2)]), sk('sk_2', 'Pinces', 'special', 3, 'Frappe deux fois en ignorant 40 % de DÉF.', [D(2.0, 'enemy', { hits: 2, ignoreDefPct: 0.4 })]), sk('sk_3', 'Tempête de sable', 'ultimate', 5, 'Attaque tous les ennemis, 40 % d’étourdir.', [D(2.2, 'allEnemies'), ST('stun', 0.4, 1, 'allEnemies')])], { boss: true, bias: { hp: 1.2 } }),

  // ─── Chapitre 5 : Abîme de la Légion ───
  ash_imp: e('ash_imp', 'Diablotin de cendre', 'assassin', 'solar', 0.58, 116, 'hound', ['#3a1408', '#ff6a1f'], 'Petit démon de braises, rire strident, griffes incandescentes.',
    [sk('ai_1', 'Griffes', 'basic', 0, 'Frappe deux fois et brûle (25 %).', [D(1.6, 'enemy', { hits: 2 }), ST('burn', 0.25, 2)]), sk('ai_2', 'Ruée', 'special', 3, 'Frappe la cible la plus faible.', [D(3.6)])]),
  chain_warden: e('chain_warden', 'Geôlier aux chaînes', 'defender', 'void', 0.76, 88, 'knight', ['#2a1a1a', '#ff8a3c'], 'Gardien colossal des damnés, enveloppé de chaînes chauffées au rouge.',
    [sk('cw_1', 'Chaînes', 'basic', 0, 'Frappe (PV), vol de vie 20 %.', [D(0.2, 'enemy', { scaling: 'hp', lifestealPct: 0.2 })]), sk('cw_2', 'Entraves', 'special', 4, 'Provoque et réduit l’ATQ (50 %).', [ST('taunt', 0.85, 1, 'allEnemies'), ST('atkDown', 0.5, 2, 'allEnemies', 0.25)])]),
  pyre_priest: e('pyre_priest', 'Prêtre du bûcher', 'controller', 'solar', 0.62, 104, 'cantor', ['#2a0a0a', '#ff4f1f'], 'Damné en robe calcinée, encensoir de soufre à la main.',
    [sk('pp_1', 'Soufre', 'basic', 0, 'Frappe et brûle (40 %).', [D(2.8), ST('burn', 0.4, 2)]), sk('pp_2', 'Fumées', 'special', 4, 'Attaque tous les ennemis, 30 % d’étourdir.', [D(1.3, 'allEnemies'), ST('stun', 0.3, 1, 'allEnemies')])]),
  ash_lord: e('ash_lord', 'Morvath, Seigneur de Cendre', 'attacker', 'void', 1.0, 104, 'colossus', ['#2a0a08', '#ff6a1f'], 'Seigneur infernal couronné de cornes brisées ; il a pactisé avec le Néant pour survivre.',
    [sk('al_1', 'Lame du pacte', 'basic', 0, 'Frappe, vol de vie 25 %.', [D(3.4, 'enemy', { lifestealPct: 0.25 })]), sk('al_2', 'Brasier', 'special', 3, 'Attaque tous les ennemis et les brûle (60 %).', [D(1.6, 'allEnemies'), ST('burn', 0.6, 2, 'allEnemies')]), sk('al_3', 'Couronne de cendre', 'ultimate', 5, 'ATQ +50 % et bouclier de 20 %.', [ST('atkUp', 1, 2, 'self', 0.5), { kind: 'shield', target: 'self', pctMaxHp: 0.2, turns: 2 }])], { boss: true, bias: { hp: 1.25 } }),

  // ─── Chapitre 6 : Observatoire du Concordat ───
  star_husk: e('star_husk', 'Coquille stellaire', 'attacker', 'lunar', 0.62, 104, 'archer', ['#1a1240', '#c7b6ff'], 'Ancien observateur du Concordat dont il ne reste que l’armure lumineuse.',
    [sk('sh_1', 'Trait d’étoile', 'basic', 0, 'Frappe un ennemi.', [D(3.2)]), sk('sh_2', 'Pluie d’astres', 'special', 3, 'Attaque tous les ennemis deux fois.', [D(0.8, 'allEnemies', { hits: 2 })])]),
  void_weaver: e('void_weaver', 'Tisseur de vide', 'controller', 'void', 0.62, 108, 'archivist', ['#120a2a', '#b07cff'], 'Être de fils noirs qui découd la trame du destin.',
    [sk('vw_1', 'Fil noir', 'basic', 0, 'Frappe, réduit la VIT (40 %).', [D(2.7), ST('spdDown', 0.4, 2, 'enemy', 0.3)]), sk('vw_2', 'Découture', 'special', 4, 'Vide la jauge de tour (25 %) et réduit la DÉF (40 %).', [D(1.2, 'allEnemies'), { kind: 'turnMeter', target: 'allEnemies', delta: -0.25 }, ST('defDown', 0.4, 2, 'allEnemies', 0.3)])]),
  fallen_seraph: e('fallen_seraph', 'Séraphin éteint', 'healer', 'solar', 0.64, 102, 'herald', ['#2a2440', '#efe6ff'], 'Gardien céleste aux ailes de verre brisé.',
    [sk('fsr_1', 'Lumière froide', 'basic', 0, 'Frappe un ennemi.', [D(2.6)]), sk('fsr_2', 'Psaume éteint', 'special', 3, 'Soigne ses alliés de 20 % et les purifie.', [{ kind: 'heal', target: 'allAllies', pctMaxHp: 0.2 }, { kind: 'cleanse', target: 'allAllies' }])]),
  dead_constellation: e('dead_constellation', 'La Constellation Éteinte', 'controller', 'void', 1.0, 106, 'void', ['#0a0820', '#c7b6ff'], 'Sept étoiles mortes reliées par des fils de néant, formant un visage qui n’existe plus.',
    [sk('dc_1', 'Étoile morte', 'basic', 0, 'Frappe, 30 % de gel.', [D(3.1), ST('freeze', 0.3, 1)]), sk('dc_2', 'Gravité', 'special', 3, 'Attaque tous les ennemis, réduit VIT et ATQ (50 %).', [D(1.6, 'allEnemies'), ST('spdDown', 0.5, 2, 'allEnemies', 0.3), ST('atkDown', 0.5, 2, 'allEnemies', 0.25)]), sk('dc_3', 'Supernova', 'ultimate', 5, 'Énormes dégâts à tous.', [D(2.8, 'allEnemies')])], { boss: true, bias: { hp: 1.25 } }),

  // ─── Chapitre 7 : Le Cœur d’Aeon ───
  hollow_heir: e('hollow_heir', 'Héritier effacé', 'attacker', 'void', 0.7, 108, 'knight', ['#1a1424', '#e3d0ff'], 'Un Héritier tombé avant vous, dont l’éclat a été dévoré par le Néant.',
    [sk('hh_1', 'Éclat terni', 'basic', 0, 'Frappe et réduit la DÉF (35 %).', [D(3.2), ST('defDown', 0.35, 2, 'enemy', 0.3)]), sk('hh_2', 'Résonance morte', 'special', 3, 'Attaque tous les ennemis.', [D(1.5, 'allEnemies')])]),
  heart_shard: e('heart_shard', 'Éclat corrompu', 'healer', 'void', 0.66, 100, 'sentinel', ['#140a24', '#ff9bb5'], 'Fragment du Cœur d’Aeon infecté par le Néant, qui pulse comme un cœur malade.',
    [sk('hs2_1', 'Pulsation', 'basic', 0, 'Frappe un ennemi.', [D(2.6)]), sk('hs2_2', 'Battement', 'special', 3, 'Soigne et protège ses alliés.', [{ kind: 'heal', target: 'allAllies', pctMaxHp: 0.15 }, { kind: 'shield', target: 'allAllies', pctMaxHp: 0.1, turns: 2 }])]),
  voice_of_void: e('voice_of_void', 'La Voix du Néant', 'controller', 'void', 1.05, 110, 'void', ['#05030a', '#ff3d6e'], 'Le Néant Silencieux a enfin trouvé une voix : la vôtre, déformée, venue d’un futur effacé.',
    [sk('vv_1', 'Murmure', 'basic', 0, 'Frappe, 30 % d’étourdir.', [D(3.2), ST('stun', 0.3, 1)]), sk('vv_2', 'Silence absolu', 'special', 3, 'Attaque tous les ennemis, réduit ATQ et DÉF (60 %).', [D(1.7, 'allEnemies'), ST('atkDown', 0.6, 2, 'allEnemies', 0.3), ST('defDown', 0.6, 2, 'allEnemies', 0.3)]), sk('vv_3', 'Effacement total', 'ultimate', 4, 'Énormes dégâts à tous, vide la jauge (30 %).', [D(2.9, 'allEnemies'), { kind: 'turnMeter', target: 'allEnemies', delta: -0.3 }])], { boss: true, bias: { hp: 1.3 } }),
};
