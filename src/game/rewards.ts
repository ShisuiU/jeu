import type { Reward } from '../data/resources';
import type { SaveData } from '../save/schema';
import { addEnergy } from './energy';

/** Applique une récompense à une sauvegarde (mutation, à utiliser dans un produce immer). */
export function applyReward(s: SaveData, r: Reward): void {
  for (const [k, v] of Object.entries(r)) {
    if (!v) continue;
    if (k === 'energy') s.energy = addEnergy(s.energy, v);
    else s.resources[k as keyof SaveData['resources']] = (s.resources[k as keyof SaveData['resources']] ?? 0) + v;
  }
}
