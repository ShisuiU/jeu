import type { RoleId, Stats } from './types';

export interface RoleDef {
  id: RoleId;
  name: string;
  description: string;
  /** Gabarit de statistiques au niveau 1, avant rareté et biais du héros. */
  template: Stats;
}

export const ROLES: Record<RoleId, RoleDef> = {
  attacker: {
    id: 'attacker', name: 'Attaquant',
    description: 'Inflige de lourds dégâts, souvent sur plusieurs cibles. Fragile.',
    template: { hp: 1150, atk: 135, def: 80, spd: 100, critRate: 15, critDmg: 60, acc: 10, res: 20 },
  },
  defender: {
    id: 'defender', name: 'Défenseur',
    description: 'Absorbe les coups, provoque les ennemis et protège l’équipe.',
    template: { hp: 1650, atk: 90, def: 140, spd: 92, critRate: 5, critDmg: 50, acc: 10, res: 40 },
  },
  support: {
    id: 'support', name: 'Support',
    description: 'Renforce les alliés : bonus d’attaque, de vitesse, jauge de tour.',
    template: { hp: 1300, atk: 100, def: 110, spd: 108, critRate: 10, critDmg: 50, acc: 20, res: 35 },
  },
  healer: {
    id: 'healer', name: 'Soigneur',
    description: 'Restaure les PV, purifie les malus et peut ressusciter.',
    template: { hp: 1400, atk: 95, def: 115, spd: 104, critRate: 8, critDmg: 50, acc: 10, res: 40 },
  },
  controller: {
    id: 'controller', name: 'Contrôleur',
    description: 'Étourdit, gèle, ralentit et affaiblit. Mise sur la précision.',
    template: { hp: 1250, atk: 110, def: 100, spd: 106, critRate: 10, critDmg: 50, acc: 45, res: 25 },
  },
  assassin: {
    id: 'assassin', name: 'Assassin',
    description: 'Élimine une cible prioritaire. Très rapide, très critique.',
    template: { hp: 1050, atk: 140, def: 75, spd: 112, critRate: 25, critDmg: 75, acc: 15, res: 15 },
  },
};

export const ROLE_LIST = Object.values(ROLES);
