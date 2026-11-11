import type { SaveData } from '../save/schema';
import { DIFFICULTIES, DIFFICULTY_ORDER, type DifficultyId } from '../data/campaign';
import { DUNGEON_DIFF_OPEN, DUNGEON_FLOORS } from '../data/dungeons';

// Progression des donjons par difficulté. Normal garde son ancien champ `bestFloor` (sauvegardes existantes) ;
// les autres difficultés vont dans `best`.
export function dungeonBest(s: SaveData, dungeonId: string, diff: DifficultyId = 'normal'): number {
  const p = s.progress.dungeons[dungeonId];
  if (!p) return 0;
  return diff === 'normal' ? p.bestFloor : p.best?.[diff] ?? 0;
}

export function setDungeonBest(s: SaveData, dungeonId: string, diff: DifficultyId, floor: number) {
  const p = (s.progress.dungeons[dungeonId] ??= { bestFloor: 0 });
  if (diff === 'normal') p.bestFloor = Math.max(p.bestFloor, floor);
  else (p.best ??= {})[diff] = Math.max(p.best[diff] ?? 0, floor);
}

/** La difficulté est-elle ouverte pour ce donjon ? (la précédente terminée : étage 15) */
export function dungeonDiffOpen(s: SaveData, dungeonId: string, diff: DifficultyId): boolean {
  const i = DIFFICULTY_ORDER.indexOf(diff);
  if (i <= 0) return true;
  if (!DIFFICULTIES[diff].available) return false;
  return dungeonBest(s, dungeonId, DIFFICULTY_ORDER[i - 1]) >= DUNGEON_DIFF_OPEN;
}

/** Peut-on combattre cet étage ? */
export function dungeonFloorCheck(s: SaveData, dungeonId: string, diff: DifficultyId, floor: number): { ok: boolean; reason?: string } {
  if (!dungeonDiffOpen(s, dungeonId, diff)) {
    const prev = DIFFICULTIES[DIFFICULTY_ORDER[DIFFICULTY_ORDER.indexOf(diff) - 1]].name;
    return { ok: false, reason: `${DIFFICULTIES[diff].name} : termine d’abord le ${prev} (étage ${DUNGEON_DIFF_OPEN}).` };
  }
  if (floor > Math.min(DUNGEON_FLOORS, dungeonBest(s, dungeonId, diff) + 1)) return { ok: false, reason: 'Termine l’étage précédent.' };
  return { ok: true };
}

/** Plus haute difficulté ouverte (pour ouvrir l'écran du donjon au bon endroit). */
export const dungeonTopDiff = (s: SaveData, dungeonId: string): DifficultyId =>
  [...DIFFICULTY_ORDER].reverse().find((d) => dungeonDiffOpen(s, dungeonId, d)) ?? 'normal';
