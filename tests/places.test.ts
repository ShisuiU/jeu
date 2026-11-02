import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { canImprove } from '../src/game/upgrade';

describe('Sanctuaire : signal « amélioration possible »', () => {
  it('rien à faire avec une partie neuve sans ressources', () => {
    const s = createNewSave(1000);
    for (const k of Object.keys(s.resources) as (keyof typeof s.resources)[]) s.resources[k] = 0;
    expect(s.heroes.some((h) => canImprove(s, h))).toBe(false);
  });
  it('signale une compétence améliorable quand les ressources sont là', () => {
    const s = createNewSave(1000);
    for (const k of Object.keys(s.resources) as (keyof typeof s.resources)[]) s.resources[k] = 1_000_000;
    expect(s.heroes.some((h) => canImprove(s, h))).toBe(true);
  });
});
