import { describe, expect, it } from 'vitest';
import { hasProfanity, maskProfanity } from '../src/game/moderation';
import { nameError } from '../src/game/profile';

describe('modération', () => {
  it('repère les insultes, même déguisées', () => {
    for (const t of ['connard', 'C0NNARD', 'Sal0pe', 'fils de pute', 'FDP', 'pd', 'Enculé', 'nique ta mère', 'f.u.c.k you', 'Heil Hitler']) expect(hasProfanity(t), t).toBe(true);
  });
  it('laisse passer les mots normaux', () => {
    for (const t of ['Conan', 'Constance', 'Montenegro', 'Pedro', 'piédestal', 'Scunthorpe', 'Bonjour à tous', 'Les Veilleurs', 'contre', 'Shisui', 'Merci', 'Marcel']) expect(hasProfanity(t), t).toBe(false);
  });
  it('masque seulement les mots insultants', () => {
    expect(maskProfanity('salut bande de connards !')).toBe('salut bande de ****** !');
    expect(maskProfanity('On attaque le boss ce soir')).toBe('On attaque le boss ce soir');
  });
  it('noms de joueur insultants refusés', () => {
    expect(nameError('Connard')).not.toBeNull();
    expect(nameError('Shisui')).toBeNull();
  });
});
