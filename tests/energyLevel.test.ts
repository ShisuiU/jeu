import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { energyMax, regenEnergy } from '../src/game/energy';
import { accountXpToNext, addAccountXp } from '../src/game/progression';
import { payEnergy } from '../src/game/campaign';
import { BALANCE } from '../src/data/balance';

describe('énergie et niveau de compte (v1.68.7)', () => {
  it('le maximum grandit de 2 par niveau, plafonné', () => {
    expect(energyMax(1)).toBe(120);
    expect(energyMax(2)).toBe(122);
    expect(energyMax(31)).toBe(180);
    expect(energyMax(500)).toBe(BALANCE.energy.maxCap);
  });
  it('un nouveau niveau de compte recharge toute l’énergie jusqu’au nouveau maximum', () => {
    const s = createNewSave(0);
    s.energy.current = 7;
    addAccountXp(s, accountXpToNext(s.profile.level));
    expect(s.profile.level).toBe(2);
    expect(s.energy.current).toBe(122);
  });
  it('un surplus au-delà du maximum (récompenses) est gardé', () => {
    const s = createNewSave(0);
    s.energy.current = 300;
    addAccountXp(s, accountXpToNext(s.profile.level));
    expect(s.energy.current).toBe(300);
  });
  it('la régénération va jusqu’au maximum du niveau', () => {
    const s = createNewSave(0);
    s.profile.level = 11; // maximum 140
    s.energy = { current: 120, lastTick: 0 };
    expect(regenEnergy(s.energy, 100 * BALANCE.energy.regenMs, energyMax(s.profile.level)).current).toBe(140);
    s.energy = { current: 140, lastTick: 0 };
    expect(payEnergy(s, 10, 1000)).toBe(true);
    expect(s.energy.current).toBe(130);
  });
});
