import type { SaveData, TeamPreset } from '../save/schema';
import type { UnitSetup } from './battle/types';
import { createBattle } from './battle/engine';
import { runToEnd } from './battle/simulate';
import { teamSetups } from './campaign';

// PRONOSTIC (v1.90.0, audit UX-3) — avant de lancer un combat, on le simule quelques fois avec le vrai moteur
// (en automatique, sans animation : quelques millisecondes) pour dire au joueur s'il est facile, équilibré ou risqué.
export type Odds = { wins: number; runs: number; label: 'Facile' | 'Équilibré' | 'Risqué'; tone: 'good' | 'mid' | 'bad' };

export function simulateOdds(s: SaveData, team: TeamPreset, waves: UnitSetup[][], turnLimit?: number, runs = 6): Odds | null {
  const allies = teamSetups(s, team);
  if (!allies.length || !waves.length) return null;
  let wins = 0;
  for (let i = 0; i < runs; i++) {
    const b = runToEnd(createBattle(allies, waves, { seed: 9001 + i * 7919, leaderUid: team.leader, turnLimit }));
    if (b.outcome === 'won') wins++;
  }
  const r = wins / runs;
  return r >= 0.8 ? { wins, runs, label: 'Facile', tone: 'good' } : r >= 0.45 ? { wins, runs, label: 'Équilibré', tone: 'mid' } : { wins, runs, label: 'Risqué', tone: 'bad' };
}
