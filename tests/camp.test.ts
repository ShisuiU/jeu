import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { migrateSave as migrate } from '../src/save/migrations';
import { CAMP_MAX_HOURS, campLoot, campRates, claimCamp } from '../src/game/camp';
import { progressKey } from '../src/data/campaign';
import { CHAPTERS } from '../src/data/campaign';

const T0 = new Date(2026, 10, 9, 12).getTime();
const H = 3600 * 1000;

describe('Camp des Héritiers (butin d’absence)', () => {
  it('s’accumule avec le temps, plafonne à 12 h', () => {
    const s = createNewSave(T0);
    expect(campLoot(s, T0 + 5 * 60_000).crystals).toBeUndefined();
    const six = campLoot(s, T0 + 6 * H).gold!;
    const twelve = campLoot(s, T0 + CAMP_MAX_HOURS * H).gold!;
    expect(twelve).toBeGreaterThan(six);
    expect(campLoot(s, T0 + 48 * H)).toEqual(campLoot(s, T0 + CAMP_MAX_HOURS * H));
  });
  it('récupérer verse le butin et relance le compteur ; pas avant 10 minutes', () => {
    const s = createNewSave(T0);
    expect(claimCamp(s, T0 + 60_000).ok).toBe(false);
    const gold = s.resources.gold;
    const r = claimCamp(s, T0 + 8 * H);
    expect(r.ok).toBe(true);
    expect(s.resources.gold).toBeGreaterThan(gold);
    expect(campLoot(s, T0 + 8 * H)).toEqual({});
  });
  it('rapporte plus quand la campagne avance', () => {
    const s = createNewSave(T0);
    const before = campRates(s).gold;
    for (const st of CHAPTERS[0].stages) s.progress.campaign[progressKey('normal', st.id)] = { clears: 1, stars: 3 } as never;
    expect(campRates(s).gold).toBeGreaterThan(before);
  });
  it('une ancienne sauvegarde reçoit un camp', () => {
    const old = createNewSave(T0) as unknown as Record<string, unknown>;
    delete old.camp;
    expect(migrate(old).camp.since).toBe(T0);
  });
});
