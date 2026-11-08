import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { progressKey } from '../src/data/campaign';
import { UNLOCK_AT, isUnlocked, unlockOrder, type Feature } from '../src/game/unlocks';
import { activeMissions, bonusAvailable } from '../src/game/missions';

describe('Déblocages étalés', () => {
  it('un mode à la fois, sur les chapitres 1 à 4, jamais deux au même niveau', () => {
    const order = (Object.keys(UNLOCK_AT) as Feature[]).map(unlockOrder).sort((a, b) => a - b);
    expect(new Set(order).size).toBe(order.length);
    for (let i = 1; i < order.length; i++) expect(order[i] - order[i - 1]).toBeGreaterThanOrEqual(3);
    expect(Math.max(...order)).toBeLessThan(500);
    expect((Object.values(UNLOCK_AT)).filter((x) => x.startsWith('1-')).length).toBeLessThanOrEqual(2);
  });
  it('un mode déjà découvert reste ouvert', () => {
    const s = createNewSave(0);
    expect(isUnlocked(s, 'arena')).toBe(false);
    s.flags.unl_arena = true;
    expect(isUnlocked(s, 'arena')).toBe(true);
    const t = createNewSave(0);
    t.progress.campaign[progressKey('normal', UNLOCK_AT.dungeons)] = { clears: 1, stars: 3 } as never;
    expect(isUnlocked(t, 'dungeons')).toBe(true);
  });
  it('les missions des modes fermés sont masquées et ne bloquent pas le bonus', () => {
    const s = createNewSave(0);
    const ids = activeMissions(s, 'daily').map((m) => m.id);
    expect(ids).not.toContain('d_arena');
    expect(ids).not.toContain('d_dungeon');
    expect(ids).toContain('d_win5');
    s.missions.daily.claimed = ids;
    expect(bonusAvailable(s, 'daily')).toBe(true);
  });
});
