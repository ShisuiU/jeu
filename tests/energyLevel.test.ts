import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { energyMax, regenEnergy } from '../src/game/energy';
import { accountXpToNext, addAccountXp } from '../src/game/progression';
import { payEnergy } from '../src/game/campaign';
import { BALANCE } from '../src/data/balance';

describe('énergie et niveau de compte (v1.68.7)', () => {
  it('le maximum grandit de 10 par niveau, plafonné', () => {
    expect(energyMax(1)).toBe(120);
    expect(energyMax(2)).toBe(130);
    expect(energyMax(31)).toBe(420);
    expect(energyMax(5000)).toBe(BALANCE.energy.maxCap);
  });
  it('un nouveau niveau de compte recharge toute l’énergie jusqu’au nouveau maximum', () => {
    const s = createNewSave(0);
    s.energy.current = 7;
    addAccountXp(s, accountXpToNext(s.profile.level));
    expect(s.profile.level).toBe(2);
    expect(s.energy.current).toBe(130);
  });
  it('un surplus au-delà du maximum (récompenses) est gardé', () => {
    const s = createNewSave(0);
    s.energy.current = 300;
    addAccountXp(s, accountXpToNext(s.profile.level));
    expect(s.energy.current).toBe(300);
  });
  it('la régénération va jusqu’au maximum du niveau', () => {
    const s = createNewSave(0);
    s.profile.level = 3; // maximum 140
    s.energy = { current: 120, lastTick: 0 };
    expect(regenEnergy(s.energy, 100 * BALANCE.energy.regenMs, energyMax(s.profile.level)).current).toBe(140);
    s.energy = { current: 140, lastTick: 0 };
    expect(payEnergy(s, 10, 1000)).toBe(true);
    expect(s.energy.current).toBe(130);
  });
  it('plus de montée en boucle : dès le niveau 8, une barre pleine ne suffit plus pour un niveau (v1.70.1)', () => {
    for (let L = 8; L <= 120; L++) expect(accountXpToNext(L), `niveau ${L}`).toBeGreaterThan(energyMax(L) * 10);
    expect(accountXpToNext(30) / (energyMax(30) * 10)).toBeGreaterThan(3.5);
  });
});
