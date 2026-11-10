import type { SaveData } from '../save/schema';
import type { Reward } from '../data/resources';
import { dayKey } from '../core/time';
import { applyReward } from './rewards';

// ROUE QUOTIDIENNE (v1.68.18) — un tour gratuit par jour, depuis l'Accueil. 8 cases ; l'Éclat de faille est la plus rare.
export interface WheelSlot { id: string; reward: Reward; weight: number; label: string; color: string }
export const WHEEL: WheelSlot[] = [
  { id: 'e5', reward: { energy: 5 }, weight: 22, label: '5 énergie', color: '#2f6f8f' },
  { id: 'gold', reward: { gold: 5000 }, weight: 18, label: '5 000 or', color: '#8a6a22' },
  { id: 'e10', reward: { energy: 10 }, weight: 18, label: '10 énergie', color: '#2a5a86' },
  { id: 'xp', reward: { xpElixir: 3 }, weight: 13, label: '3 élixirs', color: '#3f6a2a' },
  { id: 'e30', reward: { energy: 30 }, weight: 9, label: '30 énergie', color: '#22508f' },
  { id: 'cr', reward: { crystals: 30 }, weight: 12, label: '30 cristaux', color: '#1f6a78' },
  { id: 'e50', reward: { energy: 50 }, weight: 5, label: '50 énergie', color: '#1c3f9a' },
  { id: 'faille', reward: { shardEvent: 1 }, weight: 3, label: 'Éclat de faille', color: '#8a1f3c' },
];

export const wheelReady = (s: SaveData, now: number) => s.wheel?.day !== dayKey(now);

/** Tourne la roue (mutation) : renvoie la case gagnée, ou null si le tour du jour est déjà joué. */
export function spinWheel(s: SaveData, now: number, rand: () => number = Math.random): { index: number; slot: WheelSlot } | null {
  if (!wheelReady(s, now)) return null;
  const total = WHEEL.reduce((a, w) => a + w.weight, 0);
  let x = rand() * total, index = WHEEL.length - 1;
  for (let i = 0; i < WHEEL.length; i++) { x -= WHEEL[i].weight; if (x < 0) { index = i; break; } }
  const slot = WHEEL[index];
  applyReward(s, slot.reward); // l'énergie peut dépasser le maximum (comme les autres récompenses)
  s.wheel = { day: dayKey(now), last: slot.id };
  return { index, slot };
}
