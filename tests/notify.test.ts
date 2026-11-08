import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { progressKey } from '../src/data/campaign';
import { BALANCE } from '../src/data/balance';
import { CAMP_MAX_HOURS } from '../src/game/camp';
import { DEFAULT_PREFS, isQuiet, nextDue, pushTimes } from '../src/game/notify';

const T0 = new Date(2026, 10, 9, 12).getTime();
const H = 3600 * 1000;

describe('Notifications : heures à annoncer', () => {
  it('énergie pleine : rien ; énergie dépensée : l’heure où elle sera pleine', () => {
    const s = createNewSave(T0);
    expect(pushTimes(s, T0).energyAt).toBe(0);
    s.energy = { current: BALANCE.energy.max - 3, lastTick: T0 };
    expect(pushTimes(s, T0).energyAt).toBe(T0 + 3 * BALANCE.energy.regenMs);
    // Une partie de la régénération est déjà faite : l'heure ne bouge pas.
    expect(pushTimes(s, T0 + BALANCE.energy.regenMs + 5).energyAt).toBe(T0 + 3 * BALANCE.energy.regenMs);
  });
  it('camp : seulement une fois ouvert, et seulement s’il n’est pas déjà plein', () => {
    const s = createNewSave(T0);
    expect(pushTimes(s, T0).campAt).toBe(0); // pas encore ouvert
    s.progress.campaign[progressKey('normal', '1-4')] = { clears: 1, stars: 3 } as never;
    s.camp = { since: T0 };
    expect(pushTimes(s, T0 + H).campAt).toBe(T0 + CAMP_MAX_HOURS * H);
    expect(pushTimes(s, T0 + 13 * H).campAt).toBe(0); // déjà plein
  });
  it('prochaine annonce selon les choix ; jamais la nuit', () => {
    const t = { campAt: 500, energyAt: 300 };
    expect(nextDue(t, DEFAULT_PREFS)).toBe(300);
    expect(nextDue(t, { ...DEFAULT_PREFS, energy: false })).toBe(500);
    expect(nextDue({ campAt: 0, energyAt: 0 }, DEFAULT_PREFS)).toBe(0);
    const paris = -60; // UTC+1
    expect(isQuiet(Date.UTC(2026, 10, 9, 22, 30), paris)).toBe(true); // 23 h 30
    expect(isQuiet(Date.UTC(2026, 10, 9, 6, 30), paris)).toBe(true); // 7 h 30
    expect(isQuiet(Date.UTC(2026, 10, 9, 7, 0), paris)).toBe(false); // 8 h
    expect(isQuiet(Date.UTC(2026, 10, 9, 12, 0), paris)).toBe(false);
  });
});
