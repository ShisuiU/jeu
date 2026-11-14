// Extrait de Battle.tsx (v1.98.0).
/** Place d'une unité sur la scène 2,5D : x et y (pieds) en % de la scène, s = échelle (profondeur). */
export type Place = { x: number; y: number; s: number };
/** Amplitude de la caméra selon la vitesse du combat. */
export const CAM_AMP: Record<number, number> = { 1: 1, 2: 0.55, 3: 0.3 };
const ALLY_PLACES: Place[][] = [
  [],
  [{ x: 50, y: 92, s: 1 }],
  [{ x: 36, y: 92, s: 1 }, { x: 64, y: 92, s: 1 }],
  [{ x: 50, y: 93, s: 1 }, { x: 24, y: 86, s: 0.92 }, { x: 76, y: 86, s: 0.92 }],
  [{ x: 37, y: 93, s: 1 }, { x: 63, y: 93, s: 1 }, { x: 16, y: 83, s: 0.86 }, { x: 84, y: 83, s: 0.86 }],
  [{ x: 50, y: 94, s: 1 }, { x: 29, y: 89, s: 0.93 }, { x: 71, y: 89, s: 0.93 }, { x: 13, y: 81, s: 0.82 }, { x: 87, y: 81, s: 0.82 }],
];
const FOE_PLACES: Place[][] = [
  [],
  [{ x: 50, y: 58, s: 0.86 }],
  [{ x: 34, y: 57, s: 0.82 }, { x: 66, y: 57, s: 0.82 }],
  [{ x: 50, y: 59, s: 0.84 }, { x: 25, y: 53, s: 0.76 }, { x: 75, y: 53, s: 0.76 }],
  [{ x: 37, y: 59, s: 0.82 }, { x: 63, y: 59, s: 0.82 }, { x: 16, y: 52, s: 0.72 }, { x: 84, y: 52, s: 0.72 }],
  [{ x: 50, y: 60, s: 0.8 }, { x: 29, y: 56, s: 0.76 }, { x: 71, y: 56, s: 0.76 }, { x: 13, y: 51, s: 0.68 }, { x: 87, y: 51, s: 0.68 }],
];
export function stagePlace(sd: 'ally' | 'enemy', n: number, i: number, boss: boolean): Place {
  const set = (sd === 'ally' ? ALLY_PLACES : FOE_PLACES)[Math.max(1, Math.min(5, n))];
  const p = set[Math.min(i, set.length - 1)];
  return boss ? { ...p, s: Math.min(1.08, p.s * 1.28), y: p.y + 2 } : p;
}
