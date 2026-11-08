import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { cleanName, nameError, needsName } from '../src/game/profile';

describe('nom du joueur obligatoire', () => {
  it('refuse les noms par défaut, trop courts ou bizarres', () => {
    for (const n of ['', 'ab', 'Lien', ' lien ', 'Héritier', 'HERITIER', 'Joueur', '<script>', '  ', 'x'.repeat(19)]) expect(nameError(n), n).not.toBeNull();
  });
  it('accepte un vrai nom', () => {
    for (const n of ['Sam', 'Élise', "Jean-Luc", 'K.R. 2', 'Ysé d’Or']) expect(nameError(n), n).toBeNull();
    expect(cleanName('  Jean   Luc ')).toBe('Jean Luc');
  });
  it('une nouvelle partie doit choisir son nom', () => {
    const s = createNewSave(Date.now());
    expect(needsName(s)).toBe(true);
    s.profile.name = 'Sam';
    expect(needsName(s)).toBe(false);
  });
});
