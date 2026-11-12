import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { buyOffer, ensureMarket, refreshMarket } from '../src/game/market';
import { MARKET_REFRESH_COSTS, MARKET_SLOTS } from '../src/data/market';
import { GEAR_INVENTORY_CAP } from '../src/data/equipment';
import { applyResets } from '../src/game/missions';

const T0 = new Date(2026, 10, 9, 12).getTime();
const DAY = 24 * 3600 * 1000;
const rich = () => { const s = createNewSave(T0); s.time.highWater = T0; s.resources.gold = 1e7; s.resources.crystals = 1e5; return s; };

describe('Marché', () => {
  it('6 offres différentes, identiques toute la journée, nouvelles le lendemain', () => {
    const s = rich();
    const a = ensureMarket(s, T0).offers.map((o) => o.id);
    expect(a).toHaveLength(MARKET_SLOTS);
    expect(new Set(a).size).toBe(MARKET_SLOTS);
    expect(ensureMarket(s, T0 + 3600e3).offers.map((o) => o.id)).toEqual(a);
    let changed = false;
    for (let d = 1; d <= 5 && !changed; d++) changed = ensureMarket(s, T0 + d * DAY).offers.map((o) => o.id).join() !== a.join();
    expect(changed).toBe(true);
  });

  it('acheter : prix payé, objet reçu, une seule fois', () => {
    const s = rich();
    const m = ensureMarket(s, T0);
    for (let i = 0; i < m.offers.length; i++) {
      const o = m.offers[i];
      const cur = o.price.resource;
      const before = s.resources[cur], gear = s.equipment.length;
      expect(buyOffer(s, i, T0).ok).toBe(true);
      expect(s.resources[cur]).toBe(before - o.price.amount + (o.reward?.[cur] ?? 0));
      if (o.gear) expect(s.equipment.length).toBe(gear + 1);
      expect(buyOffer(s, i, T0).ok).toBe(false);
    }
  });

  it('refuse sans assez d’or ou avec un sac plein', () => {
    const s = rich(); s.resources.gold = 0; s.resources.crystals = 0;
    const m = ensureMarket(s, T0);
    for (let i = 0; i < m.offers.length; i++) expect(buyOffer(s, i, T0).ok).toBe(false);
    const s2 = rich();
    for (let d = 0; d < 30; d++) {
      const m2 = ensureMarket(s2, T0 + d * DAY);
      const gi = m2.offers.findIndex((o) => o.gear);
      if (gi < 0) continue;
      s2.equipment = Array.from({ length: GEAR_INVENTORY_CAP }, () => ({ ...m2.offers[gi].gear!, uid: Math.random().toString(36) }));
      expect(buyOffer(s2, gi, T0 + d * DAY).reason).toMatch(/Sac/);
      return;
    }
  });

  it('renouvellements : 3 par jour, prix croissant, remis à zéro chaque jour', () => {
    const s = rich();
    ensureMarket(s, T0);
    s.resources.diamonds = 100;
    const c0 = s.resources.diamonds;
    for (const c of MARKET_REFRESH_COSTS) expect(refreshMarket(s, T0).ok).toBe(true), void c;
    expect(s.resources.diamonds).toBe(c0 - MARKET_REFRESH_COSTS.reduce((a, b) => a + b, 0));
    expect(refreshMarket(s, T0).ok).toBe(false);
    applyResets(s, T0 + DAY);
    expect(ensureMarket(s, T0 + DAY).refreshes).toBe(0);
  });

  it('les offres avancées n’apparaissent pas au début du jeu', () => {
    const s = rich();
    for (let d = 0; d < 40; d++) {
      const ids = ensureMarket(s, T0 + d * DAY).offers.map((o) => o.id);
      expect(ids).not.toContain('psupreme');
      expect(ids).not.toContain('g_leg');
    }
  });
});
