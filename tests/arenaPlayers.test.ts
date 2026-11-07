import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { generateOpponents, playerTeamPower } from '../src/game/arena';
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
  it('avec le classement : reflets de vrais joueurs de puissance proche, menés par leur avatar', () => {
    const s = createNewSave(T0);
    const p = playerTeamPower(s);
    const pool = [
      { uid: 'a', name: 'Alice', avatar: 'kaedra', power: Math.round(p * 0.72) },
      { uid: 'b', name: 'Bilal', avatar: 'solenne', power: Math.round(p * 0.98) },
      { uid: 'c', name: 'Chloé', avatar: 'varkhaal', power: Math.round(p * 5) }, // trop fort : ignoré
    ];
    const ops = generateOpponents(s, seededRand(2), pool);
    expect(ops[0]).toMatchObject({ name: 'Alice', real: true });
    expect(ops[1]).toMatchObject({ name: 'Bilal', real: true });
    expect(ops[0].heroes.some((h) => h.heroId === 'kaedra')).toBe(true);
    expect(ops[2].real).toBeFalsy();
  });
});

describe('le joueur dans l’histoire', () => {
  it('« {nom} » est remplacé par le nom du joueur', () => {
    expect(withName('Mon épée est à toi, {nom}.', 'Sam')).toBe('Mon épée est à toi, Sam.');
  });
});
