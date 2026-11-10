import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { WHEEL, spinWheel, wheelReady } from '../src/game/wheel';

const T0 = Date.parse('2026-11-10T12:00:00Z');

describe('roue quotidienne (v1.68.18)', () => {
  it('un tour par jour, la récompense est donnée', () => {
    const s = createNewSave(T0);
    expect(wheelReady(s, T0)).toBe(true);
    const e = s.energy.current;
    const r = spinWheel(s, T0, () => 0); // première case : 5 énergie
    expect(r?.slot.id).toBe('e5');
    expect(s.energy.current).toBe(e + 5);
    expect(wheelReady(s, T0 + 3600_000)).toBe(false);
    expect(spinWheel(s, T0 + 3600_000)).toBeNull();
    expect(wheelReady(s, T0 + 86400_000)).toBe(true);
  });
  it('8 cases dont 5, 10, 30, 50 énergie et un Éclat de faille rare', () => {
    expect(WHEEL).toHaveLength(8);
    expect(WHEEL.filter((w) => w.reward.energy).map((w) => w.reward.energy).sort((a, b) => a! - b!)).toEqual([5, 10, 30, 50]);
    const f = WHEEL.find((w) => w.reward.shardEvent)!;
    expect(f.weight).toBeLessThan(Math.min(...WHEEL.filter((w) => w !== f).map((w) => w.weight)));
    const s = createNewSave(T0);
    const ev = s.resources.shardEvent;
    spinWheel(s, T0, () => 0.999);
    expect(s.resources.shardEvent).toBe(ev + 1);
  });
});
