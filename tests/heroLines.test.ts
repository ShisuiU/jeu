import { describe, expect, it } from 'vitest';
import { HEROES } from '../src/data/heroes';
import { HERO_LINES, heroLine } from '../src/data/heroLines';

describe('répliques des héros', () => {
  it('chaque héros a 3 répliques courtes, sans tiret au milieu des phrases', () => {
    for (const h of HEROES) {
      const lines = HERO_LINES[h.id];
      expect(lines, h.id).toHaveLength(3);
      for (const l of lines) {
        expect(l.length, `${h.id}: ${l}`).toBeLessThanOrEqual(90);
        expect(l, h.id).not.toMatch(/—/);
      }
    }
    expect(Object.keys(HERO_LINES).sort()).toEqual(HEROES.map((h) => h.id).sort());
  });
  it('la citation passe en premier (sans guillemets), puis les répliques en boucle', () => {
    const a = HEROES.find((h) => h.id === 'aldric')!;
    expect(heroLine('aldric', a.quote, 0)).toBe('Derrière moi. Toujours derrière moi.');
    expect(heroLine('aldric', a.quote, 1)).toBe(HERO_LINES.aldric[0]);
    expect(heroLine('aldric', a.quote, 4)).toBe(heroLine('aldric', a.quote, 0));
    const m = HEROES.find((h) => h.id === 'maelis')!;
    expect(heroLine('maelis', m.quote, 0)).toBe(m.quote); // citation sans guillemets fermants : gardée telle quelle
  });
});
