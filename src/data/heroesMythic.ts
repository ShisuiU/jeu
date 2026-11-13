import type { HeroDef } from './types';

// HÉROS MYTHIQUES AJOUTÉS (v1.80) — portrait peint avec SpriteCook.
const up = (...u: string[]) => u;

export const MYTHIC_HEROES: HeroDef[] = [
  {
    id: 'nyxa', name: 'Nyxa Point-Zéro', title: 'Lame de la Réfraction',
    faction: 'prism', rarity: 'mythic', role: 'assassin', affinity: 'void', baseSpd: 118,
    skills: [
      { id: 'nyxa_1', name: 'Lame réfractée', slot: 'basic', cooldown: 0, description: 'Frappe un ennemi 2 fois en ignorant 20 % de sa DÉF.',
        effects: [{ kind: 'damage', target: 'enemy', mult: 1.8, hits: 2, ignoreDefPct: 0.2 }], upgrades: up('+5 % dégâts', '+10 % dégâts') },
      { id: 'nyxa_2', name: 'Pas de phase', slot: 'special', cooldown: 3, description: 'Fait avancer sa jauge de tour de 30 %, frappe un ennemi en ignorant 30 % de sa DÉF, puis 50 % de chances de réduire sa DÉF de 30 % pendant 2 tours.',
        effects: [{ kind: 'turnMeter', target: 'self', delta: 0.3 }, { kind: 'damage', target: 'enemy', mult: 3.6, ignoreDefPct: 0.3 }, { kind: 'status', target: 'enemy', status: 'defDown', chance: 0.5, turns: 2, value: 0.3 }], upgrades: up('+10 % dégâts', '+10 % chance', 'Recharge -1') },
      { id: 'nyxa_3', name: 'Point zéro', slot: 'ultimate', cooldown: 5, description: 'Retire les bonus de la cible puis la frappe en ignorant 40 % de sa DÉF. Combo : +50 % de dégâts si sa DÉF est réduite. Achèvement : +50 % de dégâts sous 35 % de PV.',
        effects: [{ kind: 'dispel', target: 'enemy' }, { kind: 'damage', target: 'enemy', mult: 5.5, ignoreDefPct: 0.4, bonusVs: ['defDown'], executeBelow: 0.35 }], upgrades: up('+10 % dégâts', '+10 % dégâts', 'Recharge -1') },
    ],
    leaderSkill: { description: '+13 % de taux critique pour l’équipe', stat: 'critRate', pct: 0.13, scope: 'all' },
    lore: "Nyxa était le prototype zéro du Prisme : une lame vivante, conçue pour plier la lumière jusqu'à la rendre invisible. Le jour de la Fracture, le Néant s'est engouffré dans les fissures de son armure, et l'Ordre l'a déclarée perdue. Elle est revenue seule, une nuit, au pied de la tour où elle était née. Elle ne sert plus personne, mais elle se bat toujours aux côtés des Héritiers : elle dit que le Néant lui a appris où frapper.",
    quote: '« Tu m’as vue ? Alors c’est déjà fini. »',
    look: "Femme d'une trentaine d'années, visage pâle et marqué de fines cicatrices, cheveux noirs courts avec une mèche argentée, yeux violets luisants sous une capuche sombre. Exo-armure de plaques de céramique blanche fissurées d'où s'échappe une lumière violette du Néant, lignes cyan, longue cape violet sombre, dague de cristal réfracté violet et cyan, éclats de prisme qui tournent autour de sa main.",
    palette: ['#e9f3f7', '#7fe7ff', '#9a6bff'],
  },
];

