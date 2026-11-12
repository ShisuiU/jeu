import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { collectMine, collectTraining, mineReady, placeTrainee, unlockTrainSlot, upgradeMine } from '../src/game/buildings';
import { migrateSave } from '../src/save/migrations';

const H = 3600_000;
describe('Bâtiments (v1.78.0)', () => {
  it('la Mine produit 1 diamant par heure, plafonnée à 24 h', () => {
    const t = 1_800_000_000_000; const s = createNewSave(t);
    expect(mineReady(s, t + 2.5 * H)).toBe(2);
    expect(collectMine(s, t + 2.5 * H)).toBe(2);
    expect(s.resources.diamonds).toBe(2);
    expect(mineReady(s, t + 3 * H)).toBe(1); // la demi-heure entamée est gardée
    expect(mineReady(s, t + 100 * H)).toBe(24);
  });
  it('améliorations payées en diamants : 2 puis 3 par heure', () => {
    const t = 1_800_000_000_000; const s = createNewSave(t);
    expect(upgradeMine(s, t).ok).toBe(false);
    s.resources.diamonds = 120;
    expect(upgradeMine(s, t).ok).toBe(true);
    expect(s.buildings.mineLevel).toBe(2);
    expect(mineReady(s, t + 3 * H)).toBe(6);
    s.resources.diamonds = 300;
    expect(upgradeMine(s, t + 3 * H).ok).toBe(true);
    expect(upgradeMine(s, t + 3 * H).ok).toBe(false);
  });
  it('terrain : une place gratuite, deux à ouvrir ; les héros gagnent un peu d’expérience', () => {
    const t = 1_800_000_000_000; const s = createNewSave(t);
    const h = s.heroes[0]; const lv = h.level, xp = h.xp;
    expect(placeTrainee(s, 1, h.uid, t).ok).toBe(false);
    expect(placeTrainee(s, 0, h.uid, t).ok).toBe(true);
    const r = collectTraining(s, t + 10 * H);
    expect(r[0].xp).toBeGreaterThan(0);
    expect(h.level * 100000 + h.xp).toBeGreaterThan(lv * 100000 + xp);
    expect(unlockTrainSlot(s).ok).toBe(false);
    s.resources.diamonds = 100;
    expect(unlockTrainSlot(s).ok).toBe(true);
    expect(s.buildings.trainSlots).toBe(2);
  });
  it('les anciennes sauvegardes reçoivent les bâtiments', () => {
    const s = createNewSave(Date.now()) as unknown as Record<string, unknown>;
    delete s.buildings;
    const m = migrateSave(JSON.parse(JSON.stringify(s)));
    expect(m.buildings.mineLevel).toBe(1);
    expect(m.buildings.train).toHaveLength(3);
  });
});
