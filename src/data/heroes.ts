import type { HeroDef } from './types';
import { CHAPTER_HEROES } from './heroesChapters';
import { EXTRA_HEROES } from './heroesExtra';
import { LOW_HEROES } from './heroesLow';
import { WAVE_A_HEROES } from './heroesWaveA';
import { WAVE_B_HEROES } from './heroesWaveB';
import { WAVE_C_HEROES } from './heroesWaveC';

// Première collection : 15 héros. Pour en ajouter, il suffit d'ajouter une entrée ici
// (ses illustrations sont dans src/assets/heroes/<id>/).

const up = (...u: string[]) => u;

const BASE_HEROES: HeroDef[] = [
  // ───────────── EMPIRE DE VALCREST ─────────────
  {
    id: 'aldric', name: 'Aldric Vaunt', title: 'Capitaine du Mur Blanc',
    faction: 'valcrest', rarity: 'rare', role: 'defender', affinity: 'telluric', baseSpd: 94,
    bias: { def: 1.08 },
    skills: [
      { id: 'aldric_1', name: 'Coup de pavois', slot: 'basic', cooldown: 0, description: 'Frappe un ennemi avec son bouclier (dégâts basés sur la DÉF). 25 % de chances d’étourdir 1 tour.',
        effects: [{ kind: 'damage', target: 'enemy', mult: 1.6, scaling: 'def' }, { kind: 'status', target: 'enemy', status: 'stun', chance: 0.25, turns: 1 }], upgrades: up('+5 % dégâts', '+10 % chance d’étourdir', '+10 % dégâts') },
      { id: 'aldric_2', name: 'Serment du rempart', slot: 'special', cooldown: 3, description: 'Provoque tous les ennemis pendant 2 tours et augmente sa DÉF de 50 %.',
        effects: [{ kind: 'status', target: 'allEnemies', status: 'taunt', chance: 1, turns: 2 }, { kind: 'status', target: 'self', status: 'defUp', chance: 1, turns: 2, value: 0.5 }], upgrades: up('Recharge -1') },
      { id: 'aldric_3', name: 'Murailles de Valcrest', slot: 'ultimate', cooldown: 5, description: 'Octroie à tous les alliés un bouclier de 20 % de ses PV max pendant 2 tours.',
        effects: [{ kind: 'shield', target: 'allAllies', pctMaxHp: 0.2, turns: 2 }], upgrades: up('Bouclier +5 %', 'Recharge -1') },
    ],
    leaderSkill: { description: '+20 % DÉF pour l’équipe', stat: 'def', pct: 0.2, scope: 'all' },
    lore: "Aldric commandait la garnison du Mur Blanc la nuit où le ciel s'est ouvert. Des trois cents hommes qui tenaient la brèche, il est le seul à être redescendu des remparts. Il porte encore leurs noms gravés à l'intérieur de son bouclier.",
    quote: '« Derrière moi. Toujours derrière moi. »',
    look: "Homme d'une quarantaine d'années, barbe courte grisonnante, cicatrice sur la pommette gauche. Armure de plates complète en acier poli rehaussée d'or, tabard pourpre au lion de Valcrest. Immense pavois rectangulaire gravé de noms, épée bâtarde à la hanche.",
    palette: ['#8e1b2b', '#d4a64a', '#c9ccd2'],
  },
  {
    id: 'seraphine', name: 'Séraphine de Lys', title: 'Prêtresse de la Dernière Aube',
    faction: 'valcrest', rarity: 'epic', role: 'healer', affinity: 'solar', baseSpd: 105,
    skills: [
      { id: 'seraphine_1', name: 'Encensoir ardent', slot: 'basic', cooldown: 0, description: 'Frappe un ennemi et soigne l’allié le plus blessé de 8 % de ses PV max.',
        effects: [{ kind: 'damage', target: 'enemy', mult: 2.4 }, { kind: 'heal', target: 'lowestAlly', pctMaxHp: 0.08 }], upgrades: up('+5 % soins', '+10 % dégâts') },
      { id: 'seraphine_2', name: 'Cantique de lumière', slot: 'special', cooldown: 3, description: 'Soigne tous les alliés de 20 % de leurs PV max et retire leurs malus.',
        effects: [{ kind: 'heal', target: 'allAllies', pctMaxHp: 0.2 }, { kind: 'cleanse', target: 'allAllies' }], upgrades: up('+5 % soins', 'Recharge -1') },
      { id: 'seraphine_3', name: 'Dernière Aube', slot: 'ultimate', cooldown: 6, description: 'Ressuscite tous les alliés tombés avec 30 % de leurs PV.',
        effects: [{ kind: 'revive', target: 'allAllies', pctMaxHp: 0.3 }], upgrades: up('PV de résurrection +10 %', 'Recharge -1') },
    ],
    leaderSkill: { description: '+15 % PV pour l’équipe', stat: 'hp', pct: 0.15, scope: 'all' },
    lore: "Séraphine a chanté les funérailles de la moitié de sa ville. Sa foi a vacillé, puis s'est durcie comme l'acier : elle ne prie plus pour que les morts reposent, mais pour qu'ils se relèvent et finissent le combat.",
    quote: '« Pas encore. Je ne t’ai pas donné la permission de mourir. »',
    look: "Femme d'une trentaine d'années, visage grave, cheveux blond cendré nattés sous une coiffe de mailles. Armure de plates légère sous une longue robe blanche et or, mains gantées tenant un encensoir de bronze qui brûle d'une flamme dorée.",
    palette: ['#f2e8d0', '#d4a64a', '#8e1b2b'],
  },
  {
    id: 'corvin', name: 'Corvin Ash', title: 'Lame de la Chancellerie',
    faction: 'valcrest', rarity: 'uncommon', role: 'assassin', affinity: 'lunar', baseSpd: 110,
    skills: [
      { id: 'corvin_1', name: 'Carreau empoisonné', slot: 'basic', cooldown: 0, description: 'Tire un carreau. 50 % de chances d’empoisonner 2 tours.',
        effects: [{ kind: 'damage', target: 'enemy', mult: 3.2 }, { kind: 'status', target: 'enemy', status: 'poison', chance: 0.5, turns: 2 }], upgrades: up('+5 % dégâts', '+10 % chance de poison') },
      { id: 'corvin_2', name: 'Stylet dans l’ombre', slot: 'special', cooldown: 3, description: 'Frappe deux fois une cible en ignorant 30 % de sa DÉF. Combo : +50 % de dégâts si elle est empoisonnée.',
        effects: [{ kind: 'damage', target: 'enemy', mult: 2.2, hits: 2, ignoreDefPct: 0.3, bonusVs: ['poison'] }], upgrades: up('+10 % dégâts', 'Recharge -1') },
    ],
    lore: "Fils de personne, élevé dans les archives de la Chancellerie, Corvin règle les problèmes que la couronne ne peut pas reconnaître. Depuis la Fracture, ces problèmes ont des crocs.",
    quote: '« Personne ne m’a vu. Personne ne me verra. »',
    look: "Homme mince d'environ vingt-cinq ans, visage anguleux, cheveux noirs mi-longs. Cape à capuche gris anthracite, brigandine de cuir noir cloutée, arbalète de poing ouvragée et stylet effilé.",
    palette: ['#1e1f26', '#6b6f7a', '#8e1b2b'],
  },

  // ───────────── ORDRE DU PRISME ─────────────
  {
    id: 'hesper', name: 'Hesper K-7', title: 'Ingénieure de l’Essaim',
    faction: 'prism', rarity: 'rare', role: 'controller', affinity: 'lunar', baseSpd: 107,
    skills: [
      { id: 'hesper_1', name: 'Décharge de drone', slot: 'basic', cooldown: 0, description: 'Un drone frappe un ennemi. 30 % de chances de réduire sa vitesse de 30 % pendant 2 tours.',
        effects: [{ kind: 'damage', target: 'enemy', mult: 3.0 }, { kind: 'status', target: 'enemy', status: 'spdDown', chance: 0.3, turns: 2, value: 0.3 }], upgrades: up('+5 % dégâts', '+10 % chance') },
      { id: 'hesper_2', name: 'Champ cryogénique', slot: 'special', cooldown: 4, description: 'Attaque tous les ennemis. 40 % de chances de geler chaque cible 1 tour.',
        effects: [{ kind: 'damage', target: 'allEnemies', mult: 1.6 }, { kind: 'status', target: 'allEnemies', status: 'freeze', chance: 0.4, turns: 1 }], upgrades: up('+10 % chance', 'Recharge -1') },
      { id: 'hesper_3', name: 'Protocole Essaim', slot: 'passive', cooldown: 0, description: 'Au début de chaque tour, 15 % de chances de réduire la jauge de tour d’un ennemi aléatoire de 15 %.',
        effects: [{ kind: 'turnMeter', target: 'randomEnemies', delta: -0.15 }], upgrades: up('+5 % chance') },
    ],
    lore: "Hesper a conçu l'Essaim pour réparer les tours de cristal du Prisme. Aujourd'hui, ses deux cents drones servent aussi à geler le sang des créatures du Néant. Elle leur a donné un nom à chacun.",
    quote: '« Formation sept. Personne ne bouge. »',
    look: "Jeune femme d'environ vingt-huit ans, cheveux argentés coupés court, implants lumineux cyan le long de la tempe. Combinaison technique blanche et graphite, gantelet de contrôle holographique, nuée de petits drones triangulaires autour d'elle.",
    palette: ['#e9f3f7', '#7fe7ff', '#2c3a44'],
  },
  {
    id: 'idris', name: 'Idris Kael', title: 'Commandeur de la Lance Réfractée',
    faction: 'prism', rarity: 'legendary', role: 'attacker', affinity: 'solar', baseSpd: 104,
    bias: { atk: 1.06 },
    skills: [
      { id: 'idris_1', name: 'Estoc de plasma', slot: 'basic', cooldown: 0, description: 'Frappe un ennemi. 30 % de chances de le brûler 2 tours.',
        effects: [{ kind: 'damage', target: 'enemy', mult: 3.6 }, { kind: 'status', target: 'enemy', status: 'burn', chance: 0.3, turns: 2 }], upgrades: up('+5 % dégâts', '+10 % chance', '+10 % dégâts') },
      { id: 'idris_2', name: 'Surcharge du Prisme', slot: 'special', cooldown: 3, description: 'Augmente son ATQ de 50 % pendant 2 tours et remplit sa jauge de tour de 30 %.',
        effects: [{ kind: 'status', target: 'self', status: 'atkUp', chance: 1, turns: 2, value: 0.5 }, { kind: 'turnMeter', target: 'self', delta: 0.3 }], upgrades: up('Recharge -1') },
      { id: 'idris_3', name: 'Lance Réfractée', slot: 'ultimate', cooldown: 5, description: 'Un faisceau traverse tous les ennemis et réduit leur DÉF de 50 % pendant 2 tours.',
        effects: [{ kind: 'status', target: 'allEnemies', status: 'defDown', chance: 0.75, turns: 2, value: 0.5 }, { kind: 'damage', target: 'allEnemies', mult: 3.4 }], upgrades: up('+10 % dégâts', '+10 % chance', 'Recharge -1') },
    ],
    leaderSkill: { description: '+25 % ATQ pour les héros Solaires', stat: 'atk', pct: 0.25, scope: 'solar' },
    lore: "Dans son époque d'origine, Idris a perdu une guerre contre les machines. Arraché au temps par la Fracture, il s'est juré de ne plus jamais battre en retraite. Son exo-armure garde la trace de six cents batailles.",
    quote: '« La retraite est une ligne de code que j’ai effacée. »',
    look: "Homme noir d'une quarantaine d'années, crâne rasé, regard dur, fine barbe. Exo-armure lourde blanche et dorée aux plaques segmentées, cœur réacteur lumineux sur le torse, longue lance à lame de plasma solaire.",
    palette: ['#f4f1ea', '#ffbe4a', '#0f4c63'],
  },

  // ───────────── LÉGION DE CENDRE ─────────────
  {
    id: 'varkhaal', name: 'Varkhaal', title: 'le Brisé, Chevalier du Pacte Rompu',
    faction: 'ash', rarity: 'epic', role: 'defender', affinity: 'void', baseSpd: 95,
    bias: { hp: 1.08 },
    skills: [
      { id: 'varkhaal_1', name: 'Fléau de chaînes', slot: 'basic', cooldown: 0, description: 'Frappe un ennemi (dégâts basés sur les PV max) et vole 20 % des dégâts infligés.',
        effects: [{ kind: 'damage', target: 'enemy', mult: 0.22, scaling: 'hp', lifestealPct: 0.2 }], upgrades: up('+5 % dégâts', '+10 % vol de vie') },
      { id: 'varkhaal_2', name: 'Défi infernal', slot: 'special', cooldown: 3, description: 'Provoque tous les ennemis pendant 1 tour et réduit leur ATQ de 25 % pendant 2 tours.',
        effects: [{ kind: 'status', target: 'allEnemies', status: 'taunt', chance: 1, turns: 1 }, { kind: 'status', target: 'allEnemies', status: 'atkDown', chance: 0.8, turns: 2, value: 0.25 }], upgrades: up('+10 % chance', 'Recharge -1') },
      { id: 'varkhaal_3', name: 'Ce qui ne meurt pas', slot: 'passive', cooldown: 0, description: 'Une fois par combat, survit à un coup fatal avec 1 PV et gagne un bouclier de 25 % de ses PV max.',
        effects: [{ kind: 'shield', target: 'self', pctMaxHp: 0.25, turns: 2 }], upgrades: up('Bouclier +10 %') },
    ],
    lore: "Varkhaal a servi les Seigneurs de Cendre pendant trois siècles avant de briser ses propres chaînes. Littéralement. Il les porte encore autour des bras, comme une arme et comme une promesse.",
    quote: '« J’ai déjà brûlé. Le feu ne m’effraie plus. »',
    look: "Guerrier massif à la peau grise fissurée de veines incandescentes, deux cornes brisées, visage marqué mais humain. Armure d'obsidienne fendue d'où suinte une lueur orange, chaînes brisées enroulées autour des avant-bras.",
    palette: ['#1a1414', '#ff6a1f', '#5a1405'],
  },
  {
    id: 'sulfura', name: 'Mère Sulfura', title: 'Matriarche des Braises',
    faction: 'ash', rarity: 'legendary', role: 'controller', affinity: 'solar', baseSpd: 103,
    skills: [
      { id: 'sulfura_1', name: 'Langue de soufre', slot: 'basic', cooldown: 0, description: 'Frappe un ennemi. 40 % de chances de le brûler 2 tours.',
        effects: [{ kind: 'damage', target: 'enemy', mult: 3.2 }, { kind: 'status', target: 'enemy', status: 'burn', chance: 0.4, turns: 2 }], upgrades: up('+10 % chance', '+10 % dégâts') },
      { id: 'sulfura_2', name: 'Cendres suffocantes', slot: 'special', cooldown: 4, description: 'Attaque tous les ennemis : 50 % de chances d’étourdir 1 tour.',
        effects: [{ kind: 'damage', target: 'allEnemies', mult: 1.8 }, { kind: 'status', target: 'allEnemies', status: 'stun', chance: 0.5, turns: 1 }], upgrades: up('+10 % chance', 'Recharge -1') },
      { id: 'sulfura_3', name: 'Bûcher des Mères', slot: 'ultimate', cooldown: 5, description: 'Inflige d’énormes dégâts à tous les ennemis, +50 % de dégâts contre les cibles brûlées.',
        effects: [{ kind: 'damage', target: 'allEnemies', mult: 3.8 }], upgrades: up('+10 % dégâts', 'Recharge -1') },
    ],
    leaderSkill: { description: '+30 % PRÉ pour l’équipe', stat: 'acc', pct: 0.3, scope: 'all' },
    lore: "Personne ne sait si Sulfura est née mortelle. Les damnés l'appellent Mère parce qu'elle les a tous vus naître dans la flamme. Elle a rejoint les Héritiers sans un mot d'explication, ce qui inquiète tout le monde.",
    quote: '« Approche, mon enfant. Il fait si froid, dehors. »',
    look: "Femme d'âge indéterminé, grande et austère, peau pâle, yeux couleur de braise, longue chevelure noire tressée de fils d'or. Robe de cérémonie noire et pourpre brodée de runes incandescentes, couronne de fer à pointes, sceptre fumant.",
    palette: ['#120c10', '#ff4f1f', '#c9a14a'],
  },

  // ───────────── GARDIENS DE SYLVARAN ─────────────
  {
    id: 'elowen', name: 'Elowen Racine-Ancienne', title: 'Druidesse du Cercle Vert',
    faction: 'sylvaran', rarity: 'rare', role: 'healer', affinity: 'telluric', baseSpd: 103,
    skills: [
      { id: 'elowen_1', name: 'Épines', slot: 'basic', cooldown: 0, description: 'Frappe un ennemi. 25 % de chances de l’empoisonner 2 tours.',
        effects: [{ kind: 'damage', target: 'enemy', mult: 2.6 }, { kind: 'status', target: 'enemy', status: 'poison', chance: 0.25, turns: 2 }], upgrades: up('+10 % chance') },
      { id: 'elowen_2', name: 'Sève vivifiante', slot: 'special', cooldown: 3, description: 'Applique une régénération de 10 % des PV max par tour à tous les alliés pendant 2 tours.',
        effects: [{ kind: 'status', target: 'allAllies', status: 'regen', chance: 1, turns: 2, value: 0.1 }], upgrades: up('Recharge -1') },
      { id: 'elowen_3', name: 'Floraison', slot: 'ultimate', cooldown: 4, description: 'Soigne l’allié le plus blessé de 35 % de ses PV max.',
        effects: [{ kind: 'heal', target: 'lowestAlly', pctMaxHp: 0.35 }], upgrades: up('+5 % soins', '+5 % soins') },
    ],
    lore: "Elowen entend les arbres. Depuis la Fracture, ils ne font plus que crier. Elle a quitté le Cercle Vert pour trouver ce qui les blesse, et le faire taire.",
    quote: '« La forêt se souvient de toi. Lève-toi. »',
    look: "Femme d'une vingtaine d'années, peau mate, longs cheveux châtains entrelacés de lierre, tatouages runiques verts sur les bras. Tenue de cuir souple et de lin, plastron de bronze patiné, bâton noueux surmonté d'un cristal ambré.",
    palette: ['#1f3d22', '#9bbf5a', '#b07a3c'],
  },
  {
    id: 'torvald', name: 'Torvald Pierre-Veille', title: 'Sentinelle du Cromlech',
    faction: 'sylvaran', rarity: 'common', role: 'defender', affinity: 'telluric', baseSpd: 90,
    skills: [
      { id: 'torvald_1', name: 'Marteau de menhir', slot: 'basic', cooldown: 0, description: 'Frappe un ennemi (dégâts basés sur la DÉF).',
        effects: [{ kind: 'damage', target: 'enemy', mult: 1.8, scaling: 'def' }], upgrades: up('+10 % dégâts') },
      { id: 'torvald_2', name: 'Peau de granit', slot: 'special', cooldown: 4, description: 'Augmente la DÉF de tous les alliés de 30 % pendant 2 tours et provoque un ennemi : il doit frapper Torvald.',
        effects: [{ kind: 'status', target: 'allAllies', status: 'defUp', chance: 1, turns: 2, value: 0.3 }, { kind: 'status', target: 'enemy', status: 'taunt', chance: 1, turns: 1 }], upgrades: up('Recharge -1') },
    ],
    lore: "Torvald monte la garde devant le même cercle de pierres depuis quarante ans. Il n'a jamais compris ce qu'il protégeait, jusqu'à ce que les pierres se mettent à briller.",
    quote: '« Je ne bouge pas. Ce sont eux qui bougent. »',
    look: "Homme robuste d'une cinquantaine d'années, larges épaules, longue barbe tressée rousse et grise. Armure de cuir épais renforcée de plaques de pierre gravée, cape de fourrure, lourd marteau de pierre cerclé de bronze.",
    palette: ['#3b3a33', '#9bbf5a', '#8a6a3b'],
  },
  {
    id: 'maelis', name: 'Maëlis', title: 'l’Archère Grise',
    faction: 'sylvaran', rarity: 'uncommon', role: 'attacker', affinity: 'lunar', baseSpd: 102,
    skills: [
      { id: 'maelis_1', name: 'Flèche de brume', slot: 'basic', cooldown: 0, description: 'Tire une flèche sur un ennemi. Combo : +30 % de dégâts s’il est gelé ou étourdi.',
        effects: [{ kind: 'damage', target: 'enemy', mult: 3.4, bonusVs: ['freeze', 'stun'], bonusPct: 0.3 }], upgrades: up('+5 % dégâts', '+10 % dégâts') },
      { id: 'maelis_2', name: 'Pluie de la lisière', slot: 'special', cooldown: 3, description: 'Attaque tous les ennemis à deux reprises.',
        effects: [{ kind: 'damage', target: 'allEnemies', mult: 1.2, hits: 2 }], upgrades: up('+10 % dégâts', 'Recharge -1') },
    ],
    lore: "Maëlis n'a jamais raté une cible qu'elle avait décidé d'atteindre. Elle ne parle presque pas ; on raconte qu'elle a donné sa voix à la brume en échange de sa vue perçante.",
    quote: '« … » (Elle bande son arc.)',
    look: "Jeune femme élancée, cheveux gris clair tressés, visage fin couvert de traits de peinture cendrée. Manteau de chasse gris-vert à capuche, armure de cuir légère, grand arc long en bois clair gravé de runes.",
    palette: ['#3f4a44', '#a9c4c9', '#9bbf5a'],
  },

  // ───────────── CONCORDAT ASTRAL ─────────────
  {
    id: 'vaelshira', name: 'Vael’Shira', title: 'Tisseuse d’Étoiles',
    faction: 'astral', rarity: 'legendary', role: 'support', affinity: 'lunar', baseSpd: 112,
    skills: [
      { id: 'vael_1', name: 'Fil d’étoile', slot: 'basic', cooldown: 0, description: 'Frappe un ennemi et augmente la jauge de tour de l’allié le plus faible de 10 %.',
        effects: [{ kind: 'damage', target: 'enemy', mult: 2.8 }, { kind: 'turnMeter', target: 'lowestAlly', delta: 0.1 }], upgrades: up('+5 % dégâts', '+5 % jauge') },
      { id: 'vael_2', name: 'Alignement', slot: 'special', cooldown: 3, description: 'Augmente l’ATQ (+50 %) et la vitesse (+30 %) de tous les alliés pendant 2 tours.',
        effects: [{ kind: 'status', target: 'allAllies', status: 'atkUp', chance: 1, turns: 2, value: 0.5 }, { kind: 'status', target: 'allAllies', status: 'spdUp', chance: 1, turns: 2, value: 0.3 }], upgrades: up('Recharge -1') },
      { id: 'vael_3', name: 'Trame du destin', slot: 'ultimate', cooldown: 5, description: 'Remplit la jauge de tour de tous les alliés de 30 % et retire leurs malus.',
        effects: [{ kind: 'turnMeter', target: 'allAllies', delta: 0.3 }, { kind: 'cleanse', target: 'allAllies' }], upgrades: up('+10 % jauge', 'Recharge -1') },
    ],
    leaderSkill: { description: '+15 VIT pour l’équipe', stat: 'spd', pct: 0.12, scope: 'all' },
    lore: "Vael'Shira a vu mourir sept mondes. À chaque fois, elle a noté le moment exact où tout aurait pu basculer. Elle ne veut pas d'un huitième nom sur sa liste.",
    quote: '« J’ai déjà vu cette fin. Changeons-la. »',
    look: "Femme grande et sereine à la peau bleu nuit parsemée de points lumineux comme des étoiles, longs cheveux blanc argenté flottant en apesanteur. Robe-armure argentée à voiles translucides violets, fils de lumière tissés entre ses doigts, halo en anneau derrière la tête.",
    palette: ['#1a1240', '#c7b6ff', '#efe6ff'],
  },
  {
    id: 'isel', name: 'Isel', title: 'Veilleuse d’Orbite',
    faction: 'astral', rarity: 'uncommon', role: 'support', affinity: 'void', baseSpd: 109,
    skills: [
      { id: 'isel_1', name: 'Éclat gravitationnel', slot: 'basic', cooldown: 0, description: 'Frappe un ennemi et lui retire tous ses bonus. 30 % de chances de réduire sa DÉF de 30 % pendant 2 tours.',
        effects: [{ kind: 'dispel', target: 'enemy' }, { kind: 'damage', target: 'enemy', mult: 2.8 }, { kind: 'status', target: 'enemy', status: 'defDown', chance: 0.3, turns: 2, value: 0.3 }], upgrades: up('+10 % chance') },
      { id: 'isel_2', name: 'Orbite protectrice', slot: 'special', cooldown: 4, description: 'Octroie un bouclier de 15 % des PV max à tous les alliés pendant 2 tours.',
        effects: [{ kind: 'shield', target: 'allAllies', pctMaxHp: 0.15, turns: 2 }], upgrades: up('Bouclier +5 %', 'Recharge -1') },
    ],
    lore: "Novice du Concordat, Isel n'aurait jamais dû descendre à la surface. Elle s'est cachée dans une capsule de ravitaillement par curiosité. Elle ne regrette rien. Enfin, presque.",
    quote: '« Vu d’en haut, c’était beaucoup plus calme. »',
    look: "Jeune femme d'environ dix-neuf ans (adulte), peau gris-lavande, grands yeux argentés, cheveux sombres coupés au carré. Combinaison argentée près du corps sous une cape courte violette, trois petites sphères en orbite autour de sa main.",
    palette: ['#2a1650', '#b07cff', '#d7d9e0'],
  },

  // ───────────── HORDES D’AKKAR ─────────────
  {
    id: 'brann', name: 'Brann', title: 'Pillard des Dunes Rouges',
    faction: 'akkar', rarity: 'common', role: 'attacker', affinity: 'solar', baseSpd: 99,
    skills: [
      { id: 'brann_1', name: 'Hache de bronze', slot: 'basic', cooldown: 0, description: 'Frappe un ennemi. Achèvement : +50 % de dégâts s’il a moins de 30 % de ses PV.',
        effects: [{ kind: 'damage', target: 'enemy', mult: 3.4, executeBelow: 0.3 }], upgrades: up('+10 % dégâts') },
      { id: 'brann_2', name: 'Cri de guerre', slot: 'special', cooldown: 3, description: 'Frappe un ennemi deux fois et augmente sa propre ATQ de 25 % pendant 2 tours.',
        effects: [{ kind: 'status', target: 'self', status: 'atkUp', chance: 1, turns: 2, value: 0.25 }, { kind: 'damage', target: 'enemy', mult: 1.9, hits: 2 }], upgrades: up('Recharge -1') },
    ],
    lore: "Brann pille les ruines des autres époques pour nourrir son clan. Il ne croit ni aux dieux, ni aux rois, ni aux prophéties. Il croit à sa hache, et ça lui a toujours suffi.",
    quote: '« Tu veux mon avis ? On tape d’abord. »',
    look: "Homme trapu et musclé d'une trentaine d'années, peau tannée, crâne rasé sur les côtés avec une crête de cheveux noirs, peinture de guerre rouge. Cuirasse de bronze cabossée renforcée de plaques de métal récupéré, cape en toile déchirée, hache de bronze à large lame.",
    palette: ['#6b3a12', '#c2401c', '#e3a457'],
  },
  {
    id: 'kaedra', name: 'Kaedra Hurlecendre', title: 'Lame du Simoun',
    faction: 'akkar', rarity: 'epic', role: 'assassin', affinity: 'solar', baseSpd: 114,
    skills: [
      { id: 'kaedra_1', name: 'Khopesh jumeaux', slot: 'basic', cooldown: 0, description: 'Frappe un ennemi deux fois.',
        effects: [{ kind: 'damage', target: 'enemy', mult: 1.9, hits: 2 }], upgrades: up('+5 % dégâts', '+10 % dégâts') },
      { id: 'kaedra_2', name: 'Vent de sable', slot: 'special', cooldown: 3, description: 'Réduit la DÉF de la cible de 50 % pendant 2 tours puis la frappe.',
        effects: [{ kind: 'status', target: 'enemy', status: 'defDown', chance: 0.8, turns: 2, value: 0.5 }, { kind: 'damage', target: 'enemy', mult: 3.6 }], upgrades: up('+10 % chance', 'Recharge -1') },
      { id: 'kaedra_3', name: 'Exécution du Simoun', slot: 'ultimate', cooldown: 4, description: 'Frappe une cible en ignorant 50 % de sa DÉF. Si elle meurt, Kaedra rejoue immédiatement.',
        effects: [{ kind: 'damage', target: 'enemy', mult: 5.6, ignoreDefPct: 0.5 }], upgrades: up('+10 % dégâts', 'Recharge -1') },
    ],
    lore: "Kaedra était la garde personnelle du roi Azhar dans une autre vie, il y a quatre mille ans. Lorsque la Fracture les a ramenés, elle a été la seule à reconnaître son souverain, et la seule à oser lui désobéir.",
    quote: '« Le vent ne prévient pas. Moi non plus. »',
    look: "Femme athlétique d'environ trente ans, peau brune, yeux soulignés de khôl, longue tresse noire, voile de sable sur le bas du visage. Armure de cuir et d'écailles de bronze, brassards dorés, deux khopesh courbes à lames sombres.",
    palette: ['#3d2414', '#e3a457', '#c2401c'],
  },
  {
    id: 'azhar', name: 'Azhar-Kesh', title: 'Roi-Soleil Déchu d’Ur-Akkar',
    faction: 'akkar', rarity: 'mythic', role: 'controller', affinity: 'void', baseSpd: 108,
    bias: { atk: 1.05, hp: 1.05 },
    skills: [
      { id: 'azhar_1', name: 'Sceptre d’éclipse', slot: 'basic', cooldown: 0, description: 'Frappe un ennemi. 30 % de chances de l’étourdir 1 tour.',
        effects: [{ kind: 'damage', target: 'enemy', mult: 3.4 }, { kind: 'status', target: 'enemy', status: 'stun', chance: 0.3, turns: 1 }], upgrades: up('+5 % dégâts', '+10 % chance', '+10 % dégâts') },
      { id: 'azhar_2', name: 'Décret du Soleil Noir', slot: 'special', cooldown: 4, description: 'Attaque tous les ennemis, réduit leur ATQ et leur DÉF de 30 % pendant 2 tours et vide 20 % de leur jauge de tour.',
        effects: [{ kind: 'damage', target: 'allEnemies', mult: 2.2 }, { kind: 'status', target: 'allEnemies', status: 'atkDown', chance: 0.7, turns: 2, value: 0.3 }, { kind: 'status', target: 'allEnemies', status: 'defDown', chance: 0.7, turns: 2, value: 0.3 }, { kind: 'turnMeter', target: 'allEnemies', delta: -0.2 }], upgrades: up('+10 % chance', 'Recharge -1') },
      { id: 'azhar_3', name: 'Éclipse Totale', slot: 'ultimate', cooldown: 6, description: 'Inflige d’immenses dégâts à tous les ennemis et les étourdit 1 tour (60 % de chances). Vole 25 % des dégâts infligés.',
        effects: [{ kind: 'damage', target: 'allEnemies', mult: 4.2, lifestealPct: 0.25 }, { kind: 'status', target: 'allEnemies', status: 'stun', chance: 0.6, turns: 1 }], upgrades: up('+10 % dégâts', '+10 % chance', 'Recharge -1') },
      { id: 'azhar_4', name: 'Couronne d’Ur', slot: 'passive', cooldown: 0, description: 'Immunisé contre l’étourdissement. Gagne 10 % d’ATQ pour chaque ennemi vaincu (cumulable 5 fois).',
        effects: [], upgrades: up('+5 % par cumul') },
    ],
    leaderSkill: { description: '+20 % ATQ et pouvoir des Hordes pour l’équipe', stat: 'atk', pct: 0.2, scope: 'all' },
    lore: "Il y a quatre mille ans, Azhar-Kesh tenta d'enfermer le soleil dans une pyramide pour rendre son peuple immortel. C'est son rituel inachevé qui, à travers les âges, a fissuré le Cœur d'Aeon. Il le sait. Il est le seul à le savoir.",
    quote: '« J’ai brisé le monde une fois. Je le recoudrai. »',
    look: "Homme d'une cinquantaine d'années à la stature royale, peau bronze, barbe noire tressée et ornée d'anneaux d'or, regard d'ambre lumineux. Armure cérémonielle de bronze et d'or noir, pectoral en disque solaire fissuré d'où s'échappe une lumière violette, cape pourpre, sceptre surmonté d'un soleil éclipsé.",
    palette: ['#2b1a0c', '#ffcc66', '#9a4dff'],
  },
];

export const HEROES: HeroDef[] = [...BASE_HEROES, ...CHAPTER_HEROES, ...EXTRA_HEROES, ...LOW_HEROES, ...WAVE_A_HEROES, ...WAVE_B_HEROES, ...WAVE_C_HEROES];

export const HERO_BY_ID: Record<string, HeroDef> = Object.fromEntries(HEROES.map((h) => [h.id, h]));

/** Héros offerts au démarrage d'une nouvelle partie. */
export const STARTER_HEROES = ['torvald', 'brann', 'corvin', 'elowen'];
