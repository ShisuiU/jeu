import { describe, expect, it } from 'vitest';
import { addEvent, currentDay, emptyDay, summarize, STATS_DEF_MAX } from '../src/game/telemetry';

const NOW = Date.UTC(2026, 10, 14, 12);

describe('statistiques anonymes (v1.101.0)', () => {
  it('compte combats, défaites par niveau, invocations, minutes', () => {
    let d = emptyDay('2026-11-14', '1.101.0');
    d = addEvent(d, { kind: 'battle', mode: 'campaign', won: false, stage: '3-4' });
    d = addEvent(d, { kind: 'battle', mode: 'campaign', won: false, stage: '3-4' });
    d = addEvent(d, { kind: 'battle', mode: 'campaign', won: true, stage: '3-4' });
    d = addEvent(d, { kind: 'battle', mode: 'tower', won: false, floor: 70 });
    d = addEvent(d, { kind: 'summon', n: 10 });
    d = addEvent(d, { kind: 'minute' });
    expect(d.bat).toEqual({ campaign_l: 2, campaign_w: 1, tower_l: 1 });
    expect(d.def).toEqual({ 'c3-4': 2, t70: 1 });
    expect(d.sum).toBe(10);
    expect(d.min).toBe(1);
  });
  it('aucune donnée personnelle, identifiant aléatoire qui change avec le jour', () => {
    const a = currentDay(null, NOW, 'v');
    expect(Object.keys(a).sort()).toEqual(['bat', 'ch', 'day', 'def', 'id', 'lvl', 'min', 'ses', 'sum', 'tower', 'v']);
    expect(a.id).toMatch(/^[a-z0-9]{12}$/);
    expect(currentDay(a, NOW + 3600_000, 'v').id).toBe(a.id); // même journée
    const b = currentDay(a, NOW + 86400_000, 'v');
    expect(b.day).not.toBe(a.day);
    expect(b.id).not.toBe(a.id); // journée suivante : impossible de relier les deux
  });
  it('les défaites restent bornées (40 lieux au plus)', () => {
    let d = emptyDay('2026-11-14', 'v');
    for (let i = 0; i < 60; i++) d = addEvent(d, { kind: 'battle', mode: 'tower', won: false, floor: i + 1 });
    expect(Object.keys(d.def).length).toBe(STATS_DEF_MAX);
  });
  it('la synthèse des modérateurs classe les lieux de blocage', () => {
    const s = summarize([
      { bat: { campaign_w: 3, campaign_l: 1 }, def: { 'c3-4': 1 }, sum: 5, ses: 1, min: 20, lvl: 12 },
      { bat: { campaign_l: 2 }, def: { 'c3-4': 2, t70: 1 }, sum: 0, ses: 2, min: 40, lvl: 45 },
    ]);
    expect(s.days).toBe(2);
    expect(s.minutesAvg).toBe(30);
    expect(s.stuck[0]).toEqual({ where: 'Campagne 3-4', count: 3 });
    expect(s.modes[0]).toEqual({ mode: 'campaign', won: 3, lost: 3 });
  });
});
