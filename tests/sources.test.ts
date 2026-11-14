import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/save/schema';
import { RESOURCES, normalizeReward, type ResourceId } from '../src/data/resources';
import { ACTIVITIES, sourcesOf } from '../src/game/sources';
import { progressKey } from '../src/data/campaign';
import { UNLOCK_AT, type Feature } from '../src/game/unlocks';

const NOW = Date.UTC(2026, 10, 14, 12);
const ALL = Object.keys(RESOURCES) as ResourceId[];

describe('Où obtenir une ressource (v1.100.0)', () => {
  it('chaque ressource du jeu a au moins une source réelle, sauf l’ancienne monnaie convertie', () => {
    const s = createNewSave(NOW);
    for (const r of ALL) {
      const n = sourcesOf(s, r, NOW).length;
      if (r === 'shardPrimal' || r === 'crystals') expect(n, r).toBe(0); // anciennes monnaies retirées
      else expect(n, r).toBeGreaterThan(0);
    }
  });
  it('une source listée donne vraiment la ressource (tables du jeu)', () => {
    const s = createNewSave(NOW);
    for (const r of ALL) for (const src of sourcesOf(s, r, NOW)) expect(src.activity.rewards(s).some((x) => (normalizeReward(x)[r] ?? 0) > 0), `${r} ← ${src.activity.id}`).toBe(true);
  });
  it('un mode pas encore débloqué est verrouillé avec sa condition, puis s’ouvre', () => {
    const s = createNewSave(NOW);
    const tower = sourcesOf(s, 'shardEpic', NOW).find((x) => x.activity.id === 'tower')!;
    expect(tower.status).toBe('locked');
    expect(tower.reason).toContain(UNLOCK_AT.tower);
    for (const f of Object.keys(UNLOCK_AT) as Feature[]) s.progress.campaign[progressKey('normal', UNLOCK_AT[f])] = { clears: 1, stars: 3 } as never;
    expect(sourcesOf(s, 'shardEpic', NOW).find((x) => x.activity.id === 'tower')!.status).toBe('open');
    // le boss de clan demande en plus un clan
    const guild = sourcesOf(s, 'potionMinor', NOW).find((x) => x.activity.id === 'guild')!;
    expect(guild.status).toBe('locked');
    expect(guild.reason).toMatch(/clan/i);
  });
  it('la source principale passe en tête (Mine pour les diamants)', () => {
    const s = createNewSave(NOW);
    expect(sourcesOf(s, 'diamonds', NOW)[0].activity.id).toBe('mine');
  });
  it('identifiants d’activités uniques', () => {
    expect(new Set(ACTIVITIES.map((a) => a.id)).size).toBe(ACTIVITIES.length);
  });
});
