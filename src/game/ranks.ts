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
