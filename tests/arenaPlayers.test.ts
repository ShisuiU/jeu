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
  it('avec un compte : les vraies équipes de défense de puissance proche', () => {
    const s = createNewSave(T0);
    const p = playerTeamPower(s);
    const def = (uid: string, name: string, ratio: number, refId: string) => ({ uid, name, avatar: refId, level: 5, rating: 1000, updatedAt: 1, power: Math.round(p * ratio),
      team: [{ refId, slot: 0, level: 30, rank: 3, ascension: 2, awaken: 1, skillLevels: {}, gear: undefined }] });
    const pool = [def('a', 'Alice', 0.72, 'kaedra'), def('b', 'Bilal', 0.98, 'solenne'), def('c', 'Chloé', 5, 'varkhaal')];
    const ops = generateOpponents(s, seededRand(2), pool);
    expect(ops[0]).toMatchObject({ name: 'Alice', real: true, uid: 'a' });
    expect(ops[1]).toMatchObject({ name: 'Bilal', real: true, uid: 'b' });
    expect(ops[0].heroes[0]).toMatchObject({ heroId: 'kaedra', level: 30, rank: 3, ascension: 2, awaken: 1 });
    expect(ops[2].real).toBeFalsy(); // Chloé est bien trop forte
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
