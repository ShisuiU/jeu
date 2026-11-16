import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../src/data/campaign';
import { isStageUnlocked, stageLockReason } from '../src/game/campaign';
import { progressKey } from '../src/data/campaign';
import { createNewSave } from '../src/save/schema';

// Retour d'un joueur : boss 2-10 battu en Expert, chapitre 3 Expert fermé, et le jeu disait « bats le boss du chapitre 2 ».
describe('raison du verrou d’un chapitre', () => {
  const win = (s: ReturnType<typeof createNewSave>, diff: string, id: string) => { s.progress.campaign[progressKey(diff as never, id)] = { clears: 1, stars: 3 } as never; };
  it('dit ce qui manque vraiment (chapitre en difficulté inférieure)', () => {
    const s = createNewSave();
    for (const c of CHAPTERS.slice(0, 2)) for (const d of ['normal', 'hard', 'expert']) win(s, d, c.stages[9].id);
    const st = CHAPTERS[2].stages[0];
    expect(isStageUnlocked(s, 'expert', st)).toBe(false);
    const r = stageLockReason(s, 'expert', st)!;
    expect(r).toContain('terminer le chapitre 3 en');
    expect(r).not.toContain('boss du chapitre 2');
    win(s, 'normal', CHAPTERS[2].stages[9].id); win(s, 'hard', CHAPTERS[2].stages[9].id);
    expect(isStageUnlocked(s, 'expert', st)).toBe(true);
    expect(stageLockReason(s, 'expert', st)).toBeNull();
  });
  it('boss précédent manquant : le dit', () => {
    const s = createNewSave();
    expect(stageLockReason(s, 'normal', CHAPTERS[1].stages[0])).toContain('boss du chapitre 1');
  });
});
