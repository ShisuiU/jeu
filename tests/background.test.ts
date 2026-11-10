import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { CHAPTERS } from '../src/data/campaign';
import { applyResets } from '../src/game/missions';
import { BG_RUN_MS, bgActive, canBackground, clearBackground, startBackground, stepBackground, stopBackground } from '../src/game/background';

const NOW = Date.parse('2026-11-10T12:00:00Z');
const fresh = () => { const s = createNewSave(NOW); s.time.highWater = NOW; applyResets(s, NOW); return s; };
const spec = { mode: 'campaign' as const, stageId: '1-1', difficulty: 'normal' as const };

describe('combats en arrière-plan (v1.68.5)', () => {
  it('seulement sur un niveau déjà gagné une fois (pas besoin de 3 étoiles)', () => {
    const s = fresh();
    expect(canBackground(s, spec).ok).toBe(false);
    s.progress.campaign['normal:1-1'] = { stars: 1, clears: 1 };
    expect(canBackground(s, spec).ok).toBe(true);
    expect(canBackground(s, { mode: 'arena', opponentId: 'x' }).ok).toBe(false);
  });

  it('un combat tout de suite, puis un toutes les 30 s, avec les vraies récompenses', () => {
    const s = fresh();
    s.progress.campaign['normal:1-1'] = { stars: 1, clears: 1 };
    const energy = s.energy.current, gold = s.resources.gold;
    expect(startBackground(s, spec, s.teams[0].id, 3, false, NOW).ok).toBe(true);
    expect(s.bgRun!.done).toBe(1);
    expect(s.energy.current).toBeLessThan(energy);
    expect(stepBackground(s, NOW + 10_000)).toBe(0); // pas encore l'heure
    expect(stepBackground(s, NOW + BG_RUN_MS)).toBe(1);
    expect(s.bgRun!.done).toBe(2);
    expect(canBackground(s, spec).ok).toBe(false); // une seule série à la fois
    stepBackground(s, NOW + 2 * BG_RUN_MS);
    expect(s.bgRun!.done).toBe(3);
    expect(s.bgRun!.endedReason).toBe('Série terminée.');
    expect(bgActive(s)).toBe(false);
    expect(s.resources.gold).toBeGreaterThan(gold);
    expect(s.bgRun!.reward.gold ?? 0).toBeGreaterThan(0);
    expect(s.missions.daily.counters.battleWin).toBe(s.bgRun!.wins);
    clearBackground(s);
    expect(s.bgRun).toBeNull();
  });

  it('rattrape les combats en retard au retour dans le jeu', () => {
    const s = fresh();
    s.progress.campaign['normal:1-1'] = { stars: 1, clears: 1 };
    startBackground(s, spec, s.teams[0].id, 6, false, NOW);
    stepBackground(s, NOW + 10 * 60_000);
    expect(s.bgRun!.done).toBe(6);
  });

  it('attend l’énergie au lieu de s’arrêter, et s’arrête à la demande', () => {
    const s = fresh();
    s.progress.campaign['normal:1-1'] = { stars: 1, clears: 1 };
    s.energy.current = 0;
    startBackground(s, spec, s.teams[0].id, 5, false, NOW);
    expect(s.bgRun!.done).toBe(0);
    expect(s.bgRun!.waiting).toBe(true);
    expect(bgActive(s)).toBe(true);
    stopBackground(s);
    expect(bgActive(s)).toBe(false);
  });

  it('peut s’arrêter à la première défaite', () => {
    const s = fresh();
    const hard = { mode: 'campaign' as const, stageId: '9-10', difficulty: 'normal' as const };
    for (const c of CHAPTERS) for (const st of c.stages) s.progress.campaign[`normal:${st.id}`] = { stars: 1, clears: 1 };
    s.energy.current = 999;
    startBackground(s, hard, s.teams[0].id, 5, true, NOW);
    expect(s.bgRun!.wins).toBe(0);
    expect(s.bgRun!.done).toBe(1);
    expect(s.bgRun!.endedReason).toMatch(/défaite/);
  });
});
