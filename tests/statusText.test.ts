import { describe, expect, it } from 'vitest';
import { groupStatuses, statusDescription, statusValueText } from '../src/game/battle/statusText';
import type { StatusInst } from '../src/game/battle/types';

const st = (status: StatusInst['status'], value = 0, turns = 2): StatusInst => ({ uid: Math.random(), status, value, turns, sourceId: 'x', appliedAt: 0 });

describe('Effets en clair', () => {
  it('valeurs affichées', () => {
    const g = groupStatuses([st('atkUp', 0.3), st('poison'), st('poison', 0, 3), st('shield', 800), st('shield', 450), st('defDown', 0.4)]);
    const by = Object.fromEntries(g.map((x) => [x.id, x]));
    expect(statusValueText(by.atkUp, false)).toBe('+30 %');
    expect(statusValueText(by.poison, false)).toBe('−10 %');
    expect(by.poison.turns).toBe(3);
    expect(statusValueText(by.poison, true)).toBe('−5 %'); // moitié sur un boss
    expect(statusValueText(by.shield, false)).toBe('1,3k');
    expect(statusValueText(by.defDown, false)).toBe('−40 %');
    expect(statusDescription(by.poison, false)).toContain('2 doses');
  });
});
