import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { applyResets, claimSeasonReward } from '../src/game/missions';
import { applyMode } from '../src/game/modes';
import { ARENA_TIERS } from '../src/data/arena';
import { generateOpponents } from '../src/game/arena';
import { seededRand } from '../src/game/gear';

const T0 = Date.parse('2026-11-10T12:00:00Z');
const WEEK = 7 * 86400_000;

describe('saisons d’Arène (v1.68.15)', () => {
  it('pas de récompense à la victoire, mais à la fin de la saison selon la ligue', () => {
    const s = createNewSave(T0); s.time.highWater = T0; applyResets(s, T0);
    expect(s.arena.season).toBeTruthy();
    s.arena.opponents = generateOpponents(s, seededRand(1));
    const gold = s.resources.gold;
    const res = applyMode(s, { mode: 'arena', opponentId: s.arena.opponents[0].id }, { won: true, alliesDead: 0, participants: [s.heroes[0].uid] }, T0);
    expect(Object.keys(res.reward)).toHaveLength(0);
    expect(s.resources.gold).toBe(gold);
    expect(s.arena.seasonFights).toBe(1);
    s.arena.rating = 1400; // ligue Or
    applyResets(s, T0 + WEEK);
    expect(s.arena.seasonReward?.tier).toBe('gold');
    expect(s.arena.rating).toBe(1200); // la moitié des points au-dessus de 1000 est gardée
    expect(s.arena.seasonFights).toBe(0);
    const cr = s.resources.crystals;
    claimSeasonReward(s);
    expect(s.resources.crystals).toBe(cr + ARENA_TIERS.find((t) => t.id === 'gold')!.season.crystals!);
    expect(s.arena.seasonReward).toBeNull();
  });
  it('rien sans avoir combattu, et un classement sous 1000 n’est pas baissé', () => {
    const s = createNewSave(T0); s.time.highWater = T0; applyResets(s, T0);
    s.arena.rating = 900;
    applyResets(s, T0 + WEEK);
    expect(s.arena.seasonReward ?? null).toBeNull();
    expect(s.arena.rating).toBe(900);
  });
});
