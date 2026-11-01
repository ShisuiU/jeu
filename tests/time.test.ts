import { describe, expect, it } from 'vitest';
import { dayKey, observeTime } from '../src/core/time';
import { regenEnergy, spendEnergy } from '../src/game/energy';
import { BALANCE } from '../src/data/balance';

const H = 3600_000;

describe('horloge de confiance', () => {
  it('avance normalement', () => {
    const o = observeTime({ highWater: 1000, lastSeen: 1000, rollbackCount: 0 }, 5000);
    expect(o.trusted).toBe(5000);
    expect(o.rollback).toBe(false);
  });
  it('ignore un recul d’horloge et le comptabilise une seule fois', () => {
    const t0 = { highWater: 100 * H, lastSeen: 100 * H, rollbackCount: 0 };
    const o1 = observeTime(t0, 50 * H);
    expect(o1.rollback).toBe(true);
    expect(o1.trusted).toBe(100 * H);
    expect(o1.time.rollbackCount).toBe(1);
    const o2 = observeTime(o1.time, 50 * H + 1000);
    expect(o2.time.rollbackCount).toBe(1);
  });
  it('tolère un petit décalage', () => {
    const o = observeTime({ highWater: 100 * H, lastSeen: 100 * H, rollbackCount: 0 }, 100 * H - 60_000);
    expect(o.rollback).toBe(false);
    expect(o.trusted).toBe(100 * H);
  });
  it('clé de jour avec renouvellement à 5 h', () => {
    const d = new Date(2026, 10, 2, 4, 59).getTime();
    expect(dayKey(d)).toBe('2026-11-01');
    expect(dayKey(new Date(2026, 10, 2, 5, 1).getTime())).toBe('2026-11-02');
  });
});

describe('énergie', () => {
  const R = BALANCE.energy.regenMs;
  it('régénère 1 point par intervalle et garde le reliquat', () => {
    const e = regenEnergy({ current: 10, lastTick: 0 }, R * 3 + 500);
    expect(e.current).toBe(13);
    expect(e.lastTick).toBe(R * 3);
  });
  it('plafonne au maximum sans accumuler de temps', () => {
    const e = regenEnergy({ current: 110, lastTick: 0 }, R * 1000);
    expect(e.current).toBe(BALANCE.energy.max);
    expect(e.lastTick).toBe(R * 1000);
  });
  it('ne régénère rien si l’heure recule (heure de confiance figée)', () => {
    const e = regenEnergy({ current: 10, lastTick: 10 * R }, 5 * R);
    expect(e.current).toBe(10);
  });
  it('dépense', () => {
    expect(spendEnergy({ current: 5, lastTick: 0 }, 6, 0)).toBeNull();
    expect(spendEnergy({ current: 120, lastTick: 0 }, 8, 999)?.lastTick).toBe(999);
  });
});
