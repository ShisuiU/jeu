import { describe, expect, it } from 'vitest';
import { createBattle } from '../src/game/battle/engine';
import { chooseAction } from '../src/game/battle/ai';
import { HERO_BY_ID } from '../src/data/heroes';
import type { UnitSetup } from '../src/game/battle/types';

// CIBLE PRIORITAIRE EN COMBAT AUTO (v1.70.1)
const hero = (id: string, slot: number): UnitSetup => ({ kind: 'hero', refId: id, slot, level: 20, rank: 3, ascension: 0, awaken: 0, heroUid: id, skillLevels: Object.fromEntries(HERO_BY_ID[id].skills.map((s) => [s.id, 1])) });
const enemies: UnitSetup[][] = [[0, 1, 2].map((slot) => ({ kind: 'enemy', refId: 'hollow_soldier', slot, level: 10 }))];

describe('cible prioritaire en auto', () => {
  it('les héros visent l’ennemi désigné, sinon l’IA choisit seule', () => {
    const s = createBattle([hero('ivo', 0), hero('dov', 1)], enemies, { seed: 1 });
    const ally = s.units.find((u) => u.side === 'ally')!;
    const foes = s.units.filter((u) => u.side === 'enemy');
    const focus = foes[2];
    const a = chooseAction(s, ally, focus.id);
    expect(a.targetId).toBe(focus.id);
    focus.alive = false; // la cible est tombée : retour au choix normal
    const b = chooseAction(s, ally, focus.id);
    expect(b.targetId).not.toBe(focus.id);
  });
  it('la provocation reste plus forte que la cible désignée', () => {
    const s = createBattle([hero('ivo', 0)], enemies, { seed: 2 });
    const ally = s.units.find((u) => u.side === 'ally')!;
    const foes = s.units.filter((u) => u.side === 'enemy');
    ally.statuses.push({ status: 'taunt', turns: 2, sourceId: foes[0].id } as never); // le héros est provoqué par foes[0]
    expect(chooseAction(s, ally, foes[1].id).targetId).toBe(foes[0].id);
  });
});
