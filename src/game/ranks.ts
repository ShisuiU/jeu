import type { SaveData } from '../save/schema';
import { playerTeamPower } from './arena';

// CLASSEMENTS EN LIGNE — ce que l'on publie de la partie (aucune donnée personnelle : pseudo et scores).
export type RankField = 'arena' | 'tower' | 'boss' | 'power';
export interface RankEntry { name: string; avatar: string; level: number; arena: number; tower: number; boss: number; power: number; updatedAt: number }

export const RANK_TABS: { id: RankField; label: string; unit: string }[] = [
  { id: 'arena', label: 'Arène', unit: 'points' },
  { id: 'tower', label: 'Tour', unit: 'étage' },
  { id: 'boss', label: 'Boss', unit: 'dégâts' },
  { id: 'power', label: 'Puissance', unit: 'puissance' },
];

export function rankEntry(s: SaveData): RankEntry {
  return {
    name: (s.profile.name || 'Héritier').trim().slice(0, 18),
    avatar: s.profile.avatarHeroId,
    level: s.profile.level,
    arena: Math.round(s.arena.rating),
    tower: s.progress.tower.floor,
    boss: Math.max(0, ...Object.values(s.worldBoss.best ?? {}).map((v) => Math.round(v || 0))),
    power: playerTeamPower(s),
    updatedAt: s.updatedAt,
  };
}

// HÉRITIERS IMAGINAIRES — tant qu'il y a peu de joueurs, le classement est complété jusqu'à 10 lignes par des
// rivaux inventés, toujours signalés « Imaginaire » (les mêmes chaque jour, sans jamais remplacer un vrai joueur).
const GHOSTS = ['Hadrik', 'Corbeau-Sel', 'Isaure', 'Mavren', 'Liessa', 'Tobrin', 'Ysmé', 'Garance', 'Orlan', 'Séverine'];
const GHOST_AVATARS = ['aldric', 'elowen', 'torvald', 'brann', 'corvin', 'ysolde', 'maelis', 'orin', 'kaedra', 'tamsin'];
const GHOST_SCORE: Record<RankField, (i: number) => number> = {
  arena: (i) => 1500 - i * 55, tower: (i) => 42 - i * 4, boss: (i) => 64 - i * 6, power: (i) => 42000 - i * 3600,
};
export const GHOST_PREFIX = 'ghost:';
export function ghostRanks(field: RankField, realCount: number, want = 10): (RankEntry & { uid: string })[] {
  const n = Math.max(0, want - realCount);
  return Array.from({ length: n }, (_, i) => {
    const score = Math.max(1, GHOST_SCORE[field](i));
    return { uid: `${GHOST_PREFIX}${i}`, name: GHOSTS[i % GHOSTS.length], avatar: GHOST_AVATARS[i % GHOST_AVATARS.length], level: Math.max(5, 40 - i * 3), arena: 0, tower: 0, boss: 0, power: 0, [field]: score, updatedAt: 0 } as RankEntry & { uid: string };
  });
}
