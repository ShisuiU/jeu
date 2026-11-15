import { describe, expect, it } from 'vitest';
import { createNewSave, createHeroInstance } from '../src/save/schema';
import { useGame } from '../src/state/store';

describe('plus de Résonance (v1.102.3)', () => {
  it('un nouveau héros arrive au niveau 1, même avec 5 héros de haut niveau', () => {
    const s = createNewSave(Date.now());
    while (s.heroes.length < 5) s.heroes.push(createHeroInstance('brann', Date.now()));
    for (const h of s.heroes) { h.level = 41; h.rank = 5; }
    useGame.getState().setSave(s);
    useGame.getState().mutate((d) => { d.heroes.push(createHeroInstance('corvin', Date.now())); });
    const save = useGame.getState().save!;
    expect(save.heroes[save.heroes.length - 1].level).toBe(1);
    expect(save.heroes.slice(0, 5).every((h) => h.level === 41)).toBe(true);
  });
});
