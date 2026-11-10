import type { SaveData } from '../save/schema';
import type { Reward } from '../data/resources';
import { dayKey } from '../core/time';
import { applyReward } from './rewards';

// ROUE QUOTIDIENNE (v1.68.18) — un tour gratuit par jour, depuis l'Accueil. 12 cases ; l'Éclat de faille est la plus rare.
export interface WheelSlot { id: string; reward: Reward; weight: number; label: string; short: string; color: string }
// 12 cases (v1.68.19) : l'énergie et les élixirs en quatre tailles chacun, de l'or, des cristaux, et l'Éclat de faille.
export const WHEEL: WheelSlot[] = [
  { id: 'e5', reward: { energy: 5 }, weight: 14, label: '5 énergie', short: '5', color: '#24506b' },
  { id: 'x1', reward: { xpElixir: 1 }, weight: 12, label: '1 élixir', short: '×1', color: '#33522a' },
  { id: 'g5', reward: { gold: 5000 }, weight: 12, label: '5 000 or', short: '5 000', color: '#6b4c1c' },
  { id: 'e10', reward: { energy: 10 }, weight: 12, label: '10 énergie', short: '10', color: '#24506b' },
  { id: 'x3', reward: { xpElixir: 3 }, weight: 10, label: '3 élixirs', short: '×3', color: '#33522a' },
  { id: 'cr', reward: { crystals: 30 }, weight: 9, label: '30 cristaux', short: '30', color: '#1d5560' },
  { id: 'e30', reward: { energy: 30 }, weight: 7, label: '30 énergie', short: '30', color: '#24506b' },
  { id: 'x5', reward: { xpElixir: 5 }, weight: 7, label: '5 élixirs', short: '×5', color: '#33522a' },
  { id: 'g15', reward: { gold: 15000 }, weight: 6, label: '15 000 or', short: '15 000', color: '#6b4c1c' },
  { id: 'e50', reward: { energy: 50 }, weight: 4, label: '50 énergie', short: '50', color: '#24506b' },
  { id: 'x10', reward: { xpElixir: 10 }, weight: 4, label: '10 élixirs', short: '×10', color: '#33522a' },
  { id: 'faille', reward: { shardEvent: 1 }, weight: 3, label: 'Éclat de faille', short: 'Faille', color: '#6e1730' },
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
