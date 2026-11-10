import { BALANCE } from '../data/balance';

export interface EnergyState {
  current: number;
  /** Horodatage (horloge de confiance) du dernier point régénéré. */
  lastTick: number;
}

/** Applique la régénération jusqu'à `trustedNow`. Ne régénère pas au-delà du maximum, sans « banque » de temps. */
/** Maximum d'énergie selon le niveau de compte : 120 au niveau 1, +10 par niveau (900 au plus). */
export function energyMax(accountLevel: number): number {
  const E = BALANCE.energy;
  return Math.min(E.maxCap, E.max + E.perLevel * Math.max(0, Math.floor(accountLevel) - 1));
}

export function regenEnergy(e: EnergyState, trustedNow: number, max: number = BALANCE.energy.max): EnergyState {
  const regen = BALANCE.energy.regenMs;
  if (e.current >= max) return { current: e.current, lastTick: Math.max(e.lastTick, trustedNow) };
  const elapsed = trustedNow - e.lastTick;
  if (elapsed < regen) return e;
  const gained = Math.floor(elapsed / regen);
  const current = Math.min(max, e.current + gained);
  const lastTick = current >= max ? trustedNow : e.lastTick + gained * regen;
  return { current, lastTick };
}

export function msToNextEnergy(e: EnergyState, trustedNow: number, max: number = BALANCE.energy.max): number {
  if (e.current >= max) return 0;
  return Math.max(0, BALANCE.energy.regenMs - (trustedNow - e.lastTick));
}

export function spendEnergy(e: EnergyState, amount: number, trustedNow: number, max: number = BALANCE.energy.max): EnergyState | null {
  if (e.current < amount) return null;
  // Si on passe sous le max, le compte à rebours démarre maintenant.
  const wasFull = e.current >= max;
  return { current: e.current - amount, lastTick: wasFull ? trustedNow : e.lastTick };
}

export function addEnergy(e: EnergyState, amount: number): EnergyState {
  return { ...e, current: Math.min(BALANCE.energy.overflowCap, e.current + amount) };
}
