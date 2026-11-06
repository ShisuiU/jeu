import { describe, expect, it } from 'vitest';
import { createNewSave, SAVE_VERSION } from '../src/save/schema';
import { migrateSave } from '../src/save/migrations';
import { generateGear, mainValue, seededRand, upgradeGear, gearBonus, campaignStars, dungeonStars, defaultStars } from '../src/game/gear';
import { GEAR_MAX_LEVEL, SETS, STAR_MULT } from '../src/data/equipment';
import { createBattle, beginTurn } from '../src/game/battle/engine';
import { buildUnit } from '../src/game/battle/setup';
import type { GearItem } from '../src/save/schema';

const rich = () => { const s = createNewSave(1000); s.resources.gold = 1e9; s.resources.forgeOre = 1e9; return s; };

describe('équipement façon Raid', () => {
  it('les étoiles fixent la statistique principale ; un ancien objet garde sa puissance', () => {
    const r = seededRand(1);
    const g3 = generateGear(r, 'epic', 1, 'weapon', 'fury', 3);
    const g6 = { ...g3, stars: 6 };
    expect(mainValue(g6) / mainValue(g3)).toBeCloseTo(STAR_MULT[6] / STAR_MULT[3], 1);
    // Ancien objet sans étoiles : autant d'étoiles que son rang de rareté.
    expect(defaultStars('legendary')).toBe(5);
    const { stars: _s, ...old } = generateGear(r, 'legendary', 1, 'weapon', 'fury', 5);
    expect(mainValue(old as GearItem)).toBe(mainValue({ ...(old as GearItem), stars: 5 }));
  });

  it('Mythique : 4 secondaires dont une déjà renforcée', () => {
    const g = generateGear(seededRand(7), 'mythic', 1, 'gloves', 'keen', 6);
    expect(g.subs).toHaveLength(4);
    expect(g.subs.reduce((n, x) => n + x.rolls, 0)).toBe(5);
    expect(g.stars).toBe(6);
  });

  it('amélioration jusqu’à +16 : renforcements aux niveaux 4, 8, 12 et 16', () => {
    const s = rich();
    const g = generateGear(seededRand(3), 'legendary', 1, 'armor', 'bulwark', 5);
    s.equipment.push(g);
    const r = seededRand(4);
    const boosts: number[] = [];
    for (let i = 0; i < 20; i++) { const res = upgradeGear(s, g.uid, r); if (res.boosted) boosts.push(g.level); }
    expect(g.level).toBe(GEAR_MAX_LEVEL);
    expect(GEAR_MAX_LEVEL).toBe(16);
    expect(boosts).toEqual([4, 8, 12, 16]);
    expect(g.subs.reduce((n, x) => n + x.rolls, 0)).toBe(8);
  });

  it('étoiles du butin : plus hautes en fin de campagne et en haut des donjons', () => {
    const avg = (f: (r: () => number) => number) => { const r = seededRand(9); let t = 0; for (let i = 0; i < 400; i++) t += f(r); return t / 400; };
    expect(avg((r) => campaignStars(r, 8, false))).toBeGreaterThan(avg((r) => campaignStars(r, 1, false)) + 3);
    expect(avg((r) => dungeonStars(r, 10))).toBeGreaterThan(avg((r) => dungeonStars(r, 1)) + 2.5);
    for (let i = 0; i < 200; i++) { const v = dungeonStars(seededRand(i), 10); expect(v).toBeGreaterThanOrEqual(1); expect(v).toBeLessThanOrEqual(6); }
  });

  it('ensembles à effet : Pérennité soigne à chaque tour, Élan donne de la jauge au départ', () => {
    const mk = (set: 'perennial' | 'momentum') => Array.from({ length: 4 }, (_, i) => generateGear(seededRand(20 + i), 'rare', 1, (['weapon', 'helmet', 'armor', 'gloves'] as const)[i], set, 3));
    const regen = gearBonus(mk('perennial'));
    const tm = gearBonus(mk('momentum'));
    expect(regen.regen).toBe(3);
    expect(tm.startTm).toBe(30);
    expect(SETS.perennial.pieces).toBe(4);
    const u = buildUnit({ kind: 'hero', refId: 'aldric', slot: 0, level: 20, gear: regen }, 'ally', 0);
    expect(u.flags.setRegen).toBe(3);
    // Élan : l'allié équipé part avec au moins 30 % de jauge.
    const b = createBattle([{ kind: 'hero', refId: 'aldric', slot: 0, level: 20, gear: tm }], [[{ kind: 'enemy', refId: 'hollow_soldier', slot: 0, level: 1 }]], { seed: 5 });
    const ally = b.units.find((x) => x.side === 'ally')!;
    expect(ally.tm).toBeGreaterThanOrEqual(300);
    // Pérennité : un héros blessé reprend des PV au début de son tour.
    const b2 = createBattle([{ kind: 'hero', refId: 'aldric', slot: 0, level: 20, gear: regen }], [[{ kind: 'enemy', refId: 'hollow_soldier', slot: 0, level: 1 }]], { seed: 5 });
    const a2 = b2.units.find((x) => x.side === 'ally')!;
    a2.hp = Math.round(a2.base.hp * 0.5); a2.tm = 999; for (const e of b2.units.filter((x) => x.side === 'enemy')) e.tm = 0;
    const before = a2.hp; beginTurn(b2);
    expect(a2.hp).toBeGreaterThan(before);
  });

  it('migration v4 → v5 : chaque objet reçoit ses étoiles', () => {
    const old = createNewSave(1000) as unknown as Record<string, unknown>;
    old.version = 4;
    const { stars: _a, ...g1 } = generateGear(seededRand(1), 'epic', 1);
    const { stars: _b, ...g2 } = generateGear(seededRand(2), 'common', 1);
    old.equipment = [g1, g2];
    const s = migrateSave(old);
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.equipment.map((g) => g.stars)).toEqual([4, 1]);
  });
});
