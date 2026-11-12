import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { applyDefenseLog, defenseDoc, generateOpponents, playerTeamPower } from '../src/game/arena';
import { seededRand } from '../src/game/gear';
import { ARENA_NAMES } from '../src/data/arena';
import { HEROES } from '../src/data/heroes';
import { withName } from '../src/ui/components/Dialogue';

const T0 = new Date(2026, 10, 9, 12).getTime();

describe('Arène honnête', () => {
  it('sans classement : adversaires imaginaires, jamais un nom de héros du jeu', () => {
    const ops = generateOpponents(createNewSave(T0), seededRand(1), []);
    expect(ops).toHaveLength(3);
    expect(ops.every((o) => !o.real)).toBe(true);
    const heroNames = HEROES.map((h) => h.name.split(' ')[0]);
    for (const n of ARENA_NAMES) expect(heroNames, n).not.toContain(n.replace(/^Dame /, ''));
  });
  it('avec un compte : de vrais joueurs DE SA LIGUE, quelle que soit leur puissance (v1.68.13)', () => {
    const s = createNewSave(T0); // ligue Bronze (1000)
    const p = playerTeamPower(s);
    const def = (uid: string, name: string, ratio: number, refId: string, rating = 1000) => ({ uid, name, avatar: refId, level: 5, rating, updatedAt: 1, power: Math.round(p * ratio),
      team: [{ refId, slot: 0, level: 30, rank: 3, ascension: 2, awaken: 1, skillLevels: {}, gear: undefined }] });
    const pool = [def('c', 'Chloé', 5, 'varkhaal'), def('a', 'Alice', 0.72, 'kaedra'), def('b', 'Bilal', 0.98, 'solenne'), def('d', 'Dora', 1, 'brann', 1400)];
    const ops = generateOpponents(s, seededRand(2), pool);
    expect(ops.map((o) => o.uid)).toEqual(['a', 'b', 'c']); // rangés du plus faible au plus fort
    expect(ops.every((o) => o.real)).toBe(true);
    expect(ops[0].heroes[0]).toMatchObject({ heroId: 'kaedra', level: 30, rank: 3, ascension: 2, awaken: 1 });
    expect(ops.some((o) => o.uid === 'd')).toBe(false); // Dora est en ligue Or
  });
  it('ligues : bornes et actualisation (une gratuite par jour, puis payante)', async () => {
    const { leagueBounds, refreshCost, refreshOpponents } = await import('../src/game/arena');
    const { ARENA } = await import('../src/data/arena');
    expect(leagueBounds(1000)).toEqual([0, 1150]);
    expect(leagueBounds(1200)).toEqual([1150, 1350]);
    expect(leagueBounds(2500)).toEqual([1900, null]);
    const s = createNewSave(T0);
    s.resources.diamonds = 8;
    expect(refreshCost(s)).toBe(0);
    expect(refreshOpponents(s, seededRand(1)).ok).toBe(true);
    expect(s.resources.diamonds).toBe(8);
    expect(refreshCost(s)).toBe(ARENA.refreshCost);
    expect(refreshOpponents(s, seededRand(2)).ok).toBe(true);
    expect(s.resources.diamonds).toBe(8 - ARENA.refreshCost);
    expect(refreshOpponents(s, seededRand(3)).ok).toBe(false); // plus assez de diamants
    expect(s.arena.opponents).toHaveLength(3);
  });
  it('ta défense publiée : ton équipe complète, ton nom', () => {
    const s = createNewSave(T0); s.profile.name = 'Sam';
    const d = defenseDoc(s, T0);
    expect(d.name).toBe('Sam');
    expect(d.team.length).toBeGreaterThan(0);
    expect(d.team.every((h) => !('heroUid' in h))).toBe(true);
    expect(d.power).toBe(playerTeamPower(s));
  });
  it('journal de défense : appliqué une seule fois au classement', () => {
    const s = createNewSave(T0);
    const log = [
      { id: '1', attacker: 'x', name: 'Bob', avatar: 'brann', power: 1, won: true, points: 6, at: T0 + 1 },
      { id: '2', attacker: 'y', name: 'Zoé', avatar: 'pia', power: 1, won: false, points: 3, at: T0 + 2 },
      { id: '3', attacker: 'z', name: 'Triche', avatar: 'pia', power: 1, won: false, points: 999, at: T0 + 3 },
    ];
    const r = applyDefenseLog(s, log);
    expect(r).toEqual({ won: 2, lost: 1, delta: -6 + 3 + 20 });
    expect(s.arena.rating).toBe(1000 + 17);
    expect(applyDefenseLog(s, log).delta).toBe(0);
    expect(s.arena.log).toHaveLength(3);
  });
});

describe('le joueur dans l’histoire', () => {
  it('« {nom} » est remplacé par le nom du joueur', () => {
    expect(withName('Mon épée est à toi, {nom}.', 'Sam')).toBe('Mon épée est à toi, Sam.');
  });
});

describe('anti-triche : défenses', () => {
  it('une vraie défense passe, une défense trafiquée est écartée', async () => {
    const { plausibleDefense } = await import('../src/game/arena');
    const s = createNewSave(T0);
    const real = { ...defenseDoc(s, T0), uid: 'x' };
    expect(plausibleDefense(real)).toBe(true);
    expect(plausibleDefense({ ...real, team: real.team.map((h) => ({ ...h, level: 999 })) })).toBe(false);
    expect(plausibleDefense({ ...real, team: real.team.map((h) => ({ ...h, gear: { flat: {}, pct: { hp: 5000, atk: 5000, def: 5000, spd: 0 }, lifesteal: 0, regen: 0, startTm: 0, sets: [] } })) })).toBe(false);
    // Un héros bien équipé (ensembles, liens) reste une défense valable.
    expect(plausibleDefense({ ...real, power: real.power * 2, team: real.team.map((h) => ({ ...h, gear: { flat: {}, pct: { hp: 60, atk: 60, def: 40, spd: 0 }, lifesteal: 0, regen: 0, startTm: 0, sets: [] } })) })).toBe(true);
    expect(plausibleDefense({ ...real, power: 10 })).toBe(false); // puissance annoncée bien plus basse que la vraie (appât)
  });
});
