import type { AffinityId } from './types';

// ACTES DES BOSS (v1.97.0, phase 2 lot 3) — un boss se joue en trois actes, que le joueur voit venir.
//  • Acte I : le combat normal.
//  • Acte II (sous 50 % de PV) : il enrage (+30 % ATQ), se purifie, se protège et recharge son ultime.
//  • Dernier acte (sous 25 % de PV) : il déchaîne un pouvoir propre à son affinité, et la scène vire au rouge.
// Les pouvoirs du dernier acte n'infligent pas de dégâts directs : ils changent la façon de finir le combat.

export type Act3Power = 'brasier' | 'ecorce' | 'maree' | 'effondrement';
export const ACT2_HP = 0.5;
export const ACT3_HP = 0.25;

export const ACT3: Record<Act3Power, { name: string; text: string; color: string }> = {
  brasier: { name: 'Brasier', text: 'brûle toute ton équipe pendant 2 tours', color: '#ff6a1f' },
  ecorce: { name: 'Écorce', text: 'se durcit (+30 % DÉF) et se régénère pendant 3 tours', color: '#7fbf4d' },
  maree: { name: 'Marée gelée', text: 'ralentit toute ton équipe et recule sa jauge', color: '#6fa8ff' },
  effondrement: { name: 'Effondrement', text: 'affaiblit toute ton équipe (−ATQ) et recule sa jauge', color: '#b07cff' },
};

export const ACT3_BY_AFFINITY: Record<AffinityId, Act3Power> = { solar: 'brasier', telluric: 'ecorce', lunar: 'maree', void: 'effondrement' };
export const act3Of = (a: AffinityId) => ACT3[ACT3_BY_AFFINITY[a]];
